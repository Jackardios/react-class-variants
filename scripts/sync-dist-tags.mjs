import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import {
  execAuthenticatedNpm,
  getReleaseRegistryUrl,
  resolveReleaseAuth,
} from './npm-release-auth.mjs';

const execFileAsync = promisify(execFile);
const args = process.argv.slice(2).filter(arg => arg !== '--');

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8')
);

let prereleaseTag = 'alpha';

try {
  const prereleaseConfig = JSON.parse(
    await readFile(new URL('../.changeset/pre.json', import.meta.url), 'utf8')
  );

  if (typeof prereleaseConfig.tag === 'string' && prereleaseConfig.tag) {
    prereleaseTag = prereleaseConfig.tag;
  }
} catch {}

const packageName = process.env.RELEASE_PACKAGE_NAME ?? packageJson.name;
const publishedVersion =
  args[0] ?? process.env.RELEASE_VERSION ?? packageJson.version;
const registryUrl = getReleaseRegistryUrl(process.env);

function isPrerelease(version) {
  return version.includes('-');
}

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

async function npmJson(...args) {
  const { stdout } = await execFileAsync('npm', args, {
    env: process.env,
    maxBuffer: 1024 * 1024 * 10,
  });

  return stdout.trim() ? JSON.parse(stdout) : null;
}

async function addDistTag(tag, version, auth) {
  try {
    await execAuthenticatedNpm(
      ['dist-tag', 'add', `${packageName}@${version}`, tag],
      {
        auth,
      }
    );
  } catch (error) {
    if (auth.source === 'token') {
      error.message = `${error.message}\n\nThe configured npm token could not update dist-tags. Refresh NODE_AUTH_TOKEN/NPM_TOKEN or switch this workflow to npm OIDC exchange.`;
    } else {
      error.message = `${error.message}\n\nnpm publish can use trusted publishing automatically, but dist-tag repair requires exchanging the GitHub Actions OIDC token for a short-lived npm registry token. Confirm this package still has a trusted publisher configured for this workflow.`;
    }

    throw error;
  }
}

const publishedVersions = normalizeArray(
  await npmJson('view', packageName, 'versions', '--json')
);
const currentDistTags =
  (await npmJson('view', packageName, 'dist-tags', '--json')) ?? {};
const stableVersions = publishedVersions
  .filter(version => !isPrerelease(version) && parseStableVersion(version))
  .sort(compareStableVersions);
const latestStableVersion = stableVersions.at(-1);
const desiredDistTags = new Map();

if (isPrerelease(publishedVersion)) {
  desiredDistTags.set(prereleaseTag, publishedVersion);
  desiredDistTags.set('latest', latestStableVersion ?? publishedVersion);
} else {
  desiredDistTags.set('latest', publishedVersion);
}

const pendingUpdates = [...desiredDistTags].filter(
  ([tag, version]) => currentDistTags[tag] !== version
);

if (pendingUpdates.length === 0) {
  console.log(
    `npm dist-tags already match policy for ${packageName}@${publishedVersion}.`
  );
  process.exit(0);
}

const auth = await resolveReleaseAuth({
  packageName,
  registryUrl,
});

console.log(
  `Using ${
    auth.source === 'oidc' ? 'npm OIDC exchange' : 'token'
  } auth for dist-tag updates.`
);

for (const [tag, version] of pendingUpdates) {
  console.log(`Setting npm dist-tag ${tag} -> ${version}`);
  await addDistTag(tag, version, auth);
}

const finalDistTags =
  (await npmJson('view', packageName, 'dist-tags', '--json')) ?? {};

for (const [tag, version] of desiredDistTags) {
  if (finalDistTags[tag] !== version) {
    console.error(
      `Expected npm dist-tag ${tag} -> ${version}, received ${
        finalDistTags[tag] ?? 'unset'
      }.`
    );
    process.exit(1);
  }
}

console.log(
  `npm dist-tags now match policy for ${packageName}@${publishedVersion}.`
);
