import {
  execAuthenticatedNpm,
  isNpmAuthError,
  resolveReleaseToken,
} from './npm-release-auth.mjs';
import { npmView, readPackageJson, warnAnnotation } from './release-shared.mjs';

const packageJson = await readPackageJson(import.meta.url);
const packageName = process.env.RELEASE_PACKAGE_NAME ?? packageJson.name;

if ((await npmView(packageName, 'version')) === null) {
  console.log(
    `Skipping npm dist-tag auth preflight for ${packageName} because the package is not published yet.`
  );
  process.exit(0);
}

const token = resolveReleaseToken(process.env);

if (!token) {
  console.log(
    `No npm token is configured for ${packageName}. Trusted publishing (OIDC) only authenticates the publish operation, so automated dist-tag repair will be skipped and any remaining drift must be repaired manually.`
  );
  process.exit(0);
}

// Dist-tag repair is optional, so an unusable token must not block publishing.
try {
  await execAuthenticatedNpm(['whoami'], { token });
} catch (error) {
  if (!isNpmAuthError(error)) throw error;
  warnAnnotation(
    `The configured npm token cannot authenticate for ${packageName}. Publishing still uses trusted publishing, but dist-tag repair will fall back to manual commands. Refresh or remove the NPM_TOKEN secret.`
  );
  process.exit(0);
}
console.log(`Validated npm token auth for dist-tag updates on ${packageName}.`);
