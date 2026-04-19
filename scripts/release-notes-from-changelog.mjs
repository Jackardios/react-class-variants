import { extractReleaseNotes, readChangelog } from './release-shared.mjs';

const args = process.argv.slice(2).filter(arg => arg !== '--');
const version = args[0] ?? process.env.RELEASE_VERSION;

if (!version) {
  throw new Error(
    'Expected a release version argument, for example: 2.0.0-alpha.6'
  );
}

const changelog = await readChangelog(import.meta.url);

process.stdout.write(extractReleaseNotes(changelog, version));
