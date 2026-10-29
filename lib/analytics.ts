// What the dashboard's widgets are made of: a period's money reduced to series,
// rankings and rates.
//
// PURE, AND THAT IS THE WHOLE REASON IT EXISTS AS A MODULE. Every figure here
// would otherwise be a reduce() inside a chart component, and there are a dozen
// of them that have to agree with each other and with the four pages that already
// existed. A wrong total does not throw — it renders, and somebody budgets
// against it. Here it is testable without a database, a browser or a chart.
//
// EVERY IN/OUT FIGURE COMES FROM lib/ledgerTotals.ts. Nothing below adds up an
// `amountMinor` itself: the rules about what counts (projections apart from
// actuals, internal transfers in or out, an unrecognized `direction` landing
// somewhere defined) live there and are tested there. This module only chooses
// which rows go into each call and what to label the result. A second
// implementation of those rules is exactly the drift that put three different
// month totals on three different screens before ledgerTotals existed.

import {
  type Countable,
  type LedgerTotals,
  type TotalsOptions,
  ledgerTotals,
} from "./ledgerTotals";
import {
  type Bucket,
  type DateRange,
  bucketKeyOf,
  bucketKeysIn,
  dayCount,
} from "./dateRange";

/** The shape every function here needs: a countable row on a calendar day. */
export interface DatedRow extends Countable {
  /** "yyyy-mm-dd" */
  occurredOn: string;
}

/** One column of a time chart. */
export interface BucketTotals extends LedgerTotals {
  /** Sortable bucket key — see bucketKeyOf. */
  key: string;
}

/**
 * The period as an ordered series of buckets, one per column of a chart.
 *
 * INCLUDES EMPTY BUCKETS, because the axis comes from the range and not from the
 * data. A series assembled only from buckets that have rows draws a week of no
 * spending as though it were not there, joining the line straight across the gap
 * — which reads as steady when the truth is that nothing happened.
 */
export function bucketSeries(
  rows: readonly DatedRow[],
  range: DateRange,
  bucket: Bucket,
  options: TotalsOptions = {}
): BucketTotals[] {
  const grouped = new Map<string, DatedRow[]>();
  for (const row of rows) {
    const key = bucketKeyOf(row.occurredOn, bucket);
    const existing = grouped.get(key);
    if (existing) existing.push(row);
    else grouped.set(key, [row]);
  }
  return bucketKeysIn(range, bucket).map((key) => ({
    key,
    ...ledgerTotals(grouped.get(key) ?? [], options),
  }));
}

/**
 * A running cumulative total across a series, for the "where will this month
 * land" line.
 *
 * Reads `actualMinor` only. Accumulating the expected figure would produce a
 * curve that steps up on a day a bill is merely due, which is indistinguishable
 * on screen from a day it was paid — and the whole point of a cumulative spend
 * line is that it is the one a bank statement can be checked against.
 */
export function cumulative(series: readonly BucketTotals[]): { key: string; inMinor: number; outMinor: number; netMinor: number }[] {
  let inMinor = 0;
  let outMinor = 0;
  return series.map((b) => {
    inMinor += b.in.actualMinor;
    outMinor += b.out.actualMinor;
    return { key: b.key, inMinor, outMinor, netMinor: inMinor - outMinor };
  });
}

/** A named slice of a period — a category, a member, a merchant. */
export interface Slice {
  /** Stable identity, for colour assignment. Never the rank. */
  id: string;
  label: string;
  /** The figure this slice is ranked and drawn by. */
  valueMinor: number;
  /** Rows behind it, for a count and an empty state. */
  count: number;
}

/**
 * How many real slices a chart gets before the tail is folded into "Other".
 *
 * Eight is the categorical token ceiling (see lib/chartColor.ts), and a 9th hue
 * is never generated — under colour-vision deficiency it is indistinguishable
 * from one already on screen. Seven real slices plus "Other" keeps the fold
 * inside the budget.
 */
export const MAX_SLICES = 7;

/** The id "Other" is reported under, so a caller can colour it as neutral. */
export const OTHER_SLICE_ID = "__other__";

/**
 * Ranks slices and folds the tail, so a chart never has to decide either.
 *
 * Folding rather than truncating: dropping the tail makes the parts stop adding
 * up to the total above them, which is the one thing a part-to-whole chart must
 * never do.
 */
export function foldSlices(slices: readonly Slice[], maxSlices: number = MAX_SLICES): Slice[] {
  const ranked = [...slices].sort((a, b) => b.valueMinor - a.valueMinor || a.label.localeCompare(b.label));
  if (ranked.length <= maxSlices) return ranked;
  const head = ranked.slice(0, maxSlices);
  const tail = ranked.slice(maxSlices);
  return [
    ...head,
    {
      id: OTHER_SLICE_ID,
      label: `Other (${tail.length})`,
      valueMinor: tail.reduce((n, s) => n + s.valueMinor, 0),
      count: tail.reduce((n, s) => n + s.count, 0),
    },
  ];
}

/** Which side of the ledger a breakdown is about. */
export type Side = "in" | "out";

function sideOf(totals: LedgerTotals, side: Side): number {
  return side === "in" ? totals.in.actualMinor : totals.out.actualMinor;
}

/**
 * A period broken down by an arbitrary key — the one function behind the
 * category, member and merchant widgets.
 *
 * `keyOf` returning null buckets the row under `nullLabel`, which is a real
 * state and not a gap: an uncategorized transaction is what the importer leaves
 * when it will not guess, and hiding those would make the breakdown quietly
 * smaller than the total.
 */
export function breakdown<T extends Countable>(
  rows: readonly T[],
  side: Side,
  keyOf: (row: T) => { id: string; label: string } | null,
  options: TotalsOptions = {},
  nullLabel = "Uncategorized"
): Slice[] {
  const grouped = new Map<string, { label: string; rows: T[] }>();
  for (const row of rows) {
    const key = keyOf(row);
    const id = key?.id ?? OTHER_SLICE_ID + ":null";
    const label = key?.label ?? nullLabel;
    const existing = grouped.get(id);
    if (existing) existing.rows.push(row);
    else grouped.set(id, { label, rows: [row] });
  }

  const slices: Slice[] = [];
  for (const [id, { label, rows: groupRows }] of grouped) {
    const totals = ledgerTotals(groupRows, options);
    const valueMinor = sideOf(totals, side);
    // A group whose every row was on the other side of the ledger, or was an
    // excluded transfer, contributes nothing and would draw a zero-length bar
    // with a legend entry — noise that costs a colour slot.
    if (valueMinor <= 0) continue;
    slices.push({ id, label, valueMinor, count: side === "in" ? totals.in.count : totals.out.count });
  }
  return slices;
}

/** One cell of a stacked series: a bucket, a slice, and the figure. */
export interface StackedCell {
  bucketKey: string;
  sliceId: string;
  valueMinor: number;
}

export interface StackedSeries {
  /** Ordered bucket keys — the x-axis. */
  bucketKeys: string[];
  /** Ordered slices, tail already folded. Colour follows `id`, never position. */
  slices: Slice[];
  /** Lookup: `${bucketKey}|${sliceId}` -> minor units. Absent means zero. */
  cells: Map<string, number>;
  /** The tallest bucket's total, for scaling. Zero for an empty period. */
  maxBucketMinor: number;
  /** Each bucket's stack height, in bucket order. */
  bucketTotalsMinor: number[];
}

/**
 * A stacked series: one column per bucket, split by slice.
 *
 * The slices are decided from the WHOLE PERIOD and then applied to every bucket,
 * rather than per bucket. That is what makes a stacked chart readable: a category
 * keeps the same colour and the same position in every column, so the eye can
 * follow one band across the chart. Ranking within each column independently
 * would repaint and reorder the bands column by column — the recolour-on-filter
 * failure, one axis over.
 */
export function stackedSeries<T extends DatedRow>(
  rows: readonly T[],
  range: DateRange,
  bucket: Bucket,
  side: Side,
  keyOf: (row: T) => { id: string; label: string } | null,
  options: TotalsOptions = {},
  maxSlices: number = MAX_SLICES
): StackedSeries {
  const slices = foldSlices(breakdown(rows, side, keyOf, options), maxSlices);
  const kept = new Set(slices.map((s) => s.id));
  // Which ids the "Other" band absorbs. Derived from what survived the fold
  // rather than recomputed, so the bands cannot disagree with the legend.
  const sliceIdFor = (row: T): string => {
    const key = keyOf(row);
    const id = key?.id ?? OTHER_SLICE_ID + ":null";
    return kept.has(id) ? id : OTHER_SLICE_ID;
  };

  const bucketKeys = bucketKeysIn(range, bucket);
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const cellKey = `${bucketKeyOf(row.occurredOn, bucket)}|${sliceIdFor(row)}`;
    const existing = grouped.get(cellKey);
    if (existing) existing.push(row);
    else grouped.set(cellKey, [row]);
  }

  const cells = new Map<string, number>();
  for (const [cellKey, cellRows] of grouped) {
    const value = sideOf(ledgerTotals(cellRows, options), side);
    if (value > 0) cells.set(cellKey, value);
  }

  const bucketTotalsMinor = bucketKeys.map((bucketKey) =>
    slices.reduce((n, slice) => n + (cells.get(`${bucketKey}|${slice.id}`) ?? 0), 0)
  );

  return {
    bucketKeys,
    slices,
    cells,
    maxBucketMinor: bucketTotalsMinor.reduce((a, b) => Math.max(a, b), 0),
    bucketTotalsMinor,
  };
}

/** A headline figure with its comparison against the previous period. */
export interface Delta {
  currentMinor: number;
  previousMinor: number;
  /** Signed change. */
  changeMinor: number;
  /**
   * Signed fraction, or null when there is nothing to divide by.
   *
   * Null rather than Infinity or 0: "spending rose from nothing to £40" has no
   * meaningful percentage, and both of those render as a number that looks like
   * one. The UI shows the absolute change instead.
   */
  changeFraction: number | null;
}

export function delta(currentMinor: number, previousMinor: number): Delta {
  return {
    currentMinor,
    previousMinor,
    changeMinor: currentMinor - previousMinor,
    changeFraction: previousMinor === 0 ? null : (currentMinor - previousMinor) / previousMinor,
  };
}

/**
 * What fraction of what came in did not go out, as 0-1, or null.
 *
 * Null when nothing came in — a period with no income has no savings rate, and
 * reporting 0% would be a claim about behaviour rather than an absence of data.
 * Clamped at the bottom: a household that spent more than it earned saved
 * nothing, and a negative "savings rate" is a figure nobody can act on.
 */
export function savingsRate(totals: LedgerTotals): number | null {
  if (totals.in.actualMinor <= 0) return null;
  return Math.max(0, totals.netMinor / totals.in.actualMinor);
}

/** Average money out per day across the window, for the burn-rate tile. */
export function dailyBurnMinor(totals: LedgerTotals, range: DateRange): number {
  return Math.round(totals.out.actualMinor / dayCount(range));
}

/**
 * The busiest single day in the period, by money out.
 *
 * A dashboard that only shows smooth aggregates hides the one £4,800 day that
 * explains the month, and that day is usually what somebody opened the dashboard
 * to find.
 */
export function peakOutflowDay(
  rows: readonly DatedRow[],
  options: TotalsOptions = {}
): { dayKey: string; outMinor: number } | null {
  const grouped = new Map<string, DatedRow[]>();
  for (const row of rows) {
    const key = row.occurredOn.slice(0, 10);
    const existing = grouped.get(key);
    if (existing) existing.push(row);
    else grouped.set(key, [row]);
  }
  let best: { dayKey: string; outMinor: number } | null = null;
  for (const [dayKey, dayRows] of grouped) {
    const outMinor = ledgerTotals(dayRows, options).out.actualMinor;
    if (outMinor <= 0) continue;
    // Ties go to the earlier day, so the answer does not depend on Map order.
    if (!best || outMinor > best.outMinor || (outMinor === best.outMinor && dayKey < best.dayKey)) {
      best = { dayKey, outMinor };
    }
  }
  return best;
}
