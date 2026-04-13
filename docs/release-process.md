# Release Process

This document describes the current release process for the `react-class-variants` v2 alpha line.

## Current Release Topology

- `next`: active v2 development branch and alpha release branch
- `main`: stable-ready branch during the alpha period
- `v1-maintenance`: legacy `react-tailwind-variants` maintenance branch
- Changesets base branch: `next`
- Changesets prerelease mode: active under the `alpha` tag

The published v2 package surface is ESM-only.

## CI and Release Workflows

### `CI` workflow

Defined in `.github/workflows/main.yml`.

- runs on every push and pull request
- runs `pnpm run verify`
- tests on Node `20.x`, `22.x`, and `24.x`

### `Changeset Check` workflow

Defined in `.github/workflows/changeset-check.yml`.

- runs on pull requests targeting `next`
- executes `scripts/check-changeset.cjs`
- verifies that release-affecting changes are covered by a changeset

### `Release` workflow

Defined in `.github/workflows/release.yml`.

- runs on pushes to `next`
- runs `pnpm run verify`
- uses `changesets/action`
- uses npm trusted publishing via GitHub Actions OIDC

The release workflow has two paths:

1. If pending changesets exist on `next`, `changesets/action` opens or updates the `Version Packages` release PR.
2. If no pending changesets remain on `next`, the workflow runs `pnpm run release`, pushes any `v*` tags created on that commit, and creates the corresponding GitHub release entries.

In practice, this means the version-package PR is the staging step and the publish happens after that PR is merged back into `next`.

## Normal Development Flow

1. Open feature and fix PRs against `next`.
2. Add a changeset for any source, public type, package metadata, build, or release-affecting change.
3. Run `pnpm run verify` before opening or updating the PR.
4. Run `pnpm run ci` when the branch should be release-ready.
5. Merge to `next`.

`pnpm run verify` is the main reusable package gate. It covers:

- TypeScript checks
- ESLint
- Prettier check
- runtime tests
- build
- full type validation
- package-surface validation

`pnpm run ci` adds the changeset coverage check on top.

## Alpha Release Policy

- v2 releases are published from `next`
- prerelease mode stays active under the `alpha` tag until the stable `2.0.0` transition
- publishing happens from GitHub Actions through npm trusted publishing
- avoid manual `npm publish` unless it is explicitly required

Important notes:

- do not assume npm dist-tags are in the state you want after a publish
- `npm publish` and `npm dist-tag` are separate operations
- if a prerelease redesign invalidates pending changesets, rewrite or delete the stale `.changeset/*.md` files before the next alpha so `changeset pre exit` does not pull obsolete notes into the stable release plan

## Post-Publish Verification

After a successful alpha publish, verify npm dist-tags explicitly:

```bash
npm view react-class-variants version dist-tags --json
```

If `react-class-variants@alpha` should point at the newest prerelease, update it explicitly:

```bash
npm dist-tag add react-class-variants@<published-version> alpha
```

Why this matters:

- prerelease tagging affects install behavior
- trusted publishing covers package publication, not post-publish dist-tag management

## Stable Release Checklist

When preparing the first stable `2.0.0`:

1. Ensure `next` contains the intended stable release state.
2. Audit pending `.changeset/*.md` files and delete or rewrite any prerelease notes that describe superseded API shapes rather than the final stable surface.
3. Run `changeset pre exit`.
4. Publish stable `2.0.0`.
5. Fast-forward `main` to the stable release commit.
6. Re-evaluate whether `main` should become the default branch again.

## Maintainer Setup Checklist

These settings live outside the repository and should be reviewed periodically.

### GitHub

- keep `next` as the default branch during the alpha period
- protect `next` as the active release branch for v2
- restrict direct day-to-day development on `main`
- keep the release workflow allowed to write contents, pull requests, and OIDC tokens

### npm

- keep trusted publishing configured for `react-class-variants`
- if legacy releases still matter, keep trusted publishing configured for `react-tailwind-variants`
- optionally require 2FA and remove legacy publish tokens once trusted publishing is confirmed

Trusted publisher settings for the current v2 package:

- publisher: `GitHub Actions`
- owner: `Jackardios`
- repository: `react-class-variants`
- workflow file: `release.yml`
- environment: blank unless you intentionally publish from a GitHub Environment

## Optional Legacy Package Actions

Decide separately whether the legacy `react-tailwind-variants` package should be deprecated in the npm registry. That decision is not part of the automated v2 release flow.

Example:

```bash
npm deprecate "react-tailwind-variants@<=1.0.4" "Package renamed to react-class-variants. Migration guide: https://github.com/Jackardios/react-class-variants/blob/next/docs/migration-from-react-tailwind-variants.md"
```
