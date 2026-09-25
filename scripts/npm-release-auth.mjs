import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const defaultNpmRegistryUrl = 'https://registry.npmjs.org';
const noisyNpmConfigEnvKeys = [
  'npm_config__jsr_registry',
  'npm_config_auto_install_peers',
  'npm_config_npm_globalconfig',
  'npm_config_verify_deps_before_run',
  'NPM_CONFIG__JSR_REGISTRY',
  'NPM_CONFIG_AUTO_INSTALL_PEERS',
  'NPM_CONFIG_NPM_GLOBALCONFIG',
  'NPM_CONFIG_VERIFY_DEPS_BEFORE_RUN',
];

function normalizeRegistryUrl(url) {
  return url.replace(/\/+$/, '');
}

function registryAuthLine(registryUrl) {
  const url = new URL(registryUrl);
  const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  return `//${url.host}${path}:_authToken=\${NODE_AUTH_TOKEN}`;
}

export function getReleaseRegistryUrl(env = process.env) {
  return normalizeRegistryUrl(
    env.RELEASE_NPM_REGISTRY || env.npm_config_registry || defaultNpmRegistryUrl
  );
}

export function hasGitHubActionsOidc(env = process.env) {
  return Boolean(
    env.ACTIONS_ID_TOKEN_REQUEST_URL && env.ACTIONS_ID_TOKEN_REQUEST_TOKEN
  );
}

export function getReleaseAuthStrategy(env = process.env) {
  const explicitMode = env.RELEASE_NPM_AUTH_MODE;
  const hasToken = Boolean(
    env.RELEASE_NPM_AUTH_TOKEN || env.NPM_TOKEN || env.NODE_AUTH_TOKEN
  );

  if (explicitMode === 'oidc') {
    return hasGitHubActionsOidc(env) ? 'oidc' : 'none';
  }

  if (explicitMode === 'token') {
    return hasToken ? 'token' : 'none';
  }

  if (hasGitHubActionsOidc(env)) {
    return 'oidc';
  }

  if (hasToken) {
    return 'token';
  }

  return 'none';
}

export function sanitizeNpmCliEnv(env = process.env) {
  const nextEnv = { ...env };

  for (const key of noisyNpmConfigEnvKeys) {
    delete nextEnv[key];
  }

  return nextEnv;
}

// npm trusted publishing (OIDC) only authenticates `npm publish`, so every
// other registry mutation, such as dist-tag repair, needs an explicit token.
export function resolveReleaseAuth(env = process.env) {
  const token =
    env.RELEASE_NPM_AUTH_TOKEN || env.NODE_AUTH_TOKEN || env.NPM_TOKEN || '';

  if (!token) {
    throw new Error(
      'No npm token is available for dist-tag updates. Provide RELEASE_NPM_AUTH_TOKEN, NODE_AUTH_TOKEN, or NPM_TOKEN.'
    );
  }

  return { source: 'token', token };
}

export async function withNpmAuthEnv(auth, callback, env = process.env) {
  const registryUrl = getReleaseRegistryUrl(env);
  const tempDir = await mkdtemp(
    join(tmpdir(), 'react-class-variants-npm-auth-')
  );
  const userConfigPath = join(tempDir, '.npmrc');
  const childEnv = sanitizeNpmCliEnv(env);

  await writeFile(
    userConfigPath,
    `registry=${registryUrl}/\n${registryAuthLine(
      registryUrl
    )}\nalways-auth=true\n`,
    'utf8'
  );

  childEnv.NODE_AUTH_TOKEN = auth.token;
  childEnv.NPM_CONFIG_USERCONFIG = userConfigPath;

  try {
    return await callback(childEnv);
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}

export async function execAuthenticatedNpm(
  args,
  { auth, env = process.env } = {}
) {
  return withNpmAuthEnv(
    auth,
    childEnv =>
      execFileAsync('npm', args, {
        env: childEnv,
        maxBuffer: 1024 * 1024 * 10,
      }),
    env
  );
}
