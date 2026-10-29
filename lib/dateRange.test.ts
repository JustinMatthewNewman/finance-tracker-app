import { describe, expect, it } from "vitest";
import {
  bucketFor,
  bucketKeyOf,
  bucketKeysIn,
  dayCount,
  previousPeriod,
  resolvePreset,
} from "./dateRange";

// A fixed "today" rather than new Date(): every function here takes the clock as
// a parameter precisely so the tests do not have to freeze it.
// 2026-03-15 is a Sunday, which is the awkward case for Monday-start weeks.
const TODAY = new Date(2026, 2, 15);

describe("resolvePreset", () => {
  it("makes a trailing window inclusive of today", () => {
    // Seven days means seven, not eight. An off-by-one here overstates every
    // trailing total on the dashboard.
    expect(resolvePreset("last7", TODAY)).toEqual({
      startDate: "2026-03-09",
      endDate: "2026-03-15",
    });
    expect(dayCount(resolvePreset("last7", TODAY))).toBe(7);
    expect(dayCount(resolvePreset("last30", TODAY))).toBe(30);
    expect(dayCount(resolvePreset("last90", TODAY))).toBe(90);
  });

  it("runs 'this month' to the end of the month, not to today", () => {
    // The dashboard shows projections too, so a window stopping at today would
    // cut off the bills the rest of the month is expecting.
    expect(resolvePreset("thisMonth", TODAY)).toEqual({
      startDate: "2026-03-01",
      endDate: "2026-03-31",
    });
  });

  it("gets last month's length right across a short month", () => {
    expect(resolvePreset("lastMonth", TODAY)).toEqual({
      startDate: "2026-02-01",
      endDate: "2026-02-28",
    });
  });

  it("handles a leap February", () => {
    expect(resolvePreset("lastMonth", new Date(2028, 2, 10))).toEqual({
      startDate: "2028-02-01",
      endDate: "2028-02-29",
    });
  });

  it("counts whole months back, ending with this month in full", () => {
    expect(resolvePreset("last6Months", TODAY)).toEqual({
      startDate: "2025-10-01",
      endDate: "2026-03-31",
    });
    expect(resolvePreset("last12Months", TODAY)).toEqual({
      startDate: "2025-04-01",
      endDate: "2026-03-31",
    });
  });

  it("starts year to date on the 1st of January", () => {
    expect(resolvePreset("yearToDate", TODAY)).toEqual({
      startDate: "2026-01-01",
      endDate: "2026-03-15",
    });
  });

  it("crosses a year boundary without arithmetic of its own", () => {
    expect(resolvePreset("lastMonth", new Date(2026, 0, 9))).toEqual({
      startDate: "2025-12-01",
      endDate: "2025-12-31",
    });
  });

  it("gives custom a window to start editing from rather than throwing", () => {
    // The control switches to custom BEFORE anything is typed, so a throw there
    // would be a crash on a mode change.
    expect(resolvePreset("custom", TODAY)).toEqual(resolvePreset("last30", TODAY));
  });

  it("never builds a date by parsing a string, so no range shifts by a day", () => {
    // The regression this guards: new Date("2026-03-01") is UTC midnight, which
    // is 29 February for anyone west of Greenwich. Every preset must start and
    // end on the day it says.
    for (const preset of ["last7", "thisMonth", "lastMonth", "yearToDate"] as const) {
      const r = resolvePreset(preset, TODAY);
      expect(r.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.startDate <= r.endDate).toBe(true);
    }
  });
});

describe("dayCount", () => {
  it("counts a single day as one", () => {
    expect(dayCount({ startDate: "2026-03-15", endDate: "2026-03-15" })).toBe(1);
  });

  it("is inclusive of both ends", () => {
    expect(dayCount({ startDate: "2026-03-01", endDate: "2026-03-31" })).toBe(31);
  });

  it("survives a daylight-saving boundary", () => {
    // The hour that goes missing in spring makes the raw millisecond division
    // land on 30.958…; flooring it would lose a day twice a year.
    expect(dayCount({ startDate: "2026-03-01", endDate: "2026-04-30" })).toBe(61);
    expect(dayCount({ startDate: "2026-10-01", endDate: "2026-11-30" })).toBe(61);
  });
});

describe("previousPeriod", () => {
  it("is the same length and ends the day before", () => {
    const range = { startDate: "2026-03-01", endDate: "2026-03-31" };
    expect(previousPeriod(range)).toEqual({
      startDate: "2026-01-29",
      endDate: "2026-02-28",
    });
    expect(dayCount(previousPeriod(range))).toBe(dayCount(range));
  });

  it("never shares a day with the period it precedes", () => {
    // An overlap would count the same money in both halves of a comparison.
    const range = { startDate: "2026-03-09", endDate: "2026-03-15" };
    expect(previousPeriod(range).endDate < range.startDate).toBe(true);
  });

  it("works for an odd-length window", () => {
    const range = { startDate: "2026-03-01", endDate: "2026-03-17" };
    const prev = previousPeriod(range);
    expect(dayCount(prev)).toBe(17);
    expect(prev).toEqual({ startDate: "2026-02-12", endDate: "2026-02-28" });
  });
});

describe("bucketFor", () => {
  it("uses days for a short window, then weeks, then months", () => {
    expect(bucketFor({ startDate: "2026-03-09", endDate: "2026-03-15" })).toBe("day");
    expect(bucketFor({ startDate: "2026-01-01", endDate: "2026-03-02" })).toBe("day");
    expect(bucketFor({ startDate: "2026-01-01", endDate: "2026-06-30" })).toBe("week");
    expect(bucketFor({ startDate: "2025-04-01", endDate: "2026-03-31" })).toBe("week");
    expect(bucketFor({ startDate: "2024-01-01", endDate: "2026-03-31" })).toBe("month");
  });

  it("keeps every preset's column count in a drawable range", () => {
    // The point of the thresholds: below about 7 columns a chart is a stat tile,
    // and past about 60 the columns are too thin to carry a rounded end or a hit
    // target.
    for (const preset of ["last7", "last30", "last90", "thisMonth", "last6Months", "last12Months", "yearToDate"] as const) {
      const range = resolvePreset(preset, TODAY);
      const count = bucketKeysIn(range, bucketFor(range)).length;
      expect(count).toBeGreaterThanOrEqual(5);
      expect(count).toBeLessThanOrEqual(64);
    }
  });
});

describe("bucketKeyOf", () => {
  it("is the day itself for daily buckets", () => {
    expect(bucketKeyOf("2026-03-15", "day")).toBe("2026-03-15");
  });

  it("is the month prefix for monthly buckets", () => {
    expect(bucketKeyOf("2026-03-15", "month")).toBe("2026-03");
  });

  it("snaps a week to its Monday, including from a Sunday", () => {
    // 2026-03-15 is a Sunday — the day that lands in the PREVIOUS Monday's week
    // under ISO, and the one a Sunday-start implementation gets wrong.
    expect(bucketKeyOf("2026-03-15", "week")).toBe("2026-03-09");
    expect(bucketKeyOf("2026-03-09", "week")).toBe("2026-03-09");
    expect(bucketKeyOf("2026-03-16", "week")).toBe("2026-03-16");
  });

  it("produces keys that sort chronologically as strings", () => {
    // Everything downstream orders buckets by string compare rather than parsing
    // them back into Dates.
    const keys = ["2026-03-09", "2026-02-23", "2026-12-28"].map((d) => bucketKeyOf(d, "week"));
    expect([...keys].sort()).toEqual(["2026-02-23", "2026-03-09", "2026-12-28"]);
  });
});

describe("bucketKeysIn", () => {
  it("lists every day in the range", () => {
    expect(bucketKeysIn({ startDate: "2026-03-01", endDate: "2026-03-05" }, "day")).toEqual([
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
      "2026-03-05",
    ]);
  });

  it("includes buckets with nothing in them", () => {
    // The axis comes from the range, never from the data — a week with no
    // spending must be a gap on the chart, not a closed-up one.
    expect(bucketKeysIn({ startDate: "2026-03-01", endDate: "2026-03-31" }, "day")).toHaveLength(31);
  });

  it("starts weeks on the first bucket's Monday, even before the range", () => {
    // Otherwise the first column is a partial week misaligned with every column
    // after it.
    expect(bucketKeysIn({ startDate: "2026-03-04", endDate: "2026-03-20" }, "week")).toEqual([
      "2026-03-02",
      "2026-03-09",
      "2026-03-16",
    ]);
  });

  it("lists months across a year boundary", () => {
    expect(bucketKeysIn({ startDate: "2025-11-01", endDate: "2026-02-28" }, "month")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });

  it("returns one bucket for a single-day range", () => {
    expect(bucketKeysIn({ startDate: "2026-03-15", endDate: "2026-03-15" }, "day")).toEqual([
      "2026-03-15",
    ]);
  });
});
