import { describe, expect, it } from 'vitest';
import {
  getReleaseAuthStrategy,
  resolveReleaseAuth,
  sanitizeNpmCliEnv,
} from '../scripts/npm-release-auth.mjs';

describe('npm release auth helpers', () => {
  it('prefers GitHub OIDC over explicit tokens by default', () => {
    expect(
      getReleaseAuthStrategy({
        ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'request-token',
        ACTIONS_ID_TOKEN_REQUEST_URL:
          'https://token.actions.githubusercontent.com',
        NODE_AUTH_TOKEN: 'npm-token',
      })
    ).toBe('oidc');
  });

  it('honors explicit token mode when requested', () => {
    expect(
      getReleaseAuthStrategy({
        ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'request-token',
        ACTIONS_ID_TOKEN_REQUEST_URL:
          'https://token.actions.githubusercontent.com',
        NODE_AUTH_TOKEN: 'npm-token',
        RELEASE_NPM_AUTH_MODE: 'token',
      })
    ).toBe('token');
  });

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

  it('falls back to none without OIDC or a token', () => {
    expect(getReleaseAuthStrategy({})).toBe('none');
    expect(getReleaseAuthStrategy({ RELEASE_NPM_AUTH_MODE: 'oidc' })).toBe(
      'none'
    );
  });

  it('resolves token auth in precedence order', () => {
    expect(
      resolveReleaseAuth({
        NODE_AUTH_TOKEN: 'node-token',
        NPM_TOKEN: 'npm-token',
        RELEASE_NPM_AUTH_TOKEN: 'release-token',
      })
    ).toEqual({ source: 'token', token: 'release-token' });
    expect(resolveReleaseAuth({ NPM_TOKEN: 'npm-token' })).toEqual({
      source: 'token',
      token: 'npm-token',
    });
  });

  it('requires a token because OIDC only authenticates npm publish', () => {
    expect(() =>
      resolveReleaseAuth({
        ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'request-token',
        ACTIONS_ID_TOKEN_REQUEST_URL:
          'https://token.actions.githubusercontent.com',
      })
    ).toThrow(/No npm token is available/);
  });
});
