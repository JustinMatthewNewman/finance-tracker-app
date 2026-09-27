import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  reconcileStatement,
  SETTLE_WINDOW_DAYS,
  type ExistingImportedRow,
} from "./importReconcile";
import { importKeyFor, parseWellsFargoCsv, type ParsedStatementRow } from "./wellsFargoCsv";

// The re-upload case, driven by the overlapping pair in transaction_data.example/
// — a statement downloaded on 15 September with three rows still pending, and
// the same account downloaded three weeks later covering a wider range. See that
// directory's README for what each row in them is there to exercise.
const exampleDir = path.resolve(__dirname, "..", "transaction_data.example");
const read = (name: string) => readFileSync(path.join(exampleDir, name), "utf8");

const USER = "user-1";
const ACCOUNT = "Checking";

const keysFor = (rows: readonly ParsedStatementRow[]) =>
  rows.map((r) => importKeyFor(USER, ACCOUNT, r.fingerprint));

/** What the database holds after importing a file, as the reconciler sees it. */
function asStored(rows: readonly ParsedStatementRow[]): ExistingImportedRow[] {
  return rows.map((row, i) => ({
    id: `row-${i}`,
    importKey: importKeyFor(USER, ACCOUNT, row.fingerprint),
    importRef: row.statementRef,
    occurredOn: row.occurredOn,
    amountMinor: row.amountMinor,
    direction: row.direction,
    merchant: row.merchant,
  }));
}

const september = parseWellsFargoCsv(read("Checking-2026-09-15.csv")).rows;
const october = parseWellsFargoCsv(read("Checking-2026-10-05.csv")).rows;

const find = (rows: readonly ParsedStatementRow[], needle: string, day?: string) => {
  const hit = rows.filter((r) => r.merchant.includes(needle) && (!day || r.occurredOn === day));
  if (hit.length !== 1) throw new Error(`fixture: ${hit.length} rows match ${needle} ${day ?? ""}`);
  return hit[0];
};

describe("an empty ledger", () => {
  it("takes the whole file", () => {
    const result = reconcileStatement(september, keysFor(september), []);
    expect(result.fresh).toHaveLength(september.length);
    expect(result.certain).toHaveLength(0);
    expect(result.probable).toHaveLength(0);
    expect(result.freshKeys).toEqual(keysFor(september));
  });

  it("keeps fresh rows in the file's own order", () => {
    const result = reconcileStatement(september, keysFor(september), []);
    expect(result.fresh.map((r) => r.occurredOn)).toEqual(september.map((r) => r.occurredOn));
  });
});

describe("re-uploading the identical file", () => {
  const stored = asStored(september);
  const result = reconcileStatement(september, keysFor(september), stored);

  it("adds nothing", () => {
    expect(result.fresh).toHaveLength(0);
    expect(result.probable).toHaveLength(0);
  });

  it("recognizes every row by its own statement line", () => {
    expect(result.certain).toHaveLength(september.length);
    expect(result.certain.every((m) => m.basis === "same-line")).toBe(true);
  });

  it("claims each stored row exactly once", () => {
    const claimed = result.certain.map((m) => m.existing.id);
    expect(new Set(claimed).size).toBe(claimed.length);
  });
});

// ── The case the whole module exists for ────────────────────────────────────
describe("the overlapping October export", () => {
  const stored = asStored(september);
  const result = reconcileStatement(october, keysFor(october), stored);
  const basisOf = (needle: string, day?: string) => {
    const row = find(october, needle, day);
    return (
      result.certain.find((m) => m.row === row)?.basis ??
      result.probable.find((m) => m.row === row)?.basis ??
      (result.fresh.includes(row) ? "fresh" : "missing")
    );
  };

  it("accounts for every row in the file exactly once", () => {
    expect(result.certain.length + result.probable.length + result.fresh.length).toBe(october.length);
  });

  it("skips the rows that repeat unchanged, by statement line", () => {
    expect(basisOf("SELF STORAGE")).toBe("same-line");
    expect(basisOf("CHECK")).toBe("same-line");
    expect(basisOf("AMAZON MKTPL")).toBe("same-line");
    expect(basisOf("MERIDIAN CAPITAL", "2026-09-01")).toBe("same-line");
    expect(basisOf("MERIDIAN CAPITAL", "2026-09-15")).toBe("same-line");
  });

  it("imports only the genuinely new rows", () => {
    expect(basisOf("SUNOCO")).toBe("fresh");
    expect(basisOf("MERIDIAN CAPITAL", "2026-10-01")).toBe("fresh");
  });

  it("never claims a stored row twice, across all three tiers", () => {
    const claimed = [...result.certain, ...result.probable].map((m) => m.existing.id);
    expect(new Set(claimed).size).toBe(claimed.length);
  });
});

// ── Legitimate duplicates: the thing that must not be destroyed ─────────────
describe("two identical transactions on the same day", () => {
  const stored = asStored(september);
  const coffees = september.filter((r) => r.merchant.includes("EXAMPLE COFFEE"));

  it("are two rows in the file, not one", () => {
    expect(coffees).toHaveLength(2);
    expect(coffees[0].occurredOn).toBe(coffees[1].occurredOn);
    expect(coffees[0].amountMinor).toBe(coffees[1].amountMinor);
  });

  it("both come back as already imported on a re-upload — not one of them", () => {
    const result = reconcileStatement(october, keysFor(october), stored);
    const matched = [...result.certain, ...result.probable].filter((m) =>
      m.row.merchant.includes("EXAMPLE COFFEE") && m.row.occurredOn === "2026-08-31"
    );
    expect(matched).toHaveLength(2);
    // And they matched two DIFFERENT stored rows, rather than both pointing at
    // the same one and leaving the other stranded.
    expect(new Set(matched.map((m) => m.existing.id)).size).toBe(2);
    expect(result.fresh.filter((r) => r.occurredOn === "2026-08-31")).toHaveLength(0);
  });

  it("a third one a month later is new, and the pair does not absorb it", () => {
    const result = reconcileStatement(october, keysFor(october), stored);
    const third = find(october, "EXAMPLE COFFEE", "2026-10-02");
    expect(result.fresh).toContain(third);
  });

  it("and if only ONE had been imported, the second still arrives", () => {
    // The half-finished import: one of the two coffees landed, the other did
    // not. The re-upload has to bring exactly the missing one.
    const partial = asStored(september).filter(
      (r) => !(r.occurredOn === "2026-08-31" && r.importRef === "S000000000000011")
    );
    const result = reconcileStatement(september, keysFor(september), partial);
    expect(result.fresh).toHaveLength(1);
    expect(result.fresh[0].merchant).toContain("EXAMPLE COFFEE");
    expect(result.fresh[0].statementRef).toBe("S000000000000011");
  });
});

// ── Pending, then settled: the case a fingerprint cannot catch ──────────────
describe("a pending row that has since settled", () => {
  const stored = asStored(september);
  const result = reconcileStatement(october, keysFor(october), stored);
  const probableFor = (needle: string) =>
    result.probable.find((m) => m.row.merchant.includes(needle));

  it("does not match by statement line, because the memo was rewritten", () => {
    const pending = find(september, "LE BERNARDIN");
    const settled = find(october, "LE BERNARDIN");
    expect(settled.fingerprint).not.toBe(pending.fingerprint);
    expect(settled.raw.description).not.toBe(pending.raw.description);
  });

  it("is caught as probable even when the amount changed with a tip", () => {
    const pending = find(september, "LE BERNARDIN");
    const settled = find(october, "LE BERNARDIN");
    expect(pending.amountMinor).toBe(128450);
    expect(settled.amountMinor).toBe(141295);
    // Neither the line nor the amount matches, so only merchant-and-date can
    // find this one — which is exactly why it is reported rather than skipped.
    // The amount moved, so the (direction, amount) bucket cannot see it at all —
    // only the merchant can, which is what tier 3b is for.
    const match = probableFor("LE BERNARDIN");
    expect(match?.basis).toBe("same-merchant");
    expect(match?.dayGap).toBe(1);
    expect(match?.existing.amountMinor).toBe(128450);
  });

  it("is caught when the amount is unchanged and only the memo and date moved", () => {
    const match = probableFor("ASPEN RIDGE HOA");
    expect(match?.basis).toBe("same-merchant-and-amount");
    expect(match?.dayGap).toBe(1);
  });

  it("is caught on an internal transfer that gained a reference when it settled", () => {
    const match = result.probable.find(
      (m) => m.row.merchant.includes("PLATINUM SAVINGS") && m.row.occurredOn === "2026-09-17"
    );
    expect(match).toBeDefined();
    // The settled row has a reference and the pending one has none, so "both
    // present and different" cannot rule it out — the pairing is still allowed.
    expect(match!.row.statementRef).toBe("IB00000009");
    expect(match!.existing.importRef).toBeNull();
    expect(match!.dayGap).toBe(2);
  });

  it("IS NOT SKIPPED — it is reported for a person to confirm", () => {
    // The central safety property. Everything in `probable` is still imported
    // unless somebody says otherwise, because this tier cannot tell a settled
    // pending charge from a second identical purchase.
    expect(result.probable.length).toBeGreaterThan(0);
    expect(result.certain.every((m) => m.basis !== "same-amount")).toBe(true);
    expect(result.certain.every((m) => m.basis !== "same-merchant-and-amount")).toBe(true);
  });

  it("matches with certainty when the reference survives the reformat", () => {
    // The best case, and why the reference is stored: same transaction, new memo,
    // new date, new amount — and no human judgement needed.
    const pending = find(september, "LE BERNARDIN");
    const withRef = asStored(september).map((r) =>
      r.occurredOn === pending.occurredOn && r.amountMinor === pending.amountMinor
        ? { ...r, importRef: "S000000000000014" }
        : r
    );
    const again = reconcileStatement(october, keysFor(october), withRef);
    const match = again.certain.find((m) => m.row.merchant.includes("LE BERNARDIN"));
    expect(match?.basis).toBe("same-reference");
    expect(again.probable.some((m) => m.row.merchant.includes("LE BERNARDIN"))).toBe(false);
  });
});

// ── False positives: what must NOT be flagged ──────────────────────────────
describe("transactions that merely look alike", () => {
  const stored = asStored(september);
  const result = reconcileStatement(october, keysFor(october), stored);

  it("imports a second shop for the same amount at the same shop, with no warning", () => {
    // 968.31 at Wegmans on 08/28 and again on 09/18. Same amount, same merchant.
    // Both settled, and their references differ — proof of two separate shops.
    const second = find(october, "WEGMANS", "2026-09-18");
    expect(second.amountMinor).toBe(96831);
    expect(stored.some((r) => r.amountMinor === 96831 && r.merchant?.includes("WEGMANS"))).toBe(true);
    expect(result.fresh).toContain(second);
    expect(result.probable.some((m) => m.row === second)).toBe(false);
  });

  it("imports next month's subscription charge", () => {
    // 84.99 to the same merchant, a month apart. Outside the window even before
    // the references are compared.
    const next = find(october, "EXAMPLE STREAMING", "2026-10-01");
    expect(result.fresh).toContain(next);
  });

  it("would still not flag them if the window were absurdly wide", () => {
    // Belt and braces: with the date window removed entirely, the differing
    // references alone are enough to keep both of these out of `probable`.
    const wide = reconcileStatement(october, keysFor(october), stored, { windowDays: 400 });
    const second = find(october, "WEGMANS", "2026-09-18");
    const next = find(october, "EXAMPLE STREAMING", "2026-10-01");
    expect(wide.probable.some((m) => m.row === second)).toBe(false);
    expect(wide.probable.some((m) => m.row === next)).toBe(false);
  });

  it("does not pair rows in opposite directions", () => {
    // A 1275.00 refund against a 1275.00 purchase is not the purchase reported
    // twice, and netting them out is how a "total spent" figure goes quietly
    // wrong. The bucket includes direction for this reason.
    const rows = parseWellsFargoCsv(
      '"09/18/2026","EXAMPLE OUTFITTERS","1275.00","","Pending"\n'
    ).rows;
    const existing: ExistingImportedRow[] = [
      {
        id: "a",
        importKey: "other",
        importRef: null,
        occurredOn: "2026-09-18",
        amountMinor: 127500,
        direction: "EXPENSE",
        merchant: "EXAMPLE OUTFITTERS",
      },
    ];
    const out = reconcileStatement(rows, keysFor(rows), existing);
    expect(out.fresh).toHaveLength(1);
    expect(out.probable).toHaveLength(0);
  });

  it("does not pair rows for different amounts when no merchant agrees", () => {
    // A cent apart and on the same day, but nothing links them by name — and
    // without a name, a different amount is a different transaction.
    const rows = parseWellsFargoCsv('"09/18/2026","SOMEWHERE NEW","-50.00","","Posted"\n').rows;
    const existing: ExistingImportedRow[] = [
      {
        id: "a",
        importKey: "other",
        importRef: null,
        occurredOn: "2026-09-18",
        amountMinor: 5001,
        direction: "EXPENSE",
        merchant: "ENTIRELY UNRELATED PLACE",
      },
    ];
    const out = reconcileStatement(rows, keysFor(rows), existing);
    expect(out.fresh).toHaveLength(1);
    expect(out.probable).toHaveLength(0);
  });

  it("pairs a different amount ONLY when the merchant agrees", () => {
    // The tip case, in isolation: same merchant, same day, 50.00 became 50.01.
    const rows = parseWellsFargoCsv('"09/18/2026","SOMEWHERE NEW","-50.00","","Posted"\n').rows;
    const existing: ExistingImportedRow[] = [
      {
        id: "a",
        importKey: "other",
        importRef: null,
        occurredOn: "2026-09-18",
        amountMinor: 5001,
        direction: "EXPENSE",
        merchant: "SOMEWHERE NEW",
      },
    ];
    const out = reconcileStatement(rows, keysFor(rows), existing);
    expect(out.probable).toHaveLength(1);
    expect(out.probable[0].basis).toBe("same-merchant");
    // Still only reported, never skipped.
    expect(out.certain).toHaveLength(0);
  });
});

describe("the settle window", () => {
  const storedAt = (day: string): ExistingImportedRow[] => [
    {
      id: "a",
      importKey: "other",
      importRef: null,
      occurredOn: day,
      amountMinor: 128450,
      direction: "EXPENSE",
      merchant: "LE BERNARDIN",
    },
  ];
  const incoming = parseWellsFargoCsv(
    '"09/20/2026","PURCHASE LE BERNARDIN +15550001234  NY CARD0000","-1284.50","","Posted"\n'
  ).rows;

  it("pairs a row inside it", () => {
    const at = reconcileStatement(incoming, keysFor(incoming), storedAt("2026-09-15"));
    expect(at.probable).toHaveLength(1);
    expect(at.probable[0].dayGap).toBe(SETTLE_WINDOW_DAYS);
  });

  it("leaves a row one day outside it alone", () => {
    const past = reconcileStatement(incoming, keysFor(incoming), storedAt("2026-09-14"));
    expect(past.probable).toHaveLength(0);
    expect(past.fresh).toHaveLength(1);
  });

  it("works in both directions, since a settled row can predate the pending one", () => {
    const later = reconcileStatement(incoming, keysFor(incoming), storedAt("2026-09-24"));
    expect(later.probable).toHaveLength(1);
    expect(later.probable[0].dayGap).toBe(-4);
  });
});

describe("choosing between several candidates", () => {
  it("prefers the one whose merchant agrees over the one that is merely nearer", () => {
    const rows = parseWellsFargoCsv(
      '"09/16/2026","PURCHASE LE BERNARDIN +15550001234  NY CARD0000","-1284.50","","Posted"\n'
    ).rows;
    const existing: ExistingImportedRow[] = [
      {
        id: "near-but-unrelated",
        importKey: "k1",
        importRef: null,
        occurredOn: "2026-09-16",
        amountMinor: 128450,
        direction: "EXPENSE",
        merchant: "SOMETHING ELSE ENTIRELY",
      },
      {
        id: "further-but-right",
        importKey: "k2",
        importRef: null,
        occurredOn: "2026-09-14",
        amountMinor: 128450,
        direction: "EXPENSE",
        merchant: "LE BERNARDIN RESTAURANT",
      },
    ];
    const out = reconcileStatement(rows, keysFor(rows), existing);
    expect(out.probable).toHaveLength(1);
    expect(out.probable[0].existing.id).toBe("further-but-right");
    expect(out.probable[0].basis).toBe("same-merchant-and-amount");
  });

  it("lets a certain match win a row that a probable one could also have taken", () => {
    // Tier ordering, which is the reason tiers run over the whole file one at a
    // time. If the probable match claimed the stored row first, the row that
    // matches it EXACTLY would be left with nothing and import as a duplicate.
    const exact = september.find((r) => r.merchant.includes("SELF STORAGE"))!;
    const lookalike = parseWellsFargoCsv(
      '"09/13/2026","PURCHASE SELF STORAGE EXAMPLE   555-0003333   CT CARD0000","-465.00","","Pending"\n'
    ).rows[0];
    const rows = [lookalike, exact];
    const out = reconcileStatement(rows, keysFor(rows), asStored([exact]));
    expect(out.certain).toHaveLength(1);
    expect(out.certain[0].row).toBe(exact);
    expect(out.certain[0].basis).toBe("same-line");
    // The lookalike then has nothing left to pair with, so it is reported as new
    // rather than silently swallowed — the conservative direction.
    expect(out.fresh).toContain(lookalike);
  });
});

describe("merchant agreement", () => {
  const storedMerchant = (merchant: string): ExistingImportedRow[] => [
    {
      id: "a",
      importKey: "other",
      importRef: null,
      occurredOn: "2026-09-15",
      amountMinor: 1000,
      direction: "EXPENSE",
      merchant,
    },
  ];
  const incoming = (merchant: string) =>
    parseWellsFargoCsv(`"09/16/2026","${merchant}","-10.00","","Posted"\n`).rows;

  const basis = (a: string, b: string) => {
    const rows = incoming(a);
    return reconcileStatement(rows, keysFor(rows), storedMerchant(b)).probable[0]?.basis;
  };

  it("treats a settled name as agreeing with its truncated pending form", () => {
    expect(basis("SANTINIS NEW YORK GRILL", "SANTINIS NEW")).toBe("same-merchant-and-amount");
  });

  it("ignores punctuation and case", () => {
    expect(basis("Example Coffee Co.", "EXAMPLE COFFEE CO")).toBe("same-merchant-and-amount");
  });

  it("does not let a short shared word make two merchants agree", () => {
    // Both begin "THE", which must not be enough — otherwise every amount match
    // in the window is upgraded on the strength of an article.
    expect(basis("THE BUTCHER", "THE BAKER")).toBe("same-amount");
  });

  it("still pairs on amount and date alone, at the lower confidence", () => {
    expect(basis("SOMEWHERE", "ELSEWHERE")).toBe("same-amount");
  });
});
