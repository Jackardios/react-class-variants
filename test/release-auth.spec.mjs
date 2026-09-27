// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  isNpmAuthError,
  resolveReleaseToken,
  sanitizeNpmCliEnv,
} from '../scripts/npm-release-auth.mjs';

describe('npm release auth helpers', () => {
  it('removes pnpm-specific npm config env keys before invoking npm cli', () => {
    const env = sanitizeNpmCliEnv({
      PATH: '/usr/bin',
      npm_config__jsr_registry: 'https://npm.jsr.io',
      npm_config_auto_install_peers: 'true',
      npm_config_npm_globalconfig: '/tmp/npmrc',
      npm_config_verify_deps_before_run: 'false',
    });

    expect(env.PATH).toBe('/usr/bin');
    expect(env.npm_config__jsr_registry).toBeUndefined();
    expect(env.npm_config_auto_install_peers).toBeUndefined();
    expect(env.npm_config_npm_globalconfig).toBeUndefined();
    expect(env.npm_config_verify_deps_before_run).toBeUndefined();
  });

  it('resolves the dist-tag token in precedence order', () => {
    expect(
      resolveReleaseToken({
        NPM_TOKEN: 'npm-token',
        RELEASE_NPM_AUTH_TOKEN: 'release-token',
      })
    ).toBe('release-token');
    expect(resolveReleaseToken({ NPM_TOKEN: 'npm-token' })).toBe('npm-token');
  });

  // actions/setup-node exports a placeholder NODE_AUTH_TOKEN when
  // `registry-url` is set, so it must never count as a configured token.
  it('ignores NODE_AUTH_TOKEN', () => {
    expect(
      resolveReleaseToken({ NODE_AUTH_TOKEN: 'XXXXX-XXXXX-XXXXX-XXXXX' })
    ).toBe(null);
  });

  it('tells auth failures apart from other npm errors', () => {
    expect(
      isNpmAuthError({
        stderr: 'npm error code E401\nnpm error 401 Unauthorized',
      })
    ).toBe(true);
    expect(isNpmAuthError({ stderr: 'npm error code E403' })).toBe(true);
    expect(isNpmAuthError({ stderr: 'npm error code ETIMEDOUT' })).toBe(false);
    expect(isNpmAuthError(new Error('socket hang up'))).toBe(false);
  });

  // Trusted publishing (OIDC) only authenticates `npm publish`, and an unset
  // secret reaches the workflow step as an empty string.
  it('uses a configured token even when GitHub OIDC is available', () => {
    const oidcEnv = {
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'request-token',
      ACTIONS_ID_TOKEN_REQUEST_URL:
        'https://token.actions.githubusercontent.com',
    };

    expect(
      resolveReleaseToken({ ...oidcEnv, RELEASE_NPM_AUTH_TOKEN: 'npm-token' })
    ).toBe('npm-token');
    expect(
      resolveReleaseToken({ ...oidcEnv, RELEASE_NPM_AUTH_TOKEN: '' })
    ).toBe(null);
  });
});
