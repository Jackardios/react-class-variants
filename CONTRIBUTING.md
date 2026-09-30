# Contributing

This repository currently centers on the `react-class-variants` v2 alpha line.

## Branch Model

- Open v2 feature and fix PRs against `next`.
- Treat `main` as the stable-ready branch during the alpha period.
- Keep legacy v1 work isolated to `v1-maintenance`.

Do not use `main` as the day-to-day v2 development branch while v2 remains in alpha.

## Local Setup

- Node.js `22.12+`
- `pnpm`
- React `19` for local test expectations

Install dependencies:

```bash
pnpm install
```

CI and the release gate both run `pnpm run verify` on Node `22.x`, `24.x`, and `26.x`; CI also runs `pnpm run check:overhead` and `pnpm run release:dry-run` (the Version Packages step on a scratch worktree) once. The package supports the `engines` minimum in `package.json`, but the test tooling needs a current patch release: jsdom requires Node `22.22.2+` or `24.15+`. Keep the full support matrix in mind when touching runtime or packaging behavior.

## Typical Contributor Flow

1. Branch from `next`.
2. Make the change and run the smallest relevant checks while iterating.
3. Add a changeset if the branch carries release intent.
4. Run `pnpm run verify` before opening or updating a PR.
5. Run `pnpm run ci` when the branch should be fully release-ready.
6. Open or update the PR against `next`.

PRs to `next` and `main` also run the changeset coverage check in CI, as part of the required `build` check.

## Command Guide

### Core development

```bash
pnpm dev
pnpm test
pnpm test:coverage
pnpm lint
pnpm lint:all
pnpm lint:bench
pnpm lint:eslint
pnpm lint:format
pnpm lint:docs
pnpm build
```

What they do:

- `pnpm dev`: Vitest in watch mode
- `pnpm test`: runtime tests once
- `pnpm test:coverage`: runtime tests with enforced coverage thresholds (`vite.config.ts`); part of `pnpm run verify`
- `pnpm lint`: TypeScript publish-surface check for `src/`
- `pnpm lint:all`: TypeScript check for `src/` plus runtime test files
- `pnpm lint:bench`: TypeScript check for `bench/` (JS files through `checkJs`)
- `pnpm lint:eslint`: ESLint for `src/`, `test/`, `scripts/`, and `bench/`
- `pnpm lint:format`: Prettier check
- `pnpm lint:docs`: type-checks every `ts`/`tsx` block in `README.md` and `docs/` that imports a value from `react-class-variants`; such a block must compile on its own, while fragments that continue an earlier example are skipped. Start a block with a file-name comment (`// badge.recipe.ts`) to let later blocks import it
- `pnpm build`: ESM + declaration build through `tsup`

### Type, packaging, and consumer validation

```bash
pnpm test:built
pnpm test:types
pnpm test:types:contracts
pnpm test:types:editor
pnpm test:types:cost
pnpm test:types:packed
pnpm test:types:exports
pnpm test:types:consumers
pnpm lint:pkg
```

What they do:

- `pnpm test:built`: the runtime specs run against `dist/` (`vitest.built.config.ts` fails if any `src/` module loads), plus process-less import and SSR smoke checks
- `pnpm test:types`: full type gate: build + built runtime + contracts + editor + cost + packed
- `pnpm test:types:contracts`: `tsd` contract tests against the built package
- `pnpm test:types:editor`: editor/types tooling validation
- `pnpm test:types:cost`: type-checks one probe per construct (recipes, `resolve()`, `styled()`, `view`, JSX) against the built package and fails when TypeScript's instantiation count grows more than 10% over `test/types/type-cost-budget.json`; run `pnpm test:types:cost:update` when a change or a TypeScript upgrade moves it on purpose
- `pnpm test:types:packed`: packs once from a clean-checkout state (`dist/` hidden, so `prepack` builds), then runs both checks below on that tarball
- `pnpm test:types:exports`: `attw` export validation of the clean-checkout tarball only
- `pnpm test:types:consumers`: Bundler and NodeNext consumer fixtures, both compiling `test/types/consumers/smoke.ts` with `skipLibCheck: false` on TypeScript 5.4 (the supported minimum), the repository's 5.x, 6, and 7; the Bundler fixture also enables `exactOptionalPropertyTypes`
- `pnpm lint:pkg`: `publint` package-surface validation

When to use them:

- always run `pnpm test:types` when you change public types, exports, or package metadata
- use the focused subcommands only when you are investigating a specific failure or iterating on a narrow packaging issue

### Benchmarks and overhead

```bash
pnpm bench
pnpm bench:diagnostics:competitors
pnpm bench:competitors
pnpm bench:overhead
pnpm check:overhead
pnpm check:overhead:update
```

`pnpm check:overhead` runs in CI against the committed `bench/overhead/baseline.json`. When a change intentionally moves the bundle budget, run `pnpm check:overhead:update` and commit the new baseline in the same PR.

Use these when:

- a change touches hot paths
- you are investigating a bundle-size regression
- you are changing entry points, the React adapter, or the recipe engine

Benchmark tooling is documented in [docs/benchmarks.md](./docs/benchmarks.md).

### Full gates

```bash
pnpm run verify
pnpm run check:changeset
pnpm run ci
```

- `pnpm run verify`: reusable package gate covering linting, runtime tests, type gates, formatting, and package validation
- `pnpm run check:changeset`: verifies that release-affecting branch or local worktree changes include a changeset
- `pnpm run ci`: `check:changeset` plus `verify`

Useful Vitest shortcuts:

- run one file: `pnpm vitest run test/recipe-root.spec.ts`
- run by test name: `pnpm vitest run -t "compound variants"`

Specs run in `jsdom` by default. Specs that do not render React start with `// @vitest-environment node`, which keeps the suite fast; add it to new non-DOM spec files.

## Changesets and Release Intent

Add a changeset for any:

- source change
- public type change
- package metadata change
- build or release-affecting change

Notes:

- documentation-only changes usually do not need a changeset
- if a PR intentionally touches release-affecting files but should not ship a version, add an empty changeset with `pnpm changeset add --empty`
- changesets that an alpha has already released move to `.changeset/pre/`, and the stable `2.0.0` changelog is built from all of them; if a later redesign replaces an API one of them describes, rewrite or delete that file there

Use:

```bash
pnpm run check:changeset
```

## Expectations for Public-Surface Changes

The published v2 package surface is ESM-only. When you change anything user-visible, keep code, tests, fixtures, and docs aligned.

For changes that touch:

- recipe resolution
- `styled()` behavior
- React prop routing or class merging
- overloads and public types
- exports or package metadata

update the relevant:

- runtime tests in `test/`
- type contract tests in `test/types/contracts/`
- consumer fixtures in `test/types/consumers/`
- docs and examples

In particular:

- keep `README.md` aligned with the primary user-facing API summary
- keep `docs/api-reference.md` aligned with the current primary user-facing contract
- keep `docs/benchmarks.md` aligned when benchmark commands or enforcement workflow change

Do not treat any one of those layers as authoritative on its own. The shipped contract is the combination of runtime behavior, types, package exports, and documentation.

## Release Notes for Contributors

- Alpha releases publish from `next`.
- Publishing is handled by GitHub Actions via npm trusted publishing.
- Avoid manual `npm publish` unless it is explicitly required.
- `changeset publish` produces the canonical `v*` git tag.
- `pack` and `publish` build `dist/` via `prepack`, because `dist/` is gitignored and the tarball must remain valid from a clean checkout.
- The release workflow opens the version-package PR with a GitHub App token, so release PRs run the same CI as normal PRs without manual approval.
- GitHub release bodies are generated from the matching `CHANGELOG.md` section.
- Before publishing, the release workflow validates GitHub release/changelog readiness.
- `changeset publish` chooses the npm dist-tag, and CI never changes dist-tags afterwards: npm trusted publishing only authorizes `npm publish`. See [docs/release-process.md](./docs/release-process.md#post-publish-verification) for the tag rules and the manual repair commands.
- The publish step is intentionally rerunnable: if npm publication already succeeded on a prior attempt, the workflow skips republishing, treats an already-tagged earlier release commit as a clean no-op on newer commits, and only recreates the local `v*` tag when `HEAD` is the commit that introduced the version.
- After a successful publish, verify npm dist-tags explicitly.
- The publish step trusts a successful `changeset publish` exit instead of reading the registry back, because a trusted publish can take minutes to appear there.
- The current workflow is also valid for the stable `2.0.0` release from `next`; if the active release branch changes after alpha, update the workflow branch filters together with that policy change.
- Keep already-published alpha history in `CHANGELOG.md`; do not rely on superseded pending changesets to document a redesign that has since been replaced.

The release workflow, version-package PR behavior, and post-publish checks are documented in [docs/release-process.md](./docs/release-process.md).
