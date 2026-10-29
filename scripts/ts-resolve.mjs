// Lets a plain Node script `import` this repo's pure TypeScript libraries.
//
// WHY THIS EXISTS. scripts/seed-stress-test.mjs generates bank-statement CSVs
// and the Transaction rows they produce. Those rows have to agree with
// lib/wellsFargoCsv.ts exactly — same importKey, same extracted merchant, same
// guessed category, same internal-transfer flags — because the whole point of
// the fixture is that re-uploading the generated file reproduces what the app
// would do with a real one. The only way to guarantee that is to call the app's
// own parser rather than a second copy of its rules, and a second copy is what
// this file exists to avoid: a reimplementation that drifts would produce a
// fixture that silently disagrees with the code it is meant to exercise.
//
// Node can strip types from a .ts file on its own. What it cannot do is resolve
// the EXTENSIONLESS relative specifiers those files use — `from "./money"`,
// which is what TypeScript and the Next.js bundler both expect. That is the one
// gap this closes: it retries a relative, extensionless specifier with `.ts`
// appended, and otherwise does nothing at all.
//
// DEV-ONLY, AND DELIBERATELY NARROW. Nothing the app ships goes through this —
// `next dev` and `next build` have their own resolver, and `vitest` has Vite's.
// It is loaded by exactly one npm script, via `node --import`.
//
// Two registration APIs because the one to prefer is not available everywhere:
// `module.registerHooks` (synchronous, in-thread) landed in Node 22.15, and
// `module.register` — which still works, with a deprecation warning — is the
// fallback for 22.12-22.14. Feature-detected rather than version-sniffed.

import module from "node:module";

/** True for `./foo` and `../foo`, false for `./foo.ts`, `node:fs` or `uuid`. */
function isExtensionlessRelative(specifier) {
  return /^\.{1,2}\//.test(specifier) && !/\.[cm]?[jt]sx?$/.test(specifier);
}

if (typeof module.registerHooks === "function") {
  module.registerHooks({
    resolve(specifier, context, nextResolve) {
      if (isExtensionlessRelative(specifier)) {
        try {
          return nextResolve(`${specifier}.ts`, context);
        } catch {
          // Not a .ts file after all — fall through to the normal resolution,
          // so a genuinely missing module still reports its own error rather
          // than this one's.
        }
      }
      return nextResolve(specifier, context);
    },
  });
} else {
  // The off-thread loader API takes a module URL rather than a function, so the
  // same rule is inlined as a data: URL. Kept byte-identical in behaviour to the
  // branch above; if one changes, change both.
  const source = `
    export async function resolve(specifier, context, nextResolve) {
      if (/^\\.{1,2}\\//.test(specifier) && !/\\.[cm]?[jt]sx?$/.test(specifier)) {
        try { return await nextResolve(specifier + ".ts", context); } catch {}
      }
      return nextResolve(specifier, context);
    }
  `;
  module.register(`data:text/javascript,${encodeURIComponent(source)}`);
}
