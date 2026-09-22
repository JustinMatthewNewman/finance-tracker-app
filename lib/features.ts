// Type-only, as in the source template: a value import would tie this file to
// Node's ESM resolver if it is ever loaded by a plain .mjs seed script, which
// would then need tsconfig's allowImportingTsExtensions. Keeping it type-only
// avoids that entirely.
import type { UserTypeName } from "./userTypes";

// Single source of truth for the application features modelled by the Feature
// table (dataconnect/schema/schema.gql) and granted to tiers through the
// UserTypeFeature xref. Companion to lib/userTypes.ts.
//
// As with the tiers, SDL has no module system, so these names are repeated in
// dataconnect/seed_data.gql's SeedFeatures mutation. Everything in
// TypeScript/Node should import from here rather than writing the string.
//
// SECURITY: holding a feature is a *rendering* signal on the client. The value
// arrives from GetMyUser, which the browser can trivially spoof, so it must
// never be the only thing standing between a user and privileged data. Every
// feature-gated capability needs the same check re-run server-side against the
// caller's verified ID token — see assertHasFeature() in lib/featureAccess.ts.

// Renaming a value here is a DATA migration, not just a code change: Feature
// is keyed on `name`, and UserTypeFeature's foreign key references it, so the
// old row and its grants have to be replaced rather than edited in place.
// See the "renaming a feature" note on SeedFeatures in seed_data.gql.
export const FEATURE_NAMES = ["AdminPage", "UserTypeControl", "Reports"] as const;

export type FeatureName = (typeof FEATURE_NAMES)[number];

export function isFeatureName(value: string): value is FeatureName {
  return (FEATURE_NAMES as readonly string[]).includes(value);
}

/**
 * What each feature is, and which tiers hold it in a freshly seeded
 * environment. Mirrored by hand in dataconnect/seed_data.gql's SeedFeatures,
 * which cannot import from TypeScript — SDL has no module system.
 *
 * This is the *initial* grant matrix, not live state — once an environment is
 * running, grants are edited in the UserTypeFeature table, and this no longer
 * describes it.
 *
 * Typed as a total Record, so adding a name to FEATURE_NAMES without defining
 * it here is a compile error rather than a feature that silently seeds nowhere.
 */
export const FEATURE_DEFINITIONS: Record<
  FeatureName,
  { description: string; defaultTiers: readonly UserTypeName[] }
> = {
  AdminPage: {
    description: "Access to the admin page and its APIs.",
    defaultTiers: ["Admin"],
  },
  UserTypeControl: {
    // Separate from AdminPage on purpose: reading who exists and changing what
    // they can do are different privileges, and this one is a privilege-
    // escalation vector (whoever holds it can promote anyone, themselves
    // included, to any tier). Keeping it its own grant means a future
    // read-only auditor tier can hold AdminPage without it.
    description: "Change which tier a user belongs to.",
    defaultTiers: ["Admin"],
  },
  Reports: {
    // Granted to nobody on purpose — a dark launch. The Feature row exists and
    // the gate works, so shipping the surface later is an INSERT into
    // UserTypeFeature rather than a code change. This is what the xref buys
    // you, and it is why an unbuilt feature still belongs in this list.
    description: "Cross-household spending reports and exports.",
    defaultTiers: [],
  },
};
