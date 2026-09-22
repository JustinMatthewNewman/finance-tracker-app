"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Chip } from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import { useBorders } from "@/context/BordersContext";
import AmbientBackground from "@/components/AmbientBackground";
import { RecordsTable, type RecordColumn, type RecordGroup } from "@/components/Records/RecordsTable";
import { RecordsTableControls, type ColumnOption } from "@/components/Records/RecordsTableControls";
import { MOCK_EXPENSES, personColor, type MockExpenseRecord } from "@/lib/mockFinanceData";
import { DEFAULT_CURRENCY, formatMoney } from "@/lib/money";
import { currentMonthKey, formatDayHeading, monthRange, toDateString, type MonthKey } from "@/lib/monthRange";

// Expenses tab — a UI port of Finance Manager Pro's Expenses tab.
//
// MOCK DATA ONLY for now (see lib/mockFinanceData.ts).

const ALL_COLUMNS: ColumnOption[] = [
  { key: "person", label: "Person" },
  { key: "expenseName", label: "Expense name" },
  { key: "category", label: "Category" },
  { key: "amount", label: "Amount" },
  { key: "dueDate", label: "Due date" },
  { key: "addDate", label: "Date added" },
  { key: "payPeriod", label: "Pay period" },
  { key: "currency", label: "Currency" },
  { key: "isRecurring", label: "Recurring" },
  { key: "isActive", label: "Active" },
  { key: "description", label: "Description" },
];

const DEFAULT_COLUMNS = ["person", "expenseName", "category", "amount", "dueDate"];

const TODAY = toDateString(new Date());

function ExpensesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { bordersEnabled } = useBorders();

  const [monthKey, setMonthKey] = useState<MonthKey>(currentMonthKey);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set(DEFAULT_COLUMNS));

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  const range = useMemo(() => monthRange(monthKey), [monthKey]);

  // Filtered on dueDate, not addDate: an expense belongs to the month it is
  // payable in, which is what a bills view is for. FMP filtered income by
  // add_date and expenses by due_date for the same reason.
  const visible = useMemo(
    () => MOCK_EXPENSES.filter((r) => r.dueDate >= range.startDate && r.dueDate <= range.endDate),
    [range.startDate, range.endDate]
  );

  const groups = useMemo<RecordGroup<MockExpenseRecord>[]>(() => {
    const byPerson = new Map<string, MockExpenseRecord[]>();
    for (const row of visible) {
      const bucket = byPerson.get(row.personId);
      if (bucket) bucket.push(row);
      else byPerson.set(row.personId, [row]);
    }
    return Array.from(byPerson.entries()).map(([id, rows]) => ({
      id,
      name: rows[0].personName,
      rows,
      totalMinor: rows.reduce((sum, r) => sum + r.amountMinor, 0),
    }));
  }, [visible]);

  const grandTotalMinor = useMemo(
    () => groups.reduce((sum, g) => sum + g.totalMinor, 0),
    [groups]
  );

  const columns = useMemo<RecordColumn<MockExpenseRecord>[]>(() => {
    const defs: Record<string, RecordColumn<MockExpenseRecord>> = {
      person: { key: "person", label: "Person", render: (r) => r.personName },
      expenseName: { key: "expenseName", label: "Expense name", render: (r) => r.expenseName },
      category: {
        key: "category",
        label: "Category",
        render: (r) => <Chip size="sm">{r.category}</Chip>,
      },
      amount: {
        key: "amount",
        label: "Amount",
        numeric: true,
        render: (r) => formatMoney(r.amountMinor, DEFAULT_CURRENCY),
      },
      dueDate: {
        key: "dueDate",
        label: "Due date",
        render: (r) => (
          <span className="flex items-center gap-2">
            {formatDayHeading(r.dueDate)}
            {/* Overdue is stated in words as well as colour — a red date is
                only a warning to someone who can see red. */}
            {r.dueDate < TODAY && (
              <Chip size="sm" color="danger">Overdue</Chip>
            )}
          </span>
        ),
      },
      addDate: { key: "addDate", label: "Date added", render: (r) => formatDayHeading(r.addDate) },
      payPeriod: { key: "payPeriod", label: "Pay period", render: (r) => r.payPeriod },
      currency: { key: "currency", label: "Currency", render: (r) => r.currency },
      isRecurring: {
        key: "isRecurring",
        label: "Recurring",
        render: (r) => (r.isRecurring ? <Chip size="sm">Recurring</Chip> : "—"),
      },
      isActive: {
        key: "isActive",
        label: "Active",
        render: (r) =>
          r.isActive ? (
            <Chip size="sm" color="success">Active</Chip>
          ) : (
            <Chip size="sm">Inactive</Chip>
          ),
      },
      description: {
        key: "description",
        label: "Description",
        render: (r) => r.description || "—",
      },
    };
    return ALL_COLUMNS.filter((c) => selectedColumns.has(c.key)).map((c) => defs[c.key]);
  }, [selectedColumns]);

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
          <div className="shrink-0 border-b border-border" data-glass="surface">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
              <div>
                <h1 className="text-lg font-semibold text-foreground">Expenses</h1>
                <p className="text-xs text-foreground/50">
                  Sample data — not yet connected to your household records.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-foreground/50">Due this month</div>
                <div className="text-lg font-semibold tabular-nums text-foreground">
                  {formatMoney(grandTotalMinor, DEFAULT_CURRENCY)}
                </div>
              </div>
            </div>
            <RecordsTableControls
              monthKey={monthKey}
              onMonthChange={setMonthKey}
              availableColumns={ALL_COLUMNS}
              selectedColumns={selectedColumns}
              onSelectedColumnsChange={setSelectedColumns}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-2">
            <RecordsTable
              ariaLabel="Expense records"
              groups={groups}
              columns={columns}
              grandTotalMinor={grandTotalMinor}
              groupColor={(g) => personColor(g.id)}
              rowKey={(r) => r.id}
              emptyMessage="No expenses due this month."
              grandTotalLabel="Grand total"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ExpensesPage;
