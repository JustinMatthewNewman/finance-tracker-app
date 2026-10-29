// Fills the LOCAL emulators with a household that already has a year of money
// in it, so every screen in the app has something real to render the moment you
// sign in.
//
// WHAT THIS IS FOR. `npm run seed` loads reference data — tiers, features,
// colour schemes, categories — and leaves you staring at an empty app: no
// account, no household, no transactions, and nothing on any of the four pages
// until you type it in by hand. Judging a layout, a total, a calendar or the
// category breakdown needs data, and the states worth judging are precisely the
// ones nobody enters by hand: a recurring projection whose rule started eleven
// months ago, a transfer with only one leg imported, an overlapping statement
// re-upload. This writes all of them.
//
// It is also the fixture the awkward cases live in. Every invariant in
// CLAUDE.md that can be *seen* has a row here that shows it, named in the
// coverage report this prints at the end — including the ones that were real
// bugs: a recurring rule that expands to nothing (and must still appear), a
// household that imported before the internal-transfer columns existed (and
// must be repairable from Settings), a member soft-deleted with their history
// intact.
//
//   npm run seed:stress:dry     generate everything, print the plan, write nothing
//   npm run seed:stress         seed (idempotent — safe to re-run)
//   npm run seed:stress:reset   delete only this script's accounts, then reseed
//
// It runs `npm run seed`'s reference data first, so it stands alone: a clean
// emulator needs this command and nothing else.
//
// EMULATOR ONLY, AND THERE IS NO --production FLAG HERE. seed.mjs has one
// because it writes reference data and genuinely needs to reach production.
// This writes people, households and money. There is no version of "seeding
// fake transactions into a real household" that anybody wants, so the guard
// below is the whole story and there is deliberately no path through it.
//
// IDEMPOTENT BY CONSTRUCTION. Every id is derived from a human-readable key
// (see `id()`), so a re-run upserts the same rows instead of piling up a second
// copy. The one thing a re-run cannot absorb is a change to how a statement
// line fingerprints — `Transaction.importKey` is @unique, so an old row under a
// new id collides. That is what `--reset` is for.
//
// Knobs, all optional:
//   SEED_MONTHS=14        how many months of history (default 14)
//   SEED_RNG_SEED=...     the PRNG seed; same seed, same fixture (default 20261029)
//   SEED_DENSITY=1        multiplier on discretionary rows per member per month
//   SEED_SKIP_CSV=1       don't write the generated CSVs into transaction_data/

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase-admin/app";
import { getDataConnect } from "firebase-admin/data-connect";
import { getAuth } from "firebase-admin/auth";

// The app's own statement parser and transfer classifier, not a copy of their
// rules. This is why the script is run through scripts/ts-resolve.mjs — see the
// header there for what that does and why reimplementing these would be worse.
import {
  parseWellsFargoCsv,
  importKeyFor,
  statementContentKey,
  GUESSABLE_CATEGORIES,
} from "../lib/wellsFargoCsv.ts";
import {
  PAIR_WINDOW_DAYS,
  nameTokens,
  resolveInternalTransfers,
  isInternal,
  reclassify,
} from "../lib/internalTransfers.ts";
import { reconcileStatement } from "../lib/importReconcile.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const RESET = args.has("--reset");

// ---------------------------------------------------------------------------
// Environment and the one guard that matters
// ---------------------------------------------------------------------------

// Pick up .env.local the way `next dev` does, so this runs as a bare npm
// script. Mirrors scripts/seed.mjs — including the note there about @next/env
// being CommonJS, so its named export lands on `.default`.
if (!process.env.DATA_CONNECT_EMULATOR_HOST) {
  let loadEnvConfig;
  try {
    const mod = await import("@next/env");
    loadEnvConfig = mod.loadEnvConfig ?? mod.default?.loadEnvConfig;
  } catch {
    // Module genuinely absent — fall through to the explicit env var path.
  }
  if (loadEnvConfig) {
    loadEnvConfig(ROOT, true, { info: () => {}, error: () => {} });
  }
}

const LOCAL = /^(https?:\/\/)?(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/;
const dcHost = process.env.DATA_CONNECT_EMULATOR_HOST ?? "";
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "";

// Checked even for --dry-run. A dry run writes nothing, but it is also how
// somebody checks that this command is safe before running it for real, and a
// dry run that passes against a production environment would be telling them
// the opposite of the truth.
if (!LOCAL.test(dcHost) || !LOCAL.test(authHost)) {
  console.error(
    "Refusing to run: both emulator hosts must point at localhost.\n" +
      `  DATA_CONNECT_EMULATOR_HOST:  ${dcHost || "(unset)"}\n` +
      `  FIREBASE_AUTH_EMULATOR_HOST: ${authHost || "(unset)"}\n\n` +
      "This creates accounts, households and transactions. Unlike `npm run seed`,\n" +
      "there is no --production path and there is not meant to be one.\n\n" +
      "Start the emulators first (npm run emulators), then: npm run seed:stress\n" +
      "Both variables should already be set in .env.local, which this reads."
  );
  process.exit(1);
}

const PROJECT =
  process.env.FIREBASE_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  "ecs-finance-tracker-app";
const CONNECTOR_CONFIG = {
  connector: "finance",
  serviceId: "finance-tracker-app-service",
  location: "us-east4",
};

// ---------------------------------------------------------------------------
// Knobs
// ---------------------------------------------------------------------------

const MONTHS = Math.max(2, Number(process.env.SEED_MONTHS ?? 14));
const RNG_SEED = Number(process.env.SEED_RNG_SEED ?? 20261029);
const DENSITY = Number(process.env.SEED_DENSITY ?? 1);
const SKIP_CSV = process.env.SEED_SKIP_CSV === "1";
// 100 and not one more: the Admin SDK rejects a GraphQL list variable longer
// than that outright ("$rows payload exceeds maximum allowed size of 100"), so
// this is a hard ceiling rather than a tuning choice. The categories, members
// and join requests are written in single calls because each is comfortably
// under it; only the transactions need chunking.
const CHUNK_SIZE = 100;

// Fixed namespace for uuidv5. Composed from nothing in particular — the only
// requirement is that it never changes, because it is what makes a re-run
// upsert the same rows rather than insert a second set.
const ID_NAMESPACE = "6f1c0a52-8d41-4b7e-9f23-0a5d8e3c71b4";

// ---------------------------------------------------------------------------
// Who is in the fixture
// ---------------------------------------------------------------------------
//
// Eight accounts, because the interesting states are relational. One household
// with three signed-in members is what makes "reads are household-wide, writes
// are not" visible at all: sign in as Sam and Alex's rows are all there and
// none of them are editable. A second household is how you see that boundary
// holding from the outside. Two accounts with no household at all are the only
// way to reach the onboarding flow after the first run.
//
// `tier` varies so the feature gates are reachable without a manual promotion
// after every reset — Alex is Admin for that reason and no other.

const HOUSEHOLD_A = {
  key: "rivera-chen",
  name: "The Rivera-Chen Household",
  // Not from lib/inviteCode.ts on purpose: a CSPRNG code is unguessable, which
  // is exactly right in the app and exactly wrong in a fixture you want to type
  // into a join form. Crockford base32 all the same, so it is a legal code.
  inviteCode: "STRESSHHA1",
  ownerKey: "alex",
};

const HOUSEHOLD_B = {
  key: "okonkwo",
  name: "The Okonkwo Household",
  inviteCode: "STRESSHHB2",
  ownerKey: "nia",
};

const ACCOUNTS = [
  {
    key: "alex",
    uid: "stress-alex",
    name: "Alex Rivera",
    email: "alex@local.dev",
    tier: "Admin",
    household: HOUSEHOLD_A,
    // Settings are varied across the household so the preference toggles have
    // somebody they are already true for. Jordan's two are the ones that change
    // what you see most: privacy mode hides every amount, and turning internal
    // transfers off moves figures on four screens at once.
    settings: { colorSchemeId: "00000000-0000-0000-0000-000000000010", privacyMode: false, hideWeekends: false, showInternalTransfers: true },
    member: { relationship: "Self", color: "#2563eb", monthlyIncomeTargetMinor: 820000 },
    profile: { payday: "semimonthly", payMinor: 412_500, employer: "MERIDIAN CAPITAL", spendRows: 26 },
  },
  {
    key: "sam",
    uid: "stress-sam",
    name: "Sam Chen",
    email: "sam@local.dev",
    tier: "Regular",
    household: HOUSEHOLD_A,
    settings: { colorSchemeId: "00000000-0000-0000-0000-000000000020", privacyMode: false, hideWeekends: true, showInternalTransfers: true },
    member: { relationship: "Spouse", color: "#0d9488", monthlyIncomeTargetMinor: 615000 },
    profile: { payday: "biweekly", payMinor: 284_000, employer: "NORTHFIELD HEALTH", spendRows: 21 },
  },
  {
    key: "jordan",
    uid: "stress-jordan",
    name: "Jordan Rivera",
    email: "jordan@local.dev",
    tier: "Premium",
    household: HOUSEHOLD_A,
    settings: { colorSchemeId: "00000000-0000-0000-0000-000000000030", privacyMode: true, hideWeekends: false, showInternalTransfers: false },
    // No colour and no income target, both deliberately: the sidebar has to fall
    // back to a name-derived hue (lib/entityColor.ts) and the panel has to show
    // no attainment rather than a target nobody set.
    member: { relationship: "Adult child", color: null, monthlyIncomeTargetMinor: null },
    profile: { payday: "monthly", payMinor: 268_000, employer: "GLASSNODE STUDIO", spendRows: 14 },
  },
  {
    key: "nia",
    uid: "stress-nia",
    name: "Nia Okonkwo",
    email: "nia@local.dev",
    tier: "Regular",
    household: HOUSEHOLD_B,
    settings: { colorSchemeId: "00000000-0000-0000-0000-000000000040", privacyMode: false, hideWeekends: false, showInternalTransfers: true },
    member: { relationship: "Self", color: "#c026d3", monthlyIncomeTargetMinor: 540000 },
    profile: { payday: "semimonthly", payMinor: 271_000, employer: "KESTREL LOGISTICS", spendRows: 18 },
  },
  // No household. The onboarding flow is unreachable once every account has
  // one, and it is a route group of its own (app/(onboarding)/) with its own
  // sign-out path — so there has to be somebody who can still get to it.
  {
    key: "riley",
    uid: "stress-riley",
    name: "Riley Novak",
    email: "riley@local.dev",
    tier: "Regular",
    household: null,
    settings: {},
    member: { relationship: "Self", color: null, monthlyIncomeTargetMinor: null },
    profile: null,
  },
  // Also no household, but with a PENDING request at household A, so the join
  // queue in Settings has something in it and the approve/deny buttons do
  // something. Riley stays clean so the create-or-join choice is still
  // reachable from a fresh state.
  {
    key: "casey",
    uid: "stress-casey",
    name: "Casey Mori",
    email: "casey@local.dev",
    tier: "Regular",
    household: null,
    requestsJoinTo: HOUSEHOLD_A,
    settings: {},
    member: { relationship: "Self", color: null, monthlyIncomeTargetMinor: null },
    profile: null,
  },
];

// People in the household who do not sign in — the normal case for most of a
// family. Owned by one account (`ownerKey`), which is what makes the
// FamilyMember.user / FamilyMember.selfUser distinction visible: these rows have
// an owner and no `selfUser`, so they are editable by Alex and by nobody else.
const DEPENDENTS = [
  {
    key: "maya",
    ownerKey: "alex",
    name: "Maya Rivera",
    relationship: "Child",
    color: "#db2777",
    monthlyIncomeTargetMinor: null,
    isDeleted: false,
    profile: { payday: null, payMinor: 0, employer: null, spendRows: 7 },
  },
  // Soft-deleted, WITH transactions. FamilyMember.isDeleted exists to stop a
  // removal cascading into somebody's financial history, and the only way to see
  // that it works is to remove somebody who had some. They are gone from the
  // sidebar; their rows are still in the database.
  {
    key: "theo",
    ownerKey: "alex",
    name: "Theo Rivera",
    relationship: "Child",
    color: "#f59e0b",
    monthlyIncomeTargetMinor: null,
    isDeleted: true,
    profile: { payday: null, payMinor: 0, employer: null, spendRows: 4 },
  },
];

const ALL_MEMBERS = [
  ...ACCOUNTS.filter((a) => a.profile).map((a) => ({
    key: a.key,
    ownerKey: a.key,
    name: a.name,
    household: a.household,
    profile: a.profile,
  })),
  ...DEPENDENTS.map((d) => ({
    key: d.key,
    ownerKey: d.ownerKey,
    name: d.name,
    household: ACCOUNTS.find((a) => a.key === d.ownerKey).household,
    profile: d.profile,
  })),
];

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

// mulberry32. Same seed, same fixture — so `--reset` gives back the dataset you
// were just looking at rather than a new pile of noise, and a screenshot of a
// bug is still reproducible tomorrow.
function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(RNG_SEED);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

// uuidv5 (SHA-1, name-based) over a fixed namespace, so every row's id is a
// pure function of a readable key: id("txn", "alex", "2026-03-14", 7).
//
// Hand-rolled rather than pulled from the `uuid` package because this script is
// the only thing in the repo that needs it, and a dev-only fixture generator is
// a poor reason to add a dependency to an app that ships.
function id(...parts) {
  const name = parts.join(":");
  const nsBytes = Buffer.from(ID_NAMESPACE.replace(/-/g, ""), "hex");
  const hash = createHash("sha1").update(Buffer.concat([nsBytes, Buffer.from(name, "utf8")])).digest();
  const b = Buffer.from(hash.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; // version 5
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = b.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ---------------------------------------------------------------------------
// Dates — LOCAL CALENDAR DAYS
// ---------------------------------------------------------------------------
//
// `occurredOn` is a calendar day, not an instant. Nothing below constructs a
// Date from a "yyyy-mm-dd" string or round-trips one through toISOString():
// both shift the day across midnight for most of the world, which is how a
// transaction entered on the 1st ends up filed under the 31st. Every Date here
// is built from (year, month, day) — local midnight — and every day string is
// assembled from its parts. Same rule as lib/monthRange.ts.
//
// `createdAt` is a Timestamp and genuinely IS an instant, so toISOString() is
// correct there and used only there.

const TODAY = new Date();
const TODAY_YMD = { y: TODAY.getFullYear(), m: TODAY.getMonth(), d: TODAY.getDate() };

const pad = (n) => String(n).padStart(2, "0");
/** (year, 0-based month, day) -> "yyyy-mm-dd". */
const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
/** Day count of a month, via local-midnight "day 0 of next month". */
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
/** Clamps a day-of-month to a month that may not have it (the 31st of April). */
const clampDay = (y, m, d) => Math.min(d, daysInMonth(y, m));

function shiftMonth({ y, m }, delta) {
  const base = new Date(y, m + delta, 1);
  return { y: base.getFullYear(), m: base.getMonth() };
}

/** Adds days to a "yyyy-mm-dd", staying in local calendar space throughout. */
function addDays(dayString, delta) {
  const [y, m, d] = dayString.split("-").map(Number);
  const shifted = new Date(y, m - 1, d + delta);
  return ymd(shifted.getFullYear(), shifted.getMonth(), shifted.getDate());
}

/** "MM/DD/YYYY" — how a Wells Fargo export writes a date. */
function statementDate(dayString) {
  const [y, m, d] = dayString.split("-").map(Number);
  return `${pad(m)}/${pad(d)}/${y}`;
}

// The months to fill, oldest first, ending with the one we are in.
const MONTH_CURSORS = Array.from({ length: MONTHS }, (_, i) =>
  shiftMonth({ y: TODAY_YMD.y, m: TODAY_YMD.m }, -(MONTHS - 1 - i))
);
const FIRST_MONTH = MONTH_CURSORS[0];
const THIS_MONTH = MONTH_CURSORS[MONTH_CURSORS.length - 1];
const NEXT_MONTH = shiftMonth(THIS_MONTH, 1);

/**
 * Whether a day has already happened.
 *
 * This is the line between a POSTED row and a FORECASTED one, and getting it
 * right is what makes the current month look like a real month in progress:
 * actuals up to today, projections after it. A fixture that posted the whole of
 * the current month would leave the projection half of every screen empty for
 * four weeks out of every four.
 */
function hasHappened(dayString) {
  const [y, m, d] = dayString.split("-").map(Number);
  return new Date(y, m - 1, d) <= new Date(TODAY_YMD.y, TODAY_YMD.m, TODAY_YMD.d);
}

const NOW_ISO = new Date().toISOString();

// ---------------------------------------------------------------------------
// Content pools
// ---------------------------------------------------------------------------
//
// Merchants are invented, and chosen to be unmistakably invented — nothing here
// is a real business, for the same reason transaction_data.example/ uses
// "EXAMPLE MARKETS". Amount ranges are in MINOR UNITS (cents), because money is
// an integer everywhere in this app and a fixture that starts from dollars and
// multiplies is the exact mistake lib/money.ts exists to prevent.

const SPEND_POOL = [
  { merchant: "WHOLEFDS GREENPOINT", category: "Groceries", method: "Card", lo: 3_200, hi: 18_400 },
  { merchant: "WEGMANS # 142", category: "Groceries", method: "Card", lo: 4_100, hi: 22_900 },
  { merchant: "ALDI 0087", category: "Groceries", method: "Card", lo: 1_900, hi: 9_600 },
  { merchant: "EXAMPLE COFFEE CO", category: "Dining", method: "Card", lo: 475, hi: 2_150 },
  { merchant: "TAQUERIA DEL FARO", category: "Dining", method: "Card", lo: 1_650, hi: 7_400 },
  { merchant: "NOODLE HOUSE EXAMPLE", category: "Dining", method: "Card", lo: 2_200, hi: 8_900 },
  { merchant: "SUNOCO 00451208", category: "Transport", method: "Card", lo: 3_400, hi: 9_200 },
  { merchant: "METRO TRANSIT AUTHORITY", category: "Transport", method: "Card", lo: 275, hi: 1_400 },
  { merchant: "EXAMPLE STREAMING", category: "Subscriptions", method: "Card", lo: 999, hi: 2_499 },
  { merchant: "CLOUDSTORE EXAMPLE", category: "Subscriptions", method: "Card", lo: 299, hi: 1_999 },
  { merchant: "RIVERSIDE PHARMACY", category: "Health", method: "Card", lo: 850, hi: 14_200 },
  { merchant: "NORTHFIELD DENTAL", category: "Health", method: "Card", lo: 6_500, hi: 48_000 },
  { merchant: "EXAMPLE OUTFITTERS", category: "Clothing", method: "Card", lo: 2_400, hi: 19_800 },
  { merchant: "CORNER HARDWARE EXAMPLE", category: "Home", method: "Card", lo: 1_100, hi: 24_600 },
  { merchant: "PAWS AND CLAWS EXAMPLE", category: "Pets", method: "Card", lo: 1_800, hi: 11_400 },
  { merchant: "EXAMPLE BOOKS AND GAMES", category: "Entertainment", method: "Card", lo: 900, hi: 8_200 },
  { merchant: "CINEMA EXAMPLE 12", category: "Entertainment", method: "Card", lo: 1_400, hi: 6_800 },
  { merchant: "EXAMPLE CHILDCARE CTR", category: "Childcare", method: "Transfer", lo: 42_000, hi: 86_000 },
  { merchant: "NON-WF ATM WITHDRAWAL", category: "Cash", method: "ATM", lo: 2_000, hi: 20_000 },
  { merchant: "EXAMPLE AIRLINES", category: "Travel", method: "Card", lo: 18_400, hi: 92_000 },
  // No category on purpose. A null category is a real state — the importer
  // leaves a row uncategorized rather than guessing badly — so the breakdown,
  // the pickers and the table all have to render it.
  { merchant: "EXAMPLE SUNDRIES", category: null, method: "Card", lo: 600, hi: 5_400 },
  { merchant: "UNLABELLED DEBIT", category: null, method: null, lo: 1_200, hi: 7_700 },
];

// Charged on the same day every month, which is what makes them recognizable in
// the calendar and the thing a household actually budgets around.
const FIXED_EXPENSES = {
  alex: [
    { day: 1, merchant: "ASPEN RIDGE PROPERTY MGMT", category: "Rent", method: "Transfer", minor: 248_000 },
    { day: 20, merchant: "EXAMPLE MUTUAL INSURANCE", category: "Insurance", method: "Transfer", minor: 18_450 },
  ],
  sam: [
    { day: 8, merchant: "CITY POWER AND LIGHT", category: "Utilities", method: "Transfer", minor: 14_280 },
    { day: 9, merchant: "EXAMPLE FIBER INTERNET", category: "Utilities", method: "Card", minor: 7_999 },
  ],
  jordan: [
    { day: 12, merchant: "EXAMPLE FITNESS CLUB", category: "Health", method: "Card", minor: 4_900 },
  ],
  nia: [
    { day: 3, merchant: "LAKEVIEW LETTINGS", category: "Rent", method: "Transfer", minor: 176_000 },
    { day: 14, merchant: "CITY POWER AND LIGHT", category: "Utilities", method: "Transfer", minor: 11_050 },
  ],
  maya: [],
  theo: [],
};

// Extra categories beyond the thirteen in dataconnect/seed_data.gql.
//
// The seeded set is a starter list; a year of real-looking spending needs more
// than thirteen buckets or the breakdown collapses into "Living". These are
// upserted alongside, which is idempotent and cannot overwrite an existing
// colour or kind.
//
// "Gifts" has no colour deliberately — the breakdown and the chips have to fall
// back to a name-derived hue, which is the same path every category the importer
// creates takes (see ensureCategoriesExist: it writes a name and nothing else).
const EXTRA_CATEGORIES = [
  { name: "Insurance", kind: "EXPENSE", parentGroup: "Housing", color: "#6366f1" },
  { name: "Home", kind: "EXPENSE", parentGroup: "Housing", color: "#8b5cf6" },
  { name: "Childcare", kind: "EXPENSE", parentGroup: "Family", color: "#ec4899" },
  { name: "Pets", kind: "EXPENSE", parentGroup: "Family", color: "#f97316" },
  { name: "Clothing", kind: "EXPENSE", parentGroup: "Living", color: "#14b8a6" },
  { name: "Entertainment", kind: "EXPENSE", parentGroup: "Living", color: "#a855f7" },
  { name: "Travel", kind: "EXPENSE", parentGroup: "Living", color: "#0ea5e9" },
  { name: "Gifts", kind: "EXPENSE", parentGroup: "Living", color: null },
];

// ---------------------------------------------------------------------------
// Transaction rows
// ---------------------------------------------------------------------------

/**
 * One Transaction row, with every column stated.
 *
 * EVERY KEY IS ALWAYS PRESENT, and absent values are explicit `null` rather
 * than left off. Data Connect builds ONE column list for a whole `upsertMany`
 * batch, so a row that omits a key does not get the default — it misaligns the
 * batch, and the write fails on whichever row happens to differ from the rest.
 * The failure is confusing and arrives in bulk, so the shape is pinned here
 * instead of at each of the twenty call sites.
 */
function txn({
  key,
  ownerKey,
  memberKey,
  amountMinor,
  direction,
  occurredOn,
  category = null,
  description = null,
  merchant = null,
  method = null,
  recurrence = null,
  recurrenceEndsOn = null,
  source = "MANUAL",
  status = "POSTED",
  importKey = null,
  importRef = null,
  statementImportKey = null,
  isInternalToUser = false,
  isInternalToFamily = false,
}) {
  return {
    id: id("txn", key),
    userId: id("user", ownerKey),
    familyMemberId: id("member", memberKey),
    categoryName: category,
    // Unsigned, always. `direction` carries the sign — a signed amount makes
    // every aggregate ambiguous about whether it is a total or a net.
    amountMinor: Math.abs(Math.round(amountMinor)),
    direction,
    occurredOn,
    description,
    merchant,
    method,
    recurrence,
    recurrenceEndsOn,
    source,
    status,
    importKey,
    importRef,
    statementImportId: statementImportKey ? id("import", statementImportKey) : null,
    isInternalToUser,
    isInternalToFamily,
    createdAt: NOW_ISO,
  };
}

/** Pay dates across the whole seeded range, by how the person is paid. */
function paydaysFor(profile) {
  if (!profile?.payday) return [];
  const days = [];
  if (profile.payday === "biweekly") {
    // Stepped through the range rather than assumed per-month, which is the
    // only way the three-paycheque month shows up — and that month is exactly
    // the one a monthly income target reads oddly against.
    let cursor = ymd(FIRST_MONTH.y, FIRST_MONTH.m, 3);
    const end = ymd(THIS_MONTH.y, THIS_MONTH.m, daysInMonth(THIS_MONTH.y, THIS_MONTH.m));
    while (cursor <= end) {
      days.push(cursor);
      cursor = addDays(cursor, 14);
    }
    return days;
  }
  const dayNumbers = profile.payday === "semimonthly" ? [1, 16] : [1];
  for (const { y, m } of MONTH_CURSORS) {
    for (const d of dayNumbers) days.push(ymd(y, m, clampDay(y, m, d)));
  }
  return days;
}

/**
 * A member's own money: what they earned and what they spent, month by month.
 *
 * The current month is treated as a month in progress — rows are generated only
 * up to today, and the rest of it is filled by the projection rules below. That
 * split is the whole reason the Income and Expenses pages have both halves
 * populated on the day you run this.
 */
function generateActuals(member) {
  const rows = [];
  const { profile, key, ownerKey } = member;
  if (!profile) return rows;

  // ── Income ──
  for (const [i, day] of paydaysFor(profile).entries()) {
    if (!hasHappened(day)) continue;
    rows.push(
      txn({
        key: `pay:${key}:${day}`,
        ownerKey,
        memberKey: key,
        amountMinor: profile.payMinor + between(-4_000, 4_000),
        direction: "INCOME",
        occurredOn: day,
        category: "Salary",
        description: i % 6 === 0 ? "Includes overtime" : null,
        merchant: `${profile.employer} PAYROLL`,
        method: "Deposit",
      })
    );
  }

  // A bonus or two over the whole range, and monthly interest on savings. Both
  // exist so "Income" is not one category repeated, which is what makes the
  // breakdown on that page worth looking at.
  if (profile.payday) {
    const bonusMonth = MONTH_CURSORS[Math.floor(MONTH_CURSORS.length * 0.35)];
    rows.push(
      txn({
        key: `bonus:${key}`,
        ownerKey,
        memberKey: key,
        amountMinor: profile.payMinor * 2 + between(0, 40_000),
        direction: "INCOME",
        occurredOn: ymd(bonusMonth.y, bonusMonth.m, 22),
        category: "Bonus",
        description: "Annual performance bonus",
        merchant: `${profile.employer} PAYROLL`,
        method: "Deposit",
      })
    );
    for (const { y, m } of MONTH_CURSORS) {
      const day = ymd(y, m, 1);
      if (!hasHappened(day)) continue;
      rows.push(
        txn({
          key: `interest:${key}:${y}-${m}`,
          ownerKey,
          memberKey: key,
          amountMinor: between(180, 2_400),
          direction: "INCOME",
          occurredOn: day,
          category: "Interest",
          merchant: "INTEREST PAYMENT",
          method: "Deposit",
        })
      );
    }
  }

  // ── Fixed monthly expenses ──
  for (const { y, m } of MONTH_CURSORS) {
    for (const fixed of FIXED_EXPENSES[key] ?? []) {
      const day = ymd(y, m, clampDay(y, m, fixed.day));
      if (!hasHappened(day)) continue;
      rows.push(
        txn({
          key: `fixed:${key}:${fixed.merchant}:${day}`,
          ownerKey,
          memberKey: key,
          amountMinor: fixed.minor,
          direction: "EXPENSE",
          occurredOn: day,
          category: fixed.category,
          merchant: fixed.merchant,
          method: fixed.method,
        })
      );
    }
  }

  // ── Discretionary spending ──
  for (const { y, m } of MONTH_CURSORS) {
    const last = daysInMonth(y, m);
    // The current month stops at today: beyond it, spending has not happened,
    // and inventing it as a projection would be claiming the household expects
    // a specific coffee on the 24th.
    const ceiling = y === THIS_MONTH.y && m === THIS_MONTH.m ? TODAY_YMD.d : last;
    const count = Math.max(1, Math.round(profile.spendRows * DENSITY * (ceiling / last)));
    for (let i = 0; i < count; i++) {
      const spend = pick(SPEND_POOL);
      const day = ymd(y, m, between(1, ceiling));
      rows.push(
        txn({
          key: `spend:${key}:${y}-${m}:${i}`,
          ownerKey,
          memberKey: key,
          amountMinor: between(spend.lo, spend.hi),
          direction: "EXPENSE",
          occurredOn: day,
          category: spend.category,
          description: chance(0.18) ? pick(["Split with Sam", "Reimbursable", "Weekend trip", "Birthday"]) : null,
          merchant: spend.merchant,
          method: spend.method,
        })
      );
    }
  }

  return rows;
}

/**
 * Money coming IN against a spending category — a return, a reimbursed deposit.
 *
 * This is the case Transaction.direction exists to keep expressible, and the
 * reason it is authoritative per row rather than derived from Category.kind. A
 * fixture without one lets a change that "simplifies" direction away look fine.
 */
function generateRefunds() {
  const month = MONTH_CURSORS[Math.max(0, MONTH_CURSORS.length - 3)];
  return [
    txn({
      key: "refund:alex:outfitters",
      ownerKey: "alex",
      memberKey: "alex",
      amountMinor: 8_640,
      direction: "INCOME",
      occurredOn: ymd(month.y, month.m, 18),
      // An EXPENSE category with an INCOME row against it, on purpose.
      category: "Clothing",
      description: "Returned the jacket",
      merchant: "EXAMPLE OUTFITTERS",
      method: "Card",
    }),
    txn({
      key: "refund:sam:utilities",
      ownerKey: "sam",
      memberKey: "sam",
      amountMinor: 3_125,
      direction: "INCOME",
      occurredOn: ymd(month.y, month.m, 26),
      category: "Utilities",
      description: "Overpayment credited back",
      merchant: "CITY POWER AND LIGHT",
      method: "Transfer",
    }),
  ];
}

// ---------------------------------------------------------------------------
// Projections — rules, not rows
// ---------------------------------------------------------------------------
//
// A recurring projection is ONE row holding its FIRST occurrence, expanded over
// whatever range is on screen by lib/recurrence.ts. So a rule that governs this
// month usually has an `occurredOn` eleven months ago, and the row you are
// looking at in the ledger is an expansion, not a record. That is why editing
// one has to go through ruleRowOf() first, and it is why this script seeds a
// rule's start date far in the past rather than in the month you will open.
//
// The three bounded cases below are not padding. Each was a way the expansion
// could go wrong, and a fixture is the only place they are visible without
// waiting a year.

/** The nearest upcoming day still inside the current month. */
function soonInThisMonth(offset) {
  const last = daysInMonth(THIS_MONTH.y, THIS_MONTH.m);
  return ymd(THIS_MONTH.y, THIS_MONTH.m, Math.min(TODAY_YMD.d + offset, last));
}

function generateProjections() {
  const rows = [];
  const notes = [];
  const firstDay = (d) => ymd(FIRST_MONTH.y, FIRST_MONTH.m, clampDay(FIRST_MONTH.y, FIRST_MONTH.m, d));

  // A. Indefinite monthly — the ordinary case, and the one the calendar should
  // show on the same day of every month in both directions.
  rows.push(
    txn({
      key: "proj:rent",
      ownerKey: "alex",
      memberKey: "alex",
      amountMinor: 248_000,
      direction: "EXPENSE",
      occurredOn: firstDay(1),
      category: "Rent",
      description: "Rent",
      merchant: "ASPEN RIDGE PROPERTY MGMT",
      method: "Transfer",
      recurrence: "MONTHLY",
      recurrenceEndsOn: null,
      source: "FORECAST",
      status: "FORECASTED",
    })
  );
  notes.push("MONTHLY rule, indefinite — Alex's rent, one row expanded across every month");

  // B. Biweekly, which is the interval that does not line up with months: some
  // months get two expansions and some get three.
  rows.push(
    txn({
      key: "proj:sam-pay",
      ownerKey: "sam",
      memberKey: "sam",
      amountMinor: 284_000,
      direction: "INCOME",
      occurredOn: firstDay(3),
      category: "Salary",
      description: "Expected paycheque",
      merchant: "NORTHFIELD HEALTH PAYROLL",
      method: "Deposit",
      recurrence: "BIWEEKLY",
      recurrenceEndsOn: null,
      source: "FORECAST",
      status: "FORECASTED",
    })
  );
  notes.push("BIWEEKLY rule — Sam's pay; lands three times in some months, twice in others");

  // C. Bounded in the future: appears for a few more months and then stops.
  const streamEnd = shiftMonth(THIS_MONTH, 3);
  rows.push(
    txn({
      key: "proj:streaming",
      ownerKey: "jordan",
      memberKey: "jordan",
      amountMinor: 2_499,
      direction: "EXPENSE",
      occurredOn: ymd(shiftMonth(THIS_MONTH, -6).y, shiftMonth(THIS_MONTH, -6).m, 12),
      category: "Subscriptions",
      description: "Streaming, cancelling after the season",
      merchant: "EXAMPLE STREAMING",
      method: "Card",
      recurrence: "MONTHLY",
      recurrenceEndsOn: ymd(streamEnd.y, streamEnd.m, 12),
      source: "FORECAST",
      status: "FORECASTED",
    })
  );
  notes.push(`MONTHLY rule bounded in the FUTURE — stops after ${ymd(streamEnd.y, streamEnd.m, 12)}`);

  // D. Yearly, which exercises the month-clamping in the expansion and appears
  // exactly once in the whole seeded range.
  rows.push(
    txn({
      key: "proj:car-insurance",
      ownerKey: "alex",
      memberKey: "alex",
      amountMinor: 96_400,
      direction: "EXPENSE",
      occurredOn: firstDay(20),
      category: "Insurance",
      description: "Annual car insurance",
      merchant: "EXAMPLE MUTUAL INSURANCE",
      method: "Transfer",
      recurrence: "YEARLY",
      recurrenceEndsOn: null,
      source: "FORECAST",
      status: "FORECASTED",
    })
  );
  notes.push("YEARLY rule — one expansion per year, clamped into months that lack the day");

  // E. Weekly, bounded — the highest-volume expansion, and the one that shows
  // whether a month's grid can carry several occurrences of one rule.
  const gymStart = shiftMonth(THIS_MONTH, -2);
  rows.push(
    txn({
      key: "proj:gym",
      ownerKey: "sam",
      memberKey: "sam",
      amountMinor: 3_200,
      direction: "EXPENSE",
      occurredOn: ymd(gymStart.y, gymStart.m, 6),
      category: "Health",
      description: "Weekly class pass",
      merchant: "EXAMPLE FITNESS CLUB",
      method: "Card",
      recurrence: "WEEKLY",
      recurrenceEndsOn: addDays(ymd(THIS_MONTH.y, THIS_MONTH.m, clampDay(THIS_MONTH.y, THIS_MONTH.m, 6)), 42),
      source: "FORECAST",
      status: "FORECASTED",
    })
  );
  notes.push("WEEKLY rule bounded — several occurrences inside one month");

  // F. Bounded in the PAST. Still a row in the database, and correctly absent
  // from the current month: it governed last spring and nothing since.
  const lapsed = shiftMonth(THIS_MONTH, -4);
  rows.push(
    txn({
      key: "proj:lapsed-loan",
      ownerKey: "alex",
      memberKey: "alex",
      amountMinor: 41_500,
      direction: "EXPENSE",
      occurredOn: firstDay(14),
      category: "Insurance",
      description: "Car loan — paid off",
      merchant: "EXAMPLE AUTO FINANCE",
      method: "Transfer",
      recurrence: "MONTHLY",
      recurrenceEndsOn: ymd(lapsed.y, lapsed.m, 14),
      source: "FORECAST",
      status: "FORECASTED",
    })
  );
  notes.push(`MONTHLY rule bounded in the PAST — ended ${ymd(lapsed.y, lapsed.m, 14)}, must not appear now`);

  // G. THE ONE THAT WAS A BUG. `recurrenceEndsOn` has no CHECK against
  // `occurredOn`, so a rule whose end date precedes its start is storable — and
  // useHouseholdMonth drops every rule row from its range results and re-derives
  // it from the expansion, so a rule expanding to nothing VANISHED from the
  // ledger while still sitting in the database. The invariant is that a rule
  // always yields at least its first occurrence. This row is what proves it
  // still does.
  const beforeStart = shiftMonth(THIS_MONTH, -1);
  rows.push(
    txn({
      key: "proj:degenerate",
      ownerKey: "alex",
      memberKey: "alex",
      amountMinor: 19_900,
      direction: "EXPENSE",
      occurredOn: ymd(NEXT_MONTH.y, NEXT_MONTH.m, 10),
      category: "Subscriptions",
      description: "Ends before it starts — must still show its first occurrence",
      merchant: "EXAMPLE ARCHIVE SERVICE",
      method: "Card",
      recurrence: "MONTHLY",
      // Deliberately BEFORE occurredOn.
      recurrenceEndsOn: ymd(beforeStart.y, beforeStart.m, daysInMonth(beforeStart.y, beforeStart.m)),
      source: "FORECAST",
      status: "FORECASTED",
    })
  );
  notes.push("DEGENERATE rule — recurrenceEndsOn precedes occurredOn; must still yield occurrence one");

  // H/I. One-off projections: an expected bill with no recurrence at all.
  rows.push(
    txn({
      key: "proj:oneoff-next",
      ownerKey: "alex",
      memberKey: "alex",
      amountMinor: 184_000,
      direction: "EXPENSE",
      occurredOn: ymd(NEXT_MONTH.y, NEXT_MONTH.m, 9),
      category: "Health",
      description: "Dental work, quoted",
      merchant: "NORTHFIELD DENTAL",
      method: "Card",
      source: "FORECAST",
      status: "FORECASTED",
    })
  );
  rows.push(
    txn({
      key: "proj:oneoff-soon",
      ownerKey: "sam",
      memberKey: "sam",
      amountMinor: 32_400,
      direction: "EXPENSE",
      occurredOn: soonInThisMonth(4),
      category: "Travel",
      description: "Flights for the reunion",
      merchant: "EXAMPLE AIRLINES",
      method: "Card",
      source: "FORECAST",
      status: "FORECASTED",
    })
  );
  notes.push("One-off projections — no recurrence, this month and next");

  // J. A projection that was RECEIVED. `status` is POSTED, so it counts as real
  // money; `source` stays FORECAST, which is what preserves "this started life
  // as a projection". Anything totalling money must branch on status and never
  // on source, and this row is what makes getting that backwards visible: read
  // from `source` and it drops out of the month's income.
  const lastMonth = shiftMonth(THIS_MONTH, -1);
  rows.push(
    txn({
      key: "proj:received",
      ownerKey: "alex",
      memberKey: "alex",
      amountMinor: 145_000,
      direction: "INCOME",
      occurredOn: ymd(lastMonth.y, lastMonth.m, 11),
      category: "Bonus",
      description: "Projected, and it arrived",
      merchant: "MERIDIAN CAPITAL PAYROLL",
      method: "Deposit",
      source: "FORECAST",
      status: "POSTED",
    })
  );
  notes.push("FORECAST + POSTED — a received projection; counts as real money, keeps its provenance");

  return { rows, notes };
}

// ---------------------------------------------------------------------------
// Internal transfers — the five cases that behave differently
// ---------------------------------------------------------------------------
//
// These exist because excluding internal transfers is the one preference that
// MOVES A FIGURE, and the five situations below move it in different ways. With
// both legs present the legs cancel and only in/out change; with one leg missing
// the net changes too. A memo that names somebody is classifiable on sight; a
// memo reading "CASH APP" names nobody and is only resolvable by finding its
// other half. And rows imported before those columns existed have the flags
// unset, so the live answer and the stored one disagree until somebody re-checks.

/**
 * An importKey for a row that is standing in for one imported long ago.
 *
 * WHY THESE ROWS HAVE TO BE IMPORTED ONES. The re-check in Settings reads
 * ListMyClassifiableTransactions, which filters `importKey: { isNull: false }` —
 * only rows that came out of a statement are re-checkable, because the memo is
 * the only evidence those rows have and a hand-entered row has nothing to
 * re-read. So a fixture row representing "imported before the internal-transfer
 * columns existed" must carry an importKey, or the button it exists to exercise
 * cannot see it. Seeding these as MANUAL made the whole scenario invisible.
 *
 * Built with the app's own importKeyFor() over a fingerprint in the documented
 * shape (day, signed amount, normalized memo, ordinal), so these cannot collide
 * with the generated statements' keys unless they genuinely describe the same
 * line — which, being in different months, they do not.
 */
function legacyImportKey({ ownerKey, occurredOn, amountMinor, direction, memo }) {
  const signedMinor = direction === "EXPENSE" ? -amountMinor : amountMinor;
  const normalized = memo.replace(/\s+/g, " ").trim().toUpperCase();
  return importKeyFor(id("user", ownerKey), "Checking", `${occurredOn}|${signedMinor}|${normalized}|0`);
}

function generateTransferScenarios() {
  const rows = [];
  const notes = [];
  const m = shiftMonth(THIS_MONTH, 0);
  const prev = shiftMonth(THIS_MONTH, -1);
  const older = shiftMonth(THIS_MONTH, -5);

  // T1. Own-account sweep, BOTH legs, flags correctly stored. Alex moves money
  // from checking to savings: not income or spending for anybody, at any level.
  const sweepDay = ymd(m.y, m.m, Math.min(5, TODAY_YMD.d));
  for (const [leg, direction, merchant] of [
    ["out", "EXPENSE", "ONLINE TRANSFER TO RIVERA A WAY2SAVE SAVINGS XXXXXX0000"],
    ["in", "INCOME", "ONLINE TRANSFER FROM RIVERA A EVERYDAY CHECKING XXXXXX0000"],
  ]) {
    rows.push(
      txn({
        key: `xfer:sweep:${leg}`,
        ownerKey: "alex",
        memberKey: "alex",
        amountMinor: 50_000,
        direction,
        occurredOn: sweepDay,
        category: direction === "INCOME" ? "Transfers In" : "Transfers Out",
        merchant,
        method: "Transfer",
        importRef: "IB00000101",
        isInternalToUser: true,
      })
    );
  }
  notes.push("Own-account sweep, both legs, flags SET — leaves in/out, net untouched");

  // T2. The same shape, with the flags NOT set. This is the state a household
  // that imported before those columns existed is actually in — 1,062 unflagged
  // transfers in the real one — and the reason display resolves the flags at read
  // time rather than trusting the column. The memo prefix survives in `merchant`,
  // which is the only reason the re-check in Settings can repair it at all.
  const staleDay = ymd(older.y, older.m, 9);
  for (const [leg, direction, merchant] of [
    ["out", "EXPENSE", "ONLINE TRANSFER TO RIVERA A WAY2SAVE SAVINGS XXXXXX0000"],
    ["in", "INCOME", "ONLINE TRANSFER FROM RIVERA A EVERYDAY CHECKING XXXXXX0000"],
  ]) {
    rows.push(
      txn({
        key: `xfer:stale:${leg}`,
        ownerKey: "alex",
        memberKey: "alex",
        amountMinor: 75_000,
        direction,
        occurredOn: staleDay,
        category: direction === "INCOME" ? "Transfers In" : "Transfers Out",
        merchant,
        method: "Transfer",
        importRef: "IB00000088",
        // IMPORT, not MANUAL — see legacyImportKey() above. A hand-entered row
        // is not re-checkable, so seeding this as MANUAL would have hidden the
        // scenario from the button it exists to exercise.
        source: "IMPORT",
        importKey: legacyImportKey({
          ownerKey: "alex",
          occurredOn: staleDay,
          amountMinor: 75_000,
          direction,
          memo: merchant,
        }),
        // Deliberately false: this is the pre-columns state, to be repaired.
        isInternalToUser: false,
      })
    );
  }
  notes.push("Own-account sweep with flags UNSET — the pre-columns state; Settings re-check repairs it");

  // T3. Between two people in the household, named in the memo. Real money for
  // each of them individually, nothing at household level.
  const zelleDay = ymd(prev.y, prev.m, 19);
  rows.push(
    txn({
      key: "xfer:zelle:out",
      ownerKey: "alex",
      memberKey: "alex",
      amountMinor: 24_000,
      direction: "EXPENSE",
      occurredOn: zelleDay,
      category: "Transfers Out",
      description: "Half the utilities",
      merchant: "ZELLE TO SAM CHEN",
      method: "Zelle",
      importRef: "PP0000000055",
      isInternalToFamily: true,
    })
  );
  rows.push(
    txn({
      key: "xfer:zelle:in",
      ownerKey: "sam",
      memberKey: "sam",
      amountMinor: 24_000,
      direction: "INCOME",
      occurredOn: zelleDay,
      category: "Transfers In",
      description: "Half the utilities",
      merchant: "ZELLE FROM ALEX RIVERA",
      method: "Zelle",
      importRef: "PP0000000055",
      isInternalToFamily: true,
    })
  );
  notes.push("Named person-to-person transfer — classifiable from the memo alone");

  // T4. ANONYMOUS, and the reason pairing exists. "CASH APP" names nobody, so
  // classifyInternalTransfer cannot place it however carefully it reads the memo
  // — but when both accounts are imported the transfer is in the data twice,
  // once per member. Opposite directions, identical amount, dates within
  // PAIR_WINDOW_DAYS, and both sides looking like a transfer. Flags left unset:
  // pairTransfers() is what has to catch this.
  const cashDay = ymd(prev.y, prev.m, 23);
  rows.push(
    txn({
      key: "xfer:cashapp:out",
      ownerKey: "jordan",
      memberKey: "jordan",
      amountMinor: 7_500,
      direction: "EXPENSE",
      occurredOn: cashDay,
      category: "Transfers Out",
      merchant: "CASH APP",
      method: "Transfer",
      // Imported, like the sweeps above, so this pair is in the re-check's
      // population too — and the re-check must leave it exactly as it is. The
      // memo names nobody, so classifyInternalTransfer cannot place it however
      // carefully it reads; only finding the other leg can. Having both cases in
      // one fixture is what makes the difference between them visible.
      source: "IMPORT",
      importKey: legacyImportKey({
        ownerKey: "jordan",
        occurredOn: cashDay,
        amountMinor: 7_500,
        direction: "EXPENSE",
        memo: "CASH APP",
      }),
      isInternalToUser: false,
      isInternalToFamily: false,
    })
  );
  rows.push(
    txn({
      key: "xfer:cashapp:in",
      ownerKey: "sam",
      memberKey: "sam",
      amountMinor: 7_500,
      direction: "INCOME",
      // Inside the pairing window, and NOT the same day — a pair that only
      // matched on an exact date would miss most real ones.
      occurredOn: addDays(cashDay, 2),
      category: "Transfers In",
      merchant: "CASH APP",
      method: "Transfer",
      source: "IMPORT",
      importKey: legacyImportKey({
        ownerKey: "sam",
        occurredOn: addDays(cashDay, 2),
        amountMinor: 7_500,
        direction: "INCOME",
        memo: "CASH APP",
      }),
      isInternalToUser: false,
      isInternalToFamily: false,
    })
  );
  notes.push(`Anonymous "CASH APP" pair, ${PAIR_WINDOW_DAYS - 2} day(s) inside the pairing window, flags UNSET — only pairTransfers() can catch it`);

  // T5. ONE LEG ONLY, because the other account was never imported. This is the
  // case where excluding transfers changes the NET and not just the two sides:
  // counting it reports money as having left the household when it did not.
  rows.push(
    txn({
      key: "xfer:one-legged",
      ownerKey: "sam",
      memberKey: "sam",
      amountMinor: 120_000,
      direction: "EXPENSE",
      occurredOn: ymd(prev.y, prev.m, 4),
      category: "Transfers Out",
      description: "Into the savings account that is not imported",
      merchant: "ONLINE TRANSFER TO CHEN S PLATINUM SAVINGS XXXXXX0000",
      method: "Transfer",
      importRef: "IB00000205",
      isInternalToUser: true,
    })
  );
  notes.push("One-legged transfer — the only case where excluding transfers moves the NET");

  // A decoy, and it earns its place. Two shops at the same supermarket in one
  // week for the same amount are two transactions, and the matcher must not call
  // the second a duplicate of the first. Different references prove it.
  const decoyDay = ymd(prev.y, prev.m, 12);
  const twins = [
    { tag: "a", ref: "S000000000000311", dayOffset: 0 },
    { tag: "b", ref: "S000000000000388", dayOffset: 5 },
  ];
  for (const twin of twins) {
    rows.push(
      txn({
        key: `decoy:twin:${twin.tag}`,
        ownerKey: "alex",
        memberKey: "alex",
        amountMinor: 6_499,
        direction: "EXPENSE",
        occurredOn: addDays(decoyDay, twin.dayOffset),
        category: "Groceries",
        merchant: "WHOLEFDS GREENPOINT",
        method: "Card",
        importRef: twin.ref,
      })
    );
  }
  notes.push("Two identical-amount shops at one shop, DIFFERENT refs — must never match as a duplicate");

  return { rows, notes };
}

// ---------------------------------------------------------------------------
// Bank statements
// ---------------------------------------------------------------------------
//
// Three Wells Fargo exports are generated as real CSV text and written to
// transaction_data/stress-test/. One of them is also parsed here and seeded as
// imported rows, which is what makes the other two worth uploading:
//
//   Checking.csv       seeded into the database. Uploading it again is refused
//                      by StatementImport.contentKey — the same FILE.
//   Checking (1).csv   NOT seeded. Overlaps the first by a week and hits all
//                      three reconcile tiers at once. The "(1)" is not
//                      decoration: accountLabelFromFilename() strips it, so both
//                      files carry the account label "Checking" and the per-line
//                      importKeys line up. That is what a re-download actually
//                      lands as, and the only reason tier 1 fires at all.
//   Savings.csv        NOT seeded. A second account, holding the other leg of
//                      the own-account transfers in Checking.csv.
//
// The rows are HAND-WRITTEN rather than generated at random, because the point
// is the awkward pairs: a pending charge that has since settled, two identical
// coffees minutes apart, a Zelle from somebody who is not in the household. None
// of those appear by chance.
//
// THE PARSING IS THE APP'S OWN. parseWellsFargoCsv() turns this text into rows
// and importKeyFor() keys them, so the seeded rows are what the import dialog
// would have written from the same file, down to the guessed category. See
// scripts/ts-resolve.mjs for why that import is possible at all.

const STATEMENT_DIR = join(ROOT, "transaction_data", "stress-test");

/** Minor units to the signed decimal string a statement prints. */
function csvAmount(minorSigned) {
  const sign = minorSigned < 0 ? "-" : "";
  const abs = Math.abs(minorSigned);
  // The ONE place in this script that renders money as a major-unit decimal,
  // because a bank CSV is a dollars-denominated text format. Everything that
  // reaches the database stays in minor units, and the parser converts this
  // back through lib/money.ts rather than anything here doing it.
  return `${sign}${Math.floor(abs / 100)}.${pad(abs % 100)}`;
}

const quote = (v) => `"${String(v).replace(/"/g, '""')}"`;
const csvRow = (cells) => cells.map(quote).join(",");
const CSV_HEADER = csvRow(["DATE", "DESCRIPTION", "AMOUNT", "CHECK #", "STATUS"]);

function buildCsv(lines) {
  return [
    CSV_HEADER,
    ...lines.map(([day, memo, minorSigned, check = "", status = "Posted"]) =>
      csvRow([statementDate(day), memo, csvAmount(minorSigned), check, status])
    ),
    // Wells Fargo's exports end with a newline, and lib/wellsFargoCsv.ts
    // normalizes for it. Writing one keeps the fixture honest about the shape
    // the parser actually receives.
  ].join("\r\n") + "\r\n";
}

/** "YYMMDD", as the payroll memo embeds it. */
function payrollStamp(dayString) {
  const [y, m, d] = dayString.split("-");
  return `${y.slice(2)}${m}${d}`;
}

function buildStatements() {
  const P = shiftMonth(THIS_MONTH, -1);
  const pday = (d) => ymd(P.y, P.m, clampDay(P.y, P.m, d));
  const tday = (d) => ymd(THIS_MONTH.y, THIS_MONTH.m, Math.min(d, TODAY_YMD.d));
  const mmdd = (dayString) => statementDate(dayString).slice(0, 5);
  const ref = (n) => `S0000000000003${pad(n)}`;

  // ── Checking.csv — last month, and the file that gets seeded ──
  const checking = [
    [pday(1), `000000 MERIDIAN CAPITAL PAYROLL    ${payrollStamp(pday(1))} 00000           RIVERA A ACCOUNTHOLDER`, 412_500],
    [pday(1), `ONLINE TRANSFER TO RIVERA A WAY2SAVE SAVINGS XXXXXX0000 REF #IB00000301 ON ${mmdd(pday(1))}/${String(P.y).slice(2)}`, -60_000],
    [pday(2), `PURCHASE                                AUTHORIZED ON   ${mmdd(pday(1))} WHOLEFDS GREENPOINT       GREENWICH     CT  ${ref(1)}   CARD 0000`, -9_241],
    [pday(4), `RECURRING PAYMENT             AUTHORIZED ON   ${mmdd(pday(3))} EXAMPLE STREAMING        GREENWICH     CT  ${ref(2)}   CARD 0000`, -2_499],
    [pday(6), `PURCHASE                                AUTHORIZED ON   ${mmdd(pday(5))} SUNOCO 00451208          GREENWICH     CT  P00000000000${pad(3)}   CARD 0000`, -6_134],
    [pday(9), `NON-WELLS FARGO ATM WITHDRAWAL AUTHORIZED ON   ${mmdd(pday(9))} 1 EXAMPLE AVE            GREENWICH     CT  000000000000304   ATM ID 1842   CARD 0000`, -10_000],
    [pday(11), `ZELLE TO SAM CHEN ON ${mmdd(pday(11))} REF #PP0000000311`, -24_000],
    // Kept for tier 2: the overlap file restates this transaction in a different
    // memo format on a different date, with this same reference.
    [pday(12), `PURCHASE                                AUTHORIZED ON   ${mmdd(pday(11))} WEGMANS # 142            GREENWICH     CT  ${ref(5)}   CARD 0000`, -11_872],
    [pday(14), "CHECK", -45_000, "1051"],
    [pday(16), `000000 MERIDIAN CAPITAL PAYROLL    ${payrollStamp(pday(16))} 00000           RIVERA A ACCOUNTHOLDER`, 412_500],
    [pday(16), "INTEREST PAYMENT", 412],
    // Money IN against a spending merchant — the refund case, straight from a
    // real memo shape ("PURCHASE RETURN").
    [pday(18), `PURCHASE RETURN             AUTHORIZED ON   ${mmdd(pday(17))} EXAMPLE OUTFITTERS       GREENWICH     CT  ${ref(6)}   CARD 0000`, 8_640],
    [pday(19), `MONEY TRANSFER                          AUTHORIZED ON   ${mmdd(pday(18))} EXAMPLE MARKETS          EXAMPLE.COM   NY  ${ref(7)}   CARD 0000`, -15_500],
    // TWO IDENTICAL COFFEES, minutes apart, different references. Both real.
    // A re-upload must match both and import neither, and a third next month
    // must still come through as new — that is what count-aware matching is for.
    [pday(21), `PURCHASE                                AUTHORIZED ON   ${mmdd(pday(20))} EXAMPLE COFFEE CO        GREENWICH     CT  ${ref(8)}   CARD 0000`, -875],
    [pday(21), `PURCHASE                                AUTHORIZED ON   ${mmdd(pday(20))} EXAMPLE COFFEE CO        GREENWICH     CT  ${ref(9)}   CARD 0000`, -875],
    // PENDING, so NO reference — which is precisely the row a fingerprint cannot
    // match once it settles. Its settled twin is in the overlap file.
    [pday(25), "PURCHASE SANTINIS NEW +15550001234  VA CARD0000", -12_845, "", "Pending"],
    // Pending, and its settled twin has a DIFFERENT amount.
    [pday(26), "PURCHASE ASPEN RIDGE HOA -  555-0002222   CO CARD0000", -248_000, "", "Pending"],
    // Two lines the parser must REJECT rather than guess at, so the upload's
    // skippedRowCount is non-zero and the dialog's "unreadable" disclosure has
    // something to disclose. An unreadable date and a zero amount.
    ["2026-13-45", "PURCHASE GARBLED LINE EXAMPLE", -1_000],
    [pday(27), "ACCOUNT MAINTENANCE WAIVED", 0],
    [pday(28), `PURCHASE                                AUTHORIZED ON   ${mmdd(pday(27))} CORNER HARDWARE EXAMPLE  GREENWICH     CT  ${ref(10)}   CARD 0000`, -4_280],
  ];

  // ── Checking (1).csv — overlaps the last week of the above, then runs on ──
  const overlap = [
    // Tier 1, SAME LINE: byte-identical to two rows already imported.
    [pday(21), `PURCHASE                                AUTHORIZED ON   ${mmdd(pday(20))} EXAMPLE COFFEE CO        GREENWICH     CT  ${ref(8)}   CARD 0000`, -875],
    [pday(21), `PURCHASE                                AUTHORIZED ON   ${mmdd(pday(20))} EXAMPLE COFFEE CO        GREENWICH     CT  ${ref(9)}   CARD 0000`, -875],
    // Tier 2, SAME REFERENCE: the Wegmans shop again, reformatted and dated two
    // days later, carrying the reference it already has in the ledger. Certain,
    // whatever else changed — and nothing but the reference could say so.
    [pday(14), `PURCHASE WEGMANS #142 GREENWICH VA CARD0000 REF #${ref(5)}`, -11_872],
    // Tier 3a, LOOKS THE SAME: the settled form of the pending Santinis charge.
    // Same amount, three days later, in a completely different memo format, and
    // now carrying a reference the pending row never had. Reported, NOT skipped.
    [pday(28), `PURCHASE                                AUTHORIZED ON   ${mmdd(pday(27))} SANTINIS NEW YORK        GREENWICH     CT  S000000000000401   CARD 0000`, -12_845],
    // Tier 3b, SAME MERCHANT, AMOUNT CHANGED: the HOA charge settled higher.
    // An amount that legitimately moved between pending and settled must reach a
    // person rather than be refused, which is why importRef is not @unique.
    [pday(28), `PURCHASE                                AUTHORIZED ON   ${mmdd(pday(27))} ASPEN RIDGE HOA MGMT     GREENWICH     CT  S000000000000402   CARD 0000`, -249_500],
    // Genuinely new, from this month.
    [tday(1), `000000 MERIDIAN CAPITAL PAYROLL    ${payrollStamp(tday(1))} 00000           RIVERA A ACCOUNTHOLDER`, 412_500],
    [tday(2), `ONLINE TRANSFER TO RIVERA A WAY2SAVE SAVINGS XXXXXX0000 REF #IB00000401 ON ${mmdd(tday(2))}/${String(THIS_MONTH.y).slice(2)}`, -50_000],
    [tday(3), `PURCHASE                                AUTHORIZED ON   ${mmdd(tday(2))} TAQUERIA DEL FARO        GREENWICH     CT  S000000000000403   CARD 0000`, -4_210],
    // A Zelle from somebody who is NOT in this household. It must stay ordinary
    // income: a name in a transfer memo only makes it internal if the name is on
    // the roster, and Casey has only REQUESTED to join.
    [tday(4), `ZELLE FROM CASEY MORI ON ${mmdd(tday(4))} REF #PP0000000412`, 18_000],
    [tday(5), `PURCHASE                                AUTHORIZED ON   ${mmdd(tday(4))} RIVERSIDE PHARMACY       GREENWICH     CT  S000000000000404   CARD 0000`, -3_155],
    [tday(6), `PURCHASE                                AUTHORIZED ON   ${mmdd(tday(5))} EXAMPLE COFFEE CO        GREENWICH     CT  S000000000000405   CARD 0000`, -875],
  ];

  // ── Savings.csv — the other side of the own-account transfers above ──
  const savings = [
    [pday(1), `ONLINE TRANSFER FROM RIVERA A EVERYDAY CHECKING XXXXXX0000 REF #IB00000301 ON ${mmdd(pday(1))}/${String(P.y).slice(2)}`, 60_000],
    [pday(16), "INTEREST PAYMENT", 1_842],
    [pday(20), `ONLINE TRANSFER TO RIVERA A EVERYDAY CHECKING XXXXXX0000 REF #IB00000302 ON ${mmdd(pday(20))}/${String(P.y).slice(2)}`, -15_000],
    [tday(2), `ONLINE TRANSFER FROM RIVERA A EVERYDAY CHECKING XXXXXX0000 REF #IB00000401 ON ${mmdd(tday(2))}/${String(THIS_MONTH.y).slice(2)}`, 50_000],
  ];

  return [
    { key: "checking", filename: "Checking.csv", ownerKey: "alex", memberKey: "alex", text: buildCsv(checking), seed: true },
    { key: "overlap", filename: "Checking (1).csv", ownerKey: "alex", memberKey: "alex", text: buildCsv(overlap), seed: false },
    { key: "savings", filename: "Savings.csv", ownerKey: "alex", memberKey: "alex", text: buildCsv(savings), seed: false },
  ];
}

/**
 * Turns the one seeded statement into its StatementImport header and the
 * Transaction rows beneath it.
 *
 * `source: "IMPORT"` with `status: "POSTED"` — an imported row is an ACTUAL. It
 * sits beside MANUAL, never beside FORECAST, and every total counts it exactly
 * like a typed one. `source` records only where it came from.
 */
async function generateImportedRows(statement, householdNames) {
  const userId = id("user", statement.ownerKey);
  const accountLabel = statement.filename.replace(/\.[A-Za-z0-9]+$/, "").replace(/\s*\(\d+\)\s*$/, "");
  const parsed = parseWellsFargoCsv(statement.text, { householdNames });

  const rows = parsed.rows.map((row, i) =>
    txn({
      key: `import:${statement.key}:${i}`,
      ownerKey: statement.ownerKey,
      memberKey: statement.memberKey,
      amountMinor: row.amountMinor,
      direction: row.direction,
      occurredOn: row.occurredOn,
      category: row.categoryName,
      merchant: row.merchant,
      method: row.method,
      source: "IMPORT",
      status: "POSTED",
      importKey: importKeyFor(userId, accountLabel, row.fingerprint),
      // Null on the pending rows, which is the whole point of them.
      importRef: row.statementRef,
      statementImportKey: statement.key,
      // Classified by the app's own code during the parse, from the memo.
      isInternalToUser: row.isInternalToUser,
      isInternalToFamily: row.isInternalToFamily,
    })
  );

  const days = rows.map((r) => r.occurredOn).sort();
  const header = {
    id: id("import", statement.key),
    userId,
    familyMemberId: id("member", statement.memberKey),
    accountLabel,
    filename: statement.filename,
    contentKey: await statementContentKey(userId, statement.text),
    // What the FILE held, not what came of it: the skipped lines left no row
    // behind, so nothing but this header can answer how many there were.
    rowCount: parsed.rows.length + parsed.skipped.length,
    importedRowCount: rows.length,
    skippedRowCount: parsed.skipped.length,
    earliestOccurredOn: days[0] ?? null,
    latestOccurredOn: days[days.length - 1] ?? null,
    createdAt: NOW_ISO,
  };

  return { header, rows, parsed };
}

// ---------------------------------------------------------------------------
// Assembling the whole fixture
// ---------------------------------------------------------------------------

const HOUSEHOLD_NAMES = {
  [HOUSEHOLD_A.key]: ALL_MEMBERS.filter((m) => m.household?.key === HOUSEHOLD_A.key).map((m) => m.name),
  [HOUSEHOLD_B.key]: ALL_MEMBERS.filter((m) => m.household?.key === HOUSEHOLD_B.key).map((m) => m.name),
};

async function buildFixture() {
  const notes = [];
  const transactions = [];

  for (const member of ALL_MEMBERS) transactions.push(...generateActuals(member));
  notes.push(`${MONTHS} months of actuals for ${ALL_MEMBERS.length} household members, ending today`);

  transactions.push(...generateRefunds());
  notes.push("Refunds — INCOME rows against EXPENSE categories, which is why direction is per-row");

  const projections = generateProjections();
  transactions.push(...projections.rows);
  notes.push(...projections.notes);

  const transfers = generateTransferScenarios();
  transactions.push(...transfers.rows);
  notes.push(...transfers.notes);

  // Statements last, so the imported rows sit on top of a ledger that already
  // has manual ones — which is the realistic order and the only way the
  // household's totals mix the two sources.
  const statements = buildStatements();
  const imports = [];
  for (const statement of statements.filter((s) => s.seed)) {
    const built = await generateImportedRows(statement, HOUSEHOLD_NAMES[HOUSEHOLD_A.key]);
    imports.push(built.header);
    transactions.push(...built.rows);
    notes.push(
      `Imported statement "${statement.filename}" — ${built.rows.length} rows, ` +
        `${built.parsed.skipped.length} unreadable lines skipped, 2 still pending (no reference)`
    );
  }

  return { transactions, imports, statements, notes, checks: selfCheck(transactions, statements) };
}

// ---------------------------------------------------------------------------
// Checking the fixture against the code it exists to exercise
// ---------------------------------------------------------------------------
//
// WHY A FIXTURE NEEDS ITS OWN ASSERTIONS. Every interesting row above is
// interesting because of what the app is supposed to CONCLUDE from it — that a
// bare "CASH APP" pair is an internal transfer, that a settled charge resolves
// against its pending twin, that a Zelle from somebody off the roster is
// ordinary income. None of that is visible in the rows. If a memo here stops
// matching, or a window narrows, the fixture quietly becomes an ordinary pile of
// transactions that tests nothing, and the only symptom is a screen that looks
// fine.
//
// So the claims are computed, not written down. These run on every --dry-run and
// every seed, using the app's own resolver and the app's own reconciler, and a
// claim that no longer holds is printed as a failure rather than left to be
// believed.

function selfCheck(transactions, statements) {
  const results = [];
  const assert = (label, actual, expected) =>
    results.push({ label, ok: actual === expected, actual, expected });

  // ── Internal transfers, resolved exactly as every list in the app resolves
  // them: stored flags first, then the memo, then pairing. ──
  const tokens = nameTokens(HOUSEHOLD_NAMES[HOUSEHOLD_A.key]);
  const householdA = transactions.filter((t) =>
    ACCOUNTS.concat(DEPENDENTS.map((d) => ({ key: d.key, household: HOUSEHOLD_A })))
      .filter((a) => a.household?.key === HOUSEHOLD_A.key)
      .some((a) => t.userId === id("user", a.key) || t.userId === id("user", a.ownerKey ?? a.key))
  );
  const resolved = resolveInternalTransfers(householdA, tokens);
  const flagsFor = (key) => resolved.get(id("txn", key)) ?? { isInternalToUser: false, isInternalToFamily: false };

  // The two sweeps stored with their flags UNSET must still resolve, from the
  // memo surviving in `merchant`. This is the repair case, and it is the one
  // that silently did nothing for 1,062 real rows.
  assert("unflagged own-account sweep resolves from its memo", flagsFor("xfer:stale:out").isInternalToUser, true);
  assert("...and so does its other leg", flagsFor("xfer:stale:in").isInternalToUser, true);

  // The anonymous pair can only be resolved by finding its other half, so this
  // is the one assertion that fails if PAIR_WINDOW_DAYS narrows below 2.
  assert("anonymous CASH APP pair resolves by pairing", flagsFor("xfer:cashapp:out").isInternalToFamily, true);
  assert("...and its counterpart leg too", flagsFor("xfer:cashapp:in").isInternalToFamily, true);

  // The named transfer, and the sweep that already had its flags.
  assert("named Zelle between members is internal-to-family", flagsFor("xfer:zelle:out").isInternalToFamily, true);
  assert("stored flags are kept as stored", flagsFor("xfer:sweep:out").isInternalToUser, true);

  // The decoys. A purchase must never be read as a transfer however much it
  // looks like one, and the one-legged sweep must stay internal with no partner.
  assert("a plain supermarket shop is not internal", isInternal(flagsFor("decoy:twin:a")), false);
  assert("one-legged transfer is internal with no partner", flagsFor("xfer:one-legged").isInternalToUser, true);

  // ── The Settings re-check, over exactly the population it reads. ──
  //
  // ListMyClassifiableTransactions filters `importKey: { isNull: false }`, so the
  // re-check only ever sees rows that came out of a statement. These assertions
  // run reclassify() over that same population, which is what keeps the claim
  // "the re-check repairs N rows" honest — the first version of this fixture
  // seeded those rows as MANUAL, and the button silently had nothing to do.
  const classifiable = transactions.filter((t) => t.importKey);
  const changes = reclassify(
    classifiable.map((t) => ({
      id: t.id,
      merchant: t.merchant,
      method: t.method,
      isInternalToUser: !!t.isInternalToUser,
      isInternalToFamily: !!t.isInternalToFamily,
    })),
    tokens
  );
  const changedIds = new Set(changes.map((c) => c.id));
  assert("the re-check finds the 2 unflagged sweeps", changes.length, 2);
  assert("...and one of them is the stale sweep", changedIds.has(id("txn", "xfer:stale:out")), true);
  // It must NOT touch the anonymous pair. The memo names nobody, so there is
  // nothing for a memo-based reclassification to conclude — that pair is
  // resolvable only by finding its other leg, which is pairing's job and not
  // this button's.
  assert("...and it leaves the anonymous pair alone", changedIds.has(id("txn", "xfer:cashapp:out")), false);

  results.recheck = changes.length;

  // ── The overlapping re-upload, reconciled against what was seeded. ──
  const overlap = statements.find((s) => s.key === "overlap");
  const seeded = transactions.filter((t) => t.source === "IMPORT");
  if (overlap && seeded.length) {
    const userId = id("user", "alex");
    const parsed = parseWellsFargoCsv(overlap.text, { householdNames: HOUSEHOLD_NAMES[HOUSEHOLD_A.key] });
    const keys = parsed.rows.map((r) => importKeyFor(userId, "Checking", r.fingerprint));
    const outcome = reconcileStatement(
      parsed.rows,
      keys,
      seeded.map((t) => ({
        id: t.id,
        importKey: t.importKey,
        importRef: t.importRef,
        occurredOn: t.occurredOn,
        amountMinor: t.amountMinor,
        direction: t.direction,
        merchant: t.merchant,
      }))
    );
    const basis = (name) => outcome.certain.filter((m) => m.basis === name).length;

    assert("overlap: 2 rows caught as the SAME LINE", basis("same-line"), 2);
    assert("overlap: 1 row caught by its REFERENCE alone", basis("same-reference"), 1);
    // Two, and neither is skipped: the `probable` tier cannot tell a settled
    // pending charge from a second identical purchase, so it reports and a person
    // decides. Defaulting these to skipped drops real transactions.
    assert("overlap: 2 rows only PROBABLE, awaiting a person", outcome.probable.length, 2);
    assert("overlap: the rest are genuinely new", outcome.fresh.length, parsed.rows.length - 3 - 2);

    // The off-roster Zelle. A name in a transfer memo is only evidence if the
    // name is on the roster, and Casey has merely asked to join.
    const casey = parsed.rows.find((r) => /CASEY/.test(r.merchant ?? ""));
    assert("a Zelle from a NON-member stays ordinary income", casey ? isInternal(casey) : null, false);

    results.tiers = {
      sameLine: basis("same-line"),
      sameReference: basis("same-reference"),
      probable: outcome.probable.length,
      fresh: outcome.fresh.length,
    };
  }

  return results;
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

let dc;

/** Runs one GraphQL document and turns a GraphQL-level error into a throw. */
async function gql(document, variables) {
  const result = await dc.executeGraphql(document, variables ? { variables } : undefined);
  if (result.errors?.length) {
    throw new Error(result.errors.map((e) => e.message ?? String(e)).join("\n  "));
  }
  return result.data;
}

const step = (label) => process.stdout.write(`  ${label} ... `);
const done = (detail = "ok") => console.log(detail);

/**
 * The reference data `npm run seed` loads, run here too.
 *
 * Not a convenience: UserType and Category are foreign key targets for
 * everything below, and ColorScheme is what the seeded UserSetting rows point
 * at. Depending on somebody having run the other script first would make this
 * one fail with a foreign key violation on a fresh emulator, which says nothing
 * about the actual cause.
 */
async function seedReferenceData() {
  const document = readFileSync(join(ROOT, "dataconnect", "seed_data.gql"), "utf8");
  for (const operationName of ["SeedUserTypes", "SeedFeatures", "SeedColorSchemes", "SeedCategories"]) {
    step(operationName);
    const result = await dc.executeGraphql(document, { operationName });
    if (result.errors?.length) {
      throw new Error(`${operationName}: ${result.errors.map((e) => e.message).join("; ")}`);
    }
    done();
  }

  // The richer category set, plus every name the statement parser can guess.
  //
  // READ FIRST, THEN WRITE ONLY WHAT IS MISSING — and that is not a nicety.
  // Data Connect builds one column list per upsertMany batch, so every row in
  // the batch has to state every column; a batch that states `color: null` to
  // stay uniform OVERWRITES the colour of anything already there. Writing the
  // whole list blind wiped the colours SeedCategories had just set and reset
  // Salary and Interest to kind "EXPENSE", which is how the category pickers
  // came to group income under spending. Diffing first is what makes this
  // idempotent, and it is what ensureCategoriesExist does at import time for the
  // same reason.
  step("Categories (extra + guessable)");
  const known = new Set(
    (await gql(`query{ categories(limit:200){ name } }`)).categories.map((c) => c.name)
  );
  const wanted = [
    ...EXTRA_CATEGORIES,
    // Every name guessCategory() can return, so a guessed category always has a
    // row to point at — Transaction.categoryName is a foreign key into a table
    // keyed on name, and a missing one fails the whole import.
    //
    // ONE DELIBERATE DIVERGENCE FROM THE APP. ensureCategoriesExist writes a
    // name and nothing else, so a real import leaves these at the "EXPENSE"
    // column default even for "Transfers In". That is harmless — `kind` is the
    // category's default side, not a constraint, and Transaction.direction is
    // the authoritative per-row answer — but it reads as a bug in a fixture
    // somebody is using to judge the pickers. So the unambiguous ones are given
    // their real side here.
    ...GUESSABLE_CATEGORIES.map((name) => ({
      name,
      kind: ["Deposits", "Refunds", "Transfers In", "Interest", "Salary"].includes(name)
        ? "INCOME"
        : "EXPENSE",
      parentGroup: null,
      // Left uncoloured on purpose: the name-derived fallback in
      // lib/entityColor.ts is the path every imported category takes, so the
      // fixture should take it too.
      color: null,
    })),
  ];
  const missing = wanted.filter((c) => !known.has(c.name));
  if (missing.length) {
    await gql(`mutation($rows:[Category_Data!]!){ category_upsertMany(data:$rows) }`, { rows: missing });
  }
  done(`${missing.length} added, ${wanted.length - missing.length} already present`);
}

/**
 * Emulator Auth accounts, linked to the google.com provider.
 *
 * importUsers() rather than createUser(), for one reason that matters: it is the
 * only Admin SDK call that takes BOTH a fixed uid and providerData. The uid has
 * to be fixed because `User.googleUid` is seeded against it — if the emulator
 * chose the uid, wiping only the Auth emulator would leave every seeded row
 * pointing at an account that no longer exists, and the next sign-in would
 * create a second, empty User row instead of finding its data.
 *
 * The provider link has to be there because lib/auth.ts signs in with
 * signInWithPopup(GoogleAuthProvider) and nothing else. An account with only a
 * password is not offered by the emulator's Google popup, so it would be seeded
 * and unreachable.
 *
 * importUsers REFUSES to overwrite a uid that exists ("localId belongs to an
 * existing account"), so this is an existence check followed by an import of
 * whatever is missing rather than a blanket write. That keeps a re-run from
 * failing, and — more usefully — keeps it from signing you out: deleting and
 * recreating an account invalidates the session in the browser tab you are
 * already looking at.
 */
function hasGoogleProvider(user) {
  return user.providerData.some((p) => p.providerId === "google.com");
}

async function seedAuthAccounts() {
  const auth = getAuth();
  step("Auth emulator accounts");

  const missing = [];
  let kept = 0;
  let relinked = 0;
  for (const account of ACCOUNTS) {
    let existing = null;
    try {
      existing = await auth.getUser(account.uid);
    } catch (err) {
      if (err.code !== "auth/user-not-found") throw err;
    }
    if (existing && hasGoogleProvider(existing)) {
      kept++;
      continue;
    }
    if (existing) {
      // There by uid but with no Google identity on it, so the sign-in popup
      // will not offer it. providerData can only be set by importUsers, which
      // will not touch an existing uid — so the repair is to remove it first.
      // Only ever reached for an account in this script's own fixed uid list.
      await auth.deleteUser(account.uid);
      relinked++;
    }
    missing.push(account);
  }

  if (missing.length) {
    const result = await auth.importUsers(
      missing.map((a) => ({
        uid: a.uid,
        email: a.email,
        emailVerified: true,
        displayName: a.name,
        providerData: [
          { uid: `${a.uid}-google`, providerId: "google.com", email: a.email, displayName: a.name },
        ],
      }))
    );
    if (result.failureCount) {
      throw new Error(
        `could not import ${result.failureCount} auth account(s): ` +
          result.errors.map((e) => `${e.index}: ${e.error.message}`).join("; ")
      );
    }
  }

  const detail = [
    missing.length - relinked ? `${missing.length - relinked} created` : null,
    relinked ? `${relinked} re-linked` : null,
    kept ? `${kept} already present` : null,
  ].filter(Boolean);
  done(detail.join(", "));
}

async function seedPeople() {
  // Users first, with no household: Family.ownerUser is a required reference to
  // a User, and User.family is a reference back, so the two cannot be written in
  // one pass. Users, then families, then the link.
  step("User rows");
  await gql(
    `mutation($rows:[User_Data!]!){ user_upsertMany(data:$rows) }`,
    {
      rows: ACCOUNTS.map((a) => ({
        id: id("user", a.key),
        googleUid: a.uid,
        username: a.name,
        email: a.email,
        userTypeName: a.tier,
        createdAt: NOW_ISO,
      })),
    }
  );
  done(`${ACCOUNTS.length} accounts`);

  // Settings written immediately after, because a User without its UserSetting
  // is the shape in which every preference silently fails to save —
  // `userSetting_update` matching zero rows REPORTS SUCCESS. The app upholds
  // this by nesting the insert inside CreateUserFromGoogle; this script upholds
  // it by writing both before anything else runs.
  step("UserSetting rows");
  await gql(
    `mutation($rows:[UserSetting_Data!]!){ userSetting_upsertMany(data:$rows) }`,
    {
      rows: ACCOUNTS.map((a) => ({
        id: id("setting", a.key),
        userId: id("user", a.key),
        colorSchemeId: a.settings.colorSchemeId ?? null,
        performanceMode: false,
        backgroundOpacity: 100,
        cardOpacity: 100,
        cardBlur: 0,
        bordersEnabled: true,
        categoryColorsEnabled: true,
        squareCorners: false,
        currencyCode: "USD",
        hideWeekends: a.settings.hideWeekends ?? false,
        showInternalTransfers: a.settings.showInternalTransfers ?? true,
        privacyMode: a.settings.privacyMode ?? false,
        // Set for the one household, so the "open this account at the bank"
        // link has a template to build on and the members carrying an
        // externalAccountRef render a link rather than nothing.
        externalAccountLinkTemplate:
          a.household?.key === HOUSEHOLD_A.key
            ? "https://example.invalid/accounts/{account_id}"
            : null,
        updatedAt: NOW_ISO,
      })),
    }
  );
  done();

  step("Households");
  await gql(
    `mutation($rows:[Family_Data!]!){ family_upsertMany(data:$rows) }`,
    {
      rows: [HOUSEHOLD_A, HOUSEHOLD_B].map((h) => ({
        id: id("family", h.key),
        name: h.name,
        inviteCode: h.inviteCode,
        ownerUserId: id("user", h.ownerKey),
        createdAt: NOW_ISO,
      })),
    }
  );
  done("2 households");

  step("Household membership");
  for (const household of [HOUSEHOLD_A, HOUSEHOLD_B]) {
    const ids = ACCOUNTS.filter((a) => a.household?.key === household.key).map((a) => id("user", a.key));
    await gql(
      `mutation($ids:[UUID!]!,$familyId:UUID!){
         user_updateMany(where:{ id:{ in:$ids } }, data:{ familyId:$familyId })
       }`,
      { ids, familyId: id("family", household.key) }
    );
  }
  done();

  // Every account's own entry in its own household, plus the people who do not
  // sign in. `user` is the OWNER; `selfUser` is WHO IT IS. They coincide on the
  // self row and nowhere else, and `selfUser` is @unique — so the "exactly one
  // self entry per account" rule is the database's, not this script's.
  step("Household members");
  const members = [
    ...ACCOUNTS.map((a) => ({
      id: id("member", a.key),
      userId: id("user", a.key),
      selfUserId: id("user", a.key),
      name: a.name,
      // Stamped "Self" exactly as CreateUserFromGoogle does. Which is itself the
      // reason lib/householdRole.ts exists: two accounts in one household both
      // carry it, so the label shown has to be derived per viewer rather than
      // read off the column.
      relationship: a.member.relationship,
      color: a.member.color,
      externalAccountRef: a.household ? `${a.key}-0001` : null,
      monthlyIncomeTargetMinor: a.member.monthlyIncomeTargetMinor,
      isDeleted: false,
      createdAt: NOW_ISO,
    })),
    ...DEPENDENTS.map((d) => ({
      id: id("member", d.key),
      userId: id("user", d.ownerKey),
      // Null, and null is the normal case: everybody else in a household is
      // somebody who does not sign in.
      selfUserId: null,
      name: d.name,
      relationship: d.relationship,
      color: d.color,
      externalAccountRef: null,
      monthlyIncomeTargetMinor: d.monthlyIncomeTargetMinor,
      isDeleted: d.isDeleted,
      createdAt: NOW_ISO,
    })),
  ];
  await gql(`mutation($rows:[FamilyMember_Data!]!){ familyMember_upsertMany(data:$rows) }`, { rows: members });
  done(`${members.length} members (1 soft-deleted, with history)`);

  // Join requests. The APPROVED ones are not decoration — the row is kept after
  // approval on purpose, so a household has an audit trail of who joined when,
  // and a fixture with only a pending request would not show that.
  step("Join requests");
  const requests = [
    ...ACCOUNTS.filter((a) => a.household && a.key !== a.household.ownerKey).map((a) => ({
      familyId: id("family", a.household.key),
      requesterId: id("user", a.key),
      status: "APPROVED",
      createdAt: NOW_ISO,
      decidedAt: NOW_ISO,
    })),
    ...ACCOUNTS.filter((a) => a.requestsJoinTo).map((a) => ({
      familyId: id("family", a.requestsJoinTo.key),
      requesterId: id("user", a.key),
      status: "PENDING",
      createdAt: NOW_ISO,
      decidedAt: null,
    })),
  ];
  await gql(`mutation($rows:[FamilyJoinRequest_Data!]!){ familyJoinRequest_upsertMany(data:$rows) }`, { rows: requests });
  done(`${requests.length} (${requests.filter((r) => r.status === "PENDING").length} pending)`);
}

async function seedMoney({ transactions, imports }) {
  if (imports.length) {
    step("Statement import headers");
    await gql(`mutation($rows:[StatementImport_Data!]!){ statementImport_upsertMany(data:$rows) }`, { rows: imports });
    done(`${imports.length}`);
  }

  const batches = chunk(transactions, CHUNK_SIZE);
  for (const [i, batch] of batches.entries()) {
    step(`Transactions ${i + 1}/${batches.length}`);
    await gql(`mutation($rows:[Transaction_Data!]!){ transaction_upsertMany(data:$rows) }`, { rows: batch });
    done(`${batch.length} rows`);
  }
}

/**
 * Deletes everything this script wrote, and nothing else.
 *
 * Scoped to the seeded accounts' own ids throughout — no filter here can reach a
 * row somebody entered by hand.
 *
 * ORDER IS THE WHOLE THING. Transaction.statementImport is nullable, so Data
 * Connect makes it ON DELETE SET NULL: deleting the header first clears the
 * pointer on every row instead of removing them, and then nothing but the
 * importKeys can find them again. Rows, then header. Families come after the
 * members and settings for the same class of reason — Family.ownerUser is
 * non-null, which makes it ON DELETE CASCADE in the other direction.
 */
async function resetFixture() {
  const userIds = ACCOUNTS.map((a) => id("user", a.key));
  console.log("\n\x1b[1mResetting the stress-test accounts\x1b[0m");

  const deletes = [
    ["Transactions", `transaction_deleteMany(where:{ userId:{ in:$ids } })`],
    ["Statement imports", `statementImport_deleteMany(where:{ userId:{ in:$ids } })`],
    ["Join requests", `familyJoinRequest_deleteMany(where:{ requesterId:{ in:$ids } })`],
    ["Household members", `familyMember_deleteMany(where:{ userId:{ in:$ids } })`],
    ["Settings", `userSetting_deleteMany(where:{ userId:{ in:$ids } })`],
    // Unlink before dropping the households, so the cascade has nothing left to
    // reach and the delete is a plain one.
    ["Household links", `user_updateMany(where:{ id:{ in:$ids } }, data:{ familyId:null })`],
    ["Households", `family_deleteMany(where:{ ownerUserId:{ in:$ids } })`],
    ["Users", `user_deleteMany(where:{ id:{ in:$ids } })`],
  ];

  for (const [label, field] of deletes) {
    step(label);
    const data = await gql(`mutation($ids:[UUID!]!){ ${field} }`, { ids: userIds });
    done(`${Object.values(data)[0]} rows`);
  }

  const auth = getAuth();
  step("Auth accounts");
  let removed = 0;
  for (const account of ACCOUNTS) {
    try {
      await auth.deleteUser(account.uid);
      removed++;
    } catch (err) {
      if (err.code !== "auth/user-not-found") throw err;
    }
  }
  done(`${removed} removed`);
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

function summarize({ transactions, imports, statements, notes, checks }) {
  const by = (fn) => {
    const counts = new Map();
    for (const t of transactions) counts.set(fn(t), (counts.get(fn(t)) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };
  const posted = transactions.filter((t) => t.status === "POSTED");
  const sum = (rows, direction) =>
    rows.filter((r) => r.direction === direction).reduce((n, r) => n + r.amountMinor, 0);
  const money = (minor) => `$${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  console.log(`\n${bold("What this builds")}`);
  console.log(`  ${transactions.length} transactions across ${MONTHS} months ` +
    `(${MONTH_CURSORS[0].y}-${pad(MONTH_CURSORS[0].m + 1)} to ${THIS_MONTH.y}-${pad(THIS_MONTH.m + 1)}), seed=${RNG_SEED}`);
  console.log(`  ${ACCOUNTS.length} accounts, 2 households, ` +
    `${ACCOUNTS.length + DEPENDENTS.length} household members, ${imports.length} statement import(s)`);
  console.log(dim(`  by status:    ${by((t) => t.status).map(([k, v]) => `${k} ${v}`).join(", ")}`));
  console.log(dim(`  by source:    ${by((t) => t.source).map(([k, v]) => `${k} ${v}`).join(", ")}`));
  console.log(dim(`  recurring:    ${transactions.filter((t) => t.recurrence).length} rules ` +
    `(${transactions.filter((t) => t.recurrence && !t.recurrenceEndsOn).length} indefinite)`));
  console.log(dim(`  transfers:    ${transactions.filter((t) => t.isInternalToUser).length} internal-to-user, ` +
    `${transactions.filter((t) => t.isInternalToFamily).length} internal-to-family flagged, ` +
    `${transactions.filter((t) => /CASH APP|ONLINE TRANSFER/.test(t.merchant ?? "") && !t.isInternalToUser && !t.isInternalToFamily).length} deliberately unflagged`));
  console.log(dim(`  no category:  ${transactions.filter((t) => !t.categoryName).length}`));
  console.log(dim(`  posted money: ${money(sum(posted, "INCOME"))} in, ${money(sum(posted, "EXPENSE"))} out ` +
    `(before any transfer exclusion)`));

  console.log(`\n${bold("States it puts on screen")} ${dim("— each of these was worth a row")}`);
  for (const note of notes) console.log(`  · ${note}`);

  if (checks?.length) {
    const failed = checks.filter((c) => !c.ok);
    console.log(`\n${bold("Self-check")} ${dim("— run against the app's own resolver and reconciler")}`);
    for (const c of failed) {
      console.log(`  \x1b[31m✗ ${c.label}\x1b[0m  ${dim(`expected ${c.expected}, got ${c.actual}`)}`);
    }
    if (failed.length === 0) {
      console.log(`  \x1b[32m✓\x1b[0m all ${checks.length} claims hold`);
    } else {
      console.log(dim(`  ${checks.length - failed.length}/${checks.length} hold. A failure here means the FIXTURE no longer`));
      console.log(dim("  exercises what it was built to exercise — not that the app is broken."));
    }
  }

  console.log(`\n${bold("Statement files")} ${dim("— transaction_data/stress-test/")}`);
  for (const s of statements) {
    const lines = s.text.trimEnd().split("\r\n").length - 1;
    console.log(`  ${s.filename.padEnd(18)} ${String(lines).padStart(2)} lines  ` +
      (s.seed ? dim("seeded — re-uploading it is refused by contentKey") : dim("upload this one")));
  }
}

function printWhereToLook(checks) {
  console.log(`\n${bold("Sign in")}`);
  console.log("  Click \x1b[4mSign in with Google\x1b[0m. The emulator's popup lists these accounts —");
  console.log("  pick one; no password, and nothing contacts Google.\n");
  const width = Math.max(...ACCOUNTS.map((a) => a.email.length));
  for (const a of ACCOUNTS) {
    const where = a.household
      ? a.household.name
      : a.requestsJoinTo
        ? `no household — PENDING request at ${a.requestsJoinTo.name}`
        : "no household — lands in onboarding";
    console.log(`  ${a.email.padEnd(width)}  ${a.tier.padEnd(7)} ${where}`);
  }
  console.log(`\n  Invite codes: ${HOUSEHOLD_A.inviteCode} (${HOUSEHOLD_A.name})`);
  console.log(`                ${HOUSEHOLD_B.inviteCode} (${HOUSEHOLD_B.name})`);

  console.log(`\n${bold("Worth opening first")}`);
  console.log(`  ${dim("/household")}             Alex's panel: a year of rows, the breakdown, the month picker`);
  console.log(`  ${dim("/income, /expenses")}    one component pointed at opposite directions`);
  console.log(`  ${dim("/calendar")}             projections and actuals on the same grid; sign in as Sam for a weekend-less one`);
  console.log(`  ${dim("navbar toggles")}        "ignore internal transfers" moves four screens at once, and says by how much`);
  console.log(`  ${dim("/settings")}             roster, the invite code, Casey's pending request, and the transfer re-check`);
  console.log(`  ${dim("import dialog")}         upload "Checking (1).csv" — all three reconcile tiers in one file`);

  console.log(`\n${bold("The two repairs that should do something")}`);
  const n = checks?.recheck ?? 0;
  console.log(`  Settings → re-check internal transfers: ${n} imported rows are seeded with`);
  console.log("  their flags UNSET although their memos classify — the state a household that");
  console.log("  imported before those columns existed is in. The re-check fixes those, and is");
  console.log("  idempotent: run it twice and the second run reports nothing.");
  console.log("");
  console.log("  It must NOT touch the \"CASH APP\" pair, whose memo names nobody. That pair is");
  console.log("  resolvable only by finding its other leg, which happens at read time — so it");
  console.log("  reads as internal in the ledger while its stored columns stay false.");
  console.log("");
  const t = checks?.tiers;
  if (t) {
    console.log(`  Upload "Checking (1).csv": ${t.sameLine} rows match by line, ${t.sameReference} by reference,`);
    console.log(`  ${t.probable} are only PROBABLE and wait for you to decide, and ${t.fresh} are new. The`);
    console.log("  probable pair is a pending charge that has since settled — the commonest real");
    console.log("  duplicate, and the one a fingerprint cannot catch. Nothing skips it for you.");
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const fixture = await buildFixture();

  if (DRY_RUN) {
    summarize(fixture);
    console.log(`\n${bold("--dry-run")}: nothing was written and no emulator call was made.`);
    console.log("Drop --dry-run to seed it.");
    return;
  }

  console.log(`\n${bold(`Seeding the stress-test fixture into the emulators`)} ${dim(`(project ${PROJECT})`)}`);

  initializeApp({ projectId: PROJECT });
  dc = getDataConnect(CONNECTOR_CONFIG);

  if (RESET) await resetFixture();

  console.log(`\n${bold("Reference data")}`);
  await seedReferenceData();

  console.log(`\n${bold("Accounts and households")}`);
  await seedAuthAccounts();
  await seedPeople();

  console.log(`\n${bold("Money")}`);
  await seedMoney(fixture);

  if (!SKIP_CSV) {
    console.log(`\n${bold("Statement files")}`);
    mkdirSync(STATEMENT_DIR, { recursive: true });
    for (const statement of fixture.statements) {
      step(statement.filename);
      writeFileSync(join(STATEMENT_DIR, statement.filename), statement.text, "utf8");
      done();
    }
    // transaction_data/ is gitignored precisely so that real exports cannot be
    // committed by accident; these land in a subdirectory of it so they never
    // mix with somebody's own files.
    console.log(dim(`  -> ${STATEMENT_DIR.replace(ROOT + "/", "")}/ (gitignored)`));
  }

  summarize(fixture);
  printWhereToLook(fixture.checks);
  console.log("");
}

main().catch((err) => {
  console.error(`\n\x1b[31m${err instanceof Error ? err.stack ?? err.message : err}\x1b[0m`);
  console.error(
    "\nSeeding stopped. The usual causes:\n" +
      "  · the emulators are not running        -> npm run emulators\n" +
      "  · a statement line now fingerprints differently, so an old row holds its\n" +
      "    importKey (which is @unique)         -> npm run seed:stress:reset\n" +
      "  · the schema changed since the last generate -> npm run dataconnect:generate"
  );
  process.exit(1);
});
