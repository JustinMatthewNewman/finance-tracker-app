"use client";

import { useState } from "react";
import type { Bucket } from "@/lib/dateRange";
import { bucketFullLabel, bucketLabel } from "@/lib/dateRange";
import { type CurrencyCode } from "@/lib/money";
import { type StackedSeries } from "@/lib/analytics";
import { rgbToCss } from "@/lib/chartColor";
import { useChartRamp } from "@/hooks/useChartRamp";
import { usePrivacyMode } from "@/context/PrivacyModeContext";

interface StackedBars2DProps {
  stacked: StackedSeries;
  bucket: Bucket;
  currency: CurrencyCode;
  height?: number;
}

/**
 * The flat stacked bar chart.
 *
 * Two jobs, one component: it is what performance mode and a missing WebGL
 * context fall back to, and it is the honest default for reading exact values off
 * a stack. Neither is a lesser version of the other — the 3D one is better at
 * "what shape is this period", this one at "how much was groceries in week 3".
 *
 * Marks follow the spec: a column capped so the band keeps its air, a 2px gap in
 * the surface colour between touching segments rather than a border around each,
 * and a rounded cap on the top segment only — the data-end — with the baseline
 * end left square.
 *
 * Bands wear a ONE-HUE ORDINAL RAMP, not the categorical hues. See the note
 * above ordinalRamp in lib/chartColor.ts for the measurements behind that: the
 * accent-derived hue wheel cannot separate adjacent bands in any of the four
 * themes, and six touching bands is the worst case for it. The ramp also encodes
 * something true — the bands are ranked largest to smallest, and the ramp runs
 * dark to light in that order.
 */
export function StackedBars2D({ stacked, bucket, currency, height = 240 }: StackedBars2DProps) {
  const { formatAmount } = usePrivacyMode();
  const [hover, setHover] = useState<{ bucketIndex: number; sliceId: string } | null>(null);
  const { bucketKeys, slices, cells, maxBucketMinor, bucketTotalsMinor } = stacked;
  const { ramp, probeRef } = useChartRamp(slices.length);

  if (maxBucketMinor <= 0) {
    return (
      <p className="py-10 text-center text-sm text-foreground/50">
        Nothing to chart in this period.
      </p>
    );
  }

  const hoveredSlice = hover ? slices.find((s) => s.id === hover.sliceId) : null;
  const hoveredValue =
    hover && hoveredSlice ? cells.get(`${bucketKeys[hover.bucketIndex]}|${hoveredSlice.id}`) ?? 0 : 0;

  return (
    <div className="relative">
      {/* The probe the ramp reads its tokens through — in the tree so it
          inherits the custom properties actually in force. */}
      <span ref={probeRef} className="hidden" aria-hidden />
      <div className="flex items-end gap-[2px]" style={{ height }}>
        {bucketKeys.map((bucketKey, bucketIndex) => {
          const total = bucketTotalsMinor[bucketIndex];
          const columnHeight = (total / maxBucketMinor) * 100;
          // Stacked bottom-up in the slices' fixed order, so a band stays in the
          // same position in every column and the eye can follow it across.
          const segments = slices
            .map((slice, sliceIndex) => ({
              slice,
              sliceIndex,
              value: cells.get(`${bucketKey}|${slice.id}`) ?? 0,
            }))
            .filter((s) => s.value > 0);

          return (
            <div
              key={bucketKey}
              className="group flex h-full min-w-0 flex-1 flex-col justify-end"
              // The hit target is the whole column, not the painted pixels — a
              // thin segment is otherwise a pinpoint nobody lands on.
              onPointerLeave={() => setHover(null)}
            >
              <div
                className="relative flex w-full flex-col justify-end overflow-hidden"
                style={{ height: `${columnHeight}%`, minHeight: total > 0 ? 2 : 0 }}
              >
                {segments
                  .slice()
                  .reverse()
                  .map(({ slice, sliceIndex, value }, positionFromTop) => {
                    const color = rgbToCss(ramp[sliceIndex] ?? ramp[ramp.length - 1] ?? { r: 128, g: 128, b: 128 });
                    const share = (value / total) * 100;
                    const isTop = positionFromTop === 0;
                    return (
                      <button
                        key={slice.id}
                        type="button"
                        aria-label={`${slice.label}, ${bucketFullLabel(bucketKey, bucket)}`}
                        onPointerEnter={() => setHover({ bucketIndex, sliceId: slice.id })}
                        onFocus={() => setHover({ bucketIndex, sliceId: slice.id })}
                        onBlur={() => setHover(null)}
                        className="w-full shrink-0 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-accent"
                        style={{
                          height: `${share}%`,
                          backgroundColor: color,
                          // The 2px separation is a surface-coloured gap, not a
                          // border: a border would add ink around every segment.
                          marginBottom: isTop ? 0 : undefined,
                          borderTop: isTop ? undefined : "2px solid var(--surface)",
                          // 4px rounded data-end, square at the baseline.
                          borderTopLeftRadius: isTop ? 4 : 0,
                          borderTopRightRadius: isTop ? 4 : 0,
                        }}
                      />
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-1 flex justify-between px-0.5">
        {bucketKeys.map((key, i) =>
          i === 0 || i === bucketKeys.length - 1 || i === Math.floor(bucketKeys.length / 2) ? (
            <span key={key} className="text-[10px] tabular-nums text-foreground/45">
              {bucketLabel(key, bucket)}
            </span>
          ) : null
        )}
      </div>

      {hover && hoveredSlice && (
        <div className="pointer-events-none absolute left-2 top-2 rounded-lg border border-border bg-overlay p-2 shadow-lg">
          <p className="text-[11px] font-medium text-foreground/60">
            {bucketFullLabel(bucketKeys[hover.bucketIndex], bucket)}
          </p>
          <p className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatAmount(hoveredValue, currency)}
            </span>
            <span className="text-[11px] text-foreground/60">{hoveredSlice.label}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default StackedBars2D;
