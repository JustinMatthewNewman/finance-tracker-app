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
    // Local emulator path: initialize with no credential at all.
    //
    // The Auth emulator does not verify signatures, so there is nothing for a
    // service account to authenticate — and cert() parses the PEM eagerly, so
    // a placeholder key throws "Failed to parse private key" before the
    // emulator is ever reached. Requiring real production credentials just to
    // run against a local emulator is the wrong trade: it puts a live private
    // key on every contributor's machine to do work that never leaves it.
    //
    // Keyed off FIREBASE_AUTH_EMULATOR_HOST, which is the same variable the
    // Admin SDK itself reads to decide where to send requests — so this branch
    // can only be taken when the SDK is already talking to the emulator, never
    // silently against production.
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
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