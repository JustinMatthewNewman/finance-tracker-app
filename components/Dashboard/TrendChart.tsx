"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { Bucket } from "@/lib/dateRange";
import { bucketFullLabel, bucketLabel } from "@/lib/dateRange";
import { type CurrencyCode } from "@/lib/money";
import { usePrivacyMode } from "@/context/PrivacyModeContext";

export interface TrendSeries {
  id: string;
  label: string;
  /** One value per bucket, in bucket order. Minor units. */
  values: number[];
  /** A CSS color — a theme token, never a hex. See lib/chartColor.ts. */
  color: string;
  /** Optional CSS filter carrying the hue rotation that distinguishes a slot. */
  filter?: string;
  /** Fill under the line. At most one series should, or they occlude. */
  area?: boolean;
  /** Drawn as a dotted line: the same measure, but expected rather than actual. */
  projected?: boolean;
}

interface TrendChartProps {
  bucketKeys: string[];
  bucket: Bucket;
  series: TrendSeries[];
  currency: CurrencyCode;
  height?: number;
}

const PADDING = { top: 12, right: 12, bottom: 24, left: 12 };
/** The x-axis band, so the plot never borrows the tick labels' room. */
const AXIS_BAND = 18;

/**
 * Catmull-Rom through the points, emitted as a cubic Bézier path.
 *
 * SMOOTH, BUT NOT AT THE COST OF THE DATA. Catmull-Rom passes exactly through
 * every point, unlike a plain Bézier with invented control points, which drifts
 * off the values it is supposed to be drawing. The tension is held at a half so
 * the curve cannot overshoot into a dip the data does not contain — a spending
 * line that swings below zero between two positive days is drawing a refund that
 * never happened.
 */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** A rounded "nice" ceiling, so the axis tops out on a readable number. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]) {
    if (value <= magnitude * step) return magnitude * step;
  }
  return magnitude * 10;
}

/**
 * The dashboard's line chart: money over time, one line per series.
 *
 * ONE AXIS, ALWAYS. Every series here is money in the same currency, so they
 * share a scale and can be compared by eye. A second y-axis would invent a
 * correlation that is not in the data — the single most common way a chart lies —
 * so two measures of different kinds get two charts instead.
 *
 * Inline SVG rather than a charting library, matching DonutChart: the geometry is
 * a path and some ticks, and the library would arrive with its own palette to
 * fight the runtime ColorScheme.
 */
export function TrendChart({
  bucketKeys,
  bucket,
  series,
  currency,
  height = 220,
}: TrendChartProps) {
  const { formatAmount } = usePrivacyMode();
  const clipId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // A fixed viewBox with preserveAspectRatio="none" would stretch the 2px
  // strokes; instead the chart measures itself in viewBox units and scales via
  // CSS width, keeping stroke widths honest.
  const width = 600;
  const plotHeight = height - AXIS_BAND;
  const innerWidth = width - PADDING.left - PADDING.right;
  const innerHeight = plotHeight - PADDING.top - PADDING.bottom;

  const max = useMemo(() => {
    const peak = series.reduce(
      (m, s) => Math.max(m, s.values.reduce((n, v) => Math.max(n, v), 0)),
      0
    );
    return niceMax(peak);
  }, [series]);

  const xAt = (i: number) =>
    PADDING.left + (bucketKeys.length <= 1 ? innerWidth / 2 : (i / (bucketKeys.length - 1)) * innerWidth);
  const yAt = (v: number) => PADDING.top + innerHeight - (v / max) * innerHeight;

  // Four gridlines is enough to read a value off and few enough to stay
  // recessive. Solid hairlines — a dashed grid reads as "threshold".
  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);

  // Enough ticks to orient without colliding. The first and last always show, so
  // the reader knows the window's ends even when the middle is thinned out.
  const tickStep = Math.max(1, Math.ceil(bucketKeys.length / 7));

  const handleMove = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg || bucketKeys.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const x = ratio * width;
    // Nearest bucket, not the one under the pointer: readers aim at a date, never
    // at a 2px line.
    const i = Math.round(((x - PADDING.left) / innerWidth) * (bucketKeys.length - 1));
    setHoverIndex(Math.max(0, Math.min(bucketKeys.length - 1, i)));
  };

  const hovered = hoverIndex != null ? bucketKeys[hoverIndex] : null;

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full"
        style={{ height }}
        shapeRendering="geometricPrecision"
        role="img"
        aria-label={`${series.map((s) => s.label).join(" and ")} over time`}
        onPointerMove={(e) => handleMove(e.clientX)}
        onPointerLeave={() => setHoverIndex(null)}
        // Keyboard reaches the same readout as hover, rather than the values
        // being pointer-only.
        tabIndex={0}
        onFocus={() => setHoverIndex(bucketKeys.length - 1)}
        onBlur={() => setHoverIndex(null)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          setHoverIndex((prev) => {
            const base = prev ?? bucketKeys.length - 1;
            return Math.max(0, Math.min(bucketKeys.length - 1, base + (e.key === "ArrowRight" ? 1 : -1)));
          });
        }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={PADDING.left} y={0} width={innerWidth} height={plotHeight} />
          </clipPath>
        </defs>

        {gridValues.map((v) => (
          <line
            key={v}
            x1={PADDING.left}
            x2={width - PADDING.right}
            y1={yAt(v)}
            y2={yAt(v)}
            stroke="var(--border)"
            strokeWidth={1}
            // The baseline reads one step stronger than the grid above it.
            opacity={v === 0 ? 0.9 : 0.35}
          />
        ))}

        {hovered != null && (
          <line
            x1={xAt(hoverIndex!)}
            x2={xAt(hoverIndex!)}
            y1={PADDING.top}
            y2={PADDING.top + innerHeight}
            stroke="var(--muted)"
            strokeWidth={1}
            opacity={0.5}
          />
        )}

        <g clipPath={`url(#${clipId})`}>
          {series.map((s) => {
            const points = s.values.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
            const line = smoothPath(points);
            return (
              <g key={s.id} style={s.filter ? { filter: s.filter } : undefined}>
                {s.area && points.length > 1 && (
                  <path
                    d={`${line} L ${points[points.length - 1].x} ${yAt(0)} L ${points[0].x} ${yAt(0)} Z`}
                    fill={s.color}
                    // Low enough that a second series' line stays readable
                    // through it, and that the gridlines are not erased.
                    opacity={0.12}
                  />
                )}
                <path
                  d={line}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={s.projected ? "4 4" : undefined}
                  opacity={s.projected ? 0.75 : 1}
                />
              </g>
            );
          })}
        </g>

        {/* End-dot on each series: the selective direct label the spec asks for
            — the endpoint is the value a trend chart is read for. A 2px ring in
            the surface colour keeps two overlapping dots separable. */}
        {series.map((s) => {
          const i = hoverIndex ?? s.values.length - 1;
          if (i < 0 || s.values.length === 0) return null;
          return (
            <circle
              key={s.id}
              cx={xAt(i)}
              cy={yAt(s.values[i] ?? 0)}
              r={4}
              fill={s.color}
              stroke="var(--surface)"
              strokeWidth={2}
              style={s.filter ? { filter: s.filter } : undefined}
            />
          );
        })}

        {bucketKeys.map((key, i) =>
          i % tickStep === 0 || i === bucketKeys.length - 1 ? (
            <text
              key={key}
              x={xAt(i)}
              y={plotHeight + 12}
              textAnchor={i === 0 ? "start" : i === bucketKeys.length - 1 ? "end" : "middle"}
              className="fill-foreground/45"
              style={{ fontSize: 10, fontVariantNumeric: "tabular-nums" }}
            >
              {bucketLabel(key, bucket)}
            </text>
          ) : null
        )}

        <text
          x={PADDING.left}
          y={PADDING.top - 2}
          className="fill-foreground/40"
          style={{ fontSize: 10, fontVariantNumeric: "tabular-nums" }}
        >
          {formatAmount(max, currency)}
        </text>
      </svg>

      {/* The readout. Values lead and labels follow — the reader already has the
          series and wants the number. Keyed with a short stroke of the series
          colour rather than a filled box, which at this density would be
          data-weight ink doing a label's job. */}
      {hovered != null && (
        <div
          className="pointer-events-none absolute top-0 z-10 min-w-36 rounded-lg border border-border bg-overlay p-2 shadow-lg"
          style={{
            left: `${(xAt(hoverIndex!) / width) * 100}%`,
            transform:
              hoverIndex! > bucketKeys.length / 2 ? "translateX(calc(-100% - 8px))" : "translateX(8px)",
          }}
        >
          <p className="mb-1 text-[11px] font-medium text-foreground/60">
            {bucketFullLabel(hovered, bucket)}
          </p>
          {series.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-0.5 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color, filter: s.filter }}
                  aria-hidden
                />
                <span className="text-[11px] text-foreground/60">{s.label}</span>
              </span>
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {formatAmount(s.values[hoverIndex!] ?? 0, currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TrendChart;
