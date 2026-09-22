"use client";

import { useMemo } from "react";
import { Card, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { useBorders } from "@/context/BordersContext";
import { useCategoryColorsSetting } from "@/context/CategoryColorsContext";
import { effectiveColor, rowAccent, rowTint } from "@/lib/entityColor";
import {
  CATEGORICAL_HUE_COUNT,
  NEUTRAL_SERIES_COLOR,
  getSeriesColor,
  type SeriesColor,
} from "@/lib/chartColor";
import {
  type CurrencyCode,
  DEFAULT_CURRENCY,
  type Direction,
  formatMoney,
  formatPercent,
  shareOf,
} from "@/lib/money";
import type { Transaction } from "@/hooks/useTransactions";
import { DonutChart } from "./DonutChart";

interface CategoryBreakdownProps {
  transactions: Transaction[];
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
  currency?: CurrencyCode;
}

const UNCATEGORIZED = "Uncategorized";

interface BreakdownRow {
  key: string;
  label: string;
  totalMinor: number;
  count: number;
  /** The category's own identity color, or null for the uncategorized bucket. */
  identityColor: string | null;
  /** Theme-derived fallback used when category colors are switched off. */
  series: SeriesColor;
}

export function CategoryBreakdown({
  transactions,
  direction,
  onDirectionChange,
  currency = DEFAULT_CURRENCY,
}: CategoryBreakdownProps) {
  const { bordersEnabled } = useBorders();
  const { categoryColorsEnabled } = useCategoryColorsSetting();

  const { rows, totalMinor } = useMemo(() => {
    const relevant = transactions.filter((t) => t.direction === direction);

    const buckets = new Map<string, { totalMinor: number; count: number; color: string | null }>();
    for (const txn of relevant) {
      const name = txn.category?.name ?? UNCATEGORIZED;
      const existing = buckets.get(name);
      if (existing) {
        existing.totalMinor += txn.amountMinor;
        existing.count += 1;
      } else {
        buckets.set(name, {
          totalMinor: txn.amountMinor,
          count: 1,
          color: txn.category ? effectiveColor(txn.category.color, txn.category.name) : null,
        });
      }
    }

    const sorted = Array.from(buckets.entries())
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => b.totalMinor - a.totalMinor);

    // The palette has a fixed budget of distinguishable hues and must never
    // cycle — a ninth series reusing hue #1 reads as "same category" at a
    // glance, which is worse than not distinguishing them at all. Everything
    // past the budget is folded into one honest "Other" bucket instead.
    //
    // The fold leaves room for Other itself, so the visible count is
    // BUDGET - 1 whenever an overflow exists.
    const budget = CATEGORICAL_HUE_COUNT;
    const needsOther = sorted.length > budget;
    const visible = needsOther ? sorted.slice(0, budget - 1) : sorted;
    const overflow = needsOther ? sorted.slice(budget - 1) : [];

    const result: BreakdownRow[] = visible.map((entry, index) => ({
      key: entry.label,
      label: entry.label,
      totalMinor: entry.totalMinor,
      count: entry.count,
      identityColor: entry.color,
      series:
        entry.label === UNCATEGORIZED ? NEUTRAL_SERIES_COLOR : getSeriesColor(index),
    }));

    if (overflow.length > 0) {
      result.push({
        key: "__other__",
        label: `Other (${overflow.length})`,
        totalMinor: overflow.reduce((sum, e) => sum + e.totalMinor, 0),
        count: overflow.reduce((sum, e) => sum + e.count, 0),
        identityColor: null,
        series: NEUTRAL_SERIES_COLOR,
      });
    }

    return { rows: result, totalMinor: result.reduce((sum, r) => sum + r.totalMinor, 0) };
  }, [transactions, direction]);

  const slices = rows.map((row) => {
    // When category colors are on, a category's own hue is used so the donut,
    // the row tint and the sidebar dot all agree. When they're off, fall back
    // to the theme-derived series color rather than showing nothing — the
    // switch mutes *identity* colors, it doesn't turn the chart grey.
    const useIdentity = categoryColorsEnabled && row.identityColor;
    return {
      label: row.label,
      value: row.totalMinor,
      color: useIdentity ? row.identityColor! : row.series.color,
      filter: useIdentity ? undefined : row.series.filter,
    };
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">By category</h3>
        <ToggleButtonGroup
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[direction]}
          onSelectionChange={(keys) => {
            const next = Array.from(keys)[0];
            if (next === "INCOME" || next === "EXPENSE") onDirectionChange(next);
          }}
          size="sm"
          aria-label="Breakdown direction"
        >
          <ToggleButton id="EXPENSE">Spending</ToggleButton>
          <ToggleButton id="INCOME">Income</ToggleButton>
        </ToggleButtonGroup>
      </div>

      {rows.length === 0 ? (
        <p className="p-4 text-sm text-foreground/60">
          Nothing {direction === "INCOME" ? "earned" : "spent"} in this period.
        </p>
      ) : (
        <>
          <div className="flex shrink-0 justify-center">
            <DonutChart
              data={slices}
              size={160}
              thickness={34}
              centerLabel={formatMoney(totalMinor, currency)}
              centerSubLabel={direction === "INCOME" ? "earned" : "spent"}
            />
          </div>

          <div className="flex min-h-0 flex-col gap-1">
            {rows.map((row) => {
              const useIdentity = categoryColorsEnabled && row.identityColor;
              const share = shareOf(row.totalMinor, totalMinor);
              return (
                <Card
                  key={row.key}
                  className={`flex items-center gap-3 p-2.5 ${bordersEnabled ? "" : "border-none"}`}
                  style={
                    useIdentity
                      ? {
                          backgroundColor: rowTint(row.identityColor!),
                          borderLeft: `3px solid ${rowAccent(row.identityColor!)}`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor: useIdentity ? row.identityColor! : row.series.color,
                      filter: useIdentity ? undefined : row.series.filter,
                    }}
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">{row.label}</span>
                    <span className="text-xs text-foreground/50">
                      {row.count} {row.count === 1 ? "transaction" : "transactions"}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className="text-sm tabular-nums text-foreground">
                      {formatMoney(row.totalMinor, currency)}
                    </span>
                    <span className="text-xs tabular-nums text-foreground/50">
                      {formatPercent(share)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default CategoryBreakdown;
