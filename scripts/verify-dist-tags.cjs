const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const packageName = 'react-class-variants';

function readPackageVersion() {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
  );
  return packageJson.version;
}

function npm(args) {
  return execFileSync('npm', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function parseDistTags(output) {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((tags, line) => {
      const parts = line.split(':').map((part) => part.trim());
      if (parts.length === 2) {
        tags[parts[0]] = parts[1];
      }
      return tags;
    }, {});
}

const version = readPackageVersion();
if (!version.includes('-')) {
  console.log('Stable line detected. Dist-tag divergence is allowed.');
  process.exit(0);
}

const tags = parseDistTags(npm(['dist-tag', 'ls', packageName]));
if (!tags.alpha || !tags.latest) {
  throw new Error(
    `Missing required dist-tags for ${packageName}. Found: ${JSON.stringify(tags)}`
  );
}

if (tags.alpha !== tags.latest) {
  throw new Error(
    `Expected latest and alpha dist-tags to match during prerelease. Found latest=${tags.latest}, alpha=${tags.alpha}.`
  );
}

console.log(
  `Verified dist-tags for ${packageName}: latest=${tags.latest}, alpha=${tags.alpha}.`
);
