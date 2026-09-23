import { describe, expect, it } from "vitest";
import {
  countOccurrences,
  defaultRecurrenceEnd,
  occurrencesInRange,
  toRecurrence,
} from "./recurrence";

const rule = (
  occurredOn: string,
  recurrence: string | null,
  recurrenceEndsOn: string | null = null
) => ({ occurredOn, recurrence, recurrenceEndsOn });

describe("occurrencesInRange — one-offs", () => {
  it("returns the row's own day when it falls inside the range", () => {
    expect(occurrencesInRange(rule("2026-09-15", null), "2026-09-01", "2026-09-30")).toEqual([
      "2026-09-15",
    ]);
  });

  it("returns nothing when it falls outside", () => {
    expect(occurrencesInRange(rule("2026-08-15", null), "2026-09-01", "2026-09-30")).toEqual([]);
  });

  // Both bounds are inclusive; an item on the 1st or the 31st is in the month.
  it("includes both endpoints", () => {
    expect(occurrencesInRange(rule("2026-09-01", null), "2026-09-01", "2026-09-30")).toEqual([
      "2026-09-01",
    ]);
    expect(occurrencesInRange(rule("2026-09-30", null), "2026-09-01", "2026-09-30")).toEqual([
      "2026-09-30",
    ]);
  });
});

describe("occurrencesInRange — weekly and biweekly", () => {
  it("expands weekly across a month", () => {
    expect(occurrencesInRange(rule("2026-09-04", "WEEKLY"), "2026-09-01", "2026-09-30")).toEqual([
      "2026-09-04",
      "2026-09-11",
      "2026-09-18",
      "2026-09-25",
    ]);
  });

  it("expands biweekly across a month", () => {
    expect(occurrencesInRange(rule("2026-09-04", "BIWEEKLY"), "2026-09-01", "2026-09-30")).toEqual([
      "2026-09-04",
      "2026-09-18",
    ]);
  });

  // The rule starts in September; the calendar is showing December. The row
  // itself is nowhere near the range, and the expansion still has to land on
  // the right days — this is the case that makes a naive "filter by
  // occurredOn" implementation return nothing at all.
  it("expands into a range months after the rule starts", () => {
    expect(occurrencesInRange(rule("2026-09-04", "BIWEEKLY"), "2026-12-01", "2026-12-31")).toEqual([
      "2026-12-11",
      "2026-12-25",
    ]);
  });

  it("stops at recurrenceEndsOn", () => {
    expect(
      occurrencesInRange(rule("2026-09-04", "WEEKLY", "2026-09-16"), "2026-09-01", "2026-09-30")
    ).toEqual(["2026-09-04", "2026-09-11"]);
  });

  it("includes an occurrence landing exactly on recurrenceEndsOn", () => {
    expect(
      occurrencesInRange(rule("2026-09-04", "WEEKLY", "2026-09-18"), "2026-09-01", "2026-09-30")
    ).toEqual(["2026-09-04", "2026-09-11", "2026-09-18"]);
  });

  it("returns nothing once the rule has ended before the range", () => {
    expect(
      occurrencesInRange(rule("2026-01-05", "WEEKLY", "2026-03-01"), "2026-09-01", "2026-09-30")
    ).toEqual([]);
  });

  it("returns nothing when the rule has not started by the end of the range", () => {
    expect(occurrencesInRange(rule("2027-01-05", "WEEKLY"), "2026-09-01", "2026-09-30")).toEqual([]);
  });
});

describe("occurrencesInRange — monthly clamping", () => {
  // The bug this exists to prevent: setMonth on the 31st of January rolls
  // forward to the 3rd of March, and every later occurrence inherits the
  // drift. A bill due on the 31st is due on the 28th in February.
  it("clamps a 31st to the last day of a short month", () => {
    expect(occurrencesInRange(rule("2026-01-31", "MONTHLY"), "2026-02-01", "2026-02-28")).toEqual([
      "2026-02-28",
    ]);
  });

  it("returns to the 31st after a clamped month, rather than sticking at 28", () => {
    expect(occurrencesInRange(rule("2026-01-31", "MONTHLY"), "2026-03-01", "2026-03-31")).toEqual([
      "2026-03-31",
    ]);
    expect(occurrencesInRange(rule("2026-01-31", "MONTHLY"), "2026-04-01", "2026-04-30")).toEqual([
      "2026-04-30",
    ]);
  });

  it("handles the 30th through February", () => {
    expect(occurrencesInRange(rule("2026-01-30", "MONTHLY"), "2026-02-01", "2026-02-28")).toEqual([
      "2026-02-28",
    ]);
  });

  it("lands on 29 February in a leap year", () => {
    expect(occurrencesInRange(rule("2028-01-31", "MONTHLY"), "2028-02-01", "2028-02-29")).toEqual([
      "2028-02-29",
    ]);
  });

  it("expands monthly over a whole year without drifting", () => {
    const days = occurrencesInRange(rule("2026-01-15", "MONTHLY"), "2026-01-01", "2026-12-31");
    expect(days).toHaveLength(12);
    expect(days[11]).toBe("2026-12-15");
  });
});

describe("occurrencesInRange — yearly", () => {
  it("repeats on the same day each year", () => {
    expect(occurrencesInRange(rule("2026-07-04", "YEARLY"), "2028-01-01", "2028-12-31")).toEqual([
      "2028-07-04",
    ]);
  });

  // 29 February only exists every fourth year; a yearly rule anchored there
  // has to land somewhere sane in between rather than rolling into March.
  it("clamps 29 February to the 28th in a non-leap year", () => {
    expect(occurrencesInRange(rule("2028-02-29", "YEARLY"), "2029-01-01", "2029-12-31")).toEqual([
      "2029-02-28",
    ]);
  });
});

describe("countOccurrences", () => {
  it("counts a bounded series", () => {
    expect(countOccurrences(rule("2026-09-04", "BIWEEKLY", "2026-12-31"))).toBe(9);
  });

  // "Indefinitely" is a real answer, not a failure to compute one.
  it("returns null for an open-ended series", () => {
    expect(countOccurrences(rule("2026-09-04", "BIWEEKLY", null))).toBeNull();
  });

  it("counts a one-off as one", () => {
    expect(countOccurrences(rule("2026-09-04", null, null))).toBe(1);
  });
});

describe("defaultRecurrenceEnd", () => {
  it("is six months out", () => {
    expect(defaultRecurrenceEnd("2026-09-04")).toBe("2027-03-04");
  });

  it("clamps when six months later is a shorter month", () => {
    expect(defaultRecurrenceEnd("2026-08-31")).toBe("2027-02-28");
  });
});

describe("toRecurrence", () => {
  it("accepts the four known values", () => {
    expect(toRecurrence("WEEKLY")).toBe("WEEKLY");
    expect(toRecurrence("YEARLY")).toBe("YEARLY");
  });

  // A value the app does not understand must not silently become a repeating
  // rule — an unreadable recurrence should show as the single row it is.
  it("treats anything else as a one-off", () => {
    expect(toRecurrence("FORTNIGHTLY")).toBeNull();
    expect(toRecurrence("")).toBeNull();
    expect(toRecurrence(null)).toBeNull();
  });
});
