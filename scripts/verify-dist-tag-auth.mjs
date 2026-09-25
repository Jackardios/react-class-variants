import {
  execAuthenticatedNpm,
  getReleaseAuthStrategy,
  resolveReleaseAuth,
} from './npm-release-auth.mjs';
import { npmView, readPackageJson } from './release-shared.mjs';

const packageJson = await readPackageJson(import.meta.url);
const packageName = process.env.RELEASE_PACKAGE_NAME ?? packageJson.name;

if ((await npmView(packageName, 'version')) === null) {
  console.log(
    `Skipping npm dist-tag auth preflight for ${packageName} because the package is not published yet.`
  );
  process.exit(0);
}

if (getReleaseAuthStrategy(process.env) === 'oidc') {
  console.log(
    `npm trusted publishing OIDC is available for ${packageName}, but npm currently limits trusted publishing auth to the publish operation. Automated dist-tag repair will be skipped and any remaining drift must be repaired manually.`
  );
  process.exit(0);
}

await execAuthenticatedNpm(['whoami'], {
  auth: resolveReleaseAuth(process.env),
});
console.log(`Validated npm token auth for dist-tag updates on ${packageName}.`);
