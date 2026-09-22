// Runs dataconnect/seed_data.gql against the Data Connect emulator.
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
// SAFETY: refuses to run unless DATA_CONNECT_EMULATOR_HOST points at
// localhost. This uses admin credentials and ignores @auth levels entirely,
// so there must be no path to it touching a real project by accident.

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

if (!isLocal) {
  console.error(
    "Refusing to run: DATA_CONNECT_EMULATOR_HOST must point at localhost.\n" +
      `  got: ${host || "(unset)"}\n\n` +
      "Start the emulators first (npm run emulators), then run: npm run seed\n" +
      "This reads .env.local, so DATA_CONNECT_EMULATOR_HOST should be set there."
  );
  process.exit(1);
}

// The whole file is one GraphQL document containing several named mutations;
// executeGraphql picks which one to run via operationName, so the document is
// sent as-is each time rather than being split by hand.
const document = readFileSync(join(ROOT, "dataconnect", "seed_data.gql"), "utf8");

// projectId only has to match what the emulator was started with. No
// credential is needed or used — the emulator does not verify one.
initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? "finance-tracker-app" });
const dc = getDataConnect(CONNECTOR_CONFIG);

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
  console.error("\nSeeding stopped. Is the Data Connect emulator running on that port?");
  process.exit(1);
}

console.log("\nSeeded: 5 user types, 3 features + grants, 4 color schemes, 13 categories.");
