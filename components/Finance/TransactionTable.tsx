"use client";

import { useMemo } from "react";
import { Accordion, Dropdown } from "@heroui/react";
import { ChevronDown, Ellipsis } from "@gravity-ui/icons";
import { useCategoryColorsSetting } from "@/context/CategoryColorsContext";
import { effectiveColor, rowAccent, rowTint } from "@/lib/entityColor";
import {
  type CurrencyCode,
  DEFAULT_CURRENCY,
  sumTotals,
} from "@/lib/money";
import { formatDayHeading, groupByDay } from "@/lib/monthRange";
import type { Transaction } from "@/hooks/useTransactions";
import { usePrivacyMode } from "@/context/PrivacyModeContext";

interface TransactionTableProps {
  transactions: Transaction[];
  currency?: CurrencyCode;
  expandedKeys: Set<string>;
  onExpandedChange: (keys: Set<string>) => void;
  focusTransactionId: string | null;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  /**
   * Show who each row belongs to.
   *
   * Off for a single person's panel, where every row is theirs and the label
   * would be the same word repeated down the page. On for the household view,
   * where rows from several people are interleaved and "whose £48 was that" is
   * otherwise unanswerable. The colour comes from the roster so the chip matches
   * the dot beside that person's name in the sidebar.
   */
  showMember?: boolean;
  memberColorById?: Map<string, string | null>;
}

export function TransactionTable({
  transactions,
  currency = DEFAULT_CURRENCY,
  expandedKeys,
  onExpandedChange,
  focusTransactionId,
  onEdit,
  onDelete,
  showMember = false,
  memberColorById,
}: TransactionTableProps) {
  // Amounts go through formatAmount rather than formatMoney, so privacy
  // mode covers them. A figure that bypassed it would stay legible with the
  // toggle on, and a screen that hides most of its numbers is worse than one
  // that hides none — the person believes they are covered.
  const { formatAmount } = usePrivacyMode();

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
                    <span className="text-success">+{formatAmount(totals.incomeMinor, currency)}</span>
                  )}
                  {totals.expenseMinor > 0 && (
                    <span className="text-foreground/70">
                      −{formatAmount(totals.expenseMinor, currency)}
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
                const memberColor = showMember
                  ? effectiveColor(memberColorById?.get(txn.familyMemberId) ?? null, txn.familyMemberName)
                  : null;

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
                      <span className="flex min-w-0 items-center gap-1.5 text-xs text-foreground/50">
                        {showMember && (
                          <span className="flex min-w-0 shrink-0 items-center gap-1 font-medium text-foreground/70">
                            {categoryColorsEnabled && memberColor && (
                              <span
                                className="size-2 shrink-0 rounded-full"
                                style={{ backgroundColor: memberColor }}
                                aria-hidden
                              />
                            )}
                            <span className="truncate">{txn.familyMemberName}</span>
                            <span aria-hidden>·</span>
                          </span>
                        )}
                        <span className="truncate">
                          {[txn.category?.name, txn.method, txn.recurrence ? "Recurring" : null]
                            .filter(Boolean)
                            .join(" · ") || "Uncategorized"}
                        </span>
                      </span>
                    </div>

                    <span
                      className={`shrink-0 text-sm tabular-nums ${
                        txn.direction === "INCOME" ? "text-success" : "text-foreground"
                      }`}
                    >
                      {txn.direction === "INCOME" ? "+" : "−"}
                      {formatAmount(txn.amountMinor, currency)}
                    </span>

                    {/* Gated on `isMine`, not merely rendered. Reads are
                        household-wide and writes are not, so this list contains
                        rows belonging to housemates — and UpdateTransaction /
                        DeleteTransaction check ownership in a `@check` the person
                        never sees. An always-enabled menu turns a deliberate
                        boundary into what looks like a bug, and it shows up here
                        the moment several people's rows are interleaved.

                        A spacer keeps the amounts in one column whether or not
                        the menu is there; without it every housemate's row sits
                        8px wider than the ones around it. */}
                    {txn.isMine ? (
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
                    ) : (
                      <span
                        className="size-4 shrink-0"
                        title={`${txn.ownerUsername} added this. You can see it, but only they can change it.`}
                      />
                    )}
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
