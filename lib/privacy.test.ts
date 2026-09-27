import { describe, expect, it } from "vitest";
import { currencySymbolOf, MASKED_AMOUNT, maskedMoney } from "./privacy";

describe("the mask", () => {
  it("is the same length whatever the amount", () => {
    // A mask that tracked the digit count would leak the magnitude, which is
    // most of what is worth hiding.
    expect(maskedMoney("$")).toBe(maskedMoney("$"));
    expect(MASKED_AMOUNT).toHaveLength(4);
  });

  it("uses the bullet a password field uses, so it reads as hidden", () => {
    expect(MASKED_AMOUNT).toBe("••••");
    expect(MASKED_AMOUNT).not.toContain("*");
  });

  it("keeps the currency's shape when given a symbol", () => {
    expect(maskedMoney("$")).toBe("$••••");
  });

  it("works with no symbol at all", () => {
    expect(maskedMoney()).toBe(MASKED_AMOUNT);
  });

  it("never contains a digit", () => {
    for (const code of ["USD", "EUR", "GBP", "JPY"]) {
      expect(maskedMoney(currencySymbolOf(code))).not.toMatch(/\d/);
    }
  });
});

describe("currencySymbolOf", () => {
  it("strips the number, leaving the symbol", () => {
    expect(currencySymbolOf("USD")).toBe("$");
    expect(currencySymbolOf("JPY")).toBe("¥");
  });

  it("degrades to an empty string rather than throwing on junk", () => {
    expect(currencySymbolOf("NOT_A_CODE")).toBe("");
  });
});
