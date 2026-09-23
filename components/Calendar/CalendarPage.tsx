"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Chip } from "@heroui/react";
import { ChevronLeft, ChevronRight, Plus } from "@gravity-ui/icons";
import { useAuth } from "@/hooks/useAuth";
import { useBorders } from "@/context/BordersContext";
import { useCategoryColorsSetting } from "@/context/CategoryColorsContext";
import { useUserSettings } from "@/context/UserSettingsContext";
import { useHouseholdMonth } from "@/hooks/useHouseholdMonth";
import AmbientBackground from "@/components/AmbientBackground";
import { TransactionForm } from "@/components/Finance/TransactionForm";
import type { Transaction, TransactionInput } from "@/hooks/useTransactions";
import { effectiveColor } from "@/lib/entityColor";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  formatMoneyCompact,
  isCurrencyCode,
  type Minor,
} from "@/lib/money";
import {
  addMonths,
  buildMonthGrid,
  currentMonthKey,
  formatDayHeading,
  monthLabel,
  relativeMonthLabel,
  type MonthKey,
} from "@/lib/monthRange";

// Calendar tab — a month grid of money in and out per day.
//
// Structurally this is Time Tracker Pro's calendar report (the one dropped
// when this app was cloned), rebuilt around transactions instead of hours:
// same Monday-first padded grid, same "cell scrolls its full list on hover"
// behaviour, same adjacent-month dimming.
//
// WHAT THIS PAGE IS FOR. It is the one place the household looks forward
// rather than back, so a projected item — an expected paycheque, a bill due
// on the 28th — has to be visible here as clearly as something that already
// happened, and just as clearly NOT be mistaken for it. Every total on this
// page is therefore split: what has moved, and what is still expected. A
// single blended figure would quietly tell somebody they have money they do
// not yet have.

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface DayItem {
  id: string;
  label: string;
  amountMinor: Minor;
  direction: "INCOME" | "EXPENSE";
  color: string | null;
  projected: boolean;
  isMine: boolean;
  memberName: string;
  txn: Transaction;
}

interface DaySummary {
  items: DayItem[];
  /** Money that actually moved. */
  incomeMinor: Minor;
  expenseMinor: Minor;
  /** Money still only expected. */
  projectedIncomeMinor: Minor;
  projectedExpenseMinor: Minor;
  /** Net of what has actually happened. */
  netMinor: Minor;
}

function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { bordersEnabled } = useBorders();
  const { categoryColorsEnabled } = useCategoryColorsSetting();
  const { currencyCode } = useUserSettings();

  const [monthKey, setMonthKey] = useState<MonthKey>(currentMonthKey);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [formDay, setFormDay] = useState<string | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    transactions,
    myMembers,
    loading,
    error,
    create,
    update,
    remove,
    markPosted,
    markProjected,
  } = useHouseholdMonth(monthKey);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  const currency = isCurrencyCode(currencyCode) ? currencyCode : DEFAULT_CURRENCY;
  const grid = useMemo(() => buildMonthGrid(monthKey), [monthKey]);

  // One pass, bucketed by day — rather than filtering the full list once per
  // cell, which is O(days × records) on every render.
  const byDay = useMemo(() => {
    const map = new Map<string, DaySummary>();

    const ensure = (dayKey: string): DaySummary => {
      let entry = map.get(dayKey);
      if (!entry) {
        entry = {
          items: [],
          incomeMinor: 0,
          expenseMinor: 0,
          projectedIncomeMinor: 0,
          projectedExpenseMinor: 0,
          netMinor: 0,
        };
        map.set(dayKey, entry);
      }
      return entry;
    };

    for (const txn of transactions) {
      const day = ensure(txn.occurredOn);
      const projected = txn.status === "FORECASTED";
      day.items.push({
        id: txn.id,
        label: txn.description || txn.merchant || txn.category?.name || "Transaction",
        amountMinor: txn.amountMinor,
        direction: txn.direction,
        color: effectiveColor(txn.category?.color ?? null, txn.category?.name ?? txn.familyMemberName),
        projected,
        isMine: txn.isMine,
        memberName: txn.familyMemberName,
        txn,
      });
      if (txn.direction === "INCOME") {
        if (projected) day.projectedIncomeMinor += txn.amountMinor;
        else day.incomeMinor += txn.amountMinor;
      } else if (projected) day.projectedExpenseMinor += txn.amountMinor;
      else day.expenseMinor += txn.amountMinor;
    }

    for (const day of map.values()) {
      // Net of what has ACTUALLY happened. Projections are shown beside this
      // figure, never folded into it.
      day.netMinor = day.incomeMinor - day.expenseMinor;
      day.items.sort((a, b) => Number(a.projected) - Number(b.projected) || b.amountMinor - a.amountMinor);
    }
    return map;
  }, [transactions]);

  const monthTotals = useMemo(() => {
    let incomeMinor = 0;
    let expenseMinor = 0;
    let projectedIncomeMinor = 0;
    let projectedExpenseMinor = 0;
    for (const day of grid) {
      if (!day.isCurrentMonth) continue;
      const s = byDay.get(day.dayKey);
      if (!s) continue;
      incomeMinor += s.incomeMinor;
      expenseMinor += s.expenseMinor;
      projectedIncomeMinor += s.projectedIncomeMinor;
      projectedExpenseMinor += s.projectedExpenseMinor;
    }
    return {
      incomeMinor,
      expenseMinor,
      netMinor: incomeMinor - expenseMinor,
      // What the month ends at if every projection lands as entered.
      projectedNetMinor:
        incomeMinor + projectedIncomeMinor - (expenseMinor + projectedExpenseMinor),
      hasProjections: projectedIncomeMinor > 0 || projectedExpenseMinor > 0,
    };
  }, [grid, byDay]);

  const selected = selectedDay ? byDay.get(selectedDay) : undefined;
  const canAdd = myMembers.length > 0;

  const runRowAction = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "That didn't work. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-foreground/50">Loading…</span>
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
                <span className="text-success">{formatMoney(monthTotals.incomeMinor, currency)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-foreground/50">Out</span>
                <span className="text-foreground">{formatMoney(monthTotals.expenseMinor, currency)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-foreground/50">Net so far</span>
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
                  {formatMoney(Math.abs(monthTotals.netMinor), currency)}
                </span>
              </div>
              {/* Only shown when there is something to project, so the header
                  doesn't carry a figure identical to the one beside it. */}
              {monthTotals.hasProjections && (
                <div className="flex flex-col items-end">
                  <span className="text-xs text-foreground/50">If all lands</span>
                  <span className="text-warning">
                    {monthTotals.projectedNetMinor > 0 ? "+" : monthTotals.projectedNetMinor < 0 ? "−" : ""}
                    {formatMoney(Math.abs(monthTotals.projectedNetMinor), currency)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {(error || actionError) && (
            <p className="shrink-0 px-4 pt-3 text-sm text-danger">{error ?? actionError}</p>
          )}

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
                    // Every day is selectable now, not just days with records
                    // — an empty day is exactly where somebody wants to add
                    // an expected bill, and a disabled cell cannot be asked.
                    onClick={() => setSelectedDay(isSelected ? null : day.dayKey)}
                    className={`group flex h-32 w-full cursor-pointer flex-col items-stretch gap-1 rounded-lg p-1.5 text-left transition-colors hover:bg-accent-soft ${
                      // Muted rather than near-invisible: adjacent-month cells
                      // carry real data, so they have to stay readable while
                      // still reading as outside the month.
                      day.isCurrentMonth ? "" : "bg-default-50/50 opacity-60"
                    } ${bordersEnabled ? "border border-default-200" : ""} ${
                      isSelected ? "ring-2 ring-accent" : ""
                    }`}
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
                          {formatMoneyCompact(Math.abs(summary.netMinor), currency)}
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
                            {/* A projected item gets a hollow ring; something
                                that happened gets a filled dot. The shape is
                                the signal, not just the colour — colour alone
                                fails for anyone who cannot distinguish these
                                hues, and category colours are user-chosen so
                                they cannot be relied on to contrast. */}
                            <span
                              className="size-1.5 shrink-0 rounded-full"
                              style={
                                item.projected
                                  ? {
                                      backgroundColor: "transparent",
                                      boxShadow: `inset 0 0 0 1.5px ${
                                        categoryColorsEnabled && item.color ? item.color : "var(--muted)"
                                      }`,
                                    }
                                  : {
                                      backgroundColor:
                                        categoryColorsEnabled && item.color ? item.color : "var(--muted)",
                                    }
                              }
                              aria-hidden
                            />
                            <span
                              className={`min-w-0 flex-1 truncate ${
                                item.projected ? "italic text-foreground/55" : "text-foreground/80"
                              }`}
                            >
                              {item.label}
                            </span>
                            <span
                              className={`shrink-0 tabular-nums ${
                                item.projected
                                  ? "text-warning"
                                  : item.direction === "INCOME"
                                    ? "text-success"
                                    : "text-foreground/50"
                              }`}
                            >
                              {item.direction === "INCOME" ? "+" : "−"}
                              {formatMoneyCompact(item.amountMinor, currency)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedDay && (
              <Card className="mt-4 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-foreground">
                    {formatDayHeading(selectedDay)}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-3 text-xs tabular-nums">
                      {selected && selected.incomeMinor > 0 && (
                        <span className="text-success">
                          +{formatMoney(selected.incomeMinor, currency)}
                        </span>
                      )}
                      {selected && selected.expenseMinor > 0 && (
                        <span className="text-foreground/70">
                          −{formatMoney(selected.expenseMinor, currency)}
                        </span>
                      )}
                    </span>
                    {canAdd && (
                      <Button
                        size="sm"
                        onPress={() => {
                          setEditing(null);
                          setFormDay(selectedDay);
                        }}
                      >
                        <Plus className="size-4" aria-hidden /> Add expected
                      </Button>
                    )}
                  </div>
                </div>

                {!selected || selected.items.length === 0 ? (
                  <p className="text-sm text-foreground/50">
                    {loading ? "Loading…" : "Nothing on this day yet."}
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {selected.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center gap-3 rounded-md px-2 py-1.5 text-sm"
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={
                            item.projected
                              ? {
                                  backgroundColor: "transparent",
                                  boxShadow: `inset 0 0 0 2px ${
                                    categoryColorsEnabled && item.color ? item.color : "var(--muted)"
                                  }`,
                                }
                              : {
                                  backgroundColor:
                                    categoryColorsEnabled && item.color ? item.color : "var(--muted)",
                                }
                          }
                          aria-hidden
                        />
                        <span
                          className={`min-w-0 flex-1 truncate ${
                            item.projected ? "italic text-foreground/70" : "text-foreground"
                          }`}
                        >
                          {item.label}
                          <span className="ml-2 text-xs text-foreground/40">{item.memberName}</span>
                        </span>
                        {item.projected && (
                          <Chip size="sm" color="warning">Projected</Chip>
                        )}
                        <Chip size="sm">{item.direction === "INCOME" ? "In" : "Out"}</Chip>
                        <span
                          className={`shrink-0 tabular-nums ${
                            item.projected
                              ? "text-warning"
                              : item.direction === "INCOME"
                                ? "text-success"
                                : "text-foreground"
                          }`}
                        >
                          {item.direction === "INCOME" ? "+" : "−"}
                          {formatMoney(item.amountMinor, currency)}
                        </span>
                        {/* Gated on ownership for the same reason as
                            everywhere else: these rows include a housemate's,
                            and each mutation would be refused at its @check. */}
                        {item.isMine ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              isDisabled={busyId === item.id}
                              onPress={() =>
                                void runRowAction(item.id, () =>
                                  item.projected ? markPosted(item.id) : markProjected(item.id)
                                )
                              }
                            >
                              {item.projected
                                ? item.direction === "INCOME"
                                  ? "Mark received"
                                  : "Mark paid"
                                : "Undo"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              isDisabled={busyId === item.id}
                              onPress={() => {
                                setEditing(item.txn);
                                setFormDay(selectedDay);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              isDisabled={busyId === item.id}
                              onPress={() => void runRowAction(item.id, () => remove(item.id))}
                            >
                              Delete
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-foreground/40">{item.txn.ownerUsername}&apos;s</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </Card>
      </div>

      {formDay && (
        <TransactionForm
          isOpen
          key={editing?.id ?? `new-${formDay}`}
          memberOptions={myMembers.map((m) => ({ id: m.id, name: m.name }))}
          defaultMemberId={editing?.familyMemberId ?? myMembers[0]?.id ?? null}
          defaultOccurredOn={formDay}
          // Opening from the calendar almost always means "something I expect
          // on this day" — a bill due, a cheque coming. Adding something that
          // already happened is still one toggle away.
          defaultProjected={!editing}
          currency={currency}
          existing={editing}
          onClose={() => {
            setFormDay(null);
            setEditing(null);
          }}
          onSubmit={async (data: TransactionInput, familyMemberId?: string) => {
            if (editing) await update(editing.id, data);
            else if (familyMemberId) await create(familyMemberId, data);
          }}
        />
      )}
    </div>
  );
}

export default CalendarPage;
