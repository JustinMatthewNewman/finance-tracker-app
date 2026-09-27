import { describe, expect, it } from "vitest";
import { ledgerTotals, sumDays, totalsByDay, type Countable } from "./ledgerTotals";
import { buildMonthGrid } from "./monthRange";

// Terse builders, so each test reads as the scenario it is about rather than as
// a wall of object literals.
const income = (amountMinor: number, extra: Partial<Countable> = {}): Countable => ({
  amountMinor,
  direction: "INCOME",
  status: "POSTED",
  source: "IMPORT",
  ...extra,
});
const expense = (amountMinor: number, extra: Partial<Countable> = {}): Countable => ({
  amountMinor,
  direction: "EXPENSE",
  status: "POSTED",
  source: "IMPORT",
  ...extra,
});
const projected = (row: Countable): Countable => ({
  ...row,
  status: "FORECASTED",
  source: "FORECAST",
});
const typed = (row: Countable): Countable => ({ ...row, source: "MANUAL" });
const transfer = (row: Countable): Countable => ({ ...row, isInternalToUser: true });
/** The other kind — money moved between two people inside the household. */
const familyTransfer = (row: Countable): Countable => ({ ...row, isInternalToFamily: true });
const on = (day: string, row: Countable) => ({ ...row, occurredOn: day });

describe("in and out", () => {
  it("are the imported income and expense totals, kept apart", () => {
    const t = ledgerTotals([income(2841667), income(340000), expense(74219), expense(148500)]);
    expect(t.in.actualMinor).toBe(3181667);
    expect(t.out.actualMinor).toBe(222719);
    expect(t.netMinor).toBe(3181667 - 222719);
  });

  it("never net a refund out of the spending figure", () => {
    // A refund is money IN against a spending merchant. Netting as it goes would
    // report 90.00 spent instead of 100.00, which is true of the net and false of
    // the figure people budget against.
    const t = ledgerTotals([expense(10000), income(1000)]);
    expect(t.out.actualMinor).toBe(10000);
    expect(t.in.actualMinor).toBe(1000);
    expect(t.netMinor).toBe(-9000);
  });

  it("count a hand-typed actual alongside an imported one", () => {
    // Both are money that moved. in/out is not imported-only, or every
    // hand-entered transaction would silently vanish from the headline.
    const t = ledgerTotals([income(1000), typed(income(500))]);
    expect(t.in.actualMinor).toBe(1500);
    expect(t.in.importedMinor).toBe(1000);
    expect(t.in.manualMinor).toBe(500);
  });

  it("keep the imported and manual subtotals summing back to the actual", () => {
    const rows = [income(1000), typed(income(500)), expense(300), typed(expense(70))];
    const t = ledgerTotals(rows);
    expect(t.in.importedMinor + t.in.manualMinor).toBe(t.in.actualMinor);
    expect(t.out.importedMinor + t.out.manualMinor).toBe(t.out.actualMinor);
  });
});

// ── The separation the whole module is built around ─────────────────────────
describe("projected money", () => {
  const rows = [income(1000), projected(income(9999)), expense(400), projected(expense(5555))];
  const t = ledgerTotals(rows);

  it("is completely out of the actual figures", () => {
    expect(t.in.actualMinor).toBe(1000);
    expect(t.out.actualMinor).toBe(400);
    expect(t.netMinor).toBe(600);
  });

  it("is reported on its own", () => {
    expect(t.in.projectedMinor).toBe(9999);
    expect(t.out.projectedMinor).toBe(5555);
    expect(t.hasProjections).toBe(true);
  });

  it("only appears combined where the combination is asked for", () => {
    expect(t.in.expectedMinor).toBe(10999);
    expect(t.out.expectedMinor).toBe(5955);
    expect(t.expectedNetMinor).toBe(10999 - 5955);
  });

  it("is not counted in the imported or manual subtotals either", () => {
    // Those break down what HAPPENED. A projection has no provenance to report
    // yet, so folding it into one of them would overstate real money. Totalled
    // on its own here, because `rows` above deliberately also holds actuals.
    const only = ledgerTotals([projected(income(9999)), projected(expense(5555))]);
    expect(only.in.importedMinor).toBe(0);
    expect(only.in.manualMinor).toBe(0);
    expect(only.out.importedMinor).toBe(0);
    expect(only.out.manualMinor).toBe(0);
    // And the subtotals still sum back to an actual figure of nothing.
    expect(only.in.actualMinor).toBe(0);
    expect(only.out.actualMinor).toBe(0);
  });

  it("says so when there is none, so a UI can drop a redundant figure", () => {
    expect(ledgerTotals([income(1000)]).hasProjections).toBe(false);
  });
});

describe("a projection that has been received", () => {
  // The case that makes `status` the only authority. Marking a forecast as
  // arrived flips status to POSTED and deliberately LEAVES source as FORECAST,
  // so provenance survives. Splitting on source would then exclude money the
  // household has actually been paid.
  const receivedPaycheque: Countable = {
    amountMinor: 250000,
    direction: "INCOME",
    status: "POSTED",
    source: "FORECAST",
  };

  it("counts as actual money, not as a projection", () => {
    const t = ledgerTotals([receivedPaycheque]);
    expect(t.in.actualMinor).toBe(250000);
    expect(t.in.projectedMinor).toBe(0);
    expect(t.hasProjections).toBe(false);
    expect(t.netMinor).toBe(250000);
  });

  it("is reported as manual rather than imported, since no statement produced it", () => {
    const t = ledgerTotals([receivedPaycheque]);
    expect(t.in.manualMinor).toBe(250000);
    expect(t.in.importedMinor).toBe(0);
  });
});

// ── Internal transfers ─────────────────────────────────────────────────────
describe("internal transfers", () => {
  // The pair of rows a sweep into savings produces. Included, they add the same
  // amount to BOTH sides, so a household that shuffles money looks like it earns
  // and spends far more than it does.
  const rows = [
    income(2841667),
    expense(74219),
    transfer(income(2500000)),
    transfer(expense(2500000)),
  ];

  it("count on both sides when included, which is the default", () => {
    const t = ledgerTotals(rows);
    expect(t.in.actualMinor).toBe(2841667 + 2500000);
    expect(t.out.actualMinor).toBe(74219 + 2500000);
    // The net is unaffected HERE because this fixture has both legs, so they
    // cancel — which is exactly why the distortion is easy to miss until you look
    // at one side on its own. It does NOT hold for a one-legged transfer; see the
    // test two below.
    expect(t.netMinor).toBe(2841667 - 74219);
    expect(t.excludedTransferCount).toBe(0);
  });

  it("leave BOTH sides when excluded, not just the income side", () => {
    const t = ledgerTotals(rows, { includeInternalTransfers: false });
    expect(t.in.actualMinor).toBe(2841667);
    expect(t.out.actualMinor).toBe(74219);
    expect(t.netMinor).toBe(2841667 - 74219);
  });

  it("are reported as held back, so a screen can say what it is not counting", () => {
    const t = ledgerTotals(rows, { includeInternalTransfers: false });
    expect(t.excludedTransferCount).toBe(2);
    // And they are out of the counts too, so "n transactions" matches the table.
    expect(t.in.count).toBe(1);
    expect(t.out.count).toBe(1);
  });

  it("exclude BOTH kinds together, since both cancel at household level", () => {
    const mixed = [income(1000), transfer(income(500)), familyTransfer(expense(300))];
    const t = ledgerTotals(mixed, { includeInternalTransfers: false });
    expect(t.in.actualMinor).toBe(1000);
    expect(t.out.actualMinor).toBe(0);
    expect(t.excludedTransferCount).toBe(2);
  });

  it("also correct the NET when only one leg was imported", () => {
    // The case the balanced fixture above hides. Money swept into an account that
    // was never imported has no matching credit, so counting it reports the money
    // as having left the household when it did not — and excluding it moves the
    // net, by design. On real data this was $3,980.
    const oneLegged = [income(500000), transfer(expense(250000))];
    const counted = ledgerTotals(oneLegged);
    const ignored = ledgerTotals(oneLegged, { includeInternalTransfers: false });
    expect(counted.netMinor).toBe(250000);
    expect(ignored.netMinor).toBe(500000);
  });

  it("are excluded from the projected figures as well as the actual ones", () => {
    const t = ledgerTotals([projected(transfer(income(500)))], {
      includeInternalTransfers: false,
    });
    expect(t.in.projectedMinor).toBe(0);
    expect(t.hasProjections).toBe(false);
    expect(t.excludedTransferCount).toBe(1);
  });

  it("treat a null flag as not a transfer", () => {
    // The column is nullable and defaults false, but an older row predating it
    // reads as null. Treating that as a transfer would hide real money.
    const t = ledgerTotals([{ ...income(1000), isInternalToUser: null, isInternalToFamily: null }], {
      includeInternalTransfers: false,
    });
    expect(t.in.actualMinor).toBe(1000);
    expect(t.excludedTransferCount).toBe(0);
  });
});

// ── Values the database cannot constrain ───────────────────────────────────
describe("unrecognized column values", () => {
  it("count an unknown direction as spending, the conservative way", () => {
    const t = ledgerTotals([{ ...income(1000), direction: "SIDEWAYS" }]);
    expect(t.out.actualMinor).toBe(1000);
    expect(t.in.actualMinor).toBe(0);
  });

  it("count an unknown status as money that moved", () => {
    const t = ledgerTotals([{ ...income(1000), status: "MAYBE" }]);
    expect(t.in.actualMinor).toBe(1000);
    expect(t.in.projectedMinor).toBe(0);
  });

  it("count an unknown source as typed, understating imports rather than actuals", () => {
    const t = ledgerTotals([{ ...income(1000), source: "PLAID" }]);
    expect(t.in.actualMinor).toBe(1000);
    expect(t.in.manualMinor).toBe(1000);
    expect(t.in.importedMinor).toBe(0);
  });

  it("lands every row somewhere — no value drops out of the totals", () => {
    const odd: Countable[] = [
      { amountMinor: 11, direction: "", status: "", source: "" },
      { amountMinor: 22, direction: "income", status: "posted", source: "import" },
    ];
    const t = ledgerTotals(odd);
    expect(t.in.actualMinor + t.out.actualMinor + t.in.projectedMinor + t.out.projectedMinor).toBe(33);
  });
});

describe("an empty period", () => {
  it("is all zeroes rather than NaN", () => {
    const t = ledgerTotals([]);
    expect(t.in.actualMinor).toBe(0);
    expect(t.out.expectedMinor).toBe(0);
    expect(t.netMinor).toBe(0);
    expect(t.expectedNetMinor).toBe(0);
    expect(t.hasProjections).toBe(false);
    expect(Number.isNaN(t.netMinor)).toBe(false);
  });
});

// ── Per-day grouping, which is what the calendar reads ─────────────────────
describe("totalsByDay", () => {
  const rows = [
    on("2026-09-15", income(2841667)),
    on("2026-09-15", expense(74219)),
    on("2026-09-16", expense(148500)),
    on("2026-09-16", projected(expense(5000))),
  ];
  const byDay = totalsByDay(rows);

  it("buckets by the stored calendar day", () => {
    expect([...byDay.keys()].sort()).toEqual(["2026-09-15", "2026-09-16"]);
  });

  it("totals each day independently", () => {
    expect(byDay.get("2026-09-15")!.in.actualMinor).toBe(2841667);
    expect(byDay.get("2026-09-15")!.out.actualMinor).toBe(74219);
    expect(byDay.get("2026-09-16")!.out.actualMinor).toBe(148500);
    expect(byDay.get("2026-09-16")!.out.projectedMinor).toBe(5000);
  });

  it("keeps a day's net free of that day's projections", () => {
    expect(byDay.get("2026-09-16")!.netMinor).toBe(-148500);
    expect(byDay.get("2026-09-16")!.expectedNetMinor).toBe(-153500);
  });

  it("tolerates a timestamp where a date is expected", () => {
    // Date columns arrive as "yyyy-mm-dd", but a row read through another path
    // could carry a time. Slicing rather than parsing keeps the key right without
    // reintroducing a timezone shift.
    const t = totalsByDay([{ ...income(100), occurredOn: "2026-09-15T00:00:00Z" }]);
    expect(t.has("2026-09-15")).toBe(true);
  });

  it("applies the transfer option per day", () => {
    const t = totalsByDay([on("2026-09-15", transfer(income(500))), on("2026-09-15", income(100))], {
      includeInternalTransfers: false,
    });
    expect(t.get("2026-09-15")!.in.actualMinor).toBe(100);
    expect(t.get("2026-09-15")!.excludedTransferCount).toBe(1);
  });
});

// ── The month total, and the padding-day trap it exists to avoid ───────────
describe("sumDays", () => {
  // September 2026 in a Monday-first grid starts with padding from August and
  // ends with padding from October. A month total must count the month's days
  // and NOT the padding, or an adjacent month's money leaks into this one.
  const grid = buildMonthGrid({ year: 2026, month: 8 });
  const inMonth = grid.filter((d) => d.isCurrentMonth).map((d) => d.dayKey);

  const byDay = totalsByDay([
    on("2026-08-31", income(500000)), // padding day, before the month
    on("2026-09-01", income(2841667)),
    on("2026-09-30", expense(74219)),
    on("2026-10-01", expense(999999)), // padding day, after the month
  ]);

  it("counts only the days it is given", () => {
    const t = sumDays(byDay, inMonth);
    expect(t.in.actualMinor).toBe(2841667);
    expect(t.out.actualMinor).toBe(74219);
  });

  it("would include the padding if asked — the caller decides, not this", () => {
    const all = sumDays(byDay, grid.map((d) => d.dayKey));
    expect(all.in.actualMinor).toBe(2841667 + 500000);
    expect(all.out.actualMinor).toBe(74219 + 999999);
  });

  it("ignores days with nothing on them", () => {
    expect(sumDays(byDay, ["2026-09-14", "2026-09-15"]).in.count).toBe(0);
  });

  it("does not double-count a day listed twice", () => {
    const once = sumDays(byDay, ["2026-09-01"]);
    const twice = sumDays(byDay, ["2026-09-01", "2026-09-01"]);
    expect(twice.in.actualMinor).toBe(once.in.actualMinor);
    expect(twice.in.count).toBe(once.in.count);
  });

  it("agrees with totalling the rows directly", () => {
    // The property that matters: however the calendar slices a month by day, the
    // sum has to equal what ledgerTotals says about the same rows.
    const rows = [
      on("2026-09-01", income(2841667)),
      on("2026-09-02", typed(income(1234))),
      on("2026-09-15", expense(74219)),
      on("2026-09-15", projected(expense(8800))),
      on("2026-09-28", transfer(income(2500000))),
    ];
    const direct = ledgerTotals(rows);
    const viaDays = sumDays(totalsByDay(rows), inMonth);
    expect(viaDays).toEqual(direct);
  });

  it("agrees with totalling directly when transfers are excluded too", () => {
    const rows = [
      on("2026-09-01", income(2841667)),
      on("2026-09-28", transfer(income(2500000))),
      on("2026-09-28", transfer(expense(2500000))),
    ];
    const opts = { includeInternalTransfers: false };
    expect(sumDays(totalsByDay(rows, opts), inMonth)).toEqual(ledgerTotals(rows, opts));
  });

  it("carries hasProjections up from any day that has one", () => {
    const rows = [on("2026-09-01", income(100)), on("2026-09-20", projected(expense(50)))];
    expect(sumDays(totalsByDay(rows), inMonth).hasProjections).toBe(true);
  });

  it("is all zeroes for a month with nothing in it", () => {
    expect(sumDays(new Map(), inMonth).netMinor).toBe(0);
  });
});
