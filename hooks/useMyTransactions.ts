"use client";

import { useCallback, useEffect, useState } from "react";
import { QueryFetchPolicy } from "firebase/data-connect";
import { useAuth } from "./useAuth";
import { listMyTransactions } from "@/src/dataconnect-generated";
import type { ListMyTransactionsData, ListMyTransactionsVariables } from "@/src/dataconnect-generated";
import { fetchAllPages } from "@/lib/dataconnectPagination";
import { type Transaction, toTransaction } from "./useTransactions";

/**
 * Every transaction in the household, across all members.
 *
 * Distinct from useTransactions(memberId), which is scoped to one person and
 * owns the writes. This one is read-only and exists for the two places that
 * genuinely need the whole set: the global search index, and the sidebar's
 * per-member totals — computing those from one shared fetch rather than one
 * query per member is what keeps the sidebar from an N+1.
 *
 * Safe to call from more than one component, unlike useFamilyMembers: it has
 * no writes, so two copies can't disagree about anything a mutation changed.
 */
export function useMyTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user?.uid) {
      setTransactions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchAllPages<
        ListMyTransactionsVariables,
        ListMyTransactionsData["transactions"][number]
      >(
        (vars) =>
          listMyTransactions(vars, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY }).then(
            (r) => r.data.transactions
          ),
        {}
      );
      setTransactions(rows.map(toTransaction));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  return { transactions, loading, error, refetch };
}
