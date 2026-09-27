// Deciding what a re-uploaded statement actually adds.
//
// THE PROBLEM THIS EXISTS FOR. Nobody uploads a bank export once. They upload
// September, then in October they upload August-to-October to fill a gap, and
// the two files overlap by weeks. Most of the second file is already in the
// ledger and must not be imported again — but some of it is new, and some rows
// that LOOK like duplicates are two genuinely separate purchases that happen to
// agree on every column. Getting either direction wrong is bad in a way that is
// hard to notice: a doubled month, or a missing shop.
//
// WHY THE FINGERPRINT ALONE IS NOT ENOUGH. Transaction.importKey catches a line
// that is byte-for-byte the same line, which is the common case. It does not
// catch the case that matters most, because Wells Fargo reports a transaction
// TWICE IN TWO DIFFERENT FORMATS:
//
//   pending   PURCHASE SANTINIS NEW +15550001234  VA CARD0000
//   settled   PURCHASE   AUTHORIZED ON 09/25 SANTINIS NEW YORK GRILL
//             GREENWICH CT  S000000000000001   CARD 0000
//
// Different memo, usually a different date, sometimes a different amount (a tip,
// a fuel hold). Import the statement while it is pending and re-import after it
// settles, and the fingerprints do not match — so without what is below, every
// charge that was pending at the first upload lands twice.
//
// THREE TIERS, MOST CERTAIN FIRST. Only the first two ever skip a row on their
// own:
//
//   1. SAME LINE      — importKey already in the database. Certain.
//   2. SAME REFERENCE — both rows carry Wells Fargo's own transaction reference
//                       and they are equal. Certain, whatever else changed:
//                       this is what resolves pending-then-settled exactly,
//                       and it is why the reference is stored at all.
//   3. LOOKS THE SAME — same direction and amount, dates close together, and no
//                       reference on at least one side. NOT skipped. Surfaced
//                       for a person to confirm, because this tier cannot tell a
//                       settled pending charge from a second identical purchase.
//
// WHY TIER 3 NEVER DECIDES BY ITSELF. Two £84.99 shops at the same supermarket
// three days apart are indistinguishable from one £84.99 shop reported twice —
// on amount, date and merchant they are identical. What separates them is the
// reference, and tier 3 is by definition the case where a reference is missing.
// So it reports and does not act. Silently dropping a real transaction is worse
// than asking, because a ledger that is quietly missing a row is wrong in a way
// nobody reconciles against.
//
// COUNTS ARE RESPECTED THROUGHOUT. Every existing row can be claimed by at most
// one incoming row, and vice versa. That is what protects legitimate duplicates:
// two identical coffees on the same afternoon are two rows in the database, so a
// re-upload matches two and imports none, and a THIRD coffee later matches the
// two that are there, finds nothing left to pair with, and is correctly new.

import type { ParsedStatementRow } from "./wellsFargoCsv";

/**
 * How far apart a pending row and its settled counterpart may sit.
 *
 * Wells Fargo posts most card authorizations within two or three business days;
 * five calendar days covers a weekend. Widening this does not find more real
 * duplicates, it just sweeps more unrelated transactions into tier 3 for a
 * person to wade through — and since tier 3 never acts on its own, a window
 * that is too narrow merely misses a prompt rather than corrupting anything.
 */
export const SETTLE_WINDOW_DAYS = 5;

/** An imported transaction already in the database. */
export interface ExistingImportedRow {
  id: string;
  importKey: string | null;
  importRef: string | null;
  /** "yyyy-mm-dd" */
  occurredOn: string;
  amountMinor: number;
  direction: string;
  merchant: string | null;
}

/** Why a row was judged to be already present. */
export type MatchBasis =
  /** Its importKey is in the database — the same statement line. */
  | "same-line"
  /** Wells Fargo's own reference matches — the same transaction, reformatted. */
  | "same-reference"
  /** Same amount, near date, and the merchants agree. Needs confirming. */
  | "same-merchant-and-amount"
  /**
   * The merchants agree and the dates are close, but the AMOUNT changed —
   * a tip added at settlement, or a fuel hold replaced by the real total.
   * Needs confirming.
   */
  | "same-merchant"
  /** Same amount and near date only. Needs confirming. */
  | "same-amount";

export interface Match {
  row: ParsedStatementRow;
  /** The importKey this row would be written with. */
  key: string;
  existing: ExistingImportedRow;
  basis: MatchBasis;
  /** Signed days from the existing row to this one. 0 on the same day. */
  dayGap: number;
}

export interface Reconciliation {
  /**
   * Rows certainly already in the ledger — tiers 1 and 2. Skipped without
   * asking.
   */
  certain: Match[];
  /**
   * Rows that resemble something already there — tier 3. NOT skipped. The
   * caller shows these and lets a person decide; see the note above.
   */
  probable: Match[];
  /** Rows with no counterpart at all. Imported. */
  fresh: ParsedStatementRow[];
  /** Keys parallel to `fresh`. */
  freshKeys: string[];
}

/**
 * Days between two "yyyy-mm-dd" strings.
 *
 * Via Date.UTC on the parsed parts, never `new Date(string)`. Both sides are
 * built identically from explicit integers, so the subtraction is exact and
 * carries no timezone at all — the hazard lib/monthRange.ts exists to avoid does
 * not arise here because no local calendar is ever consulted.
 */
function dayIndex(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1) / 86_400_000;
}

/** Uppercase alphanumeric words, for comparing two spellings of one merchant. */
function normalizeMerchant(value: string | null): string {
  return (value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

/**
 * Whether two merchant strings plausibly name the same counterparty.
 *
 * A settled memo is usually LONGER than its pending one — the pending line is
 * truncated to fit the statement's column, so "SANTINIS NEW" becomes "SANTINIS
 * NEW YORK GRILL" — which makes a word-boundary prefix the signal rather than
 * equality.
 *
 * ONE SHARED LEADING WORD IS NOT ENOUGH, and that is the whole subtlety. It
 * looks sufficient and is not: "THE BUTCHER" and "THE BAKER" share their first
 * word, and so do every merchant a chain gives a common brand prefix. A
 * length floor on that word does not help either — "THE" clears three
 * characters, and a seven-character brand prefix shared by four unrelated
 * merchants clears any floor worth setting. So the bar is two shared leading
 * words, or a prefix relationship, or equality; nothing weaker.
 *
 * Erring strict is the right direction here. A missed agreement demotes a match
 * to `same-amount`, which is still reported; a false agreement PROMOTES an
 * unrelated pair, and a promoted pair is the one a person is most likely to wave
 * through.
 */
function merchantsAgree(a: string | null, b: string | null): boolean {
  const left = normalizeMerchant(a);
  const right = normalizeMerchant(b);
  if (!left || !right) return false;
  if (left === right) return true;
  // Word-boundary, so "EXAMPLE COFFEE" does not prefix-match "EXAMPLE COFFEEHOUSE".
  if (left.startsWith(`${right} `) || right.startsWith(`${left} `)) return true;
  const leftWords = left.split(" ");
  const rightWords = right.split(" ");
  let shared = 0;
  while (
    shared < leftWords.length &&
    shared < rightWords.length &&
    leftWords[shared] === rightWords[shared]
  ) {
    shared++;
  }
  return shared >= 2;
}

/**
 * Works out which of a parsed statement's rows are already in the ledger.
 *
 * `keys` is parallel to `rows` — the importKey each one would be written with.
 * `existing` is the imported transactions already stored across the range the
 * file covers, widened by the settle window so a pending row's counterpart at
 * either edge is in scope.
 *
 * Nothing here writes, reads or throws; it is a pure decision over two lists so
 * that the whole matter of what a re-upload does is testable without a database.
 */
export function reconcileStatement(
  rows: readonly ParsedStatementRow[],
  keys: readonly string[],
  existing: readonly ExistingImportedRow[],
  { windowDays = SETTLE_WINDOW_DAYS }: { windowDays?: number } = {}
): Reconciliation {
  const certain: Match[] = [];
  const probable: Match[] = [];
  const fresh: ParsedStatementRow[] = [];
  const freshKeys: string[] = [];

  // Every existing row may be claimed once. This is the whole protection for
  // legitimate duplicates: two identical rows in the database can absorb two
  // incoming ones and no more.
  const claimed = new Set<string>();
  const byKey = new Map<string, ExistingImportedRow>();
  const byRef = new Map<string, ExistingImportedRow[]>();
  for (const row of existing) {
    if (row.importKey) byKey.set(row.importKey, row);
    if (row.importRef) {
      const bucket = byRef.get(row.importRef);
      if (bucket) bucket.push(row);
      else byRef.set(row.importRef, [row]);
    }
  }

  // Rows still needing a home after the two certain tiers, kept with their index
  // so `keys` stays aligned.
  const undecided: { row: ParsedStatementRow; key: string }[] = [];

  // ── Tier 1: the same statement line ──
  // Done for the whole file before tier 2, and tier 2 before tier 3, so a
  // certain match always wins the existing row it points at. Interleaving them
  // would let a merely-probable match claim a row that a later, certain one
  // needed, and the certain row would then import as new.
  rows.forEach((row, i) => {
    const key = keys[i];
    const hit = byKey.get(key);
    if (hit && !claimed.has(hit.id)) {
      claimed.add(hit.id);
      certain.push({ row, key, existing: hit, basis: "same-line", dayGap: 0 });
    } else {
      undecided.push({ row, key });
    }
  });

  // ── Tier 2: Wells Fargo's own reference ──
  // No date window and no amount check, deliberately. A reference identifies the
  // transaction, so a settled row whose amount grew by a tip and whose date
  // moved two days is still that transaction — and those are exactly the rows
  // no other tier can resolve with certainty.
  const afterRef: { row: ParsedStatementRow; key: string }[] = [];
  for (const entry of undecided) {
    const ref = entry.row.statementRef;
    const candidates = ref ? (byRef.get(ref) ?? []) : [];
    const hit = candidates.find((c) => !claimed.has(c.id));
    if (hit) {
      claimed.add(hit.id);
      certain.push({
        row: entry.row,
        key: entry.key,
        existing: hit,
        basis: "same-reference",
        dayGap: dayIndex(entry.row.occurredOn) - dayIndex(hit.occurredOn),
      });
    } else {
      afterRef.push(entry);
    }
  }

  // ── Tier 3: it looks the same ──
  //
  // TWO PASSES, STRONGER FIRST. 3a matches on the amount, 3b on the merchant
  // when the amount has moved. Splitting them matters because a settled charge
  // often is NOT the same amount as its pending authorization — a restaurant tip
  // is added, a fuel hold is replaced by the real total — and a single pass keyed
  // on the amount cannot see those at all. Running 3a over the whole file first
  // means an amount that does match is never beaten to its row by a merchant
  // that merely agrees.
  //
  // Bucketed by (direction, amount) so the search is not quadratic over the
  // file, then filtered by the date window.
  const bucketsOf = new Map<string, ExistingImportedRow[]>();
  for (const row of existing) {
    const bucket = `${row.direction}|${row.amountMinor}`;
    const list = bucketsOf.get(bucket);
    if (list) list.push(row);
    else bucketsOf.set(bucket, [row]);
  }
  // Nearest date first, so when several existing rows could pair with one
  // incoming row the closest one is taken — the likeliest settlement.
  for (const list of bucketsOf.values()) list.sort((a, b) => a.occurredOn.localeCompare(b.occurredOn));

  // Earliest incoming row first, for the same reason: a stable, explainable
  // pairing rather than one that depends on file order.
  const ordered = [...afterRef].sort((a, b) => a.row.occurredOn.localeCompare(b.row.occurredOn));
  const probableKeys = new Set<string>();

  for (const entry of ordered) {
    const { row, key } = entry;
    const day = dayIndex(row.occurredOn);
    const candidates = bucketsOf.get(`${row.direction}|${row.amountMinor}`) ?? [];

    let best: { existing: ExistingImportedRow; basis: MatchBasis; dayGap: number } | null = null;
    for (const candidate of candidates) {
      if (claimed.has(candidate.id)) continue;
      // BOTH references present and different is proof of two separate
      // transactions, whatever else agrees. This is the check that keeps two
      // same-price shops at one supermarket in the same week from being reported
      // as a duplicate — and it is why tier 3 only ever fires where a reference
      // is missing, which is to say on pending rows.
      if (row.statementRef && candidate.importRef && row.statementRef !== candidate.importRef) continue;
      const gap = day - dayIndex(candidate.occurredOn);
      if (Math.abs(gap) > windowDays) continue;
      const basis: MatchBasis = merchantsAgree(row.merchant, candidate.merchant)
        ? "same-merchant-and-amount"
        : "same-amount";
      // A merchant that agrees outranks a nearer date: the point of this tier is
      // to spot one transaction reported twice, and the name is better evidence
      // of that than a day.
      const better =
        !best ||
        (basis === "same-merchant-and-amount" && best.basis === "same-amount") ||
        (basis === best.basis && Math.abs(gap) < Math.abs(best.dayGap));
      if (better) best = { existing: candidate, basis, dayGap: gap };
    }

    if (best) {
      claimed.add(best.existing.id);
      probableKeys.add(key);
      probable.push({ row, key, existing: best.existing, basis: best.basis, dayGap: best.dayGap });
    }
  }

  // ── Tier 3b: the merchant agrees, but the amount moved ──
  // No amount bucket, so this walks the unclaimed rows directly. It is safe to
  // be this loose ONLY because merchantsAgree is strict and because the
  // differing-reference check still applies — and, as with all of tier 3,
  // because nothing here skips a row on its own.
  for (const entry of ordered) {
    const { row, key } = entry;
    if (probableKeys.has(key)) continue;
    const day = dayIndex(row.occurredOn);

    let best: { existing: ExistingImportedRow; dayGap: number } | null = null;
    for (const candidate of existing) {
      if (claimed.has(candidate.id)) continue;
      if (candidate.direction !== row.direction) continue;
      // Identical amounts were tier 3a's job; reaching here with one means
      // 3a declined the pair, and 3b must not re-offer it.
      if (candidate.amountMinor === row.amountMinor) continue;
      if (row.statementRef && candidate.importRef && row.statementRef !== candidate.importRef) continue;
      if (!merchantsAgree(row.merchant, candidate.merchant)) continue;
      const gap = day - dayIndex(candidate.occurredOn);
      if (Math.abs(gap) > windowDays) continue;
      if (!best || Math.abs(gap) < Math.abs(best.dayGap)) best = { existing: candidate, dayGap: gap };
    }

    if (best) {
      claimed.add(best.existing.id);
      probableKeys.add(key);
      probable.push({ row, key, existing: best.existing, basis: "same-merchant", dayGap: best.dayGap });
    }
  }

  // ── Everything else is new ──
  // Rebuilt from `afterRef` rather than from `ordered`, so `fresh` stays in the
  // file's own order — the preview reads as the statement does.
  for (const { row, key } of afterRef) {
    if (probableKeys.has(key)) continue;
    fresh.push(row);
    freshKeys.push(key);
  }

  return { certain, probable, fresh, freshKeys };
}

/** Human wording for why a row was matched, for the review step. */
export const MATCH_BASIS_LABELS: Record<MatchBasis, string> = {
  "same-line": "Identical statement line",
  "same-reference": "Same bank reference",
  "same-merchant-and-amount": "Same merchant and amount, a few days apart",
  "same-merchant": "Same merchant a few days apart, for a different amount",
  "same-amount": "Same amount, a few days apart",
};
