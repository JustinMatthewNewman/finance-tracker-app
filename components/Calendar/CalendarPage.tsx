"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Chip } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import { useAuth } from "@/hooks/useAuth";
import { useBorders } from "@/context/BordersContext";
import { useCategoryColorsSetting } from "@/context/CategoryColorsContext";
import AmbientBackground from "@/components/AmbientBackground";
import { effectiveColor } from "@/lib/entityColor";
import { DEFAULT_CURRENCY, formatMoney, formatMoneyCompact, type Minor } from "@/lib/money";
import {
  addMonths,
  buildMonthGrid,
  currentMonthKey,
  formatDayHeading,
  monthLabel,
  relativeMonthLabel,
  type MonthKey,
} from "@/lib/monthRange";
import { ALL_MOCK_INCOME, MOCK_EXPENSES } from "@/lib/mockFinanceData";

// Calendar tab — a month grid of money in and out per day.
//
// Structurally this is Time Tracker Pro's calendar report (the one dropped
// when this app was cloned), rebuilt around transactions instead of hours:
// same Monday-first padded grid, same "cell scrolls its full list on hover"
// behaviour, same adjacent-month dimming.
//
// MOCK DATA ONLY for now (see lib/mockFinanceData.ts).

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface DayItem {
  id: string;
  label: string;
  amountMinor: Minor;
  direction: "INCOME" | "EXPENSE";
  /** Category/type identity colour, or null to fall back to neutral. */
  color: string | null;
}

interface DaySummary {
  items: DayItem[];
  incomeMinor: Minor;
  expenseMinor: Minor;
  /** income - expense. Negative means the day spent more than it took in. */
  netMinor: Minor;
}

function CalendarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { bordersEnabled } = useBorders();
  const { categoryColorsEnabled } = useCategoryColorsSetting();

  const [monthKey, setMonthKey] = useState<MonthKey>(currentMonthKey);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  const grid = useMemo(() => buildMonthGrid(monthKey), [monthKey]);

  // One pass over both mock sets, bucketed by day — rather than filtering the
  // full list once per cell, which is O(days × records) on every render.
  const byDay = useMemo(() => {
    const map = new Map<string, DaySummary>();

    const ensure = (dayKey: string): DaySummary => {
      let entry = map.get(dayKey);
      if (!entry) {
        entry = { items: [], incomeMinor: 0, expenseMinor: 0, netMinor: 0 };
        map.set(dayKey, entry);
      }
      return entry;
    };

    for (const r of ALL_MOCK_INCOME) {
      const e = ensure(r.addDate);
      e.items.push({
        id: r.id,
        label: r.incomeName,
        amountMinor: r.amountMinor,
        direction: "INCOME",
        color: effectiveColor(null, r.incomeType),
      });
      e.incomeMinor += r.amountMinor;
    }

    for (const r of MOCK_EXPENSES) {
      const e = ensure(r.dueDate);
      e.items.push({
        id: r.id,
        label: r.expenseName,
        amountMinor: r.amountMinor,
        direction: "EXPENSE",
        color: effectiveColor(null, r.category),
      });
      e.expenseMinor += r.amountMinor;
    }

    for (const e of map.values()) {
      e.netMinor = e.incomeMinor - e.expenseMinor;
      e.items.sort((a, b) => b.amountMinor - a.amountMinor);
    }
    return map;
  }, []);

  const monthTotals = useMemo(() => {
    let incomeMinor = 0;
    let expenseMinor = 0;
    for (const day of grid) {
      if (!day.isCurrentMonth) continue;
      const s = byDay.get(day.dayKey);
      if (!s) continue;
      incomeMinor += s.incomeMinor;
      expenseMinor += s.expenseMinor;
    }
    return { incomeMinor, expenseMinor, netMinor: incomeMinor - expenseMinor };
  }, [grid, byDay]);

  const selected = selectedDay ? byDay.get(selectedDay) : undefined;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }
  if (!user) return null; // redirect in flight

  return (
    <div className="relative flex h-full flex-col overflow-hidden p-4">
      <AmbientBackground intensity={0.85} />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <Card className={`flex min-h-0 flex-1 flex-col overflow-hidden ${bordersEnabled ? "" : "border-none"}`}>
          <div
            className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border p-4"
            data-glass="surface"
          >
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                isIconOnly
                aria-label="Previous month"
                onPress={() => setMonthKey((k) => addMonths(k, -1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="min-w-36 text-center">
                <div className="text-sm font-medium text-foreground">{relativeMonthLabel(monthKey)}</div>
                <div className="text-xs text-foreground/50">{monthLabel(monthKey)}</div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                isIconOnly
                aria-label="Next month"
                onPress={() => setMonthKey((k) => addMonths(k, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4 text-sm tabular-nums">
              <div className="flex flex-col items-end">
                <span className="text-xs text-foreground/50">In</span>
                <span className="text-success">{formatMoney(monthTotals.incomeMinor, DEFAULT_CURRENCY)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-foreground/50">Out</span>
                <span className="text-foreground">{formatMoney(monthTotals.expenseMinor, DEFAULT_CURRENCY)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-foreground/50">Net</span>
                <span
                  className={
                    monthTotals.netMinor > 0
                      ? "text-success"
                      : monthTotals.netMinor < 0
                        ? "text-danger"
                        : "text-foreground"
                  }
                >
                  {monthTotals.netMinor > 0 ? "+" : monthTotals.netMinor < 0 ? "−" : ""}
                  {formatMoney(Math.abs(monthTotals.netMinor), DEFAULT_CURRENCY)}
                </span>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-foreground/50">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {grid.map((day) => {
                const summary = byDay.get(day.dayKey);
                const hasItems = !!summary && summary.items.length > 0;
                const isSelected = selectedDay === day.dayKey;

                return (
                  <button
                    key={day.dayKey}
                    type="button"
                    disabled={!hasItems}
                    onClick={() => setSelectedDay(isSelected ? null : day.dayKey)}
                    className={`group flex h-32 w-full flex-col items-stretch gap-1 rounded-lg p-1.5 text-left transition-colors ${
                      // Muted rather than near-invisible: adjacent-month cells
                      // carry real data, so they have to stay readable while
                      // still reading as outside the month.
                      day.isCurrentMonth ? "" : "bg-default-50/50 opacity-60"
                    } ${bordersEnabled ? "border border-default-200" : ""} ${
                      isSelected ? "ring-2 ring-accent" : ""
                    } ${hasItems ? "cursor-pointer hover:bg-accent-soft" : "cursor-default"}`}
                  >
                    <div className="flex items-baseline justify-between gap-1">
                      <span
                        className={`text-[11px] tabular-nums ${
                          day.isCurrentMonth ? "text-foreground/60" : "text-foreground/40"
                        }`}
                      >
                        {day.date.getDate()}
                      </span>
                      {summary && summary.netMinor !== 0 && (
                        <span
                          className={`truncate text-[10px] tabular-nums ${
                            summary.netMinor > 0 ? "text-success" : "text-foreground/50"
                          }`}
                        >
                          {summary.netMinor > 0 ? "+" : "−"}
                          {formatMoneyCompact(Math.abs(summary.netMinor), DEFAULT_CURRENCY)}
                        </span>
                      )}
                    </div>

                    {/* Clipped at rest, scrollable while hovered — the list is
                        every item for the day, so the overflow is real content
                        to reach rather than a fixed truncation. */}
                    <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden group-hover:overflow-y-auto">
                      {!hasItems ? (
                        <span className="text-[10px] text-foreground/30">—</span>
                      ) : (
                        summary!.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex min-w-0 items-center gap-1 text-[10px] leading-tight"
                          >
                            <span
                              className="size-1.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  categoryColorsEnabled && item.color ? item.color : "var(--muted)",
                              }}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1 truncate text-foreground/80">
                              {item.label}
                            </span>
                            <span
                              className={`shrink-0 tabular-nums ${
                                item.direction === "INCOME" ? "text-success" : "text-foreground/50"
                              }`}
                            >
                              {item.direction === "INCOME" ? "+" : "−"}
                              {formatMoneyCompact(item.amountMinor, DEFAULT_CURRENCY)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selected && selectedDay && (
              <Card className="mt-4 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-foreground">
                    {formatDayHeading(selectedDay)}
                  </h2>
                  <span className="flex items-center gap-3 text-xs tabular-nums">
                    {selected.incomeMinor > 0 && (
                      <span className="text-success">
                        +{formatMoney(selected.incomeMinor, DEFAULT_CURRENCY)}
                      </span>
                    )}
                    {selected.expenseMinor > 0 && (
                      <span className="text-foreground/70">
                        −{formatMoney(selected.expenseMinor, DEFAULT_CURRENCY)}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {selected.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm"
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            categoryColorsEnabled && item.color ? item.color : "var(--muted)",
                        }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-foreground">{item.label}</span>
                      <Chip size="sm">{item.direction === "INCOME" ? "In" : "Out"}</Chip>
                      <span
                        className={`shrink-0 tabular-nums ${
                          item.direction === "INCOME" ? "text-success" : "text-foreground"
                        }`}
                      >
                        {item.direction === "INCOME" ? "+" : "−"}
                        {formatMoney(item.amountMinor, DEFAULT_CURRENCY)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default CalendarPage;
