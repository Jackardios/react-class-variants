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

function parsePublishedPackages() {
  const raw = process.env.PUBLISHED_PACKAGES;
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Unable to parse PUBLISHED_PACKAGES: ${error.message}`);
  }
}

function npm(args) {
  return execFileSync('npm', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

const version = readPackageVersion();
if (!version.includes('-')) {
  console.log('Stable line detected. No dist-tag sync required.');
  process.exit(0);
}

const publishedPackages = parsePublishedPackages();
const currentPackage = publishedPackages.find(
  (pkg) => pkg.name === packageName
);

if (!currentPackage) {
  console.log(`No published package entry found for ${packageName}.`);
  process.exit(0);
}

npm(['dist-tag', 'add', `${packageName}@${currentPackage.version}`, 'latest']);
console.log(
  `Aligned latest dist-tag with ${packageName}@${currentPackage.version}.`
);
