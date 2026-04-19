import { describe, expect, it } from 'vitest';
import {
  buildGitHubActionsIdTokenUrl,
  getReleaseAuthStrategy,
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

  it('appends the npm audience to the GitHub OIDC request URL', () => {
    expect(
      buildGitHubActionsIdTokenUrl(
        'https://token.actions.githubusercontent.com/?existing=value'
      )
    ).toBe(
      'https://token.actions.githubusercontent.com/?existing=value&audience=npm%3Aregistry.npmjs.org'
    );
  });
});
