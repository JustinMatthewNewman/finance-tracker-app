"use client";

import { useCallback, useState } from "react";
import { QueryFetchPolicy } from "firebase/data-connect";
import { useFamilyMembers } from "./useFamilyMembers";
import {
  listMyClassifiableTransactions,
  setTransactionInternalFlags,
} from "@/src/dataconnect-generated";
import type {
  ListMyClassifiableTransactionsData,
  ListMyClassifiableTransactionsVariables,
} from "@/src/dataconnect-generated";
import { fetchAllPages } from "@/lib/dataconnectPagination";
import { nameTokens, reclassify, type ReclassifiableRow } from "@/lib/internalTransfers";

// Re-checking which imported rows are internal transfers.
//
// WHY THIS IS A SEPARATE ACTION rather than something settled at import. Both
// flags are decided from the statement memo, and the right answer can change
// after the row is written without the row changing at all:
//
//   - A row imported before the columns existed has NEITHER flag set. That is
//     not hypothetical: it was 592 rows out of 1952 in a real household, and it
//     made the "ignore internal transfers" toggle look completely broken —
//     the toggle worked, there was simply nothing flagged for it to hide.
//   - A Zelle payment to Sarah only becomes internal-to-family once Sarah is in
//     the roster, and stops being internal if she leaves.
//   - The classifier itself improves.
//
// WHY IT CAN WORK AT ALL on rows whose memo is long gone: the importer keeps the
// counterparty pulled out of the memo, and extractMerchant deliberately leaves
// the "ONLINE TRANSFER" prefix intact because on those rows the prefix IS the
// information. So `merchant` and `method` are enough. See
// lib/internalTransfers.ts.
//
// SCOPED TO THE CALLER'S OWN ROWS. The read is deliberately not widened to the
// household (see ListMyClassifiableTransactions) because this decides what to
// WRITE, and every mutation below is owner-only — a housemate's row would come
// back only to be refused at a `@check`.

/** Writes in flight at once, matching the importer. */
const CONCURRENCY = 6;

export interface SyncOutcome {
  /** Rows examined. */
  scanned: number;
  /** Rows newly flagged as between the account holder's own accounts. */
  flaggedToUser: number;
  /** Rows newly flagged as between two people in the household. */
  flaggedToFamily: number;
  /** Rows that stopped being internal — a member left, or a name changed. */
  unflagged: number;
  failures: number;
}

export function useInternalTransferSync() {
  // The roster is what makes "internal to the family" answerable: a transfer is
  // internal only if it names somebody in it. This hook is called from Settings,
  // which owns no other useFamilyMembers() — see the once-per-page caveat on it.
  const { familyMembers } = useFamilyMembers();

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [outcome, setOutcome] = useState<SyncOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resync = useCallback(async (): Promise<SyncOutcome> => {
    setRunning(true);
    setError(null);
    setOutcome(null);
    try {
      const rows = await fetchAllPages<
        ListMyClassifiableTransactionsVariables,
        ListMyClassifiableTransactionsData["transactions"][number]
      >(
        (vars) =>
          listMyClassifiableTransactions(vars, {
            fetchPolicy: QueryFetchPolicy.SERVER_ONLY,
          }).then((r) => r.data.transactions),
        {}
      );

      const candidates: ReclassifiableRow[] = rows.map((row) => ({
        id: row.id,
        merchant: row.merchant ?? null,
        method: row.method ?? null,
        isInternalToUser: row.isInternalToUser ?? false,
        isInternalToFamily: row.isInternalToFamily ?? false,
      }));

      // Every name in the household, the viewer's own included — money swept
      // into an account named after its owner is still their own transfer, and
      // the classifier resolves that case by checking the own-account prefix
      // first. See classifyInternalTransfer.
      const tokens = nameTokens(familyMembers.map((m) => m.name));

      // The decision is pure and lives in lib/internalTransfers.ts, which only
      // returns rows that would actually CHANGE — so a second run writes nothing.
      const changes = reclassify(candidates, tokens);

      const result: SyncOutcome = {
        scanned: candidates.length,
        flaggedToUser: 0,
        flaggedToFamily: 0,
        unflagged: 0,
        failures: 0,
      };
      setProgress({ done: 0, total: changes.length });

      let cursor = 0;
      let done = 0;
      const worker = async () => {
        while (true) {
          const i = cursor++;
          if (i >= changes.length) return;
          const change = changes[i];
          try {
            await setTransactionInternalFlags({
              transactionId: change.id,
              isInternalToUser: change.to.isInternalToUser,
              isInternalToFamily: change.to.isInternalToFamily,
            });
            if (change.to.isInternalToUser && !change.from.isInternalToUser) result.flaggedToUser++;
            else if (change.to.isInternalToFamily && !change.from.isInternalToFamily)
              result.flaggedToFamily++;
            else if (!change.to.isInternalToUser && !change.to.isInternalToFamily) result.unflagged++;
          } catch {
            // Counted rather than thrown, for the same reason the importer does
            // it: one bad row out of six hundred should not cost the other five
            // hundred and ninety-nine, and re-running is safe because reclassify
            // reports only what still differs.
            result.failures++;
          } finally {
            done++;
            setProgress({ done, total: changes.length });
          }
        }
      };

      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, changes.length) }, worker));

      setOutcome(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not re-check transfers";
      setError(message);
      throw err;
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }, [familyMembers]);

  return { resync, running, progress, outcome, error };
}
