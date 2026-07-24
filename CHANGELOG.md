# react-class-variants

## 2.0.0-alpha.12

### Patch Changes

- 7a96ac4: Treat explicitly `undefined` compound selector values as absent keys in both runtimes, consistent with `defaultVariants` and input props. Strict mode no longer throws at recipe creation for them, and the lean runtime no longer compiles them into matches-only-when-unset selectors. `undefined` entries inside selector arrays are filtered out; an array that ends up empty never matches.
- 7a96ac4: Drop compound variants that reference undeclared variant keys in the lean runtime. Previously the unknown key was skipped but the compound's `className` still compiled, so the compound applied on every render; it now never applies, matching cva/tailwind-variants semantics. Strict mode (`validate: 'always'`) keeps throwing at recipe creation.
- 7a96ac4: Memoize merged refs in the `styled()` render paths per ref pair. The render-prop and `host.render()` paths previously created a new callback ref every render, so React detached (`null`) and re-attached both underlying refs on every re-render; stable ref pairs now keep one identity across renders.
- 7a96ac4: Throw a descriptive error when `styled()`, `variantNames()`, or `variantOptions()` receives a function without compiled recipe metadata, and when `styled()` receives `null` or `undefined`, instead of an opaque `TypeError`. The message also hints at duplicated copies of the package, the other way a real recipe can lose its per-module brand.
- 7a96ac4: Create engine lookup tables (variant indexes, slot indexes, variant option maps) with null prototypes. Prototype-named keys and values such as `constructor` or `toString` no longer crash slot overrides, silently bypass strict slot validation, or leak `Object.prototype` members into class strings. Strict mode (`validate: 'always'`) now rejects variant keys that shadow an `Object.prototype` member at recipe creation.
- 7a96ac4: Use own-property checks for `propAliases` and `forwardProps` in `resolve()`. Inherited `Object.prototype` members (e.g. an alias public key named `toString`) no longer count as present props or leak functions into resolved props, and strict mode no longer throws spurious "would overwrite an existing resolved prop" errors for prototype-named targets. Own `__proto__` input keys (e.g. from `JSON.parse`) and `propAliases` targets named `__proto__` are dropped (rejected in strict mode) instead of swapping the prototype of the resolved props object.
- 7a96ac4: Encode result-cache keys with self-delimiting tokens. Boolean `true` versus the string `'true'`, option keys containing the old `\x00` separator, and empty-string versus unset selections no longer collide, so cached output can no longer depend on call history. Malformed non-string selection values (e.g. `null` or a number passed to a boolean variant) are type-tagged and coerced, so cache-enabled recipes neither crash nor serve poisoned entries for garbage input.
- 7a96ac4: Propagate React 19 callback-ref cleanups through `mergeRefs`, `useMergeRefs`, and the merged refs inside `styled()`. When an inner ref returns a cleanup, the merged ref now returns a combined cleanup that runs it and null-resets refs that returned none; previously cleanups were discarded and never ran. Refs without cleanups keep the legacy null-call behavior unchanged.

## 2.0.0-alpha.11

### Patch Changes

- 366e695: Narrow the result cache to root recipes. Slotted recipes are no longer cached: each slot resolves into a few short class strings that `merge` (e.g. tailwind-merge) already caches internally, so memoizing per-slot results cost more than it saved. Root recipe caching is unchanged.

## 2.0.0-alpha.10

### Minor Changes

- 65183d0: Add an opt-out result cache to lean recipes. When a `merge` function is configured (e.g. `defineConfig({ merge: twMerge })`), resolved class names are memoized per recipe so repeated identical inputs skip variant resolution and the `merge` call entirely — a large win for server-side rendering, where the same component variants resolve many times per request.

  The cache is enabled automatically only in lean mode and only when `merge` is set; disable it with `cache: false` or size it with `cache: { maxSize }` (default `500`, FIFO eviction). Strict mode (`validate: 'always'`) is never cached, so per-call validation always runs. Enabling the cache assumes `merge` is a pure function of its input.

## 2.0.0-alpha.9

### Major Changes

- bd4cd9e: Require React builders to come from `defineConfig()` instead of the package-root
  `styled` export.

  - remove the top-level `styled` value export from `react-class-variants`
  - keep `defineConfig().styled` as the supported React builder entrypoint
  - update docs, fixtures, and editor/runtime checks to use configured builders

### Minor Changes

- 50cf2ef: Add `variantNames()` and `variantOptions()` helpers for reading variant metadata from configs and recipes.

## 2.0.0-alpha.8

### Patch Changes

- 3c3fcc0: Harden release automation so npm dist-tag validation happens before publish and GitHub Actions can synchronize dist-tags with npm's OIDC exchange flow instead of relying on a long-lived repository token.

  The release workflow now also validates GitHub release/changelog readiness before publish, recovers safely on reruns after partial publish success, and catches malformed `.changeset/*.md` files during normal changeset coverage checks instead of at release time.

  It also waits through short npm registry propagation delays before deciding that a freshly published version or dist-tag update is still missing.

  The post-publish reconciliation path is now simpler too: the workflow runs npm dist-tag sync and GitHub Release sync as separate steps and applies the final failure gate afterward.

  Release tooling is also covered by ESLint now, which caught and prevents a latent dist-tag update bug in the non-no-op npm mutation path.

- 7c72ce5: Fix package packing and publishing from a clean checkout so the tarball always includes the built `dist/` entrypoints even though `dist/` is gitignored. Packed-export validation now exercises that clean-checkout flow as a standalone check, and the local changeset gate now considers staged, unstaged, and untracked release-affecting files before it decides whether a changeset is required.

## 2.0.0-alpha.7

### Minor Changes

- 2d139f9: Add `defineViewProps()` for declaring intrinsic `styled(..., { view })`
  component props that are consumed by `view`, exposed through `host.props`, and
  filtered before they reach the rendered host.
- 88ddebd: Add top-level `slotClassNames` overrides for slotted recipes, `resolve()`, and slotted `styled()` components.

## 2.0.0-alpha.6

### Major Changes

- c453cb5: Align the published v2 package with its ESM-only packaging and entrypoints.

  **Breaking changes:**

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

### Minor Changes

- f5515ff: Add `defineRecipeConfig()` as a zero-cost typed helper on the package root and `react-class-variants/core`, remove the runtime `recipe.config` property in favor of keeping recipe configs explicit, accept readonly string arrays across `ClassNameValue`-backed recipe fields, and tighten recipe creation performance with production-oriented compilation fast paths for root and slotted recipes.
- bf1ff60: Replace the v2 alpha API with the RFC-backed root React surface:

  - export `recipe()`, `styled()`, `defineConfig()`, React utilities, and public types from `react-class-variants`
  - make `recipe()` adapt from config shape into root or slotted recipes
  - require explicit slot maps for slotted variant and compound class values
  - make `styled()` accept intrinsic tags and custom React component bases
  - replace `compose` with hook-safe `view` components and `host` / `classes` view models
  - make slotted `classes` maps enumerable so they behave like normal objects in `view` composition
  - keep render polymorphism opt-in through `withRender` for intrinsic bases only
  - rename `nativeAliases` to `propAliases`
  - tighten `propAliases` typing around host prop collisions
  - improve editor typing and navigation for slotted recipes and `view`-based styled components
  - add reproducible overhead tooling for bundle size, runtime, retained memory, and synthetic TypeScript diagnostics

- f5515ff: Add the dedicated `react-class-variants/core` recipe-only subpath, reject mixed boolean/named variant options, validate runtime `className` inputs consistently, reduce retained recipe metadata on direct resolver usage, speed up recipe creation by simplifying config/default compilation, and expand benchmark reporting with synthetic gzip bundle-size comparisons.

### Patch Changes

- f91a2f2: Improve recipe runtime performance by switching the default package-root and
  core recipe factories to a lean, process-less-safe path, keeping checked
  runtime validation behind explicit `defineConfig({ validate: 'always' })`,
  tightening root and slot compilation, aligning lean slot payload storage with
  dense indexed slot tables, packing lean compound selectors, and removing
  temporary variant-index allocation during compound compilation.
- 145eb36: Relax the `render` prop callback typing back to a broad, spread-safe DOM prop bag.
  The callback now exposes generic HTML attributes plus any `forwardProps` variants,
  instead of implying intrinsic-element-specific resolved props as part of the
  stable public contract.
- 907025c: Fix `styled()` to accept recipes imported from `react-class-variants/core`
  reliably across packed consumer projects and benchmark harnesses.
- 3ea47a5: Tighten `defaultVariants` authoring types for `recipe()` and `defineRecipeConfig()` so editors surface the declared variant keys and values, while unknown `defaultVariants` keys now fail type checking.
- 39f4bcf: Improve the public type surface for low-level `recipe.resolve()` calls so `resolvedProps` tracks exact input props, `propAliases`, `forwardProps`, and root `className` more accurately. Forwarded variant props exposed to `styled(..., { withRender: true })` render callbacks are now typed as resolved values, the package root now exports `styled` as a single typed symbol with a public `StyledFn` type for cleaner editor navigation, and declaration builds now emit stable `index.d.ts` and `core.d.ts` entrypoints without hashed shared declaration chunks.
- bf1ff60: Improve recipe compile performance and reduce retained memory by compacting the compiled variant state and compound metadata.

## 2.0.0-alpha.5

### Minor Changes

- 42c538d: Drop official Node.js 18 support and require Node.js 20.19 or newer.

### Patch Changes

- 79bae6f: Fix public type gaps so the published package more accurately matches runtime behavior:

  - keep function-form `variantComponent(...).render` callbacks intentionally broad for ergonomic cross-element composition
  - allow `variantPropsResolver()` to accept `ClassNameValue` inputs and still return a flattened `className: string`
  - make `mergeProps()` use override-wins types for overlapping keys instead of impossible intersections like `never`

- 245d885: Improve reusable config ergonomics by adding `defineVariantConfig()` for
  literal-preserving hoisted configs and by accepting readonly arrays in
  `ClassNameValue`, `compoundVariants`, and `forwardProps`.
- 2ca1e17: Clarify the typed `render` contract, align documentation with `forwardProps` behavior, and strengthen verification workflows across the supported Node range.
- 3b581db: Fix the project-wide typecheck pipeline, improve exported utility typings, and align release hygiene documentation with the current alpha workflow.

## 2.0.0-alpha.4

### Patch Changes

- fb2953c: Ensure merged React event handlers preserve the override handler return value.

## 2.0.0-alpha.3

### Patch Changes

- d33c8fe: Fix `mergeProps` utility:

  - Preserve base `className` when override is falsy (null, undefined, empty string)
  - Preserve base event handler when override is null/undefined
  - Only merge React event handlers (onClick, onMouseDown, etc.), not props like "onboarding"

## 2.0.0-alpha.2

### Patch Changes

- 5dab28e: Optimize variants resolver function performance by pre-computing boolean variants and caching variant names

## 2.0.0-alpha.1

### Minor Changes

- a145ff8: Add advanced type utilities and improve type system

  **New Type Utilities:**

  - `ExtractVariantOptions<T>` - Universal utility to extract variant props type from any variant function, resolver, or component
  - `ExtractVariantConfig<T>` - Universal utility to extract full variant configuration from any variant function, resolver, or component
  - Enhanced internal type metadata with `__config` property for better type extraction

  **Type System Improvements:**

  - Added `VariantsResolverFn<C, V>` type with config metadata
  - Added `VariantPropsResolverFn<C, V>` type with config metadata
  - Simplified `BaseVariantComponentProps` by removing intermediate `OnlyVariantsConfig` type
  - Better type inference for variant configurations

  **Testing:**

  - Added 150+ lines of comprehensive type tests for new utilities
  - Tests for `ExtractVariantOptions` and `ExtractVariantConfig` working with `variants()`, `variantPropsResolver()`, and `variantComponent()`
  - Improved edge case coverage

  **Documentation:**

  - Added detailed section on type utilities in README
  - Examples for `ExtractVariantOptions` and `ExtractVariantConfig`
  - Usage patterns for extracting types from variant functions and components

  **Developer Experience:**

  - Added `test:types` script to package.json
  - Integrated type tests into CI pipeline
  - Added Vitest coverage and UI tools for better testing experience

## 2.0.0-alpha.0

### Major Changes

- 4285122: Complete v2 refactor with consolidated architecture and enhanced functionality

  **Breaking Changes:**

  - Complete library restructure - all functionality consolidated into single module
  - `styled()` API removed in favor of `variantComponent()`
  - `cx()` utility removed - class merging now handled via `defineConfig({ onClassesMerged })`
  - Changed exports structure - now use `defineConfig()` factory pattern

  **New Features:**

  - `defineConfig(options)` - Factory function for creating variants, variantPropsResolver, and variantComponent with shared configuration
  - `variantComponent()` - Create React components with variants support and polymorphic rendering
  - `variantPropsResolver()` - Extract variant props and resolve className from full props objects
  - Enhanced render prop pattern - supports both React elements and render functions
  - `forwardProps` option - Control which variant props get forwarded to DOM
  - `withoutRenderProp` option - Disable render prop pattern when not needed
  - Improved ref forwarding and merging with `useMergeRefs()`
  - Better event handler and props composition with `mergeProps()`

  **Type System Improvements:**

  - Stronger type inference for optional vs required variants
  - Boolean variants automatically optional
  - Variants with defaults automatically optional
  - Better polymorphic component type support

  **Testing:**

  - Complete comprehensive test suite with 170+ tests
  - Tests for variants resolution, React components, utilities, edge cases, and TypeScript types
  - Vitest + React Testing Library + tsd for type testing

  **Documentation:**

  - Complete README rewrite with all new APIs and examples

## 1.0.3

### Patch Changes

- 32ce10a: allow react v19 and tailwind-merge v2 and v3

## 1.0.2

### Patch Changes

- d57c9b7: typescript should throw an error when passed compoundVariants or defaultVariants with non-existing variants

## 1.0.1

### Patch Changes

- ac2ede4: Fix typings

## 1.0.0

### Major Changes

- 9c6f874: BREAKING CHANGE: set type `VariantsConfig` for `config` argument in `styled` function + fix typings
- 8dda492: BREAKING CHANGE: set `variants` in `VariantsConfig` optional + improve type-hints

## 0.1.3

### Patch Changes

- 0c1a5c5: Add vite.config.ts and .prettierrc files to npmignore
- 78d9d8c: Fix package homepage and bugs url

## 0.1.2

### Patch Changes

- fa364d4: update README.md

## 0.1.1

### Patch Changes

- 382b5b8: add test folder to .npmignore

## 0.1.0

### Minor Changes

- 2adff2e: initial release
