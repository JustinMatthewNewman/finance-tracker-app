"use client";

import { type Slice } from "@/lib/analytics";
import { rgbToCss } from "@/lib/chartColor";
import { useChartRamp } from "@/hooks/useChartRamp";

/**
 * The legend every multi-series chart here carries.
 *
 * ALWAYS PRESENT FOR TWO OR MORE SERIES — identity is never colour alone. The
 * swatch is a rect because it keys a filled mark (a bar or an area); the line
 * chart's tooltip uses a short stroke instead, matching ITS mark.
 *
 * Labels wear text tokens, never the series colour: the swatch beside a name
 * carries the identity, and colouring the text as well makes a legend that reads
 * as decoration and fails contrast at small sizes.
 *
 * Draws from the SAME ramp the charts do, in the same slice order — so a swatch
 * is the shade its band actually has. Keying a legend from a second colour
 * source is how a legend comes to describe a chart it no longer matches.
 */
export function SeriesLegend({ slices }: { slices: readonly Slice[] }) {
  const { ramp, probeRef } = useChartRamp(slices.length);
  if (slices.length < 2) return null;
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span ref={probeRef} className="hidden" aria-hidden />
      {slices.map((slice, index) => (
        <li key={slice.id} className="flex items-center gap-1.5">
          <span
            className="size-2.5 shrink-0 rounded-sm"
            style={{
              backgroundColor: rgbToCss(ramp[index] ?? ramp[ramp.length - 1] ?? { r: 128, g: 128, b: 128 }),
            }}
            aria-hidden
          />
          <span className="text-[11px] text-foreground/60">{slice.label}</span>
        </li>
      ))}
    </ul>
  );
}

export default SeriesLegend;
