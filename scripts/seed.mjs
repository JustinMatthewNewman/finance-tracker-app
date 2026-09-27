// Runs dataconnect/seed_data.gql against the Data Connect emulator, or — with an
// explicit opt-in — against a real project.
//
// Why a script rather than "paste it into the emulator": seed_data.gql is
// deliberately NOT part of the finance connector (it lives outside
// dataconnect/finance/), so it is not in the generated SDK and there is no
// typed function to call. The Admin SDK's executeGraphql runs arbitrary
// GraphQL against the service, which is exactly what seeding needs.
//
// ORDER MATTERS. SeedUserTypes must land before any user row exists — see the
// migration-ordering note on it in seed_data.gql. The rest depend on it.
//
// Idempotent: every mutation in that file is built from *_upsert, so
// re-running resets the seeded rows and leaves user-created data alone.
//
// SAFETY: refuses to run unless DATA_CONNECT_EMULATOR_HOST points at localhost.
// This uses admin credentials and ignores @auth levels entirely, so there must be
// no path to it touching a real project by ACCIDENT.
//
// SEEDING PRODUCTION IS A REAL NEED, AND ITS ABSENCE WAS A BUG. This script is
// the only thing that creates the ColorScheme and Theme rows, and the guard above
// meant they had never been written to the production database at all. So
// ListColorSchemes returned nothing there, the Settings theme picker was empty,
// and DbThemeApplier found no variant and removed every CSS override — "themes
// don't work in prod", with nothing broken in the theming code.
//
// The guard stays, because running this at a real project by accident is still
// the thing to prevent. What is added is a deliberate path through it:
//
//   npm run seed:prod
//
// which requires --production AND SEED_CONFIRM_PROJECT to equal the project id
// being written to. Two independent statements of intent, one of which is the
// project's own name, so a copied command line cannot land on the wrong project.
//
// It is safe when deliberate: every mutation in seed_data.gql is an upsert of
// REFERENCE data (tiers, features, colour schemes, categories). None of it
// touches a user, a household or a transaction.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase-admin/app";
import { getDataConnect } from "firebase-admin/data-connect";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const CONNECTOR_CONFIG = {
  connector: "finance",
  serviceId: "finance-tracker-app-service",
  location: "us-east4",
};

// The named mutations in seed_data.gql, in dependency order.
const SEED_ORDER = ["SeedUserTypes", "SeedFeatures", "SeedColorSchemes", "SeedCategories"];

// Pick up .env.local the way `next dev` does, so this works as a bare
// `npm run seed` rather than needing DATA_CONNECT_EMULATOR_HOST re-stated on
// the command line. A variable already in the real environment still wins —
// loadEnvConfig does not overwrite one that is set.
if (!process.env.DATA_CONNECT_EMULATOR_HOST) {
  let loadEnvConfig;
  try {
    const mod = await import("@next/env");
    // @next/env is CommonJS, so the named export lands on .default rather
    // than on the namespace. Reading only the namespace silently yields
    // undefined and the call below fails with a TypeError.
    loadEnvConfig = mod.loadEnvConfig ?? mod.default?.loadEnvConfig;
  } catch {
    // Module genuinely absent — fall through to the explicit env var path.
  }
  // Deliberately NOT inside the try: a failure to *call* it is a real bug in
  // this script, and swallowing it just produces a confusing "unset" error
  // several lines later instead of a stack trace.
  if (loadEnvConfig) {
    loadEnvConfig(ROOT, true, { info: () => {}, error: () => {} });
  }
}

const host = process.env.DATA_CONNECT_EMULATOR_HOST ?? "";
const isLocal = /^(https?:\/\/)?(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host);
const wantsProduction = process.argv.includes("--production");
// Runs every guard and prints the plan, then stops before the first write.
//
// This exists because the guards are the part of this script most worth testing
// and the only way to test them was to point it at a real project and see what
// happened — which is a poor way to find out. Use this to exercise the
// production path; it is the flag to reach for by default.
const dryRun = process.argv.includes("--dry-run");

const projectId =
  process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? "finance-tracker-app";

if (wantsProduction) {
  // The emulator host must be OUT of the environment, not merely ignored. It is
  // read by the Admin SDK itself, so leaving it set would silently send this at
  // the emulator while the console said "production" — the most confusing
  // possible outcome, and the reason this is an error rather than a warning.
  if (host) {
    console.error(
      "Refusing to run: --production was given but DATA_CONNECT_EMULATOR_HOST is set.\n" +
        `  got: ${host}\n\n` +
        "The Admin SDK reads that variable and would send this to the emulator.\n" +
        "Unset it for this command:\n" +
        "  DATA_CONNECT_EMULATOR_HOST= FIREBASE_AUTH_EMULATOR_HOST= npm run seed:prod"
    );
    process.exit(1);
  }

  // The second, independent statement of intent — and it is the project's own
  // name, so a command line copied from a README or another project's notes
  // cannot write to the wrong database.
  if (process.env.SEED_CONFIRM_PROJECT !== projectId) {
    console.error(
      "Refusing to run: SEED_CONFIRM_PROJECT must equal the project being seeded.\n" +
        `  project:             ${projectId}\n` +
        `  SEED_CONFIRM_PROJECT ${process.env.SEED_CONFIRM_PROJECT ?? "(unset)"}\n\n` +
        "This writes reference data (tiers, features, colour schemes, categories)\n" +
        "to a REAL database. It touches no user, household or transaction. To go ahead:\n" +
        `  SEED_CONFIRM_PROJECT=${projectId} npm run seed:prod`
    );
    process.exit(1);
  }

  // Credentials, unlike the emulator path, which needs none. Same three
  // variables every Admin-SDK route uses — see lib/firebase-admin.ts.
  if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error(
      "Refusing to run: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are required\n" +
        "to seed a real project. See .env.local.example."
    );
    process.exit(1);
  }

  console.log(
    `\n\x1b[33mSeeding PRODUCTION project ${projectId}${dryRun ? " (dry run)" : ""}\x1b[0m\n`
  );
} else if (!isLocal) {
  console.error(
    "Refusing to run: DATA_CONNECT_EMULATOR_HOST must point at localhost.\n" +
      `  got: ${host || "(unset)"}\n\n` +
      "Start the emulators first (npm run emulators), then run: npm run seed\n" +
      "This reads .env.local, so DATA_CONNECT_EMULATOR_HOST should be set there.\n\n" +
      "To seed a REAL project instead — which is what makes the colour schemes\n" +
      "exist there at all — see npm run seed:prod."
  );
  process.exit(1);
}

// The whole file is one GraphQL document containing several named mutations;
// executeGraphql picks which one to run via operationName, so the document is
// sent as-is each time rather than being split by hand.
const document = readFileSync(join(ROOT, "dataconnect", "seed_data.gql"), "utf8");

// Against the emulator, projectId only has to match what it was started with and
// no credential is needed or used — the emulator verifies none. Against a real
// project it needs a service account, exactly as lib/firebase-admin.ts does.
if (wantsProduction) {
  const { cert } = await import("firebase-admin/app");
  initializeApp({
    projectId,
    credential: cert({
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The PEM arrives with its newlines escaped when it comes from an env
      // file, and cert() parses it eagerly — so this has to be undone here or it
      // throws "Failed to parse private key" before any request is made.
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
} else {
  initializeApp({ projectId });
}
const dc = getDataConnect(CONNECTOR_CONFIG);

if (dryRun) {
  console.log("Would run, in order:");
  for (const operationName of SEED_ORDER) console.log(`  ${operationName}`);
  console.log(
    "\nAll of these are upserts of reference data — tiers, features, colour\n" +
      "schemes and categories. None touches a user, household or transaction.\n" +
      "\nNothing was written. Drop --dry-run to go ahead."
  );
  process.exit(0);
}

let failed = false;

for (const operationName of SEED_ORDER) {
  process.stdout.write(`${operationName} ... `);
  try {
    const result = await dc.executeGraphql(document, { operationName });
    if (result.errors?.length) {
      console.log("FAILED");
      for (const err of result.errors) console.error(`   ${err.message ?? err}`);
      failed = true;
      break; // later mutations depend on earlier ones; don't compound the failure
    }
    console.log("ok");
  } catch (err) {
    console.log("FAILED");
    console.error(`   ${err instanceof Error ? err.message : err}`);
    failed = true;
    break;
  }
}

if (failed) {
  console.error(
    wantsProduction
      ? "\nSeeding stopped. Check the service account has Data Connect access."
      : "\nSeeding stopped. Is the Data Connect emulator running on that port?"
  );
  process.exit(1);
}

console.log("\nSeeded: 5 user types, 3 features + grants, 4 color schemes, 13 categories.");
