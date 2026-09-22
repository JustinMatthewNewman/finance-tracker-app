// Decides whether the Firebase emulators may be used, and refuses in any
// context where honouring the setting would be unsafe.
//
// WHY THIS IS A SECURITY CONTROL, NOT A CONVENIENCE.
//
// firebase-admin decides it is talking to an emulator purely from
// `!!process.env.FIREBASE_AUTH_EMULATOR_HOST`. When it thinks so, it verifies
// ID tokens with EmulatorSignatureVerifier, which is:
//
//     verifyJwtSignature(token, undefined, { algorithms: ["none"] })
//
// That accepts ONLY unsigned tokens. Two consequences, both bad, and the
// second is the one that matters:
//
//   1. Real Google-signed (RS256) tokens are rejected — surfacing as
//      "Firebase ID token has invalid signature", which is how this was
//      found.
//   2. Any unsigned `{"alg":"none"}` token with the right `aud`/`iss` is
//      ACCEPTED, with whatever `sub` the sender chose. Anyone who knows the
//      project id can mint one in a few lines and be treated as any user.
//      Signature verification is not weakened here, it is switched off.
//
// So a stray FIREBASE_AUTH_EMULATOR_HOST in a deployed environment is an
// authentication bypass. This module fails closed rather than quietly
// ignoring it: silently correcting misconfiguration hides the fact that
// production was, for a while, running with auth disabled.

export type EmulatorDecision =
  | { use: true; host: string }
  | { use: false; reason: "not-configured" };

export interface EmulatorGuardInput {
  /** process.env.FIREBASE_AUTH_EMULATOR_HOST (or the Data Connect equivalent). */
  host: string | undefined;
  /** process.env.NODE_ENV */
  nodeEnv: string | undefined;
  /** Name of the variable, for error messages. */
  varName: string;
}

/**
 * Loopback only. A non-loopback emulator host means the "emulator" is
 * something reachable over the network, and pointing token verification at a
 * remote host that is trusted to say "no signature needed" is the same
 * bypass by another route.
 *
 * Accepts an optional scheme and port: "127.0.0.1:9199", "localhost:9199",
 * "http://[::1]:9499".
 */
export function isLoopbackHost(host: string): boolean {
  const withoutScheme = host.replace(/^https?:\/\//, "");
  // Strip a trailing :port, being careful with bracketed IPv6.
  const hostname = withoutScheme.startsWith("[")
    ? withoutScheme.slice(0, withoutScheme.indexOf("]") + 1)
    : withoutScheme.split(":")[0];

  return (
    hostname === "127.0.0.1" ||
    hostname === "localhost" ||
    hostname === "[::1]" ||
    hostname === "::1" ||
    hostname === "0.0.0.0"
  );
}

export class EmulatorMisconfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmulatorMisconfigurationError";
  }
}

/**
 * Whether to run against the emulator.
 *
 * Throws — rather than returning false — when the variable is set somewhere
 * it must not be. The process is already in an unsafe state at that point and
 * the operator needs to know which variable to remove.
 */
export function resolveEmulatorUse({
  host,
  nodeEnv,
  varName,
}: EmulatorGuardInput): EmulatorDecision {
  if (!host) return { use: false, reason: "not-configured" };

  if (nodeEnv === "production") {
    throw new EmulatorMisconfigurationError(
      `${varName} is set in a production build (value: "${host}").\n\n` +
        "This disables Firebase ID token signature verification: unsigned " +
        "tokens are accepted and real ones are rejected. Remove " +
        `${varName} from the deployment environment.\n\n` +
        "If this came from copying .env.local into your hosting provider, " +
        "remove the emulator variables there — they are for local " +
        "development only."
    );
  }

  if (!isLoopbackHost(host)) {
    throw new EmulatorMisconfigurationError(
      `${varName} points at a non-loopback host ("${host}"). The emulator is ` +
        "only ever local; a remote value here would turn off token " +
        "signature verification against a host you do not control."
    );
  }

  return { use: true, host };
}

/**
 * Client-side variant: reports and disables, rather than throwing.
 *
 * The asymmetry with the server is deliberate and worth stating, because
 * "fail closed everywhere" would be the obvious instinct.
 *
 * On the server, honouring a stray emulator host means accepting forged
 * tokens, so the only safe move is to stop. In the browser the same flag is
 * merely broken — it points the tab at 127.0.0.1, which is the visitor's own
 * machine and simply will not connect. Nothing is trusted that should not
 * be. Throwing there costs far more than it buys: this runs during
 * prerendering too, so it would fail the whole production build for anyone
 * whose local .env.local has emulator mode on, which is everyone developing
 * against the emulators.
 *
 * So the browser falls back to real Firebase — the correct behaviour for a
 * deployed build — and says so loudly. The server guard still refuses, so
 * the dangerous half never silently passes.
 */
export function resolveEmulatorUseForClient(input: EmulatorGuardInput): EmulatorDecision {
  try {
    return resolveEmulatorUse(input);
  } catch (err) {
    if (err instanceof EmulatorMisconfigurationError) {
      console.error(
        `[emulator] Ignoring ${input.varName} and using the real Firebase ` +
          `project instead.\n${err.message}`
      );
      return { use: false, reason: "not-configured" };
    }
    throw err;
  }
}
