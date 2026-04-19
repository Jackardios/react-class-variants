import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import {
  execAuthenticatedNpm,
  resolveReleaseAuth,
} from './npm-release-auth.mjs';

const execFileAsync = promisify(execFile);
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8')
);

const packageName = process.env.RELEASE_PACKAGE_NAME ?? packageJson.name;

async function packageExistsOnRegistry() {
  try {
    await execFileAsync('npm', ['view', packageName, 'version', '--json'], {
      env: process.env,
      maxBuffer: 1024 * 1024 * 10,
    });
    return true;
  } catch (error) {
    const stderr = `${error.stderr ?? ''}`;

    if (stderr.includes('E404')) {
      return false;
    }

    throw error;
  }
}

if (!(await packageExistsOnRegistry())) {
  console.log(
    `Skipping npm dist-tag auth preflight for ${packageName} because the package is not published yet.`
  );
  process.exit(0);
}

const auth = await resolveReleaseAuth({ packageName });

if (auth.source === 'token') {
  await execAuthenticatedNpm(['whoami'], { auth });
  console.log(
    `Validated npm token auth for dist-tag updates on ${packageName}.`
  );
  process.exit(0);
}

console.log(
  `Validated npm OIDC exchange for dist-tag updates on ${packageName}${
    auth.expiresAt ? ` (expires ${auth.expiresAt})` : ''
  }.`
);
