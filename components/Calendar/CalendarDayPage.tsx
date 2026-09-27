"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Chip } from "@heroui/react";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from "@gravity-ui/icons";
import { useAuth } from "@/hooks/useAuth";
import { useBorders } from "@/context/BordersContext";
import { useCategoryColorsSetting } from "@/context/CategoryColorsContext";
import { useUserSettings } from "@/context/UserSettingsContext";
import { usePrivacyMode } from "@/context/PrivacyModeContext";
import { useHouseholdMonth } from "@/hooks/useHouseholdMonth";
import AmbientBackground from "@/components/AmbientBackground";
import { TransactionForm } from "@/components/Finance/TransactionForm";
import { ruleRowOf, type Transaction, type TransactionInput } from "@/hooks/useTransactions";
import { RECURRENCE_LABELS, toRecurrence } from "@/lib/recurrence";
import { effectiveColor } from "@/lib/entityColor";
import { ledgerTotals } from "@/lib/ledgerTotals";
import { DEFAULT_CURRENCY, formatPercent, isCurrencyCode, shareOf } from "@/lib/money";
import {
  formatDayHeading,
  fromDateString,
  monthKeyOf,
  toDateString,
} from "@/lib/monthRange";

// One day of the household's money.
//
// WHAT THIS PAGE IS FOR that the grid cell is not. A cell has room for a label
// and a figure; this has room for the questions somebody actually has about a
// day — what was it all, who spent it, what was it on, how does it compare to
// the rest of the month, and is any of it still only expected. Those are the
// stats below, and each is here because it is unanswerable from the grid.
//
// Every figure on this page comes from lib/ledgerTotals.ts, the same module the
// month header and the ledgers use. A day total computed locally would be a
// fourth copy of the same four decisions, and a total that disagrees with the
// month it is part of is worse than no total at all.

/** Matches the URL form and the Date column: "yyyy-mm-dd". */
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function CalendarDayPage({ dayKey }: { dayKey: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { bordersEnabled } = useBorders();
  const { categoryColorsEnabled } = useCategoryColorsSetting();
  const { currencyCode } = useUserSettings();
  const { formatAmount } = usePrivacyMode();

  const [editing, setEditing] = useState<Transaction | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const valid = DAY_PATTERN.test(dayKey) && !Number.isNaN(fromDateString(dayKey).getTime());

  // The month this day sits in — which is what has to be fetched, because a
  // day's figures only mean something beside the month's. Falls back to the
  // current month for an invalid day so the hook is still called
  // unconditionally; the guard below is what actually stops the render.
  const monthKey = useMemo(
    () => (valid ? monthKeyOf(fromDateString(dayKey)) : monthKeyOf(new Date())),
    [dayKey, valid]
  );

  const {
    visible,
    totals: monthTotals,
    byDay,
    showInternalTransfers,
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

  const rows = useMemo(
    () => visible.filter((t) => t.occurredOn === dayKey),
    [visible, dayKey]
  );

  // From the shared module, so this page's figures and the month header's are
  // the same arithmetic. byDay already holds it — recomputing would be a second
  // chance to disagree.
  const totals = byDay.get(dayKey) ?? ledgerTotals([]);

  /** Who spent or earned what, for the per-person breakdown. */
  const byMember = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const row of rows) {
      const bucket = groups.get(row.familyMemberId);
      if (bucket) bucket.push(row);
      else groups.set(row.familyMemberId, [row]);
    }
    return [...groups.values()]
      .map((memberRows) => ({
        name: memberRows[0].familyMemberName,
        ...ledgerTotals(memberRows, { includeInternalTransfers: showInternalTransfers }),
      }))
      .sort((a, b) => b.out.actualMinor - a.out.actualMinor);
  }, [rows, showInternalTransfers]);

  /** What the day went on, biggest first. */
  const byCategory = useMemo(() => {
    const groups = new Map<string, { name: string; color: string | null; totalMinor: number }>();
    for (const row of rows) {
      if (row.direction !== "EXPENSE" || row.status === "FORECASTED") continue;
      const name = row.category?.name ?? "Uncategorized";
      const existing = groups.get(name);
      if (existing) existing.totalMinor += row.amountMinor;
      else
        groups.set(name, {
          name,
          color: effectiveColor(row.category?.color ?? null, name),
          totalMinor: row.amountMinor,
        });
    }
    return [...groups.values()].sort((a, b) => b.totalMinor - a.totalMinor);
  }, [rows]);

  const prevDay = toDateString(new Date(fromDateString(dayKey).getTime() - 86_400_000));
  const nextDay = toDateString(new Date(fromDateString(dayKey).getTime() + 86_400_000));

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

  if (!valid) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
        <p className="text-sm text-foreground/60">
          &ldquo;{dayKey}&rdquo; is not a date this page can show.
        </p>
        <LinkButton href="/calendar">Back to the calendar</LinkButton>
      </div>
    );
  }

  const canAdd = myMembers.length > 0;
  // A day's share of the month, which is the comparison that makes a figure
  // mean something. Guarded against a zero month inside shareOf.
  const shareOfMonthOut = shareOf(totals.out.actualMinor, monthTotals.out.actualMinor);

  return (
    <div className="relative flex h-full flex-col overflow-hidden p-4">
      <AmbientBackground intensity={0.85} />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <Card className={bordersEnabled ? "" : "border-none"}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4" data-glass="surface">
            <div className="flex items-center gap-2">
              <LinkButton href="/calendar" ariaLabel="Back to the calendar">
                <ArrowLeft className="size-4" />
              </LinkButton>
              <div>
                <h1 className="text-lg font-semibold text-foreground">{formatDayHeading(dayKey)}</h1>
                <p className="text-xs text-foreground/50">
                  {totals.in.count + totals.out.count} transaction
                  {totals.in.count + totals.out.count === 1 ? "" : "s"} across the household
                </p>
              </div>
            </div>

            {/* Stepping a day at a time, as links rather than state, so each
                day keeps its own URL and the back button walks back through
                them. */}
            <div className="flex items-center gap-1">
              <LinkButton href={`/calendar/${prevDay}`} ariaLabel="Previous day">
                <ChevronLeft className="size-4" />
              </LinkButton>
              <LinkButton href={`/calendar/${nextDay}`} ariaLabel="Next day">
                <ChevronRight className="size-4" />
              </LinkButton>
              {canAdd && (
                <Button size="sm" onPress={() => { setEditing(null); setIsFormOpen(true); }}>
                  <Plus className="size-4" aria-hidden /> Add
                </Button>
              )}
            </div>
          </div>

          {(error || actionError) && <p className="px-4 pt-3 text-sm text-danger">{error ?? actionError}</p>}

          {/* IN AND OUT ARE WHAT ACTUALLY MOVED. Projections sit in their own
              tiles below, never folded into these two — see lib/ledgerTotals.ts. */}
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="In" value={formatAmount(totals.in.actualMinor, currency)} accent="text-success" />
            <Stat label="Out" value={formatAmount(totals.out.actualMinor, currency)} accent="text-foreground" />
            <Stat
              label="Net"
              value={`${totals.netMinor > 0 ? "+" : totals.netMinor < 0 ? "−" : ""}${formatAmount(Math.abs(totals.netMinor), currency)}`}
              accent={totals.netMinor > 0 ? "text-success" : totals.netMinor < 0 ? "text-danger" : "text-foreground"}
            />
            <Stat
              label="Share of the month's spending"
              value={monthTotals.out.actualMinor > 0 ? formatPercent(shareOfMonthOut) : "—"}
            />
          </div>

          {totals.hasProjections && (
            <div className="grid gap-3 border-t border-border px-4 py-3 sm:grid-cols-3">
              <Stat label="Expected in" value={formatAmount(totals.in.projectedMinor, currency)} accent="text-warning" />
              <Stat label="Expected out" value={formatAmount(totals.out.projectedMinor, currency)} accent="text-warning" />
              <Stat
                label="Net if it all lands"
                value={`${totals.expectedNetMinor > 0 ? "+" : totals.expectedNetMinor < 0 ? "−" : ""}${formatAmount(Math.abs(totals.expectedNetMinor), currency)}`}
                accent="text-warning"
              />
            </div>
          )}

          {/* Where the day's actual spending came from, so "In" and "Out" can be
              traced to a source rather than taken on trust. */}
          {(totals.in.importedMinor > 0 || totals.out.importedMinor > 0) && (
            <p className="border-t border-border px-4 py-2 text-xs text-foreground/50">
              Of what moved, {formatAmount(totals.in.importedMinor, currency)} in and{" "}
              {formatAmount(totals.out.importedMinor, currency)} out came from an imported statement.
            </p>
          )}

          {!showInternalTransfers && totals.excludedTransferCount > 0 && (
            <p className="border-t border-border px-4 py-2 text-xs text-foreground/50">
              Not counting {totals.excludedTransferCount} transfer
              {totals.excludedTransferCount === 1 ? "" : "s"} between your own accounts.
            </p>
          )}
        </Card>

        {byCategory.length > 0 && (
          <Card className={bordersEnabled ? "" : "border-none"}>
            <h2 className="border-b border-border p-4 text-sm font-semibold">What it went on</h2>
            <div className="flex flex-col gap-2 p-4">
              {byCategory.map((cat) => (
                <div key={cat.name} className="flex items-center gap-3 text-sm">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: categoryColorsEnabled && cat.color ? cat.color : "var(--muted)" }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                  <span className="shrink-0 text-xs text-foreground/50 tabular-nums">
                    {formatPercent(shareOf(cat.totalMinor, totals.out.actualMinor))}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatAmount(cat.totalMinor, currency)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {byMember.length > 1 && (
          <Card className={bordersEnabled ? "" : "border-none"}>
            <h2 className="border-b border-border p-4 text-sm font-semibold">Who</h2>
            <div className="flex flex-col gap-2 p-4">
              {byMember.map((m) => (
                <div key={m.name} className="flex items-center gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate">{m.name}</span>
                  {m.in.actualMinor > 0 && (
                    <span className="shrink-0 text-success tabular-nums">
                      +{formatAmount(m.in.actualMinor, currency)}
                    </span>
                  )}
                  {m.out.actualMinor > 0 && (
                    <span className="shrink-0 text-foreground/70 tabular-nums">
                      −{formatAmount(m.out.actualMinor, currency)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className={bordersEnabled ? "" : "border-none"}>
          <h2 className="border-b border-border p-4 text-sm font-semibold">Everything on this day</h2>
          {rows.length === 0 ? (
            <p className="p-4 text-sm text-foreground/50">
              {loading ? "Loading…" : "Nothing on this day."}
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border/50">
              {rows.map((txn) => {
                const projected = txn.status === "FORECASTED";
                const isRule = projected && !!toRecurrence(txn.recurrence);
                const busy = busyId === txn.occurrenceKey;
                return (
                  <div key={txn.occurrenceKey} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={
                        projected
                          ? {
                              backgroundColor: "transparent",
                              boxShadow: `inset 0 0 0 2px ${
                                categoryColorsEnabled && txn.category?.color ? txn.category.color : "var(--muted)"
                              }`,
                            }
                          : {
                              backgroundColor:
                                categoryColorsEnabled && txn.category?.color ? txn.category.color : "var(--muted)",
                            }
                      }
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className={`truncate ${projected ? "italic text-foreground/70" : "text-foreground"}`}>
                        {txn.description || txn.merchant || txn.category?.name || "Transaction"}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-foreground/50">
                        <span>{txn.familyMemberName}</span>
                        {txn.category && <Chip size="sm">{txn.category.name}</Chip>}
                        {txn.method && <span>· {txn.method}</span>}
                        {projected && <Chip size="sm" color="warning">Projected</Chip>}
                        {txn.source === "IMPORT" && <Chip size="sm" variant="secondary">Imported</Chip>}
                        {/* Which KIND, not merely that it is one: "between your
                            accounts" and "within the household" are different
                            facts, and the whole reason there are two columns. */}
                        {txn.isInternalToUser && (
                          <Chip size="sm" variant="secondary">Between your accounts</Chip>
                        )}
                        {txn.isInternalToFamily && (
                          <Chip size="sm" variant="secondary">Within the household</Chip>
                        )}
                        {isRule && <Chip size="sm">{RECURRENCE_LABELS[toRecurrence(txn.recurrence)!]}</Chip>}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 tabular-nums ${
                        projected ? "text-warning" : txn.direction === "INCOME" ? "text-success" : "text-foreground"
                      }`}
                    >
                      {txn.direction === "INCOME" ? "+" : "−"}
                      {formatAmount(txn.amountMinor, currency)}
                    </span>

                    {/* Gated on isMine: household reads are wider than household
                        writes, so this list includes a housemate's rows and every
                        one of these mutations would be refused at a `@check`. */}
                    {txn.isMine ? (
                      <div className="flex shrink-0 flex-wrap gap-1">
                        {!isRule && (
                          <Button
                            size="sm"
                            variant="ghost"
                            isDisabled={busy}
                            onPress={() =>
                              void runRowAction(txn.occurrenceKey, () =>
                                projected ? markPosted(txn.id) : markProjected(txn.id)
                              )
                            }
                          >
                            {projected ? "Mark done" : "Undo"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          isDisabled={busy}
                          onPress={() => {
                            // ruleRowOf, not txn: expansion overwrote occurredOn
                            // with this occurrence's day, and saving that would
                            // drag the series' start onto it.
                            setEditing(ruleRowOf(txn));
                            setIsFormOpen(true);
                          }}
                        >
                          {isRule ? "Edit series" : "Edit"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          isDisabled={busy}
                          onPress={() => void runRowAction(txn.occurrenceKey, () => remove(txn.id))}
                        >
                          Delete
                        </Button>
                      </div>
                    ) : (
                      <span className="shrink-0 text-xs text-foreground/40">{txn.ownerUsername}&apos;s</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {isFormOpen && (
        <TransactionForm
          isOpen={isFormOpen}
          key={editing?.id ?? "new"}
          memberOptions={myMembers.map((m) => ({ id: m.id, name: m.name }))}
          defaultMemberId={editing?.familyMemberId ?? myMembers[0]?.id ?? null}
          defaultOccurredOn={dayKey}
          currency={currency}
          existing={editing}
          onClose={() => {
            setIsFormOpen(false);
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

/**
 * A link styled as a button.
 *
 * A real anchor rather than a Button with an onPress: this page exists so a day
 * can be linked to, and a button that calls router.push cannot be middle-clicked,
 * opened in a new tab, or have its address copied. HeroUI v3's Button takes no
 * `as` prop, so the styling is applied here instead of fighting it.
 */
function LinkButton({
  href,
  ariaLabel,
  children,
}: {
  href: string;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-accent-soft"
    >
      {children}
    </Link>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-foreground/50">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${accent ?? "text-foreground"}`}>{value}</div>
    </div>
  );
}

export default CalendarDayPage;
