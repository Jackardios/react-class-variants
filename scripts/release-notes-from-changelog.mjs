import { readFile } from 'node:fs/promises';

const args = process.argv.slice(2).filter(arg => arg !== '--');
const version = args[0] ?? process.env.RELEASE_VERSION;

if (!version) {
  throw new Error(
    'Expected a release version argument, for example: 2.0.0-alpha.6'
  );
}

const changelog = await readFile(
  new URL('../CHANGELOG.md', import.meta.url),
  'utf8'
);
const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sectionMatch = changelog.match(
  new RegExp(`^## ${escapedVersion}\\r?\\n([\\s\\S]*?)(?=^## \\S|\\Z)`, 'm')
);

if (!sectionMatch) {
  throw new Error(
    `Could not find CHANGELOG.md section for version ${version}.`
  );
}

const notes = sectionMatch[1].trim();

if (!notes) {
  throw new Error(`CHANGELOG.md section for version ${version} is empty.`);
}

process.stdout.write(`${notes}\n`);
