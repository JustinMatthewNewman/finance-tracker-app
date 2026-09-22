import { describe, expect, it } from "vitest";
import {
  buildMonthGrid,
  addMonths,
  fromDateString,
  groupByDay,
  isSameMonth,
  monthKeyOf,
  monthRange,
  toDateString,
} from "./monthRange";

describe("toDateString", () => {
  // The bug this module exists to prevent: toISOString() converts to UTC
  // first, so a local date late in the day becomes the *next* day's string
  // for anyone east of Greenwich, and an early-morning one becomes the
  // previous day's for anyone west. Reading the local parts avoids it.
  it("uses local date parts, not the UTC instant", () => {
    const lateEvening = new Date(2026, 8, 30, 23, 30);
    expect(toDateString(lateEvening)).toBe("2026-09-30");

    const earlyMorning = new Date(2026, 8, 1, 0, 30);
    expect(toDateString(earlyMorning)).toBe("2026-09-01");
  });

  it("zero-pads month and day", () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("fromDateString", () => {
  it("parses as a local calendar day", () => {
    const d = fromDateString("2026-09-01");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(1); // not Aug 31, which `new Date("2026-09-01")` gives west of UTC
  });

  it("round-trips with toDateString", () => {
    for (const value of ["2026-01-01", "2026-02-28", "2026-09-30", "2026-12-31"]) {
      expect(toDateString(fromDateString(value))).toBe(value);
    }
  });
});

describe("addMonths", () => {
  it("rolls over year boundaries in both directions", () => {
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(addMonths({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
  });

  it("steps by more than a year", () => {
    expect(addMonths({ year: 2026, month: 5 }, 14)).toEqual({ year: 2027, month: 7 });
    expect(addMonths({ year: 2026, month: 5 }, -18)).toEqual({ year: 2024, month: 11 });
  });

  it("is a no-op for zero", () => {
    expect(addMonths({ year: 2026, month: 8 }, 0)).toEqual({ year: 2026, month: 8 });
  });
});

describe("monthRange", () => {
  it("covers the whole month inclusively", () => {
    expect(monthRange({ year: 2026, month: 8 })).toEqual({
      startDate: "2026-09-01",
      endDate: "2026-09-30",
    });
  });

  // Day 0 of the next month is the last day of this one — which is how this
  // gets month lengths and leap years right without a lookup table.
  it("gets 31-day months, February and leap years right", () => {
    expect(monthRange({ year: 2026, month: 0 }).endDate).toBe("2026-01-31");
    expect(monthRange({ year: 2026, month: 1 }).endDate).toBe("2026-02-28");
    expect(monthRange({ year: 2024, month: 1 }).endDate).toBe("2024-02-29");
    expect(monthRange({ year: 2026, month: 11 }).endDate).toBe("2026-12-31");
  });

  // The sidebar and the detail panel both filter with plain string
  // comparison against these bounds, which is only valid because
  // "yyyy-mm-dd" sorts lexicographically the same way it sorts
  // chronologically.
  it("produces bounds that are correct under string comparison", () => {
    const { startDate, endDate } = monthRange({ year: 2026, month: 8 });
    expect("2026-09-01" >= startDate && "2026-09-01" <= endDate).toBe(true);
    expect("2026-09-30" >= startDate && "2026-09-30" <= endDate).toBe(true);
    expect("2026-08-31" >= startDate).toBe(false);
    expect("2026-10-01" <= endDate).toBe(false);
  });
});

describe("isSameMonth / monthKeyOf", () => {
  it("compares year and month only", () => {
    const a = monthKeyOf(new Date(2026, 8, 1));
    const b = monthKeyOf(new Date(2026, 8, 30));
    expect(isSameMonth(a, b)).toBe(true);
    expect(isSameMonth(a, { year: 2025, month: 8 })).toBe(false);
    expect(isSameMonth(a, { year: 2026, month: 9 })).toBe(false);
  });
});

describe("groupByDay", () => {
  it("buckets rows by calendar day", () => {
    const rows = [
      { occurredOn: "2026-09-18" },
      { occurredOn: "2026-09-18" },
      { occurredOn: "2026-09-17" },
    ];
    const grouped = groupByDay(rows, (r) => r.occurredOn);
    expect(grouped.get("2026-09-18")).toHaveLength(2);
    expect(grouped.get("2026-09-17")).toHaveLength(1);
  });

  // Data Connect may hand back a Date column with a time component; the key
  // is sliced rather than re-parsed so no timezone shift can creep back in.
  it("keys off the date portion when a timestamp is supplied", () => {
    const grouped = groupByDay([{ occurredOn: "2026-09-18T23:00:00Z" }], (r) => r.occurredOn);
    expect(grouped.has("2026-09-18")).toBe(true);
  });

  it("returns an empty map for no rows", () => {
    expect(groupByDay([], () => "")).toEqual(new Map());
  });
});

describe("buildMonthGrid", () => {
  it("always returns whole weeks", () => {
    // Every month of a leap year and a non-leap year.
    for (const year of [2024, 2026]) {
      for (let month = 0; month < 12; month++) {
        const grid = buildMonthGrid({ year, month });
        expect(grid.length % 7).toBe(0);
      }
    }
  });

  it("starts on a Monday and ends on a Sunday", () => {
    for (let month = 0; month < 12; month++) {
      const grid = buildMonthGrid({ year: 2026, month });
      expect(grid[0].date.getDay()).toBe(1); // Monday
      expect(grid[grid.length - 1].date.getDay()).toBe(0); // Sunday
    }
  });

  it("marks exactly the month's own days as current", () => {
    // September 2026 has 30 days.
    const grid = buildMonthGrid({ year: 2026, month: 8 });
    expect(grid.filter((d) => d.isCurrentMonth)).toHaveLength(30);
    // February 2024 was a leap February.
    expect(buildMonthGrid({ year: 2024, month: 1 }).filter((d) => d.isCurrentMonth)).toHaveLength(29);
    expect(buildMonthGrid({ year: 2026, month: 1 }).filter((d) => d.isCurrentMonth)).toHaveLength(28);
  });

  it("pads with the adjacent months rather than blanks", () => {
    // 1 Sept 2026 is a Tuesday, so exactly one leading day (Mon 31 Aug).
    const grid = buildMonthGrid({ year: 2026, month: 8 });
    expect(grid[0].dayKey).toBe("2026-08-31");
    expect(grid[0].isCurrentMonth).toBe(false);
    expect(grid[1].dayKey).toBe("2026-09-01");
    expect(grid[1].isCurrentMonth).toBe(true);
  });

  it("needs six leading days when the month starts on a Sunday", () => {
    // 1 Feb 2026 is a Sunday — the case a 0-indexed Sunday gets wrong.
    const grid = buildMonthGrid({ year: 2026, month: 1 });
    expect(grid.slice(0, 6).every((d) => !d.isCurrentMonth)).toBe(true);
    expect(grid[6].dayKey).toBe("2026-02-01");
  });

  it("produces consecutive days with no gaps or repeats", () => {
    const grid = buildMonthGrid({ year: 2026, month: 2 });
    const keys = grid.map((d) => d.dayKey);
    expect(new Set(keys).size).toBe(keys.length);
    for (let i = 1; i < grid.length; i++) {
      const prev = grid[i - 1].date.getTime();
      const cur = grid[i].date.getTime();
      // Exactly one calendar day apart. Compared on the date parts rather
      // than a fixed 86_400_000ms, which is wrong across a DST boundary.
      const expected = new Date(grid[i - 1].date);
      expected.setDate(expected.getDate() + 1);
      expect(cur).toBe(expected.getTime());
      expect(cur).toBeGreaterThan(prev);
    }
  });

  it("spans a DST transition without dropping or duplicating a day", () => {
    // US DST starts 8 Mar 2026 and ends 1 Nov 2026.
    for (const month of [2, 10]) {
      const grid = buildMonthGrid({ year: 2026, month });
      const keys = grid.map((d) => d.dayKey);
      expect(new Set(keys).size).toBe(keys.length);
      expect(grid.length % 7).toBe(0);
    }
  });
});
