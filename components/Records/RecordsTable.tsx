"use client";

import { useMemo } from "react";
import { Chip, Table } from "@heroui/react";
import { useBorders } from "@/context/BordersContext";
import { useCategoryColorsSetting } from "@/context/CategoryColorsContext";
import { effectiveColor, rowTint } from "@/lib/entityColor";
import { type CurrencyCode, DEFAULT_CURRENCY, formatMoney, type Minor } from "@/lib/money";

// The grouped records table ported from Finance Manager Pro's Income and
// Expense tabs.
//
// Ported ONCE rather than twice. Over there IncomeTable.tsx and
// ExpenseTable.tsx are near-identical files — same grouping, same subtotal and
// grand-total rows, same column plumbing — differing only in which fields they
// read. Copying that split over would mean every later fix has to be made in
// two places, which is exactly how the two drifted apart to begin with (their
// cell renderers already handle dates differently). The per-tab differences
// live in the column definitions instead; see recordColumns.ts.

export interface RecordColumn<T> {
  key: string;
  label: string;
  /** Rendered cell content. Return a string and it's wrapped in the default span. */
  render: (row: T) => React.ReactNode;
  /** Right-aligns and applies tabular-nums — for money and other figures. */
  numeric?: boolean;
}

export interface RecordGroup<T> {
  id: string;
  name: string;
  rows: T[];
  totalMinor: Minor;
}

interface RecordsTableProps<T> {
  ariaLabel: string;
  groups: RecordGroup<T>[];
  columns: RecordColumn<T>[];
  grandTotalMinor: Minor;
  currency?: CurrencyCode;
  /** Colour per group id; falls back to a name-derived hue. */
  groupColor?: (group: RecordGroup<T>) => string | null;
  emptyMessage?: string;
  /** "Grand Total" by default. */
  grandTotalLabel?: string;
  /** Which column the totals are shown under. Defaults to the first numeric one. */
  totalsColumnKey?: string;
  rowKey: (row: T) => string;
}

export function RecordsTable<T>({
  ariaLabel,
  groups,
  columns,
  grandTotalMinor,
  currency = DEFAULT_CURRENCY,
  groupColor,
  emptyMessage = "No records found for the selected period.",
  grandTotalLabel = "Grand Total",
  totalsColumnKey,
  rowKey,
}: RecordsTableProps<T>) {
  const { bordersEnabled } = useBorders();
  const { categoryColorsEnabled } = useCategoryColorsSetting();

  const hasRows = groups.some((g) => g.rows.length > 0);

  // Where the subtotal/grand-total figures sit. FMP hardcoded the "amount"
  // key; deriving it keeps the totals under a real column even when the user
  // hides that one via the column picker — otherwise the figures silently
  // vanish and the totals rows render as a line of blanks.
  const totalsKey = useMemo(() => {
    if (totalsColumnKey && columns.some((c) => c.key === totalsColumnKey)) return totalsColumnKey;
    return columns.find((c) => c.numeric)?.key ?? columns[columns.length - 1]?.key;
  }, [columns, totalsColumnKey]);

  // react-aria requires exactly one row header per row for screen readers;
  // the first column is the natural one (it carries the person/name).
  const firstKey = columns[0]?.key;

  if (!hasRows) {
    return <p className="p-6 text-sm text-foreground/60">{emptyMessage}</p>;
  }

  return (
    <Table className="w-full">
      <Table.Content aria-label={ariaLabel}>
        <Table.Header>
          {columns.map((col) => (
            <Table.Column
              key={col.key}
              id={col.key}
              isRowHeader={col.key === firstKey}
              className={col.numeric ? "text-right" : undefined}
            >
              {col.label}
            </Table.Column>
          ))}
        </Table.Header>

        <Table.Body>
          {[
            // Detail rows, grouped by person.
            ...groups.flatMap((group) => {
              const color = groupColor?.(group) ?? effectiveColor(null, group.name);
              const tint = categoryColorsEnabled && color ? rowTint(color, 8) : undefined;

              return group.rows.map((row) => (
                <Table.Row
                  key={rowKey(row)}
                  id={rowKey(row)}
                  style={tint ? { backgroundColor: tint } : undefined}
                >
                  {columns.map((col) => (
                    <Table.Cell
                      key={col.key}
                      className={col.numeric ? "text-right tabular-nums" : undefined}
                    >
                      {col.render(row)}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ));
            }),

            // Per-group subtotal.
            ...groups
              .filter((group) => group.rows.length > 0)
              .map((group) => {
                const color = groupColor?.(group) ?? effectiveColor(null, group.name);
                return (
                  <Table.Row
                    key={`${group.id}-subtotal`}
                    id={`${group.id}-subtotal`}
                    className={bordersEnabled ? "border-t border-default-200" : undefined}
                  >
                    {columns.map((col) => (
                      <Table.Cell
                        key={col.key}
                        className={col.numeric ? "text-right tabular-nums" : undefined}
                      >
                        {col.key === firstKey ? (
                          <span className="font-semibold text-foreground">{group.name} total</span>
                        ) : col.key === totalsKey ? (
                          <Chip
                            size="sm"
                            style={
                              categoryColorsEnabled && color
                                ? { backgroundColor: rowTint(color, 22) }
                                : undefined
                            }
                          >
                            <span className="font-semibold tabular-nums">
                              {formatMoney(group.totalMinor, currency)}
                            </span>
                          </Chip>
                        ) : null}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                );
              }),

            // Grand total.
            <Table.Row
              key="grand-total"
              id="grand-total"
              className={bordersEnabled ? "border-t-2 border-default-300" : undefined}
            >
              {columns.map((col) => (
                <Table.Cell
                  key={col.key}
                  className={col.numeric ? "text-right tabular-nums" : undefined}
                >
                  {col.key === firstKey ? (
                    <span className="font-bold text-foreground">{grandTotalLabel}</span>
                  ) : col.key === totalsKey ? (
                    <Chip size="md" color="accent">
                      <span className="font-bold tabular-nums">
                        {formatMoney(grandTotalMinor, currency)}
                      </span>
                    </Chip>
                  ) : null}
                </Table.Cell>
              ))}
            </Table.Row>,
          ]}
        </Table.Body>
      </Table.Content>
    </Table>
  );
}

export default RecordsTable;
