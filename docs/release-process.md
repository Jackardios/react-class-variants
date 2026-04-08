# Release process

## Branches

- `next` is the active v2 alpha branch
- `main` stays stable-ready and is not used for day-to-day v2 development during alpha
- Legacy v1 maintenance happens on a dedicated maintenance branch created from `v1.0.3`

## Daily workflow

1. Open v2 feature and fix PRs against `next`.
2. Add a changeset for any source, package metadata, public type, or build/release-affecting change.
3. Use `pnpm run check:changeset` before opening the PR when the change should affect release intent.
4. Merge to `next`; the release workflow handles alpha publishing.

## Alpha release policy

- `changesets` remains in prerelease mode with the `alpha` tag
- Alpha releases publish from `next`
- After publish, the workflow syncs `latest` to the newly published alpha and verifies `latest === alpha`
- This policy remains in place until stable `2.0.0` is cut

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
- Deprecate `react-tailwind-variants` after the legacy `1.0.4` metadata release

## One-time npm commands

Use these commands once you are authenticated with npm.

```bash
# Immediately align the currently published alpha line
npm dist-tag add react-class-variants@2.0.0-alpha.3 latest

# Deprecate the legacy package after publishing v1.0.4
npm deprecate "react-tailwind-variants@<=1.0.4" "Package renamed to react-class-variants. The v2 line is currently published as react-class-variants@alpha. Migration guide: https://github.com/jackardios/react-class-variants/blob/next/docs/migration-from-react-tailwind-variants.md"
```
