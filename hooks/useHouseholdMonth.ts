"use client";

import { useMemo } from "react";
import { monthRange, type MonthKey } from "@/lib/monthRange";
import { useHouseholdRange } from "./useHouseholdRange";

/**
 * One month of the household's money, for the Income, Expenses and Calendar
 * tabs.
 *
 * A WRAPPER over useHouseholdRange, which holds the implementation. This hook
 * was the original and was month-shaped throughout; the Dashboard needed the
 * same two reads, the same recurring-rule expansion and the same three-pass
 * transfer resolution over an arbitrary window, so the window became a parameter
 * rather than this growing a near-identical twin. Keeping this name and shape
 * means the three pages built on it did not have to change, and "a month" stays
 * the thing they ask for rather than a range they each compute.
 *
 * Everything useHouseholdRange documents applies here — in particular CALL IT
 * ONCE PER PAGE, because it owns a useFamilyMembers() internally.
 */
export function useHouseholdMonth(monthKey: MonthKey) {
  const range = useMemo(() => monthRange(monthKey), [monthKey]);
  return useHouseholdRange(range);
}
