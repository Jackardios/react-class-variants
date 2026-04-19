import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { sanitizeNpmCliEnv } from './npm-release-auth.mjs';
import { buildReleaseTag, readPackageJson } from './release-shared.mjs';

const execFileAsync = promisify(execFile);
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

async function git(args) {
  const { stdout } = await execFileAsync('git', args, {
    env: process.env,
    maxBuffer: 1024 * 1024 * 10,
  });

  return stdout.trim();
}

async function gitMaybe(args) {
  try {
    return await git(args);
  } catch {
    return null;
  }
}

async function npmView(packageSpec, field) {
  try {
    const { stdout } = await execFileAsync(
      'npm',
      ['view', packageSpec, field, '--json'],
      {
        env: sanitizeNpmCliEnv(process.env),
        maxBuffer: 1024 * 1024 * 10,
      }
    );

    return stdout.trim() ? JSON.parse(stdout) : null;
  } catch (error) {
    const stderr = `${error.stderr ?? ''}`;

    if (stderr.includes('E404')) {
      return null;
    }

    throw error;
  }
}

export function planReleasePublish({
  headSha,
  headIntroducesVersion,
  localTagTarget,
  publishedGitHead,
  tag,
  versionPublished,
}) {
  if (!versionPublished && localTagTarget && localTagTarget !== headSha) {
    throw new Error(
      `Release tag ${tag} already exists at ${localTagTarget}, but HEAD is ${headSha}. Refusing to retag a different commit.`
    );
  }

  if (!versionPublished) {
    return {
      mode: 'publish',
      publishedCommitHint: null,
    };
  }

  if (localTagTarget === headSha) {
    return {
      mode: 'reconcile-current-head',
      publishedCommitHint: headSha,
    };
  }

  if (localTagTarget && localTagTarget !== headSha) {
    return {
      mode: 'already-published-elsewhere',
      publishedCommitHint: localTagTarget,
    };
  }

  if (publishedGitHead === headSha) {
    return {
      mode: 'restore-missing-tag',
      publishedCommitHint: publishedGitHead,
    };
  }

  if (publishedGitHead && publishedGitHead !== headSha) {
    return {
      mode: 'already-published-elsewhere',
      publishedCommitHint: publishedGitHead,
    };
  }

  if (headIntroducesVersion) {
    return {
      mode: 'restore-missing-tag',
      publishedCommitHint: headSha,
    };
  }

  return {
    mode: 'already-published-elsewhere',
    publishedCommitHint: null,
  };
}

async function finalizePublishedRelease({
  headSha,
  mode,
  packageName,
  tag,
  version,
}) {
  if (mode === 'publish' || mode === 'restore-missing-tag') {
    const tagStatus = await ensureLocalTagAtHead(tag, headSha);

    if (tagStatus === 'created') {
      console.log(`Created local release tag ${tag} at ${headSha}.`);
    } else {
      console.log(`Release tag ${tag} already points at ${headSha}.`);
    }
  } else if (mode === 'reconcile-current-head') {
    console.log(`Release tag ${tag} already points at ${headSha}.`);
  }

  const publishedVersion = await npmView(
    `${packageName}@${version}`,
    'version'
  );

  if (publishedVersion !== version) {
    throw new Error(
      `Expected ${packageName}@${version} to be published, but npm returned ${
        publishedVersion ?? 'nothing'
      }.`
    );
  }
}

async function ensureLocalTagAtHead(tag, headSha) {
  const currentTarget = await gitMaybe(['rev-parse', '--verify', `${tag}^{}`]);

  if (!currentTarget) {
    await execFileAsync('git', ['tag', tag, headSha], {
      env: process.env,
      maxBuffer: 1024 * 1024 * 10,
    });
    return 'created';
  }

  if (currentTarget !== headSha) {
    throw new Error(
      `Release tag ${tag} resolves to ${currentTarget}, but HEAD is ${headSha}.`
    );
  }

  return 'existing';
}

async function parentVersion(parentRef) {
  try {
    const packageJson = await git(['show', `${parentRef}:package.json`]);
    return JSON.parse(packageJson).version ?? null;
  } catch {
    return null;
  }
}

async function headIntroducesVersion(version) {
  const lineage = await git(['rev-list', '--parents', '-n', '1', 'HEAD']);
  const [, ...parents] = lineage
    .split(' ')
    .map(part => part.trim())
    .filter(Boolean);

  if (parents.length === 0) {
    return true;
  }

  const versions = await Promise.all(
    parents.map(parent => parentVersion(parent))
  );

  return versions.some(parentVersionValue => parentVersionValue !== version);
}

export async function publishRelease() {
  const packageJson = await readPackageJson(import.meta.url);
  const packageName = process.env.RELEASE_PACKAGE_NAME ?? packageJson.name;
  const version = process.env.RELEASE_VERSION ?? packageJson.version;
  const tag = buildReleaseTag(version);
  const headSha = await git(['rev-parse', 'HEAD']);
  const localTagTarget = await gitMaybe(['rev-parse', '--verify', `${tag}^{}`]);
  const versionPublished =
    (await npmView(`${packageName}@${version}`, 'version')) === version;
  const publishedGitHead = versionPublished
    ? await npmView(`${packageName}@${version}`, 'gitHead')
    : null;
  const currentHeadIntroducesVersion = await headIntroducesVersion(version);
  const plan = planReleasePublish({
    headSha,
    headIntroducesVersion: currentHeadIntroducesVersion,
    localTagTarget,
    publishedGitHead,
    tag,
    versionPublished,
  });

  if (plan.mode === 'publish') {
    console.log(`Publishing ${packageName}@${version} via changeset publish.`);
    const { stderr, stdout } = await execFileAsync(
      'pnpm',
      ['exec', 'changeset', 'publish'],
      {
        env: process.env,
        maxBuffer: 1024 * 1024 * 20,
      }
    );

    if (stdout) {
      process.stdout.write(stdout);
    }

    if (stderr) {
      process.stderr.write(stderr);
    }
  } else if (plan.mode === 'already-published-elsewhere') {
    console.log(
      `Skipping publish because ${packageName}@${version} is already released${
        plan.publishedCommitHint ? ` on commit ${plan.publishedCommitHint}` : ''
      }, while HEAD is ${headSha}.`
    );
    return;
  } else {
    console.log(
      `Skipping npm publish because ${packageName}@${version} is already on the registry.`
    );
  }

  await finalizePublishedRelease({
    headSha,
    mode: plan.mode,
    packageName,
    tag,
    version,
  });
}

if (isMain) {
  await publishRelease();
}
