// Adversarial test of the authorization boundary, run against the emulators.
//
// WHY THIS EXISTS AS A SCRIPT RATHER THAN A VITEST FILE. What it checks lives
// in the database, not in TypeScript: @auth levels, the `@check` expressions
// in dataconnect/finance/mutations.gql, and the correlated-EXISTS visibility
// filter in queries.gql. None of that is reachable from a unit test, because
// none of it runs in this process — a mocked Data Connect would only ever
// confirm that the mock agrees with itself. The guards are only real when a
// real connector evaluates them against a real token, so this drives the
// emulator over HTTP with three separately-minted identities and tries to
// break in.
//
// It exists because the interesting failure mode here is silent. A missing
// @check does not throw, it permits; a too-wide filter does not error, it
// returns somebody else's money. Both look exactly like success.
//
// Run it after any change to mutations.gql, queries.gql or schema.gql:
//
//   npm run emulators          # terminal 1
//   npm run verify:guards      # terminal 2
//
// Idempotent — every run mints fresh accounts and fresh invite codes, so it
// can be run as many times as you like against the same emulator data.
//
// SAFETY: refuses to run unless both emulator hosts point at localhost. It
// creates users and households and deliberately attempts cross-tenant
// writes, so there must be no path to it touching a real project.

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { getDataConnect } from "firebase-admin/data-connect";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Pick up .env.local the way `next dev` does, so this runs as a bare npm
// script. Mirrors scripts/seed.mjs — see the CommonJS note there.
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

if (!LOCAL.test(dcHost) || !LOCAL.test(authHost)) {
  console.error(
    "Refusing to run: both emulator hosts must point at localhost.\n" +
      `  DATA_CONNECT_EMULATOR_HOST: ${dcHost || "(unset)"}\n` +
      `  FIREBASE_AUTH_EMULATOR_HOST: ${authHost || "(unset)"}\n\n` +
      "Start the emulators first (npm run emulators), then: npm run verify:guards"
  );
  process.exit(1);
}

const PROJECT = process.env.FIREBASE_PROJECT_ID ?? "ecs-finance-tracker-app";
const SERVICE = "finance-tracker-app-service";
const LOCATION = "us-east4";
const AUTH = `http://${authHost.replace(/^https?:\/\//, "")}`;
const CONNECTOR =
  `http://${dcHost.replace(/^https?:\/\//, "")}` +
  `/v1/projects/${PROJECT}/locations/${LOCATION}/services/${SERVICE}/connectors/finance`;

initializeApp({ projectId: PROJECT });
const admin = getDataConnect({ connector: "finance", serviceId: SERVICE, location: LOCATION });

let pass = 0;
let fail = 0;
const ok = (m) => { console.log(`  \x1b[32m✓\x1b[0m ${m}`); pass++; };
const bad = (m, d) => { console.log(`  \x1b[31m✗ ${m}\x1b[0m${d ? `\n      ${d}` : ""}`); fail++; };

// Invite codes are @unique, so fixed literals would make the SECOND run fail
// on a collision rather than on a real defect. Fresh every run.
let codeSeq = 0;
const code = () =>
  `T${Date.now().toString(36).toUpperCase()}${(codeSeq++).toString(36).toUpperCase()}`.slice(0, 10);

// The connector is driven over raw HTTP with an X-Firebase-Auth-Token header
// — the same header the client SDK sends — rather than through the generated
// SDK. That is the point: the generated SDK would happily be pointed at an
// admin context, and admin bypasses @auth entirely, which is precisely what
// must NOT be tested here.
async function call(kind, token, operationName, variables = {}) {
  const res = await fetch(`${CONNECTOR}:${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Firebase-Auth-Token": token },
    body: JSON.stringify({ operationName, variables }),
  });
  const body = await res.json().catch(() => ({}));
  // A denied operation comes back either as GraphQL `errors` or, for an @auth
  // rejection, as a top-level status object. Both are denials.
  const errors = body.errors ?? (body.code ? [{ message: body.message }] : []);
  return { data: body.data, errors: errors.length ? errors : null };
}
const query = (t, n, v) => call("executeQuery", t, n, v);
const mutate = (t, n, v) => call("executeMutation", t, n, v);

const firstLine = (e) => String(e?.message ?? e).split("\n")[0].slice(0, 72);

async function mustFail(label, promise) {
  const r = await promise;
  if (r.errors) ok(`${label}\n      └─ denied: ${firstLine(r.errors[0])}`);
  else bad(`${label} — WAS ALLOWED`, JSON.stringify(r.data));
}
async function mustPass(label, promise) {
  const r = await promise;
  if (r.errors) bad(label, firstLine(r.errors[0]));
  else ok(label);
  return r;
}

/** Mints a real Auth-emulator identity and its User row, and reads back the
 *  settings row that CreateUserFromGoogle is supposed to have nested. */
async function mkUser(tag) {
  const email = `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password123", returnSecureToken: true }),
  });
  const acct = await res.json();
  if (!acct.idToken) throw new Error(`could not mint ${tag}: ${JSON.stringify(acct)}`);

  // Admin-side, because CreateUserFromGoogle is @auth(level: NO_ACCESS) —
  // exactly as app/api/auth/sync-user/route.ts calls it.
  // Mirrors CreateUserFromGoogle, which creates three rows in one
  // transaction: the User, its settings, and its own entry in its household.
  const userId = randomUUID();
  await admin.executeGraphql(
    `mutation($id:UUID!,$fm:UUID!,$g:String!,$u:String!,$e:String!,$c:Timestamp!){
       userType_upsert(data:{name:"Regular"})
       user_insert(data:{id:$id,googleUid:$g,username:$u,email:$e,userTypeName:"Regular",createdAt:$c,userSetting_on_user:{}})
       familyMember_insert(data:{id:$fm,userId:$id,selfUserId:$id,name:$u,relationship:"Self"})
     }`,
    { variables: { id: userId, fm: randomUUID(), g: acct.localId, u: tag, e: email, c: new Date().toISOString() } }
  );
  const row = await admin.executeGraphql(
    `query($g:String!){ user(first:{where:{googleUid:{eq:$g}}}){
       id
       userSetting: userSetting_on_user { id currencyCode backgroundOpacity bordersEnabled }
       selfMember: familyMember_on_selfUser { id name relationship } } }`,
    { variables: { g: acct.localId } }
  );
  const user = row.data.user;
  return {
    tag,
    token: acct.idToken,
    uid: acct.localId,
    id: user.id,
    setting: user.userSetting,
    selfMember: user.selfMember,
  };
}

/** An account with ONLY its User row — the shape sync-user has to repair. */
async function mkBareUser(tag) {
  const email = `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password123", returnSecureToken: true }),
  });
  const acct = await res.json();
  await admin.executeGraphql(
    `mutation($g:String!,$u:String!,$e:String!,$c:Timestamp!){
       userType_upsert(data:{name:"Regular"})
       user_insert(data:{googleUid:$g,username:$u,email:$e,userTypeName:"Regular",createdAt:$c})
     }`,
    { variables: { g: acct.localId, u: tag, e: email, c: new Date().toISOString() } }
  );
  return { tag, token: acct.idToken, uid: acct.localId };
}

async function provisioningOf(googleUid) {
  const r = await admin.executeGraphql(
    `query($g:String!){ user(first:{where:{googleUid:{eq:$g}}}){
       id
       userSetting: userSetting_on_user { id }
       selfMember: familyMember_on_selfUser { id name } } }`,
    { variables: { g: googleUid } }
  );
  return r.data.user;
}

// Data Connect returns UUIDs with the hyphens stripped (see the caveat in
// hooks/useFamilyMembers.ts), so ids coming back from a read never compare
// equal to the hyphenated ones we sent.
const sameId = (a, b) => String(a).replace(/-/g, "") === String(b).replace(/-/g, "");

console.log("\n\x1b[1m1 · A User cannot exist without its settings row\x1b[0m");
const alice = await mkUser("alice");
const bob = await mkUser("bob");
const carol = await mkUser("carol");
for (const u of [alice, bob, carol]) {
  if (u.setting?.id) {
    ok(`${u.tag}: settings row created (currency=${u.setting.currencyCode}, ` +
       `opacity=${u.setting.backgroundOpacity}, borders=${u.setting.bordersEnabled})`);
  } else {
    bad(`${u.tag}: NO settings row — CreateUserFromGoogle lost its nested insert`);
  }
  if (u.selfMember?.id) {
    ok(`${u.tag}: appears in their own household as "${u.selfMember.name}" (${u.selfMember.relationship})`);
  } else {
    bad(`${u.tag}: NO self household entry — they would open on an empty sidebar`);
  }
}

console.log("\n\x1b[1m2 · Preference writes actually persist\x1b[0m");
// The regression this guards: userSetting_update(first:{where:...}) matching
// zero rows reports SUCCESS. Asserting the mutation resolved proves nothing;
// only the read-back does.
await mustPass("alice sets squareCorners", mutate(alice.token, "SelectMySquareCorners", { squareCorners: true }));
const readBack = await query(alice.token, "GetMyUser");
readBack.data?.user?.userSetting?.squareCorners === true
  ? ok("…and reads back true (this silently no-opped before the nested insert)")
  : bad("…but did not persist", JSON.stringify(readBack.data?.user?.userSetting));

console.log("\n\x1b[1m3 · Creating a household\x1b[0m");
const familyId = randomUUID();
const CODE = code();
await mustPass("alice creates a household",
  mutate(alice.token, "CreateFamily", { userId: alice.id, familyId, name: "The Alices", inviteCode: CODE }));
await mustFail("alice creates a SECOND household while already in one",
  mutate(alice.token, "CreateFamily", { userId: alice.id, familyId: randomUUID(), name: "Dupe", inviteCode: code() }));
await mustFail("carol creates a household owned by alice",
  mutate(carol.token, "CreateFamily", { userId: alice.id, familyId: randomUUID(), name: "Hijack", inviteCode: code() }));
// alice is rejected by the `family == null` clause as much as by identity, so
// dave — who is in no household — isolates the googleUid half: the actual
// privilege escalation.
const dave = await mkUser("dave");
await mustFail("carol creates a household owned by dave (who is in none)",
  mutate(carol.token, "CreateFamily", { userId: dave.id, familyId: randomUUID(), name: "Hijack2", inviteCode: code() }));
await mustFail("carol asks to join, naming dave as the requester",
  mutate(carol.token, "RequestToJoinFamily", { userId: dave.id, familyId }));

console.log("\n\x1b[1m4 · Approval — the guards where absence must mean denial\x1b[0m");
// THE one that motivated the top-level `this != null`: the guard reads a
// FamilyJoinRequest but the write lands on a User named by a different
// variable. With no row, the nested checks never evaluate against anything,
// and an unguarded write would drag any account into carol's reach.
await mustFail("carol approves a request THAT DOES NOT EXIST, admitting herself",
  mutate(carol.token, "ApproveJoinRequest", { familyId, requesterId: carol.id }));
await mustPass("bob asks to join", mutate(bob.token, "RequestToJoinFamily", { userId: bob.id, familyId }));
await mustFail("carol (not the owner) approves bob",
  mutate(carol.token, "ApproveJoinRequest", { familyId, requesterId: bob.id }));
await mustFail("bob approves himself",
  mutate(bob.token, "ApproveJoinRequest", { familyId, requesterId: bob.id }));
await mustPass("alice (owner) approves bob",
  mutate(alice.token, "ApproveJoinRequest", { familyId, requesterId: bob.id }));
await mustFail("alice replays the now-APPROVED request",
  mutate(alice.token, "ApproveJoinRequest", { familyId, requesterId: bob.id }));

const bobsUser = await query(bob.token, "GetMyUser");
sameId(bobsUser.data?.user?.family?.id, familyId)
  ? ok("bob is in the household")
  : bad("bob is not in the household", JSON.stringify(bobsUser.data?.user?.family));

console.log("\n\x1b[1m5 · Reads widen to the household; outsiders see nothing\x1b[0m");
const memberId = randomUUID();
await mustPass("alice adds a household member",
  mutate(alice.token, "CreateFamilyMember", { userId: alice.id, familyMemberId: memberId, name: "Alice's Kid" }));
await mustPass("alice records a transaction", mutate(alice.token, "CreateTransaction", {
  userId: alice.id, familyMemberId: memberId, amountMinor: 12345, direction: "EXPENSE",
  occurredOn: "2026-09-01", createdAt: new Date().toISOString(), description: "Groceries",
}));

const bobMembers = await query(bob.token, "ListFamilyMembers");
(bobMembers.data?.familyMembers ?? []).some((f) => f.name === "Alice's Kid")
  ? ok("bob (same household) sees alice's household member")
  : bad("bob cannot see alice's household member", JSON.stringify(bobMembers.data ?? bobMembers.errors));

const bobTx = await query(bob.token, "ListMyTransactions");
(bobTx.data?.transactions ?? []).some((t) => t.description === "Groceries")
  ? ok("bob sees alice's transaction")
  : bad("bob cannot see alice's transaction", JSON.stringify(bobTx.data ?? bobTx.errors));

// Carol is not in alice's household, but she is in her OWN — every account
// now has a self entry — so "sees nothing" is the wrong assertion. What must
// hold is that she sees only rows she owns, and none of alice's.
const carolMembers = await query(carol.token, "ListFamilyMembers");
const carolRoster = carolMembers.data?.familyMembers ?? [];
carolRoster.every((m) => sameId(m.user?.id, carol.id))
  ? ok(`carol (outsider) sees only her own roster (${carolRoster.length} row)`)
  : bad("LEAK: carol sees rows she does not own", JSON.stringify(carolRoster));
carolRoster.some((m) => m.name === "Alice's Kid")
  ? bad("LEAK: carol sees alice's household member", JSON.stringify(carolRoster))
  : ok("...and none of alice's");

const carolTx = await query(carol.token, "ListMyTransactions");
(carolTx.data?.transactions ?? []).length === 0
  ? ok("carol (outsider) sees no transactions")
  : bad("LEAK: carol sees transactions", JSON.stringify(carolTx.data));

// GetTransaction took a raw id with no ownership predicate at all until the
// fix in queries.gql. Nothing in the UI calls it; that never made it
// unreachable.
const txId = (bobTx.data?.transactions ?? []).find((t) => t.description === "Groceries")?.id;
if (txId) {
  const direct = await query(carol.token, "GetTransaction", { transactionId: txId });
  direct.data?.transaction == null
    ? ok("carol cannot read alice's transaction by id")
    : bad("LEAK: carol read alice's transaction by id", JSON.stringify(direct.data));
} else {
  bad("could not resolve a transaction id to probe GetTransaction with");
}

console.log("\n\x1b[1m6 · An insert cannot be stamped with somebody else's ownership\x1b[0m");
// The owner of a new row arrives as a plain $userId variable, with no
// existing row whose ownership looks like it wants checking — which is how
// both of these went unguarded. carol is in no household, so neither of these
// is caught by the visibility filter; only the @check stops them.
await mustFail("carol creates a household member owned by alice",
  mutate(carol.token, "CreateFamilyMember", { userId: alice.id, familyMemberId: randomUUID(), name: "Smuggled" }));
await mustFail("carol records a transaction owned by alice", mutate(carol.token, "CreateTransaction", {
  userId: alice.id, familyMemberId: memberId, amountMinor: 999, direction: "EXPENSE",
  occurredOn: "2026-09-02", createdAt: new Date().toISOString(), description: "Smuggled",
}));

console.log("\n\x1b[1m7 · Projected items become actual ones\x1b[0m");
// The whole projected-vs-actual model, end to end: a row the household
// EXPECTS, visible to everyone in it, that the owner can later mark as having
// happened — and that nobody else can.
const projected = await mustPass("alice records an expected bill", mutate(alice.token, "CreateTransaction", {
  userId: alice.id, familyMemberId: memberId, amountMinor: 8800, direction: "EXPENSE",
  occurredOn: "2026-09-28", createdAt: new Date().toISOString(), description: "Electricity",
  source: "FORECAST", status: "FORECASTED",
}));
void projected;

const findBill = async (token) => {
  const r = await query(token, "ListMyTransactionsByDateRange", { startDate: "2026-09-01", endDate: "2026-09-30" });
  return (r.data?.transactions ?? []).find((t) => t.description === "Electricity");
};

let bill = await findBill(alice.token);
bill?.status === "FORECASTED"
  ? ok("it reads back as FORECASTED in the month range query")
  : bad("expected bill did not read back as projected", JSON.stringify(bill));

// bob is still in the household at this point — he leaves in §9 — so the
// household-visibility half can be checked here without rejoining.
const bobsView = await findBill(bob.token);
bobsView ? ok("bob sees alice's projected bill") : bad("bob cannot see the projected bill");

await mustFail("bob marks alice's projected bill as paid",
  mutate(bob.token, "MarkTransactionPosted", { transactionId: bill.id }));
await mustFail("carol (outsider) marks it as paid",
  mutate(carol.token, "MarkTransactionPosted", { transactionId: bill.id }));

await mustPass("alice marks it paid", mutate(alice.token, "MarkTransactionPosted", { transactionId: bill.id }));
bill = await findBill(alice.token);
bill?.status === "POSTED"
  ? ok("status is now POSTED")
  : bad("marking paid did not stick", JSON.stringify(bill));
// Provenance survives the transition — this is what lets the app still say
// "this started life as a projection" after the fact.
bill?.source === "FORECAST"
  ? ok("...and source is still FORECAST, so its provenance survived")
  : bad("source was clobbered by marking it paid", JSON.stringify(bill));

await mustPass("alice undoes it", mutate(alice.token, "MarkTransactionProjected", { transactionId: bill.id }));
bill = await findBill(alice.token);
bill?.status === "FORECASTED" ? ok("back to FORECASTED") : bad("undo did not stick", JSON.stringify(bill));

console.log("\n\x1b[1m8 · Recurring projections reach months they were not created in\x1b[0m");
// The case the range query alone cannot answer: a rule stores only its FIRST
// occurrence, so a fortnightly paycheque set up in September is a September
// row. Asking "what is in December" by date returns nothing; asking "whose
// series overlaps December" has to return it.
await mustPass("alice sets up a fortnightly paycheque from 4 Sep, until 31 Dec",
  mutate(alice.token, "CreateTransaction", {
    userId: alice.id, familyMemberId: memberId, amountMinor: 300000, direction: "INCOME",
    occurredOn: "2026-09-04", createdAt: new Date().toISOString(), description: "Paycheque",
    source: "FORECAST", status: "FORECASTED", recurrence: "BIWEEKLY", recurrenceEndsOn: "2026-12-31",
  }));

const rulesIn = async (token, rangeStart, rangeEnd) => {
  const r = await query(token, "ListMyRecurringProjections", { rangeStart, rangeEnd });
  return (r.data?.transactions ?? []).filter((t) => t.description === "Paycheque");
};

(await rulesIn(alice.token, "2026-12-01", "2026-12-31")).length === 1
  ? ok("December finds the September rule")
  : bad("December did not find the rule — the range query cannot do this alone");

(await rulesIn(alice.token, "2026-09-01", "2026-09-30")).length === 1
  ? ok("September finds it too")
  : bad("September did not find the rule");

// Past its end date it must stop being fetched at all, not merely stop being
// drawn — the expansion is bounded client-side, but the read should be too.
(await rulesIn(alice.token, "2027-03-01", "2027-03-31")).length === 0
  ? ok("March 2027 finds nothing, because the series ended in December")
  : bad("a finished series is still being fetched");

// A rule with no end date is the "indefinitely" case, and must keep being
// found however far out you look.
await mustPass("alice sets up an open-ended monthly bill",
  mutate(alice.token, "CreateTransaction", {
    userId: alice.id, familyMemberId: memberId, amountMinor: 9900, direction: "EXPENSE",
    occurredOn: "2026-09-28", createdAt: new Date().toISOString(), description: "Broadband",
    source: "FORECAST", status: "FORECASTED", recurrence: "MONTHLY",
  }));
const farOut = await query(alice.token, "ListMyRecurringProjections", { rangeStart: "2031-06-01", rangeEnd: "2031-06-30" });
(farOut.data?.transactions ?? []).some((t) => t.description === "Broadband")
  ? ok("an open-ended rule is still found five years out")
  : bad("open-ended rule stopped being found", JSON.stringify(farOut.data));

const bobSeesRules = await rulesIn(bob.token, "2026-12-01", "2026-12-31");
bobSeesRules.length === 1 ? ok("bob (same household) sees the rule") : bad("bob cannot see the rule");
const carolSeesRules = await rulesIn(carol.token, "2026-12-01", "2026-12-31");
carolSeesRules.length === 0
  ? ok("carol (outsider) does not")
  : bad("LEAK: carol sees another household's recurring projection");

console.log("\n\x1b[1m9 · Writes did NOT widen\x1b[0m");
await mustFail("bob renames alice's household member (visible to him, not his)",
  mutate(bob.token, "RenameFamilyMember", { familyMemberId: memberId, name: "Renamed By Bob" }));

console.log("\n\x1b[1m10 · Leaving\x1b[0m");
await mustFail("carol removes alice from her own household",
  mutate(carol.token, "LeaveMyFamily", { userId: alice.id }));
await mustFail("alice (primary user) leaves",
  mutate(alice.token, "LeaveMyFamily", { userId: alice.id }));
await mustPass("bob leaves", mutate(bob.token, "LeaveMyFamily", { userId: bob.id }));
const bobAfter = await query(bob.token, "ListMyTransactions");
(bobAfter.data?.transactions ?? []).length === 0
  ? ok("bob stops seeing alice's transactions the moment he leaves")
  : bad("LEAK: bob still sees them after leaving", JSON.stringify(bobAfter.data));

console.log("\n\x1b[1m11 · Invite codes\x1b[0m");
await mustPass("bob resolves the invite code", query(bob.token, "GetFamilyByInviteCode", { inviteCode: CODE }));
await mustFail("bob rotates alice's invite code",
  mutate(bob.token, "RegenerateFamilyInviteCode", { familyId, inviteCode: code() }));
await mustPass("alice rotates her own invite code",
  mutate(alice.token, "RegenerateFamilyInviteCode", { familyId, inviteCode: code() }));

console.log("\n\x1b[1m12 · You cannot remove yourself from your own household\x1b[0m");
// The invariant this protects: the self entry is created once, with the User,
// and nothing re-creates it. Soft-deleting it would leave somebody staring at
// a household they are not in, unrecoverable without a database edit.
await mustFail("alice deletes her own household entry",
  mutate(alice.token, "DeleteFamilyMember", { familyMemberId: alice.selfMember.id }));
await mustPass("alice renames herself",
  mutate(alice.token, "RenameFamilyMember", { familyMemberId: alice.selfMember.id, name: "Alice N." }));

// An ordinary member must still be removable — the guard has to be narrow.
const disposableId = randomUUID();
await mustPass("alice adds an ordinary household member",
  mutate(alice.token, "CreateFamilyMember", { userId: alice.id, familyMemberId: disposableId, name: "Lodger" }));
await mustPass("alice removes that ordinary member",
  mutate(alice.token, "DeleteFamilyMember", { familyMemberId: disposableId }));

const roster = await query(alice.token, "ListFamilyMembers");
const mine = (roster.data?.familyMembers ?? []).find((m) => sameId(m.selfUser?.id, alice.id));
mine?.name === "Alice N."
  ? ok("her own entry is in the roster, flagged as hers, under the new name")
  : bad("self entry missing or unflagged in ListFamilyMembers", JSON.stringify(roster.data?.familyMembers));

console.log("\n\x1b[1m13 · sync-user repairs an account missing either row\x1b[0m");
// The repair path for accounts created before settings and self entries were
// made alongside the User. It lives in a Next route rather than the
// connector, so this needs the app running; set APP_URL to include it.
const APP_URL = process.env.APP_URL;
if (!APP_URL) {
  console.log("  \x1b[2m- skipped (set APP_URL, e.g. APP_URL=http://localhost:3000)\x1b[0m");
} else {
  const bare = await mkBareUser("dora");
  const before = await provisioningOf(bare.uid);
  !before.userSetting && !before.selfMember
    ? ok("dora starts with neither a settings row nor a household entry")
    : bad("test setup wrong: dora already had them", JSON.stringify(before));

  const res = await fetch(`${APP_URL}/api/auth/sync-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: bare.token }),
  });
  const body = await res.json().catch(() => ({}));
  res.ok ? ok(`sync-user accepted the sign-in (${JSON.stringify(body.repaired ?? [])})`)
         : bad("sync-user failed", JSON.stringify(body).slice(0, 200));

  const after = await provisioningOf(bare.uid);
  after.userSetting?.id ? ok("...settings row was backfilled") : bad("settings row not backfilled");
  after.selfMember?.id
    ? ok(`...household entry was backfilled as "${after.selfMember.name}"`)
    : bad("self household entry not backfilled");

  // Idempotent: signing in again must not produce a second of either.
  await fetch(`${APP_URL}/api/auth/sync-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: bare.token }),
  });
  const twice = await provisioningOf(bare.uid);
  sameId(twice.selfMember?.id, after.selfMember?.id)
    ? ok("signing in again repairs nothing further")
    : bad("a second sign-in changed the self entry", JSON.stringify(twice.selfMember));
}

console.log(
  `\n${fail === 0 ? "\x1b[32m" : "\x1b[31m"}\x1b[1m${pass} passed, ${fail} failed\x1b[0m\n`
);
process.exit(fail ? 1 : 0);
