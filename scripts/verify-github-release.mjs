import { githubApi, getGitHubRepository } from './github-api.mjs';
import {
  buildReleaseTag,
  extractReleaseNotes,
  isMainModule,
  readChangelog,
  readPackageJson,
} from './release-shared.mjs';

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

if (isMainModule(import.meta.url)) {
  await verifyGitHubReleasePreflight();
}
