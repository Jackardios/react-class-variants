import { githubApi, getGitHubRepository } from './github-api.mjs';
import {
  extractReleaseNotes,
  git,
  isMainModule,
  isPrereleaseVersion,
  readChangelog,
} from './release-shared.mjs';

async function getReleaseTagsAtHead() {
  const output = await git(['tag', '--points-at', 'HEAD', 'v*']);

  return output
    .split('\n')
    .map(tag => tag.trim())
    .filter(Boolean);
}

async function getReleaseByTag(repository, tag) {
  const response = await githubApi(
    `/repos/${repository}/releases/tags/${encodeURIComponent(tag)}`,
    {
      env: process.env,
      expectedStatuses: [200, 404],
    }
  );

  if (!response || typeof response !== 'object' || !('id' in response)) {
    return null;
  }

  return response;
}

export function buildGitHubReleasePayload(tag, notes) {
  const version = tag.replace(/^v/, '');
  return {
    body: notes,
    name: tag,
    prerelease: isPrereleaseVersion(version),
    tag_name: tag,
  };
}

async function upsertRelease(repository, tag, notes) {
  const existingRelease = await getReleaseByTag(repository, tag);
  const payload = buildGitHubReleasePayload(tag, notes);

  if (existingRelease) {
    await githubApi(`/repos/${repository}/releases/${existingRelease.id}`, {
      env: process.env,
      expectedStatuses: [200],
      method: 'PATCH',
      payload,
    });
    console.log(`Updated GitHub release ${tag}.`);
    return;
  }

  await githubApi(`/repos/${repository}/releases`, {
    env: process.env,
    expectedStatuses: [201],
    method: 'POST',
    payload,
  });
  console.log(`Created GitHub release ${tag}.`);
}

export async function syncGitHubReleases() {
  const tags = await getReleaseTagsAtHead();

  if (tags.length === 0) {
    console.log('No release tags found on HEAD.');
    return;
  }

  const changelog = await readChangelog(import.meta.url);
  const repository = getGitHubRepository(process.env);

  for (const tag of tags) {
    const version = tag.replace(/^v/, '');
    const notes = extractReleaseNotes(changelog, version);
    await upsertRelease(repository, tag, notes);
  }
}

if (isMainModule(import.meta.url)) {
  await syncGitHubReleases();
}
