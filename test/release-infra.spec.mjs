// @vitest-environment node
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  doesFirstParentIntroduceVersion,
  planReleasePublish,
} from '../scripts/release-publish.mjs';
import { checkVersionedRelease } from '../scripts/release-dry-run.mjs';
import {
  extractReleaseNotes,
  sanitizeNpmCliEnv,
} from '../scripts/release-shared.mjs';
import { buildGitHubReleasePayload } from '../scripts/sync-github-releases.mjs';

const require = createRequire(import.meta.url);
const {
  isReleaseAffecting,
  parseChangesetFile,
} = require('../scripts/check-changeset.cjs');

describe('release notes extraction', () => {
  it('returns the matching changelog section body', () => {
    const notes = extractReleaseNotes(
      `# Changelog

## 2.0.0-alpha.8

### Patch Changes

- Fix release pipeline.

## 2.0.0-alpha.7

- Old notes.
`,
      '2.0.0-alpha.8'
    );

    expect(notes).toBe(`### Patch Changes

- Fix release pipeline.
`);
  });

  it('fails when the changelog section is missing', () => {
    expect(() => extractReleaseNotes('# Changelog\n', '2.0.0-alpha.8')).toThrow(
      /Could not find CHANGELOG\.md section/
    );
  });

  it('extracts stable release notes without treating them as prereleases', () => {
    const notes = extractReleaseNotes(
      `# Changelog

## 2.0.0

### Major Changes

- Stable release.
`,
      '2.0.0'
    );

    expect(notes).toBe(`### Major Changes

- Stable release.
`);
  });
});

describe('release publish planning', () => {
  it('uses only the first-parent version to identify the release-introducing commit', () => {
    expect(doesFirstParentIntroduceVersion(null, '2.0.0-alpha.8')).toBe(true);
    expect(
      doesFirstParentIntroduceVersion('2.0.0-alpha.7', '2.0.0-alpha.8')
    ).toBe(true);
    expect(
      doesFirstParentIntroduceVersion('2.0.0-alpha.8', '2.0.0-alpha.8')
    ).toBe(false);
  });

  it('publishes an unpublished version', () => {
    expect(
      planReleasePublish({
        headSha: 'abc123',
        headIntroducesVersion: true,
        localTagTarget: null,
        tag: 'v2.0.0-alpha.8',
        versionPublished: false,
      })
    ).toEqual({ mode: 'publish', publishedCommitHint: null });
  });

  it('reconciles a rerun on the already-tagged release commit', () => {
    expect(
      planReleasePublish({
        headSha: 'abc123',
        headIntroducesVersion: true,
        localTagTarget: 'abc123',
        tag: 'v2.0.0-alpha.8',
        versionPublished: true,
      })
    ).toEqual({
      mode: 'reconcile-current-head',
      publishedCommitHint: 'abc123',
    });
  });

  it('treats an already-tagged older release commit as a no-op on newer commits', () => {
    expect(
      planReleasePublish({
        headSha: 'abc123',
        headIntroducesVersion: false,
        localTagTarget: 'def456',
        tag: 'v2.0.0-alpha.8',
        versionPublished: true,
      })
    ).toEqual({
      mode: 'already-published-elsewhere',
      publishedCommitHint: 'def456',
    });
  });

  it('treats a missing tag with no provenance as an already-published older release', () => {
    expect(
      planReleasePublish({
        headSha: 'abc123',
        headIntroducesVersion: false,
        localTagTarget: null,
        tag: 'v2.0.0-alpha.8',
        versionPublished: true,
      })
    ).toEqual({
      mode: 'already-published-elsewhere',
      publishedCommitHint: null,
    });
  });

  it('restores a missing tag when HEAD is the version-introducing commit', () => {
    expect(
      planReleasePublish({
        headSha: 'abc123',
        headIntroducesVersion: true,
        localTagTarget: null,
        tag: 'v2.0.0-alpha.8',
        versionPublished: true,
      })
    ).toEqual({
      mode: 'restore-missing-tag',
      publishedCommitHint: 'abc123',
    });
  });

  it('refuses to reuse a release tag that points at another commit', () => {
    expect(() =>
      planReleasePublish({
        headSha: 'abc123',
        headIntroducesVersion: false,
        localTagTarget: 'zzz999',
        tag: 'v2.0.0-alpha.8',
        versionPublished: false,
      })
    ).toThrow(/already exists at zzz999/);
  });
});

describe('GitHub release payload', () => {
  it('marks only dashed versions as GitHub prereleases', () => {
    expect(
      buildGitHubReleasePayload('v2.0.0-alpha.8', 'alpha notes').prerelease
    ).toBe(true);
    expect(buildGitHubReleasePayload('v2.0.0', 'stable notes').prerelease).toBe(
      false
    );
  });
});

describe('changeset validation', () => {
  it('accepts regular release changesets', () => {
    expect(
      parseChangesetFile(
        '.changeset/example.md',
        `---
'react-class-variants': patch
---

Fix release retries.
`
      )
    ).toEqual({
      body: 'Fix release retries.',
      releases: [
        {
          packageName: 'react-class-variants',
          type: 'patch',
        },
      ],
    });
  });

  it('accepts empty frontmatter changesets with a body', () => {
    expect(
      parseChangesetFile(
        '.changeset/example.md',
        `---
---

Document a no-release repo maintenance change.
`
      )
    ).toEqual({
      body: 'Document a no-release repo maintenance change.',
      releases: [],
    });
  });

  it('accepts empty changesets written by `changeset add --empty`', () => {
    // Raw @changesets/write output for `--empty` (before prettier) and the
    // prettier-formatted variant that lands on disk.
    for (const contents of ['---\n\n---\n\n\n  ', '---\n---\n']) {
      expect(parseChangesetFile('.changeset/empty.md', contents)).toEqual({
        body: '',
        releases: [],
      });
    }
  });

  it('still requires a summary for changesets that release packages', () => {
    expect(() =>
      parseChangesetFile(
        '.changeset/example.md',
        `---
'react-class-variants': patch
---
`
      )
    ).toThrow(/must include a non-empty summary body/);
  });

  it('rejects malformed frontmatter before release time', () => {
    expect(() =>
      parseChangesetFile(
        '.changeset/example.md',
        `## "react-class-variants": patch

Broken changeset file.
`
      )
    ).toThrow(/must start with YAML frontmatter/);
  });
});

describe('release shared helpers', () => {
  it('removes pnpm-only npm config env keys before invoking the npm CLI', () => {
    const env = sanitizeNpmCliEnv({
      PATH: '/usr/bin',
      npm_config__jsr_registry: 'https://npm.jsr.io',
      npm_config_auto_install_peers: 'true',
      NPM_CONFIG_NPM_GLOBALCONFIG: '/tmp/npmrc',
      npm_config_verify_deps_before_run: 'false',
    });

    expect(env).toEqual({ PATH: '/usr/bin' });
  });
});

describe('changeset coverage rules', () => {
  it('requires changesets only for files that reach the package or its release', () => {
    for (const file of [
      'src/index.ts',
      'package.json',
      'tsconfig.json',
      '.github/workflows/release.yml',
    ]) {
      expect(isReleaseAffecting(file), file).toBe(true);
    }

    for (const file of [
      'test/recipe.spec.ts',
      'tsconfig.test.json',
      'tsconfig.build.json',
      'vite.config.ts',
      'eslint.config.mjs',
      'docs/api-reference.md',
      'scripts/release-publish.mjs',
    ]) {
      expect(isReleaseAffecting(file), file).toBe(false);
    }
  });
});

describe('Changesets workspace', () => {
  it('includes the published package', async () => {
    // Resolve the copy Changesets uses to find the packages it versions.
    const changesetsRequire = createRequire(
      require.resolve('@changesets/cli/package.json')
    );
    const { getPackages } = await import(
      pathToFileURL(changesetsRequire.resolve('@manypkg/get-packages')).href
    );
    const { packages } = await getPackages(dirname(import.meta.dirname));

    expect(packages.map(pkg => pkg.packageJson.name)).toContain(
      'react-class-variants'
    );
  });
});

describe('release dry run', () => {
  const changelog = `# react-class-variants

## 2.0.0-alpha.15

### Patch Changes

- Improve editor hints.

## 2.0.0-alpha.14

- Old notes.
`;
  const pending = {
    changelog,
    hasChangesets: true,
    nextVersion: '2.0.0-alpha.15',
    preMode: true,
    previousVersion: '2.0.0-alpha.14',
    published: false,
  };

  it('accepts a new, unpublished version with release notes', () => {
    expect(checkVersionedRelease(pending)).toBe(
      'Version Packages would release 2.0.0-alpha.14 -> 2.0.0-alpha.15 (42 chars of release notes).'
    );
  });

  it('accepts an unchanged version when no changesets are pending', () => {
    expect(
      checkVersionedRelease({
        ...pending,
        hasChangesets: false,
        nextVersion: '2.0.0-alpha.14',
      })
    ).toMatch(/keeps 2\.0\.0-alpha\.14/);
  });

  it('rejects a version that is already on npm', () => {
    expect(() =>
      checkVersionedRelease({ ...pending, published: true })
    ).toThrow('which is already on npm');
  });

  it('rejects a version that does not match the prerelease mode', () => {
    expect(() => checkVersionedRelease({ ...pending, preMode: false })).toThrow(
      'prerelease mode is off'
    );
    expect(() =>
      checkVersionedRelease({
        ...pending,
        changelog: changelog.replace('2.0.0-alpha.15', '2.0.0'),
        nextVersion: '2.0.0',
      })
    ).toThrow('prerelease mode is on');
  });

  it('rejects a version bump that pending changesets do not explain', () => {
    expect(() =>
      checkVersionedRelease({ ...pending, nextVersion: '2.0.0-alpha.14' })
    ).toThrow('although changesets are pending');
    expect(() =>
      checkVersionedRelease({ ...pending, hasChangesets: false })
    ).toThrow('without pending changesets');
  });

  it('rejects a version without a changelog section', () => {
    expect(() =>
      checkVersionedRelease({
        ...pending,
        changelog: '# react-class-variants\n',
      })
    ).toThrow('Could not find CHANGELOG.md section for version 2.0.0-alpha.15');
  });
});
