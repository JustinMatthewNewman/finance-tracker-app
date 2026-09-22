import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

/**
 * Guards the `overrides` block in package.json.
 *
 * THE FAILURE THIS PREVENTS. firebase-admin depends on jwks-rsa, whose
 * `src/utils.js` is CommonJS and does a plain `require('jose')`. jose became
 * ESM-only at v5, so an unconstrained install resolves a jose that cannot be
 * require()d, and importing `firebase-admin/auth` dies with:
 *
 *   ERR_REQUIRE_ESM: require() of ES Module .../jose/dist/webapi/index.js
 *   from .../jwks-rsa/src/utils.js not supported
 *
 * That takes down every route using the Admin SDK — in this app, sign-in.
 *
 * WHY A TEST RATHER THAN A COMMENT. package.json cannot hold comments, and
 * the override looks like dead weight: nothing in this codebase imports jose
 * or jwks-rsa directly, so tidying dependencies is very likely to remove it.
 * That is exactly how it was dropped once already.
 *
 * WHY IT IS EASY TO MISS LOCALLY. Node 22.12+ can require() an ES module, so
 * on a recent local Node everything works and the breakage only appears on a
 * deployed runtime with an older Node. Asserting the package's shape catches
 * it at test time regardless of which Node is running the tests.
 *
 * The assertion is on require()-ability, not on a version number: if a future
 * jose ships a CommonJS entry point again, this should pass and the override
 * can go.
 */
describe("jose must stay require()-able by jwks-rsa", () => {
  it("resolves to a build with a CommonJS entry point", () => {
    // Resolved the way jwks-rsa itself would, so this follows any nesting
    // npm chose rather than assuming a hoisted top-level copy.
    const jwksEntry = require.resolve("jwks-rsa");
    const josePkgPath = require.resolve("jose/package.json", { paths: [jwksEntry] });
    const pkg = require(josePkgPath) as {
      version: string;
      type?: string;
      main?: string;
      exports?: Record<string, unknown>;
    };

    const rootExport = pkg.exports?.["."] as Record<string, unknown> | undefined;
    const hasRequireCondition = !!rootExport && "require" in rootExport;
    const isCommonJsPackage = pkg.type !== "module";

    expect(
      hasRequireCondition || isCommonJsPackage,
      `jose@${pkg.version} resolved under jwks-rsa is ESM-only, so ` +
        `require('firebase-admin/auth') will throw ERR_REQUIRE_ESM on any Node ` +
        `without require(esm). Restore the "overrides" block in package.json.`
    ).toBe(true);
  });

  it("is actually require()-able in practice", () => {
    const jwksEntry = require.resolve("jwks-rsa");
    const josePath = require.resolve("jose", { paths: [jwksEntry] });
    expect(() => require(josePath)).not.toThrow();
  });
});
