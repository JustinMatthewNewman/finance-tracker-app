import { describe, expect, it } from "vitest";
import {
  classifyInternalTransfer,
  EMPTY_TOKENS,
  pairTransfers,
  resolveInternalTransfers,
  type PairableRow,
  isInternal,
  looksLikeOwnAccountTransfer,
  nameTokens,
  namesHouseholdMember,
  reclassify,
  type ReclassifiableRow,
} from "./internalTransfers";

const household = nameTokens(["Justin Newman", "Sarah Newman", "Mia"]);
const row = (merchant: string, method: string | null = null, memo?: string) => ({
  merchant,
  method,
  memo,
});

describe("own-account transfers", () => {
  it("are recognized from the stored merchant alone", () => {
    // The whole reason a backfill is possible: extractMerchant keeps the prefix,
    // so a row imported before these columns existed is still classifiable.
    expect(
      looksLikeOwnAccountTransfer(row("ONLINE TRANSFER FROM STERLING A PLATINUM SAVINGS"))
    ).toBe(true);
    expect(
      looksLikeOwnAccountTransfer(row("ONLINE TRANSFER TO NEWMAN J WAY2SAVE SAVINGS XXXXXX5000"))
    ).toBe(true);
  });

  it("are recognized from a raw memo at import time too", () => {
    expect(looksLikeOwnAccountTransfer(row("SAVINGS", null, "ONLINE TRANSFER TO SAVINGS"))).toBe(true);
  });

  it("do not match money that genuinely enters or leaves", () => {
    expect(looksLikeOwnAccountTransfer(row("ZELLE TO VANCE HOUSEKEEPING"))).toBe(false);
    expect(looksLikeOwnAccountTransfer(row("MERIDIAN CAPITAL PAYROLL"))).toBe(false);
    expect(looksLikeOwnAccountTransfer(row("WEGMANS # 000", "Card"))).toBe(false);
  });

  it("win over the family check, even when they name a member", () => {
    // "ONLINE TRANSFER FROM NEWMAN J WAY2SAVE SAVINGS" is both an own-account
    // sweep and a memo naming a household member. Calling it a payment between
    // two people would be wrong in a way that survives into any per-member
    // report built on these columns.
    const flags = classifyInternalTransfer(
      row("ONLINE TRANSFER FROM NEWMAN J WAY2SAVE SAVINGS", "Transfer"),
      household
    );
    expect(flags).toEqual({ isInternalToUser: true, isInternalToFamily: false });
  });
});

describe("transfers between household members", () => {
  it("are recognized when a transfer names a member", () => {
    expect(classifyInternalTransfer(row("ZELLE TO SARAH NEWMAN", "Zelle"), household)).toEqual({
      isInternalToUser: false,
      isInternalToFamily: true,
    });
    expect(classifyInternalTransfer(row("ZELLE FROM MIA", "Zelle"), household)).toEqual({
      isInternalToUser: false,
      isInternalToFamily: true,
    });
  });

  it("match a first name alone, which is how memos usually render a payee", () => {
    expect(namesHouseholdMember(row("ZELLE TO SARAH"), household)).toBe(true);
  });

  it("are NOT recognized from a card purchase that happens to name somebody", () => {
    // The necessary condition: a shop named after a person is not a payment to
    // that person. Without it, "PURCHASE SARAHS BAKERY" would remove a real
    // expense from the household's spending.
    expect(classifyInternalTransfer(row("SARAHS BAKERY", "Card"), household)).toEqual({
      isInternalToUser: false,
      isInternalToFamily: false,
    });
  });

  it("are not recognized for a transfer to somebody outside the household", () => {
    expect(classifyInternalTransfer(row("ZELLE TO VANCE HOUSEKEEPING", "Zelle"), household)).toEqual({
      isInternalToUser: false,
      isInternalToFamily: false,
    });
  });

  it("fall back to the method when the memo has no transfer word", () => {
    expect(classifyInternalTransfer(row("SARAH NEWMAN", "Zelle"), household)).toEqual({
      isInternalToUser: false,
      isInternalToFamily: true,
    });
  });

  it("flag nothing at all when the household is empty", () => {
    expect(classifyInternalTransfer(row("ZELLE TO SARAH", "Zelle"), nameTokens([]))).toEqual({
      isInternalToUser: false,
      isInternalToFamily: false,
    });
  });
});

describe("name tokens", () => {
  it("drop fragments too short to identify anybody", () => {
    // A two-letter fragment matches almost any memo, and a false positive here
    // removes real money from the household's totals.
    expect(nameTokens(["Jo"]).size).toBe(0);
    expect([...nameTokens(["Al Smith"])]).toEqual(["SMITH"]);
  });

  it("drop words that appear in every memo", () => {
    const tokens = nameTokens(["The Savings Account", "Transfer"]);
    expect(tokens.has("SAVINGS")).toBe(false);
    expect(tokens.has("TRANSFER")).toBe(false);
    expect(tokens.has("THE")).toBe(false);
    expect(tokens.has("ACCOUNT")).toBe(true);
  });

  it("split a full name into matchable words", () => {
    expect([...nameTokens(["Justin Newman"])].sort()).toEqual(["JUSTIN", "NEWMAN"]);
  });

  it("ignore punctuation and case", () => {
    expect(nameTokens(["o'brien-jones"]).has("BRIEN")).toBe(true);
  });
});

describe("isInternal", () => {
  it("is either kind, which is what a household total excludes", () => {
    expect(isInternal({ isInternalToUser: true, isInternalToFamily: false })).toBe(true);
    expect(isInternal({ isInternalToUser: false, isInternalToFamily: true })).toBe(true);
    expect(isInternal({ isInternalToUser: false, isInternalToFamily: false })).toBe(false);
  });

  it("treats null as not internal — the direction that hides nothing", () => {
    // Every row imported before these columns existed reads as null.
    expect(isInternal({ isInternalToUser: null, isInternalToFamily: null })).toBe(false);
    expect(isInternal({})).toBe(false);
  });
});

// ── The backfill, which is what made the toggle work on real data ───────────
describe("reclassify", () => {
  const stored = (extra: Partial<ReclassifiableRow>): ReclassifiableRow => ({
    id: "t1",
    merchant: null,
    method: null,
    isInternalToUser: false,
    isInternalToFamily: false,
    ...extra,
  });

  it("finds rows imported before the columns existed", () => {
    // The real case: 592 rows in a live household whose merchant says transfer
    // and whose flags were never set, so the toggle had nothing to hide.
    const rows = [
      stored({ id: "a", merchant: "ONLINE TRANSFER FROM STERLING A PLATINUM SAVINGS" }),
      stored({ id: "b", merchant: "ZELLE TO SARAH NEWMAN", method: "Zelle" }),
      stored({ id: "c", merchant: "WEGMANS # 000", method: "Card" }),
    ];
    const changes = reclassify(rows, household);
    expect(changes).toHaveLength(2);
    expect(changes.find((c) => c.id === "a")!.to).toEqual({
      isInternalToUser: true,
      isInternalToFamily: false,
    });
    expect(changes.find((c) => c.id === "b")!.to).toEqual({
      isInternalToUser: false,
      isInternalToFamily: true,
    });
  });

  it("reports nothing for rows already correct, so as little is written as possible", () => {
    const rows = [
      stored({ id: "a", merchant: "ONLINE TRANSFER TO SAVINGS", isInternalToUser: true }),
      stored({ id: "c", merchant: "WEGMANS # 000", method: "Card" }),
    ];
    expect(reclassify(rows, household)).toHaveLength(0);
  });

  it("UNFLAGS a row that is no longer internal", () => {
    // A member leaving the household must not leave their payments hidden from
    // its totals forever, so this reports both directions.
    const rows = [stored({ id: "b", merchant: "ZELLE TO SARAH NEWMAN", method: "Zelle", isInternalToFamily: true })];
    const changes = reclassify(rows, nameTokens(["Justin"]));
    expect(changes).toHaveLength(1);
    expect(changes[0].from).toEqual({ isInternalToUser: false, isInternalToFamily: true });
    expect(changes[0].to).toEqual({ isInternalToUser: false, isInternalToFamily: false });
  });

  it("moves a row from family to user if it was mis-stored", () => {
    const rows = [
      stored({
        id: "a",
        merchant: "ONLINE TRANSFER FROM NEWMAN J WAY2SAVE SAVINGS",
        isInternalToFamily: true,
      }),
    ];
    const changes = reclassify(rows, household);
    expect(changes[0].to).toEqual({ isInternalToUser: true, isInternalToFamily: false });
  });

  it("is idempotent — running it twice finds nothing the second time", () => {
    const rows = [stored({ id: "a", merchant: "ONLINE TRANSFER TO SAVINGS" })];
    const first = reclassify(rows, household);
    expect(first).toHaveLength(1);
    const applied = rows.map((r) => ({ ...r, ...first[0].to }));
    expect(reclassify(applied, household)).toHaveLength(0);
  });
});

// ── Pairing the two legs: the case a memo cannot answer ─────────────────────
describe("pairing two legs of one transfer", () => {
  const leg = (extra: Partial<PairableRow>): PairableRow => ({
    id: "x",
    familyMemberId: "justin",
    direction: "EXPENSE",
    amountMinor: 20000,
    occurredOn: "2026-09-15",
    merchant: "CASH APP",
    method: null,
    ...extra,
  });

  it("catches an anonymous Cash App transfer between two members", () => {
    // Neither memo names anybody, so classifyInternalTransfer finds nothing — but
    // the transfer is in the data twice, once on each side.
    const out = leg({ id: "out", familyMemberId: "justin", direction: "EXPENSE" });
    const inn = leg({ id: "in", familyMemberId: "libby", direction: "INCOME", occurredOn: "2026-09-16" });
    expect(classifyInternalTransfer(out, household)).toEqual({
      isInternalToUser: false,
      isInternalToFamily: false,
    });

    const pairs = pairTransfers([out, inn]);
    expect(pairs.get("out")).toEqual({ isInternalToUser: false, isInternalToFamily: true });
    expect(pairs.get("in")).toEqual({ isInternalToUser: false, isInternalToFamily: true });
  });

  it("calls it an OWN-account transfer when both legs are the same member", () => {
    const pairs = pairTransfers([
      leg({ id: "out", direction: "EXPENSE" }),
      leg({ id: "in", direction: "INCOME" }),
    ]);
    expect(pairs.get("out")).toEqual({ isInternalToUser: true, isInternalToFamily: false });
  });

  it("returns flags for BOTH legs, so each account can write its own", () => {
    // Writes are owner-only, so one account flags its leg and the other flags
    // theirs — neither can write the other's row.
    const pairs = pairTransfers([
      leg({ id: "out", familyMemberId: "justin" }),
      leg({ id: "in", familyMemberId: "libby", direction: "INCOME" }),
    ]);
    expect([...pairs.keys()].sort()).toEqual(["in", "out"]);
  });

  it("will not pair two legs going the same way", () => {
    // Two outgoing £200 transfers are two transfers, not one matched to itself.
    expect(pairTransfers([leg({ id: "a" }), leg({ id: "b" })]).size).toBe(0);
  });

  it("will not pair across different amounts", () => {
    const pairs = pairTransfers([
      leg({ id: "out", amountMinor: 20000 }),
      leg({ id: "in", direction: "INCOME", amountMinor: 20001 }),
    ]);
    expect(pairs.size).toBe(0);
  });

  it("will not pair outside the settle window", () => {
    const pairs = pairTransfers([
      leg({ id: "out", occurredOn: "2026-09-15" }),
      leg({ id: "in", direction: "INCOME", occurredOn: "2026-09-25" }),
    ]);
    expect(pairs.size).toBe(0);
  });

  it("REFUSES to pair anything that is not a transfer on both sides", () => {
    // The condition that keeps a £200 card purchase from pairing with a £200
    // paycheque that lands the same day — a false pair removes real money from
    // the household's totals, which is the failure nobody notices.
    const purchase = leg({ id: "buy", merchant: "WEGMANS # 000", method: "Card" });
    const salary = leg({
      id: "pay",
      direction: "INCOME",
      merchant: "MERIDIAN CAPITAL PAYROLL",
      method: "Deposit",
      familyMemberId: "libby",
    });
    expect(pairTransfers([purchase, salary]).size).toBe(0);
    // Not even when one side IS a transfer.
    expect(pairTransfers([leg({ id: "t" }), salary]).size).toBe(0);
  });

  it("uses each row at most once", () => {
    // Two separate £200 transfers on one day must produce two pairs, not four.
    const rows = [
      leg({ id: "o1", direction: "EXPENSE" }),
      leg({ id: "o2", direction: "EXPENSE" }),
      leg({ id: "i1", direction: "INCOME", familyMemberId: "libby" }),
      leg({ id: "i2", direction: "INCOME", familyMemberId: "libby" }),
    ];
    const pairs = pairTransfers(rows);
    expect(pairs.size).toBe(4);
  });

  it("leaves an unmatched leg alone rather than guessing", () => {
    const pairs = pairTransfers([
      leg({ id: "o1" }),
      leg({ id: "o2" }),
      leg({ id: "i1", direction: "INCOME", familyMemberId: "libby" }),
    ]);
    // One pair formed; the third row has nothing left to match.
    expect(pairs.size).toBe(2);
  });

  it("prefers the nearest date when several could match", () => {
    const pairs = pairTransfers([
      leg({ id: "out", occurredOn: "2026-09-15" }),
      leg({ id: "far", direction: "INCOME", familyMemberId: "libby", occurredOn: "2026-09-18" }),
      leg({ id: "near", direction: "INCOME", familyMemberId: "mia", occurredOn: "2026-09-15" }),
    ]);
    // "out" took "near"; "far" was left with nothing of the opposite direction.
    expect(pairs.has("near")).toBe(true);
    expect(pairs.has("far")).toBe(false);
  });
});

describe("resolveInternalTransfers", () => {
  const row = (extra: Partial<PairableRow>): PairableRow => ({
    id: "x",
    familyMemberId: "justin",
    direction: "EXPENSE",
    amountMinor: 1000,
    occurredOn: "2026-09-15",
    merchant: null,
    method: null,
    ...extra,
  });

  it("makes the toggle work on rows that have no stored flags at all", () => {
    // The actual bug: a household that imported before these columns existed had
    // 1,062 unflagged transfers, so "ignore internal transfers" did nothing.
    const rows = [row({ id: "a", merchant: "ONLINE TRANSFER TO SAVINGS" })];
    const resolved = resolveInternalTransfers(rows, household);
    expect(resolved.get("a")).toEqual({ isInternalToUser: true, isInternalToFamily: false });
  });

  it("prefers a stored flag over re-deriving one", () => {
    // Something already decided — a re-check, or a future manual override — and a
    // derivation must not quietly overrule it.
    const rows = [
      row({ id: "a", merchant: "WEGMANS # 000", method: "Card", isInternalToFamily: true }),
    ];
    expect(resolveInternalTransfers(rows, household).get("a")).toEqual({
      isInternalToUser: false,
      isInternalToFamily: true,
    });
  });

  it("falls through memo to pairing", () => {
    const rows = [
      row({ id: "out", merchant: "CASH APP" }),
      row({ id: "in", merchant: "CASH APP", direction: "INCOME", familyMemberId: "libby" }),
    ];
    const resolved = resolveInternalTransfers(rows, household);
    expect(resolved.get("out")).toEqual({ isInternalToUser: false, isInternalToFamily: true });
  });

  it("does not offer a memo-classified row up for pairing", () => {
    // An own-account sweep must not become half of a payment to somebody else
    // just because an opposite leg of the same amount exists nearby.
    const rows = [
      row({ id: "sweep", merchant: "ONLINE TRANSFER TO SAVINGS" }),
      row({ id: "other", merchant: "CASH APP", direction: "INCOME", familyMemberId: "libby" }),
    ];
    const resolved = resolveInternalTransfers(rows, household);
    expect(resolved.get("sweep")).toEqual({ isInternalToUser: true, isInternalToFamily: false });
    expect(resolved.has("other")).toBe(false);
  });

  it("leaves ordinary money out of the map entirely", () => {
    const rows = [row({ id: "a", merchant: "WEGMANS # 000", method: "Card" })];
    expect(resolveInternalTransfers(rows, household).has("a")).toBe(false);
  });

  it("works with no roster, which is how the list hooks call it", () => {
    const rows = [
      row({ id: "a", merchant: "ONLINE TRANSFER TO SAVINGS" }),
      row({ id: "out", merchant: "VENMO" }),
      row({ id: "in", merchant: "VENMO", direction: "INCOME", familyMemberId: "libby" }),
    ];
    const resolved = resolveInternalTransfers(rows, EMPTY_TOKENS);
    expect(resolved.get("a")?.isInternalToUser).toBe(true);
    expect(resolved.get("out")?.isInternalToFamily).toBe(true);
  });
});
