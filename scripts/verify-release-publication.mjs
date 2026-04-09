import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function npmView(...args) {
  return execFileSync('npm', ['view', ...args], {
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

const versions = JSON.parse(npmView(name, 'versions', '--json'));
const distTags = JSON.parse(npmView(name, 'dist-tags', '--json'));
const publishedVersions = Array.isArray(versions) ? versions : [versions];

if (!publishedVersions.includes(version)) {
  console.error(
    `Expected ${name}@${version} to exist on npm, but it was not found in the published versions list.`
  );
  process.exit(1);
}

console.log(`Verified ${name}@${version} is published on npm.`);
console.log(`Current dist-tags: ${JSON.stringify(distTags)}`);

if (!isStableRelease(version)) {
  const hasStableRelease = publishedVersions.some(isStableRelease);

  if (!hasStableRelease) {
    console.log(
      `No stable ${name} release exists yet, so Changesets publishes prereleases under "latest" until the first non-prerelease release.`
    );
  }

  if (distTags.alpha !== version) {
    console.log(
      `alpha dist-tag still points to ${
        distTags.alpha ?? 'nothing'
      }; update it manually if you want "${name}@alpha" to resolve to ${version}.`
    );
  }
}
