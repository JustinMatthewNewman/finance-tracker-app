import { resolveEmulatorUse } from "./emulatorGuard";

// Remove the static top-level imports! They are what trigger the build/runtime crash.

/**
 * Dynamically initializes Firebase Admin and returns the Auth instance.
 * This completely bypasses the Next.js/Turbopack compilation phase error.
 */
export async function getAdminAuth() {
  // 1. Dynamically import the modules only when this function is actually executed
  const { getApps, initializeApp, cert } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");

  const apps = getApps();

  if (!apps.length) {
    // Emulator mode is gated rather than trusted — see lib/emulatorGuard.ts.
    // firebase-admin turns OFF token signature verification whenever
    // FIREBASE_AUTH_EMULATOR_HOST is set, so an inherited value in a deployed
    // environment is an authentication bypass, not a cosmetic mistake. This
    // throws there instead of quietly continuing.
    const emulator = resolveEmulatorUse({
      host: process.env.FIREBASE_AUTH_EMULATOR_HOST,
      nodeEnv: process.env.NODE_ENV,
      varName: "FIREBASE_AUTH_EMULATOR_HOST",
    });

    if (emulator.use) {
      // No credential at all: the Auth emulator does not verify one, and
      // cert() parses its PEM eagerly, so a placeholder key would throw
      // before the emulator is ever reached. Requiring a real production
      // private key to run locally is the wrong trade.
      initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID ?? "finance-tracker-app" });
      return getAuth();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Firebase Admin credentials are missing at runtime. Set FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (see .env.local.example), or set " +
        "FIREBASE_AUTH_EMULATOR_HOST to run against the local Auth emulator instead."
      );
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        // Env files store the PEM on one line with literal \n escapes; the
        // SDK needs real newlines.
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }

  return getAuth();
}