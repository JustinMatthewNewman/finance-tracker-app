"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { QueryFetchPolicy } from "firebase/data-connect";
import { useAuth } from "./useAuth";
import { useUserSettings } from "@/context/UserSettingsContext";
import { listMyTransactions } from "@/src/dataconnect-generated";
import type { ListMyTransactionsData, ListMyTransactionsVariables } from "@/src/dataconnect-generated";
import { fetchAllPages } from "@/lib/dataconnectPagination";
import { EMPTY_TOKENS, isInternal, nameTokens, resolveInternalTransfers } from "@/lib/internalTransfers";
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
 *
 * `householdNames` is optional and only affects which rows count as internal
 * transfers. A caller that already holds the roster should pass it — see the
 * note on `internalById` below for what it buys and why this hook cannot fetch
 * the roster itself. MEMOIZE IT: it is a dependency of the resolution pass,
 * which pairs every transfer leg against every other, so a fresh array each
 * render would redo that on each one.
 */
export function useMyTransactions(householdNames?: readonly string[]) {
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
   * Which rows are internal transfers, decided NOW rather than read off the
   * stored columns — see resolveInternalTransfers.
   *
   * This hook deliberately owns no useFamilyMembers() of its own (see the
   * once-per-page caveat on that hook), so it cannot fetch a roster — but a
   * caller that already has one can pass the names in, and then all three
   * passes run. Without them the name-matching pass is skipped: the own-account
   * prefix and the leg pairing still work, which is the bulk of it, but a Zelle
   * payment naming a housemate is missed until the stored flags are set by the
   * re-check.
   *
   * Passing them matters because this list backs BOTH the sidebar's per-member
   * subtotals and the household panel's combined figures. Resolving it one way
   * for one and another way for the other is how a total and the table under it
   * come to disagree.
   */
  const householdTokens = useMemo(
    () => (householdNames?.length ? nameTokens(householdNames) : EMPTY_TOKENS),
    [householdNames]
  );
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
        householdTokens
      ),
    [transactions, householdTokens]
  );

  /**
   * The rows a screen should render, with hidden transfers removed.
   *
   * Beside the unfiltered list rather than replacing it: `transactions` is what
   * exists, `visible` is what the household asked to see. The sidebar's per-member
   * subtotals read this, so they agree with the figures on every other page —
   * without it the toggle changed the main panel while the sidebar beside it went
   * on counting transfers.
   */
  const visible = useMemo(
    () =>
      showInternalTransfers
        ? transactions
        : transactions.filter((t) => !isInternal(internalById.get(t.id) ?? {})),
    [transactions, showInternalTransfers, internalById]
  );

  /**
   * Which rows the resolver decided are internal, as flags written onto the row.
   *
   * Exposed because a caller that totals these rows must do so with
   * `ledgerTotals(resolved, { includeInternalTransfers })` rather than over the
   * pre-filtered `visible` — that is the only way `excludedTransferCount` comes
   * back non-zero, and a screen that hides rows without saying how many is
   * unreconcilable by hand.
   */
  const resolved = useMemo(
    () => transactions.map((txn) => ({ ...txn, ...(internalById.get(txn.id) ?? {}) })),
    [transactions, internalById]
  );

  return { transactions, resolved, visible, showInternalTransfers, loading, error, refetch };
}
