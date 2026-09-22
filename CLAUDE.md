# Finance Tracker Pro

Household finance tracker. Sidebar = people in the household; main panel =
one person's income and expenses for a month, with a category breakdown.

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
- **Feature flags are rendering hints.** Re-check server-side with
  `requireFeature()` (`lib/featureAccess.ts`).
- **Reads use `QueryFetchPolicy.SERVER_ONLY`.** The generated hooks' default
  cache is never invalidated by mutations.
- **Colors from the DB are untrusted.** Normalize via `lib/entityColor.ts`
  before any `color-mix()` — a malformed value drops the whole declaration.
- **Call `useFamilyMembers()` once per page** and pass the result down; it
  holds state in `useState`, not context, so two calls drift apart.

## After editing `.gql`

```bash
npm run dataconnect:generate    # regenerates src/dataconnect-*
```

`npm run emulators` also regenerates them on schema reload, and the emulator
is the fastest way to validate schema + connector changes.

## Layout

- `app/household/` — the one content page
- `components/Finance/` — sidebar detail, transaction table, breakdown, form
- `components/Utilities/ListBoxComponent.tsx` — the household sidebar
- `context/` — one provider per persisted preference, all fed by the single
  `GetMyUser` fetch in `UserSettingsContext`. Keep new ones below it.
- `lib/money.ts`, `lib/monthRange.ts`, `lib/entityColor.ts` — domain rules
