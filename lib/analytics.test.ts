import { describe, expect, it } from "vitest";
import {
  MAX_SLICES,
  OTHER_SLICE_ID,
  type DatedRow,
  bucketSeries,
  breakdown,
  cumulative,
  dailyBurnMinor,
  delta,
  foldSlices,
  peakOutflowDay,
  savingsRate,
  stackedSeries,
} from "./analytics";
import { ledgerTotals } from "./ledgerTotals";

const out = (occurredOn: string, amountMinor: number, extra: Partial<DatedRow> = {}): DatedRow => ({
  occurredOn,
  amountMinor,
  direction: "EXPENSE",
  status: "POSTED",
  source: "IMPORT",
  ...extra,
});
const inflow = (occurredOn: string, amountMinor: number, extra: Partial<DatedRow> = {}): DatedRow => ({
  occurredOn,
  amountMinor,
  direction: "INCOME",
  status: "POSTED",
  source: "IMPORT",
  ...extra,
});
const MARCH = { startDate: "2026-03-01", endDate: "2026-03-05" };

describe("bucketSeries", () => {
  it("returns one entry per bucket in the range, in order", () => {
    const series = bucketSeries([out("2026-03-02", 1000)], MARCH, "day");
    expect(series.map((b) => b.key)).toEqual([
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
      "2026-03-05",
    ]);
  });

  it("keeps empty buckets at zero rather than dropping them", () => {
    // A week of no spending must be a gap on the chart. Dropping it joins the
    // line straight across the hole, which reads as steady.
    const series = bucketSeries([out("2026-03-03", 5000)], MARCH, "day");
    expect(series[0].out.actualMinor).toBe(0);
    expect(series[2].out.actualMinor).toBe(5000);
    expect(series).toHaveLength(5);
  });

  it("ignores rows outside the range instead of folding them into an edge bucket", () => {
    const series = bucketSeries([out("2026-02-25", 9999), out("2026-03-02", 1000)], MARCH, "day");
    expect(series.reduce((n, b) => n + b.out.actualMinor, 0)).toBe(1000);
  });

  it("totals each bucket through ledgerTotals, so projections stay apart", () => {
    const series = bucketSeries(
      [out("2026-03-02", 1000), out("2026-03-02", 400, { status: "FORECASTED", source: "FORECAST" })],
      MARCH,
      "day"
    );
    expect(series[1].out.actualMinor).toBe(1000);
    expect(series[1].out.projectedMinor).toBe(400);
    expect(series[1].out.expectedMinor).toBe(1400);
  });

  it("applies the internal-transfer preference and reports what it left out", () => {
    const rows = [out("2026-03-02", 1000), out("2026-03-02", 50000, { isInternalToUser: true })];
    expect(bucketSeries(rows, MARCH, "day")[1].out.actualMinor).toBe(51000);
    const excluded = bucketSeries(rows, MARCH, "day", { includeInternalTransfers: false })[1];
    expect(excluded.out.actualMinor).toBe(1000);
    expect(excluded.excludedTransferCount).toBe(1);
  });

  it("sums back to the whole period", () => {
    // The chart and the stat tile above it are computed separately and must agree.
    const rows = [out("2026-03-01", 100), out("2026-03-03", 250), inflow("2026-03-04", 900)];
    const series = bucketSeries(rows, MARCH, "day");
    const whole = ledgerTotals(rows);
    expect(series.reduce((n, b) => n + b.out.actualMinor, 0)).toBe(whole.out.actualMinor);
    expect(series.reduce((n, b) => n + b.in.actualMinor, 0)).toBe(whole.in.actualMinor);
  });
});

describe("cumulative", () => {
  it("accumulates actuals and carries a flat bucket forward", () => {
    const series = bucketSeries([out("2026-03-01", 100), out("2026-03-03", 400)], MARCH, "day");
    expect(cumulative(series).map((c) => c.outMinor)).toEqual([100, 100, 500, 500, 500]);
  });

  it("leaves projections out of the running total", () => {
    // A cumulative spend line is the one a bank statement can be checked
    // against, so a day a bill is merely due must not step it up.
    const series = bucketSeries(
      [out("2026-03-01", 100), out("2026-03-02", 9999, { status: "FORECASTED", source: "FORECAST" })],
      MARCH,
      "day"
    );
    expect(cumulative(series).map((c) => c.outMinor)).toEqual([100, 100, 100, 100, 100]);
  });
});

describe("foldSlices", () => {
  const slice = (id: string, valueMinor: number) => ({ id, label: id, valueMinor, count: 1 });

  it("ranks by value, descending", () => {
    expect(foldSlices([slice("a", 10), slice("b", 30), slice("c", 20)]).map((s) => s.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("breaks ties by label, so the order never depends on Map insertion", () => {
    expect(foldSlices([slice("z", 10), slice("a", 10)]).map((s) => s.id)).toEqual(["a", "z"]);
  });

  it("leaves a list within the budget untouched", () => {
    const slices = Array.from({ length: MAX_SLICES }, (_, i) => slice(`s${i}`, 100 - i));
    expect(foldSlices(slices)).toHaveLength(MAX_SLICES);
    expect(foldSlices(slices).some((s) => s.id === OTHER_SLICE_ID)).toBe(false);
  });

  it("folds the tail rather than dropping it, so the parts still add up", () => {
    // Truncating would make a part-to-whole chart stop summing to the total
    // above it, which is the one thing it must never do.
    const slices = Array.from({ length: MAX_SLICES + 4 }, (_, i) => slice(`s${i}`, 100 - i));
    const folded = foldSlices(slices);
    expect(folded).toHaveLength(MAX_SLICES + 1);
    expect(folded[folded.length - 1].id).toBe(OTHER_SLICE_ID);
    const total = slices.reduce((n, s) => n + s.valueMinor, 0);
    expect(folded.reduce((n, s) => n + s.valueMinor, 0)).toBe(total);
  });

  it("names how many categories it folded", () => {
    const slices = Array.from({ length: MAX_SLICES + 3 }, (_, i) => slice(`s${i}`, 100 - i));
    expect(foldSlices(slices)[MAX_SLICES].label).toBe("Other (3)");
  });

  it("does not mutate its input", () => {
    const slices = [slice("a", 10), slice("b", 30)];
    foldSlices(slices);
    expect(slices.map((s) => s.id)).toEqual(["a", "b"]);
  });
});

describe("breakdown", () => {
  const byCategory = (row: DatedRow & { category?: string | null }) =>
    row.category ? { id: row.category, label: row.category } : null;

  it("groups by the key and totals the chosen side", () => {
    const rows = [
      { ...out("2026-03-01", 1000), category: "Groceries" },
      { ...out("2026-03-02", 500), category: "Groceries" },
      { ...out("2026-03-02", 400), category: "Dining" },
    ];
    const slices = breakdown(rows, "out", byCategory);
    expect(slices.find((s) => s.id === "Groceries")?.valueMinor).toBe(1500);
    expect(slices.find((s) => s.id === "Dining")?.valueMinor).toBe(400);
  });

  it("buckets a null key under a visible label rather than hiding it", () => {
    // An uncategorized row is what the importer leaves when it will not guess;
    // hiding those would make the breakdown quietly smaller than the total.
    const slices = breakdown([{ ...out("2026-03-01", 700), category: null }], "out", byCategory);
    expect(slices).toHaveLength(1);
    expect(slices[0].label).toBe("Uncategorized");
  });

  it("drops a group whose rows are all on the other side of the ledger", () => {
    // It would draw a zero-length bar with a legend entry, costing a colour slot.
    const rows = [
      { ...inflow("2026-03-01", 9000), category: "Salary" },
      { ...out("2026-03-01", 1000), category: "Groceries" },
    ];
    expect(breakdown(rows, "out", byCategory).map((s) => s.id)).toEqual(["Groceries"]);
  });

  it("reads the income side when asked", () => {
    const rows = [{ ...inflow("2026-03-01", 9000), category: "Salary" }];
    expect(breakdown(rows, "in", byCategory)[0].valueMinor).toBe(9000);
  });

  it("adds up to the period total", () => {
    const rows = [
      { ...out("2026-03-01", 1000), category: "Groceries" },
      { ...out("2026-03-02", 400), category: "Dining" },
      { ...out("2026-03-02", 250), category: null },
    ];
    const slices = breakdown(rows, "out", byCategory);
    expect(slices.reduce((n, s) => n + s.valueMinor, 0)).toBe(ledgerTotals(rows).out.actualMinor);
  });
});

describe("stackedSeries", () => {
  const byCategory = (row: DatedRow & { category?: string | null }) =>
    row.category ? { id: row.category, label: row.category } : null;
  const rows = [
    { ...out("2026-03-01", 1000), category: "Groceries" },
    { ...out("2026-03-01", 300), category: "Dining" },
    { ...out("2026-03-03", 700), category: "Groceries" },
  ];

  it("gives every bucket a column and every slice a fixed band", () => {
    const s = stackedSeries(rows, MARCH, "day", "out", byCategory);
    expect(s.bucketKeys).toHaveLength(5);
    // Slices come from the WHOLE period and keep their order in every column, so
    // a band can be followed across the chart.
    expect(s.slices.map((x) => x.id)).toEqual(["Groceries", "Dining"]);
  });

  it("looks up a cell by bucket and slice, and omits the zeroes", () => {
    const s = stackedSeries(rows, MARCH, "day", "out", byCategory);
    expect(s.cells.get("2026-03-01|Groceries")).toBe(1000);
    expect(s.cells.get("2026-03-01|Dining")).toBe(300);
    expect(s.cells.get("2026-03-02|Groceries")).toBeUndefined();
  });

  it("reports each column's height and the tallest, for scaling", () => {
    const s = stackedSeries(rows, MARCH, "day", "out", byCategory);
    expect(s.bucketTotalsMinor).toEqual([1300, 0, 700, 0, 0]);
    expect(s.maxBucketMinor).toBe(1300);
  });

  it("keeps the same slice order in every column rather than ranking per column", () => {
    // Ranking within each column independently repaints and reorders the bands
    // column by column — recolour-on-filter, one axis over.
    const uneven = [
      { ...out("2026-03-01", 100), category: "A" },
      { ...out("2026-03-01", 900), category: "B" },
      { ...out("2026-03-02", 900), category: "A" },
      { ...out("2026-03-02", 100), category: "B" },
    ];
    const s = stackedSeries(uneven, MARCH, "day", "out", byCategory);
    expect(s.slices.map((x) => x.id)).toEqual(["A", "B"]);
    expect(s.cells.get("2026-03-01|A")).toBe(100);
    expect(s.cells.get("2026-03-02|A")).toBe(900);
  });

  it("folds the tail into one band and still sums to the column total", () => {
    const many = Array.from({ length: MAX_SLICES + 3 }, (_, i) => ({
      ...out("2026-03-01", 1000 - i * 10),
      category: `cat${i}`,
    }));
    const s = stackedSeries(many, MARCH, "day", "out", byCategory);
    expect(s.slices).toHaveLength(MAX_SLICES + 1);
    expect(s.slices[s.slices.length - 1].id).toBe(OTHER_SLICE_ID);
    const columnTotal = s.slices.reduce((n, slice) => n + (s.cells.get(`2026-03-01|${slice.id}`) ?? 0), 0);
    expect(columnTotal).toBe(ledgerTotals(many).out.actualMinor);
  });

  it("is empty-but-shaped for a period with no rows", () => {
    const s = stackedSeries([], MARCH, "day", "out", byCategory);
    expect(s.bucketKeys).toHaveLength(5);
    expect(s.slices).toEqual([]);
    expect(s.maxBucketMinor).toBe(0);
    expect(s.bucketTotalsMinor).toEqual([0, 0, 0, 0, 0]);
  });
});

describe("delta", () => {
  it("reports the signed change and its fraction", () => {
    expect(delta(12000, 10000)).toEqual({
      currentMinor: 12000,
      previousMinor: 10000,
      changeMinor: 2000,
      changeFraction: 0.2,
    });
  });

  it("has no fraction when the previous period was zero", () => {
    // "Rose from nothing to £40" has no percentage, and both Infinity and 0
    // render as a number that looks like one.
    expect(delta(4000, 0).changeFraction).toBeNull();
    expect(delta(4000, 0).changeMinor).toBe(4000);
  });
});

describe("savingsRate", () => {
  it("is the fraction of income that stayed", () => {
    expect(savingsRate(ledgerTotals([inflow("2026-03-01", 10000), out("2026-03-01", 2500)]))).toBe(0.75);
  });

  it("is null when nothing came in", () => {
    // No income means no savings rate; 0% would be a claim about behaviour
    // rather than an absence of data.
    expect(savingsRate(ledgerTotals([out("2026-03-01", 2500)]))).toBeNull();
  });

  it("clamps at zero when the period overspent", () => {
    expect(savingsRate(ledgerTotals([inflow("2026-03-01", 1000), out("2026-03-01", 4000)]))).toBe(0);
  });
});

describe("dailyBurnMinor", () => {
  it("divides money out by the window's inclusive day count", () => {
    const totals = ledgerTotals([out("2026-03-01", 10000)]);
    expect(dailyBurnMinor(totals, MARCH)).toBe(2000);
  });
});

describe("peakOutflowDay", () => {
  it("finds the biggest spending day", () => {
    // A dashboard of smooth aggregates hides the one day that explains the
    // month, which is usually what somebody opened it to find.
    const rows = [out("2026-03-01", 1000), out("2026-03-03", 4800), out("2026-03-03", 200)];
    expect(peakOutflowDay(rows)).toEqual({ dayKey: "2026-03-03", outMinor: 5000 });
  });

  it("breaks a tie on the earlier day, so the answer is deterministic", () => {
    const rows = [out("2026-03-03", 1000), out("2026-03-01", 1000)];
    expect(peakOutflowDay(rows)?.dayKey).toBe("2026-03-01");
  });

  it("is null for a period with no spending", () => {
    expect(peakOutflowDay([inflow("2026-03-01", 9000)])).toBeNull();
  });

  it("respects the transfer preference", () => {
    const rows = [out("2026-03-01", 1000), out("2026-03-03", 90000, { isInternalToUser: true })];
    expect(peakOutflowDay(rows)?.dayKey).toBe("2026-03-03");
    expect(peakOutflowDay(rows, { includeInternalTransfers: false })?.dayKey).toBe("2026-03-01");
  });
});
