---
'react-class-variants': major
---

Align the published v2 package with its ESM-only surface and simplify the
entrypoints.

**Breaking changes:**

- Remove the `react-class-variants/react` subpath. Import the React surface
  from the package root and keep `react-class-variants/core` for recipe-only
  usage.
- Publish only ESM artifacts from the package root and
  `react-class-variants/core`. CommonJS `require()` consumers now need dynamic
  `import()` or an ESM consumer setup.

**Changes:**

- Align package metadata and export validation with the ESM-only root and
  `react-class-variants/core` entrypoints.
- Split the recipe runtime into dedicated root/shared/slot engine modules while
  preserving root and slot resolver behavior, slot renderer destructuring, and
  validate-mode freeze semantics.
- Reorganize benchmark tooling under `bench/`, add built-runtime smoke
  coverage, and expand competitor/overhead reports with isolated subprocess
  measurements, named bundle and TypeScript profiles, and RME-aware markdown
  tables.
