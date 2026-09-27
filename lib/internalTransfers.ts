// Deciding whether a transaction actually moves money into or out of the
// household, or merely shuffles it around inside.
//
// WHY IT MATTERS. A transfer's two legs are a real credit and a real debit, so
// counting them adds the same amount to BOTH sides of the month. A household that
// sweeps money into savings every payday looks like it earns and spends far more
// than it does.
//
// WHAT IT DOES TO THE NET depends on whether both accounts were imported, and the
// difference is worth stating because it is easy to get wrong:
//
//   both legs imported — they cancel, so the net is unchanged and ONLY the in and
//                        out figures are inflated. This is the case that makes
//                        the distortion hard to notice at all.
//   one leg imported   — there is nothing to cancel against, so counting it also
//                        makes the NET wrong: money swept into an un-imported
//                        savings account is reported as spending when it never
//                        left the household. Excluding it corrects the net.
//
// On a real household of 3,000 rows, excluding transfers moved in from $467,056 to
// $330,217 and out from $330,935 to $198,077 — and moved the net by $3,980,
// entirely from one-legged transfers.
//
// TWO KINDS, AND THEY ARE NOT THE SAME QUESTION:
//
//   internal to USER    — one account holder's own accounts. Checking to their
//                         savings. Not income or spending for anybody, ever.
//   internal to FAMILY  — two people inside the household. One member paying
//                         another. Real money for each of them individually,
//                         nothing at all at household level where the legs
//                         cancel.
//
// Both leave household totals together; keeping them apart is what makes "who
// paid whom inside this household" answerable without re-deriving it.
//
// CLASSIFIES FROM STORED FIELDS, NOT ONLY FROM A RAW MEMO, and that is
// load-bearing rather than a convenience. The importer drops the statement memo
// and keeps only the counterparty pulled out of it — but extractMerchant leaves
// the "ONLINE TRANSFER" prefix intact precisely because the prefix IS the
// information on those rows. So a row imported before these columns existed can
// still be classified from what was kept. Without that, a household with a
// year of imported statements would have had none of them flagged and the
// toggle would have looked broken, which is exactly what happened.

/** What the classifier needs. Every field is one the database actually stores. */
export interface ClassifiableRow {
  /** The counterparty as stored, which retains the memo's transfer prefix. */
  merchant: string | null;
  /** "Card", "Transfer", "Zelle", … as stored. */
  method: string | null;
  /**
   * The raw statement memo, when there is one to hand.
   *
   * Available at import time and never afterwards, so everything below must work
   * without it. It is used only to strengthen a decision, never as the sole
   * basis for one.
   */
  memo?: string | null;
}

export interface InternalTransferFlags {
  isInternalToUser: boolean;
  isInternalToFamily: boolean;
}

function squash(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim().toUpperCase();
}

/**
 * Wells Fargo's own marker for a transfer between the account holder's own
 * accounts, and nothing else.
 *
 * "ONLINE TRANSFER" is the prefix the bank uses for exactly that case: Zelle,
 * external transfers and card-network money movement each carry a different one.
 * Matching the prefix rather than account nicknames ("WAY2SAVE SAVINGS") is what
 * keeps this working for somebody whose accounts are named differently.
 */
export function looksLikeOwnAccountTransfer(row: ClassifiableRow): boolean {
  const text = `${squash(row.memo)} ${squash(row.merchant)}`.trim();
  return /(^|\s)ONLINE TRANSFER\b/.test(text);
}

/**
 * Whether this row is a person-to-person money movement at all.
 *
 * A NECESSARY CONDITION for the family check below, not evidence on its own. A
 * name appearing in a card purchase memo means a shop is named after somebody,
 * not that a household member was paid — "PURCHASE SARAHS BAKERY" must never be
 * read as money given to Sarah. Requiring the row to be a transfer first is what
 * rules that out.
 */
function looksLikePersonTransfer(row: ClassifiableRow): boolean {
  const text = `${squash(row.memo)} ${squash(row.merchant)}`.trim();
  if (/(^|\s)(ZELLE|MONEY TRANSFER|WIRE|VENMO|CASH APP|PAYPAL)\b/.test(text)) return true;
  const method = squash(row.method);
  return method === "ZELLE" || method === "TRANSFER" || method === "WIRE";
}

/** Words too common to identify anybody, even as part of a name. */
const NAME_STOPWORDS = new Set([
  "THE", "AND", "FOR", "FROM", "TO", "ON", "REF", "CARD", "PURCHASE", "PAYMENT",
  "TRANSFER", "ONLINE", "ZELLE", "MONEY", "WIRE", "SAVINGS", "CHECKING",
]);

/**
 * The parts of a household member's name worth matching a memo against.
 *
 * Split into words so "Sarah Newman" matches a memo naming only "SARAH", which is
 * how bank memos usually render a payee. Words shorter than three characters are
 * dropped along with the stopwords above: a two-letter fragment matches almost
 * any memo, and a false positive here removes real money from a household's
 * income.
 */
export function nameTokens(names: readonly string[]): Set<string> {
  const tokens = new Set<string>();
  for (const name of names) {
    for (const word of squash(name).split(/[^A-Z0-9]+/)) {
      if (word.length >= 3 && !NAME_STOPWORDS.has(word)) tokens.add(word);
    }
  }
  return tokens;
}

/**
 * Whether a transfer names somebody in this household.
 *
 * `householdTokens` comes from nameTokens() over the roster — precomputed by the
 * caller because classifying a thousand rows should not rebuild it a thousand
 * times.
 *
 * ERRS TOWARD NOT FLAGGING. A missed family transfer leaves a row counted as
 * ordinary money, which is the status quo and visible in the ledger. A false one
 * removes real income or spending from the household's totals, and a figure that
 * is quietly too low is the failure nobody catches.
 */
export function namesHouseholdMember(
  row: ClassifiableRow,
  householdTokens: ReadonlySet<string>
): boolean {
  if (householdTokens.size === 0) return false;
  const text = `${squash(row.memo)} ${squash(row.merchant)}`.trim();
  for (const word of text.split(/[^A-Z0-9]+/)) {
    if (word.length >= 3 && householdTokens.has(word)) return true;
  }
  return false;
}

/**
 * Both flags for one row.
 *
 * The two are mutually exclusive by construction: a row matching Wells Fargo's
 * own-accounts prefix is internal to the USER, and the family check is only
 * reached when it does not. That ordering matters — "ONLINE TRANSFER FROM
 * NEWMAN J WAY2SAVE SAVINGS" names a household member AND is an own-account
 * sweep, and calling it a payment between two people would be wrong in a way
 * that survives into any per-member reporting built on these columns.
 */
export function classifyInternalTransfer(
  row: ClassifiableRow,
  householdTokens: ReadonlySet<string>
): InternalTransferFlags {
  if (looksLikeOwnAccountTransfer(row)) {
    return { isInternalToUser: true, isInternalToFamily: false };
  }
  const isInternalToFamily =
    looksLikePersonTransfer(row) && namesHouseholdMember(row, householdTokens);
  return { isInternalToUser: false, isInternalToFamily };
}

/**
 * For callers with no household roster to hand.
 *
 * A module-level constant rather than `new Set()` at each call site: passing a
 * fresh set through a useMemo dependency would invalidate it on every render.
 */
export const EMPTY_TOKENS: ReadonlySet<string> = new Set<string>();

/** Either kind — what a household-wide total excludes. */
export function isInternal(flags: {
  isInternalToUser?: boolean | null;
  isInternalToFamily?: boolean | null;
}): boolean {
  return !!flags.isInternalToUser || !!flags.isInternalToFamily;
}

/** A row whose stored flags may need correcting. */
export interface ReclassifiableRow extends ClassifiableRow {
  id: string;
  isInternalToUser: boolean;
  isInternalToFamily: boolean;
}

export interface Reclassification {
  id: string;
  from: InternalTransferFlags;
  to: InternalTransferFlags;
}

/**
 * Which stored rows disagree with what they would be classified as now.
 *
 * This is the backfill, and it is also the repair path for a household that
 * renames a member or adds one — a Zelle payment to Sarah only becomes internal
 * once Sarah is in the roster.
 *
 * Returns only rows that would actually CHANGE, so the caller writes as little as
 * possible. Both directions are reported: a row wrongly flagged gets unflagged,
 * because a member leaving the household must not leave their payments hidden
 * from its totals forever.
 */
export function reclassify(
  rows: readonly ReclassifiableRow[],
  householdTokens: ReadonlySet<string>
): Reclassification[] {
  const out: Reclassification[] = [];
  for (const row of rows) {
    const to = classifyInternalTransfer(row, householdTokens);
    const from = {
      isInternalToUser: !!row.isInternalToUser,
      isInternalToFamily: !!row.isInternalToFamily,
    };
    if (to.isInternalToUser !== from.isInternalToUser || to.isInternalToFamily !== from.isInternalToFamily) {
      out.push({ id: row.id, from, to });
    }
  }
  return out;
}

// ─── Pairing the two legs ────────────────────────────────────────────────────
//
// WHAT THE MEMO CANNOT TELL YOU. Classification above reads one row's text, which
// works when the bank names the counterparty ("ZELLE TO SARAH"). It fails exactly
// where the memo is anonymous — "CASH APP", "VENMO", a bare wire — and those are
// common. But when BOTH accounts are imported, the transfer is in the data twice:
// once leaving one member and once arriving at another, same amount, a day or two
// apart. Pairing those two rows identifies the transfer with no names at all.
//
// It also answers WHICH KIND for free, and more reliably than a memo can:
//
//   both legs on the same family member  -> between that person's own accounts
//   legs on two different members        -> between two people in the household
//
// CONSERVATIVE BY CONSTRUCTION, because a false pair removes real money from the
// household's totals — the failure nobody notices. Three conditions, all
// required: opposite directions, identical amounts, and BOTH sides looking like a
// transfer. That last one is what stops a $50 card purchase pairing with a $50
// paycheque that happens to land the same day.

/** How far apart two legs of one transfer may settle. */
export const PAIR_WINDOW_DAYS = 4;

/** A row that can take part in pairing. */
export interface PairableRow {
  id: string;
  /** Which tracked person this row belongs to. */
  familyMemberId: string;
  direction: string;
  amountMinor: number;
  /** "yyyy-mm-dd" */
  occurredOn: string;
  merchant: string | null;
  method: string | null;
  memo?: string | null;
  isInternalToUser?: boolean | null;
  isInternalToFamily?: boolean | null;
}

/**
 * Whether a row is a money movement rather than a purchase.
 *
 * The gate on pairing. Deliberately a union of the two narrower tests above plus
 * the platforms whose memos carry no name, which are the whole reason pairing
 * exists.
 */
export function looksLikeAnyTransfer(row: ClassifiableRow): boolean {
  return looksLikeOwnAccountTransfer(row) || looksLikePersonTransfer(row);
}

/** Days between two "yyyy-mm-dd" strings, with no timezone anywhere near it. */
function dayIndex(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1) / 86_400_000;
}

/**
 * Finds transfers by matching their two legs against each other.
 *
 * Returns flags for the rows that were paired, keyed by id — both legs, so a
 * caller can apply whichever of them it owns. Rows that pair with nothing are
 * absent rather than present-and-false, so this composes with the memo-based
 * classification instead of overwriting it.
 *
 * Each row is used at most once. That count-awareness is what keeps two separate
 * $100 transfers on one day from being read as one transfer matched twice.
 */
export function pairTransfers(
  rows: readonly PairableRow[],
  { windowDays = PAIR_WINDOW_DAYS }: { windowDays?: number } = {}
): Map<string, InternalTransferFlags> {
  const out = new Map<string, InternalTransferFlags>();

  // Only transfer-shaped rows, bucketed by amount so this is not quadratic over
  // a household's whole history.
  const byAmount = new Map<number, PairableRow[]>();
  for (const row of rows) {
    if (!looksLikeAnyTransfer(row)) continue;
    const bucket = byAmount.get(row.amountMinor);
    if (bucket) bucket.push(row);
    else byAmount.set(row.amountMinor, [row]);
  }

  const used = new Set<string>();

  for (const bucket of byAmount.values()) {
    if (bucket.length < 2) continue;
    // Earliest first, so the pairing is stable and explainable rather than
    // dependent on the order rows happened to arrive in.
    const ordered = [...bucket].sort((a, b) => a.occurredOn.localeCompare(b.occurredOn));

    for (const left of ordered) {
      if (used.has(left.id)) continue;
      const leftDay = dayIndex(left.occurredOn);

      let best: { row: PairableRow; gap: number } | null = null;
      for (const right of ordered) {
        if (right.id === left.id || used.has(right.id)) continue;
        // Opposite directions: one leg out, one leg in. Two rows moving the same
        // way are two transfers, not the two halves of one.
        if (right.direction === left.direction) continue;
        const gap = Math.abs(dayIndex(right.occurredOn) - leftDay);
        if (gap > windowDays) continue;
        if (!best || gap < best.gap) best = { row: right, gap };
      }
      if (!best) continue;

      used.add(left.id);
      used.add(best.row.id);
      // The one thing pairing knows that a memo cannot: whose accounts these are.
      const sameMember = left.familyMemberId === best.row.familyMemberId;
      const flags: InternalTransferFlags = sameMember
        ? { isInternalToUser: true, isInternalToFamily: false }
        : { isInternalToUser: false, isInternalToFamily: true };
      out.set(left.id, flags);
      out.set(best.row.id, flags);
    }
  }

  return out;
}

/**
 * The flags a row should be treated as having, right now, on screen.
 *
 * WHY THIS EXISTS AND WHY EVERY LIST USES IT. The stored columns are written at
 * import and by the re-check in Settings — but a household that imported before
 * those columns existed has none of them set, and until this function the
 * "ignore internal transfers" toggle therefore did nothing at all for them. A
 * feature that silently requires somebody to find a button in Settings before it
 * works is a broken feature, whatever the button does.
 *
 * So display never waits on the stored value. It is derived on read, from three
 * sources in order of confidence:
 *
 *   1. the stored flags, when either is set — somebody or something already
 *      decided, and a re-derivation must not quietly overrule it;
 *   2. the memo, via classifyInternalTransfer — needs no other row;
 *   3. pairing, via pairTransfers — needs the other leg to be in `rows`, which
 *      is what catches the anonymous "CASH APP" case the memo cannot.
 *
 * The stored columns keep their value: they are durable, they are what any
 * server-side or cross-period question reads, and they are the only place a
 * pairing found in one month survives into a view of another. This is the live
 * answer; they are the record.
 */
export function resolveInternalTransfers<T extends PairableRow>(
  rows: readonly T[],
  householdTokens: ReadonlySet<string>,
  options: { windowDays?: number } = {}
): Map<string, InternalTransferFlags> {
  const resolved = new Map<string, InternalTransferFlags>();
  const undecided: T[] = [];

  for (const row of rows) {
    if (row.isInternalToUser || row.isInternalToFamily) {
      resolved.set(row.id, {
        isInternalToUser: !!row.isInternalToUser,
        isInternalToFamily: !!row.isInternalToFamily,
      });
      continue;
    }
    const byMemo = classifyInternalTransfer(row, householdTokens);
    if (byMemo.isInternalToUser || byMemo.isInternalToFamily) {
      resolved.set(row.id, byMemo);
      continue;
    }
    undecided.push(row);
  }

  // Pairing runs only over what the first two passes could not place, so a row
  // already known to be an own-account sweep cannot be mistaken for half of a
  // payment to somebody else.
  for (const [id, flags] of pairTransfers(undecided, options)) {
    resolved.set(id, flags);
  }

  return resolved;
}
