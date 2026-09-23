import { describe, expect, it } from "vitest";
import {
  INVITE_CODE_LENGTH,
  formatInviteCode,
  generateInviteCode,
  normalizeInviteCode,
} from "./inviteCode";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

describe("generateInviteCode", () => {
  it("produces a code of the declared length", () => {
    expect(generateInviteCode()).toHaveLength(INVITE_CODE_LENGTH);
  });

  // The confusable characters are excluded at the source, not filtered at the
  // point of display — a code containing O or I would be normalized into a
  // *different* code by normalizeInviteCode, and would then never resolve.
  it("never emits a character outside the alphabet", () => {
    for (let i = 0; i < 500; i++) {
      for (const char of generateInviteCode()) {
        expect(ALPHABET).toContain(char);
      }
    }
  });

  it("never emits I, L, O or U", () => {
    const codes = Array.from({ length: 500 }, generateInviteCode).join("");
    expect(codes).not.toMatch(/[ILOU]/);
  });

  // Not a randomness test — that belongs to the CSPRNG. This catches the
  // specific, silent failure of a generator that has been changed to
  // something constant or nearly so.
  it("does not repeat itself", () => {
    const codes = new Set(Array.from({ length: 1000 }, generateInviteCode));
    expect(codes.size).toBe(1000);
  });

  it("round-trips through normalization unchanged", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateInviteCode();
      expect(normalizeInviteCode(code)).toBe(code);
      expect(normalizeInviteCode(formatInviteCode(code))).toBe(code);
    }
  });
});

describe("normalizeInviteCode", () => {
  it("accepts a canonical code", () => {
    expect(normalizeInviteCode("HTBQ4F91XZ")).toBe("HTBQ4F91XZ");
  });

  it("uppercases", () => {
    expect(normalizeInviteCode("htbq4f91xz")).toBe("HTBQ4F91XZ");
  });

  it("strips the display hyphen and stray whitespace", () => {
    expect(normalizeInviteCode("HTBQ4-F91XZ")).toBe("HTBQ4F91XZ");
    expect(normalizeInviteCode("  HTBQ4 F91XZ  ")).toBe("HTBQ4F91XZ");
    expect(normalizeInviteCode("HTBQ4 - F91XZ")).toBe("HTBQ4F91XZ");
  });

  // Somebody reading a code aloud says "oh" for 0 and "eye" for 1. Folding
  // means they land on the right household instead of on an error they have
  // no way to diagnose.
  it("folds the confusable characters onto their digits", () => {
    expect(normalizeInviteCode("OTBQ4F9IXZ")).toBe("0TBQ4F91XZ");
    expect(normalizeInviteCode("LTBQ4F91XZ")).toBe("1TBQ4F91XZ");
  });

  it("rejects a code of the wrong length", () => {
    expect(normalizeInviteCode("HTBQ4F91X")).toBeNull();
    expect(normalizeInviteCode("HTBQ4F91XZZ")).toBeNull();
    expect(normalizeInviteCode("")).toBeNull();
  });

  // U is the one excluded letter with no digit to fold onto, so a code
  // containing it was never one this app generated.
  it("rejects U and other characters outside the alphabet", () => {
    expect(normalizeInviteCode("UTBQ4F91XZ")).toBeNull();
    expect(normalizeInviteCode("HTBQ4F91X!")).toBeNull();
    expect(normalizeInviteCode("HTBQ4F91XÅ")).toBeNull();
  });

  it("rejects nullish input", () => {
    expect(normalizeInviteCode(null)).toBeNull();
    expect(normalizeInviteCode(undefined)).toBeNull();
  });
});

describe("formatInviteCode", () => {
  it("splits the code in half with a hyphen", () => {
    expect(formatInviteCode("HTBQ4F91XZ")).toBe("HTBQ4-F91XZ");
  });

  it("is idempotent over an already-formatted code", () => {
    expect(formatInviteCode("HTBQ4-F91XZ")).toBe("HTBQ4-F91XZ");
  });
});
