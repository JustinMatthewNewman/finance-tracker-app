"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QueryFetchPolicy } from "firebase/data-connect";
import { useAuth } from "./useAuth";
import { useUserSettings } from "@/context/UserSettingsContext";
import { useCategories } from "@/context/CategoriesContext";
import {
  createStatementImport,
  createTransaction,
  deleteStatementImport,
  deleteStatementImportRows,
  finalizeStatementImport,
  listMyImportedInRange,
  listMyImportedKeys,
  listMyStatementImports,
} from "@/src/dataconnect-generated";
import type {
  CreateTransactionVariables,
  ListMyImportedInRangeData,
  ListMyImportedInRangeVariables,
  ListMyImportedKeysData,
  ListMyImportedKeysVariables,
  ListMyStatementImportsData,
  ListMyStatementImportsVariables,
} from "@/src/dataconnect-generated";
import { fetchAllPages } from "@/lib/dataconnectPagination";
import { isInternal } from "@/lib/internalTransfers";
import {
  reconcileStatement,
  SETTLE_WINDOW_DAYS,
  type ExistingImportedRow,
  type Match,
} from "@/lib/importReconcile";
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "@/lib/money";
import {
  importKeyFor,
  parseWellsFargoCsv,
  statementContentKey,
  type ParsedStatement,
  type ParsedStatementRow,
} from "@/lib/wellsFargoCsv";

// The write half of the statement importer. lib/wellsFargoCsv.ts is the read
// half and knows nothing about Data Connect; this knows nothing about CSV.
//
// AN UPLOAD IS A ROW, NOT AN EVENT. Every import writes a StatementImport
// header first and stamps every transaction with its id, so "the rows that came
// from that file" is a foreign key rather than something reconstructed from
// dates and a source string. That is what makes removing an upload one filter
// (see removeImport below) instead of a guess.
//
// TWO KINDS OF DUPLICATE, CHECKED IN TWO PLACES, because they are two different
// questions:
//
//   the same FILE again — StatementImport.contentKey, a digest of the text.
//                         Caught in planImport before anything is written, so
//                         the dialog can say "you uploaded this on 14 Sep".
//   the same LINE again — Transaction.importKey, per row. This is the usual
//                         case and the file is NOT the same: people re-download
//                         a wider range that overlaps the last one.
//
// Both columns are @unique, and that is what actually holds the invariant. The
// reads below are what turn the common case into a count instead of an error;
// two imports racing each other both see a clean slate, and the constraint is
// what stops the loser doubling a month of somebody's spending.
//
// WHY ROW BY ROW rather than one batch insert: the generated SDK cannot send a
// `_Data` list variable, so `transaction_insertMany` is unreachable from the
// client. See the "Statement import" section in mutations.gql — the short
// version is that idempotency buys what atomicity would have.

/** How many inserts are in flight at once. */
const CONCURRENCY = 6;

/** Keys per query variable or per delete. Keeps one payload bounded. */
const CHUNK = 200;

export interface StatementImportRecord {
  id: string;
  accountLabel: string;
  filename: string;
  contentKey: string | null;
  rowCount: number;
  importedRowCount: number;
  skippedRowCount: number;
  earliestOccurredOn: string | null;
  latestOccurredOn: string | null;
  createdAt: string;
  familyMemberId: string;
  familyMemberName: string;
  ownerUserId: string;
  ownerUsername: string;
  /**
   * Whether the signed-in account may remove this upload.
   *
   * The list is household-wide (see ListMyStatementImports) but both delete
   * mutations are owner-only, so a housemate's upload is visible and must not
   * be offered a Remove button — it would fail at a `@check` they never see.
   * Same rule as Transaction.isMine.
   */
  isMine: boolean;
}

export interface ImportPlan {
  /** Everything the file parsed to, in file order. */
  parsed: ParsedStatement;
  /**
   * Rows that would be written if nothing further is excluded — the reconciler's
   * `fresh`, plus every probable duplicate, because those are imported unless a
   * person says otherwise. Use `rowsToWrite()` to apply their decision.
   */
  toImport: ParsedStatementRow[];
  /** Keys parallel to `toImport`. */
  keys: string[];
  /**
   * Rows certainly already in the ledger: the same statement line, or the same
   * bank reference. Skipped without asking.
   */
  certainDuplicates: Match[];
  /**
   * Rows that RESEMBLE something already imported — a pending charge that has
   * since settled under a different memo, most likely. Included in `toImport`
   * on purpose: this tier cannot tell that from a second identical purchase, and
   * silently dropping a real transaction is the worse mistake. The dialog lists
   * them and the person ticks any that really are duplicates.
   */
  probableDuplicates: Match[];
  /** Rows skipped because they move money between the person's own accounts. */
  excludedTransfers: ParsedStatementRow[];
  /** Digest of the file, for StatementImport.contentKey. */
  contentKey: string;
  /** The earlier upload of this exact file, if there is one. */
  duplicateOf: StatementImportRecord | null;
  accountLabel: string;
  filename: string;
}

export interface ImportOutcome {
  statementImportId: string;
  imported: number;
  alreadyImported: number;
  /** Probable duplicates the person chose to skip. */
  skippedAsDuplicate: number;
  excludedTransfers: number;
  unreadable: number;
  /** Per-row failures. Empty on a clean import. */
  failures: { row: ParsedStatementRow; message: string }[];
}

export interface PlanOptions {
  accountLabel: string;
  filename: string;
  /**
   * Everybody in the household, so a Zelle payment to one of them is recognized
   * as internal at import time rather than only on a later re-check.
   *
   * Passed in rather than read here: this hook deliberately owns no
   * useFamilyMembers() of its own — that hook holds state in useState, so a
   * second instance drifts from the page's (see its own note).
   */
  householdNames?: readonly string[];
  /** Guess a category per row from its merchant. */
  categorize: boolean;
  /** Leave transfers between the person's own Wells Fargo accounts out. */
  excludeInternalTransfers: boolean;
}

function toRecord(
  row: ListMyStatementImportsData["statementImports"][number],
  myUserId: string | null
): StatementImportRecord {
  return {
    id: row.id,
    accountLabel: row.accountLabel,
    filename: row.filename,
    contentKey: row.contentKey ?? null,
    rowCount: row.rowCount,
    importedRowCount: row.importedRowCount,
    skippedRowCount: row.skippedRowCount,
    earliestOccurredOn: row.earliestOccurredOn ?? null,
    latestOccurredOn: row.latestOccurredOn ?? null,
    createdAt: row.createdAt,
    familyMemberId: row.familyMember.id,
    familyMemberName: row.familyMember.name,
    ownerUserId: row.user.id,
    ownerUsername: row.user.username,
    isMine: !!myUserId && row.user.id === myUserId,
  };
}

export function useTransactionImport() {
  const { user } = useAuth();
  const { userId, currencyCode } = useUserSettings();
  const { ensureCategoriesExist } = useCategories();

  const [imports, setImports] = useState<StatementImportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Set while an import is running, so a second click cannot start a second
  // pass over the same file. A ref rather than state because the guard has to be
  // read and set within one tick, before React has re-rendered.
  const running = useRef(false);

  const currency: CurrencyCode = isCurrencyCode(currencyCode) ? currencyCode : DEFAULT_CURRENCY;

  const refetchImports = useCallback(async () => {
    if (!user?.uid) {
      setImports([]);
      return [];
    }
    setLoading(true);
    try {
      // SERVER_ONLY for the reason given on every other read in this app: the
      // generated hooks' default cache is never invalidated by a mutation, so a
      // just-finished import would not appear in this list until a reload.
      const rows = await fetchAllPages<
        ListMyStatementImportsVariables,
        ListMyStatementImportsData["statementImports"][number]
      >(
        (vars) =>
          listMyStatementImports(vars, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY }).then(
            (r) => r.data.statementImports
          ),
        {}
      );
      const records = rows.map((row) => toRecord(row, userId));
      setImports(records);
      return records;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load previous imports");
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.uid, userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetchImports();
  }, [refetchImports]);

  /**
   * Reads a file and works out what importing it would do, WITHOUT writing
   * anything.
   *
   * Split from the write so the dialog can show the whole plan — how many rows,
   * how many are already there, whether this exact file has been uploaded
   * before, and what each line maps to — and so "nothing to do" is answerable
   * before a single mutation is sent.
   */
  const planImport = useCallback(
    async (text: string, opts: PlanOptions): Promise<ImportPlan> => {
      if (!userId) throw new Error("User profile not found");

      const parsed = parseWellsFargoCsv(text, {
        currency,
        categorize: opts.categorize,
        householdNames: opts.householdNames ?? [],
      });
      const contentKey = await statementContentKey(userId, text);

      // Read the list fresh rather than trusting what is in state: the dialog may
      // have been open since before another tab's import.
      const known = await refetchImports();
      const duplicateOf = known.find((i) => i.contentKey === contentKey && i.isMine) ?? null;

      const candidates = opts.excludeInternalTransfers
        ? parsed.rows.filter((r) => !isInternal(r))
        : parsed.rows;
      const excludedTransfers = opts.excludeInternalTransfers
        ? parsed.rows.filter((r) => isInternal(r))
        : [];

      // ── What is already here ──
      // Two reads, because there are two different questions (see the header).
      // Both are bounded: the keys by chunk, the rows by the file's own date
      // range widened by the settle window, so a pending row whose settled
      // counterpart sits just outside the file is still in scope.
      const allKeys = candidates.map((row) => importKeyFor(userId, opts.accountLabel, row.fingerprint));

      const existingByKey = new Map<string, ExistingImportedRow>();
      for (let i = 0; i < allKeys.length; i += CHUNK) {
        const rows = await fetchAllPages<
          ListMyImportedKeysVariables,
          ListMyImportedKeysData["transactions"][number]
        >(
          (vars) =>
            listMyImportedKeys(vars, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY }).then(
              (r) => r.data.transactions
            ),
          { importKeys: allKeys.slice(i, i + CHUNK) }
        );
        for (const row of rows) {
          if (!row.importKey) continue;
          // Only the key matters from this read; the range read below supplies
          // the full rows. Recorded here so a key hit is never missed just
          // because its row fell outside the range — a statement line can be
          // dated outside the file's own span if the file is odd.
          existingByKey.set(row.importKey, {
            id: row.id,
            importKey: row.importKey,
            importRef: null,
            occurredOn: "",
            amountMinor: 0,
            direction: "",
            merchant: null,
          });
        }
      }

      const days = candidates.map((r) => r.occurredOn).sort();
      const existingInRange: ExistingImportedRow[] = [];
      if (days.length) {
        const shift = (day: string, by: number) => {
          const [y, m, d] = day.split("-").map(Number);
          const at = new Date(Date.UTC(y, m - 1, d + by));
          return at.toISOString().slice(0, 10);
        };
        const rows = await fetchAllPages<
          ListMyImportedInRangeVariables,
          ListMyImportedInRangeData["transactions"][number]
        >(
          (vars) =>
            listMyImportedInRange(vars, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY }).then(
              (r) => r.data.transactions
            ),
          {
            startDate: shift(days[0], -SETTLE_WINDOW_DAYS),
            endDate: shift(days[days.length - 1], SETTLE_WINDOW_DAYS),
          }
        );
        for (const row of rows) {
          existingInRange.push({
            id: row.id,
            importKey: row.importKey ?? null,
            importRef: row.importRef ?? null,
            occurredOn: row.occurredOn,
            amountMinor: row.amountMinor,
            direction: row.direction,
            merchant: row.merchant ?? null,
          });
        }
      }

      // Union the two reads by row id, so a row seen by both is one row. The
      // range read has the full fields, so it wins.
      const seenIds = new Set(existingInRange.map((r) => r.id));
      const existing = [
        ...existingInRange,
        ...[...existingByKey.values()].filter((r) => !seenIds.has(r.id)),
      ];

      // The decision itself is pure and lives in lib/importReconcile.ts, so what
      // a re-upload does is testable without a database. See that file for the
      // three tiers and why only the first two skip anything.
      const { certain, probable, fresh, freshKeys } = reconcileStatement(
        candidates,
        allKeys,
        existing
      );

      // Probable duplicates are INCLUDED here, at the end so they group together
      // in the review table. Nothing about tier 3 is certain enough to drop a row
      // on its own — see ImportPlan.probableDuplicates.
      const toImport = [...fresh, ...probable.map((m) => m.row)];
      const keys = [...freshKeys, ...probable.map((m) => m.key)];

      return {
        parsed,
        toImport,
        keys,
        certainDuplicates: certain,
        probableDuplicates: probable,
        excludedTransfers,
        contentKey,
        duplicateOf,
        accountLabel: opts.accountLabel,
        filename: opts.filename,
      };
    },
    [userId, currency, refetchImports]
  );

  /**
   * Writes a plan: the header record, then its rows, then the counts.
   *
   * Every row is a guarded CreateTransaction, so importing against somebody
   * else's household member is refused at the same `@check` a hand-typed row
   * would hit. There is no widened import path.
   *
   * A row that fails is recorded and the rest continue. One bad line out of nine
   * hundred should not cost the other eight hundred and ninety-nine, and because
   * the write is idempotent the honest response to any failure is to run the
   * same file again.
   */
  const runImport = useCallback(
    async (
      familyMemberId: string,
      plan: ImportPlan,
      /**
       * importKeys of probable duplicates the person ticked as "already have
       * this". Everything not in here is written, which is why an empty set is
       * the safe default rather than a lazy one.
       */
      skipKeys: ReadonlySet<string> = new Set()
    ): Promise<ImportOutcome> => {
      if (!userId) throw new Error("User profile not found");
      if (running.current) throw new Error("An import is already running");
      running.current = true;
      setError(null);

      const writing = plan.toImport
        .map((row, i) => ({ row, key: plan.keys[i] }))
        .filter((entry) => !skipKeys.has(entry.key));
      setProgress({ done: 0, total: writing.length });

      const failures: ImportOutcome["failures"] = [];
      // Minted here because every row below has to reference it, and Data
      // Connect cannot reference an earlier field's result within one document —
      // the same reason CreateUserFromGoogle takes its ids as variables.
      const statementImportId = crypto.randomUUID();

      try {
        const createdAt = new Date().toISOString();

        await createStatementImport({
          statementImportId,
          userId,
          familyMemberId,
          accountLabel: plan.accountLabel,
          filename: plan.filename,
          // NULL WHEN THIS EXACT FILE HAS BEEN UPLOADED BEFORE, and that is not
          // a way around the constraint — it is what makes the constraint's
          // first-wins meaning correct.
          //
          // contentKey is @unique, so a second upload of the same file cannot
          // also claim the digest. But a second upload is a legitimate thing to
          // want: the first one may have failed part way, and re-running it is
          // the documented fix. Sending the digest again would refuse the header
          // row and strand the retry — which it did, until this. The earlier
          // upload keeps the digest and stays the row the dialog points at when
          // it says "you uploaded this on 14 Sep"; this one is a real upload
          // event that happens not to be the canonical holder of that file.
          contentKey: plan.duplicateOf ? undefined : plan.contentKey,
          rowCount: plan.parsed.rows.length,
          createdAt,
        });

        // Transaction.categoryName is a foreign key into a table keyed on name,
        // so every guessed category has to exist before any row references it —
        // the same two-step useTransactions.createTransaction does, hoisted out
        // of the loop so it costs one round trip for the file rather than one per
        // row. ensureCategoriesExist only creates what is genuinely missing, so
        // this cannot overwrite an existing category's color or kind.
        const categoryNames = writing
          .map((e) => e.row.categoryName)
          .filter((name): name is string => !!name);
        if (categoryNames.length) await ensureCategoriesExist(categoryNames);

        let done = 0;
        let written = 0;

        // A fixed pool of workers pulling from a shared cursor, rather than
        // Promise.all over the whole file: a thousand simultaneous mutations is
        // a thousand simultaneous connections, and the browser or the service
        // starts refusing them in ways indistinguishable from a real error.
        let cursor = 0;
        const worker = async () => {
          while (true) {
            const i = cursor++;
            if (i >= writing.length) return;
            const { row, key } = writing[i];
            try {
              await createTransaction({
                userId,
                familyMemberId,
                amountMinor: row.amountMinor,
                direction: row.direction,
                occurredOn: row.occurredOn,
                createdAt,
                // The counterparty, not the raw memo — see the header of
                // lib/wellsFargoCsv.ts. `description` is deliberately left unset
                // so the ledger shows the merchant and a person can add a note of
                // their own later.
                merchant: row.merchant,
                method: row.method ?? undefined,
                categoryName: row.categoryName ?? undefined,
                // An import is an actual, not a projection. Both spelled out
                // rather than leaning on statusForSource, because getting this
                // pair wrong is the difference between money the household has
                // and money it merely expects.
                source: "IMPORT",
                status: "POSTED",
                importKey: key,
                // The bank's own reference where the memo had one. This is what
                // lets the NEXT upload recognize this row even if its memo is
                // rewritten when it settles — see Transaction.importRef.
                importRef: row.statementRef ?? undefined,
                // Stored now because the memo they were decided from is not
                // kept, so the question could never be asked again. This is what
                // makes the "count internal transfers" toggle work after the
                // fact rather than only at import time.
                isInternalToUser: row.isInternalToUser,
                isInternalToFamily: row.isInternalToFamily,
                statementImportId,
              } as CreateTransactionVariables);
              written++;
            } catch (err) {
              failures.push({
                row,
                message: err instanceof Error ? err.message : "Could not be saved",
              });
            } finally {
              done++;
              setProgress({ done, total: writing.length });
            }
          }
        };

        await Promise.all(Array.from({ length: Math.min(CONCURRENCY, writing.length) }, worker));

        // The range that actually landed, computed from the rows rather than
        // from the file: a file whose every line was skipped or unreadable has
        // no range, and claiming one would put a date span on an empty upload.
        const days = writing.map((e) => e.row.occurredOn).sort();
        await finalizeStatementImport({
          statementImportId,
          importedRowCount: written,
          skippedRowCount:
            plan.certainDuplicates.length +
            skipKeys.size +
            plan.excludedTransfers.length +
            plan.parsed.skipped.length,
          earliestOccurredOn: days.length ? days[0] : undefined,
          latestOccurredOn: days.length ? days[days.length - 1] : undefined,
        });

        await refetchImports();

        return {
          statementImportId,
          imported: written,
          alreadyImported: plan.certainDuplicates.length,
          skippedAsDuplicate: skipKeys.size,
          excludedTransfers: plan.excludedTransfers.length,
          unreadable: plan.parsed.skipped.length,
          failures,
        };
      } finally {
        running.current = false;
        setProgress(null);
      }
    },
    [userId, ensureCategoriesExist, refetchImports]
  );

  /**
   * Removes an upload and everything it wrote.
   *
   * The rows first, then the header — the foreign key is nullable, so Data
   * Connect makes it ON DELETE SET NULL and deleting the header first would
   * strand the transactions with nothing pointing at them. See the note on
   * StatementImport in schema.gql.
   */
  const removeImport = useCallback(
    async (statementImportId: string) => {
      setError(null);
      await deleteStatementImportRows({ statementImportId });
      await deleteStatementImport({ statementImportId });
      await refetchImports();
    },
    [refetchImports]
  );

  return {
    imports,
    loading,
    progress,
    error,
    setError,
    currency,
    refetchImports,
    planImport,
    runImport,
    removeImport,
  };
}
