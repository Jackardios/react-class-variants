# Contributing

## Branches

- Open v2 feature and fix pull requests against `next`
- Treat `main` as stable-ready during the alpha period
- Use a dedicated maintenance branch for legacy v1 work

## Release intent

- Add a changeset for any source, public type, package metadata, or build/release-affecting change
- Use `pnpm run check:changeset` before opening a PR when the branch should carry release intent
- For intentional no-release PRs that still touch release-affecting files, add an empty changeset

## Local checks

```bash
pnpm install
pnpm lint
pnpm lint:all
pnpm test
pnpm build
pnpm test:types:contracts
pnpm test:types:exports
pnpm test:types:consumers
pnpm lint:pkg
pnpm run verify
pnpm test:types
pnpm run ci
```

- `pnpm lint` checks the publish surface in `src/`
- `pnpm lint:all` checks `src/` plus runtime tests and excludes `tsd` files, which are covered separately by `pnpm test:types`
- `pnpm test:types:contracts` runs `tsd` against the built package root instead of importing `src/` directly
- `pnpm test:types:exports` validates packed `types`, `main`, `module`, and `exports` wiring with `attw`
- `pnpm test:types:consumers` compiles packed ESM, CJS, and Bundler fixtures to catch consumer-facing DX regressions
- `pnpm lint:pkg` runs `publint` against the packed package metadata and publish surface
- `pnpm run verify` is the reusable package gate: lint + tests + type checks + package linting
- `pnpm test:types` runs the full type gate: build + contracts + packed export validation + packed consumer fixtures
- `pnpm run ci` adds the release-intent changeset check on top of `verify`

When a change affects public types, exports, or package metadata, run `pnpm test:types` locally before opening the PR. For the first release that changes the type-testing pipeline itself, do one manual VS Code / TS Server smoke-check against a consumer fixture to confirm completions still match the automated guarantees.

## Release flow

- Alpha releases are published from `next`
- Keep the release workflow `commit` and `title` inputs as plain `Version Packages`; `changesets/action` appends the prerelease tag automatically while prerelease mode is active
- After publish, verify npm dist-tags manually while the package stays in prerelease mode
- Stable `2.0.0` should be published only after `changeset pre exit`
