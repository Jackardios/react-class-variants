# Release Process

This document describes the current release process for the `react-class-variants` v2 alpha line.

## Branches

- `next`: active v2 development and alpha release branch
- `main`: stable-ready branch during the alpha period
- `v1-maintenance`: legacy `react-tailwind-variants` maintenance branch

## Normal Development Flow

1. Open feature and fix PRs against `next`.
2. Add a changeset for any source, public type, package metadata, or build/release-affecting change.
3. Run `pnpm run verify` for the reusable package gate.
4. Run `pnpm run ci` when the branch should carry release intent.
5. Merge to `next`.

`pnpm run verify` includes:

- linting
- runtime tests
- build
- the full type gate
- package metadata validation

`pnpm run ci` adds the changeset check on top.

## Alpha Release Policy

- v2 remains in Changesets prerelease mode under the `alpha` tag
- alpha releases publish from `next`
- publishing happens from GitHub Actions through npm trusted publishing
- avoid manual `npm publish` unless explicitly required

Important packaging notes:

- the published v2 package surface is ESM-only
- until the first stable `2.0.0`, Changesets publishes prereleases under `latest`
- do not assume the `alpha` dist-tag advances automatically
- dist-tag management remains a manual npm-authenticated step
- if a prerelease redesign invalidates pending changesets, rewrite or delete the stale `.changeset/*.md` files before the next alpha; otherwise `changeset pre exit` will pull those obsolete notes into the stable release plan

## Release Workflow Expectations

Keep the release workflow metadata simple:

- workflow `commit`: `Version Packages`
- workflow `title`: `Version Packages`

`changesets/action` appends the prerelease marker automatically while prerelease mode is active.

## Post-Publish Verification

After a successful alpha publish, verify npm dist-tags explicitly.

Use:

```bash
npm view react-class-variants version dist-tags --json
```

If you want `react-class-variants@alpha` to follow the newest prerelease, update it manually:

```bash
npm dist-tag add react-class-variants@<published-version> alpha
```

Why this matters:

- prerelease tagging affects install behavior
- trusted publishing covers `npm publish`, not `npm dist-tag`

## Stable Release Checklist

1. Ensure `next` contains the desired release state.
2. Audit pending `.changeset/*.md` files and delete or rewrite any prerelease notes that describe superseded API shapes rather than the final stable surface.
3. Run `changeset pre exit`.
4. Publish stable `2.0.0`.
5. Fast-forward `main` to the stable release commit.
6. Re-evaluate whether `main` should become the default branch again.

## Manual Repository and npm Setup

These settings live outside the repository and should be checked periodically.

### GitHub

- set the default branch to `next` during the alpha period
- protect `next` as the release branch for v2 alpha work
- restrict direct day-to-day development on `main`

### npm

- configure trusted publishing for `react-class-variants`
- configure trusted publishing for `react-tailwind-variants`
- optionally require 2FA and disallow tokens once trusted publishing is confirmed

Trusted publisher settings:

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
