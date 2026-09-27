import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  doesFirstParentIntroduceVersion,
  planReleasePublish,
} from '../scripts/release-publish.mjs';
import {
  extractReleaseNotes,
  pollUntil,
  warnAnnotation,
} from '../scripts/release-shared.mjs';
import { computeDesiredDistTags } from '../scripts/sync-dist-tags.mjs';
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

describe('release metadata helpers', () => {
  it('keeps prerelease and latest tags aligned during alpha releases', () => {
    expect(
      Object.fromEntries(
        computeDesiredDistTags({
          prereleaseTag: 'alpha',
          publishedVersion: '2.0.0-alpha.8',
          publishedVersions: ['2.0.0-alpha.7', '2.0.0-alpha.8'],
        })
      )
    ).toEqual({
      alpha: '2.0.0-alpha.8',
      latest: '2.0.0-alpha.8',
    });
  });

  it('moves only latest during stable releases', () => {
    expect(
      Object.fromEntries(
        computeDesiredDistTags({
          prereleaseTag: 'alpha',
          publishedVersion: '2.0.0',
          publishedVersions: ['2.0.0-alpha.8', '2.0.0'],
        })
      )
    ).toEqual({
      latest: '2.0.0',
    });
  });

  it('keeps latest on the newest stable release when a prerelease follows it', () => {
    expect(
      Object.fromEntries(
        computeDesiredDistTags({
          prereleaseTag: 'alpha',
          publishedVersion: '2.11.0-alpha.0',
          publishedVersions: ['2.9.0', '2.10.0', '2.11.0-alpha.0', '2.2.0'],
        })
      )
    ).toEqual({
      alpha: '2.11.0-alpha.0',
      latest: '2.10.0',
    });
  });

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
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('polls until the predicate accepts a value and returns the last read', async () => {
    const reads = [null, 'pending', 'done'];
    const read = vi.fn(() => reads.shift());

    await expect(
      pollUntil(read, value => value === 'done', { stepMs: 0 })
    ).resolves.toBe('done');
    expect(read).toHaveBeenCalledTimes(3);

    await expect(
      pollUntil(
        () => 'stale',
        () => false,
        { attempts: 2, stepMs: 0 }
      )
    ).resolves.toBe('stale');
  });

  it('escapes multi-line GitHub Actions annotations', () => {
    vi.stubEnv('GITHUB_ACTIONS', 'true');
    const log = vi
      .spyOn(globalThis.console, 'log')
      .mockImplementation(() => {});

    warnAnnotation('100% done\r\nnext line');

    expect(log).toHaveBeenCalledWith('::warning::100%25 done%0D%0Anext line');
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
