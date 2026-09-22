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

    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      "ecs-finance-tracker-app";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (clientEmail && privateKey) {
      initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
      return getAuth();
    }

    // No service account. Tolerable locally: verifyIdToken fetches Google's
    // public keys from a public endpoint, so signing in still works, and it
    // saves putting a production private key on every dev machine.
    //
    // NOT tolerable in a deployed build. Admin Data Connect calls — which is
    // how the User row is written — do need a credential, so continuing here
    // just moves the failure somewhere less obvious: token verification
    // passes, then the write fails with an auth error that says nothing about
    // missing configuration. Fail here instead, naming exactly what is absent.
    if (process.env.NODE_ENV === "production") {
      const missing = [
        !process.env.FIREBASE_PROJECT_ID && "FIREBASE_PROJECT_ID",
        !clientEmail && "FIREBASE_CLIENT_EMAIL",
        !privateKey && "FIREBASE_PRIVATE_KEY",
      ].filter(Boolean);

      throw new Error(
        `Firebase Admin is missing ${missing.join(", ")} in this deployment.\n\n` +
          "Add them to your hosting provider's environment variables from a " +
          "service account key (Firebase console > Project settings > Service " +
          "accounts > Generate new private key), then redeploy.\n\n" +
          "FIREBASE_PRIVATE_KEY is the whole PEM including the BEGIN/END lines. " +
          "Paste it unquoted — surrounding quotes are stripped, but only as a " +
          "fallback."
      );
    }

    initializeApp({ projectId });
  }

  return getAuth();
}

/**
 * Coerces whatever the environment holds into a usable PEM.
 *
 * Two shapes arrive in practice and both have to work, because the same value
 * is pasted into different places:
 *
 *   - one line with literal \n escapes, which is how a .env file must store a
 *     multi-line value;
 *   - real newlines, which is what a dashboard textarea (Vercel, Railway)
 *     stores when you paste the key straight in.
 *
 * Surrounding quotes are stripped too. `.env` files need them around the
 * escaped form, and copying that value out of the file and into a dashboard
 * carries them along, where they become part of the value and cert() fails
 * with "Failed to parse private key" — a message that points nowhere near the
 * cause.
 */
function normalizePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const unquoted = raw.trim().replace(/^(['"])([\s\S]*)\1$/, "$2");
  const withNewlines = unquoted.replace(/\\n/g, "\n");
  return withNewlines.includes("BEGIN") ? withNewlines : undefined;
}
