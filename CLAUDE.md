# Finance Tracker Pro

Household finance tracker. Sidebar = people in the household; main panel =
one person's income and expenses for a month, with a category breakdown.
Income / Expenses / Calendar are household-wide views of the same rows.

Several *accounts* can share a household (a `Family`). They see each other's
finances; they do not edit each other's. New accounts pick a household through
the onboarding flow before they reach the app.

Cloned from Time Tracker Pro as a skeleton (navbar, side menu, settings, home,
one content page) and repurposed. Shares no infrastructure with it — separate
Firebase project, Data Connect service, Cloud SQL instance, database,
connector (`finance`), SDK packages (`@financeconnect/*`) and emulator ports
(auth 9199, Data Connect 9499). See README.md for setup.

## Stack

Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · HeroUI v3 ·
`@gravity-ui/icons` · Firebase Auth · Firebase Data Connect (GraphQL/Postgres).

## Invariants — do not break these

- **Every account appears in its own household.** `CreateUserFromGoogle`
  creates three rows in one transaction: the `User`, its `UserSetting`, and a
  `FamilyMember` with `selfUser` set to that account. `selfUser` is `@unique`,
  so the "exactly one self entry per account" rule is the database's, not a
  convention. `DeleteFamilyMember` refuses to remove it, and the sidebar
  selects it by default. `sync-user` backfills it for older accounts.
- **`FamilyMember.user` is the OWNER; `FamilyMember.selfUser` is WHO IT IS.**
  They coincide on the self row and nowhere else. `isMine` gates editing;
  `isSelf` marks the account's own entry. Don't collapse them.
- **A recurring projection is a RULE, expanded — not rows.** One row holds
  the first occurrence; `recurrenceEndsOn` bounds it (null = indefinitely);
  `lib/recurrence.ts` expands it over the visible range. Two reads are needed
  (`ListMyTransactionsByDateRange` + `ListMyRecurringProjections`) because a
  rule's row sits on its start date, not in the month you're looking at.
- **Expansion overwrites `occurredOn`.** Correct for display, wrong for
  writes. Anything editing a transaction must pass it through `ruleRowOf()`
  first, or it moves the whole series' start onto the clicked occurrence.
  `occurrenceKey` — not `id` — is the React key; `id` stays the real row.
- **Projected and actual money live in ONE table.** A row the household
  expects (an upcoming bill, a paycheque due) is a `Transaction` with
  `status: "FORECASTED"`; something that happened is `POSTED`. There is no
  second table, deliberately — see the note on `Transaction.source` in
  `schema.gql`. Anything totalling real money must branch on `status`, never
  on `source`: marking a projection as received leaves `source: "FORECAST"`
  so its provenance survives.
- **An imported row is an ACTUAL, and `source` is only provenance.**
  A statement CSV writes `source: "IMPORT"`, `status: "POSTED"` — IMPORT sits
  beside MANUAL, never beside FORECAST. Nothing that totals money may branch on
  `source`; the happened/expected split runs entirely through `status`.
- **Re-importing is safe because of `@unique` columns, not because of a read.**
  `StatementImport.contentKey` catches the same file; `Transaction.importKey`
  catches the same line. The pre-flight reads in `useTransactionImport.ts` only
  turn the common case into a count instead of an error — two imports racing both
  see a clean slate, and the constraint is what stops the loser doubling a month
  of spending. Don't "optimize" either constraint away.
- **A fingerprint cannot catch a pending charge that has since settled, and that
  is the commonest real duplicate.** Wells Fargo reports one transaction twice in
  two different memo formats, usually on different dates and sometimes for
  different amounts. `Transaction.importRef` — the bank's own reference, present
  on settled rows and absent on pending ones — is what resolves it, and
  `lib/importReconcile.ts` is where the whole decision lives. It is pure on
  purpose: what a re-upload does is testable without a database.
- **Two references that are both present and DIFFERENT prove two separate
  transactions.** That check is what keeps two same-price shops at one shop in
  one week from being reported as a duplicate. Don't drop it when tuning the
  matcher.
- **The `probable` tier NEVER skips a row on its own.** It cannot tell a settled
  pending charge from a second identical purchase, so it reports and a person
  decides; `runImport` skips only the keys the caller passes in. Defaulting these
  to skipped silently drops real transactions, which is worse than a visible
  duplicate — a ledger missing a row is wrong in a way nobody reconciles against.
- **`importRef` is deliberately not `@unique`.** It is absent on exactly the rows
  that need matching most, and an amount that legitimately changes between
  pending and settled must reach a person rather than be refused outright.
- **Matching is count-aware, and that is what protects legitimate duplicates.**
  Every stored row can be claimed by at most one incoming row. Two identical
  coffees on one afternoon are two rows: a re-upload matches two and imports
  neither, and a third a month later is correctly new.
- **A second upload of an identical file passes `contentKey: undefined`.** Not a
  way around the `@unique` — it is what makes first-wins correct. Re-running a
  half-finished import is the documented fix for it, and sending the digest again
  refuses the header row and strands the retry.
- **Removing an import is two mutations, in order: rows, then header.**
  `Transaction.statementImport` is nullable, so Data Connect makes it
  `ON DELETE SET NULL` — deleting the header first clears the pointer on every
  row instead of removing them, and then only the importKeys can find them.
- **`transaction_insertMany` is unreachable from the client.** The generator
  rejects `_Data` list variables for both SDKs, so an import is
  `CreateTransaction` per row. The batch mutation and its `@auth(expr:)` guard
  over `vars.rows` are in git history if that ever changes; see the "Statement
  import" section in `mutations.gql`.
- **A `deleteMany`'s where-clause IS its guard.** No guard query can enumerate
  what a filter will match, so `DeleteStatementImportRows` repeats the
  `auth.uid` predicate inline beside the id. Dropping it does not throw — a
  housemate deletes your statement instead. Note `mustFail` is the wrong
  assertion for these in `verify:guards`: a `deleteMany` whose filter excludes
  everything *succeeds* having deleted nothing, so the test asserts the rows
  survived.
- **Every in/out figure comes from `lib/ledgerTotals.ts`.** These sums were
  written inline in three components and had to agree; a wrong total does not
  throw, it just shows a number nobody can account for. `ledgerTotals`,
  `totalsByDay` and `sumDays` are pure and heavily tested — add a figure there,
  not in a component.
- **`sumDays` takes the days to count, on purpose.** The calendar grid pads with
  adjacent months and can have the weekend hidden; a month total must be given
  the MONTH's days. Summing the whole map, or the rendered grid, leaks an
  adjacent month's money or drops a weekend's.
- **Hiding weekends is a VIEW filter and must never reach a total.**
  `visibleGridDays` returns days to render and takes no part in any sum. A total
  computed from it would silently lose a weekend's spending, and somebody
  reconciling against their bank would find the app short with nothing on screen
  to explain it.
- **Ignoring internal transfers DOES change totals — so any screen applying it
  must say so.** It is the one preference that moves a figure, which is why its
  toggle is in the NAVBAR: it changes Income, Expenses, Calendar, a day's detail
  and the household panel at once, and a control on one page implied it applied
  only there. Every place that applies it renders `excludedTransferCount`, because
  a total that omits rows the table below it lists is unreconcilable by hand.
- **Internal-transfer flags are RESOLVED AT READ TIME, not read off the columns.**
  `resolveInternalTransfers()` is what every list calls: stored flags win when set,
  else the memo, else pairing the two legs. Display must never wait on the stored
  value — a household that imported before those columns existed has none of them
  set, and the toggle then silently does nothing, which is what happened (1,062
  transfers unflagged). The columns are the durable record; this is the live answer.
- **Pairing is how an anonymous transfer is caught.** "CASH APP" and "VENMO" memos
  name nobody, so `classifyInternalTransfer` cannot place them — but when both
  accounts are imported the transfer is in the data twice, once per member.
  `pairTransfers()` requires opposite directions, identical amounts, a close date
  and BOTH sides looking like a transfer; that last condition is what stops a card
  purchase pairing with a paycheque. Same member → internal to user; different
  members → internal to family.
- **Excluding transfers changes the NET only where a leg is missing.** With both
  accounts imported the legs cancel and only in/out move. With one imported,
  counting it reports money as having left the household when it did not, so
  excluding it corrects the net — $3,980 on real data. Do not repeat the older
  claim that the net is identical either way; it is not.
- **There are TWO internal-transfer flags, and they answer different questions.**
  `isInternalToUser` is one account holder's own accounts; `isInternalToFamily` is
  two people inside the household. Both leave household totals together (the legs
  cancel), and keeping them apart is what makes "who paid whom inside this
  household" answerable later. `isInternal()` in `lib/internalTransfers.ts` is the
  "either kind" test every total uses.
- **Both flags are stored because the memo they come from is not**, and
  `lib/internalTransfers.ts` therefore classifies from the STORED `merchant` and
  `method` as well as from a raw memo. That is load-bearing, not a convenience:
  `extractMerchant` leaves the "ONLINE TRANSFER" prefix intact, which is the only
  reason rows imported before these columns existed can be repaired at all.
- **Every screen must filter and total the SAME list.** `useTransactions`,
  `useMyTransactions` and `useHouseholdMonth` each expose `transactions` (what
  exists) beside `visible` (what the household asked to see). Totalling one while
  listing the other is how a figure and its table come to disagree — which they
  did, on the household page, until `visible` existed there.
- **A classification can be right today and wrong tomorrow**, so
  `SetTransactionInternalFlags` + the re-check in Settings exist. A Zelle payment
  to Sarah is only internal once Sarah is in the roster. `reclassify()` returns
  only rows that would change, in both directions, so it is idempotent and a
  member leaving does not hide their payments forever.
- **Amounts render through `usePrivacyMode().formatAmount`, never `formatMoney`
  directly.** A component that formats money itself is one the hide-amounts
  toggle silently misses, and a screen that hides eleven figures out of twelve is
  worse than one that hides none — the person believes they are covered.
- **A roster label is derived per viewer, never the stored `relationship`.**
  `CreateUserFromGoogle` stamps "Self" on every account's own row, so two
  accounts in one household both claimed it. "Self" is a fact about who is
  looking; see `lib/householdRole.ts`.
- **A recurring rule always yields at least its first occurrence.**
  `recurrenceEndsOn` has no CHECK against `occurredOn`, and
  `useHouseholdMonth` drops every rule row from its range results and re-derives
  it from `occurrencesInRange` — so a rule that expanded to nothing VANISHED from
  the ledger while still sitting in the database.
- **Money is an integer.** Minor units only; every conversion goes through
  `lib/money.ts`. Never `parseFloat(x) * 100`. The per-major divisor comes
  from `Intl` because JPY has no minor unit.
- **`amountMinor` is unsigned.** `Transaction.direction` carries the sign and
  is authoritative per row — deliberately not derived from `Category.kind`,
  so refunds stay expressible.
- **Dates are local calendar days.** Never `new Date("yyyy-mm-dd")` or
  `toISOString()` for `occurredOn`. Use `lib/monthRange.ts`.
- **Every `USER`-level mutation taking a row id needs an ownership `@check`**
  inside a `@transaction`. See the two patterns documented at the top of
  `dataconnect/finance/mutations.gql`. No guard = cross-tenant write.
- **Where the checked row and the written row differ, the guard needs
  `@check(expr: "this != null")` on the top-level field too.** A guard query
  that matches nothing evaluates no nested checks, so absence reads as
  permission. Elsewhere that is survivable because the write also matches
  nothing; in the family mutations it is not. See the section header above
  `CreateFamily`.
- **Reads are household-wide; writes are not.** A row is visible if you own it
  or its owner is in your family — the `_or` + correlated-`exist` filter
  documented at the top of `queries.gql`, repeated verbatim by every household
  read. Authorship is unchanged, so anything the UI offers to edit must be
  gated on `isMine` or it will fail at a `@check` the user cannot see.
- **A `User` is never created without its `UserSetting`.** It is a nested
  insert inside `CreateUserFromGoogle`. This matters because
  `userSetting_update(first: {where: ...})` matching zero rows *reports
  success* — which is how every preference in the app silently failed to
  persist for every account until it was fixed.
- **`npm run seed` is the ONLY thing that creates the colour schemes, and it
  refuses to touch a real project.** That is why themes did not work in
  production — the rows had never been written there, so `ListColorSchemes`
  returned nothing and `DbThemeApplier` removed every override. `npm run seed:prod`
  is the deliberate path (see the script's header); `npm run seed:prod:dry`
  exercises the guards without writing, and is the one to reach for.
- **Run `npm run verify:guards` after touching `.gql`.** Nothing else covers
  the authorization boundary; vitest cannot reach it.
- **Feature flags are rendering hints.** Re-check server-side with
  `requireFeature()` (`lib/featureAccess.ts`).
- **Reads use `QueryFetchPolicy.SERVER_ONLY`.** The generated hooks' default
  cache is never invalidated by mutations.
- **Colors from the DB are untrusted.** Normalize via `lib/entityColor.ts`
  before any `color-mix()` — a malformed value drops the whole declaration.
- **Call `useFamilyMembers()` once per page** and pass the result down; it
  holds state in `useState`, not context, so two calls drift apart.

## Deliberately absent

**Plaid.** Removed entirely — tables, columns and mutations — rather than left
as unreachable scaffolding. When it lands it writes `Transaction` rows with
`source: "PLAID"` alongside the manual, projected and imported ones, which is
what the one-table decision above is for. Nothing here anticipates it beyond
that — though the CSV importer now occupies the same slot with
`source: "IMPORT"`, so the shape is no longer hypothetical.

**An admin UI.** `ListUsers`, `ListUserTypes` and `SetUserType` are kept
because the tier system they serve is kept (README documents `SetUserType` as
today's promotion path), but no page calls them yet.

## Dependencies

`package.json`'s `overrides` block pins `jose` to v4 for `jwks-rsa`. It looks
removable — nothing here imports either package directly — but it is
load-bearing: `firebase-admin` -> `jwks-rsa` does a CommonJS `require('jose')`,
and jose is ESM-only from v5, so without the pin `require('firebase-admin/auth')`
throws `ERR_REQUIRE_ESM` and every Admin-SDK route (i.e. sign-in) 500s.

It passes locally on Node 22.12+ regardless, because that Node can `require()`
an ES module — so this breaks **only on deploy**. `lib/dependencies.test.ts`
guards it.

## After editing `.gql`

```bash
npm run dataconnect:generate    # regenerates src/dataconnect-*
```

`npm run emulators` also regenerates them on schema reload, and the emulator
is the fastest way to validate schema + connector changes.

```bash
npm run verify:guards          # with the emulators running
```

Drives the connector over HTTP as three separately-minted identities and tries
to read and write across household boundaries. Run it after any change to
`schema.gql`, `mutations.gql` or `queries.gql` — a weakened guard does not
throw, it permits, and that is indistinguishable from success everywhere else.

## Layout

- `app/(app)/` — everything behind the navbar. Its layout renders `Navbar` and
  `OnboardingGate`. The navbar is deliberately NOT in the root layout.
- `app/(onboarding)/` — the chrome-free half, for accounts with no household
  yet. Route groups, not a `usePathname()` check inside `Navbar`. There is no
  navbar here, so sign-out lives in `OnboardingFlow`'s own `Shell` — and it has
  to redirect by hand, because `OnboardingGate` is in the `(app)` layout and does
  not run on these routes.
- `app/(app)/household/` — the one content page
- `app/(app)/calendar/[day]/` — one day's detail. A ROUTE, not a panel: a day is
  something people link to, send to a housemate and reach with the back button.
- `components/Finance/` — sidebar detail, transaction table, breakdown, form,
  and the statement-import dialog
- `components/Onboarding/` — the join-or-create flow, and the redirect gate
- `components/Family/` — the household panel in Settings: roster, invite code,
  join queue
- `components/Records/LedgerPage.tsx` — Income and Expenses are this one
  component pointed at opposite directions. Don't fork it back into two.
- `components/Utilities/ListBoxComponent.tsx` — the household sidebar
- `context/` — one provider per persisted preference, all fed by the single
  `GetMyUser` fetch in `UserSettingsContext`. Keep new ones below it.
  `PrivacyModeContext` also owns `formatAmount`, which every amount goes through.
- `hooks/useHouseholdMonth.ts` — one month of the whole household, for
  Income/Expenses/Calendar. Call once per page; it owns a `useFamilyMembers()`.
- `hooks/useFamily.ts` — the household, for Settings. Call once per page.
- `hooks/useOnboarding.ts` — join requests and household creation.
- `hooks/useTransactionImport.ts` — the write half of the CSV importer:
  `planImport()` decides what an upload would do and writes nothing;
  `runImport()` writes the header row, then its transactions, then the counts.
- `lib/money.ts`, `lib/monthRange.ts`, `lib/entityColor.ts` — domain rules
- `lib/inviteCode.ts` — invite codes are a capability, not an id: CSPRNG only
- `lib/familyStatus.ts` — the four join-request states
- `lib/transactionKind.ts` — projected vs. actual (`source`, `status`)
- `lib/recurrence.ts` — repeat intervals, end dates, month-clamped expansion
- `lib/ledgerTotals.ts` — every in/out figure in the app, and the four decisions
  behind them. Pure.
- `lib/householdRole.ts` — what to call a person in the roster, per viewer
- `lib/internalTransfers.ts` — which rows only shuffle money inside the
  household, and which of the two kinds. Pure; classifies from stored fields so
  old rows are repairable.
- `hooks/useInternalTransferSync.ts` — the re-check/backfill. Call once per page.
- `lib/privacy.ts` — masking amounts. Not a security boundary; says so.
- `lib/wellsFargoCsv.ts` — the read half of the CSV importer, and the only
  place a bank export is interpreted. Pure: no auth, no network, no DOM, so the
  whole mapping is tested against `transaction_data.example/`.
- `lib/importReconcile.ts` — what a re-uploaded, overlapping statement actually
  adds. Also pure, for the same reason. Its three tiers and the reason the last
  one only ever reports are documented at the top of the file.
- `transaction_data/` — gitignored, for your own real statement exports.
  `transaction_data.example/` holds the committed fake ones the tests read;
  never commit a real statement.
