# AGENTS.md

Canonical repository guidance for LLMs and coding agents working in this repo.

`CLAUDE.md` must remain a symbolic link to `AGENTS.md`.

## Repo Snapshot

- Package name: `react-class-variants`
- Current line: `2.0.0-alpha.x`
- Legacy v1 package name: `react-tailwind-variants`
- Active v2 branch: `next`
- Stable-ready branch during alpha: `main`
- Legacy maintenance branch: `v1-maintenance`
- Changeset base branch: `next`
- Published v2 surface: ESM-only
- Local runtime expectations: Node.js `20.19+` and React `19`

## Non-Negotiables

- Treat this file as the canonical repo-specific agent context.
- Open v2 feature and fix PRs against `next`.
- Do not use `main` as the day-to-day v2 branch while v2 remains in alpha.
- Keep legacy v1 work isolated to `v1-maintenance`.
- Add a changeset for any source, public type, package metadata, build, or release-affecting change.
- Documentation-only changes usually do not need a changeset.
- If a prerelease redesign invalidates pending `.changeset/*.md` files, rewrite or delete the stale ones before the next alpha so `changeset pre exit` does not resurrect obsolete notes.
- Alpha publishing happens from GitHub Actions via npm trusted publishing; avoid manual `npm publish` unless explicitly required.
- The release workflow validates dist-tag credentials before publish and uses npm's OIDC exchange flow for automated dist-tag sync on GitHub Actions.
- Package tarballs must remain valid from a clean checkout where `dist/` is gitignored; `pack`/`publish` therefore rely on a `prepack` build step.
- After a successful alpha publish, verify npm dist-tags explicitly because prerelease tagging affects install behavior.
- When the release process changes, keep `AGENTS.md`, `CONTRIBUTING.md`, and `docs/release-process.md` aligned.

## Smallest Useful Commands

Use the smallest relevant gate while iterating.

### Day-to-day

```bash
pnpm dev           # Vitest watch mode
pnpm test          # runtime tests once
pnpm test:coverage # runtime tests with coverage
pnpm lint          # TypeScript publish-surface check for src/
pnpm lint:all      # TypeScript check for src/ plus runtime test files
pnpm lint:eslint   # ESLint for src/, test/, and scripts/
pnpm lint:format   # Prettier check
pnpm build         # tsup build -> dist/ (ESM + d.ts)
```

### Public-surface and packaging gates

```bash
pnpm test:built            # built runtime smoke test
pnpm test:types            # build + built runtime + contracts + editor + exports + consumers
pnpm test:types:contracts  # tsd contract tests
pnpm test:types:editor     # editor/types tooling validation
pnpm test:types:exports    # standalone packed export validation, including clean-checkout prepack coverage
pnpm test:types:consumers  # Bundler and NodeNext ESM consumer fixtures
pnpm lint:pkg              # publint package-surface check
```

### Full gates

```bash
pnpm run verify          # lint + lint:all + lint:eslint + lint:format + test + test:types + lint:pkg
pnpm run check:changeset # release-affecting branch/worktree changes must include a changeset
pnpm run ci              # check:changeset + verify
```

Useful Vitest shortcuts:

- one file: `pnpm vitest run test/recipe.spec.ts`
- by test name: `pnpm vitest run -t "compound variants"`

### Benchmarks and overhead

```bash
pnpm bench
pnpm bench:diagnostics:competitors
pnpm bench:competitors
pnpm bench:overhead
pnpm check:overhead
```

Use these only when you touch hot paths, entry points, or bundle-size-sensitive behavior. See `docs/benchmarks.md` for the full benchmark workflow.

## Public Contract

### Package root: `react-class-variants`

Exports:

- `recipe()`
- `styled()`
- `defineConfig()`
- `defineRecipeConfig()`
- `hasOwnProperty()`
- `mergeProps()`
- `mergeRefs()`
- `useMergeRefs()`
- public core and React types

### Core subpath: `react-class-variants/core`

Exports:

- `recipe()`
- core `defineConfig()`
- `defineRecipeConfig()`
- `hasOwnProperty()`
- core recipe types

Does not export React runtime helpers such as `styled()`, `mergeProps()`, or ref utilities.

### API Invariants

**`recipe(config)`**

- Canonical styling primitive.
- Use `base` for root recipes.
- Use `slots` for slotted recipes.
- Root direct calls return a class string.
- Slotted direct calls return slot render functions.
- `recipe.resolve(input, options)` splits variant props from a full prop bag.

**`defineRecipeConfig(config)`**

- Typed identity helper for preserving a config object alongside a recipe.
- Recipe instances do not expose a runtime `.config` property.

**`styled(base, recipe, options?)`**

- The only React builder.
- Supports intrinsic elements and custom React component bases.
- Slotted recipes require `view`.
- `withRender` is supported only for intrinsic bases.

**`defineConfig(options)`**

- Package-root `defineConfig()` returns `{ recipe, styled }`.
- Core-subpath `defineConfig()` returns `{ recipe }`.
- Use it to share merge and validation behavior.

### Variant and Prop Rules

- Variants without defaults are required.
- Variants with defaults are optional.
- Boolean variants use string keys `"true"` and `"false"` and accept boolean props.
- Do not mix boolean and named options inside the same variant.
- There is no separate `state` namespace in the current v2 alpha API; model behavioral state as regular variants.
- Variant keys are variant-first on component surfaces.
- Use `propAliases` when a base prop name needs an alternate public prop such as `htmlSize`.
- `forwardProps` re-adds selected resolved variant values into the forwarded prop bag.

## Code Map

### Entry points

- `src/index.ts`: package-root surface
- `src/core.ts`: core-only subpath surface without React runtime imports
- `src/react.ts`: React surface module for `styled()` and root `defineConfig()`

### Runtime and engine layers

- `src/internal/recipe-default.ts`: default environment-sensitive `recipe()` factory
- `src/internal/recipe.ts`: configurable recipe factory and shared resolution helpers
- `src/internal/engine/root.ts`: root recipe compilation and root `resolve()`
- `src/internal/engine/slot.ts`: slotted recipe compilation and slot `resolve()`
- `src/internal/engine/shared.ts`: compiled metadata, normalization, aliases, forwarding, and validation

### React adapter and utilities

- `src/internal/builders.tsx`: `styled()` adapter, slotted `view`, `withRender`, and host prop flow
- `src/internal/class-name.ts`: className flattening and append helpers
- `src/utils.ts`: `mergeProps`, `mergeRefs`, `useMergeRefs`
- `src/internal/core-utils.ts`: small core-only helpers such as `hasOwnProperty()`
- `src/internal/core-types.ts`: public core type surface
- `src/internal/react-types.ts`: public React-specific type surface

## Change Map

When you change public behavior, keep runtime behavior, types, package exports, fixtures, and docs aligned. No single layer is authoritative on its own.

### If you change recipe behavior

Touch as needed:

- `src/internal/recipe-default.ts`
- `src/internal/recipe.ts`
- `src/internal/engine/root.ts`
- `src/internal/engine/slot.ts`
- `src/internal/engine/shared.ts`
- `test/recipe.spec.ts`

### If you change `styled()` behavior

Touch as needed:

- `src/internal/builders.tsx`
- `src/react.ts`
- `test/component.spec.tsx`

### If you change React helpers

Touch as needed:

- `src/utils.ts`
- `src/internal/react-utils.ts`
- `test/utils.spec.tsx`

### If you change exports, public types, or package metadata

Touch as needed:

- `src/index.ts`
- `src/core.ts`
- `src/react.ts`
- `test/public-api.spec.ts`
- `test/types/contracts/*.test-d.tsx`
- `test/types/consumers/fixtures/*`
- `scripts/test-built-runtime.mjs`
- `scripts/test-types-editor.mjs`
- `scripts/test-types-exports.mjs`
- `scripts/test-types-consumers.mjs`
- affected docs and examples

For changes that touch recipe resolution, class merging, `styled()` behavior, prop routing, overloads, exports, or package metadata:

- update the relevant runtime tests in `test/`
- update type contract tests in `test/types/contracts/`
- update consumer fixtures in `test/types/consumers/` when package surface or exports change
- update docs and examples that describe the affected public behavior
- keep the package-root and core-subpath surfaces aligned across code, tests, fixtures, and docs
- keep `README.md` aligned with the primary user-facing API summary
- keep `docs/api-reference.md` aligned with the current primary user-facing contract
- keep `docs/benchmarks.md` aligned when benchmark commands or enforcement workflow change

## Release Notes

- v2 feature and fix PRs target `next`.
- Alpha releases publish from `next`.
- Changesets prerelease mode is active under the `alpha` tag.
- `changeset publish` creates the canonical `v*` git tag.
- The `Release` workflow verifies the same Node `20.x` / `22.x` / `24.x` matrix as CI before publishing.
- The `Release` workflow manually dispatches `CI` on `changeset-release/next` after `changesets/action` updates the release branch, because pushes made with the default GitHub Actions token do not trigger `push` or `pull_request` workflows.
- GitHub release bodies are generated from the matching `CHANGELOG.md` section for each `v*` tag.
- Before publish, the workflow validates changeset file structure, GitHub release/changelog readiness, and npm dist-tag credentials.
- The publish path is rerunnable after a partial success: if the version is already on npm, the workflow skips republishing, treats an already-tagged earlier release commit as a clean no-op on newer commits, and restores the local release tag only when it has a provenance signal for the current `HEAD`.
- Dist-tags follow an explicit policy in CI: prereleases move `alpha` to the published version and keep `latest` on the newest stable release when one exists, otherwise `latest` remains on the published prerelease. Stable publishes move `latest`.
- Post-publish reconciliation attempts both npm dist-tag sync and GitHub Release sync before failing the job, so one post-publish error does not mask the other repair path.
- npm registry reads in the release path are retry-aware so short propagation delays after publish do not immediately look like missing versions or broken dist-tags.
- The current automation covers alpha releases and the stable `2.0.0` publish from `next`; if the release branch changes after alpha, update the workflow branch filters in the same change.

Post-publish verification:

```bash
npm view react-class-variants version dist-tags --json
```

If CI could not sync dist-tags automatically, repair them explicitly:

```bash
npm dist-tag add react-class-variants@<published-version> alpha
npm dist-tag add react-class-variants@<latest-stable-version> latest # only if a stable line exists
```

See `docs/release-process.md` for the full release workflow.
