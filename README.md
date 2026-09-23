# Finance Tracker Pro

Household finance tracking. The sidebar lists the people in your household; the
main panel shows one person's income and expenses for a given month, with a
category breakdown beside it.

This app is a **skeleton cloned from Time Tracker Pro**. It keeps that app's
navbar, side menu, settings page, landing page and one content page, and
replaces the time-tracking domain with a financial one. Everything else
(dashboard, calendar, tickets, teams, admin, Google Calendar sync) was removed.

---

## Setup

This app shares **no** infrastructure with Time Tracker Pro. Every service,
database, connector and package identifier is distinct, and the local emulator
ports differ, so both apps can run side by side without colliding.

| | Time Tracker Pro | Finance Tracker Pro |
|---|---|---|
| Firebase project | `ecs-time-tracker-app` | `finance-tracker-app` |
| Data Connect service | `ecs-time-tracker-app-service` | `finance-tracker-app-service` |
| Cloud SQL instance | `ecs-time-tracker-app-instance` | `finance-tracker-app-instance` |
| Database | `ecs-time-tracker-app-database` | `finance-tracker-app-database` |
| Connector | `example` | `finance` |
| Generated SDK packages | `@dataconnect/*` | `@financeconnect/*` |
| Auth emulator port | 9099 | **9199** |
| Data Connect emulator port | 9399 | **9499** |

No credentials were copied from the source project.

### Option A — run locally (no Firebase project needed)

This is the fastest path and needs no cloud account, no billing and no service
account key. It is the verified path: everything below has been run end to end.

```bash
npm install
```

A working `.env.local` for this mode is already committed to your working tree
(gitignored, no secrets — it points at the local emulators). Then, in two
terminals:

```bash
# terminal 1 — Auth on 9199, Data Connect on 9499
npm run emulators
```

```bash
# terminal 2 — load the reference data, then start the app
DATA_CONNECT_EMULATOR_HOST=127.0.0.1:9499 npm run seed
npm run dev
```

`npm run seed` runs the four mutations in `dataconnect/seed_data.gql` in
dependency order and prints what it loaded. It is idempotent, so re-run it
freely. It refuses to run unless `DATA_CONNECT_EMULATOR_HOST` points at
localhost, so there is no path to it touching a real project.

Open the app, click **Sign in with Google**, and pick or invent an account in
the emulator's sign-in popup — the Auth emulator does not contact Google. The
first sign-in creates your `User` row on the `Regular` tier.

Emulator state lives in `dataconnect/.dataconnect/pgliteData` and is
gitignored. Delete that directory to start from an empty database; re-seed
afterwards.

### Option B — a real Firebase project

**1. Create the project and register a web app**

Data Connect provisions a Cloud SQL instance, so the project must be on the
**Blaze (pay-as-you-go)** plan — Spark cannot run it. If you only want to
develop, Option A above needs none of this.

```bash
npx firebase login
npx firebase projects:create finance-tracker-app        # or reuse an existing id
npx firebase apps:create WEB "Finance Tracker Pro" --project finance-tracker-app
```

If you pick a different project id, update `.firebaserc` to match.

Then, in the console: **Authentication → Sign-in method → Google → Enable**,
and **⚙ → Usage and billing → Modify plan → Blaze**.

**2. Generate .env.local**

Pull the web config with the CLI rather than copying it out of the console:

```bash
npx firebase apps:sdkconfig WEB --project finance-tracker-app > web-config.json
```

Download a service account key: **⚙ Project settings → Service accounts →
Generate new private key**. It saves a `.json` to your Downloads.

Then let the script assemble both halves:

```bash
npm run make-env -- web-config.json ~/Downloads/<the-key-file>.json > .env.local
rm web-config.json          # and delete the key file once you're done
```

Do not hand-copy the private key. It is a multi-line PEM and a `.env` file is
line-based, so it has to become one line with literal `\n` escapes. Getting
that wrong fails with `Failed to parse private key`, which does not point at
the cause. The script does the escaping, checks both files belong to the same
project, and prints to stdout so it can never silently overwrite an existing
`.env.local`.

**3. Provision Data Connect**

Create a Data Connect service and a Cloud SQL (PostgreSQL) instance using the
ids in `dataconnect/dataconnect.yaml`, then deploy the schema and connector:

```bash
npx firebase deploy --only dataconnect
```

**4. Seed the reference data**

The seed script is emulator-only by design. Against a real service, run the
four mutations in `dataconnect/seed_data.gql` from the Firebase console or the
Firebase VS Code extension, **in this order**:

1. `SeedUserTypes` — the five account tiers. **Must run before** any user row
   exists, or the migration that adds `User.userTypeName` fails on its foreign
   key; see the ordering note in that file.
2. `SeedFeatures` — feature rows and their tier grants.
3. `SeedColorSchemes` — the themes the settings page offers.
4. `SeedCategories` — starter income and expense categories.

**5. Run it**

```bash
npm run dev
```

### Making yourself an admin

New accounts land on `Regular`. `AdminPage` and `UserTypeControl` are granted
only to `Admin`, and `SetUserType` is `NO_ACCESS` — deliberately not callable
from the browser, since a `USER`-level version would let any account promote
itself. Promote from trusted server-side code or directly in the database.

---

## Architecture

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · HeroUI v3 ·
Firebase Auth · Firebase Data Connect (GraphQL over PostgreSQL).

```
app/
  layout.tsx          Root shell: fonts, Providers, Navbar, one-screen flex layout
  providers.tsx       The context stack (order matters — see the file's header)
  page.tsx            Landing page (signed out)
  household/page.tsx  The one content page
  settings/page.tsx   Settings
  api/auth/sync-user  Creates the User row on first Google sign-in

components/
  Navbar.tsx          Dual-mode: marketing mega-menu signed out, tab strip signed in
  Finance/            The household page: sidebar + detail + breakdown + form
  Utilities/          ListBoxComponent (the household sidebar) + dialogs + theming
  Settings/           Appearance, money and integration settings
  Search/             ⌘K fuzzy search over people and transactions

context/              One provider per persisted preference, all fed by one fetch
hooks/                Data Connect read/write hooks
lib/                  money, entityColor, monthRange, chartColor, auth, features
dataconnect/          schema.gql + the finance connector's queries and mutations
src/dataconnect-*     Generated SDKs (checked in; regenerate with the script below)
```

### The page's shape

The sidebar owns **people**; the main panel owns **time**. This is the inverse
of the source template, where work logs were day-scoped so the sidebar paged
through weeks. A family member is permanent, so the sidebar is a flat roster
and the month carousel sits next to the transaction list instead.

### Things worth knowing before you change anything

**Every account is a person in its own household.** A `User` is an account
that signs in; a `FamilyMember` is a person whose money is tracked. Nothing
connected the two, so the person doing the tracking was the one person not
represented in it — a new account opened on an empty sidebar and had to add
itself before it could record anything, which reads as broken rather than as a
step. `CreateUserFromGoogle` now creates the `User`, its settings and its own
household entry in a single transaction, and `FamilyMember.selfUser` is
`@unique` so "one self entry per account" is enforced by the database rather
than by whoever remembers to check. It cannot be deleted — nothing re-creates
it, so removing it would strand somebody outside their own household — and the
sidebar opens on it.

Note that `FamilyMember.user` and `FamilyMember.selfUser` mean different
things: the first is the account that owns and may edit the row, the second is
the account the row represents. They coincide on exactly one row per account.

**Projected and actual money share one table.** A bill the household expects
on the 28th and a payment that actually went out are both `Transaction` rows,
separated by `status` (`FORECASTED` vs `POSTED`). A separate projections table
would look tidier and then force every total, calendar day, breakdown and
search to read both and union them — each one a place to forget the other.
Marking a projection as received flips `status` and deliberately leaves
`source: "FORECAST"` alone, so the row still remembers it began as a guess.
Anything summing real money branches on `status`; only provenance reads
`source`.

**Money is an integer.** Amounts are minor units (cents), never floats, and
every conversion goes through `lib/money.ts`. `0.1` is not representable in
binary floating point, so `12.34 * 100` is `1233.9999999999998` — a ledger
that drifts by a cent after forty rows is worse than no ledger. `JPY` has no
minor unit, so the per-major divisor is derived from `Intl`, not hardcoded
to 100.

**Amounts are unsigned; `direction` carries the sign.** A signed amount makes
every aggregate ambiguous about whether it's a total or a net. `Transaction.
direction` is authoritative per row and deliberately *not* derived from
`Category.kind`, so a refund (money in, against a spending category) stays
expressible.

**Dates are local.** `Transaction.occurredOn` is a calendar day, not an
instant. `new Date("2026-09-01")` parses as UTC midnight — the 31st of August
for anyone west of Greenwich — so `lib/monthRange.ts` builds every date from
explicit `(year, month, day)` parts and never round-trips through
`toISOString()`.

**Every id-taking mutation needs an ownership guard.** A `USER`-level mutation
that accepts a row id and has no `@check` is a cross-tenant write: knowing a
UUID is not authorization. See the two guard patterns documented at the top of
`dataconnect/finance/mutations.gql`.

**Where the guard reads one row and the write touches another, absence must be
a denial.** A guard query that matches nothing evaluates none of its nested
`@check`s, so "no such row" silently becomes "permitted". Most mutations here
survive that because the write also matches nothing — but `ApproveJoinRequest`
checks a join request and then updates a *user*, and without a top-level
`@check(expr: "this != null")` it would pull any account in the database into
the caller's household. Every family mutation carries one.

**Reads are household-wide; writes are not.** A row is visible if you own it,
or if its owner belongs to a household you also belong to — a correlated
`exist` filter taking no variable at all, written out at the top of
`queries.gql` and repeated by every household read. Authorship is untouched,
so a transaction belonging to a housemate is visible and read-only, and any
control the UI offers for it must be gated on `isMine` or it will fail at a
`@check` the person never sees.

**Feature gates are rendering hints, not security.** `hooks/useFeatures.ts`
decides what the UI shows; the value round-trips through the browser and is
trivially spoofed. Every privileged route must re-check server-side via
`requireFeature()` in `lib/featureAccess.ts`.

**Queries use `SERVER_ONLY`.** Data Connect's generated React query hooks
default to a cache policy that mutations never invalidate, so a plain
`refetch()` can return a stale list forever after a write.

**A `User` is never created without its `UserSetting`.** The settings row is a
nested insert inside `CreateUserFromGoogle`, so the two arrive in one
transaction. This is worth knowing because the failure it replaced was
invisible: every preference write is a `userSetting_update(first: {where:
...})`, an update matching zero rows *reports success*, and the contexts set
their local state optimistically — so toggling a setting looked like it saved
right up until the page was reloaded. `sync-user` backfills the row for
accounts created before this existed.

### Income, Expenses and Calendar

All three are household-wide views of the same `Transaction` rows for one
month, read through `ListMyTransactionsByDateRange` so the month is bounded at
the database rather than by fetching everything and filtering. Income and
Expenses are a single component (`components/Records/LedgerPage.tsx`) pointed
at opposite directions — they were two near-identical files in the app this
was ported from, and had already drifted apart.

Each shows three figures rather than one: what has moved, what is still
expected, and the two combined. A month with half its income still to arrive
is a different month from one where it has all landed, and a single total
cannot tell you which you are looking at.

The Calendar is the forward-looking view. Projected items render with a hollow
marker and italic label — the shape carries the signal, not just the colour,
because category colours are user-chosen and cannot be relied on to contrast.
Clicking any day (including an empty one) opens it, and adding from there
defaults to "expected".

### Households

A `Family` groups **accounts**, not people — the tracked people are still
`FamilyMember` rows owned by one account each. Joining one widens what you can
read and nothing else.

A household is reached by **invite code**, never by browsing: there is no query
anywhere that lists families. The code is a bearer capability, so
`lib/inviteCode.ts` generates it from a CSPRNG over a 32-symbol alphabet
(~50 bits) with the confusable letters removed, and the owner can rotate it if
it leaks. Resolving a code discloses a household's name and nothing else.

New accounts land in `app/(onboarding)/`, which has no navbar because it is a
separate route group rather than a condition inside `Navbar`. They either
create a household (instant — it is theirs) or ask to join one (pending until
the household's primary user approves them in Settings). The approval guard is
the most security-sensitive mutation in the app; see the note above.

### Regenerating the Data Connect SDK

`src/dataconnect-generated` and `src/dataconnect-admin-generated` are checked
in so the app typechecks without a provisioned backend. After editing
`dataconnect/schema/schema.gql` or the connector's `.gql` files:

```bash
npm run dataconnect:generate
```

### Verifying the authorization boundary

```bash
npm run emulators                                   # terminal 1
npm run verify:guards                               # terminal 2
APP_URL=http://localhost:3000 npm run verify:guards # also checks sync-user
```

Mints real identities against the Auth emulator and drives the connector over
HTTP as each of them, trying to read and write across household boundaries —
approving requests that do not exist, admitting accounts that never asked,
renaming a housemate's records, reading a transaction by id from outside the
household, marking somebody else's projected bill as paid, deleting your own
household entry.

With `APP_URL` set it additionally creates an account holding only its `User`
row and signs it in, asserting that `sync-user` backfills both the settings row
and the self household entry, and that signing in again changes nothing
further. That repair lives in a Next route rather than in the connector, so it
needs the app running.

Run it after any change to `schema.gql`, `mutations.gql` or `queries.gql`.
Nothing in `npm test` can reach these: `@auth` levels, `@check` expressions and
the visibility filter all execute inside Data Connect, and a mocked connector
would only confirm that the mock agrees with itself. The failure mode is the
reason it exists — a weakened guard does not raise, it permits, and a filter
that is too wide does not error, it returns somebody else's money.

---

## Deliberately absent

**Plaid.** The `PlaidItem` and `BankAccount` tables, the `Transaction.plaid*`
columns and the three sync mutations were removed rather than left in place
unused. Nothing called them, and a `USER`-level mutation with an unchecked
`$userId` upserting on a client-supplied `$id` is a cross-tenant write sitting
in the connector whether or not a page happens to call it. When Plaid lands it
writes `Transaction` rows with `source: "PLAID"` beside the manual and
projected ones — the same model the app already renders.

**An admin UI.** `ListUsers`, `ListUserTypes` and `SetUserType` are kept
because the tier system is kept, but nothing calls them yet.

## What was intentionally left out

- **No admin or teams pages.** The feature-gate mechanism that guarded them
  is still wired (`lib/features.ts`, `hooks/useFeatures.ts`,
  `lib/featureAccess.ts`, the `Feature`/`UserTypeFeature` tables), and no nav
  tab uses it — so adding the first gated surface is one line plus a grant,
  not a rebuild. Kept deliberately; see "Deliberately absent" above.
- **`Reports` is dark-launched.** The `Feature` row is seeded and granted to
  nobody. That's the intended way to ship an unfinished feature: no code
  branch, no flag file, just an absent row in `UserTypeFeature`.
- **Recurrence is recorded, not executed.** `Transaction.recurrence` labels a
  row as recurring; nothing generates future occurrences yet. The form says so.

## Scripts

| | |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run emulators` | Auth (9199) + Data Connect (9499) emulators |
| `npm run seed` | Load reference data into the emulator (idempotent) |
| `npm run make-env` | Build `.env.local` from the Firebase config + service account key |
| `npm run dataconnect:generate` | Regenerate the Data Connect SDKs |
| `npm run verify:guards` | Drive the connector as several identities and try to break the household boundary. `APP_URL=http://localhost:3000` also exercises the sync-user repair path |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
