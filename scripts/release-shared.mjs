import { execFile, spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { sanitizeNpmCliEnv } from './npm-release-auth.mjs';

const execFileAsync = promisify(execFile);
const maxBuffer = 1024 * 1024 * 10;

export function isMainModule(metaUrl) {
  return Boolean(
    process.argv[1] && fileURLToPath(metaUrl) === resolve(process.argv[1])
  );
}

export function delay(ms) {
  return new Promise(resolvePromise => {
    setTimeout(resolvePromise, ms);
  });
}

// Polls `read` until `predicate` accepts its value, waiting `attempt * stepMs`
// between attempts. Returns the last value read either way so callers can
// report what the registry actually returned.
export async function pollUntil(
  read,
  predicate,
  { attempts = 8, stepMs = 1500 } = {}
) {
  let lastValue = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    lastValue = await read();

    if (predicate(lastValue)) {
      return lastValue;
    }

    if (attempt < attempts) {
      await delay(attempt * stepMs);
    }
  }

  return lastValue;
}

export async function git(args) {
  const { stdout } = await execFileAsync('git', args, {
    env: process.env,
    maxBuffer,
  });

  return stdout.trim();
}

export async function gitMaybe(args) {
  try {
    return await git(args);
  } catch {
    return null;
  }
}

// `npm view <spec> <field> --json`, with a missing package or version (E404)
// reported as `null` instead of an error.
export async function npmView(packageSpec, field) {
  try {
    const { stdout } = await execFileAsync(
      'npm',
      ['view', packageSpec, field, '--json'],
      {
        env: sanitizeNpmCliEnv(process.env),
        maxBuffer,
      }
    );

    return stdout.trim() ? JSON.parse(stdout) : null;
  } catch (error) {
    if (`${error.stderr ?? ''}`.includes('E404')) {
      return null;
    }

    throw error;
  }
}

// Runs a command with inherited stdio so its output streams live and is not
// lost when the command fails.
export function runInherited(command, args, { env = process.env } = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { env, stdio: 'inherit' });

    child.on('error', rejectPromise);
    child.on('close', code => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(
          new Error(`${command} ${args.join(' ')} exited with code ${code}.`)
        );
      }
    });
  });
}

// Emits a GitHub Actions warning annotation (shown in the run summary) when
// running in Actions, and a plain warning otherwise.
export function warnAnnotation(message) {
  if (process.env.GITHUB_ACTIONS === 'true') {
    const escaped = message
      .replace(/%/g, '%25')
      .replace(/\r/g, '%0D')
      .replace(/\n/g, '%0A');
    console.log(`::warning::${escaped}`);
    return;
  }

  console.warn(message);
}

export function buildReleaseTag(version) {
  return `v${version}`;
}

export function isPrereleaseVersion(version) {
  return version.includes('-');
}

export function extractReleaseNotes(changelog, version) {
  const normalized = changelog.replace(/\r\n/g, '\n');
  const header = `## ${version}\n`;
  const startIndex = normalized.indexOf(header);

  if (startIndex === -1) {
    throw new Error(
      `Could not find CHANGELOG.md section for version ${version}.`
    );
  }

  const sectionStart = startIndex + header.length;
  const nextSectionIndex = normalized.indexOf('\n## ', sectionStart);
  const notes = normalized
    .slice(sectionStart, nextSectionIndex === -1 ? undefined : nextSectionIndex)
    .trim();

  if (!notes) {
    throw new Error(`CHANGELOG.md section for version ${version} is empty.`);
  }

  return `${notes}\n`;
}

export async function readPackageJson(metaUrl) {
  return JSON.parse(
    await readFile(new URL('../package.json', metaUrl), 'utf8')
  );
}

export async function readChangelog(metaUrl) {
  return readFile(new URL('../CHANGELOG.md', metaUrl), 'utf8');
}
