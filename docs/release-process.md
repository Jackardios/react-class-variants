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

- runs on every pull request and on pushes to `main` and `v1-maintenance`; pushes to `next` are verified by the `Release` workflow
- can be dispatched manually for an existing branch
- cancels an in-progress run when the same PR or branch is updated
- runs `pnpm run verify` on Node `22.x`, `24.x`, and `26.x` through the reusable `.github/workflows/verify.yml`
- runs `pnpm run check:overhead` once, against the committed `bench/overhead/baseline.json`
- runs `pnpm run release:dry-run` once: `scripts/release-dry-run.mjs` runs `changeset version` on a scratch worktree of the checked-out commit and checks that the version changes only when changesets are pending, matches the prerelease mode, has a `CHANGELOG.md` section for the GitHub release, and is not on npm yet
- on pull requests to `next` and `main`, runs `scripts/check-changeset.cjs` to verify that release-affecting changes are covered by a changeset; `Version Packages` PRs and Dependabot PRs skip it
- reports the combined result as a single `build` check, which branch protection requires
- pins every action to a commit SHA; Dependabot (`.github/dependabot.yml`) proposes action and devDependency updates monthly
- waits 7 days before adopting a new dependency version: pnpm's `minimumReleaseAge` (`pnpm-workspace.yaml`) and the Dependabot npm `cooldown` must stay equal, because Dependabot passes its cooldown to pnpm when it re-resolves the lockfile and a longer one rejects versions the lockfile already pins

### `Release` workflow

Defined in `.github/workflows/release.yml`.

- runs on pushes to `next`
- runs the same reusable `pnpm run verify` matrix as CI on Node `22.x`, `24.x`, and `26.x`
- uses `changesets/action` v2 with Changesets CLI v3; the action pushes the Version Packages commit through the GitHub API, so it is signed
- makes every GitHub write (release branch, Version Packages PR, tags, GitHub Releases) with a token from the release GitHub App, so the Version Packages PR runs CI like any other PR; the job's own `GITHUB_TOKEN` only reads the repository
- uses npm trusted publishing via GitHub Actions OIDC
- validates GitHub release/changelog readiness with `scripts/verify-github-release.mjs`
- publishes through the rerunnable `scripts/release-publish.mjs` wrapper
- relies on the package `prepack` lifecycle to build `dist/` for clean-checkout tarballs because `dist/` is gitignored
- relies on `scripts/test-types-packed.mjs` to validate packed exports in that same clean-checkout style locally
- creates or updates the GitHub Release after publish; npm dist-tags are left to `changeset publish` (see [Post-Publish Verification](#post-publish-verification))

The release workflow has two paths:

1. If pending changesets exist on `next`, `changesets/action` opens or updates the `Version Packages` release PR as the release GitHub App, which triggers the normal `CI` workflow on that PR.
2. If no pending changesets remain on `next`, the workflow validates GitHub release/changelog readiness, runs the rerunnable publish wrapper, pushes any `v*` tags created on that commit, then creates or updates the GitHub Release.

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
- the release workflow validates GitHub release/changelog readiness before publish
- the publish wrapper checks the registry once before publishing and streams `changeset publish` output live; if registry lag hides an earlier publish, npm rejects the duplicate and a rerun reconciles the release
- the publish wrapper is safe to rerun after a partial success: it skips duplicate publishes, treats an already-tagged earlier release commit as a no-op on newer commits, and only recreates a missing local tag when `HEAD` is the commit that introduced the version
- a trusted publish can take minutes to appear in the registry (about 160 seconds for `2.0.0-alpha.13`), so the publish wrapper trusts a successful `changeset publish` exit and does not read the registry back
- the same release path works for the stable `2.0.0` publish from `next`; if you later move day-to-day releases from `next` to `main`, update workflow branch filters in the same change
- avoid manual `npm publish` unless it is explicitly required

Important notes:

- npm limits trusted publishing auth to `npm publish`, so the workflow never changes dist-tags; any repair is a maintainer's manual step
- each alpha's `changeset version` moves the changesets it released into `.changeset/pre/`; the stable `changeset version` after `changeset pre exit` builds the `2.0.0` changelog from all of them, so rewrite or delete any there that a later redesign made obsolete

## Post-Publish Verification

`changeset publish` chooses the npm dist-tag:

- a stable publish moves `latest`
- in prerelease mode, a version goes to the pre tag (`alpha`)
- except that while every published version is a prerelease, Changesets publishes to `latest` and leaves the pre tag alone; this is why `2.0.0-alpha.13` went to `latest` while `alpha` stayed on `2.0.0-alpha.12`

After a publish, check the result:

```bash
npm view react-class-variants version dist-tags --json
```

The workflow cannot change dist-tags, because trusted publishing only authorizes `npm publish`. Repair one with a maintainer's npm login:

```bash
npm dist-tag add react-class-variants@<version> <tag>
npm dist-tag rm react-class-variants alpha # once a stable release supersedes the alpha line
```

Dist-tags decide what `npm install react-class-variants` and `npm install react-class-variants@alpha` resolve to.

## GitHub Release Notes

GitHub Releases are not generated from the pull request body. The workflow extracts the release body from the matching `## <version>` section in `CHANGELOG.md`.

That keeps these surfaces aligned:

- the merged version-package PR diff
- `CHANGELOG.md` in the published package
- the GitHub Releases page

If a publish partially succeeds and the workflow is rerun on the same commit, the publish wrapper will:

- skip `changeset publish` when the version is already present on npm
- compare an existing local `v*` tag with the current `HEAD`
- recreate a missing `v*` tag only when `HEAD` is the first-parent commit that bumped the package version
- continue with GitHub Release reconciliation instead of failing on a duplicate publish

## Stable Release Checklist

When preparing the first stable `2.0.0`:

1. Ensure `next` contains the intended stable release state.
2. Audit `.changeset/pre/*.md` and delete or rewrite any prerelease notes that describe superseded API shapes rather than the final stable surface.
3. Run `changeset pre exit`.
4. Publish stable `2.0.0`.
5. Check that `latest` points at `2.0.0`, then remove the stale `alpha` dist-tag, which still points at an alpha: `npm dist-tag rm react-class-variants alpha`.
6. Fast-forward `main` to the stable release commit.
7. Re-evaluate whether `main` should become the default branch again.

## Maintainer Setup Checklist

These settings live outside the repository and should be reviewed periodically.

### GitHub

- keep `next` as the default branch during the alpha period
- protect `next` as the active release branch for v2
- restrict direct day-to-day development on `main`
- require the `build` status check on `next` and `main`; it is the aggregate job in `.github/workflows/main.yml`, so matrix and job renames do not need protection updates
- keep the default workflow token read-only; the release job requests only `contents: read` and `id-token: write`
- keep the release GitHub App installed on this repository only, with repository permissions `Contents: Read and write` and `Pull requests: Read and write`; its Client ID is the `RELEASE_APP_CLIENT_ID` variable and its private key the `RELEASE_APP_PRIVATE_KEY` secret. Rotate the key by generating a new one in the app settings, updating the secret, and deleting the old key

### npm

- keep trusted publishing configured for `react-class-variants`
- keep the package's trusted publisher configuration pointed at `.github/workflows/release.yml` on `Jackardios/react-class-variants`
- no `NPM_TOKEN` secret is needed: trusted publishing authenticates the publish, and the workflow does not touch dist-tags
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
