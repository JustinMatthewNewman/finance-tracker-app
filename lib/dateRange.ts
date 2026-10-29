// The dashboard's window on time: the presets behind its range control, and the
// buckets a chart's x-axis is made of.
//
// SEPARATE FROM lib/monthRange.ts ON PURPOSE. That module answers one question —
// "which days are in this month" — for the pages that show exactly one month.
// The dashboard's range is arbitrary (last 7 days, year to date, a custom pair of
// dates), and the interesting operations are different: resolving a preset,
// finding the comparable previous period, and choosing a bucket size that gives a
// chart a sensible number of columns. Those do not belong in a module named for
// months. It builds ON monthRange's primitives rather than repeating them.
//
// EVERYTHING HERE IS A LOCAL CALENDAR DAY, for the reason monthRange.ts states at
// length: `new Date("2026-09-01")` is UTC midnight, which is the previous day for
// anyone west of Greenwich, so a range built that way silently gains or loses a
// day's money at each edge. Every Date below is constructed from explicit
// (year, month, day) parts and every string goes through toDateString().

import { fromDateString, toDateString, type DateRange } from "./monthRange";

export type { DateRange };

/**
 * The preset ranges the control offers, in the order it lists them.
 *
 * Presets before a custom range because that is the order people reach for them —
 * nobody fights a calendar grid for "last 30 days". The trailing-N-day ones come
 * first for the same reason: they are what a dashboard is usually opened to see.
 */
export const RANGE_PRESETS = [
  "last7",
  "last30",
  "last90",
  "thisMonth",
  "lastMonth",
  "last6Months",
  "last12Months",
  "yearToDate",
  "custom",
] as const;

export type RangePreset = (typeof RANGE_PRESETS)[number];

export function isRangePreset(value: string | null | undefined): value is RangePreset {
  return !!value && (RANGE_PRESETS as readonly string[]).includes(value);
}

export const RANGE_PRESET_LABELS: Record<RangePreset, string> = {
  last7: "Last 7 days",
  last30: "Last 30 days",
  last90: "Last 90 days",
  thisMonth: "This month",
  lastMonth: "Last month",
  last6Months: "Last 6 months",
  last12Months: "Last 12 months",
  yearToDate: "Year to date",
  custom: "Custom range",
};

/**
 * Resolves a preset to its inclusive day pair.
 *
 * `today` is a PARAMETER rather than read from the clock inside, which is what
 * makes every one of these testable at all — a function that calls `new Date()`
 * can only be tested by freezing time around it. Callers pass `new Date()`.
 *
 * "custom" has no answer here by construction: it is whatever the person typed,
 * so it is the caller's to hold. Asking for it returns the last-30-days window as
 * a starting point to edit rather than throwing, because the control switches to
 * custom BEFORE the person has entered anything and a throw there would be a
 * crash on a mode change.
 */
export function resolvePreset(preset: RangePreset, today: Date): DateRange {
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  const endToday = toDateString(new Date(y, m, d));

  switch (preset) {
    // Inclusive of today, so "last 7 days" is a seven-day window and not an
    // eight-day one. Off-by-one here would overstate every trailing total.
    case "last7":
      return { startDate: toDateString(new Date(y, m, d - 6)), endDate: endToday };
    case "last30":
      return { startDate: toDateString(new Date(y, m, d - 29)), endDate: endToday };
    case "last90":
      return { startDate: toDateString(new Date(y, m, d - 89)), endDate: endToday };
    case "thisMonth":
      // Runs to the END of the month, not to today: the dashboard shows
      // projections as well as actuals, and a window that stopped at today would
      // cut off the bills the rest of the month is expecting.
      return {
        startDate: toDateString(new Date(y, m, 1)),
        endDate: toDateString(new Date(y, m + 1, 0)),
      };
    case "lastMonth":
      return {
        startDate: toDateString(new Date(y, m - 1, 1)),
        endDate: toDateString(new Date(y, m, 0)),
      };
    // Whole months back, ending with the current one in full, so the last column
    // of a monthly chart is this month rather than a partial stub.
    case "last6Months":
      return {
        startDate: toDateString(new Date(y, m - 5, 1)),
        endDate: toDateString(new Date(y, m + 1, 0)),
      };
    case "last12Months":
      return {
        startDate: toDateString(new Date(y, m - 11, 1)),
        endDate: toDateString(new Date(y, m + 1, 0)),
      };
    case "yearToDate":
      return { startDate: toDateString(new Date(y, 0, 1)), endDate: endToday };
    case "custom":
      return resolvePreset("last30", today);
  }
}

/** Inclusive day count. A single-day range is 1, never 0. */
export function dayCount(range: DateRange): number {
  const start = fromDateString(range.startDate);
  const end = fromDateString(range.endDate);
  // Both are local midnights, so the difference is a whole number of days —
  // except across a DST boundary, where it is off by an hour. Rounding absorbs
  // that; flooring would lose a day twice a year.
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
}

/**
 * The period immediately before this one, of the same length.
 *
 * Backs every "vs previous period" delta on the dashboard. Same LENGTH rather
 * than same calendar unit, which is the honest comparison for an arbitrary
 * window: a 17-day range compares against the 17 days before it. For a whole
 * calendar month the two coincide anyway.
 *
 * Ends the day BEFORE this range starts, so the two never share a day — an
 * overlap would count some money in both halves of a comparison.
 */
export function previousPeriod(range: DateRange): DateRange {
  const days = dayCount(range);
  const start = fromDateString(range.startDate);
  const prevEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1);
  const prevStart = new Date(
    prevEnd.getFullYear(),
    prevEnd.getMonth(),
    prevEnd.getDate() - (days - 1)
  );
  return { startDate: toDateString(prevStart), endDate: toDateString(prevEnd) };
}

/** How wide one column of a time chart is. */
export type Bucket = "day" | "week" | "month";

/**
 * The bucket size that gives a chart a readable number of columns.
 *
 * Thresholds chosen for the x-axis rather than for the data: past roughly eight
 * weeks, daily columns are too thin to carry a rounded data-end or a hit target,
 * and past a couple of years weekly columns run to three figures. The aim is
 * somewhere between about 7 and 60 columns for any range the control can produce.
 */
export function bucketFor(range: DateRange): Bucket {
  const days = dayCount(range);
  if (days <= 62) return "day";
  if (days <= 400) return "week";
  return "month";
}

/**
 * The bucket a day falls in, as a sortable key.
 *
 * Keys are "yyyy-mm-dd" for a day, the WEEK'S MONDAY for a week, and "yyyy-mm"
 * for a month — all of which sort lexicographically in chronological order, so
 * nothing downstream has to parse one back into a Date to order it.
 *
 * Weeks start Monday, not Sunday. The choice matters only for consistency, and
 * ISO is the one that does not vary by locale — a chart whose weeks moved
 * depending on the viewer would make two people's screenshots disagree.
 */
export function bucketKeyOf(dayString: string, bucket: Bucket): string {
  if (bucket === "day") return dayString;
  if (bucket === "month") return dayString.slice(0, 7);
  const date = fromDateString(dayString);
  // getDay() is 0 for Sunday; shift so Monday is 0 and Sunday is 6.
  const offset = (date.getDay() + 6) % 7;
  return toDateString(new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset));
}

/**
 * Every bucket key in the range, in order, INCLUDING the empty ones.
 *
 * The empty ones are the point. A chart built only from the buckets that have
 * rows draws a week with no spending as though it did not exist, closing the gap
 * and making the line continuous across a hole — which reads as "steady" when the
 * truth is "nothing happened". The axis has to come from the range, not from the
 * data.
 */
export function bucketKeysIn(range: DateRange, bucket: Bucket): string[] {
  const keys: string[] = [];
  const end = fromDateString(range.endDate);
  const cursor = fromDateString(range.startDate);

  if (bucket === "month") {
    const stop = new Date(end.getFullYear(), end.getMonth(), 1);
    const walk = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    while (walk <= stop) {
      keys.push(`${walk.getFullYear()}-${String(walk.getMonth() + 1).padStart(2, "0")}`);
      walk.setMonth(walk.getMonth() + 1);
    }
    return keys;
  }

  const step = bucket === "week" ? 7 : 1;
  // Weeks are walked from the first bucket's Monday, which may precede the
  // range's own start — otherwise the first column would be a partial week
  // misaligned with every column after it.
  const walk = bucket === "week" ? fromDateString(bucketKeyOf(range.startDate, "week")) : cursor;
  while (walk <= end) {
    keys.push(toDateString(walk));
    walk.setDate(walk.getDate() + step);
  }
  return keys;
}

/** A bucket key as an axis tick. Short, because an axis has no room. */
export function bucketLabel(key: string, bucket: Bucket): string {
  if (bucket === "month") {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, (month ?? 1) - 1, 1).toLocaleDateString(undefined, { month: "short" });
  }
  const date = fromDateString(key);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** A bucket key spelled out, for a tooltip, where there is room to be exact. */
export function bucketFullLabel(key: string, bucket: Bucket): string {
  if (bucket === "month") {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, (month ?? 1) - 1, 1).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }
  const date = fromDateString(key);
  const day = date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  if (bucket === "day") return day;
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 6);
  return `Week of ${day} – ${end.toLocaleDateString(undefined, { month: "long", day: "numeric" })}`;
}

/** The control's own summary of the active window. */
export function rangeLabel(range: DateRange): string {
  const start = fromDateString(range.startDate);
  const end = fromDateString(range.endDate);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startText = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const endText = end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startText} – ${endText}`;
}
