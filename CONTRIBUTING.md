# Contributing

This repository currently centers on the `react-class-variants` v2 alpha line.

## Branch Model

- Open v2 feature and fix PRs against `next`.
- Treat `main` as the stable-ready branch during the alpha period.
- Keep legacy v1 work isolated to `v1-maintenance`.

Do not use `main` as the day-to-day v2 development branch while v2 remains in alpha.

## Local Setup

- Node.js `20.19+`
- `pnpm`
- React `19` for local test expectations

Install dependencies:

```bash
pnpm install
```

CI and the release gate both run `pnpm run verify` on Node `20.x`, `22.x`, and `24.x`. Local development only needs to satisfy the package minimum in `package.json`, but it is useful to keep the full support matrix in mind when touching runtime or packaging behavior.

## Typical Contributor Flow

1. Branch from `next`.
2. Make the change and run the smallest relevant checks while iterating.
3. Add a changeset if the branch carries release intent.
4. Run `pnpm run verify` before opening or updating a PR.
5. Run `pnpm run ci` when the branch should be fully release-ready.
6. Open or update the PR against `next`.

PRs to `next` also run the changeset coverage check in CI.

## Command Guide

### Core development

```bash
pnpm dev
pnpm test
pnpm test:coverage
pnpm lint
pnpm lint:all
pnpm lint:eslint
pnpm lint:format
pnpm build
```

What they do:

- `pnpm dev`: Vitest in watch mode
- `pnpm test`: runtime tests once
- `pnpm test:coverage`: runtime tests with coverage
- `pnpm lint`: TypeScript publish-surface check for `src/`
- `pnpm lint:all`: TypeScript check for `src/` plus runtime test files
- `pnpm lint:eslint`: ESLint for `src/` and `test/`
- `pnpm lint:format`: Prettier check
- `pnpm build`: ESM + declaration build through `tsup`

### Type, packaging, and consumer validation

```bash
pnpm test:built
pnpm test:types
pnpm test:types:contracts
pnpm test:types:editor
pnpm test:types:exports
pnpm test:types:consumers
pnpm lint:pkg
```

What they do:

- `pnpm test:built`: built runtime smoke test
- `pnpm test:types`: full type gate: build + built runtime + contracts + editor + exports + consumers
- `pnpm test:types:contracts`: `tsd` contract tests against the built package
- `pnpm test:types:editor`: editor/types tooling validation
- `pnpm test:types:exports`: packed export validation
- `pnpm test:types:consumers`: packaged Bundler and NodeNext ESM consumer fixtures
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
```

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
- `pnpm run check:changeset`: verifies that release-affecting changes include a changeset
- `pnpm run ci`: `check:changeset` plus `verify`

Useful Vitest shortcuts:

- run one file: `pnpm vitest run test/recipe.spec.ts`
- run by test name: `pnpm vitest run -t "compound variants"`

## Changesets and Release Intent

Add a changeset for any:

- source change
- public type change
- package metadata change
- build or release-affecting change

Notes:

- documentation-only changes usually do not need a changeset
- if a PR intentionally touches release-affecting files but should not ship a version, use an empty changeset
- if a prerelease redesign replaces an unreleased API, rewrite or delete stale pending `.changeset/*.md` files before the next alpha so `changeset pre exit` does not carry obsolete notes into the stable release plan

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
- The release workflow dispatches `CI` for the `changeset-release/next` branch after it updates the version-package PR, so release PRs receive the same checks as normal PRs.
- GitHub release bodies are generated from the matching `CHANGELOG.md` section.
- Before publishing, the release workflow validates that it can obtain npm dist-tag credentials; on GitHub Actions it uses npm's OIDC exchange flow instead of a long-lived `NPM_TOKEN` secret.
- After a successful alpha publish, the release workflow syncs npm dist-tags to the repo policy: prereleases move `alpha` to the new version and keep `latest` on the newest stable release when one exists, otherwise `latest` remains on the published prerelease.
- If that sync step fails, verify npm dist-tags explicitly because prerelease tagging affects install behavior.
- Keep already-published alpha history in `CHANGELOG.md`; do not rely on superseded pending changesets to document a redesign that has since been replaced.

The release workflow, version-package PR behavior, and post-publish checks are documented in [docs/release-process.md](./docs/release-process.md).
