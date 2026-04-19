import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import {
  execAuthenticatedNpm,
  getReleaseRegistryUrl,
  resolveReleaseAuth,
  sanitizeNpmCliEnv,
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

function delay(ms) {
  return new Promise(resolvePromise => {
    setTimeout(resolvePromise, ms);
  });
}

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
    env: sanitizeNpmCliEnv(process.env),
    maxBuffer: 1024 * 1024 * 10,
  });

  return stdout.trim() ? JSON.parse(stdout) : null;
}

async function waitForJson({ commandArgs, predicate }) {
  let lastValue = null;

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    lastValue = await npmJson(...commandArgs);

    if (predicate(lastValue)) {
      return lastValue;
    }

    if (attempt < 8) {
      await delay(attempt * 1500);
    }
  }

  return lastValue;
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
  await waitForJson({
    commandArgs: ['view', packageName, 'versions', '--json'],
    predicate: value => normalizeArray(value).includes(publishedVersion),
  })
);

if (!publishedVersions.includes(publishedVersion)) {
  throw new Error(
    `npm registry did not report ${packageName}@${publishedVersion} after publish.`
  );
}

const currentDistTags =
  (await waitForJson({
    commandArgs: ['view', packageName, 'dist-tags', '--json'],
    predicate: value => value !== null,
  })) ?? {};
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
  (await waitForJson({
    commandArgs: ['view', packageName, 'dist-tags', '--json'],
    predicate: value =>
      [...desiredDistTags].every(
        ([tag, version]) =>
          value && typeof value === 'object' && value[tag] === version
      ),
  })) ?? {};

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
