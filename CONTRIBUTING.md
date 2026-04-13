# Contributing

This repository is currently maintained around the `react-class-variants` v2 alpha line.

## Branch Model

- Open v2 feature and fix PRs against `next`
- Treat `main` as stable-ready during the alpha period
- Keep legacy v1 work isolated to `v1-maintenance`

Do not treat `main` as the day-to-day v2 development branch while v2 remains in alpha.

## Environment

- Node.js `20.19+`
- `pnpm`
- React `19` for local test expectations

Install dependencies with:

```bash
pnpm install
```

## Release Intent and Changesets

Add a changeset for any:

- source change
- public type change
- package metadata change
- build or release-affecting change

Use:

```bash
pnpm run check:changeset
```

Notes:

- documentation-only changes usually do not need a changeset
- if a PR intentionally touches release-affecting files but should not ship a version, use an empty changeset
- if a prerelease redesign replaces an unreleased API, rewrite or delete the stale pending `.changeset/*.md` files before the next alpha so `pre exit` does not carry obsolete notes into stable

## Command Guide

### Core development

```bash
pnpm dev
pnpm test
pnpm lint
pnpm lint:all
pnpm lint:eslint
pnpm build
```

What they cover:

- `pnpm dev`: Vitest in watch mode
- `pnpm test`: runtime tests once
- `pnpm lint`: TypeScript publish-surface check for `src/`
- `pnpm lint:all`: TypeScript check for `src/` plus runtime tests
- `pnpm lint:eslint`: ESLint for `src/` and `test/`
- `pnpm build`: ESM + declaration build through `tsup`

### Type and package surface validation

```bash
pnpm test:types
pnpm test:types:contracts
pnpm test:types:exports
pnpm test:types:consumers
pnpm lint:pkg
```

What they cover:

- `pnpm test:types`: full type gate
- `pnpm test:types:contracts`: `tsd` tests against the built package root
- `pnpm test:types:exports`: packed export validation with `attw`
- `pnpm test:types:consumers`: packed Bundler and NodeNext ESM consumer fixtures
- `pnpm lint:pkg`: `publint` against the packed package metadata and publish surface

When to run them:

- always run `pnpm test:types` when you change public types, exports, or package metadata
- prefer the full `pnpm test:types` umbrella command over trying to guess which sub-check matters

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
- you are evaluating a bundle-size regression
- you are changing entrypoints, React adapter behavior, or the core recipe engine

Benchmark tooling is documented in [docs/benchmarks.md](./docs/benchmarks.md).

### Full gates

```bash
pnpm run verify
pnpm run ci
```

- `pnpm run verify`: reusable package gate
- `pnpm run ci`: `verify` plus release-intent changeset validation

## Expectations for Public-Surface Changes

The published package surface is currently ESM-only. When you change anything in this area, make sure documentation and tests stay aligned.

For changes that touch:

- recipe resolution
- `styled()` behavior
- React prop merging
- overloads and types
- exports and package metadata

update:

- runtime tests in `test/`
- type contract tests in `test/types/contracts/`
- consumer fixtures in `test/types/consumers/` when relevant
- the corresponding docs and examples

## Release Notes for Contributors

- Alpha releases publish from `next`
- Publishing is handled by GitHub Actions via npm trusted publishing
- Avoid manual `npm publish` unless it is explicitly required
- `changeset publish` produces the canonical `v*` git tag
- After a successful alpha publish, verify npm dist-tags explicitly because prerelease tagging policy affects install behavior
- Keep already-published alpha history in `CHANGELOG.md`; do not rely on superseded pending changesets to document a redesign that has since been replaced

The release workflow and post-publish checks are documented in [docs/release-process.md](./docs/release-process.md).
