# Release process

## Branches

- `next` is the active v2 alpha branch
- `main` stays stable-ready and is not used for day-to-day v2 development during alpha
- Legacy v1 maintenance happens on a dedicated maintenance branch created from `v1.0.3`

## Daily workflow

1. Open v2 feature and fix PRs against `next`.
2. Add a changeset for any source, package metadata, public type, or build/release-affecting change.
3. Use `pnpm run check:changeset` before opening the PR when the change should affect release intent.
4. Run `pnpm run verify` for the reusable package gate, and `pnpm run ci` when you also need to validate release intent.
5. Merge to `next`; the release workflow publishes through npm trusted publishing and verifies the published version via `npm view`.

`pnpm run verify` includes the full type gate via `pnpm test:types`, which builds the package, runs `tsd` against the package root, validates packed exports with `attw`, compiles packed Bundler and NodeNext ESM consumer fixtures, and runs `publint` on the packed package surface. The published v2 package surface is currently ESM-only. `pnpm run ci` adds the release-intent changeset check on top.

## Alpha release policy

- `changesets` remains in prerelease mode with the `alpha` tag
- Alpha releases publish from `next` through npm trusted publishing
- Keep the release workflow `commit` and `title` inputs as plain `Version Packages`; `changesets/action` appends `(alpha)` automatically while pre mode is active
- `npm publish` runs in GitHub Actions without a long-lived `NPM_TOKEN`
- The release workflow publishes via trusted publishing and then pushes the release tags / GitHub releases without an extra npm registry gate
- Until `react-class-variants` has its first stable release, Changesets publishes prereleases under `latest`; do not assume the `alpha` dist-tag advances automatically
- `npm dist-tag` and `npm deprecate` remain manual npm-authenticated steps because trusted publishing only covers `npm publish`
- This policy remains in place until stable `2.0.0` is cut
- After the first alpha publish that changes the type-testing pipeline itself, do one manual VS Code / TS Server smoke-check against a consumer fixture to confirm completions still match the automated guarantees

## Stable release checklist

1. Ensure `next` contains the desired release state.
2. Run `changeset pre exit`.
3. Publish stable `2.0.0`.
4. Fast-forward `main` to the stable release commit.
5. Move the default branch back to `main` if that remains the desired long-term policy.

## Manual repository admin steps

These settings must be applied in GitHub and npm because they are outside the repository contents.

- Set GitHub default branch to `next` during the alpha period
- Protect `next` as the release branch for v2 alpha work
- Restrict direct development on `main` until stable `2.0.0`
- Configure npm trusted publishers for both `react-class-variants` and `react-tailwind-variants`
- Decide separately whether `react-tailwind-variants` should be deprecated; it is not part of the automated release flow

## One-time npm setup

- Configure a trusted publisher for `react-class-variants`:
  - Publisher: `GitHub Actions`
  - Organization or user: `Jackardios`
  - Repository: `react-class-variants`
  - Workflow filename: `release.yml`
  - Environment name: blank unless you intentionally publish from a GitHub Environment
- Configure the same trusted publisher settings for `react-tailwind-variants`
- In npm package settings, `Require two-factor authentication and disallow tokens` is compatible with trusted publishing and is the preferred end state once publish succeeds
- No GitHub Actions token is configured for `npm dist-tag`; if you want `react-class-variants@alpha` to keep following the newest prerelease before the first stable release, update that tag manually after publish

## Manual npm commands after publish

Use these commands once the corresponding version has been published and you are authenticated with npm locally.

```bash
# Inspect the version npm exposes by default and the active dist-tags
npm view react-class-variants version dist-tags --json

# If you want prerelease installs to stay explicit while the package is alpha-only,
# update the alpha dist-tag to the newly published version.
npm dist-tag add react-class-variants@2.0.0-alpha.5 alpha

# Optional: deprecate the legacy package if you later decide to show a registry warning
npm deprecate "react-tailwind-variants@<=1.0.4" "Package renamed to react-class-variants. The v2 line is currently published as react-class-variants@alpha. Migration guide: https://github.com/Jackardios/react-class-variants/blob/next/docs/migration-from-react-tailwind-variants.md"
```

If the package has not had a stable release yet, expect `npm view react-class-variants version` to point at the newest alpha because Changesets uses `latest` for prereleases until the first non-prerelease publish.
