import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function npm(...args) {
  return execFileSync('npm', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function isStableRelease(version) {
  return !version.includes('-');
}

const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const { name, version } = packageJson;

if (isStableRelease(version)) {
  console.log(
    `Skipping alpha dist-tag sync for stable release ${name}@${version}.`
  );
  process.exit(0);
}

const versions = JSON.parse(npm('view', name, 'versions', '--json'));
const publishedVersions = Array.isArray(versions) ? versions : [versions];

if (!publishedVersions.includes(version)) {
  console.error(
    `Refusing to update alpha dist-tag before ${name}@${version} is visible on npm.`
  );
  process.exit(1);
}

if (!process.env.NODE_AUTH_TOKEN) {
  console.log(
    'Skipping alpha dist-tag sync because NODE_AUTH_TOKEN is not set. Configure NPM_DIST_TAG_TOKEN in GitHub Actions if you want prerelease tags to be updated automatically.'
  );
  process.exit(0);
}

npm('dist-tag', 'add', `${name}@${version}`, 'alpha');

const distTags = JSON.parse(npm('view', name, 'dist-tags', '--json'));
console.log(`Updated dist-tags: ${JSON.stringify(distTags)}`);
