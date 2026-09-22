import { describe, expect, it } from "vitest";
import {
  formatMoney,
  minorToInput,
  minorUnitsPerMajor,
  normalizeDirection,
  parseAmountToMinor,
  shareOf,
  sumTotals,
} from "./money";

describe("parseAmountToMinor", () => {
  it("parses plain decimals exactly", () => {
    expect(parseAmountToMinor("12.34")).toBe(1234);
    expect(parseAmountToMinor("0.01")).toBe(1);
    expect(parseAmountToMinor("100")).toBe(10000);
    expect(parseAmountToMinor("0.10")).toBe(10);
  });

  // The whole reason this module is string-based. `Math.round(0.29 * 100)` and
  // friends happen to survive, but the naive path drifts on values like these
  // — 1.005 * 100 is 100.49999999999999, and 8.115 * 100 is 811.4999999999999.
  it("does not drift on values that break float arithmetic", () => {
    expect(parseAmountToMinor("1.00")).toBe(100);
    expect(parseAmountToMinor("8.11")).toBe(811);
    expect(parseAmountToMinor("0.29")).toBe(29);
    expect(parseAmountToMinor("4.35")).toBe(435);
    expect(parseAmountToMinor("1234567.89")).toBe(123456789);
  });

  it("accepts pasted statement formatting", () => {
    expect(parseAmountToMinor("$1,234.56")).toBe(123456);
    expect(parseAmountToMinor("  42.50  ")).toBe(4250);
    expect(parseAmountToMinor("1_000.00")).toBe(100000);
  });

  it("pads a short fraction rather than misreading it", () => {
    // "12.5" is twelve fifty, not twelve-oh-five.
    expect(parseAmountToMinor("12.5")).toBe(1250);
  });

  // Returning null rather than coercing is the point: a silently-zeroed
  // transaction is far worse than one that refuses to save.
  it("rejects anything that is not a non-negative amount", () => {
    expect(parseAmountToMinor("")).toBeNull();
    expect(parseAmountToMinor("   ")).toBeNull();
    expect(parseAmountToMinor(".")).toBeNull();
    expect(parseAmountToMinor("abc")).toBeNull();
    expect(parseAmountToMinor("12.34.56")).toBeNull();
    expect(parseAmountToMinor("-5.00")).toBeNull(); // direction carries the sign
  });

  it("rejects more decimals than the currency has", () => {
    // A mis-key, not an amount to quietly round to 2.00.
    expect(parseAmountToMinor("1.999")).toBeNull();
    expect(parseAmountToMinor("1.9", "JPY")).toBeNull();
  });

  it("honors currencies with no minor unit", () => {
    expect(minorUnitsPerMajor("JPY")).toBe(1);
    expect(parseAmountToMinor("500", "JPY")).toBe(500);
    expect(minorToInput(500, "JPY")).toBe("500");
  });
});

describe("minorToInput", () => {
  it("round-trips with parseAmountToMinor", () => {
    for (const value of ["0.00", "0.07", "12.34", "1000.00", "99999.99"]) {
      expect(minorToInput(parseAmountToMinor(value)!)).toBe(value);
    }
  });

  it("zero-pads the fraction", () => {
    expect(minorToInput(5)).toBe("0.05");
    expect(minorToInput(50)).toBe("0.50");
    expect(minorToInput(100)).toBe("1.00");
  });
});

describe("formatMoney", () => {
  it("renders minor units as a currency string", () => {
    // Asserted on the digits rather than the exact symbol placement, which is
    // locale-dependent and not what this function is responsible for.
    expect(formatMoney(123456, "USD")).toContain("1,234.56");
    expect(formatMoney(0, "USD")).toContain("0.00");
  });
});

describe("normalizeDirection", () => {
  it("passes through the two legal values", () => {
    expect(normalizeDirection("INCOME")).toBe("INCOME");
    expect(normalizeDirection("EXPENSE")).toBe("EXPENSE");
  });

  // The column has no database constraint, so junk can reach the client.
  // Defaulting to EXPENSE is the conservative failure: the opposite default
  // would inflate someone's apparent income.
  it("defaults unknown values to EXPENSE", () => {
    expect(normalizeDirection("")).toBe("EXPENSE");
    expect(normalizeDirection(null)).toBe("EXPENSE");
    expect(normalizeDirection("income")).toBe("EXPENSE");
    expect(normalizeDirection("TRANSFER")).toBe("EXPENSE");
  });
});

describe("sumTotals", () => {
  it("keeps income and expense separate rather than netting as it goes", () => {
    const totals = sumTotals([
      { amountMinor: 500000, direction: "INCOME" },
      { amountMinor: 120050, direction: "EXPENSE" },
      { amountMinor: 8025, direction: "EXPENSE" },
    ]);
    expect(totals.incomeMinor).toBe(500000);
    expect(totals.expenseMinor).toBe(128075);
    expect(totals.netMinor).toBe(371925);
  });

  // A refund raises income; it must NOT quietly reduce the expense figure
  // people budget against.
  it("treats a refund as income, not as reduced spending", () => {
    const totals = sumTotals([
      { amountMinor: 10000, direction: "EXPENSE" },
      { amountMinor: 2500, direction: "INCOME" },
    ]);
    expect(totals.expenseMinor).toBe(10000);
    expect(totals.incomeMinor).toBe(2500);
    expect(totals.netMinor).toBe(-7500);
  });

  it("returns zeroes for an empty set", () => {
    expect(sumTotals([])).toEqual({ incomeMinor: 0, expenseMinor: 0, netMinor: 0 });
  });

  it("stays exact across many rows", () => {
    // 1000 rows of 0.01 is exactly 10.00. The float path drifts here.
    const rows = Array.from({ length: 1000 }, () => ({ amountMinor: 1, direction: "EXPENSE" }));
    expect(sumTotals(rows).expenseMinor).toBe(1000);
  });
});

describe("shareOf", () => {
  it("computes a fraction", () => {
    expect(shareOf(2500, 10000)).toBe(0.25);
  });

  // 0/0 is NaN in JS, which renders as "NaN%" rather than throwing — so an
  // empty month would show a column of NaNs without this guard.
  it("returns 0 for a zero total instead of NaN", () => {
    expect(shareOf(0, 0)).toBe(0);
  });
});
