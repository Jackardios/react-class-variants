import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import {
  doesFirstParentIntroduceVersion,
  planReleasePublish,
} from '../scripts/release-publish.mjs';
import { extractReleaseNotes } from '../scripts/release-shared.mjs';
import { computeDesiredDistTags } from '../scripts/sync-dist-tags.mjs';
import { buildGitHubReleasePayload } from '../scripts/sync-github-releases.mjs';

const require = createRequire(import.meta.url);
const { parseChangesetFile } = require('../scripts/check-changeset.cjs');

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

  it('skips republish and recreates the local tag when registry provenance matches HEAD', () => {
    expect(
      planReleasePublish({
        headSha: 'abc123',
        headIntroducesVersion: false,
        localTagTarget: null,
        publishedGitHead: 'abc123',
        tag: 'v2.0.0-alpha.8',
        versionPublished: true,
      })
    ).toEqual({
      mode: 'restore-missing-tag',
      publishedCommitHint: 'abc123',
    });
  });

  it('treats an already-tagged older release commit as a no-op on newer commits', () => {
    expect(
      planReleasePublish({
        headSha: 'abc123',
        headIntroducesVersion: false,
        localTagTarget: 'def456',
        publishedGitHead: null,
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
        publishedGitHead: null,
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
        publishedGitHead: null,
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
        publishedGitHead: null,
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
