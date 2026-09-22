import { describe, expect, it } from "vitest";
import {
  EmulatorMisconfigurationError,
  isLoopbackHost,
  resolveEmulatorUse,
} from "./emulatorGuard";

const v = "FIREBASE_AUTH_EMULATOR_HOST";

describe("resolveEmulatorUse", () => {
  it("is off when the variable is not set", () => {
    expect(resolveEmulatorUse({ host: undefined, nodeEnv: "production", varName: v })).toEqual({
      use: false,
      reason: "not-configured",
    });
    expect(resolveEmulatorUse({ host: "", nodeEnv: "development", varName: v })).toEqual({
      use: false,
      reason: "not-configured",
    });
  });

  it("allows a loopback emulator in development", () => {
    expect(resolveEmulatorUse({ host: "127.0.0.1:9199", nodeEnv: "development", varName: v })).toEqual({
      use: true,
      host: "127.0.0.1:9199",
    });
  });

  // THE PRODUCTION INCIDENT THIS GUARDS.
  //
  // firebase-admin treats FIREBASE_AUTH_EMULATOR_HOST being set as "verify
  // tokens with algorithms: ['none']". In a deployed environment that both
  // rejects every real Google-signed token ("Firebase ID token has invalid
  // signature") and accepts any unsigned token bearing any `sub` — an
  // authentication bypass. Failing closed is the only safe response.
  it("refuses in a production build", () => {
    expect(() =>
      resolveEmulatorUse({ host: "127.0.0.1:9199", nodeEnv: "production", varName: v })
    ).toThrow(EmulatorMisconfigurationError);
  });

  it("names the variable and the remedy when it refuses", () => {
    const err = (() => {
      try {
        resolveEmulatorUse({ host: "127.0.0.1:9199", nodeEnv: "production", varName: v });
      } catch (e) {
        return e as Error;
      }
    })();

    // Whoever hits this in a deploy log needs to know which variable to
    // remove without going and reading the source.
    expect(err?.message).toContain(v);
    expect(err?.message).toMatch(/signature verification/i);
    expect(err?.message).toMatch(/\.env\.local/);
  });

  // A "remote emulator" is the same bypass wearing a different hat: a host
  // you do not control, trusted to say no signature is needed.
  it("refuses a non-loopback host even in development", () => {
    expect(() =>
      resolveEmulatorUse({ host: "auth.example.com:9199", nodeEnv: "development", varName: v })
    ).toThrow(EmulatorMisconfigurationError);
    expect(() =>
      resolveEmulatorUse({ host: "10.0.0.5:9199", nodeEnv: "development", varName: v })
    ).toThrow(EmulatorMisconfigurationError);
  });
});

describe("isLoopbackHost", () => {
  it("accepts the loopback forms the emulators actually use", () => {
    for (const host of [
      "127.0.0.1",
      "127.0.0.1:9199",
      "localhost:9499",
      "http://127.0.0.1:9199",
      "[::1]:9199",
      "0.0.0.0:9199",
    ]) {
      expect(isLoopbackHost(host), host).toBe(true);
    }
  });

  it("rejects anything routable", () => {
    for (const host of [
      "auth.example.com",
      "auth.example.com:9199",
      "10.0.0.5:9199",
      "192.168.1.166:9199",
      "https://evil.example.com:9199",
      // Lookalikes: a hostname that merely starts with the loopback text
      // must not pass.
      "127.0.0.1.evil.com:9199",
      "localhost.evil.com",
    ]) {
      expect(isLoopbackHost(host), host).toBe(false);
    }
  });
});
