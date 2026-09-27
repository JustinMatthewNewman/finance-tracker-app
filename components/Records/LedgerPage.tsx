"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Chip } from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import { useBorders } from "@/context/BordersContext";
import { useUserSettings } from "@/context/UserSettingsContext";
import { useHouseholdMonth } from "@/hooks/useHouseholdMonth";
import AmbientBackground from "@/components/AmbientBackground";
import { RecordsTable, type RecordColumn, type RecordGroup } from "@/components/Records/RecordsTable";
import { RecordsTableControls, type ColumnOption } from "@/components/Records/RecordsTableControls";
import { TransactionForm } from "@/components/Finance/TransactionForm";
import { ImportStatementDialog } from "@/components/Finance/ImportStatementDialog";
import { ruleRowOf, type Transaction, type TransactionInput } from "@/hooks/useTransactions";
import { RECURRENCE_LABELS, toRecurrence } from "@/lib/recurrence";
import { DEFAULT_CURRENCY, isCurrencyCode, type Direction } from "@/lib/money";
import { usePrivacyMode } from "@/context/PrivacyModeContext";
import { currentMonthKey, formatDayHeading, type MonthKey } from "@/lib/monthRange";
import { normalizeHexColor } from "@/lib/entityColor";

// The Income and Expenses tabs, which are the same page pointed at opposite
// halves of the ledger.
//
// Written once for the reason RecordsTable already gives for its own
// existence: over in the app this was ported from, Income and Expense were
// near-identical files that had already drifted apart. Everything that
// genuinely differs between the two is in the props below — the direction
// filter, the wording, and which total is the headline.
//
// Both read REAL rows now. They previously rendered a hand-written mock
// module, which meant the figures here never agreed with the Household page
// and nothing on the screen could be acted on.

export interface LedgerPageProps {
  direction: Direction;
  title: string;
  /** "No income recorded for this month." */
  emptyMessage: string;
  /** What the money-moved total is called here — "Received", "Paid". */
  postedLabel: string;
  /** What marking a projection as done is called — "Mark received", "Mark paid". */
  markLabel: string;
  addLabel: string;
  /** Tailwind text colour for the headline figure. */
  accentClass: string;
}

const ALL_COLUMNS: ColumnOption[] = [
  { key: "person", label: "Person" },
  { key: "description", label: "Description" },
  { key: "category", label: "Category" },
  { key: "amount", label: "Amount" },
  { key: "occurredOn", label: "Date" },
  { key: "state", label: "Status" },
  { key: "origin", label: "Source" },
  { key: "method", label: "Method" },
  { key: "recurrence", label: "Repeats" },
  { key: "recordedBy", label: "Recorded by" },
  { key: "actions", label: "Actions" },
];

const DEFAULT_COLUMNS = ["person", "description", "amount", "occurredOn", "state", "actions"];

export function LedgerPage({
  direction,
  title,
  emptyMessage,
  postedLabel,
  markLabel,
  addLabel,
  accentClass,
}: LedgerPageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { bordersEnabled } = useBorders();
  const { currencyCode } = useUserSettings();
  // Every amount on this page goes through formatAmount, never formatMoney
  // directly — a figure that bypassed it would stay legible with privacy mode on,
  // and a screen that hides most of its numbers is worse than one that hides none.
  const { formatAmount } = usePrivacyMode();

  const [monthKey, setMonthKey] = useState<MonthKey>(currentMonthKey);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set(DEFAULT_COLUMNS));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    visibleIncome,
    visibleExpenses,
    totals: monthTotals,
    showInternalTransfers,
    familyMembers,
    myMembers,
    loading,
    error,
    create,
    update,
    remove,
    markPosted,
    markProjected,
    refetch,
  } = useHouseholdMonth(monthKey);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  const currency = isCurrencyCode(currencyCode) ? currencyCode : DEFAULT_CURRENCY;
  // The visible* lists and `totals` apply the same internal-transfer filter, so
  // the figures in the header always describe exactly the rows in the table.
  const rows = direction === "INCOME" ? visibleIncome : visibleExpenses;
  const side = direction === "INCOME" ? monthTotals.in : monthTotals.out;

  const colorByMember = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const m of familyMembers) map.set(m.id, normalizeHexColor(m.color));
    return map;
  }, [familyMembers]);

  const groups = useMemo<RecordGroup<Transaction>[]>(() => {
    const byMember = new Map<string, Transaction[]>();
    for (const row of rows) {
      const bucket = byMember.get(row.familyMemberId);
      if (bucket) bucket.push(row);
      else byMember.set(row.familyMemberId, [row]);
    }
    return Array.from(byMember.entries()).map(([id, memberRows]) => ({
      id,
      name: memberRows[0].familyMemberName,
      rows: memberRows,
      totalMinor: memberRows.reduce((sum, r) => sum + r.amountMinor, 0),
    }));
  }, [rows]);

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

  const columns = useMemo<RecordColumn<Transaction>[]>(() => {
    const defs: Record<string, RecordColumn<Transaction>> = {
      person: { key: "person", label: "Person", render: (r) => r.familyMemberName },
      description: {
        key: "description",
        label: "Description",
        render: (r) => r.description || r.merchant || "—",
      },
      category: {
        key: "category",
        label: "Category",
        render: (r) => (r.category ? <Chip size="sm">{r.category.name}</Chip> : "—"),
      },
      amount: {
        key: "amount",
        label: "Amount",
        numeric: true,
        render: (r) => formatAmount(r.amountMinor, currency),
      },
      occurredOn: {
        key: "occurredOn",
        label: "Date",
        render: (r) => formatDayHeading(r.occurredOn),
      },
      state: {
        key: "state",
        label: "Status",
        // Branches on `status`, never on `source`: an imported row is money that
        // moved, so it reads the same as a typed one here. Where it came from is
        // the Source column below — see lib/transactionKind.ts.
        render: (r) =>
          r.status === "FORECASTED" ? (
            <Chip size="sm" color="warning">Projected</Chip>
          ) : (
            <Chip size="sm" color="success">{postedLabel}</Chip>
          ),
      },
      origin: {
        key: "origin",
        label: "Source",
        render: (r) =>
          r.source === "IMPORT" ? (
            <Chip size="sm" variant="secondary">Imported</Chip>
          ) : (
            <span className="text-foreground/40">Entered</span>
          ),
      },
      method: { key: "method", label: "Method", render: (r) => r.method || "—" },
      recurrence: {
        key: "recurrence",
        label: "Repeats",
        render: (r) => {
          const every = toRecurrence(r.recurrence);
          if (!every) return "—";
          return (
            <span className="flex flex-col">
              <Chip size="sm">{RECURRENCE_LABELS[every]}</Chip>
              {r.status === "FORECASTED" && (
                <span className="mt-0.5 text-xs text-foreground/50">
                  {r.recurrenceEndsOn ? `until ${r.recurrenceEndsOn}` : "no end date"}
                </span>
              )}
            </span>
          );
        },
      },
      recordedBy: { key: "recordedBy", label: "Recorded by", render: (r) => r.ownerUsername },
      actions: {
        key: "actions",
        label: "Actions",
        // Every control here is gated on `isMine`. Household reads are wider
        // than household writes, so these lists include a housemate's rows —
        // and each of these mutations would be refused at its `@check`.
        render: (r) => {
          if (!r.isMine) {
            return <span className="text-xs text-foreground/40">{r.ownerUsername}&apos;s</span>;
          }
          // A repeating projection is a rule, not an entry, so the per-entry
          // actions do not apply to it. "Mark received" in particular has no
          // meaning: ticking off one fortnight's paycheque would have to tick
          // off the rule that produces all of them. Recording that a specific
          // one arrived is adding an actual transaction, which is what the
          // Add button is for.
          const isRule = r.status === "FORECASTED" && !!toRecurrence(r.recurrence);
          const busy = busyId === r.occurrenceKey;
          return (
            <div className="flex flex-wrap gap-1">
              {!isRule && (
                <Button
                  size="sm"
                  variant="ghost"
                  isDisabled={busy}
                  onPress={() =>
                    void runRowAction(r.occurrenceKey, () =>
                      r.status === "FORECASTED" ? markPosted(r.id) : markProjected(r.id)
                    )
                  }
                >
                  {r.status === "FORECASTED" ? markLabel : "Undo"}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                isDisabled={busy}
                onPress={() => {
                  // ruleRowOf, not r: expansion overwrote occurredOn with
                  // this occurrence's day, and saving that would drag the
                  // whole series' start date onto whichever one was clicked.
                  setEditing(ruleRowOf(r));
                  setIsFormOpen(true);
                }}
              >
                {isRule ? "Edit series" : "Edit"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                isDisabled={busy}
                onPress={() => void runRowAction(r.occurrenceKey, () => remove(r.id))}
              >
                {isRule ? "Delete series" : "Delete"}
              </Button>
            </div>
          );
        },
      },
    };
    // Driven by ALL_COLUMNS rather than by the Set, so on-screen order is the
    // declared one and doesn't shuffle with the order boxes were ticked.
    return ALL_COLUMNS.filter((c) => selectedColumns.has(c.key)).map((c) => defs[c.key]);
  }, [selectedColumns, currency, formatAmount, postedLabel, markLabel, busyId, markPosted, markProjected, remove]);

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-foreground/50">Loading…</span>
      </div>
    );
  }
  if (!user) return null; // redirect in flight

  const canAdd = myMembers.length > 0;

  return (
    <div className="relative flex h-full flex-col overflow-hidden p-4">
      <AmbientBackground intensity={0.85} />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <Card className={`flex min-h-0 flex-1 flex-col overflow-hidden ${bordersEnabled ? "" : "border-none"}`}>
          <div className="shrink-0 border-b border-border" data-glass="surface">
            <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4">
              <div>
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                <p className="text-xs text-foreground/50">
                  Everyone in your household, for the selected month.
                </p>
              </div>
              {/* Three figures, not one. A month that has half its income
                  still to arrive is a different month from one where it has
                  all landed, and a single total cannot say which you are
                  looking at. */}
              <div className="flex gap-6 text-right">
                <div>
                  <div className="text-xs text-foreground/50">{postedLabel}</div>
                  <div className={`text-lg font-semibold tabular-nums ${accentClass}`}>
                    {formatAmount(side.actualMinor, currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground/50">Projected</div>
                  <div className="text-lg font-semibold tabular-nums text-warning">
                    {formatAmount(side.projectedMinor, currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground/50">Expected total</div>
                  <div className="text-lg font-semibold tabular-nums text-foreground">
                    {formatAmount(side.expectedMinor, currency)}
                  </div>
                </div>
              </div>
            </div>
            {/* A total that silently omits rows the table below it lists is
                unreconcilable by hand — which is the one thing somebody does when
                they distrust a ledger. So when transfers are hidden, the figures
                say so. */}
            {!showInternalTransfers && monthTotals.excludedTransferCount > 0 && (
              <p className="px-4 pb-2 text-xs text-foreground/50">
                Not counting {monthTotals.excludedTransferCount} transfer
                {monthTotals.excludedTransferCount === 1 ? "" : "s"} between your own accounts.
              </p>
            )}
            <RecordsTableControls
              monthKey={monthKey}
              onMonthChange={setMonthKey}
              availableColumns={ALL_COLUMNS}
              selectedColumns={selectedColumns}
              onSelectedColumnsChange={setSelectedColumns}
              onAdd={canAdd ? () => { setEditing(null); setIsFormOpen(true); } : undefined}
              addLabel={addLabel}
              onImport={canAdd ? () => setIsImportOpen(true) : undefined}
            />
            {(error || actionError) && (
              <p className="px-4 pb-3 text-sm text-danger">{error ?? actionError}</p>
            )}
            {!canAdd && !loading && (
              <p className="px-4 pb-3 text-xs text-foreground/50">
                Add someone to your household before recording anything.
              </p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-2">
            <RecordsTable
              ariaLabel={`${title} records`}
              groups={groups}
              columns={columns}
              grandTotalMinor={side.expectedMinor}
              currency={currency}
              groupColor={(g) => colorByMember.get(g.id) ?? null}
              rowKey={(r) => r.occurrenceKey}
              emptyMessage={loading ? "Loading…" : emptyMessage}
              grandTotalLabel="Expected total"
            />
          </div>
        </Card>
      </div>

      {/* Imported rows land as ordinary POSTED transactions, so nothing on this
          page needs to know an import happened beyond refetching the month. */}
      {isImportOpen && (
        <ImportStatementDialog
          isOpen={isImportOpen}
          memberOptions={myMembers.map((m) => ({ id: m.id, name: m.name }))}
          // Every member, not just the writable ones: a transfer to a housemate
          // is internal regardless of who may edit their records.
          householdNames={familyMembers.map((m) => m.name)}
          defaultMemberId={myMembers[0]?.id ?? null}
          onClose={() => setIsImportOpen(false)}
          onImported={() => void refetch()}
        />
      )}

      {isFormOpen && (
        <TransactionForm
          isOpen={isFormOpen}
          key={editing?.id ?? "new"}
          memberOptions={myMembers.map((m) => ({ id: m.id, name: m.name }))}
          defaultMemberId={editing?.familyMemberId ?? myMembers[0]?.id ?? null}
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

export default LedgerPage;
