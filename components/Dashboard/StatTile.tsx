"use client";

import { ArrowDown, ArrowUp } from "@gravity-ui/icons";
import { type CurrencyCode, formatPercent } from "@/lib/money";
import type { Delta } from "@/lib/analytics";
import { usePrivacyMode } from "@/context/PrivacyModeContext";

interface StatTileProps {
  label: string;
  valueMinor: number;
  currency: CurrencyCode;
  /** The comparison against the previous window of the same length. */
  delta?: Delta | null;
  /**
   * Whether a RISE in this figure is good.
   *
   * Explicit per tile rather than inferred from the sign, because the two point
   * opposite ways on one row: income up is good, spending up is not. Inferring it
   * would paint a 12% spending increase green.
   */
  riseIsGood?: boolean;
  /** Replaces the money figure — for a rate, which is not an amount. */
  overrideValue?: string;
  hint?: string;
  /** The one figure the dashboard leads with, at hero size. */
  isHero?: boolean;
}

/**
 * A headline number, its change, and nothing else.
 *
 * A STAT TILE, NOT A ONE-BAR CHART. Four of these in a row is the right form for
 * four headline figures — a grouped bar chart of them would spend four colours
 * saying what four numbers say better.
 *
 * The hero figure and the tile values use PROPORTIONAL figures, not
 * `tabular-nums`: equal-width digits make a large number look loose and gappy.
 * Tabular is for columns that have to align vertically, which is the table view
 * and the axis ticks, and those use it.
 */
export function StatTile({
  label,
  valueMinor,
  currency,
  delta,
  riseIsGood = true,
  overrideValue,
  hint,
  isHero = false,
}: StatTileProps) {
  const { formatAmount } = usePrivacyMode();

  const rose = delta ? delta.changeMinor > 0 : false;
  const flat = !delta || delta.changeMinor === 0;
  const good = rose === riseIsGood;

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate text-xs font-medium uppercase tracking-wide text-foreground/50">
        {label}
      </span>
      <span
        className={`truncate font-semibold text-foreground ${isHero ? "text-4xl" : "text-xl"}`}
      >
        {overrideValue ?? formatAmount(valueMinor, currency)}
      </span>

      {delta && !flat && (
        // Direction is carried by an arrow AND by colour, never colour alone — a
        // green number reads as "up" only if you can see green.
        <span
          className={`flex items-center gap-1 text-xs ${good ? "text-success" : "text-danger"}`}
        >
          {rose ? (
            <ArrowUp className="size-3 shrink-0" aria-hidden />
          ) : (
            <ArrowDown className="size-3 shrink-0" aria-hidden />
          )}
          <span className="tabular-nums">
            {delta.changeFraction == null
              ? formatAmount(Math.abs(delta.changeMinor), currency)
              : formatPercent(Math.abs(delta.changeFraction))}
          </span>
          <span className="truncate text-foreground/45">vs previous</span>
        </span>
      )}
      {delta && flat && <span className="text-xs text-foreground/40">No change vs previous</span>}
      {!delta && hint && <span className="truncate text-xs text-foreground/40">{hint}</span>}
    </div>
  );
}

export default StatTile;
