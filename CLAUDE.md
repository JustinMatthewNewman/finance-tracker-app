# Finance Tracker Pro

Household finance tracker. Sidebar = people in the household; main panel =
one person's income and expenses for a month, with a category breakdown.

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

## Known gap

The three Plaid mutations (`UpsertPlaidItem`, `UpsertBankAccount`,
`SyncPlaidTransaction`) are `USER`-level, take an unchecked `$userId`, and
upsert on a client-supplied `$id`. Nothing calls them — there is no Plaid
integration yet — but they are reachable from any browser with a token. Fix
both halves, or move them to `NO_ACCESS` behind a route handler, *before*
adding a call site. See the note above them in `mutations.gql`.

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
  yet. Route groups, not a `usePathname()` check inside `Navbar`.
- `app/(app)/household/` — the one content page
- `components/Finance/` — sidebar detail, transaction table, breakdown, form
- `components/Onboarding/` — the join-or-create flow, and the redirect gate
- `components/Family/` — the household panel in Settings: roster, invite code,
  join queue
- `components/Utilities/ListBoxComponent.tsx` — the household sidebar
- `context/` — one provider per persisted preference, all fed by the single
  `GetMyUser` fetch in `UserSettingsContext`. Keep new ones below it.
- `hooks/useFamily.ts` — the household, for Settings. Call once per page.
- `hooks/useOnboarding.ts` — join requests and household creation.
- `lib/money.ts`, `lib/monthRange.ts`, `lib/entityColor.ts` — domain rules
- `lib/inviteCode.ts` — invite codes are a capability, not an id: CSPRNG only
- `lib/familyStatus.ts` — the four join-request states
