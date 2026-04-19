import { readFile } from 'node:fs/promises';

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
