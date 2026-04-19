import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { githubApi, getGitHubRepository } from './github-api.mjs';
import {
  buildReleaseTag,
  extractReleaseNotes,
  readChangelog,
  readPackageJson,
} from './release-shared.mjs';

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

export async function verifyGitHubReleasePreflight() {
  const packageJson = await readPackageJson(import.meta.url);
  const version = process.env.RELEASE_VERSION ?? packageJson.version;
  const tag = buildReleaseTag(version);
  const changelog = await readChangelog(import.meta.url);
  const notes = extractReleaseNotes(changelog, version);
  const repository = getGitHubRepository(process.env);

  await githubApi(`/repos/${repository}`, {
    env: process.env,
    expectedStatuses: [200],
  });

  await githubApi(
    `/repos/${repository}/releases/tags/${encodeURIComponent(tag)}`,
    {
      env: process.env,
      expectedStatuses: [200, 404],
    }
  );

  console.log(
    `Validated GitHub release auth and changelog notes for ${tag} (${
      notes.trim().length
    } chars).`
  );
}

if (isMain) {
  await verifyGitHubReleasePreflight();
}
