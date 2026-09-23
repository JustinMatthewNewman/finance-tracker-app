"use client";

import { useMemo } from "react";
import { Accordion, Dropdown } from "@heroui/react";
import { ChevronDown, Ellipsis } from "@gravity-ui/icons";
import { useCategoryColorsSetting } from "@/context/CategoryColorsContext";
import { effectiveColor, rowAccent, rowTint } from "@/lib/entityColor";
import {
  type CurrencyCode,
  DEFAULT_CURRENCY,
  formatMoney,
  sumTotals,
} from "@/lib/money";
import { formatDayHeading, groupByDay } from "@/lib/monthRange";
import type { Transaction } from "@/hooks/useTransactions";

interface TransactionTableProps {
  transactions: Transaction[];
  currency?: CurrencyCode;
  expandedKeys: Set<string>;
  onExpandedChange: (keys: Set<string>) => void;
  focusTransactionId: string | null;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function TransactionTable({
  transactions,
  currency = DEFAULT_CURRENCY,
  expandedKeys,
  onExpandedChange,
  focusTransactionId,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const { categoryColorsEnabled } = useCategoryColorsSetting();

  // Grouped once per change (O(n)) instead of re-filtering the full array once
  // per day on every render (O(days × transactions)).
  const days = useMemo(() => {
    const grouped = groupByDay(transactions, (t) => t.occurredOn);
    return Array.from(grouped.entries())
      .sort((a, b) => b[0].localeCompare(a[0])) // newest day first
      .map(([day, rows]) => ({ day, rows, totals: sumTotals(rows) }));
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <p className="p-6 text-sm text-foreground/60">
        No transactions in this period. Add one to get started.
      </p>
    );
  }

  return (
    <Accordion
      className="w-full"
      // Multi-expand, unlike the source template's single-expand hour blocks:
      // days here are independent groups people compare against each other,
      // and collapsing one to open another loses that comparison.
      allowsMultipleExpanded
      expandedKeys={expandedKeys}
      onExpandedChange={(keys) => onExpandedChange(new Set(Array.from(keys, String)))}
    >
      {days.map(({ day, rows, totals }) => (
        <Accordion.Item key={day} id={day}>
          <Accordion.Heading>
            <Accordion.Trigger className="w-full">
              <div className="flex w-full items-center justify-between gap-3 pr-2">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Accordion.Indicator>
                    <ChevronDown />
                  </Accordion.Indicator>
                  {formatDayHeading(day)}
                </span>
                <span className="flex items-center gap-3 text-xs tabular-nums">
                  {totals.incomeMinor > 0 && (
                    <span className="text-success">+{formatMoney(totals.incomeMinor, currency)}</span>
                  )}
                  {totals.expenseMinor > 0 && (
                    <span className="text-foreground/70">
                      −{formatMoney(totals.expenseMinor, currency)}
                    </span>
                  )}
                </span>
              </div>
            </Accordion.Trigger>
          </Accordion.Heading>

          <Accordion.Panel>
            <div className="flex flex-col gap-1 pb-2">
              {rows.map((txn) => {
                const color = txn.category
                  ? effectiveColor(txn.category.color, txn.category.name)
                  : null;
                const tinted = categoryColorsEnabled && color;
                const isFocused = txn.id === focusTransactionId;

                return (
                  <div
                    key={txn.id}
                    // The search-jump highlight is a ring, not a background
                    // change: the row may already be carrying a category tint,
                    // and overriding that would lose the category identity at
                    // the exact moment the user is trying to find the row.
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition ${
                      isFocused ? "ring-2 ring-accent" : ""
                    }`}
                    style={
                      tinted
                        ? {
                            backgroundColor: rowTint(color!),
                            borderLeft: `3px solid ${rowAccent(color!)}`,
                          }
                        : undefined
                    }
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm text-foreground">
                          {txn.merchant || txn.description || txn.category?.name || "Transaction"}
                        </span>
                        {txn.status === "FORECASTED" && (
                          <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            Projected
                          </span>
                        )}
                      </div>
                      <span className="truncate text-xs text-foreground/50">
                        {[txn.category?.name, txn.method, txn.recurrence ? "Recurring" : null]
                          .filter(Boolean)
                          .join(" · ") || "Uncategorized"}
                      </span>
                    </div>

                    <span
                      className={`shrink-0 text-sm tabular-nums ${
                        txn.direction === "INCOME" ? "text-success" : "text-foreground"
                      }`}
                    >
                      {txn.direction === "INCOME" ? "+" : "−"}
                      {formatMoney(txn.amountMinor, currency)}
                    </span>

                    <Dropdown>
                      <Dropdown.Trigger aria-label={`Actions for ${txn.merchant ?? "transaction"}`}>
                        <Ellipsis width={16} height={16} />
                      </Dropdown.Trigger>
                      <Dropdown.Popover>
                        <Dropdown.Menu
                          onAction={(key) => {
                            if (key === "edit") onEdit(txn);
                            if (key === "delete") onDelete(txn);
                          }}
                        >
                          <Dropdown.Item id="edit">Edit</Dropdown.Item>
                          <Dropdown.Item id="delete">Delete</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown>
                  </div>
                );
              })}
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}

export default TransactionTable;
