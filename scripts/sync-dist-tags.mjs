import { readFile } from 'node:fs/promises';
import {
  execAuthenticatedNpm,
  isNpmAuthError,
  resolveReleaseToken,
} from './npm-release-auth.mjs';
import {
  isMainModule,
  isPrereleaseVersion,
  npmView,
  pollUntil,
  readPackageJson,
  warnAnnotation,
} from './release-shared.mjs';

const args = process.argv.slice(2).filter(arg => arg !== '--');

function parseStableVersion(version) {
  const match = /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)$/.exec(version);

  if (!match?.groups) {
    return null;
  }

  return [
    Number(match.groups.major),
    Number(match.groups.minor),
    Number(match.groups.patch),
  ];
}

function compareStableVersions(left, right) {
  const leftParts = parseStableVersion(left);
  const rightParts = parseStableVersion(right);

  if (!leftParts || !rightParts) {
    throw new Error(`Cannot compare non-stable versions: ${left} vs ${right}`);
  }

  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] - rightParts[index];
    }
  }

  return 0;
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return [value];
  }

  return [];
}

export function computeDesiredDistTags({
  prereleaseTag,
  publishedVersion,
  publishedVersions,
}) {
  const stableVersions = normalizeArray(publishedVersions)
    .filter(
      version => !isPrereleaseVersion(version) && parseStableVersion(version)
    )
    .sort(compareStableVersions);
  const latestStableVersion = stableVersions.at(-1);
  const desiredDistTags = new Map();

  if (isPrereleaseVersion(publishedVersion)) {
    desiredDistTags.set(prereleaseTag, publishedVersion);
    desiredDistTags.set('latest', latestStableVersion ?? publishedVersion);
  } else {
    desiredDistTags.set('latest', publishedVersion);
  }

  return desiredDistTags;
}

async function addDistTag(packageName, tag, version, token) {
  await execAuthenticatedNpm(
    ['dist-tag', 'add', `${packageName}@${version}`, tag],
    { token }
  );
}

function formatDistTagCommands(packageName, updates) {
  return updates
    .map(
      ([tag, version]) => `npm dist-tag add ${packageName}@${version} ${tag}`
    )
    .join('\n');
}

async function readReleaseConfig() {
  const packageJson = await readPackageJson(import.meta.url);
  let prereleaseTag = 'alpha';

  try {
    const prereleaseConfig = JSON.parse(
      await readFile(new URL('../.changeset/pre.json', import.meta.url), 'utf8')
    );

    if (typeof prereleaseConfig.tag === 'string' && prereleaseConfig.tag) {
      prereleaseTag = prereleaseConfig.tag;
    }
  } catch {}

  return {
    packageName: process.env.RELEASE_PACKAGE_NAME ?? packageJson.name,
    prereleaseTag,
    publishedVersion:
      args[0] ?? process.env.RELEASE_VERSION ?? packageJson.version,
  };
}

export async function syncDistTags() {
  const { packageName, prereleaseTag, publishedVersion } =
    await readReleaseConfig();
  const publishedVersions = normalizeArray(
    await pollUntil(
      () => npmView(packageName, 'versions'),
      value => normalizeArray(value).includes(publishedVersion)
    )
  );

  if (!publishedVersions.includes(publishedVersion)) {
    throw new Error(
      `npm registry did not report ${packageName}@${publishedVersion} after publish.`
    );
  }

  const currentDistTags =
    (await pollUntil(
      () => npmView(packageName, 'dist-tags'),
      value => value !== null
    )) ?? {};
  const desiredDistTags = computeDesiredDistTags({
    prereleaseTag,
    publishedVersion,
    publishedVersions,
  });

  const pendingUpdates = [...desiredDistTags].filter(
    ([tag, version]) => currentDistTags[tag] !== version
  );

  if (pendingUpdates.length === 0) {
    console.log(
      `npm dist-tags already match policy for ${packageName}@${publishedVersion}.`
    );
    return;
  }

  const token = resolveReleaseToken(process.env);

  if (!token) {
    // Trusted publishing (OIDC) cannot update dist-tags, so surface the drift
    // as an annotation that is visible in the run summary.
    warnAnnotation(
      [
        `npm dist-tags for ${packageName}@${publishedVersion} need a manual repair: no npm token is configured for dist-tag updates.`,
        'Run:',
        formatDistTagCommands(packageName, pendingUpdates),
      ].join('\n')
    );
    return;
  }

  for (const [index, [tag, version]] of pendingUpdates.entries()) {
    console.log(`Setting npm dist-tag ${tag} -> ${version}`);
    try {
      await addDistTag(packageName, tag, version, token);
    } catch (error) {
      if (!isNpmAuthError(error)) throw error;
      warnAnnotation(
        [
          `npm rejected the configured token while updating dist-tags for ${packageName}@${publishedVersion}. Refresh or remove the NPM_TOKEN secret.`,
          'Run:',
          formatDistTagCommands(packageName, pendingUpdates.slice(index)),
        ].join('\n')
      );
      return;
    }
  }

  const finalDistTags =
    (await pollUntil(
      () => npmView(packageName, 'dist-tags'),
      value =>
        [...desiredDistTags].every(
          ([tag, version]) =>
            value && typeof value === 'object' && value[tag] === version
        )
    )) ?? {};

  for (const [tag, version] of desiredDistTags) {
    if (finalDistTags[tag] !== version) {
      throw new Error(
        `Expected npm dist-tag ${tag} -> ${version}, received ${
          finalDistTags[tag] ?? 'unset'
        }.`
      );
    }
  }

  console.log(
    `npm dist-tags now match policy for ${packageName}@${publishedVersion}.`
  );
}

if (isMainModule(import.meta.url)) {
  await syncDistTags();
}
