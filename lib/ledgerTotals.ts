// Every "in" and "out" figure in the app, in one place.
//
// WHY THIS EXISTS. These sums used to be written inline in three components,
// and a total is exactly the wrong thing to write three times: each copy has to
// get the same four decisions right, and when one of them drifts nothing throws
// — the screen just shows a number that is wrong by an amount nobody can
// account for. Every figure on the Calendar, Income and Expenses pages now comes
// from here, and this file is pure, so those decisions are testable.
//
// THE FOUR DECISIONS, and what goes wrong if each is made the other way:
//
//  1. IN AND OUT ARE KEPT APART, never netted into one running figure. A refund
//     is money in against a spending category; net it as you go and "spent this
//     month" quietly shrinks by the refund, which is true of the net and false
//     of the figure people budget against.
//
//  2. ACTUAL AND PROJECTED ARE KEPT APART, and the split is on `status` — never
//     on `source`. A projection that has been marked as received keeps
//     `source: "FORECAST"` so its provenance survives; count that as projected
//     afterwards and the month's real income silently excludes money the
//     household has actually been paid. `status` is the only authority on
//     whether money moved.
//
//  3. AN IMPORTED ROW IS AN ACTUAL. `source: "IMPORT"` sits beside MANUAL, not
//     beside FORECAST, so a CSV row counts in `in`/`out` exactly like a typed
//     one. The imported subtotals below exist so "how much of this came from the
//     bank" is answerable — for reconciling against a statement — and they are
//     deliberately a BREAKDOWN of the actual figure rather than a replacement
//     for it. Making in/out imported-only would hide every hand-entered actual,
//     which is money the household really has.
//
//  4. EXCLUDED ROWS ARE EXCLUDED FROM EVERYTHING. When internal transfers are
//     hidden, they must leave the totals too. A figure that includes rows the
//     table below it does not show is unreconcilable by hand, which is the one
//     thing a person does to check a ledger they distrust.

import { isInternal } from "./internalTransfers";
import { normalizeDirection, type Minor } from "./money";
import { toTransactionSource, toTransactionStatus } from "./transactionKind";

/**
 * The shape any total needs. Deliberately structural rather than the
 * Transaction type, so this file depends on no hook and can be tested with
 * literals.
 */
export interface Countable {
  amountMinor: Minor;
  direction: string;
  status: string;
  source: string;
  /** Between one account holder's own accounts. */
  isInternalToUser?: boolean | null;
  /** Between two people inside the household. */
  isInternalToFamily?: boolean | null;
}

/** One side of the ledger, split by whether the money has actually moved. */
export interface SideTotals {
  /** Money that moved. POSTED, whatever its source. */
  actualMinor: Minor;
  /** Money only expected. FORECASTED. */
  projectedMinor: Minor;
  /** Both together — what this side is on course to total. */
  expectedMinor: Minor;
  /** How much of `actualMinor` came from a statement import. A subtotal. */
  importedMinor: Minor;
  /** How much of `actualMinor` was typed in by hand. A subtotal. */
  manualMinor: Minor;
  /** How many rows contributed, for empty-state and "n transactions" wording. */
  count: number;
}

export interface LedgerTotals {
  /** Money arriving. */
  in: SideTotals;
  /** Money leaving. */
  out: SideTotals;
  /**
   * What actually happened: actual in minus actual out. Negative means the
   * period spent more than it took in.
   *
   * Projections are NOT in here. That is the whole point of the separation —
   * this is the figure a person can reconcile against a bank balance.
   */
  netMinor: Minor;
  /** Where the period lands if every projection arrives exactly as entered. */
  expectedNetMinor: Minor;
  /** Whether anything is merely expected, so a UI can hide a redundant figure. */
  hasProjections: boolean;
  /** Rows left out because internal transfers are hidden. */
  excludedTransferCount: number;
}

const emptySide = (): SideTotals => ({
  actualMinor: 0,
  projectedMinor: 0,
  expectedMinor: 0,
  importedMinor: 0,
  manualMinor: 0,
  count: 0,
});

export interface TotalsOptions {
  /**
   * Whether transfers between the household's own accounts count.
   *
   * Default true, matching the stored preference's default and the plain
   * reading of a bank statement: the lines are on it. Off, they leave the totals
   * AND are reported in `excludedTransferCount`, so a screen can say what it is
   * not counting rather than silently differing from the statement.
   */
  includeInternalTransfers?: boolean;
}

/**
 * Sums rows into the in/out figures every page shows.
 *
 * Reads `direction`, `status` and `source` through the narrowing helpers rather
 * than comparing raw strings: all three are plain text columns with no database
 * constraint behind them, so a hand-edited row can hold anything, and an
 * unrecognized value has to land somewhere defined rather than silently in
 * neither bucket. See lib/money.ts and lib/transactionKind.ts for which way each
 * one defaults and why.
 */
export function ledgerTotals(
  rows: readonly Countable[],
  { includeInternalTransfers = true }: TotalsOptions = {}
): LedgerTotals {
  const totals: LedgerTotals = {
    in: emptySide(),
    out: emptySide(),
    netMinor: 0,
    expectedNetMinor: 0,
    hasProjections: false,
    excludedTransferCount: 0,
  };

  for (const row of rows) {
    // Either kind leaves a household-wide total, and for the same reason: the
    // two legs cancel, so counting them inflates both sides by an amount that
    // vanishes from the net. See lib/internalTransfers.ts.
    if (!includeInternalTransfers && isInternal(row)) {
      totals.excludedTransferCount++;
      continue;
    }

    const side = normalizeDirection(row.direction) === "INCOME" ? totals.in : totals.out;
    const status = toTransactionStatus(row.status);
    side.count++;

    if (status === "FORECASTED") {
      side.projectedMinor += row.amountMinor;
      totals.hasProjections = true;
    } else {
      side.actualMinor += row.amountMinor;
      // A breakdown of the actual figure, not a third bucket beside it: these
      // two always sum back to actualMinor. toTransactionSource resolves an
      // unknown source to MANUAL, so an unrecognized row is counted as typed —
      // which understates the imported subtotal rather than the total.
      if (toTransactionSource(row.source) === "IMPORT") side.importedMinor += row.amountMinor;
      else side.manualMinor += row.amountMinor;
    }
  }

  for (const side of [totals.in, totals.out]) {
    side.expectedMinor = side.actualMinor + side.projectedMinor;
  }
  totals.netMinor = totals.in.actualMinor - totals.out.actualMinor;
  totals.expectedNetMinor = totals.in.expectedMinor - totals.out.expectedMinor;

  return totals;
}

/** One calendar day's rows and figures. */
export interface DayTotals extends LedgerTotals {
  /** "yyyy-mm-dd" */
  dayKey: string;
}

/**
 * Groups rows by their calendar day and totals each one.
 *
 * Keyed on the row's `occurredOn` exactly as stored — sliced to ten characters
 * rather than round-tripped through a Date, which would reintroduce the timezone
 * shift lib/monthRange.ts exists to avoid for the sake of a grouping key that is
 * already in the right form.
 *
 * Rows excluded by the options are excluded from the day's totals but still
 * counted in its `excludedTransferCount`, so a cell can show that it is holding
 * something back.
 */
export function totalsByDay(
  rows: readonly (Countable & { occurredOn: string })[],
  options: TotalsOptions = {}
): Map<string, DayTotals> {
  const grouped = new Map<string, (Countable & { occurredOn: string })[]>();
  for (const row of rows) {
    const key = row.occurredOn.slice(0, 10);
    const bucket = grouped.get(key);
    if (bucket) bucket.push(row);
    else grouped.set(key, [row]);
  }

  const out = new Map<string, DayTotals>();
  for (const [dayKey, dayRows] of grouped) {
    out.set(dayKey, { dayKey, ...ledgerTotals(dayRows, options) });
  }
  return out;
}

/**
 * Totals across a set of days, from an already-computed per-day map.
 *
 * Takes the day keys rather than re-filtering the rows, because the caller
 * already knows which days it is showing — the calendar grid pads with adjacent
 * months' days, and a month total must count the month's days and not the
 * padding. Summing the map's every entry instead is the bug this signature
 * exists to prevent.
 *
 * A key with no entry contributes nothing, so a caller can pass its whole grid
 * without checking which days have rows.
 */
export function sumDays(
  byDay: ReadonlyMap<string, DayTotals>,
  dayKeys: readonly string[]
): LedgerTotals {
  const totals: LedgerTotals = {
    in: emptySide(),
    out: emptySide(),
    netMinor: 0,
    expectedNetMinor: 0,
    hasProjections: false,
    excludedTransferCount: 0,
  };

  // A day listed twice must not be counted twice — a caller building keys from
  // a grid, a filter and a selection has no single place that guarantees
  // uniqueness, and the failure would be a silently doubled month.
  for (const dayKey of new Set(dayKeys)) {
    const day = byDay.get(dayKey);
    if (!day) continue;
    for (const key of ["in", "out"] as const) {
      totals[key].actualMinor += day[key].actualMinor;
      totals[key].projectedMinor += day[key].projectedMinor;
      totals[key].importedMinor += day[key].importedMinor;
      totals[key].manualMinor += day[key].manualMinor;
      totals[key].count += day[key].count;
    }
    totals.excludedTransferCount += day.excludedTransferCount;
    totals.hasProjections = totals.hasProjections || day.hasProjections;
  }

  for (const side of [totals.in, totals.out]) {
    side.expectedMinor = side.actualMinor + side.projectedMinor;
  }
  totals.netMinor = totals.in.actualMinor - totals.out.actualMinor;
  totals.expectedNetMinor = totals.in.expectedMinor - totals.out.expectedMinor;

  return totals;
}
