"use client";

import { useState, type ReactNode } from "react";
import { Button, Card } from "@heroui/react";
import { LayoutHeaderColumns, Eye } from "@gravity-ui/icons";
import { useBorders } from "@/context/BordersContext";

export interface TableColumn {
  key: string;
  label: string;
  /** Right-aligned and tabular — for columns of figures that must line up. */
  numeric?: boolean;
}

export interface WidgetTable {
  columns: TableColumn[];
  rows: Record<string, string>[];
}

interface WidgetCardProps {
  title: string;
  /** One line under the title saying what the figures mean. */
  subtitle?: string;
  /** Pinned to the top-right — a legend, a toggle, a total. */
  actions?: ReactNode;
  /**
   * The chart's values as a table.
   *
   * EVERY CHART HERE HAS ONE, and that is not a nicety: a tooltip must never be
   * the only way to read a value. It is the keyboard path, the screen-reader
   * path, and the answer for anybody who cannot separate two of the colours.
   */
  table?: WidgetTable;
  /** Dimmed instead of unmounted while a refetch is in flight. */
  isStale?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * The shell every dashboard widget sits in.
 *
 * Holds the three things every one of them needs and none of them should
 * reimplement: the heading, the table-view twin, and the refetch behaviour.
 *
 * REFETCH KEEPS THE FRAME. While new data loads the previous render stays put at
 * reduced opacity — no skeleton, no layout jump. A dashboard that collapses to
 * grey boxes every time the range changes is unusable precisely when somebody is
 * exploring, which is the only time they change the range.
 */
export function WidgetCard({
  title,
  subtitle,
  actions,
  table,
  isStale = false,
  className = "",
  children,
}: WidgetCardProps) {
  const { bordersEnabled } = useBorders();
  const [showTable, setShowTable] = useState(false);

  return (
    <Card
      className={`flex min-w-0 flex-col overflow-hidden ${bordersEnabled ? "" : "border-none"} ${className}`}
    >
      <div className="flex shrink-0 items-start justify-between gap-3 px-4 pt-3 pb-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="truncate text-xs text-foreground/50">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {actions}
          {table && (
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              aria-label={showTable ? `Show the ${title} chart` : `Show ${title} as a table`}
              onPress={() => setShowTable((v) => !v)}
            >
              {showTable ? <Eye className="size-4" /> : <LayoutHeaderColumns className="size-4" />}
            </Button>
          )}
        </div>
      </div>

      <div
        className={`min-h-0 flex-1 px-4 pb-4 transition-opacity duration-200 ${
          isStale ? "opacity-50" : "opacity-100"
        }`}
      >
        {showTable && table ? <WidgetDataTable table={table} /> : children}
      </div>
    </Card>
  );
}

/**
 * The table twin.
 *
 * `tabular-nums` only on the numeric columns — these are columns of figures that
 * have to align vertically, which is the one place equal-width digits help. The
 * big standalone numbers elsewhere on the dashboard deliberately do not use it.
 */
function WidgetDataTable({ table }: { table: WidgetTable }) {
  if (table.rows.length === 0) {
    return <p className="py-6 text-sm text-foreground/50">Nothing in this period.</p>;
  }
  return (
    <div className="max-h-72 overflow-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-border text-foreground/60">
            {table.columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`py-1.5 font-medium ${col.numeric ? "text-right" : "text-left"}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              {table.columns.map((col) => (
                <td
                  key={col.key}
                  className={`py-1.5 text-foreground/80 ${
                    col.numeric ? "text-right tabular-nums" : "text-left"
                  }`}
                >
                  {row[col.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default WidgetCard;
