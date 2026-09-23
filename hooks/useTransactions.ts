"use client";

import { useCallback, useEffect, useState } from "react";
import { QueryFetchPolicy } from "firebase/data-connect";
import { useAuth } from "./useAuth";
import { useUserSettings } from "@/context/UserSettingsContext";
import { useCategories } from "@/context/CategoriesContext";
import {
  useCreateTransaction,
  useUpdateTransaction,
  useUpdateTransactionClearCategory,
  useDeleteTransaction,
} from "@/src/dataconnect-generated/react";
import { listTransactionsByFamilyMember } from "@/src/dataconnect-generated";
import type {
  ListTransactionsByFamilyMemberData,
  ListTransactionsByFamilyMemberVariables,
  CreateTransactionVariables,
  UpdateTransactionVariables,
  UpdateTransactionClearCategoryVariables,
  DeleteTransactionVariables,
} from "@/src/dataconnect-generated";
import { fetchAllPages } from "@/lib/dataconnectPagination";
import { normalizeHexColor } from "@/lib/entityColor";
import { type Direction, type Minor, normalizeDirection } from "@/lib/money";
import {
  type TransactionSource,
  type TransactionStatus,
  statusForSource,
  toTransactionSource,
  toTransactionStatus,
} from "@/lib/transactionKind";

// Re-exported so the many call sites that already import these from here
// keep working; lib/transactionKind.ts is where they are defined and where
// the projected-vs-actual rules live.
export type { TransactionSource, TransactionStatus } from "@/lib/transactionKind";

export interface TransactionCategoryRef {
  id: string;
  name: string;
  kind: Direction;
  /** Canonical "#rrggbb", or null when no color has been chosen. */
  color: string | null;
}

export interface Transaction {
  id: string;
  amountMinor: Minor;
  direction: Direction;
  /** "yyyy-mm-dd" — a calendar day, not an instant. See lib/monthRange.ts. */
  occurredOn: string;
  description: string | null;
  merchant: string | null;
  method: string | null;
  recurrence: string | null;
  /** How long a recurring projection keeps appearing; null = indefinitely. */
  recurrenceEndsOn: string | null;
  /**
   * Unique per rendered occurrence, for React keys and per-row UI state.
   *
   * Equal to `id` for an ordinary row. A recurring projection is expanded
   * into one entry per matching day (see lib/recurrence.ts) and every one of
   * those carries the SAME `id` — the rule's real row — so `id` alone would
   * collide across a month's worth of paycheques.
   *
   * `id` deliberately stays the real row id on every occurrence, so a
   * mutation called with it always addresses something that exists. Use this
   * only for rendering.
   */
  occurrenceKey: string;
  /**
   * For an expanded occurrence, the rule row's OWN first-occurrence date;
   * null for an ordinary row.
   *
   * Expansion overwrites `occurredOn` with the occurrence's day, because
   * that is what every calendar bucket, date column and sort needs and
   * getting it wrong there is a whole screen of wrong dates. The cost is
   * that `occurredOn` is then no longer what the row stores — so anything
   * about to WRITE the row has to put the real one back. Use ruleRowOf()
   * rather than doing that by hand.
   */
  seriesStartsOn: string | null;
  source: TransactionSource;
  status: TransactionStatus;
  createdAt: string;
  familyMemberId: string;
  familyMemberName: string;
  category: TransactionCategoryRef | null;
  /** The account that recorded this row. */
  ownerUserId: string;
  ownerUsername: string;
  /**
   * Whether the signed-in account may change this row.
   *
   * Household reads are wider than household writes (see the visibility note
   * at the top of queries.gql), so these lists include rows belonging to a
   * housemate. Every control that edits, deletes or marks a row as received
   * has to be gated on this, or it will fail at a `@check` the person never
   * sees. Defaults to false while the caller's own id is still loading.
   */
  isMine: boolean;
}

export interface TransactionInput {
  amountMinor: Minor;
  direction: Direction;
  occurredOn: string;
  description?: string | null;
  merchant?: string | null;
  method?: string | null;
  recurrence?: string | null;
  recurrenceEndsOn?: string | null;
  source?: TransactionSource;
  status?: TransactionStatus;
  /** Category name, or null/"" for uncategorized. Created if it doesn't exist. */
  categoryName?: string | null;
}

// All three transaction list queries — by member, all mine, and by date
// range — select an identical field set, so one generated row type covers
// every caller. This used to be a union with a hand-written structural
// variant beside it, which meant a field added to the queries had to be
// mirrored here by hand or the shape silently diverged.
type Row = ListTransactionsByFamilyMemberData["transactions"][number];

/**
 * Normalizes a query row into the shape the UI works with.
 *
 * Exported because three different queries (by member, all mine, by date
 * range) return the same row shape and must all normalize identically —
 * a second copy of this would be a second place for direction or color
 * validation to drift.
 */
export function toTransaction(row: Row, myUserId?: string | null): Transaction {
  return {
    id: row.id,
    amountMinor: row.amountMinor,
    direction: normalizeDirection(row.direction),
    occurredOn: row.occurredOn,
    description: row.description ?? null,
    merchant: row.merchant ?? null,
    method: row.method ?? null,
    recurrence: row.recurrence ?? null,
    recurrenceEndsOn: row.recurrenceEndsOn ?? null,
    occurrenceKey: row.id,
    seriesStartsOn: null,
    // Narrowed rather than cast: these are plain text columns, so a value
    // the app does not know about is a real possibility and must land
    // somewhere defined. See lib/transactionKind.ts.
    source: toTransactionSource(row.source),
    status: toTransactionStatus(row.status),
    createdAt: row.createdAt,
    familyMemberId: row.familyMember.id,
    familyMemberName: row.familyMember.name,
    ownerUserId: row.user.id,
    ownerUsername: row.user.username,
    // Both ids come from a database read, so both arrive with hyphens
    // stripped and compare directly.
    isMine: !!myUserId && row.user.id === myUserId,
    category: row.category
      ? {
          id: row.category.id,
          name: row.category.name,
          kind: normalizeDirection(row.category.kind),
          // Normalized at the boundary — see lib/entityColor.ts.
          color: normalizeHexColor(row.category.color),
        }
      : null,
  };
}

/**
 * The editable row behind a transaction, whichever way it arrived on screen.
 *
 * For an ordinary row this is the row. For one of the entries a recurring
 * projection was expanded into, it is the RULE — with `occurredOn` put back
 * to the series' own start, because that is what the row actually stores.
 *
 * Every edit path goes through this. Opening the form on an occurrence and
 * saving it without this would rewrite the rule's start date to whichever
 * occurrence happened to be clicked, quietly moving the whole series.
 */
export function ruleRowOf(txn: Transaction): Transaction {
  return txn.seriesStartsOn ? { ...txn, occurredOn: txn.seriesStartsOn } : txn;
}

/**
 * One family member's transactions, plus the writes that act on them.
 *
 * Passing `familyMemberId` as null (nothing selected yet) yields an empty
 * list without issuing a query, rather than fetching the whole household and
 * filtering client-side.
 */
export function useTransactions(familyMemberId: string | null) {
  const { user } = useAuth();
  const { userId: myUserId } = useUserSettings();
  const { ensureCategoriesExist } = useCategories();

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const clearCategoryMutation = useUpdateTransactionClearCategory();
  const deleteMutation = useDeleteTransaction();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user?.uid || !familyMemberId) {
      setTransactions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // SERVER_ONLY for the same reason as useFamilyMembers: the generated
      // hooks' default cache policy is never invalidated by a mutation, so a
      // just-added transaction would not appear until a full reload.
      const rows = await fetchAllPages<
        ListTransactionsByFamilyMemberVariables,
        ListTransactionsByFamilyMemberData["transactions"][number]
      >(
        (vars) =>
          listTransactionsByFamilyMember(vars, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY }).then(
            (r) => r.data.transactions
          ),
        { familyMemberId }
      );
      // Not `rows.map(toTransaction)` — Array.map passes the index as the
      // second argument, which would arrive as myUserId.
      setTransactions(rows.map((row) => toTransaction(row, myUserId)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, familyMemberId, myUserId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  /**
   * Creating a transaction is two steps, and the order matters.
   *
   * Transaction.categoryName is a foreign key into a table keyed on name, so
   * the Category row has to exist before the insert references it — otherwise
   * the insert fails on the constraint. Data Connect can't express
   * "upsert-then-reference" in a single document, so the client sequences it.
   *
   * ensureCategoriesExist only creates rows that are genuinely missing, so
   * this never overwrites an existing category's color or kind.
   */
  const createTransaction = useCallback(
    async (targetFamilyMemberId: string, myUserId: string, data: TransactionInput) => {
      const categoryName = data.categoryName?.trim() || null;
      if (categoryName) await ensureCategoriesExist([categoryName]);

      await createMutation.mutateAsync({
        userId: myUserId,
        familyMemberId: targetFamilyMemberId,
        amountMinor: data.amountMinor,
        direction: data.direction,
        occurredOn: data.occurredOn,
        createdAt: new Date().toISOString(),
        description: data.description || undefined,
        merchant: data.merchant || undefined,
        method: data.method || undefined,
        recurrence: data.recurrence || undefined,
        recurrenceEndsOn: data.recurrenceEndsOn || undefined,
        categoryName: categoryName ?? undefined,
        source: data.source || "MANUAL",
        status: data.status || statusForSource(data.source ?? "MANUAL"),
      } as CreateTransactionVariables);

      await refetch();
    },
    [createMutation, ensureCategoriesExist, refetch]
  );

  const updateTransaction = useCallback(
    async (transactionId: string, data: TransactionInput) => {
      const categoryName = data.categoryName?.trim() || null;

      if (categoryName) {
        await ensureCategoriesExist([categoryName]);
        await updateMutation.mutateAsync({
          transactionId,
          amountMinor: data.amountMinor,
          direction: data.direction,
          occurredOn: data.occurredOn,
          description: data.description ?? null,
          merchant: data.merchant ?? null,
          method: data.method ?? null,
          recurrence: data.recurrence ?? null,
          recurrenceEndsOn: data.recurrenceEndsOn ?? null,
          categoryName,
          source: data.source || "MANUAL",
          status: data.status || statusForSource(data.source ?? "MANUAL"),
        } as UpdateTransactionVariables);
      } else {
        // Separate mutation, not `categoryName: null` on the one above — a
        // literal null can't share a GraphQL document with a variant that
        // sets the same field from a variable. See
        // UpdateTransactionClearCategory in mutations.gql.
        await clearCategoryMutation.mutateAsync({
          transactionId,
          amountMinor: data.amountMinor,
          direction: data.direction,
          occurredOn: data.occurredOn,
          description: data.description ?? null,
          merchant: data.merchant ?? null,
          method: data.method ?? null,
          recurrence: data.recurrence ?? null,
          recurrenceEndsOn: data.recurrenceEndsOn ?? null,
          source: data.source || "MANUAL",
          status: data.status || statusForSource(data.source ?? "MANUAL"),
        } as UpdateTransactionClearCategoryVariables);
      }

      await refetch();
    },
    [updateMutation, clearCategoryMutation, ensureCategoriesExist, refetch]
  );

  const deleteTransaction = useCallback(
    async (transactionId: string) => {
      await deleteMutation.mutateAsync({ transactionId } as DeleteTransactionVariables);
      await refetch();
    },
    [deleteMutation, refetch]
  );

  return {
    transactions,
    loading,
    error,
    refetch,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
