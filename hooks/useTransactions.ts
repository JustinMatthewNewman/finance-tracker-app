"use client";

import { useCallback, useEffect, useState } from "react";
import { QueryFetchPolicy } from "firebase/data-connect";
import { useAuth } from "./useAuth";
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
  createdAt: string;
  familyMemberId: string;
  familyMemberName: string;
  category: TransactionCategoryRef | null;
}

export interface TransactionInput {
  amountMinor: Minor;
  direction: Direction;
  occurredOn: string;
  description?: string | null;
  merchant?: string | null;
  method?: string | null;
  recurrence?: string | null;
  /** Category name, or null/"" for uncategorized. Created if it doesn't exist. */
  categoryName?: string | null;
}

type Row =
  | ListTransactionsByFamilyMemberData["transactions"][number]
  | {
      id: string;
      amountMinor: number;
      direction: string;
      occurredOn: string;
      description?: string | null;
      merchant?: string | null;
      method?: string | null;
      recurrence?: string | null;
      createdAt: string;
      familyMember: { id: string; name: string };
      category?: { id: string; name: string; kind: string; color?: string | null } | null;
    };

/**
 * Normalizes a query row into the shape the UI works with.
 *
 * Exported because three different queries (by member, all mine, by date
 * range) return the same row shape and must all normalize identically —
 * a second copy of this would be a second place for direction or color
 * validation to drift.
 */
export function toTransaction(row: Row): Transaction {
  return {
    id: row.id,
    amountMinor: row.amountMinor,
    direction: normalizeDirection(row.direction),
    occurredOn: row.occurredOn,
    description: row.description ?? null,
    merchant: row.merchant ?? null,
    method: row.method ?? null,
    recurrence: row.recurrence ?? null,
    createdAt: row.createdAt,
    familyMemberId: row.familyMember.id,
    familyMemberName: row.familyMember.name,
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
 * One family member's transactions, plus the writes that act on them.
 *
 * Passing `familyMemberId` as null (nothing selected yet) yields an empty
 * list without issuing a query, rather than fetching the whole household and
 * filtering client-side.
 */
export function useTransactions(familyMemberId: string | null) {
  const { user } = useAuth();
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
      setTransactions(rows.map(toTransaction));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, familyMemberId]);

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
        categoryName: categoryName ?? undefined,
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
          categoryName,
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
