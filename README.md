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

That account arrives with an empty household and no transactions, which is the
correct first-run experience and a poor place to work from. One more command
gives you a household with a year of money in it:

```bash
npm run seed:stress
```

It creates six signed-in-able accounts across two households, ~1,500
transactions over fourteen months, recurring projections, internal transfers, an
imported bank statement and a pending join request — then prints which account
to sign in as and what to open first. See
[Seeding a full household](#seeding-a-full-household-for-local-work) for the
whole list and the knobs. It is idempotent, emulator-only, and supersedes
`npm run seed` (it runs that reference data itself).

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

### Recurring projections

A projected row carrying a `recurrence` is a **rule**, not an entry: it stores
its first occurrence in `occurredOn`, and `recurrenceEndsOn` says how long it
keeps appearing — null meaning indefinitely. `lib/recurrence.ts` expands it
over whatever range is on screen.

This is expanded rather than materialised into one row per occurrence, and the
trade is worth stating. Materialising cannot express "indefinitely" at all
(only "for N years", which is a lie with a number attached), turns a five-year
weekly bill into 260 rows, and makes changing the end date a bulk generate or
delete — every one a partial-failure mode, and every bulk write a place where
the per-row ownership `@check` no longer applies. One rule expanded over a
range has none of those properties. What it costs is per-occurrence identity;
see "What was intentionally left out".

Two consequences worth knowing before changing this code:

- **Two reads, not one.** A rule stores only its first occurrence, so a
  fortnightly paycheque set up in September is a September row and the
  date-range query alone would show December an empty calendar.
  `ListMyRecurringProjections` asks the other question — whose *series*
  overlaps this range — and `useHouseholdMonth` merges both, dropping
  duplicates by id.
- **Expansion overwrites `occurredOn`** with the occurrence's own day, because
  that is what every calendar bucket, date column and sort needs. That means
  `occurredOn` on an expanded entry is no longer what the row stores, so
  anything about to *write* it must go through `ruleRowOf()`. Skipping that
  drags the whole series' start date onto whichever occurrence was clicked.

Monthly and yearly rules clamp to the end of short months: a bill due on the
31st is due on the 28th in February, not the 3rd of March, and it returns to
the 31st in March rather than sticking at 28. `lib/recurrence.test.ts` pins
that down, leap years included.

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

### Importing a bank statement

Income and Expenses both carry an **Import CSV** button, which takes a Wells
Fargo statement export: `DATE, DESCRIPTION, AMOUNT, CHECK #, STATUS`, with or
without a header row (Wells Fargo's own export has none). Positive amounts
become income, negative ones become expenses, and everything lands as money
that has **already moved** — `status: "POSTED"`, never a projection.

`lib/wellsFargoCsv.ts` is the whole interpretation and is pure: CSV parsing,
`MM/DD/YYYY` to a local calendar day by string surgery, the sign to a direction
plus an unsigned magnitude, the counterparty pulled out of the memo line, a
method, and a conservative category guess. `hooks/useTransactionImport.ts` is
the write half. Neither knows anything about the other's job.

**Imported rows are not a third kind of money.** `source: "IMPORT"` sits beside
`MANUAL`, not beside `FORECAST`: it records where a row came from and nothing
else, and every total still splits on `status`. The ledger shows the provenance
in its own **Source** column, and the calendar's day panel tags it — neither
changes an arithmetic.

#### Uploading an overlapping statement again

Nobody uploads once. People import September, then in October import
August-to-October to fill a gap, and the two files overlap by weeks. Most of the
second file must not be imported again — but some of it is new, and some rows
that *look* like duplicates are two separate purchases that agree on every
column. `lib/importReconcile.ts` decides, in three tiers, and **only the first
two ever skip a row on their own**:

| tier | question | evidence | acts on its own |
|---|---|---|---|
| Same **file** | "have I uploaded this?" | `StatementImport.contentKey`, a digest of the text | yes — caught before any row is written |
| Same **line** | "have I imported this row?" | `Transaction.importKey` — day, amount, memo, ordinal, scoped to owner and account | yes |
| Same **reference** | "is this that transaction, reformatted?" | `Transaction.importRef` — the bank's own id | yes |
| **Looks the same** | "is this that transaction, with no reference to prove it?" | amount, date proximity, merchant | **no — reported for you to confirm** |

**Why the reference tier exists.** Wells Fargo reports a transaction twice, in
two different formats:

| | pending | settled |
|---|---|---|
| memo | `PURCHASE LE BERNARDIN +15550001234 NY CARD0000` | `PURCHASE AUTHORIZED ON 09/15 LE BERNARDIN RESTAURANT NEW YORK NY S000000000000014 CARD 0000` |
| date | 09/15 | 09/16 |
| amount | 1284.50 | 1412.95 — a tip landed |
| reference | *none* | `S000000000000014` |

Nothing matches, so a fingerprint sees two unrelated rows and imports the charge
twice. The reference resolves it exactly — and it cuts the other way too: two
rows whose references are both present and **different** are definitely two
transactions, which is what stops two same-price shops at one supermarket in the
same week being called a duplicate.

**The fourth tier never decides by itself, and that is deliberate.** A pending
row has no reference, so all that is left is amount, date and merchant — and on
those, one shop reported twice is indistinguishable from two identical shops. So
it reports. The review step lists each one beside the row it resembles, why it
matched, and how far apart they are; they are **imported unless you tick them**,
with a "Skip all of them" for the common case. Quietly dropping a real
transaction is the worse failure, because a ledger missing a row is wrong in a
way nobody reconciles against.

**Counts are respected throughout**, which is what protects legitimate
duplicates. Every stored row can be claimed by at most one incoming row. Two
identical coffees on the same afternoon are two rows, so a re-upload matches two
and imports neither — and a third coffee a month later finds both already
claimed and is correctly new. A half-finished import is the same story in
reverse: if one of the two coffees landed, re-uploading brings exactly the one
that did not.

All four columns that matter here are `@unique` where they can be, and **the
constraints are the guarantee** — the pre-flight reads only turn the common case
into "88 already imported" instead of an error. `importRef` is deliberately *not*
unique: it is absent on exactly the rows that need matching most, and an amount
that legitimately changes between pending and settled must reach a person rather
than be refused.

**An upload is a row, not an event.** Every import writes a `StatementImport`
header first and stamps its transactions with the id, so "the rows that came
from that file" is a foreign key. Removing one is two mutations in order — the
rows, then the header, because the FK is nullable and therefore
`ON DELETE SET NULL`. The dialog lists previous uploads and offers Remove on
the ones this account owns; a housemate's upload is visible and read-only, the
same asymmetry as everywhere else.

Imports go through `CreateTransaction` one row at a time rather than a batch
insert. That was not the first choice: `transaction_insertMany` needs a
`[Transaction_Data!]!` variable, and the code generator does not support those
for either SDK. Idempotency buys what atomicity would have — an interrupted
import is safe to simply run again.

Two things worth knowing before pointing it at your own statements:

- **Internal transfers.** "ONLINE TRANSFER" lines between your own Wells Fargo
  accounts are real statement lines, so by the positive/negative rule they
  count as income and spending. Every £500 swept into savings therefore adds
  £500 to both sides of the month. A checkbox skips them; it defaults to **off**,
  because the lines genuinely are on the statement.
- **The raw memo is not stored.** Only the counterparty extracted from it, in
  `merchant`. The review step shows the original line beside what will be
  written, so the mapping is visible before it is committed.

Your own exports go in `transaction_data/`, which is gitignored. The committed
fake equivalents in `transaction_data.example/` are what keep the importer honest
in CI — see that directory's own README for what each file exercises. Two of them
are a deliberately overlapping pair, a statement downloaded with rows still
pending and the same account downloaded three weeks later, which is what
`lib/importReconcile.test.ts` runs against.

### In, out, and what is merely expected

Every in/out figure in the app comes from `lib/ledgerTotals.ts`. It used to be
summed inline in three components, which is exactly the duplication that drifts
without anything throwing — a wrong total just shows a number nobody can account
for. Four decisions live there, and the tests pin each one:

- **In and out are kept apart**, never netted. A refund is money in against a
  spending merchant; net it as you go and "spent this month" quietly shrinks by
  the refund.
- **Actual and projected are kept apart**, split on `status` and never on
  `source`. A projection marked as received keeps `source: "FORECAST"` so its
  provenance survives — splitting on source would then exclude money the
  household has actually been paid.
- **An imported row is an actual.** `source: "IMPORT"` counts in in/out exactly
  like a typed one. The imported subtotals are a *breakdown* of that figure, for
  reconciling against a statement, not a replacement for it.
- **Excluded rows leave every figure**, not just the list.

`sumDays` deliberately takes the days to count rather than summing its whole map:
the calendar grid pads with adjacent months and can have its weekend hidden, so a
month total must be handed the month's days. Both mistakes — leaking an adjacent
month, dropping a weekend — are one line away and neither errors.

### Calendar

A month grid of money per day. Tapping a day goes to `/calendar/2026-09-15`,
which shows everything on that day plus the stats a grid cell has no room for:
what it went on, who spent it, the day's share of the month's spending, and
what on it is still only expected. It is a route rather than an expanding panel
because a day is something people link to, send to a housemate, and reach with
the back button.

**Hide weekends** drops Saturday and Sunday, leaving five wider columns. It is a
view filter and touches no total — weekend transactions still exist and still
count, which `visibleGridDays` and its tests exist to guarantee.

### Internal transfers

Money that never enters or leaves the household. Its two legs are a real credit
and a real debit, so counting them adds the same amount to **both** sides of the
month. A household that sweeps money into savings every payday looks like it earns
and spends far more than it does.

What it does to the **net** depends on whether both accounts were imported:

- **both legs imported** — they cancel, the net is unchanged, and only in/out are
  inflated. This is what makes the distortion so easy to miss.
- **one leg imported** — nothing cancels, so counting it makes the net wrong too:
  money swept into an un-imported savings account is reported as spending when it
  never left the household. Excluding it corrects the net.

Measured on a real household of 3,000 rows: excluding transfers moved in from
$467,056 to $330,217, out from $330,935 to $198,077, and the net by $3,980 —
that last figure entirely from one-legged transfers.

There are **two flags**, because they are not the same question:

| | what it is | household total | that person's own total |
|---|---|---|---|
| `isInternalToUser` | one account holder's own accounts — checking to savings | excluded | not money either way |
| `isInternalToFamily` | two people *inside* the household — one member paying another | excluded (the legs cancel) | real for each of them |

The toggle is in the **navbar**, not on a page, because it changes the figures on
Income, Expenses, the Calendar, a day's detail and the household panel at once.
Every screen that applies it also says how many rows it is holding back.

Both flags are decided from the statement memo — Wells Fargo's `ONLINE TRANSFER`
prefix for the first, a household member's name in a Zelle memo for the second —
and stored, because the memo is not kept. `lib/internalTransfers.ts` classifies
from the **stored** `merchant` and `method` as well as from a raw memo, and that
is load-bearing: `extractMerchant` deliberately leaves the transfer prefix intact,
which is the only reason rows imported before these columns existed can be
repaired.

**Nothing needs setting up.** Every list resolves these flags on read —
stored value first, then the memo, then by pairing the two legs — so the toggle
works on statements imported long before these columns existed. The columns are the
durable record; the resolution is the live answer. That ordering matters: an
earlier version only read the stored columns, and a household with 1,062 unflagged
transfers found the toggle did nothing at all.

**Pairing** is what catches the transfers no memo can identify. "CASH APP" and
"VENMO" name nobody — but when both accounts are imported the transfer is in the
data twice, once leaving one member and once arriving at another. Matching those
two rows identifies it with no names, and says which kind it is for free: same
member means own accounts, different members means between two people. It requires
opposite directions, identical amounts, a date within four days, and **both** sides
looking like a transfer — that last condition is what stops a $200 card purchase
pairing with a $200 paycheque that lands the same day.

**Settings → Re-check internal transfers** persists what the resolver works out,
so a pairing found while looking at one month survives into a view of another, and
anything server-side can read it. It is needed because a
classification can be right today and wrong tomorrow: a payment to Sarah only
becomes internal once Sarah is in the roster, and stops being if she leaves. It
reports only rows that would actually change, in both directions, so running it
twice writes nothing. On a real household of 2,947 imported rows it found 1,062
own-account transfers and 96 payments between members.

### Hiding amounts

The eye in the navbar replaces every figure with dots, for a shared screen or a
screenshot. It is persisted like every other preference, so it survives a reload
and follows the account to another device.

It is **not a security boundary**, and `lib/privacy.ts` says so: the amounts are
still in the page and still in the network responses. It defeats a glance, which
is what it is for. The mask is a fixed four bullets regardless of the amount,
because a mask whose length tracked the digits would leak the magnitude.

Every amount renders through `usePrivacyMode().formatAmount` rather than
`formatMoney` directly. A component that formats money itself is one the toggle
silently misses, and a screen that hides most of its figures is worse than one
that hides none.

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

### The Dashboard

`/dashboard` is the household's whole picture for one window of time, and the
only page with a range control rather than the single-month carousel the others
use. One filter row at the top scopes everything below it — every stat, chart and
table re-renders against the same slice, which is what keeps their figures
reconcilable against each other and against the Income/Expenses/Calendar pages.

**One read, widened.** The chosen window and the window *before* it are fetched
as a single range and split client-side, so every "vs previous" delta costs no
second query — and, more to the point, no second `useHouseholdRange`, which owns
a `useFamilyMembers()` and has to stay once per page.

`useHouseholdMonth` is now a thin wrapper over `useHouseholdRange`. The month
version came first and the dashboard needed the same two reads, the same
recurring-rule expansion and the same three-pass transfer resolution over an
arbitrary window, so the window became a parameter instead of the hook growing a
near-identical twin.

**Every figure comes from `lib/ledgerTotals.ts`**, via the pure aggregations in
`lib/analytics.ts`. Nothing in a dashboard component adds up an amount itself.
`lib/dateRange.ts` holds the presets and the bucketing (day → week → month, chosen
so any preset lands between about 7 and 60 columns). Both are tested; the
dashboard added 62 tests.

**Widgets** can be toggled from the control in the top right. That choice is kept
in `localStorage`, deliberately **per device** rather than on the `UserSetting`
row where every account preference lives: which widgets fit is a property of the
screen, and somebody who hides two charts on a laptop has said nothing about
their phone. Promoting it is one nullable column plus a provider, if that turns
out to be wanted.

#### The 3D chart, and why it is allowed to be 3D

The stacked composition chart is real WebGL (three.js) under an **orthographic**
camera, not a perspective one. That is the whole argument for it: under
perspective a bar's drawn height depends on its distance from the camera, so two
equal values render at different sizes and the reader cannot compare them — the
chart lies, decoratively. Orthographic projection has no foreshortening, so a
unit of money is the same number of pixels tall everywhere and the depth is
presentation rather than distortion. Occlusion is handled by there being only one
row of bars, plus the table view every widget carries.

It never mounts in performance mode, falls back to a real 2D stacked chart
without WebGL, animates once and then holds still, and skips even that for
`prefers-reduced-motion`.

#### A finding: the chart palette could not separate its own series

`lib/chartColor.ts` derives categorical chart colours by hue-rotating `--accent`,
so charts follow whichever ColorScheme is active. Running the categorical gates
over the result — all four seeded schemes, both modes — it fails everywhere:

| | worst adjacent CVD ΔE | worst adjacent normal-vision ΔE |
|---|---|---|
| target | ≥ 8 | ≥ 15 (hard floor) |
| measured | **0.3 – 5.6** | **4.8 – 15.1** |

Dark mode additionally fails the lightness band outright (the dark accents sit at
L ≈ 0.70–0.80, above the 0.77 ceiling). **No slot count from two to eight passes**
— at two adjacent slots Ocean light still measures 13.7 against the 15 floor. The
accents were chosen to look right as a UI accent, not to be told apart from each
other, and a 45° hue-rotate step is too small a perceptual step regardless.

This is pre-existing and affects the donut and category breakdown too. The
dashboard does not paper over it:

- The **stacked chart** uses a one-hue **ordinal ramp** (`ordinalRamp`), gated on
  lightness monotonicity instead of pairwise hue separation — a test it passes by
  construction, and semantically right because the bands are ranked. It is
  two-ended (reaching toward `--foreground` as well as `--surface`) because an
  accent→surface span alone put adjacent steps ~ΔL 0.03 apart and its faint end
  at 1.6:1. The parameters were **searched**, not chosen: 80 combinations of step
  count and span, validated against all eight scheme × mode pairs. Four steps is
  the maximum that passes, so the chart shows three categories and folds the rest.
- The **ranked lists** are monochrome. Every row already carries its label in
  text, so identity never depended on hue there.
- Both the 2D and 3D charts compute their colours through the *same* function, so
  a band is the shade its legend swatch shows. `cssHueRotate` implements CSS's
  own hue-rotate matrix (not an HSL rotation, which lands elsewhere) for the same
  reason.

Fixing the palette properly means re-basing it — fixed validated chart hues, or
re-chosen accents — which changes every existing chart and is a product decision
about the theming system. The measurements above are the input to it.

### Seeding a full household for local work

```bash
npm run emulators            # terminal 1
npm run seed:stress          # terminal 2 — idempotent, safe to re-run
npm run seed:stress:dry      # generate everything, print the plan, write nothing
npm run seed:stress:reset    # delete only these accounts' rows, then reseed
npm run dev
```

`npm run seed` loads reference data and leaves you with an empty app. This fills
it. The reason it exists is not bulk — it is that the states worth looking at are
the ones nobody types in by hand: a recurring projection whose rule started
eleven months ago, a transfer with only one leg imported, a statement re-upload
that overlaps the last one by a week. Every invariant in `CLAUDE.md` that can be
*seen* has a row here that shows it.

It runs `seed_data.gql`'s four mutations itself, so a clean emulator needs this
command and nothing else.

**Who you can sign in as.** Click **Sign in with Google** and pick one from the
emulator's popup — no passwords, and nothing contacts Google.

| Account | Tier | Household |
|---|---|---|
| `alex@local.dev` | Admin | The Rivera-Chen Household (owner) |
| `sam@local.dev` | Regular | The Rivera-Chen Household — weekends hidden |
| `jordan@local.dev` | Premium | The Rivera-Chen Household — privacy mode on, transfers excluded |
| `nia@local.dev` | Regular | The Okonkwo Household — a second household, to see the boundary from outside |
| `riley@local.dev` | Regular | None — lands in onboarding |
| `casey@local.dev` | Regular | None, with a **pending** request at Rivera-Chen |

Invite codes are `STRESSHHA1` and `STRESSHHB2`. Alex is `Admin` only so that
tier-gated surfaces are reachable without a manual promotion after every reset.
The two household-less accounts exist because onboarding is otherwise
unreachable once every account has a household, and Riley is kept clean so the
create-or-join choice still works from a fresh state.

The household also holds two people who do **not** sign in — which is the normal
case for most of a family, and what makes `FamilyMember.user` (the owner) and
`FamilyMember.selfUser` (who it is) visibly different. One of them is
soft-deleted *with* transactions, so you can see that removing somebody does not
cascade into their financial history.

**What it writes.** Roughly 1,500 transactions over fourteen months per run,
ending today. The current month is deliberately a month *in progress* — actuals
up to today, projections after it — so both halves of every screen are populated
on the day you run it.

Among them, named individually in the script's own output:

- Seven **recurring projection rules** (monthly, biweekly, weekly, yearly), some
  indefinite, one bounded in the future, one bounded in the past, and one whose
  `recurrenceEndsOn` precedes its `occurredOn`. That last one is not a mistake:
  a rule that expands to nothing once vanished from the ledger while still
  sitting in the database, and the invariant is that a rule always yields at
  least its first occurrence.
- A projection that was **received** — `source: "FORECAST"` with
  `status: "POSTED"`. Anything totalling money must branch on `status`; read it
  from `source` and this row silently drops out of the month's income.
- Five **internal-transfer** situations, because they behave differently: a
  two-legged own-account sweep, the same thing with the flags deliberately
  **unset** (the state a household that imported before those columns existed is
  in), a named person-to-person Zelle, an anonymous `CASH APP` pair that only
  pairing can resolve, and a **one-legged** transfer — the only case where
  excluding transfers moves the *net* and not just the two sides. Toggling
  "ignore internal transfers" in the navbar is what makes the difference visible,
  and every screen that applies it reports its `excludedTransferCount`.
- **Refunds**: `INCOME` rows against `EXPENSE` categories, which is why
  `Transaction.direction` is authoritative per row rather than derived from
  `Category.kind`.
- Two same-price shops at one shop in one week with **different** bank
  references — the pair that must never be reported as a duplicate.
- Uncategorized rows, a member with no colour and no income target, and
  categories with no colour, so every derived-fallback path is exercised.

**Two things to actually try.** These are the point of the fixture:

1. **Settings → re-check internal transfers.** Two *imported* rows are seeded
   with their flags unset although their memos classify. The re-check repairs
   those, and it is idempotent — run it twice and the second run reports nothing.
   It must **not** touch the seeded `CASH APP` pair, whose memo names nobody:
   that pair is resolvable only by finding its other leg, which happens at read
   time, so it reads as internal in the ledger while its stored columns stay
   false.

   Those rows are `source: "IMPORT"` rather than `MANUAL` for a load-bearing
   reason — `ListMyClassifiableTransactions` filters `importKey: { isNull: false
   }`, so only statement rows are re-checkable. Seed the scenario as
   hand-entered and the button has nothing to do, which is how the first version
   of this fixture quietly tested nothing.
2. **Upload `transaction_data/stress-test/Checking (1).csv`** in the import
   dialog. It overlaps the already-imported statement and hits all three
   reconcile tiers at once: two rows caught as the same *line*, one caught by its
   bank *reference* alone, two that are only **probable** and wait for you to
   decide, and six genuinely new. The probable pair is a pending charge that has
   since settled — the commonest real duplicate, and the one a fingerprint cannot
   catch. Nothing skips it for you, deliberately.

   Three CSVs are written to `transaction_data/stress-test/` (gitignored, so they
   never mix with your own exports and can never be committed). `Checking.csv` is
   the one already seeded — uploading it again is refused by
   `StatementImport.contentKey`, which is the "same file" check. The `(1)` in the
   second filename is load-bearing: `accountLabelFromFilename()` strips it, so
   both files carry the account label `Checking` and their per-line `importKey`s
   line up. That is what a re-download actually lands as.

**It checks its own claims.** Every assertion above is *computed*, on each run,
using the app's own `resolveInternalTransfers()` and `reconcileStatement()` —
not written down. A fixture's interesting rows are interesting because of what
the app concludes from them, and none of that is visible in the rows themselves;
if a memo stops matching or a window narrows, the fixture quietly becomes an
ordinary pile of transactions that tests nothing, with a screen that still looks
fine. So the script prints `✓ all 13 claims hold`, or names the ones that do
not. A failure there means the **fixture** has stopped exercising what it was
built for — not that the app is broken.

**Knobs**, all optional:

| | |
|---|---|
| `SEED_MONTHS=14` | How many months of history |
| `SEED_RNG_SEED=20261029` | PRNG seed. Same seed, same fixture — so `--reset` gives back the dataset you were just looking at, and a screenshot stays reproducible |
| `SEED_DENSITY=1` | Multiplier on discretionary rows per member per month |
| `SEED_SKIP_CSV=1` | Don't write the statement CSVs |

**Emulator only, and there is no `--production` flag.** `npm run seed:prod`
exists because reference data genuinely has to reach production. This writes
people, households and money, so the localhost guard is the whole story and
there is deliberately no path through it. Re-runs are idempotent — every id is
derived from a readable key, so a second run upserts the same rows. The one
thing a re-run cannot absorb is a change to how a statement line fingerprints,
because `Transaction.importKey` is `@unique` and an old row still holds it;
that is what `--reset` is for. `--reset` deletes only these accounts' rows,
scoped to their own ids throughout, in the order the foreign keys require
(transactions before their statement header, since
`Transaction.statementImport` is `ON DELETE SET NULL` and removing the header
first would strand the rows rather than delete them).

**Why it loads TypeScript.** The script imports `lib/wellsFargoCsv.ts`,
`lib/internalTransfers.ts` and `lib/importReconcile.ts` directly, through the
tiny resolver in `scripts/ts-resolve.mjs`, and the npm scripts run it with
`node --import ./scripts/ts-resolve.mjs`. Node can already strip types; what it
cannot do is resolve the extensionless relative imports those files use, which
is the one gap that resolver closes. The alternative was a second copy of the
statement-parsing rules inside the script, and a copy that drifted would produce
a fixture that silently disagreed with the code it exists to exercise. Nothing
the app ships goes through that resolver — `next dev`, `next build` and `vitest`
all have their own.

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
projected ones — the same model the app already renders, and the same slot
`source: "IMPORT"` occupies today for CSV uploads.

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
- **Per-occurrence editing of a repeating projection.** A recurring
  projection is one row expanded over the visible range, so its individual
  future occurrences are not rows and cannot be edited or ticked off one at a
  time. Editing or deleting one acts on the whole series, and the buttons say
  so. That becomes worth changing when Plaid starts writing actuals and the
  job turns into matching a real transaction against a specific occurrence.

## Scripts

| | |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run emulators` | Auth (9199) + Data Connect (9499) emulators |
| `npm run seed` | Load reference data into the emulator (idempotent) |
| `npm run seed:prod:dry` | Run every production-seed guard and print the plan, writing nothing |
| `npm run seed:prod` | Load the same reference data into a REAL project. Needs `SEED_CONFIRM_PROJECT` to equal the project id, service-account credentials, and the emulator host variables unset. **This is what makes colour schemes exist in production** — without it `ListColorSchemes` is empty there and the theme picker has nothing in it |
| `npm run seed:stress` | Fill the emulator with two households, ~1,500 transactions, projections, transfers and an imported statement. Idempotent; prints who to sign in as and checks its own claims. [Details](#seeding-a-full-household-for-local-work) |
| `npm run seed:stress:dry` | Generate the whole fixture, print the plan and the self-check, write nothing |
| `npm run seed:stress:reset` | Delete only the stress-test accounts' rows, then reseed. The fix for a changed statement fingerprint colliding with a `@unique` `importKey` |
| `npm run make-env` | Build `.env.local` from the Firebase config + service account key |
| `npm run dataconnect:generate` | Regenerate the Data Connect SDKs |
| `npm run verify:guards` | Drive the connector as several identities and try to break the household boundary. `APP_URL=http://localhost:3000` also exercises the sync-user repair path |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
