// The month window the member detail panel is showing.
//
// This is the structural replacement for the template's weekBuckets.ts. There
// the sidebar owned time (work logs were day-scoped, so the sidebar paged
// through weeks); here the sidebar owns *people* and the main panel owns
// time, so the month carousel lives next to the transaction list instead.
//
// EVERYTHING HERE IS LOCAL TIME, DELIBERATELY. Transaction.occurredOn is a
// Date (a calendar day, not an instant), and a purchase made on the 31st
// belongs to that month in the buyer's own timezone regardless of what UTC
// thinks. `new Date("2026-09-01")` parses as UTC midnight, which is the 31st
// of August for anyone west of Greenwich — so a month built that way silently
// drops or gains a day's transactions at its edges. Every constructor below
// takes explicit (year, month, day) parts, which JS interprets locally.

export interface MonthKey {
  year: number;
  /** 0-indexed, matching Date's getMonth(). */
  month: number;
}

export function monthKeyOf(date: Date): MonthKey {
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function currentMonthKey(): MonthKey {
  return monthKeyOf(new Date());
}

/** Steps by whole months. `addMonths({2026,0}, -1)` is December 2025. */
export function addMonths(key: MonthKey, delta: number): MonthKey {
  // Date normalizes out-of-range months for us (month 12 rolls to January of
  // the next year, month -1 to December of the previous), so this needs no
  // modular arithmetic of its own.
  const d = new Date(key.year, key.month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function isSameMonth(a: MonthKey, b: MonthKey): boolean {
  return a.year === b.year && a.month === b.month;
}

/**
 * "yyyy-mm-dd" for a local date, without going through toISOString().
 *
 * toISOString() converts to UTC first, which shifts the date across midnight
 * for most of the world — the exact bug this module exists to avoid. The date
 * parts are read locally and padded by hand instead.
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses a "yyyy-mm-dd" Date column value as a LOCAL calendar day. */
export function fromDateString(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export interface DateRange {
  /** "yyyy-mm-dd", inclusive. */
  startDate: string;
  /** "yyyy-mm-dd", inclusive. */
  endDate: string;
}

/**
 * The inclusive first and last day of a month.
 *
 * Day 0 of the *next* month is the last day of this one — which is how this
 * gets February and leap years right without a days-per-month table.
 */
export function monthRange(key: MonthKey): DateRange {
  return {
    startDate: toDateString(new Date(key.year, key.month, 1)),
    endDate: toDateString(new Date(key.year, key.month + 1, 0)),
  };
}

export function monthLabel(key: MonthKey): string {
  return new Date(key.year, key.month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function monthLabelShort(key: MonthKey): string {
  return new Date(key.year, key.month, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

/** "This month" / "Last month" / else the month name, for the panel heading. */
export function relativeMonthLabel(key: MonthKey): string {
  const now = currentMonthKey();
  if (isSameMonth(key, now)) return "This month";
  if (isSameMonth(key, addMonths(now, -1))) return "Last month";
  return monthLabel(key);
}

/** Groups rows by their local calendar day, for the date-grouped table. */
export function groupByDay<T>(rows: readonly T[], getDate: (row: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    // The Date column already arrives as "yyyy-mm-dd"; slicing rather than
    // round-tripping through Date avoids reintroducing a timezone shift for
    // the sake of a grouping key that is already in the right form.
    const key = getDate(row).slice(0, 10);
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }
  return groups;
}

export function formatDayHeading(dateString: string): string {
  return fromDateString(dateString).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export interface MonthGridDay {
  date: Date;
  /** "yyyy-mm-dd" */
  dayKey: string;
  /** False for the padding days borrowed from the adjacent months. */
  isCurrentMonth: boolean;
}

/**
 * A full Monday-first calendar grid for a month, padded with the trailing
 * days of the previous month and the leading days of the next so every row
 * is a complete week.
 *
 * Every date is built from local (year, month, day) parts for the reason
 * given at the top of this file — a grid built via `new Date("yyyy-mm-dd")`
 * is off by one day for anyone west of Greenwich, which shifts the entire
 * calendar by a column.
 */
export function buildMonthGrid(key: MonthKey): MonthGridDay[] {
  const first = new Date(key.year, key.month, 1);
  const last = new Date(key.year, key.month + 1, 0);

  // getDay() is 0=Sun..6=Sat; this grid is Monday-first, so Sunday needs 6
  // leading days rather than 0.
  const firstWeekday = first.getDay();
  const leading = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const lastWeekday = last.getDay();
  const trailing = lastWeekday === 0 ? 0 : 7 - lastWeekday;

  const days: MonthGridDay[] = [];
  const cursor = new Date(key.year, key.month, 1 - leading);
  const end = new Date(key.year, key.month, last.getDate() + trailing);

  while (cursor <= end) {
    days.push({
      date: new Date(cursor),
      dayKey: toDateString(cursor),
      isCurrentMonth: cursor.getMonth() === key.month && cursor.getFullYear() === key.year,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
