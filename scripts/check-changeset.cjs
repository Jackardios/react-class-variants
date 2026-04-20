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

function gitLines(args) {
  const output = git(args);
  if (!output) return [];

  return output
    .split('\n')
    .map(file => file.trim())
    .filter(Boolean);
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
    } catch {
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

function parseChangesetFile(filePath, contents) {
  const normalized = contents.replace(/\r\n/g, '\n');

  if (!normalized.startsWith('---\n')) {
    throw new Error(`${filePath} must start with YAML frontmatter ('---').`);
  }

  const frontmatterMatch = /^---\n([\s\S]*?)^---(?:\n|$)/m.exec(normalized);

  if (!frontmatterMatch) {
    throw new Error(
      `${filePath} is missing the closing YAML frontmatter delimiter ('---').`
    );
  }

  const frontmatter = frontmatterMatch[1].trim();
  const bodyStart = frontmatterMatch[0].length;
  const body = normalized.slice(bodyStart).trim();
  const releases = [];

  if (frontmatter) {
    for (const rawLine of frontmatter.split('\n')) {
      const line = rawLine.trim();

      if (!line || line.startsWith('#')) {
        continue;
      }

      const match =
        /^(?:'([^']+)'|"([^"]+)"|([A-Za-z0-9@/_.-]+)):\s*(major|minor|patch)\s*$/.exec(
          line
        );

      if (!match) {
        throw new Error(
          `${filePath} has invalid frontmatter line "${line}". Expected <package>: major|minor|patch.`
        );
      }

      releases.push({
        packageName: match[1] || match[2] || match[3],
        type: match[4],
      });
    }
  }

  if (!body) {
    throw new Error(`${filePath} must include a non-empty summary body.`);
  }

  return { body, releases };
}

function validateChangesetFiles(rootDir = process.cwd()) {
  const changesetDir = path.join(rootDir, '.changeset');
  const errors = [];

  for (const entry of fs.readdirSync(changesetDir)) {
    if (!entry.endsWith('.md') || entry === 'README.md') {
      continue;
    }

    const filePath = path.join('.changeset', entry);
    const absolutePath = path.join(rootDir, filePath);

    try {
      parseChangesetFile(filePath, fs.readFileSync(absolutePath, 'utf8'));
    } catch (error) {
      errors.push(error.message);
    }
  }

  return errors;
}

function main() {
  const changesetErrors = validateChangesetFiles();

  if (changesetErrors.length > 0) {
    console.error('Invalid changeset files:');
    for (const error of changesetErrors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  const baseBranch = readBaseBranch();
  const baseRef = resolveBaseRef(baseBranch);
  const mergeBase = git(['merge-base', 'HEAD', baseRef]);
  const changedFiles = Array.from(
    new Set([
      ...gitLines(['diff', '--name-only', `${mergeBase}...HEAD`]),
      ...gitLines(['diff', '--name-only', '--cached']),
      ...gitLines(['diff', '--name-only']),
      ...gitLines(['ls-files', '--others', '--exclude-standard']),
    ])
  ).sort();

  const releaseAffectingFiles = changedFiles.filter(isReleaseAffecting);
  const hasChangeset = changedFiles.some(isChangesetFile);

  if (releaseAffectingFiles.length === 0) {
    console.log(
      `No release-affecting files changed compared to ${baseRef} or in the local working tree. Changeset not required.`
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
}

module.exports = {
  parseChangesetFile,
  validateChangesetFiles,
};

if (require.main === module) {
  main();
}
