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
- can be dispatched manually for an existing branch
- runs `pnpm run verify`
- tests on Node `20.x`, `22.x`, and `24.x`

### `Changeset Check` workflow

Defined in `.github/workflows/changeset-check.yml`.

- runs on pull requests targeting `next`
- also runs on pull requests targeting `main`
- executes `scripts/check-changeset.cjs`
- verifies that release-affecting changes are covered by a changeset

### `Release` workflow

Defined in `.github/workflows/release.yml`.

- runs on pushes to `next`
- runs the same `pnpm run verify` matrix as CI on Node `20.x`, `22.x`, and `24.x`
- uses `changesets/action`
- uses npm trusted publishing via GitHub Actions OIDC
- validates GitHub release/changelog readiness with `scripts/verify-github-release.mjs`
- validates npm dist-tag auth before publish with `scripts/verify-dist-tag-auth.mjs`
- publishes through the rerunnable `scripts/release-publish.mjs` wrapper
- reconciles npm dist-tags and GitHub Releases in separate workflow steps so both are attempted before the job fails

The release workflow has two paths:

1. If pending changesets exist on `next`, `changesets/action` opens or updates the `Version Packages` release PR, then `scripts/trigger-release-branch-ci.mjs` waits for `changeset-release/next` to appear and dispatches the normal `CI` workflow on that branch.
2. If no pending changesets remain on `next`, the workflow validates GitHub release/changelog readiness, validates npm dist-tag auth, runs the rerunnable publish wrapper, pushes any `v*` tags created on that commit, then runs npm dist-tag sync and GitHub Release sync as separate post-publish steps before applying a final failure gate.

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
- the release workflow validates both GitHub release/changelog readiness and npm dist-tag credentials before publish so obvious metadata failures stop before npm publication
- the publish wrapper is safe to rerun after a partial success: it skips duplicate publishes, treats an already-tagged earlier release commit as a no-op on newer commits, and only recreates a missing local tag when it has provenance for the current `HEAD`
- post-publish npm lookups retry through short registry propagation delays before deciding that a version or dist-tag update is missing
- the same release path works for the stable `2.0.0` publish from `next`; if you later move day-to-day releases from `next` to `main`, update workflow branch filters in the same change
- avoid manual `npm publish` unless it is explicitly required

Important notes:

- do not assume npm dist-tags are in the state you want after a publish unless the sync step has completed successfully
- `npm publish` and `npm dist-tag` are separate operations, so the workflow exchanges its GitHub Actions OIDC token for a short-lived npm registry token before mutating dist-tags
- GitHub Releases are reconciled in the same post-publish phase, so a dist-tag failure should not prevent the workflow from still attempting release-page repair
- if a prerelease redesign invalidates pending changesets, rewrite or delete the stale `.changeset/*.md` files before the next alpha so `changeset pre exit` does not pull obsolete notes into the stable release plan

## Post-Publish Verification

After a successful alpha publish, the workflow verifies and, when needed, repairs npm dist-tags to this policy:

- `alpha` points at the newest prerelease
- `latest` points at the newest stable release when one exists
- if no stable release exists yet for `react-class-variants`, `latest` stays on the published prerelease

Manual audit remains worthwhile:

```bash
npm view react-class-variants version dist-tags --json
```

If the automated step cannot repair tags, update them explicitly:

```bash
npm dist-tag add react-class-variants@<published-version> alpha
npm dist-tag add react-class-variants@<latest-stable-version> latest # only if a stable line exists
```

Why this matters:

- prerelease tagging affects install behavior
- trusted publishing covers package publication, while the release workflow uses npm's OIDC token-exchange API for post-publish dist-tag management

## GitHub Release Notes

GitHub Releases are not generated from the pull request body. The workflow extracts the release body from the matching `## <version>` section in `CHANGELOG.md`.

That keeps these surfaces aligned:

- the merged version-package PR diff
- `CHANGELOG.md` in the published package
- the GitHub Releases page

If a publish partially succeeds and the workflow is rerun on the same commit, the publish wrapper will:

- skip `changeset publish` when the version is already present on npm
- compare the published release tag or any registry provenance signal it has with the current `HEAD`
- recreate the local `v*` tag only when provenance matches
- continue with dist-tag and GitHub Release reconciliation instead of failing on a duplicate publish

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
- keep the release workflow allowed to write Actions, contents, pull requests, and OIDC tokens

### npm

- keep trusted publishing configured for `react-class-variants`
- keep the package's trusted publisher configuration pointed at `.github/workflows/release.yml` on `Jackardios/react-class-variants`
- repository-level `NPM_TOKEN` is no longer required for automated release dist-tag sync on GitHub Actions
- if legacy releases still matter, keep trusted publishing configured for `react-tailwind-variants`
- optional manual repair still needs interactive npm auth or a valid npm token outside the trusted-publishing workflow

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
