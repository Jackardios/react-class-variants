const defaultGitHubApiUrl = 'https://api.github.com';

export function getGitHubApiUrl(env = process.env) {
  return (env.GITHUB_API_URL || defaultGitHubApiUrl).replace(/\/+$/, '');
}

export function getGitHubRepository(env = process.env) {
  if (!env.GITHUB_REPOSITORY) {
    throw new Error(
      'GitHub repository context is unavailable. Set GITHUB_REPOSITORY to owner/repo.'
    );
  }

  return env.GITHUB_REPOSITORY;
}

export function getGitHubToken(env = process.env) {
  const token = env.GH_TOKEN || env.GITHUB_TOKEN || '';

  if (!token) {
    throw new Error(
      'GitHub token is unavailable. Set GH_TOKEN or GITHUB_TOKEN before calling the GitHub API.'
    );
  }

  return token;
}

export async function githubApi(
  path,
  {
    env = process.env,
    expectedStatuses = [200],
    headers = {},
    includeStatus = false,
    method = 'GET',
    payload,
  } = {}
) {
  const response = await fetch(`${getGitHubApiUrl(env)}${path}`, {
    body: payload ? JSON.stringify(payload) : undefined,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${getGitHubToken(env)}`,
      'Content-Type': 'application/json',
      'User-Agent': 'react-class-variants-release-bot',
      ...headers,
    },
    method,
  });

  const text = await response.text();
  const hasJson = (response.headers.get('content-type') || '').includes('json');
  const body = text ? (hasJson ? JSON.parse(text) : text) : null;

  if (!expectedStatuses.includes(response.status)) {
    const message =
      typeof body === 'object' && body && 'message' in body
        ? String(body.message)
        : typeof body === 'string' && body
        ? body
        : `${response.status} ${response.statusText}`;

    throw new Error(`GitHub API ${method} ${path} failed: ${message}`);
  }

  return includeStatus ? { body, status: response.status } : body;
}
