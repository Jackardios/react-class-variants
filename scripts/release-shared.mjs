import { readFile } from 'node:fs/promises';

export function buildReleaseTag(version) {
  return `v${version}`;
}

export function isPrereleaseVersion(version) {
  return version.includes('-');
}

export function extractReleaseNotes(changelog, version) {
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
