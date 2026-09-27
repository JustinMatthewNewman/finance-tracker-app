// Wells Fargo statement CSV -> transactions the app can store.
//
// This is the one place a bank export is interpreted. It is pure and takes no
// auth, no network and no DOM, so the whole mapping is testable against the
// committed fake statements in transaction_data.example/ — which is the point.
// Everything that talks to Data Connect lives in hooks/useTransactionImport.ts.
//
// THE FORMAT. Five columns, in this order:
//
//   DATE, DESCRIPTION, AMOUNT, CHECK #, STATUS
//   "09/26/2026","PURCHASE   AUTHORIZED ON 09/25 WEGMANS...","-84.19","","Posted"
//
// A header row is optional: Wells Fargo's own "download to spreadsheet" export
// has none, while the copy people save out of a spreadsheet usually does. Both
// are accepted — the first row is treated as a header when its first cell is
// not a date.
//
// SIGN IS DIRECTION, NOT AMOUNT. The statement's amount is signed; a
// Transaction's is not (see the note on Transaction.amountMinor in
// schema.gql). A negative statement amount becomes an EXPENSE row carrying the
// positive magnitude, a positive one becomes INCOME. The sign is consumed here
// and never stored.
//
// EVERY ROW IS AN ACTUAL, NEVER A PROJECTION. An imported row is money that
// moved: `status: "POSTED"`, `source: "IMPORT"`. It is deliberately not
// FORECASTED, and it is deliberately not "MANUAL" either — see
// lib/transactionKind.ts. That "Pending" also maps to POSTED is a decision
// rather than an oversight: a pending card purchase has happened, it merely
// has not settled, and showing somebody's coffee as an expectation for two
// days would be more wrong than showing it as spent.
//
// WHAT IS NOT KEPT. The statement's own memo line is long, mostly machinery
// ("AUTHORIZED ON 09/25 ... P000000000000001 CARD 0000") and is not stored
// anywhere. What gets stored is the counterparty pulled out of it, in
// `merchant`, because that is the only part of it anybody reads and a raw
// memo in a calendar cell is unreadable. The import preview shows the raw line
// beside what will be written, so the mapping is visible before it is
// committed rather than discovered afterwards. Nothing is dropped silently.

import { classifyInternalTransfer, nameTokens } from "./internalTransfers";
import { type CurrencyCode, DEFAULT_CURRENCY, type Direction, type Minor, parseAmountToMinor } from "./money";

/** One row of the statement, exactly as the file had it. */
export interface RawStatementRow {
  /** 1-based line number in the file, for error messages. */
  line: number;
  date: string;
  description: string;
  amount: string;
  checkNumber: string;
  status: string;
}

/** A statement row mapped onto the fields a Transaction needs. */
export interface ParsedStatementRow {
  /** "yyyy-mm-dd", a local calendar day. See lib/monthRange.ts. */
  occurredOn: string;
  /** Unsigned magnitude in minor units. */
  amountMinor: Minor;
  direction: Direction;
  /** The counterparty pulled out of the memo line. Never empty. */
  merchant: string;
  /** "Card", "Transfer", "Zelle", "ATM", "Deposit", "Check", or null. */
  method: string | null;
  /**
   * Wells Fargo's own reference for this transaction, or null when the memo
   * carries none.
   *
   * THE MOST USEFUL FIELD IN THE FILE, and the one that makes re-importing an
   * overlapping statement actually correct rather than merely usually correct.
   * A settled row carries one ("S466268207426921", "REF #IB00000001"); a
   * PENDING row does not, and a pending row's memo is a different format
   * entirely — so the same purchase looks like two unrelated lines across two
   * exports, days apart, sometimes for different amounts.
   *
   * Two rows with references that are both present and equal are the same
   * transaction, whatever else changed about them. Two with references that are
   * both present and DIFFERENT are not the same transaction, however alike they
   * look — which is what stops two genuine same-price shops at the same shop in
   * the same week being mistaken for one. See lib/importReconcile.ts.
   *
   * Deliberately NOT part of the fingerprint, and deliberately not @unique on
   * the column. It is evidence for reconciliation, not an identity: it is absent
   * on exactly the rows that need matching most, and an amount that changes
   * between pending and settled (a tip, a fuel hold) must not be refused
   * outright — it needs a person to look at it.
   */
  statementRef: string | null;
  /** A guessed category name, or null when nothing matched confidently. */
  categoryName: string | null;
  /**
   * Whether this row shuffles money inside the household rather than moving it
   * in or out, and which of the two kinds it is.
   *
   * Flagged rather than filtered, because which a person wants is genuinely a
   * preference: the pair of rows is real, and dropping them makes the balance stop
   * reconciling against the statement — but keeping them inflates both income and
   * spending by the same amount every time money is shuffled. The import dialog
   * offers the choice; this only says which rows it applies to.
   *
   * Classified by lib/internalTransfers.ts, so import and the later re-check use
   * one implementation and cannot disagree about the same row.
   */
  isInternalToUser: boolean;
  isInternalToFamily: boolean;
  /**
   * Identity for this row WITHIN this file, and the thing that makes
   * re-importing an overlapping statement safe.
   *
   * A Wells Fargo export carries no transaction id, so identity has to be
   * reconstructed from the columns: day, signed amount and memo. Two genuinely
   * distinct transactions can agree on all three — the same coffee twice on the
   * same afternoon — so the trailing ordinal counts how many rows with an
   * identical triple came before this one.
   *
   * That ordinal is computed within the triple, not over the file, which is
   * what makes it stable: a later export covering a wider date range presents
   * the same two coffees in the same relative order, so they fingerprint the
   * same way and are recognized as already imported. Sorting the file
   * differently does not change it either.
   *
   * Not yet the stored key — that needs the account and the owner too. See
   * importKeyFor().
   */
  fingerprint: string;
  /** The row as the file had it, for the preview. */
  raw: RawStatementRow;
}

export interface SkippedStatementRow {
  raw: RawStatementRow;
  reason: string;
}

export interface ParsedStatement {
  rows: ParsedStatementRow[];
  skipped: SkippedStatementRow[];
}

// ─── CSV ────────────────────────────────────────────────────────────────────

/**
 * Splits CSV text into rows of fields.
 *
 * Hand-written rather than pulled in as a dependency because the grammar that
 * actually has to be handled here is small — quoted fields, doubled quotes
 * inside them, commas and newlines inside them — and a statement importer
 * gaining a parsing library is a poor trade for it.
 *
 * Both CRLF and LF are accepted: Wells Fargo writes CRLF, and a file that has
 * been through a spreadsheet or a text editor may not. A stray CR is dropped
 * rather than becoming part of the last field, where it would end up inside a
 * merchant name.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;
  // Strip a UTF-8 BOM: Excel writes one, and left in place it becomes part of
  // the first field, so the first date stops parsing as a date and the whole
  // file is read as though its first row were a header.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    // A trailing newline produces one final empty row; so does a blank line in
    // the middle of a file. Neither is a record.
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        // A doubled quote inside a quoted field is one literal quote.
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") endField();
    else if (ch === "\n") endRow();
    else if (ch === "\r") continue;
    else field += ch;
  }
  // No trailing newline: the last row is still pending.
  if (field !== "" || row.length > 0) endRow();
  return rows;
}

// ─── Dates ──────────────────────────────────────────────────────────────────

const DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/**
 * "MM/DD/YYYY" -> "yyyy-mm-dd", by string surgery only.
 *
 * Deliberately never constructs a Date. `new Date("09/26/2026")` would work
 * and then `toISOString()` on it would shift the day backwards for anyone west
 * of Greenwich — the exact bug lib/monthRange.ts exists to prevent. There is
 * nothing to compute here, so nothing is computed.
 *
 * Returns null for anything that is not that shape, including the "09/26/26"
 * two-digit form: guessing a century is how a 2026 statement quietly lands in
 * 1926.
 */
export function statementDateToIso(value: string): string | null {
  const match = DATE_PATTERN.exec(value.trim());
  if (!match) return null;
  const [, mm, dd, yyyy] = match;
  const month = Number(mm);
  const day = Number(dd);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

// ─── Amounts ────────────────────────────────────────────────────────────────

export interface SignedAmount {
  direction: Direction;
  amountMinor: Minor;
}

/**
 * A signed statement amount -> a direction and an unsigned magnitude.
 *
 * The sign is read and removed BEFORE the string reaches parseAmountToMinor,
 * which rejects negatives on purpose (a sign there would be a second,
 * contradictory way to say "expense" — see lib/money.ts). Accounting
 * parentheses are accepted as negative for the same reason a bank might emit
 * them.
 *
 * Returns null for a zero amount as well as for junk: there is no direction a
 * 0.00 row belongs to, and inventing one would put a meaningless row in
 * somebody's ledger.
 */
export function parseSignedAmount(
  value: string,
  currency: CurrencyCode = DEFAULT_CURRENCY
): SignedAmount | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parenthesized = /^\(.*\)$/.test(trimmed);
  const body = parenthesized ? trimmed.slice(1, -1).trim() : trimmed;
  // U+2212 MINUS SIGN as well as ASCII: it turns up in text pasted out of a
  // spreadsheet, and treating it as junk would reject a real expense.
  const negative = parenthesized || /^[-−]/.test(body);
  const magnitude = body.replace(/^[+\-−]/, "").trim();

  const amountMinor = parseAmountToMinor(magnitude, currency);
  if (amountMinor === null || amountMinor === 0) return null;

  return { direction: negative ? "EXPENSE" : "INCOME", amountMinor };
}

// ─── The memo line ──────────────────────────────────────────────────────────

/**
 * Memo prefixes, and what each one says about how the money moved.
 *
 * Used for `method` only — NOT for pulling the counterparty out, which is done
 * by stripping the machinery rather than by recognizing the prefix. Order
 * matters: "PURCHASE RETURN" also starts with "PURCHASE", and a refund labelled
 * as a purchase loses the only clue that it was one.
 */
const MEMO_PREFIXES: readonly { pattern: RegExp; method: string }[] = [
  { pattern: /^PURCHASE RETURN\b/, method: "Card" },
  { pattern: /^RECURRING PAYMENT\b/, method: "Card" },
  { pattern: /^MONEY TRANSFER\b/, method: "Card" },
  { pattern: /^ONLINE TRANSFER\b/, method: "Transfer" },
  { pattern: /^ZELLE (?:FROM|TO)\b/, method: "Zelle" },
  { pattern: /^(?:NON-WF ATM|NON-WELLS FARGO ATM|ATM)\b/, method: "ATM" },
  { pattern: /^MOBILE DEPOSIT\b/, method: "Deposit" },
  { pattern: /^PURCHASE\b/, method: "Card" },
];

/** Collapses the runs of padding spaces a statement memo is full of. */
function squash(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Pulls a readable counterparty out of a statement memo.
 *
 * WHAT THIS REMOVES, AND WHY IN THIS ORDER. A card memo is the counterparty
 * wrapped in machinery on both sides:
 *
 *   PURCHASE   AUTHORIZED ON 09/25 WHOLEFDS ABC 100 GREENWICH CT  P0001  CARD 0000
 *   \_____ leading ______/       \__ counterparty __/\_ where _/  \_ trailing _/
 *
 * The trailing machinery goes first, from the end inwards, because each strip
 * is anchored at `$` and the one behind it only becomes the last thing once the
 * one in front of it is gone. The leading machinery goes next, keyed on
 * "AUTHORIZED ON <date>" rather than on the prefix list above — that phrase is
 * what every variant of it ends with, and matching it means "NON-WF ATM
 * WITHDRAWAL AUTHORIZED ON ..." needs no entry of its own.
 *
 * WHAT IT DELIBERATELY DOES NOT REMOVE. A prefix that is not followed by that
 * phrase is left alone, because on those rows the prefix IS the information:
 * "NON-WELLS FARGO ATM TRANSACTION FEE" is entirely prefix, and "ONLINE
 * TRANSFER TO ..." says which way the money went. Only a bare leading
 * "PURCHASE" is dropped, which never says anything the amount's sign does not.
 *
 * Every step is anchored, so a memo shape this has never seen comes back
 * squashed but otherwise whole. The failure mode is a verbose merchant, never a
 * missing one — which is why this returns a string rather than null.
 */
export function extractMerchant(description: string): string {
  let text = squash(description);

  // ── Trailing machinery, from the end inwards ──
  // "... CARD 0000" / "... CARD0000" — the card used, on nearly every row.
  text = text.replace(/\s*CARD\s*\d{4}$/i, "");
  // "... ATM ID 00000000"
  text = text.replace(/\s*ATM ID\s*\d+$/i, "");
  // The authorization reference, e.g. "P000000000000001" or "000000000000003".
  text = text.replace(/\s*\b[A-Z]?\d{12,}$/, "");
  // "REF #IB00000001 ON 09/25/26", "REF NUMBER :000000000001", and variants.
  text = text.replace(
    /\s*REF\s*(?:NUMBER|#)\s*:?\s*#?\S+(?:\s+ON\s+\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)?$/i,
    ""
  );
  text = text.replace(/\s+ON\s+\d{1,2}\/\d{1,2}(?:\/\d{2,4})?$/i, "");

  // Where the merchant is: a city and a two-letter state, or a contact number
  // and a state. `(.*)` is greedy on purpose — it takes as much as it can while
  // still leaving a city, so the city is the ONE word before the state rather
  // than every word the character class happens to allow. Lazy matching here
  // ate "EXAMPLE AVE GREENWICH" as though it were all city.
  const located =
    /^(.*)\s+[A-Za-z][A-Za-z.\-']*(?:\s+[A-Za-z][A-Za-z.\-']*)?\s+[A-Z]{2}$/.exec(text) ??
    /^(.*?)\s*[-–—]?\s*(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\s+[A-Z]{2}$/.exec(text);
  // Only when two words of merchant name survive it: a memo that is itself just
  // a place name ("SPRINGFIELD VA") has to keep the place name.
  if (located && squash(located[1]).split(" ").length >= 2) text = squash(located[1]);

  // ── Leading machinery ──
  // Everything up to and including "AUTHORIZED ON 09/25", whatever prefix it
  // followed. Bounded so a merchant that merely contains those words somewhere
  // cannot be swallowed whole.
  text = text.replace(/^.{0,40}?\bAUTHORIZED ON\s+\d{1,2}\/\d{1,2}\s+/i, "");
  // A bare "PURCHASE" with no authorization line behind it.
  text = text.replace(/^PURCHASE(?: RETURN)?\s+(?=\S)/i, "");

  // Separators the strips above left dangling ("ASPEN RIDGE HOA -").
  text = text.replace(/[\s,\-–—:#]+$/, "").trim();

  return text || squash(description) || "Transaction";
}

/** How the money moved, from the memo prefix and the check number. */
export function inferMethod(description: string, checkNumber: string): string | null {
  if (checkNumber.trim()) return "Check";
  const text = squash(description).toUpperCase();
  for (const { pattern, method } of MEMO_PREFIXES) {
    if (pattern.test(text)) return method;
  }
  if (/\bCHECK\b/.test(text)) return "Check";
  if (/\bPAYROLL\b|\bDIRECT DEP\b/.test(text)) return "Deposit";
  return null;
}

/**
 * Wells Fargo's reference for the transaction, pulled out of the memo.
 *
 * Three shapes appear in real exports, and they are tried in this order because
 * the explicit "REF" label is unambiguous while a bare digit run is inferred:
 *
 *   REF #IB00000001            transfers, Zelle
 *   REF NUMBER :000000000001   mobile deposits
 *   P000000000000001           card authorizations — a letter and 15 digits
 *   000000000000003            ATM withdrawals — 15 bare digits
 *
 * The bare-digits form needs a floor of 12 to avoid matching a date-like run or
 * a merchant's own store number ("WEGMANS # 000"), and a merchant genuinely
 * containing a 12-digit number would be misread — the cost of that is a row
 * treated as more identifiable than it is, never a row merged with a different
 * one, because a wrong reference still only ever equals itself.
 *
 * Returns null for a memo with no reference, which is the important case: that
 * is what a PENDING row looks like.
 */
export function extractStatementRef(description: string): string | null {
  const text = squash(description);
  const labelled = /\bREF\s*(?:NUMBER)?\s*#?\s*:?\s*([A-Z0-9]{6,})\b/i.exec(text);
  if (labelled) return labelled[1].toUpperCase();
  const bare = /\b([A-Z]?\d{12,})\b/.exec(text);
  if (bare) return bare[1].toUpperCase();
  return null;
}

// ─── Categories ─────────────────────────────────────────────────────────────

/**
 * Keyword -> category guesses, applied to the extracted merchant.
 *
 * DELIBERATELY SHORT, and it should stay short. A guessed category is only
 * worth having while it is right nearly every time: the breakdown is what the
 * household reasons about, and a confidently mis-filed row is worse than an
 * uncategorized one because nobody goes looking for it. Anything that does not
 * match here is left uncategorized on purpose, for a person to file — the
 * import dialog can turn this off entirely, and every guess is visible in its
 * preview before anything is written.
 *
 * Direction is part of the match, not incidental to it: "ONLINE TRANSFER"
 * money arriving and money leaving are two different categories, and a refund
 * is income against a spending merchant.
 */
const CATEGORY_RULES: readonly { pattern: RegExp; direction?: Direction; category: string }[] = [
  // Income
  { pattern: /\bPAYROLL\b|\bDIRECT DEP\b|\bSALARY\b/i, direction: "INCOME", category: "Salary" },
  { pattern: /\bINTEREST (?:PAYMENT|PAID)\b/i, direction: "INCOME", category: "Interest" },
  { pattern: /\bMOBILE DEPOSIT\b|\bDEPOSIT\b/i, direction: "INCOME", category: "Deposits" },
  { pattern: /\bRETURN\b|\bREFUND\b/i, direction: "INCOME", category: "Refunds" },
  { pattern: /^ZELLE FROM\b/i, direction: "INCOME", category: "Transfers In" },
  { pattern: /^ONLINE TRANSFER\b/i, direction: "INCOME", category: "Transfers In" },
  // Expenses
  { pattern: /^ONLINE TRANSFER\b/i, direction: "EXPENSE", category: "Transfers Out" },
  { pattern: /^ZELLE TO\b/i, direction: "EXPENSE", category: "Transfers Out" },
  { pattern: /\bFEE\b|\bSERVICE CHARGE\b|\bOVERDRAFT\b/i, direction: "EXPENSE", category: "Bank Fees" },
  { pattern: /\bATM\b/i, direction: "EXPENSE", category: "Cash" },
  { pattern: /\bRENT\b|\bBILT RENT\b|\bMORTGAGE\b/i, direction: "EXPENSE", category: "Rent" },
  {
    pattern: /\bWHOLEFDS\b|\bWHOLE FOODS\b|\bWEGMANS\b|\bSAFEWAY\b|\bTRADER JOE\b|\bALDI\b|\bKROGER\b|\bHARRIS TEETER\b|\bPUBLIX\b|\bGIANT\b/i,
    direction: "EXPENSE",
    category: "Groceries",
  },
  {
    pattern: /\bSUNOCO\b|\bSHELL OIL\b|\bEXXON\b|\bCHEVRON\b|\bBP#\b|\bWAWA\b|\bSHEETZ\b/i,
    direction: "EXPENSE",
    category: "Fuel",
  },
  { pattern: /\bSELF STORAGE\b|\bSTORAGE\b/i, direction: "EXPENSE", category: "Storage" },
  { pattern: /\bSTREAMING\b|\bNETFLIX\b|\bSPOTIFY\b|\bHULU\b/i, direction: "EXPENSE", category: "Subscriptions" },
];

/**
 * `memo` is the raw statement line, matched alongside the extracted merchant.
 *
 * Both, not one: extractMerchant() removes the machinery, and some of what it
 * removes is exactly the evidence a rule wants — "PURCHASE RETURN AUTHORIZED ON
 * ..." becomes plain "EXAMPLE OUTFITTERS", so a refund matched on the merchant
 * alone is indistinguishable from a purchase there. Matching the merchant too
 * (rather than only the memo) is what keeps a rule like /\bRENT\b/ off a memo
 * whose reference number happens to spell it.
 */
export function guessCategory(
  merchant: string,
  direction: Direction,
  memo: string = merchant
): string | null {
  for (const rule of CATEGORY_RULES) {
    if (rule.direction && rule.direction !== direction) continue;
    if (rule.pattern.test(merchant) || rule.pattern.test(memo)) return rule.category;
  }
  return null;
}

/** Every category name guessCategory can return, for the dialog's disclosure. */
export const GUESSABLE_CATEGORIES: readonly string[] = Array.from(
  new Set(CATEGORY_RULES.map((r) => r.category))
).sort();

// ─── The whole file ─────────────────────────────────────────────────────────

export interface ParseStatementOptions {
  /** Which currency the file's amounts are in. Only affects minor-unit scale. */
  currency?: CurrencyCode;
  /** Whether to guess categories. Off leaves every row uncategorized. */
  categorize?: boolean;
  /**
   * Names of everybody in the household, for spotting a transfer to one of them.
   *
   * Empty means no row can be internal-to-family, which is the correct answer
   * rather than a degraded one: with no roster there is nobody for the money to
   * have gone to. See lib/internalTransfers.ts.
   */
  householdNames?: readonly string[];
}

/**
 * Whether a row of fields looks like the file's header rather than a record.
 *
 * Decided by the date column alone: a header's first cell is "DATE", and a
 * record's is a date. Wells Fargo's own export has no header at all, so this
 * cannot simply skip the first row.
 */
function looksLikeHeader(fields: string[]): boolean {
  return statementDateToIso(fields[0] ?? "") === null;
}

export function parseWellsFargoCsv(
  text: string,
  { currency = DEFAULT_CURRENCY, categorize = true, householdNames = [] }: ParseStatementOptions = {}
): ParsedStatement {
  // Built once for the file rather than per row.
  const householdTokens = nameTokens(householdNames);
  const rows: ParsedStatementRow[] = [];
  const skipped: SkippedStatementRow[] = [];
  // How many rows with an identical (day, signed amount, memo) have been seen,
  // which becomes the trailing ordinal of the fingerprint. See the note on
  // ParsedStatementRow.fingerprint for why this is counted per triple.
  const seen = new Map<string, number>();

  const records = parseCsv(text);

  records.forEach((fields, index) => {
    const raw: RawStatementRow = {
      line: index + 1,
      date: fields[0] ?? "",
      description: fields[1] ?? "",
      amount: fields[2] ?? "",
      checkNumber: fields[3] ?? "",
      status: fields[4] ?? "",
    };

    if (index === 0 && looksLikeHeader(fields)) return;

    const occurredOn = statementDateToIso(raw.date);
    if (!occurredOn) {
      skipped.push({ raw, reason: `Unreadable date "${raw.date}" — expected MM/DD/YYYY` });
      return;
    }

    const signed = parseSignedAmount(raw.amount, currency);
    if (!signed) {
      skipped.push({ raw, reason: `Unreadable or zero amount "${raw.amount}"` });
      return;
    }

    const merchant = extractMerchant(raw.description);
    const normalizedMemo = squash(raw.description).toUpperCase();
    // The signed amount, not the magnitude: a -6.45 and a +6.45 on the same day
    // against the same merchant are a purchase and its refund, not one row
    // twice.
    const signedMinor = signed.direction === "EXPENSE" ? -signed.amountMinor : signed.amountMinor;
    const triple = `${occurredOn}|${signedMinor}|${normalizedMemo}`;
    const ordinal = seen.get(triple) ?? 0;
    seen.set(triple, ordinal + 1);

    rows.push({
      occurredOn,
      amountMinor: signed.amountMinor,
      direction: signed.direction,
      merchant,
      method: inferMethod(raw.description, raw.checkNumber),
      statementRef: extractStatementRef(raw.description),
      categoryName: categorize
        ? guessCategory(merchant, signed.direction, squash(raw.description))
        : null,
      ...classifyInternalTransfer(
        { merchant, method: inferMethod(raw.description, raw.checkNumber), memo: raw.description },
        householdTokens
      ),
      fingerprint: `${triple}|${ordinal}`,
      raw,
    });
  });

  return { rows, skipped };
}

/**
 * The value stored in Transaction.importKey.
 *
 * Scoped by the owning account, so two people in one household importing their
 * own statements never collide, and by an account label, so the same amount on
 * the same day in a checking and a savings export stays two rows.
 *
 * The account label is the file's own name by default, which has one
 * consequence worth saying out loud: re-uploading the same statement under a
 * different filename imports it again. The dialog therefore shows the label
 * and lets it be edited, so a second export of the same account can be told
 * it is the same account.
 *
 * Plain text rather than a hash. It is a uniqueness key, not a secret — it
 * contains nothing the row does not already store — and being able to read it
 * out of the database is worth more here than being able to keep it short.
 * The memo is capped so a pathological one cannot outgrow the unique index.
 */
export function importKeyFor(userId: string, accountLabel: string, fingerprint: string): string {
  const label = squash(accountLabel).toUpperCase() || "STATEMENT";
  return `${userId}|${label}|${fingerprint}`.slice(0, 1000);
}

/**
 * Fingerprint of a whole uploaded file, for StatementImport.contentKey.
 *
 * A digest of the CONTENTS, scoped to the uploader. Not of the filename: Wells
 * Fargo names every export the same thing, and renaming one does not make it a
 * different statement — keying on the name would call two different months the
 * same upload and two copies of one month different ones, which is wrong in both
 * directions at once.
 *
 * Normalizes line endings first, so the same statement saved through a
 * spreadsheet (which may rewrite CRLF as LF, or add a trailing newline) is still
 * recognized as the same statement. Nothing else is normalized: a file whose
 * rows have been edited IS a different file, and should be treated as one.
 *
 * SHA-256 via Web Crypto, which is why this is async. A digest rather than the
 * text itself because the text is up to megabytes and this is an indexed column.
 * It is not a security boundary — the per-line importKey and the @unique
 * constraints behind both are what actually prevent double-counting — so
 * collision resistance is incidental; what is wanted is a short stable id.
 */
export async function statementContentKey(userId: string, text: string): Promise<string> {
  const normalized = text.replace(/\r\n/g, "\n").trimEnd();
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${userId}|${hex}`;
}

/** A filename to an account label — "Checking (1).csv" -> "Checking". */
export function accountLabelFromFilename(filename: string): string {
  const stem = filename.replace(/\.[A-Za-z0-9]+$/, "").replace(/\s*\(\d+\)\s*$/, "");
  return squash(stem) || "Statement";
}
