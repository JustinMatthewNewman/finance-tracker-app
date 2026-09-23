// How a projected income or expense repeats, and for how long.
//
// A projected `Transaction` carrying a `recurrence` is a RULE rather than a
// single entry: its `occurredOn` is the first occurrence, and the app expands
// it into every matching day of whatever range is on screen. `recurrenceEndsOn`
// bounds that expansion; null means indefinitely. See the notes on both
// columns in dataconnect/schema/schema.gql for why this is expanded rather
// than materialised into one row per occurrence.
//
// DATES HERE ARE LOCAL CALENDAR DAYS, like everywhere else in this app.
// Nothing below constructs a Date from a "yyyy-mm-dd" string directly or
// round-trips through toISOString() — both shift the day across midnight for
// most of the world. Everything goes through lib/monthRange.ts.

import { fromDateString, toDateString } from "./monthRange";

export const RECURRENCES = ["WEEKLY", "BIWEEKLY", "MONTHLY", "YEARLY"] as const;
export type Recurrence = (typeof RECURRENCES)[number];

export function isRecurrence(value: string | null | undefined): value is Recurrence {
  return !!value && (RECURRENCES as readonly string[]).includes(value);
}

/** Narrows a `recurrence` read from the database. Unknown text means one-off. */
export function toRecurrence(value: string | null | undefined): Recurrence | null {
  return isRecurrence(value) ? value : null;
}

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  WEEKLY: "Every week",
  BIWEEKLY: "Every 2 weeks",
  MONTHLY: "Every month",
  YEARLY: "Every year",
};

/**
 * A hard ceiling on how many occurrences one rule may contribute to one
 * expansion.
 *
 * Nothing should ever reach it: the widest range the app renders is a month,
 * so a weekly rule yields five or six. It exists because the expansion loop is
 * driven by dates rather than by a count, and a bug in the step function —
 * one that failed to advance, say — would otherwise spin forever inside a
 * render. A capped wrong answer is recoverable; a hung tab is not.
 */
const MAX_OCCURRENCES_PER_RANGE = 400;

/**
 * Advances a date by one interval.
 *
 * MONTHLY and YEARLY clamp to the end of the target month, which is the whole
 * reason this is not a one-line setMonth call. JavaScript rolls overflow
 * forward: the 31st of January with its month set to February becomes the 3rd
 * of March, so a rule starting on the 31st would drift into the following
 * month and then keep drifting. A bill due on the 31st is due on the 28th in
 * February, not the 3rd of March.
 *
 * The clamp reads from the ORIGINAL day-of-month every time rather than from
 * the previous occurrence, so a rule starting on the 31st still lands on the
 * 31st in March after being clamped to the 28th in February. Stepping from
 * the clamped value would quietly pull the whole series back to the 28th.
 */
function addInterval(anchor: Date, recurrence: Recurrence, step: number): Date {
  switch (recurrence) {
    case "WEEKLY":
      return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 7 * step);
    case "BIWEEKLY":
      return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 14 * step);
    case "MONTHLY":
      return clampToMonth(anchor.getFullYear(), anchor.getMonth() + step, anchor.getDate());
    case "YEARLY":
      return clampToMonth(anchor.getFullYear() + step, anchor.getMonth(), anchor.getDate());
  }
}

/** The given day of the given month, pulled back to the last day if short. */
function clampToMonth(year: number, month: number, day: number): Date {
  // Day 0 of the next month is the last day of this one — the same trick
  // monthRange() uses, and it gets February and leap years right without a
  // table of month lengths.
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

export interface ExpansionInput {
  /** The rule's first occurrence, "yyyy-mm-dd". */
  occurredOn: string;
  recurrence: string | null;
  /** "yyyy-mm-dd", or null for indefinitely. */
  recurrenceEndsOn: string | null;
}

/**
 * Every day this rule falls on inside [rangeStart, rangeEnd], inclusive.
 *
 * Returns the row's own date alone when it does not recur, so callers can run
 * everything through here rather than branching. Returns nothing at all when
 * the rule has not started yet by rangeEnd, or finished before rangeStart.
 *
 * All comparisons are string comparisons on "yyyy-mm-dd", which sort the same
 * way they order chronologically — no parsing, and so no timezone to get
 * wrong. The only place a Date is built is the stepping itself.
 */
export function occurrencesInRange(
  rule: ExpansionInput,
  rangeStart: string,
  rangeEnd: string
): string[] {
  const recurrence = toRecurrence(rule.recurrence);

  if (!recurrence) {
    return rule.occurredOn >= rangeStart && rule.occurredOn <= rangeEnd ? [rule.occurredOn] : [];
  }

  // A rule that starts after the range, or stopped before it, contributes
  // nothing — checked before any date arithmetic.
  if (rule.occurredOn > rangeEnd) return [];
  if (rule.recurrenceEndsOn && rule.recurrenceEndsOn < rangeStart) return [];

  // The last day an occurrence may land on: whichever of the range's end and
  // the rule's own end comes first.
  const hardEnd =
    rule.recurrenceEndsOn && rule.recurrenceEndsOn < rangeEnd ? rule.recurrenceEndsOn : rangeEnd;

  const anchor = fromDateString(rule.occurredOn);
  const out: string[] = [];

  for (let step = 0; out.length < MAX_OCCURRENCES_PER_RANGE; step++) {
    const day = toDateString(addInterval(anchor, recurrence, step));
    if (day > hardEnd) break;
    if (day >= rangeStart) out.push(day);
  }
  return out;
}

/**
 * How many occurrences a rule produces between its start and its end.
 *
 * Only for showing the person what they are about to create ("13 entries
 * through 21 Mar"). Returns null for an open-ended rule, which is a real
 * answer — "indefinitely" — and not a failure.
 */
export function countOccurrences(rule: ExpansionInput): number | null {
  if (!toRecurrence(rule.recurrence)) return 1;
  if (!rule.recurrenceEndsOn) return null;
  return occurrencesInRange(rule, rule.occurredOn, rule.recurrenceEndsOn).length;
}

/**
 * A default end date for a new recurring projection: six months out.
 *
 * Not "indefinitely", deliberately. A forecast that runs forever is rarely
 * what somebody means the first time they set one up, and an end date that is
 * visible and adjustable teaches that the control exists. Six months is long
 * enough to be useful on a calendar and short enough to be obviously finite.
 */
export function defaultRecurrenceEnd(startDate: string): string {
  const start = fromDateString(startDate);
  return toDateString(clampToMonth(start.getFullYear(), start.getMonth() + 6, start.getDate()));
}
