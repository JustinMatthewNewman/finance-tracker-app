"use client";

import { Button, Dropdown } from "@heroui/react";
import { LayoutColumns, Plus } from "@gravity-ui/icons";
import { addMonths, monthLabel } from "@/lib/monthRange";
import type { MonthKey } from "@/lib/monthRange";

// The control strip above the records table — ported from Finance Manager
// Pro's IncomeTableControls / ExpenseTableControls (also two near-identical
// files over there, merged into one here).
//
// FMP used separate month and year dropdowns. This uses the same prev/next
// month stepper the Household page already has, so all three tabs move
// through time identically — two different period pickers in one app is the
// kind of inconsistency people notice without being able to name.

export interface ColumnOption {
  key: string;
  label: string;
}

interface RecordsTableControlsProps {
  monthKey: MonthKey;
  onMonthChange: (key: MonthKey) => void;
  availableColumns: ColumnOption[];
  selectedColumns: Set<string>;
  onSelectedColumnsChange: (keys: Set<string>) => void;
  onAdd?: () => void;
  addLabel?: string;
}

export function RecordsTableControls({
  monthKey,
  onMonthChange,
  availableColumns,
  selectedColumns,
  onSelectedColumnsChange,
  onAdd,
  addLabel = "Add",
}: RecordsTableControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          isIconOnly
          aria-label="Previous month"
          onPress={() => onMonthChange(addMonths(monthKey, -1))}
        >
          ‹
        </Button>
        <span className="min-w-36 text-center text-sm font-medium text-foreground">
          {monthLabel(monthKey)}
        </span>
        <Button
          size="sm"
          variant="ghost"
          isIconOnly
          aria-label="Next month"
          onPress={() => onMonthChange(addMonths(monthKey, 1))}
        >
          ›
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Dropdown>
          <Dropdown.Trigger aria-label="Choose visible columns">
            <LayoutColumns width={16} height={16} />
          </Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu
              aria-label="Visible columns"
              selectionMode="multiple"
              disallowEmptySelection
              selectedKeys={selectedColumns}
              onSelectionChange={(keys) => {
                // "all" is react-aria's sentinel for a select-all; it is not a
                // Set, so spreading it directly yields an empty selection and
                // the table loses every column.
                if (keys === "all") {
                  onSelectedColumnsChange(new Set(availableColumns.map((c) => c.key)));
                } else {
                  onSelectedColumnsChange(new Set(Array.from(keys, String)));
                }
              }}
            >
              {availableColumns.map((col) => (
                <Dropdown.Item key={col.key} id={col.key}>
                  {col.label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        {onAdd && (
          <Button size="sm" onPress={onAdd} aria-label={addLabel}>
            <Plus width={16} height={16} aria-hidden /> {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export default RecordsTableControls;
