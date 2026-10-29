"use client";

import { useState } from "react";
import { Dropdown } from "@heroui/react";
import { Calendar, ChevronDown } from "@gravity-ui/icons";
import {
  RANGE_PRESETS,
  RANGE_PRESET_LABELS,
  type DateRange,
  type RangePreset,
  rangeLabel,
  resolvePreset,
} from "@/lib/dateRange";

interface DateRangeControlProps {
  preset: RangePreset;
  range: DateRange;
  onPresetChange: (preset: RangePreset) => void;
  onCustomChange: (range: DateRange) => void;
}

/**
 * The one control that scopes the whole dashboard.
 *
 * PRESETS AS ROWS, CUSTOM BEHIND A HAIRLINE. Nobody fights a calendar grid for
 * "last 30 days", so the list people actually want is the list they get, and the
 * two date inputs sit in a footer below a rule rather than competing with it.
 *
 * ONE CONTROL, ABOVE EVERYTHING IT SCOPES — never one per widget. Every stat,
 * chart and table on the page reads the same window, which is what makes their
 * figures reconcilable against each other. A widget with its own range would be
 * a different dashboard.
 */
export function DateRangeControl({
  preset,
  range,
  onPresetChange,
  onCustomChange,
}: DateRangeControlProps) {
  // Mirrors of the two inputs, so a half-typed date does not refetch the page on
  // every keystroke — committed on change only once both ends parse.
  const [draftStart, setDraftStart] = useState(range.startDate);
  const [draftEnd, setDraftEnd] = useState(range.endDate);

  const commit = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return;
    // Swapped ends are a typo, not an error worth a message: a range is a pair of
    // days and the person plainly meant the span between them.
    const ordered =
      startDate <= endDate ? { startDate, endDate } : { startDate: endDate, endDate: startDate };
    onCustomChange(ordered);
  };

  return (
    <Dropdown>
      <Dropdown.Trigger aria-label="Change the date range">
        <span className="flex items-center gap-2">
          <Calendar className="size-4 shrink-0" aria-hidden />
          <span className="flex min-w-0 flex-col items-start leading-tight">
            <span className="text-sm font-medium text-foreground">
              {RANGE_PRESET_LABELS[preset]}
            </span>
            <span className="text-[11px] text-foreground/50">{rangeLabel(range)}</span>
          </span>
          <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden />
        </span>
      </Dropdown.Trigger>

      <Dropdown.Popover>
        <div className="min-w-64">
          <Dropdown.Menu
            selectionMode="single"
            selectedKeys={[preset]}
            onAction={(key) => {
              const next = String(key) as RangePreset;
              onPresetChange(next);
              if (next === "custom") {
                // Seed the inputs from the window already on screen, so "custom"
                // opens on what the person was just looking at rather than blank.
                const seed = resolvePreset("custom", new Date());
                setDraftStart(range.startDate || seed.startDate);
                setDraftEnd(range.endDate || seed.endDate);
              }
            }}
          >
            {RANGE_PRESETS.filter((p) => p !== "custom").map((p) => (
              <Dropdown.Item key={p} id={p}>
                {RANGE_PRESET_LABELS[p]}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>

          {/* The hairline is the whole point of the footer: it says "these two
              belong together and are not another preset". */}
          <div className="mt-1 border-t border-border px-3 pt-3 pb-1">
            <p className="mb-2 text-xs font-medium text-foreground/70">Custom range</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                aria-label="Range start"
                value={draftStart}
                max={draftEnd || undefined}
                onChange={(e) => {
                  setDraftStart(e.target.value);
                  onPresetChange("custom");
                  commit(e.target.value, draftEnd);
                }}
                className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground"
              />
              <span className="shrink-0 text-xs text-foreground/40" aria-hidden>
                –
              </span>
              <input
                type="date"
                aria-label="Range end"
                value={draftEnd}
                min={draftStart || undefined}
                onChange={(e) => {
                  setDraftEnd(e.target.value);
                  onPresetChange("custom");
                  commit(draftStart, e.target.value);
                }}
                className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground"
              />
            </div>
          </div>
        </div>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export default DateRangeControl;
