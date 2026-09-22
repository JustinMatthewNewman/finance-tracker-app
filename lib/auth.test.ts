import { afterEach, describe, expect, it, vi } from "vitest";

// lib/auth imports ./firebase for its side effect of creating the client app,
// which is irrelevant here and would try to start the real SDK. Stubbed so
// this stays a unit test of the sync logic.
vi.mock("./firebase", () => ({ auth: {} }));

import { syncUserRecord, UserSyncError } from "./auth";

// Only the one method syncUserRecord actually uses.
const fakeUser = { getIdToken: async () => "fake-id-token" } as never;

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const spy = vi.fn(async () => response as Response);
  vi.stubGlobal("fetch", spy);
  return spy;
}

describe("syncUserRecord", () => {
  it("resolves when the sync succeeds", async () => {
    stubFetch({ ok: true, status: 200, json: async () => ({ success: true, created: true }) });
    await expect(syncUserRecord(fakeUser)).resolves.toBeUndefined();
  });

  // THE REGRESSION THIS FILE EXISTS FOR.
  //
  // The original bug was a bare `await fetch(...)` with the response thrown
  // away, which made a 500 look exactly like success: the caller carried on
  // and routed the person into the app with no database row behind them, and
  // nothing on screen said otherwise. If this test ever fails, that bug is
  // back.
  it("throws when the server reports a failure", async () => {
    stubFetch({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal Server Error", details: "ECONNREFUSED" }),
    });

    await expect(syncUserRecord(fakeUser)).rejects.toBeInstanceOf(UserSyncError);
  });

  it("carries the status and server detail for logging", async () => {
    stubFetch({
      ok: false,
      status: 503,
      json: async () => ({ details: "service unavailable" }),
    });

    const err = await syncUserRecord(fakeUser).catch((e) => e);
    expect(err).toBeInstanceOf(UserSyncError);
    expect(err.status).toBe(503);
    expect(err.detail).toBe("service unavailable");
    // The message is what reaches the person, so it must be intelligible
    // rather than a status code.
    expect(err.message).toMatch(/could not be set up/i);
  });

  // A proxy or gateway failing in front of the app returns HTML, not JSON.
  // Parsing that must not turn a clean 502 into an unhandled TypeError.
  it("still throws when the error body is not JSON", async () => {
    stubFetch({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError("Unexpected token < in JSON");
      },
    });

    const err = await syncUserRecord(fakeUser).catch((e) => e);
    expect(err).toBeInstanceOf(UserSyncError);
    expect(err.status).toBe(502);
    expect(err.detail).toBeUndefined();
  });

  it("posts the caller's ID token to the sync endpoint", async () => {
    const spy = stubFetch({ ok: true, status: 200, json: async () => ({}) });
    await syncUserRecord(fakeUser);

    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/auth/sync-user");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ idToken: "fake-id-token" });
  });
});
