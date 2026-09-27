import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  accountLabelFromFilename,
  extractMerchant,
  guessCategory,
  importKeyFor,
  inferMethod,
  isInternalTransfer,
  parseCsv,
  parseSignedAmount,
  parseWellsFargoCsv,
  statementContentKey,
  statementDateToIso,
} from "./wellsFargoCsv";

// The fixtures are the committed FAKE statements in transaction_data.example/.
// Real exports land in transaction_data/, which is gitignored — so these tests
// are the only thing that keeps the mapping honest in CI, and the fake files
// deliberately carry one of every memo shape the real ones do.
const exampleDir = path.resolve(__dirname, "..", "transaction_data.example");
const checking = readFileSync(path.join(exampleDir, "Checking.csv"), "utf8");
const savings = readFileSync(path.join(exampleDir, "Savings.csv"), "utf8");

describe("parseCsv", () => {
  it("keeps commas and newlines inside quoted fields", () => {
    expect(parseCsv('"a,b","c\nd"')).toEqual([["a,b", "c\nd"]]);
  });

  it("reads a doubled quote as one literal quote", () => {
    expect(parseCsv('"say ""hi""",2')).toEqual([['say "hi"', "2"]]);
  });

  it("accepts CRLF as well as LF, and drops the trailing blank row", () => {
    expect(parseCsv('"a","b"\r\n"c","d"\r\n')).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("strips a UTF-8 BOM, so the first date still parses as a date", () => {
    const rows = parseCsv('﻿"09/26/2026","x","-1.00","",""');
    expect(rows[0][0]).toBe("09/26/2026");
  });
});

describe("statementDateToIso", () => {
  it("converts MM/DD/YYYY without going near a Date", () => {
    expect(statementDateToIso("09/26/2026")).toBe("2026-09-26");
    expect(statementDateToIso("1/2/2026")).toBe("2026-01-02");
  });

  it("rejects the two-digit year form rather than guessing a century", () => {
    expect(statementDateToIso("09/26/26")).toBeNull();
  });

  it("rejects junk and out-of-range parts", () => {
    expect(statementDateToIso("2026-09-26")).toBeNull();
    expect(statementDateToIso("13/01/2026")).toBeNull();
    expect(statementDateToIso("DATE")).toBeNull();
  });
});

describe("parseSignedAmount", () => {
  it("turns the sign into a direction and keeps the magnitude unsigned", () => {
    expect(parseSignedAmount("-1342.88")).toEqual({ direction: "EXPENSE", amountMinor: 134288 });
    expect(parseSignedAmount("28416.67")).toEqual({ direction: "INCOME", amountMinor: 2841667 });
  });

  it("stays exact where a float would drift", () => {
    // 12.34 * 100 is 1233.9999999999998. This path never multiplies a float.
    expect(parseSignedAmount("-0.10")?.amountMinor).toBe(10);
    expect(parseSignedAmount("-12.34")?.amountMinor).toBe(1234);
  });

  it("accepts thousands separators and accounting parentheses", () => {
    expect(parseSignedAmount("28,416.67")).toEqual({ direction: "INCOME", amountMinor: 2841667 });
    expect(parseSignedAmount("(1,600.00)")).toEqual({ direction: "EXPENSE", amountMinor: 160000 });
    expect(parseSignedAmount("−5.00")).toEqual({ direction: "EXPENSE", amountMinor: 500 });
  });

  it("refuses a zero row, which belongs to no direction", () => {
    expect(parseSignedAmount("0.00")).toBeNull();
    expect(parseSignedAmount("-0.00")).toBeNull();
    expect(parseSignedAmount("")).toBeNull();
    expect(parseSignedAmount("AMOUNT")).toBeNull();
  });

  it("scales to the currency rather than assuming cents", () => {
    // JPY has no minor unit, so 500 yen is 500 minor units, not 50000.
    expect(parseSignedAmount("-500", "JPY")).toEqual({ direction: "EXPENSE", amountMinor: 500 });
  });
});

describe("extractMerchant", () => {
  it("pulls the counterparty out of a card authorization", () => {
    expect(
      extractMerchant(
        "PURCHASE                                AUTHORIZED ON   09/25 WHOLEFDS ABC 100 1 EXAMPLE AVE GREENWICH     CT  P000000000000001   CARD 0000"
      )
    ).toBe("WHOLEFDS ABC 100 1 EXAMPLE AVE");
  });

  it("keeps a whole memo that is nothing but a prefix", () => {
    expect(extractMerchant("NON-WELLS FARGO ATM TRANSACTION FEE")).toBe(
      "NON-WELLS FARGO ATM TRANSACTION FEE"
    );
  });

  it("drops the reference and the trailing date from a transfer, keeping the prefix", () => {
    // "ONLINE TRANSFER TO" is retained on purpose: on a transfer the prefix is
    // the information — which way the money went — not machinery.
    expect(
      extractMerchant(
        "ONLINE TRANSFER TO STERLING A PLATINUM SAVINGS XXXXXX0000 REF #IB00000001 ON 09/25/26"
      )
    ).toBe("ONLINE TRANSFER TO STERLING A PLATINUM SAVINGS XXXXXX0000");
  });

  it("drops the ATM id and location reference", () => {
    expect(
      extractMerchant(
        "NON-WF ATM WITHDRAWAL          AUTHORIZED ON   09/22 500 Example Blvd          GREENWICH     CT  000000000000003   ATM ID 00000000 CARD 0000"
      )
    ).toBe("500 Example Blvd");
  });

  it("strips trailing separators the strips above leave behind", () => {
    expect(extractMerchant("PURCHASE ASPEN RIDGE HOA -  555-0002222   CO CARD0000")).toBe(
      "ASPEN RIDGE HOA"
    );
  });

  it("never returns empty", () => {
    expect(extractMerchant("   ")).toBe("Transaction");
  });
});

describe("inferMethod", () => {
  it("reads the memo prefix", () => {
    expect(inferMethod("PURCHASE AUTHORIZED ON 09/25 WEGMANS # 000", "")).toBe("Card");
    expect(inferMethod("ONLINE TRANSFER TO SAVINGS", "")).toBe("Transfer");
    expect(inferMethod("ZELLE TO VANCE HOUSEKEEPING ON 09/17", "")).toBe("Zelle");
    expect(inferMethod("NON-WF ATM WITHDRAWAL", "")).toBe("ATM");
    expect(inferMethod("MOBILE DEPOSIT : REF NUMBER :1", "")).toBe("Deposit");
    expect(inferMethod("000000 MERIDIAN CAPITAL PAYROLL", "")).toBe("Deposit");
  });

  it("lets a check number win, since it is the fact and the prefix is a guess", () => {
    expect(inferMethod("CHECK", "1042")).toBe("Check");
  });

  it("returns null rather than guessing at an unrecognized memo", () => {
    expect(inferMethod("INTEREST PAYMENT", "")).toBeNull();
  });
});

describe("isInternalTransfer", () => {
  it("matches Wells Fargo's own between-my-accounts prefix", () => {
    expect(isInternalTransfer("ONLINE TRANSFER FROM STERLING A PLATINUM SAVINGS")).toBe(true);
  });

  it("does not match money that genuinely leaves or enters the household", () => {
    expect(isInternalTransfer("ZELLE TO VANCE HOUSEKEEPING ON 09/17")).toBe(false);
    expect(isInternalTransfer("MONEY TRANSFER AUTHORIZED ON 09/13 EXAMPLE MARKETS")).toBe(false);
    expect(isInternalTransfer("000000 MERIDIAN CAPITAL PAYROLL")).toBe(false);
  });
});

describe("guessCategory", () => {
  it("branches on direction, not only on the merchant", () => {
    const merchant = "ONLINE TRANSFER TO STERLING A PLATINUM SAVINGS";
    expect(guessCategory(merchant, "INCOME")).toBe("Transfers In");
    expect(guessCategory(merchant, "EXPENSE")).toBe("Transfers Out");
  });

  it("files a refund as income, from evidence only the raw memo still has", () => {
    // extractMerchant() strips "PURCHASE RETURN AUTHORIZED ON 09/17", so the
    // merchant alone cannot tell a refund from a purchase.
    expect(guessCategory("EXAMPLE OUTFITTERS", "INCOME")).toBeNull();
    expect(
      guessCategory(
        "EXAMPLE OUTFITTERS",
        "INCOME",
        "PURCHASE RETURN AUTHORIZED ON 09/17 EXAMPLE OUTFITTERS GREENWICH CT"
      )
    ).toBe("Refunds");
  });

  it("prefers the fee over the cash withdrawal on an ATM fee row", () => {
    expect(guessCategory("NON-WELLS FARGO ATM TRANSACTION FEE", "EXPENSE")).toBe("Bank Fees");
    expect(guessCategory("500 Example Blvd", "EXPENSE", "NON-WF ATM WITHDRAWAL")).toBe("Cash");
  });

  it("leaves anything it is not confident about uncategorized", () => {
    expect(guessCategory("LE BERNARDIN", "EXPENSE")).toBeNull();
  });
});

describe("parseWellsFargoCsv", () => {
  const parsed = parseWellsFargoCsv(checking);

  it("skips the header row and keeps every record", () => {
    // 24 lines in the fixture, the first of them the header.
    expect(parsed.rows).toHaveLength(23);
    expect(parsed.skipped).toHaveLength(0);
  });

  it("reads a file with no header at all, as Wells Fargo exports it", () => {
    const headerless = checking.split("\n").slice(1).join("\n");
    expect(parseWellsFargoCsv(headerless).rows).toHaveLength(23);
  });

  it("splits the file by sign into income and expenses", () => {
    const income = parsed.rows.filter((r) => r.direction === "INCOME");
    const expenses = parsed.rows.filter((r) => r.direction === "EXPENSE");
    expect(income).toHaveLength(7);
    expect(expenses).toHaveLength(16);
    expect(income.every((r) => r.amountMinor > 0)).toBe(true);
    expect(expenses.every((r) => r.amountMinor > 0)).toBe(true);
  });

  it("maps a payroll deposit end to end", () => {
    const payroll = parsed.rows.find((r) => r.merchant.includes("MERIDIAN CAPITAL"));
    expect(payroll).toMatchObject({
      occurredOn: "2026-09-15",
      direction: "INCOME",
      amountMinor: 2841667,
      method: "Deposit",
      categoryName: "Salary",
      isInternalTransfer: false,
    });
  });

  it("maps a check by its check number", () => {
    const check = parsed.rows.find((r) => r.raw.checkNumber === "1042");
    expect(check).toMatchObject({ direction: "EXPENSE", amountMinor: 1250000, method: "Check" });
  });

  it("flags the internal transfers without dropping them", () => {
    const internal = parsed.rows.filter((r) => r.isInternalTransfer);
    expect(internal).toHaveLength(3);
    // Still present, in both directions — the dialog decides, not the parser.
    expect(new Set(internal.map((r) => r.direction))).toEqual(new Set(["INCOME", "EXPENSE"]));
  });

  it("leaves rows uncategorized when asked not to guess", () => {
    const plain = parseWellsFargoCsv(checking, { categorize: false });
    expect(plain.rows.every((r) => r.categoryName === null)).toBe(true);
  });

  it("reports an unreadable row instead of dropping it", () => {
    const broken = '"09/26/2026","Good","-1.00","","Posted"\n"nope","Bad","-2.00","","Posted"\n';
    const result = parseWellsFargoCsv(broken);
    expect(result.rows).toHaveLength(1);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].reason).toContain("Unreadable date");
    expect(result.skipped[0].raw.line).toBe(2);
  });
});

describe("fingerprints", () => {
  const parsed = parseWellsFargoCsv(checking);

  it("gives every row in a file a distinct fingerprint", () => {
    const keys = new Set(parsed.rows.map((r) => r.fingerprint));
    expect(keys.size).toBe(parsed.rows.length);
  });

  it("separates two genuinely identical transactions on the same day", () => {
    // The fixture has the same coffee twice on 08/31, same amount, same memo.
    const coffee = parsed.rows.filter((r) => r.merchant.includes("EXAMPLE COFFEE"));
    expect(coffee).toHaveLength(2);
    expect(coffee[0].fingerprint).not.toBe(coffee[1].fingerprint);
    expect(coffee.map((r) => r.fingerprint.split("|").at(-1))).toEqual(["0", "1"]);
  });

  it("is stable across a later, wider export — which is what makes re-import safe", () => {
    // Everything but the header, as a statement that merely covers less time.
    const lines = checking.trim().split("\n");
    const narrower = [lines[0], ...lines.slice(5)].join("\n");
    const before = new Set(parseWellsFargoCsv(narrower).rows.map((r) => r.fingerprint));
    const after = parseWellsFargoCsv(checking).rows.map((r) => r.fingerprint);
    // Every row of the narrower export fingerprints identically in the wider
    // one, so the second import recognizes all of them as already present.
    expect([...before].every((f) => after.includes(f))).toBe(true);
  });

  it("separates a purchase from its refund, which differ only in sign", () => {
    const sameDay = parseWellsFargoCsv(
      '"09/18/2026","EXAMPLE OUTFITTERS","-1275.00","","Posted"\n' +
        '"09/18/2026","EXAMPLE OUTFITTERS","1275.00","","Posted"\n'
    );
    expect(sameDay.rows[0].fingerprint).not.toBe(sameDay.rows[1].fingerprint);
  });
});

describe("importKeyFor", () => {
  const [row] = parseWellsFargoCsv(checking).rows;

  it("is stable for the same owner, account and row", () => {
    expect(importKeyFor("user-1", "Checking", row.fingerprint)).toBe(
      importKeyFor("user-1", "checking", row.fingerprint)
    );
  });

  it("separates two accounts and two owners", () => {
    expect(importKeyFor("user-1", "Checking", row.fingerprint)).not.toBe(
      importKeyFor("user-1", "Savings", row.fingerprint)
    );
    expect(importKeyFor("user-1", "Checking", row.fingerprint)).not.toBe(
      importKeyFor("user-2", "Checking", row.fingerprint)
    );
  });

  it("keeps a pathological memo inside the unique index's reach", () => {
    const huge = importKeyFor("user-1", "Checking", "x".repeat(5000));
    expect(huge.length).toBeLessThanOrEqual(1000);
  });
});

describe("accountLabelFromFilename", () => {
  it("strips the extension and a browser's duplicate suffix", () => {
    expect(accountLabelFromFilename("Checking.csv")).toBe("Checking");
    expect(accountLabelFromFilename("Checking (1).csv")).toBe("Checking");
    expect(accountLabelFromFilename("")).toBe("Statement");
  });
});

describe("the savings fixture", () => {
  it("reads its interest payments as income and its transfers as internal", () => {
    const parsed = parseWellsFargoCsv(savings);
    expect(parsed.rows).toHaveLength(5);
    const interest = parsed.rows.filter((r) => r.categoryName === "Interest");
    expect(interest).toHaveLength(2);
    expect(interest.every((r) => r.direction === "INCOME")).toBe(true);
    expect(parsed.rows.filter((r) => r.isInternalTransfer)).toHaveLength(3);
  });
});

describe("statementContentKey", () => {
  it("is stable for the same file and the same uploader", async () => {
    expect(await statementContentKey("user-1", checking)).toBe(
      await statementContentKey("user-1", checking)
    );
  });

  it("ignores line endings and a trailing newline, which editors change freely", async () => {
    const crlf = checking.replace(/\n/g, "\r\n");
    expect(await statementContentKey("user-1", crlf)).toBe(
      await statementContentKey("user-1", checking + "\n")
    );
  });

  it("separates two files, and two uploaders of one file", async () => {
    expect(await statementContentKey("user-1", checking)).not.toBe(
      await statementContentKey("user-1", savings)
    );
    expect(await statementContentKey("user-1", checking)).not.toBe(
      await statementContentKey("user-2", checking)
    );
  });

  it("changes when a row is edited — an edited statement is a different file", async () => {
    const edited = checking.replace("-1284.50", "-1284.51");
    expect(await statementContentKey("user-1", edited)).not.toBe(
      await statementContentKey("user-1", checking)
    );
  });
});
