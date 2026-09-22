// Money: the single place minor units are converted to and from anything else.
//
// THE RULE: an amount is an integer number of minor units (cents for USD).
// It is never a float, never a Number holding 12.34, and never parsed with
// `parseFloat(x) * 100`. Binary floating point cannot represent 0.1, so
// `12.34 * 100` is 1233.9999999999998 — truncate that and a cent vanishes,
// round it and you have merely hidden the problem until the next value.
// A ledger that is off by a cent after forty rows is worse than no ledger,
// because it is wrong in a way nobody notices until they reconcile.
//
// Everything below therefore works on integers and only ever produces a
// decimal at the last moment, for display.

export type Minor = number;

/** ISO 4217 codes the currency picker offers. Display only — see below. */
export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export function isCurrencyCode(value: string | null | undefined): value is CurrencyCode {
  return !!value && (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

/**
 * How many minor units make one major unit.
 *
 * Not always 100 — JPY has no minor unit at all, so ¥500 is 500 minor units,
 * not 50000. Hardcoding /100 would inflate every yen amount by 100x. Derived
 * from Intl rather than a hand-kept table so a currency added to
 * SUPPORTED_CURRENCIES later is automatically correct.
 */
export function minorUnitsPerMajor(currency: CurrencyCode): number {
  const digits =
    Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  return 10 ** digits;
}

/**
 * Parses what a person typed into integer minor units.
 *
 * Returns null for anything that isn't a non-negative amount — the caller
 * shows a validation message rather than silently storing a zero, because a
 * transaction that quietly becomes 0.00 is far worse than one that refuses to
 * save.
 *
 * Deliberately string-based rather than `Math.round(parseFloat(x) * 100)`:
 * splitting on the decimal point and padding the fraction keeps the whole
 * path in integer arithmetic, so "12.34" is exactly 1234 rather than a round
 * of 1233.9999999999998 that merely happens to land right.
 *
 * Accepts thousands separators and a leading currency symbol, since people
 * paste from statements. Rejects a negative sign: direction is a separate
 * field (see Transaction.direction), and letting a minus in here would create
 * a second, contradictory way to express an expense.
 */
export function parseAmountToMinor(input: string, currency: CurrencyCode = DEFAULT_CURRENCY): Minor | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Reject a negative BEFORE the currency-symbol strip below, which removes
  // every leading non-digit and would otherwise silently discard the sign —
  // turning "-5.00" into 500. Accounting parentheses ("(5.00)") are rejected
  // for the same reason. Direction is a separate field, so a sign here is
  // either a mistake or a second, contradictory way to say "expense"; both
  // deserve a validation message rather than a quietly flipped amount.
  if (/[-\u2212]/.test(trimmed) || /^\(.*\)$/.test(trimmed)) return null;

  const cleaned = trimmed.replace(/[\s,_]/g, "").replace(/^[^\d.]*/, "");
  if (!cleaned) return null;
  if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === ".") return null;

  const per = minorUnitsPerMajor(currency);
  const digits = Math.round(Math.log10(per));
  const [whole = "0", fraction = ""] = cleaned.split(".");

  // More typed decimals than the currency has is a typo, not an amount to
  // silently round — "1.999" in USD is almost certainly a mis-key, and
  // quietly storing 2.00 hides it.
  if (fraction.length > digits) return null;

  const padded = fraction.padEnd(digits, "0");
  const minor = Number(whole) * per + Number(padded || "0");
  return Number.isSafeInteger(minor) ? minor : null;
}

/** Minor units to a plain decimal string ("1234" -> "12.34"), for form inputs. */
export function minorToInput(minor: Minor, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  const per = minorUnitsPerMajor(currency);
  const digits = Math.round(Math.log10(per));
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  if (digits === 0) return `${sign}${abs}`;
  return `${sign}${Math.trunc(abs / per)}.${String(abs % per).padStart(digits, "0")}`;
}

/**
 * Minor units to a localized display string ("$12.34").
 *
 * The division by `per` here is the one place a float appears, and it is safe:
 * it happens once, at the end, purely to hand Intl a number to format. No
 * further arithmetic is done on the result.
 */
export function formatMoney(minor: Minor, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
    minor / minorUnitsPerMajor(currency)
  );
}

/** Compact form for dense tables and chart labels ("$1.2k"). */
export function formatMoneyCompact(minor: Minor, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(minor / minorUnitsPerMajor(currency));
}

// ─── Direction ──────────────────────────────────────────────────────────────

export const DIRECTIONS = ["INCOME", "EXPENSE"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export function isDirection(value: string | null | undefined): value is Direction {
  return !!value && (DIRECTIONS as readonly string[]).includes(value);
}

/**
 * Coerces a stored direction, defaulting to EXPENSE.
 *
 * The column is plain text with no database constraint (Data Connect has no
 * enum or CHECK), so a hand-edited row can hold anything. Defaulting to
 * EXPENSE rather than throwing is the safer failure: an unknown row shows up
 * as money out, which is conservative — the opposite default would inflate
 * somebody's apparent income.
 */
export function normalizeDirection(value: string | null | undefined): Direction {
  return isDirection(value) ? value : "EXPENSE";
}

export interface Totalable {
  amountMinor: Minor;
  direction: string;
}

export interface Totals {
  incomeMinor: Minor;
  expenseMinor: Minor;
  /** income - expense. Negative means the period spent more than it earned. */
  netMinor: Minor;
}

/**
 * Sums a set of rows into income, expense and net.
 *
 * Income and expense are kept apart rather than netted into one signed
 * running total, so "spent this month" stays answerable. Netting as you go
 * makes a refund look like reduced spending, which is true of the net and
 * false of the expense figure people actually budget against.
 */
export function sumTotals(rows: readonly Totalable[]): Totals {
  let incomeMinor = 0;
  let expenseMinor = 0;
  for (const row of rows) {
    if (normalizeDirection(row.direction) === "INCOME") incomeMinor += row.amountMinor;
    else expenseMinor += row.amountMinor;
  }
  return { incomeMinor, expenseMinor, netMinor: incomeMinor - expenseMinor };
}

/**
 * What fraction of `total` `part` is, as 0-1.
 *
 * Guards the zero denominator explicitly: in JS `0/0` is NaN, which formats
 * as "NaN%" on screen rather than throwing, so an empty month would render a
 * row of NaNs instead of an empty state.
 */
export function shareOf(part: Minor, total: Minor): number {
  if (total === 0) return 0;
  return part / total;
}

export function formatPercent(fraction: number): string {
  return new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 }).format(fraction);
}
