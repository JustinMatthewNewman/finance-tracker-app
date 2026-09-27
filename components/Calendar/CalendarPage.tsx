"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@heroui/react";
import { ChevronLeft, ChevronRight, Plus } from "@gravity-ui/icons";
import { useAuth } from "@/hooks/useAuth";
import { useBorders } from "@/context/BordersContext";
import { useCategoryColorsSetting } from "@/context/CategoryColorsContext";
import { useUserSettings } from "@/context/UserSettingsContext";
import { useCalendarView } from "@/context/CalendarViewContext";
import { useInternalTransfers } from "@/context/InternalTransfersContext";
import { usePrivacyMode } from "@/context/PrivacyModeContext";
import { useHouseholdMonth } from "@/hooks/useHouseholdMonth";
import AmbientBackground from "@/components/AmbientBackground";
import { TransactionForm } from "@/components/Finance/TransactionForm";
import type { TransactionInput } from "@/hooks/useTransactions";
import { effectiveColor } from "@/lib/entityColor";
import { sumDays } from "@/lib/ledgerTotals";
import { DEFAULT_CURRENCY, isCurrencyCode, type Minor } from "@/lib/money";
import {
  addMonths,
  buildMonthGrid,
  currentMonthKey,
  monthLabel,
  relativeMonthLabel,
  visibleGridDays,
  weekdayLabels,
  type MonthKey,
} from "@/lib/monthRange";

// Calendar tab — a month grid of money in and out per day.
//
// WHAT THIS PAGE IS FOR. It is the one place the household looks forward rather
// than back, so a projected item — an expected paycheque, a bill due on the 28th
// — has to be visible here as clearly as something that already happened, and
// just as clearly NOT be mistaken for it. Every total on this page is therefore
// split: what has moved, and what is still expected. A single blended figure
// would quietly tell somebody they have money they do not yet have.
//
// EVERY FIGURE COMES FROM lib/ledgerTotals.ts, via useHouseholdMonth. It used to
// be summed inline here, while the Income and Expenses pages summed the same rows
// their own way — three copies of the same four decisions, each free to drift,
// and a wrong total does not throw. `in` and `out` here and there now come out of
// one function.
//
// A DAY IS A ROUTE, NOT A PANEL. Tapping a cell goes to /calendar/{day} (see
// CalendarDayPage), because a day is something people link to, send to a
// housemate and reach with the back button. It used to expand inline, which made
// all three impossible and put a day's detail inside the month's scroll box.

interface DayItem {
  key: string;
  label: string;
  amountMinor: Minor;
  direction: "INCOME" | "EXPENSE";
  color: string | null;
  projected: boolean;
}

function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { bordersEnabled } = useBorders();
  const { categoryColorsEnabled } = useCategoryColorsSetting();
  const { currencyCode } = useUserSettings();
  const { hideWeekends, setHideWeekends } = useCalendarView();
  const { showInternalTransfers } = useInternalTransfers();
  const { formatAmount, formatAmountCompact } = usePrivacyMode();

  const [monthKey, setMonthKey] = useState<MonthKey>(currentMonthKey);
  const [formDay, setFormDay] = useState<string | null>(null);

  const { visible, byDay, myMembers, loading, error, create } = useHouseholdMonth(monthKey);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  const currency = isCurrencyCode(currencyCode) ? currencyCode : DEFAULT_CURRENCY;

  const fullGrid = useMemo(() => buildMonthGrid(monthKey), [monthKey]);
  /** What is drawn. A VIEW filter — see visibleGridDays; it touches no total. */
  const grid = useMemo(() => visibleGridDays(fullGrid, hideWeekends), [fullGrid, hideWeekends]);

  /**
   * The month's figures.
   *
   * Summed over the MONTH's days, taken from the UNFILTERED grid — never over
   * `grid`, which may have the weekend removed. Hiding two columns must not
   * change what the month totals, or somebody reconciling against their bank
   * would find the app short by a weekend's spending with nothing on screen to
   * explain it.
   */
  const monthTotals = useMemo(
    () => sumDays(byDay, fullGrid.filter((d) => d.isCurrentMonth).map((d) => d.dayKey)),
    [byDay, fullGrid]
  );

  /**
   * The labelled entries each cell lists.
   *
   * Separate from the per-day totals, which come from the shared module: those
   * are arithmetic and this is presentation. Built in one pass rather than
   * filtering the whole list once per cell, which is O(days × records) on every
   * render.
   */
  const itemsByDay = useMemo(() => {
    const map = new Map<string, DayItem[]>();
    for (const txn of visible) {
      const bucket = map.get(txn.occurredOn) ?? [];
      bucket.push({
        key: txn.occurrenceKey,
        label: txn.description || txn.merchant || txn.category?.name || "Transaction",
        amountMinor: txn.amountMinor,
        direction: txn.direction,
        color: effectiveColor(txn.category?.color ?? null, txn.category?.name ?? txn.familyMemberName),
        projected: txn.status === "FORECASTED",
      });
      map.set(txn.occurredOn, bucket);
    }
    for (const items of map.values()) {
      items.sort((a, b) => Number(a.projected) - Number(b.projected) || b.amountMinor - a.amountMinor);
    }
    return map;
  }, [visible]);

  const canAdd = myMembers.length > 0;
  const columns = hideWeekends ? 5 : 7;
  const signed = (minor: Minor) =>
    `${minor > 0 ? "+" : minor < 0 ? "−" : ""}${formatAmount(Math.abs(minor), currency)}`;

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

            {/* IN AND OUT ARE WHAT MOVED — POSTED rows, imported or typed alike.
                Projections are the separate figure to the right, never folded
                into these two. See lib/ledgerTotals.ts. */}
            <div className="flex items-center gap-4 text-sm tabular-nums">
              <div className="flex flex-col items-end">
                <span className="text-xs text-foreground/50">In</span>
                <span className="text-success">{formatAmount(monthTotals.in.actualMinor, currency)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-foreground/50">Out</span>
                <span className="text-foreground">{formatAmount(monthTotals.out.actualMinor, currency)}</span>
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
                  {signed(monthTotals.netMinor)}
                </span>
              </div>
              {/* Only when there is something to project, so the header does not
                  carry a figure identical to the one beside it. */}
              {monthTotals.hasProjections && (
                <div className="flex flex-col items-end">
                  <span className="text-xs text-foreground/50">If all lands</span>
                  <span className="text-warning">{signed(monthTotals.expectedNetMinor)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* A VIEW toggle: it changes which columns are drawn and no figure
                  above it. Weekend transactions still count — see
                  visibleGridDays in lib/monthRange.ts. */}
              <Button
                size="sm"
                variant={hideWeekends ? "secondary" : "outline"}
                onPress={() => setHideWeekends(!hideWeekends)}
              >
                {hideWeekends ? "Show weekends" : "Hide weekends"}
              </Button>

              {/* The internal-transfers toggle used to live here and is now in
                  the navbar: it changes the figures on every page at once, and a
                  control on this one implied it applied only here. */}
            </div>

            {!showInternalTransfers && monthTotals.excludedTransferCount > 0 && (
              <span className="text-xs text-foreground/50">
                {monthTotals.excludedTransferCount} transfer
                {monthTotals.excludedTransferCount === 1 ? "" : "s"} between your own accounts left out.
              </span>
            )}
          </div>

          {error && <p className="shrink-0 px-4 pt-3 text-sm text-danger">{error}</p>}

          <div className="min-h-0 flex-1 overflow-auto p-4">
            <div
              className="mb-2 grid gap-1.5 text-center text-xs font-medium text-foreground/50"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {weekdayLabels(hideWeekends).map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {grid.map((day) => {
                const summary = byDay.get(day.dayKey);
                const items = itemsByDay.get(day.dayKey) ?? [];

                return (
                  // A real link, so a day can be middle-clicked, opened in a new
                  // tab and returned from with the back button. Every day is
                  // reachable including an empty one — an empty day is exactly
                  // where somebody wants to add an expected bill.
                  <Link
                    key={day.dayKey}
                    href={`/calendar/${day.dayKey}`}
                    className={`group flex h-32 w-full cursor-pointer flex-col items-stretch gap-1 rounded-lg p-1.5 text-left transition-colors hover:bg-accent-soft ${
                      // Muted rather than near-invisible: adjacent-month cells
                      // carry real data, so they have to stay readable while
                      // still reading as outside the month.
                      day.isCurrentMonth ? "" : "bg-default-50/50 opacity-60"
                    } ${bordersEnabled ? "border border-default-200" : ""}`}
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
                          {formatAmountCompact(Math.abs(summary.netMinor), currency)}
                        </span>
                      )}
                    </div>

                    {/* Clipped at rest, scrollable while hovered — the list is
                        every item for the day, so the overflow is real content
                        to reach rather than a fixed truncation. */}
                    <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden group-hover:overflow-y-auto">
                      {items.length === 0 ? (
                        <span className="text-[10px] text-foreground/30">—</span>
                      ) : (
                        items.map((item) => (
                          <div
                            key={item.key}
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
                              {formatAmountCompact(item.amountMinor, currency)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {loading && <p className="mt-3 text-center text-xs text-foreground/50">Loading…</p>}

            {canAdd && (
              <div className="mt-4 flex justify-center">
                <Button size="sm" variant="outline" onPress={() => setFormDay(defaultAddDay(monthKey))}>
                  <Plus className="size-4" aria-hidden /> Add something expected
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {formDay && (
        <TransactionForm
          isOpen
          key={`new-${formDay}`}
          memberOptions={myMembers.map((m) => ({ id: m.id, name: m.name }))}
          defaultMemberId={myMembers[0]?.id ?? null}
          defaultOccurredOn={formDay}
          // Opening from the calendar almost always means "something I expect on
          // this day" — a bill due, a cheque coming. Adding something that
          // already happened is still one toggle away.
          defaultProjected
          currency={currency}
          existing={null}
          onClose={() => setFormDay(null)}
          onSubmit={async (data: TransactionInput, familyMemberId?: string) => {
            if (familyMemberId) await create(familyMemberId, data);
          }}
        />
      )}
    </div>
  );
}

/**
 * The day "add something expected" opens on.
 *
 * Today when the month on screen IS this month, otherwise that month's first day
 * — so a form opened while looking at December does not silently default into
 * September. Built from local parts and formatted by hand, never parsed from a
 * string or run through toISOString(); see the note at the top of
 * lib/monthRange.ts.
 */
function defaultAddDay(monthKey: MonthKey): string {
  const today = new Date();
  const sameMonth = today.getFullYear() === monthKey.year && today.getMonth() === monthKey.month;
  const day = sameMonth ? today.getDate() : 1;
  const mm = String(monthKey.month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${monthKey.year}-${mm}-${dd}`;
}

export default CalendarPage;
