import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const defaultNpmRegistryUrl = 'https://registry.npmjs.org';
const defaultOidcAudience = 'npm:registry.npmjs.org';
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

async function fetchJson(url, init, context) {
  const response = await fetch(url, init);
  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String(payload.message)
        : typeof payload === 'string' && payload
        ? payload
        : `${response.status} ${response.statusText}`;

    throw new Error(`${context} failed: ${message}`);
  }

  return payload;
}

export function buildGitHubActionsIdTokenUrl(
  requestUrl,
  audience = defaultOidcAudience
) {
  const url = new URL(requestUrl);
  url.searchParams.set('audience', audience);
  return url.toString();
}

async function requestGitHubOidcIdToken(env) {
  const requestUrl = env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const requestToken = env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;

  if (!requestUrl || !requestToken) {
    throw new Error(
      'GitHub Actions OIDC environment is unavailable. Ensure the workflow grants id-token: write.'
    );
  }

  const payload = await fetchJson(
    buildGitHubActionsIdTokenUrl(requestUrl),
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${requestToken}`,
      },
    },
    'GitHub Actions OIDC token request'
  );

  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.value !== 'string' ||
    payload.value.length === 0
  ) {
    throw new Error(
      'GitHub Actions OIDC token request returned an unexpected payload.'
    );
  }

  return payload.value;
}

async function exchangeOidcTokenForNpmToken(packageName, registryUrl, env) {
  const oidcIdToken = await requestGitHubOidcIdToken(env);
  const exchangeUrl = `${normalizeRegistryUrl(
    registryUrl
  )}/-/npm/v1/oidc/token/exchange/package/${encodeURIComponent(packageName)}`;
  const payload = await fetchJson(
    exchangeUrl,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${oidcIdToken}`,
      },
    },
    'npm OIDC exchange'
  );

  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.token !== 'string' ||
    payload.token.length === 0
  ) {
    throw new Error('npm OIDC exchange returned an unexpected payload.');
  }

  return {
    expiresAt: typeof payload.expires === 'string' ? payload.expires : null,
    source: 'oidc',
    token: payload.token,
  };
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

export async function resolveReleaseAuth({
  env = process.env,
  logger = console,
  packageName,
  registryUrl = getReleaseRegistryUrl(env),
} = {}) {
  if (!packageName) {
    throw new Error('resolveReleaseAuth requires a packageName.');
  }

  const explicitToken =
    env.RELEASE_NPM_AUTH_TOKEN || env.NODE_AUTH_TOKEN || env.NPM_TOKEN || '';
  const strategy = getReleaseAuthStrategy(env);

  if (strategy === 'oidc') {
    try {
      return await exchangeOidcTokenForNpmToken(packageName, registryUrl, env);
    } catch (error) {
      if (!explicitToken) {
        throw error;
      }

      logger.warn(
        `npm OIDC exchange failed, falling back to token auth: ${error.message}`
      );
    }
  }

  if (explicitToken) {
    return {
      expiresAt: null,
      source: 'token',
      token: explicitToken,
    };
  }

  throw new Error(
    'No npm dist-tag credentials are available. Provide GitHub Actions OIDC (id-token: write) or a valid NODE_AUTH_TOKEN/NPM_TOKEN.'
  );
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
