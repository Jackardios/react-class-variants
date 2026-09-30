import { mkdtemp, readFile, rm, symlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractReleaseNotes,
  git,
  isMainModule,
  isPrereleaseVersion,
  npmView,
  runInherited,
} from './release-shared.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

// Checks what the Version Packages step produced: the version must change
// only when changesets are pending, match the prerelease mode, have its own
// CHANGELOG.md section for the GitHub release, and not be on npm yet.
export function checkVersionedRelease({
  changelog,
  hasChangesets,
  nextVersion,
  preMode,
  previousVersion,
  published,
}) {
  if (!hasChangesets) {
    if (nextVersion !== previousVersion) {
      throw new Error(
        `changeset version changed ${previousVersion} to ${nextVersion} without pending changesets.`
      );
    }

    return `No pending changesets: the next Version Packages step keeps ${previousVersion}.`;
  }

  if (nextVersion === previousVersion) {
    throw new Error(
      `changeset version kept ${previousVersion} although changesets are pending.`
    );
  }

  if (isPrereleaseVersion(nextVersion) !== preMode) {
    throw new Error(
      `changeset version produced ${nextVersion}, but prerelease mode is ${
        preMode ? 'on' : 'off'
      }.`
    );
  }

  if (published) {
    throw new Error(
      `changeset version produced ${nextVersion}, which is already on npm.`
    );
  }

  const notes = extractReleaseNotes(changelog, nextVersion);

  return `Version Packages would release ${previousVersion} -> ${nextVersion} (${
    notes.trim().length
  } chars of release notes).`;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function hasPendingChangesets(dir) {
  const files = (
    await git(['-C', dir, 'ls-files', '--', ':(glob).changeset/*.md'])
  ).split('\n');

  return files.some(file => file && file !== '.changeset/README.md');
}

async function readPreMode(dir) {
  try {
    return (await readJson(join(dir, '.changeset/pre.json'))).mode === 'pre';
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

// Runs the Release workflow's `changeset version` on a scratch worktree of a
// commit (HEAD by default), so a broken versioning step fails the pull
// request instead of the release after merge.
export async function runReleaseDryRun(ref = 'HEAD') {
  const dir = await mkdtemp(join(tmpdir(), 'rcv-release-dry-run-'));
  let worktreeAdded = false;

  try {
    await git(['-C', repoRoot, 'worktree', 'add', '--detach', dir, ref]);
    worktreeAdded = true;
    await symlink(join(repoRoot, 'node_modules'), join(dir, 'node_modules'));

    const previousVersion = (await readJson(join(dir, 'package.json'))).version;
    const hasChangesets = await hasPendingChangesets(dir);
    const preMode = await readPreMode(dir);
    const changesetBin = join(
      dirname(
        createRequire(import.meta.url).resolve('@changesets/cli/package.json')
      ),
      'bin.js'
    );

    process.chdir(dir);
    try {
      await runInherited(process.execPath, [changesetBin, 'version']);
    } finally {
      process.chdir(repoRoot);
    }

    const packageJson = await readJson(join(dir, 'package.json'));
    const nextVersion = packageJson.version;

    console.log(
      checkVersionedRelease({
        changelog: await readFile(join(dir, 'CHANGELOG.md'), 'utf8'),
        hasChangesets,
        nextVersion,
        preMode,
        previousVersion,
        published:
          hasChangesets &&
          (await npmView(`${packageJson.name}@${nextVersion}`, 'version')) !==
            null,
      })
    );
  } finally {
    if (worktreeAdded) {
      await git(['-C', repoRoot, 'worktree', 'remove', '--force', dir]);
    }
    await rm(dir, { force: true, recursive: true });
  }
}

if (isMainModule(import.meta.url)) {
  await runReleaseDryRun(process.argv[2]);
}
