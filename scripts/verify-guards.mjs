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
  await admin.executeGraphql(
    `mutation($g:String!,$u:String!,$e:String!,$c:Timestamp!){
       userType_upsert(data:{name:"Regular"})
       user_insert(data:{googleUid:$g,username:$u,email:$e,userTypeName:"Regular",createdAt:$c,userSetting_on_user:{}})
     }`,
    { variables: { g: acct.localId, u: tag, e: email, c: new Date().toISOString() } }
  );
  const row = await admin.executeGraphql(
    `query($g:String!){ user(first:{where:{googleUid:{eq:$g}}}){
       id userSetting: userSetting_on_user { id currencyCode backgroundOpacity bordersEnabled } } }`,
    { variables: { g: acct.localId } }
  );
  const user = row.data.user;
  return { tag, token: acct.idToken, uid: acct.localId, id: user.id, setting: user.userSetting };
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

const carolMembers = await query(carol.token, "ListFamilyMembers");
(carolMembers.data?.familyMembers ?? []).length === 0
  ? ok("carol (outsider) sees no household members")
  : bad("LEAK: carol sees household members", JSON.stringify(carolMembers.data));

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

console.log("\n\x1b[1m7 · Writes did NOT widen\x1b[0m");
await mustFail("bob renames alice's household member (visible to him, not his)",
  mutate(bob.token, "RenameFamilyMember", { familyMemberId: memberId, name: "Renamed By Bob" }));

console.log("\n\x1b[1m8 · Leaving\x1b[0m");
await mustFail("carol removes alice from her own household",
  mutate(carol.token, "LeaveMyFamily", { userId: alice.id }));
await mustFail("alice (primary user) leaves",
  mutate(alice.token, "LeaveMyFamily", { userId: alice.id }));
await mustPass("bob leaves", mutate(bob.token, "LeaveMyFamily", { userId: bob.id }));
const bobAfter = await query(bob.token, "ListMyTransactions");
(bobAfter.data?.transactions ?? []).length === 0
  ? ok("bob stops seeing alice's transactions the moment he leaves")
  : bad("LEAK: bob still sees them after leaving", JSON.stringify(bobAfter.data));

console.log("\n\x1b[1m9 · Invite codes\x1b[0m");
await mustPass("bob resolves the invite code", query(bob.token, "GetFamilyByInviteCode", { inviteCode: CODE }));
await mustFail("bob rotates alice's invite code",
  mutate(bob.token, "RegenerateFamilyInviteCode", { familyId, inviteCode: code() }));
await mustPass("alice rotates her own invite code",
  mutate(alice.token, "RegenerateFamilyInviteCode", { familyId, inviteCode: code() }));

console.log(
  `\n${fail === 0 ? "\x1b[32m" : "\x1b[31m"}\x1b[1m${pass} passed, ${fail} failed\x1b[0m\n`
);
process.exit(fail ? 1 : 0);
