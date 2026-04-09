const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function git(args) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function readBaseBranch() {
  const explicit =
    process.env.GITHUB_BASE_REF || process.env.CHANGESET_BASE_REF || null;
  if (explicit) return explicit;

  const configPath = path.join(process.cwd(), '.changeset', 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return config.baseBranch || 'main';
}

function resolveBaseRef(baseBranch) {
  const candidates = [baseBranch, `origin/${baseBranch}`];

  for (const ref of candidates) {
    try {
      git(['rev-parse', '--verify', ref]);
      return ref;
    } catch (_error) {
      continue;
    }
  }

  throw new Error(
    `Unable to resolve the base branch "${baseBranch}". Fetch it first or set CHANGESET_BASE_REF.`
  );
}

function isReleaseAffecting(file) {
  return (
    file.startsWith('src/') ||
    file === 'package.json' ||
    file === 'tsd.json' ||
    /^tsconfig(\..+)?\.json$/.test(file) ||
    /^vite\.config\.[cm]?[jt]s$/.test(file) ||
    /^eslint\.config\.[cm]?js$/.test(file) ||
    file.startsWith('.github/workflows/')
  );
}

function isChangesetFile(file) {
  return (
    file.startsWith('.changeset/') &&
    file.endsWith('.md') &&
    path.basename(file) !== 'README.md'
  );
}

const baseBranch = readBaseBranch();
const baseRef = resolveBaseRef(baseBranch);
const mergeBase = git(['merge-base', 'HEAD', baseRef]);
const changedFiles = git(['diff', '--name-only', `${mergeBase}...HEAD`])
  .split('\n')
  .map(file => file.trim())
  .filter(Boolean);

const releaseAffectingFiles = changedFiles.filter(isReleaseAffecting);
const hasChangeset = changedFiles.some(isChangesetFile);

if (releaseAffectingFiles.length === 0) {
  console.log(
    `No release-affecting files changed compared to ${baseRef}. Changeset not required.`
  );
  process.exit(0);
}

if (hasChangeset) {
  console.log('Changeset present for release-affecting changes.');
  process.exit(0);
}

console.error('Release-affecting files changed without a changeset:');
for (const file of releaseAffectingFiles) {
  console.error(`- ${file}`);
}
console.error(
  '\nAdd a .changeset/*.md file for release intent, or add an empty changeset if the PR should stay no-release by design.'
);
process.exit(1);
