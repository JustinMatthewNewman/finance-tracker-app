// Hiding amounts on screen.
//
// WHAT THIS IS AND IS NOT. It replaces every rendered figure with dots so that
// somebody glancing at the screen — over a shoulder, on a shared display, in a
// screenshot — cannot read the household's money. It is NOT a security
// boundary, and the difference matters enough to state plainly: the real amounts
// are still in the React tree, still in the network responses, and still
// recoverable from the page. Anyone with the device can turn it off. It defeats a
// glance, which is what it is for.
//
// WHY THE DOT COUNT IS FIXED rather than matched to the digits. A mask whose
// length tracked the amount would leak the magnitude, which is most of what is
// worth hiding: "••••" next to "••••••••" says one of these is a thousand times
// the other. Every masked figure is therefore identical regardless of its value.
//
// U+2022 BULLET rather than an asterisk, because it is what a password field
// renders and so reads as "deliberately hidden" rather than as a footnote
// marker or a loading state.

const BULLET = "•";

/** What every hidden amount renders as. */
export const MASKED_AMOUNT = BULLET.repeat(4);

/**
 * A masked amount that keeps the currency's shape, for places where a bare row
 * of dots would read as broken rather than hidden.
 *
 * The symbol is not sensitive — which currency a household uses is a setting,
 * not a figure — and keeping it makes a masked column still look like money.
 */
export function maskedMoney(currencySymbol = ""): string {
  return `${currencySymbol}${MASKED_AMOUNT}`;
}

/**
 * The currency symbol for a code, with no number attached.
 *
 * Derived from Intl by formatting zero and stripping everything that is not the
 * symbol, rather than from a hand-kept table — the same reasoning as
 * minorUnitsPerMajor in lib/money.ts. Returns "" if nothing survives, so a
 * locale that formats without a symbol degrades to bare dots rather than to
 * something malformed.
 */
export function currencySymbolOf(currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency })
      .format(0)
      .replace(/[\d\s., ]/g, "");
  } catch {
    return "";
  }
}
