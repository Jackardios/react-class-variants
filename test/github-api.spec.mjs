import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getGitHubApiUrl,
  getGitHubRepository,
  getGitHubToken,
  githubApi,
} from '../scripts/github-api.mjs';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('github api helpers', () => {
  it('normalizes the GitHub API base URL', () => {
    expect(
      getGitHubApiUrl({ GITHUB_API_URL: 'https://api.github.example.com/' })
    ).toBe('https://api.github.example.com');
  });

  it('requires repository context', () => {
    expect(() => getGitHubRepository({})).toThrow(/GITHUB_REPOSITORY/);
  });

  it('prefers GH_TOKEN over GITHUB_TOKEN', () => {
    expect(
      getGitHubToken({
        GH_TOKEN: 'gh-token',
        GITHUB_TOKEN: 'github-token',
      })
    ).toBe('gh-token');
  });

  it('returns status metadata when requested', async () => {
    globalThis.fetch = vi.fn(async () => ({
      headers: new globalThis.Headers({ 'content-type': 'application/json' }),
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    }));

    await expect(
      githubApi('/repos/owner/repo', {
        env: {
          GITHUB_REPOSITORY: 'owner/repo',
          GITHUB_TOKEN: 'token',
        },
        includeStatus: true,
      })
    ).resolves.toEqual({
      body: { ok: true },
      status: 200,
    });
  });

  it('surfaces GitHub API error messages', async () => {
    globalThis.fetch = vi.fn(async () => ({
      headers: new globalThis.Headers({ 'content-type': 'application/json' }),
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => JSON.stringify({ message: 'Resource not accessible' }),
    }));

    await expect(
      githubApi('/repos/owner/repo/releases', {
        env: {
          GITHUB_REPOSITORY: 'owner/repo',
          GITHUB_TOKEN: 'token',
        },
        expectedStatuses: [201],
        method: 'POST',
      })
    ).rejects.toThrow(/Resource not accessible/);
  });
});
