"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { QueryFetchPolicy } from "firebase/data-connect";
import { useAuth } from "./useAuth";
import { useUserSettings } from "@/context/UserSettingsContext";
import { useFamilyMembers, type FamilyMemberData } from "./useFamilyMembers";
import { useTransactions, toTransaction, type Transaction, type TransactionInput } from "./useTransactions";
import {
  listMyRecurringProjections,
  listMyTransactionsByDateRange,
  markTransactionPosted,
  markTransactionProjected,
} from "@/src/dataconnect-generated";
import type {
  ListMyRecurringProjectionsData,
  ListMyRecurringProjectionsVariables,
  ListMyTransactionsByDateRangeData,
  ListMyTransactionsByDateRangeVariables,
} from "@/src/dataconnect-generated";
import { occurrencesInRange } from "@/lib/recurrence";
import { fetchAllPages } from "@/lib/dataconnectPagination";
import { monthRange, type MonthKey } from "@/lib/monthRange";
import { ledgerTotals, totalsByDay } from "@/lib/ledgerTotals";
import { nameTokens, resolveInternalTransfers } from "@/lib/internalTransfers";
import { useInternalTransfers } from "@/context/InternalTransfersContext";

/**
 * One month of the household's money, for the Income, Expenses and Calendar
 * tabs.
 *
 * WHY A DATE-RANGE QUERY RATHER THAN useMyTransactions(). These three pages
 * show exactly one month at a time, and ListMyTransactionsByDateRange bounds
 * the read at the database instead of fetching a household's entire history
 * and discarding all but thirty days of it client-side. That query already
 * existed and had no caller; this is what it was written for.
 *
 * CALL THIS ONCE PER PAGE. It owns a useFamilyMembers() internally and
 * re-exports the roster, so a page that calls useFamilyMembers() again gets a
 * second copy that drifts from this one — the caveat documented on that hook
 * applies transitively.
 */
export function useHouseholdMonth(monthKey: MonthKey) {
  const { user } = useAuth();
  const { userId: myUserId } = useUserSettings();
  // The one display preference that changes a figure. Read here rather than in
  // each page so every total on every screen applies it identically — a month
  // total that counted transfers while the table beside it hid them would be
  // unreconcilable by hand.
  const { showInternalTransfers } = useInternalTransfers();
  const { familyMembers, loading: membersLoading, refetch: refetchMembers } = useFamilyMembers();

  // Reads are bounded by the month; writes are not member-scoped, so the
  // write half is instantiated with null and handed an explicit member id per
  // call. That is why useTransactions takes the member as an argument to
  // createTransaction rather than only at construction.
  const { createTransaction, updateTransaction, deleteTransaction } = useTransactions(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => monthRange(monthKey), [monthKey]);

  const refetch = useCallback(async () => {
    if (!user?.uid) {
      setTransactions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // TWO READS, because "what is in this month" and "what recurs into this
      // month" are different questions. A recurring projection stores only its
      // first occurrence, so a fortnightly paycheque set up in September is a
      // September row — the range query alone would show December an empty
      // calendar. See ListMyRecurringProjections in queries.gql.
      const [rangeRows, ruleRows] = await Promise.all([
        fetchAllPages<
          ListMyTransactionsByDateRangeVariables,
          ListMyTransactionsByDateRangeData["transactions"][number]
        >(
          (vars) =>
            listMyTransactionsByDateRange(vars, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY }).then(
              (r) => r.data.transactions
            ),
          { startDate: range.startDate, endDate: range.endDate }
        ),
        fetchAllPages<
          ListMyRecurringProjectionsVariables,
          ListMyRecurringProjectionsData["transactions"][number]
        >(
          (vars) =>
            listMyRecurringProjections(vars, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY }).then(
              (r) => r.data.transactions
            ),
          { rangeStart: range.startDate, rangeEnd: range.endDate }
        ),
      ]);

      const rules = ruleRows.map((row) => toTransaction(row, myUserId));
      const ruleIds = new Set(rules.map((r) => r.id));

      // A rule whose first occurrence falls inside the range comes back from
      // both queries. Drop it from the range half: the expansion below already
      // produces that day, and keeping both would double the money.
      const plain = rangeRows
        .map((row) => toTransaction(row, myUserId))
        .filter((t) => !ruleIds.has(t.id));

      // One entry per day the rule falls on. `id` stays the rule's real row
      // id on every one of them, so any mutation called with it addresses a
      // row that exists; `occurrenceKey` is what distinguishes them on screen.
      const expanded = rules.flatMap((rule) =>
        occurrencesInRange(
          {
            occurredOn: rule.occurredOn,
            recurrence: rule.recurrence,
            recurrenceEndsOn: rule.recurrenceEndsOn,
          },
          range.startDate,
          range.endDate
        ).map((day) => ({
          ...rule,
          occurredOn: day,
          occurrenceKey: `${rule.id}#${day}`,
          // What occurredOn was before expansion overwrote it. ruleRowOf()
          // uses this to hand the edit form the row as stored.
          seriesStartsOn: rule.occurredOn,
        }))
      );

      setTransactions([...plain, ...expanded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load this month's records");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, myUserId, range.startDate, range.endDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  const income = useMemo(() => transactions.filter((t) => t.direction === "INCOME"), [transactions]);
  const expenses = useMemo(
    () => transactions.filter((t) => t.direction === "EXPENSE"),
    [transactions]
  );

  // Pairing needs a stable row identity plus who the row belongs to. An expanded
  // recurring occurrence shares its rule's `id`, which is correct here: a rule is
  // one row and pairs (or does not) as one.
  const toPairable = (txn: Transaction) => ({
    id: txn.id,
    familyMemberId: txn.familyMemberId,
    direction: txn.direction,
    amountMinor: txn.amountMinor,
    occurredOn: txn.occurredOn,
    merchant: txn.merchant,
    method: txn.method,
    isInternalToUser: txn.isInternalToUser,
    isInternalToFamily: txn.isInternalToFamily,
  });

  /**
   * Which rows are internal transfers, decided NOW rather than read off the
   * stored columns.
   *
   * Display must not wait on those columns. A household that imported before they
   * existed has none of them set, and the toggle then does nothing at all — which
   * is exactly what happened: 1,062 transfers sat unflagged and the feature looked
   * broken. See resolveInternalTransfers for the three passes and why the stored
   * values still win when present.
   *
   * This hook is the one place all three passes can run, because it is the only
   * one holding both the roster and a whole period of the HOUSEHOLD's rows — and
   * pairing needs the other leg, which usually belongs to somebody else.
   */
  const householdTokens = useMemo(
    () => nameTokens(familyMembers.map((m: FamilyMemberData) => m.name)),
    [familyMembers]
  );
  const internalById = useMemo(
    () => resolveInternalTransfers(transactions.map(toPairable), householdTokens),
    [transactions, householdTokens]
  );
  const isRowInternal = useCallback(
    (txn: Transaction) => {
      const flags = internalById.get(txn.id);
      return !!flags && (flags.isInternalToUser || flags.isInternalToFamily);
    },
    [internalById]
  );

  /**
   * The rows every total sees, with the resolved flags written onto them.
   *
   * Applied to the ROWS rather than passed as an option, so ledgerTotals keeps
   * reading flags off a row and needs to know nothing about how they were
   * decided.
   */
  const resolved = useMemo(
    () => transactions.map((txn) => ({ ...txn, ...(internalById.get(txn.id) ?? {}) })),
    [transactions, internalById]
  );

  const totalsOptions = useMemo(
    () => ({ includeInternalTransfers: showInternalTransfers }),
    [showInternalTransfers]
  );

  /**
   * The month's in and out, and every rule about how they are computed.
   *
   * All of it lives in lib/ledgerTotals.ts rather than here: these sums were
   * written inline in three components and had to agree, which is exactly the
   * kind of duplication that drifts silently — a total does not throw when it is
   * wrong, it just shows a number nobody can account for. That module is pure and
   * heavily tested; this hook only chooses the rows and the options.
   */
  const totals = useMemo(() => ledgerTotals(resolved, totalsOptions), [resolved, totalsOptions]);

  /** Per-day figures, for the calendar grid and the day detail page. */
  const byDay = useMemo(() => totalsByDay(resolved, totalsOptions), [resolved, totalsOptions]);

  /**
   * The rows a screen should actually render, with hidden transfers removed.
   *
   * Paired with `totals` above on purpose: both apply the same filter, so what a
   * table lists and what the figure above it says always describe the same set of
   * rows.
   */
  const visible = useMemo(
    () => (showInternalTransfers ? resolved : resolved.filter((t) => !isRowInternal(t))),
    [resolved, showInternalTransfers, isRowInternal]
  );
  const visibleIncome = useMemo(() => visible.filter((t) => t.direction === "INCOME"), [visible]);
  const visibleExpenses = useMemo(() => visible.filter((t) => t.direction === "EXPENSE"), [visible]);

  /** Household members whose records this account may actually write to. */
  const myMembers = useMemo(
    () => familyMembers.filter((m: FamilyMemberData) => m.isMine),
    [familyMembers]
  );

  const create = useCallback(
    async (familyMemberId: string, data: TransactionInput) => {
      if (!myUserId) throw new Error("User profile not found");
      await createTransaction(familyMemberId, myUserId, data);
      await refetch();
    },
    [createTransaction, myUserId, refetch]
  );

  const update = useCallback(
    async (transactionId: string, data: TransactionInput) => {
      await updateTransaction(transactionId, data);
      await refetch();
    },
    [updateTransaction, refetch]
  );

  const remove = useCallback(
    async (transactionId: string) => {
      await deleteTransaction(transactionId);
      await refetch();
    },
    [deleteTransaction, refetch]
  );

  /** "That arrived" / "I paid that." */
  const markPosted = useCallback(
    async (transactionId: string) => {
      await markTransactionPosted({ transactionId });
      await refetch();
    },
    [refetch]
  );

  /** The undo for the above. */
  const markProjected = useCallback(
    async (transactionId: string) => {
      await markTransactionProjected({ transactionId });
      await refetch();
    },
    [refetch]
  );

  return {
    range,
    /** Every row in the month, including transfers the household has hidden. */
    transactions,
    income,
    expenses,
    /** The same rows with hidden transfers removed — what a table should list. */
    visible,
    visibleIncome,
    visibleExpenses,
    /** The month's in/out. See lib/ledgerTotals.ts. */
    totals,
    byDay,
    showInternalTransfers,
    familyMembers,
    myMembers,
    loading: loading || membersLoading,
    error,
    refetch,
    refetchMembers,
    create,
    update,
    remove,
    markPosted,
    markProjected,
  };
}
