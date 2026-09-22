import { describe, expect, it } from "vitest";
import { isPopupDismissal } from "./authErrors";

describe("isPopupDismissal", () => {
  it("recognises the ways a person can dismiss the popup", () => {
    expect(isPopupDismissal({ code: "auth/popup-closed-by-user" })).toBe(true);
    expect(isPopupDismissal({ code: "auth/cancelled-popup-request" })).toBe(true);
    expect(isPopupDismissal({ code: "auth/user-cancelled" })).toBe(true);
  });

  // The distinction that matters: a dismissal is silent, everything else is
  // reported. Treating a real fault as a dismissal is how the original bug
  // stayed invisible, so these must not be swallowed.
  it("does not swallow real failures", () => {
    expect(isPopupDismissal({ code: "auth/network-request-failed" })).toBe(false);
    expect(isPopupDismissal({ code: "auth/internal-error" })).toBe(false);
    expect(isPopupDismissal(new Error("UserSyncError"))).toBe(false);
  });

  it("is safe on values that are not error objects", () => {
    expect(isPopupDismissal(null)).toBe(false);
    expect(isPopupDismissal(undefined)).toBe(false);
    expect(isPopupDismissal("auth/popup-closed-by-user")).toBe(false);
    expect(isPopupDismissal({})).toBe(false);
    expect(isPopupDismissal({ code: 42 })).toBe(false);
  });
});
