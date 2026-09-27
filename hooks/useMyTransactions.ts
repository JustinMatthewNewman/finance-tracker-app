"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { QueryFetchPolicy } from "firebase/data-connect";
import { useAuth } from "./useAuth";
import { useUserSettings } from "@/context/UserSettingsContext";
import { listMyTransactions } from "@/src/dataconnect-generated";
import type { ListMyTransactionsData, ListMyTransactionsVariables } from "@/src/dataconnect-generated";
import { fetchAllPages } from "@/lib/dataconnectPagination";
import { EMPTY_TOKENS, isInternal, resolveInternalTransfers } from "@/lib/internalTransfers";
import { useInternalTransfers } from "@/context/InternalTransfersContext";
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
  const { showInternalTransfers } = useInternalTransfers();
  const { userId: myUserId } = useUserSettings();
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
      // Not `rows.map(toTransaction)` — Array.map passes the index as the
      // second argument, which would arrive as myUserId.
      setTransactions(rows.map((row) => toTransaction(row, myUserId)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, myUserId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  /**
   * The rows a screen should render, with hidden transfers removed.
   *
   * Beside the unfiltered list rather than replacing it: `transactions` is what
   * exists, `visible` is what the household asked to see. The sidebar's per-member
   * subtotals read this, so they agree with the figures on every other page —
   * without it the toggle changed the main panel while the sidebar beside it went
   * on counting transfers.
   */
  /**
   * Which rows are internal transfers, decided NOW rather than read off the
   * stored columns — see resolveInternalTransfers.
   *
   * No roster here (this hook deliberately owns no useFamilyMembers(); see the
   * once-per-page caveat on it), so the name-matching pass cannot run. The
   * own-account prefix and the leg pairing both work without one, which is the
   * bulk of it; a Zelle payment named after a housemate is caught on the pages
   * that do hold a roster, and by the stored flags once the re-check has run.
   */
  const internalById = useMemo(
    () =>
      resolveInternalTransfers(
        transactions.map((txn) => ({
          id: txn.id,
          familyMemberId: txn.familyMemberId,
          direction: txn.direction,
          amountMinor: txn.amountMinor,
          occurredOn: txn.occurredOn,
          merchant: txn.merchant,
          method: txn.method,
          isInternalToUser: txn.isInternalToUser,
          isInternalToFamily: txn.isInternalToFamily,
        })),
        EMPTY_TOKENS
      ),
    [transactions]
  );

  const visible = useMemo(
    () =>
      showInternalTransfers
        ? transactions
        : transactions.filter((t) => !isInternal(internalById.get(t.id) ?? {})),
    [transactions, showInternalTransfers, internalById]
  );

  return { transactions, visible, showInternalTransfers, loading, error, refetch };
}
