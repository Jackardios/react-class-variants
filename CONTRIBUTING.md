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
pnpm test:types
pnpm run ci
```

- `pnpm lint` checks the publish surface in `src/`
- `pnpm lint:all` checks `src/` plus runtime tests and excludes `tsd` files, which are covered separately by `pnpm test:types`
- `pnpm run ci` is the full local gate before opening a release-affecting PR

## Release flow

- Alpha releases are published from `next`
- After publish, verify npm dist-tags manually while the package stays in prerelease mode
- Stable `2.0.0` should be published only after `changeset pre exit`
