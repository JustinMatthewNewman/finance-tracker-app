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
import type { Minor } from "@/lib/money";

export interface MonthTotals {
  /** Money that actually moved. */
  postedMinor: Minor;
  /** Money still only expected. */
  projectedMinor: Minor;
  /** Both together — what the month is on course to total. */
  expectedMinor: Minor;
}

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

  /**
   * Splits a set of rows into what has happened and what is merely expected.
   *
   * Keyed on `status`, never on `source`. A projection that has been marked
   * as received keeps source "FORECAST" for provenance, and counting it as
   * projected afterwards would mean the month's real total silently excluded
   * money the household has actually been paid.
   */
  const totalsOf = useCallback((rows: Transaction[]): MonthTotals => {
    let postedMinor = 0;
    let projectedMinor = 0;
    for (const row of rows) {
      if (row.status === "FORECASTED") projectedMinor += row.amountMinor;
      else postedMinor += row.amountMinor;
    }
    return { postedMinor, projectedMinor, expectedMinor: postedMinor + projectedMinor };
  }, []);

  const incomeTotals = useMemo(() => totalsOf(income), [income, totalsOf]);
  const expenseTotals = useMemo(() => totalsOf(expenses), [expenses, totalsOf]);

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
    transactions,
    income,
    expenses,
    incomeTotals,
    expenseTotals,
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
