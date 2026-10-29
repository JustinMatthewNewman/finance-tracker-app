"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dropdown } from "@heroui/react";
import { Sliders } from "@gravity-ui/icons";
import AmbientBackground from "@/components/AmbientBackground";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholdRange } from "@/hooks/useHouseholdRange";
import { useUserSettings } from "@/context/UserSettingsContext";
import { usePrivacyMode } from "@/context/PrivacyModeContext";
import { DEFAULT_CURRENCY, formatPercent, isCurrencyCode } from "@/lib/money";
import {
  type DateRange,
  type RangePreset,
  bucketFor,
  dayCount,
  previousPeriod,
  rangeLabel,
  resolvePreset,
} from "@/lib/dateRange";
import { ledgerTotals } from "@/lib/ledgerTotals";
import {
  bucketSeries,
  breakdown,
  cumulative,
  dailyBurnMinor,
  delta,
  foldSlices,
  peakOutflowDay,
  savingsRate,
  stackedSeries,
} from "@/lib/analytics";
import { fromDateString } from "@/lib/monthRange";
import { RAMP_MAX_STEPS, getSeriesColor } from "@/lib/chartColor";
import { DateRangeControl } from "./DateRangeControl";
import { WidgetCard } from "./WidgetCard";
import { TrendChart } from "./TrendChart";
import { StackedBars3D } from "./StackedBars3D";
import { StackedBars2D } from "./StackedBars2D";
import { SeriesLegend } from "./SeriesLegend";
import { StatTile } from "./StatTile";
import { RankedBars } from "./RankedBars";
import {
  ALL_WIDGET_IDS,
  DASHBOARD_WIDGETS,
  type WidgetId,
  readHiddenWidgets,
  writeHiddenWidgets,
} from "./widgets";

const SPAN_CLASS: Record<string, string> = {
  full: "col-span-full",
  wide: "col-span-full xl:col-span-2",
  narrow: "col-span-full md:col-span-1",
};

/**
 * The household's whole picture for one window of time.
 *
 * ONE FILTER ROW, ABOVE EVERYTHING IT SCOPES. The range control at the top is the
 * only range on the page: every stat, chart and table below re-renders against
 * the same slice, which is what makes their figures reconcilable against each
 * other. A widget with its own date picker would be a different dashboard.
 *
 * ONE FETCH, WIDENED. The window the person chose and the window before it are
 * read together as a single range and split here, so the "vs previous" deltas
 * cost no second query — and, more importantly, no second useHouseholdRange,
 * which owns a useFamilyMembers() and must stay once per page.
 *
 * EVERY FIGURE COMES FROM lib/ledgerTotals.ts VIA lib/analytics.ts. Nothing in
 * this file adds up an amount itself. That is what keeps the dashboard agreeing
 * with the Income, Expenses, Calendar and Household pages, which were already
 * built on the same module.
 */
function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { currencyCode } = useUserSettings();
  const { formatAmount } = usePrivacyMode();
  const currency = isCurrencyCode(currencyCode) ? currencyCode : DEFAULT_CURRENCY;

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  // ── The window ──
  const [preset, setPreset] = useState<RangePreset>("last30");
  const [customRange, setCustomRange] = useState<DateRange | null>(null);

  const range = useMemo<DateRange>(
    () => (preset === "custom" && customRange ? customRange : resolvePreset(preset, new Date())),
    // `preset` and the stored custom pair are the real inputs; new Date() is
    // read once per change rather than per render, which is what keeps the
    // window stable between renders instead of drifting at midnight.
    [preset, customRange]
  );

  const previous = useMemo(() => previousPeriod(range), [range]);
  // The two windows as one read. Both halves come back resolved and are split
  // below by plain string compare, which works because "yyyy-mm-dd" sorts
  // chronologically.
  const fetchRange = useMemo<DateRange>(
    () => ({ startDate: previous.startDate, endDate: range.endDate }),
    [previous.startDate, range.endDate]
  );

  const {
    resolved,
    showInternalTransfers,
    familyMembers,
    loading,
    error,
  } = useHouseholdRange(fetchRange);

  const totalsOptions = useMemo(
    () => ({ includeInternalTransfers: showInternalTransfers }),
    [showInternalTransfers]
  );

  const inRange = useCallback(
    (day: string, window: DateRange) => day >= window.startDate && day <= window.endDate,
    []
  );
  const currentRows = useMemo(
    () => resolved.filter((t) => inRange(t.occurredOn, range)),
    [resolved, range, inRange]
  );
  const previousRows = useMemo(
    () => resolved.filter((t) => inRange(t.occurredOn, previous)),
    [resolved, previous, inRange]
  );

  const totals = useMemo(() => ledgerTotals(currentRows, totalsOptions), [currentRows, totalsOptions]);
  const prevTotals = useMemo(
    () => ledgerTotals(previousRows, totalsOptions),
    [previousRows, totalsOptions]
  );

  // ── Series ──
  const bucket = useMemo(() => bucketFor(range), [range]);
  const series = useMemo(
    () => bucketSeries(currentRows, range, bucket, totalsOptions),
    [currentRows, range, bucket, totalsOptions]
  );
  const running = useMemo(() => cumulative(series), [series]);

  const categoryKey = useCallback(
    (row: { category: { id: string; name: string } | null }) =>
      row.category ? { id: row.category.name, label: row.category.name } : null,
    []
  );
  const memberKey = useCallback(
    (row: { familyMemberId: string; familyMemberName: string }) => ({
      id: row.familyMemberId,
      label: row.familyMemberName,
    }),
    []
  );
  const merchantKey = useCallback(
    (row: { merchant: string | null }) =>
      row.merchant ? { id: row.merchant, label: row.merchant } : null,
    []
  );

  // Capped at the measured readable band count — three real categories plus the
  // folded "Other" — see RAMP_MAX_STEPS. The ranked list beside this chart is
  // where the full detail lives, and it needs no colour separation at all.
  const composition = useMemo(
    () =>
      stackedSeries(
        currentRows,
        range,
        bucket,
        "out",
        categoryKey,
        totalsOptions,
        RAMP_MAX_STEPS - 1
      ),
    [currentRows, range, bucket, categoryKey, totalsOptions]
  );
  const categorySlices = useMemo(
    () => foldSlices(breakdown(currentRows, "out", categoryKey, totalsOptions)),
    [currentRows, categoryKey, totalsOptions]
  );
  const memberSlices = useMemo(
    () => foldSlices(breakdown(currentRows, "out", memberKey, totalsOptions), 8),
    [currentRows, memberKey, totalsOptions]
  );
  const merchantSlices = useMemo(
    () => foldSlices(breakdown(currentRows, "out", merchantKey, totalsOptions, "No merchant"), 8),
    [currentRows, merchantKey, totalsOptions]
  );
  const peak = useMemo(() => peakOutflowDay(currentRows, totalsOptions), [currentRows, totalsOptions]);
  const rate = useMemo(() => savingsRate(totals), [totals]);

  // ── Which widgets are on ──
  const [hidden, setHidden] = useState<Set<WidgetId>>(() => new Set());
  useEffect(() => {
    // Read after mount, never during render: localStorage does not exist on the
    // server, and reading it in the initializer would make the first client
    // render disagree with the server's and throw a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHidden(readHiddenWidgets());
  }, []);

  const toggleWidget = useCallback((id: WidgetId) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeHiddenWidgets(next);
      return next;
    });
  }, []);

  const isOn = (id: WidgetId) => !hidden.has(id);

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-foreground/50">Loading…</span>
      </div>
    );
  }
  if (!user) return null; // redirect in flight

  const periodLabel = `${rangeLabel(range)} · ${dayCount(range)} days`;
  const inColor = getSeriesColor(2);
  const outColor = getSeriesColor(0);

  return (
    <div className="relative h-full overflow-hidden">
      <AmbientBackground intensity={0.85} />

      <div className="relative z-10 flex h-full flex-col overflow-hidden">
        {/* The filter row. One row, left-aligned, above everything it scopes. */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
            <DateRangeControl
              preset={preset}
              range={range}
              onPresetChange={setPreset}
              onCustomChange={(next) => {
                setCustomRange(next);
                setPreset("custom");
              }}
            />
            {!showInternalTransfers && totals.excludedTransferCount > 0 && (
              // A figure that omits rows the charts below it also omit is only
              // reconcilable by hand if it says so. Every screen that applies
              // this preference reports its count.
              <span className="text-xs text-foreground/50">
                Not counting {totals.excludedTransferCount} internal transfer
                {totals.excludedTransferCount === 1 ? "" : "s"}.
              </span>
            )}
          </div>

          <Dropdown>
            <Dropdown.Trigger aria-label="Choose which widgets to show">
              <span className="flex items-center gap-1.5">
                <Sliders className="size-4" aria-hidden />
                <span className="text-sm">Widgets</span>
              </span>
            </Dropdown.Trigger>
            <Dropdown.Popover>
              <Dropdown.Menu
                selectionMode="multiple"
                selectedKeys={ALL_WIDGET_IDS.filter(isOn)}
                onAction={(key) => toggleWidget(String(key) as WidgetId)}
              >
                {DASHBOARD_WIDGETS.map((w) => (
                  <Dropdown.Item key={w.id} id={w.id}>
                    {w.label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>

        {error && <p className="px-4 pb-2 text-sm text-danger">{error}</p>}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isOn("kpis") && (
              <div className={SPAN_CLASS.full}>
                <WidgetCard title="This period" subtitle={periodLabel} isStale={loading}>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-1 md:grid-cols-5">
                    {/* The net is the hero — it is the one figure the dashboard
                        leads with, and the only one that answers "are we ahead". */}
                    <StatTile
                      label="Net"
                      valueMinor={totals.netMinor}
                      currency={currency}
                      delta={delta(totals.netMinor, prevTotals.netMinor)}
                      riseIsGood
                      isHero
                    />
                    <StatTile
                      label="Money in"
                      valueMinor={totals.in.actualMinor}
                      currency={currency}
                      delta={delta(totals.in.actualMinor, prevTotals.in.actualMinor)}
                      riseIsGood
                    />
                    <StatTile
                      label="Money out"
                      valueMinor={totals.out.actualMinor}
                      currency={currency}
                      delta={delta(totals.out.actualMinor, prevTotals.out.actualMinor)}
                      // Spending up is not good news. Inferring this from the
                      // sign would paint a 12% rise green.
                      riseIsGood={false}
                    />
                    <StatTile
                      label="Saved"
                      valueMinor={0}
                      currency={currency}
                      overrideValue={rate == null ? "—" : formatPercent(rate)}
                      hint={rate == null ? "No income in this period" : "of money in"}
                    />
                    <StatTile
                      label="Per day"
                      valueMinor={dailyBurnMinor(totals, range)}
                      currency={currency}
                      hint="average spending"
                    />
                  </div>
                </WidgetCard>
              </div>
            )}

            {isOn("trend") && (
              <div className={SPAN_CLASS.wide}>
                <WidgetCard
                  title="Income & spending over time"
                  subtitle={`By ${bucket}`}
                  isStale={loading}
                  actions={
                    <ul className="flex items-center gap-3">
                      {[
                        { label: "In", c: inColor },
                        { label: "Out", c: outColor },
                      ].map((s) => (
                        <li key={s.label} className="flex items-center gap-1.5">
                          <span
                            className="h-0.5 w-3 rounded-full"
                            style={{ backgroundColor: s.c.color, filter: s.c.filter }}
                            aria-hidden
                          />
                          <span className="text-[11px] text-foreground/60">{s.label}</span>
                        </li>
                      ))}
                    </ul>
                  }
                  table={{
                    columns: [
                      { key: "period", label: "Period" },
                      { key: "in", label: "In", numeric: true },
                      { key: "out", label: "Out", numeric: true },
                      { key: "net", label: "Net", numeric: true },
                    ],
                    rows: series.map((b) => ({
                      period: b.key,
                      in: formatAmount(b.in.actualMinor, currency),
                      out: formatAmount(b.out.actualMinor, currency),
                      net: formatAmount(b.netMinor, currency),
                    })),
                  }}
                >
                  <TrendChart
                    bucketKeys={series.map((b) => b.key)}
                    bucket={bucket}
                    currency={currency}
                    series={[
                      {
                        id: "in",
                        label: "Money in",
                        values: series.map((b) => b.in.actualMinor),
                        color: inColor.color,
                        filter: inColor.filter,
                      },
                      {
                        id: "out",
                        label: "Money out",
                        values: series.map((b) => b.out.actualMinor),
                        color: outColor.color,
                        filter: outColor.filter,
                        // Only one series gets a fill, or they occlude each other.
                        area: true,
                      },
                    ]}
                  />
                </WidgetCard>
              </div>
            )}

            {isOn("cumulative") && (
              <div className={SPAN_CLASS.narrow}>
                <WidgetCard
                  title="Cumulative net"
                  subtitle="Running total, actuals only"
                  isStale={loading}
                  table={{
                    columns: [
                      { key: "period", label: "Period" },
                      { key: "net", label: "Running net", numeric: true },
                    ],
                    rows: running.map((c) => ({
                      period: c.key,
                      net: formatAmount(c.netMinor, currency),
                    })),
                  }}
                >
                  <TrendChart
                    bucketKeys={running.map((c) => c.key)}
                    bucket={bucket}
                    currency={currency}
                    height={200}
                    series={[
                      {
                        id: "net",
                        label: "Running net",
                        // Clamped at zero because the chart's y-scale starts
                        // there: a household whose running net goes negative
                        // would otherwise draw below the baseline and off the
                        // plot. The table view carries the signed figure.
                        values: running.map((c) => Math.max(0, c.netMinor)),
                        color: inColor.color,
                        filter: inColor.filter,
                        area: true,
                      },
                    ]}
                  />
                </WidgetCard>
              </div>
            )}

            {isOn("composition") && (
              <div className={SPAN_CLASS.wide}>
                <WidgetCard
                  title="Spending composition"
                  subtitle={`Top ${RAMP_MAX_STEPS - 1} categories per ${bucket}, rest folded`}
                  isStale={loading}
                  actions={<SeriesLegend slices={composition.slices} />}
                  table={{
                    columns: [
                      { key: "period", label: "Period" },
                      ...composition.slices.map((s) => ({
                        key: s.id,
                        label: s.label,
                        numeric: true,
                      })),
                    ],
                    rows: composition.bucketKeys.map((key) => ({
                      period: key,
                      ...Object.fromEntries(
                        composition.slices.map((s) => [
                          s.id,
                          formatAmount(composition.cells.get(`${key}|${s.id}`) ?? 0, currency),
                        ])
                      ),
                    })),
                  }}
                >
                  <StackedBars3D
                    stacked={composition}
                    bucket={bucket}
                    currency={currency}
                    fallback={
                      <StackedBars2D
                        stacked={composition}
                        bucket={bucket}
                        currency={currency}
                      />
                    }
                  />
                </WidgetCard>
              </div>
            )}

            {isOn("categories") && (
              <div className={SPAN_CLASS.narrow}>
                <WidgetCard
                  title="Categories"
                  subtitle="Spending, largest first"
                  isStale={loading}
                  table={{
                    columns: [
                      { key: "label", label: "Category" },
                      { key: "value", label: "Spent", numeric: true },
                      { key: "count", label: "Rows", numeric: true },
                    ],
                    rows: categorySlices.map((s) => ({
                      label: s.label,
                      value: formatAmount(s.valueMinor, currency),
                      count: String(s.count),
                    })),
                  }}
                >
                  <RankedBars slices={categorySlices} currency={currency} />
                </WidgetCard>
              </div>
            )}

            {isOn("members") && (
              <div className={SPAN_CLASS.narrow}>
                <WidgetCard
                  title="Who spent what"
                  subtitle={`${familyMembers.length} in the household`}
                  isStale={loading}
                  table={{
                    columns: [
                      { key: "label", label: "Person" },
                      { key: "value", label: "Spent", numeric: true },
                    ],
                    rows: memberSlices.map((s) => ({
                      label: s.label,
                      value: formatAmount(s.valueMinor, currency),
                    })),
                  }}
                >
                  {/* Monochrome, like the other rankings. Every row already
                      carries the person's NAME beside its bar, so identity is
                      text rather than hue — which is what the measurements in
                      lib/chartColor.ts say to do here: the accent-derived hues
                      cannot be told apart reliably, and nothing on this list
                      needs them to be. */}
                  <RankedBars slices={memberSlices} currency={currency} />
                </WidgetCard>
              </div>
            )}

            {isOn("merchants") && (
              <div className={SPAN_CLASS.narrow}>
                <WidgetCard
                  title="Top merchants"
                  subtitle="Where the money went"
                  isStale={loading}
                  table={{
                    columns: [
                      { key: "label", label: "Merchant" },
                      { key: "value", label: "Spent", numeric: true },
                      { key: "count", label: "Visits", numeric: true },
                    ],
                    rows: merchantSlices.map((s) => ({
                      label: s.label,
                      value: formatAmount(s.valueMinor, currency),
                      count: String(s.count),
                    })),
                  }}
                >
                  <RankedBars slices={merchantSlices} currency={currency} />
                </WidgetCard>
              </div>
            )}

            {isOn("projections") && (
              <div className={SPAN_CLASS.narrow}>
                <WidgetCard
                  title="Expected vs actual"
                  subtitle="What is still only forecast"
                  isStale={loading}
                >
                  <div className="flex flex-col gap-4 pt-1">
                    <StatTile
                      label="Expected in"
                      valueMinor={totals.in.expectedMinor}
                      currency={currency}
                      hint={`${formatAmount(totals.in.projectedMinor, currency)} still projected`}
                    />
                    <StatTile
                      label="Expected out"
                      valueMinor={totals.out.expectedMinor}
                      currency={currency}
                      hint={`${formatAmount(totals.out.projectedMinor, currency)} still projected`}
                    />
                    <StatTile
                      label="If every projection lands"
                      valueMinor={totals.expectedNetMinor}
                      currency={currency}
                      hint="expected net"
                    />
                    {peak && (
                      <div className="border-t border-border pt-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
                          Biggest day
                        </p>
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">
                            {formatAmount(peak.outMinor, currency)}
                          </span>{" "}
                          <span className="text-foreground/60">
                            on{" "}
                            {fromDateString(peak.dayKey).toLocaleDateString(undefined, {
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </WidgetCard>
              </div>
            )}
          </div>

          {ALL_WIDGET_IDS.every((id) => hidden.has(id)) && (
            <p className="py-16 text-center text-sm text-foreground/50">
              Every widget is hidden. Use <strong>Widgets</strong> above to bring some back.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
