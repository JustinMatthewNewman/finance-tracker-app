"use client";

import { type CurrencyCode, shareOf } from "@/lib/money";
import { type Slice } from "@/lib/analytics";
import { usePrivacyMode } from "@/context/PrivacyModeContext";

interface RankedBarsProps {
  slices: readonly Slice[];
  currency: CurrencyCode;
  emptyLabel?: string;
}

/**
 * A ranked horizontal bar list — categories, merchants, members.
 *
 * HORIZONTAL, AND A BAR RATHER THAN A DONUT. Category names are long, which is
 * what horizontal bars are for; and a donut is only honest for part-to-whole at a
 * glance with few segments — the moment somebody wants to compare the second and
 * third slices, which is the whole job here, a bar is strictly better.
 *
 * ONE COLOUR FOR EVERY BAR, deliberately. Colouring each bar darker where bigger
 * would double-encode length as hue and burn the only free channel on
 * information the chart already shows. And a categorical hue per row would buy
 * nothing it does not already have: every row carries its own label in text
 * beside the bar, so identity is already non-colour. Categorical colour is for
 * when a mark has to be recognised somewhere else — which is the stacked chart,
 * and that uses an ordinal ramp for the reasons measured in lib/chartColor.ts.
 */
export function RankedBars({
  slices,
  currency,
  emptyLabel = "Nothing in this period.",
}: RankedBarsProps) {
  const { formatAmount } = usePrivacyMode();
  if (slices.length === 0) {
    return <p className="py-6 text-sm text-foreground/50">{emptyLabel}</p>;
  }

  const total = slices.reduce((n, s) => n + s.valueMinor, 0);
  const max = slices.reduce((n, s) => Math.max(n, s.valueMinor), 0);

  return (
    <ul className="flex flex-col gap-2">
      {slices.map((slice) => {
        return (
          <li key={slice.id} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-xs text-foreground/80">{slice.label}</span>
              <span className="flex shrink-0 items-baseline gap-1.5">
                <span className="text-xs font-semibold tabular-nums text-foreground">
                  {formatAmount(slice.valueMinor, currency)}
                </span>
                <span className="text-[10px] tabular-nums text-foreground/40">
                  {Math.round(shareOf(slice.valueMinor, total) * 100)}%
                </span>
              </span>
            </div>
            {/* The track is the full width, so the bars read against a common
                scale rather than each against itself. */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-default">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${max > 0 ? (slice.valueMinor / max) * 100 : 0}%`,
                  backgroundColor: "var(--accent)",
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default RankedBars;
