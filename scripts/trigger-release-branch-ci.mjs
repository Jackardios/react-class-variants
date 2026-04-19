import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { githubApi, getGitHubRepository } from './github-api.mjs';

const defaultWorkflow = 'main.yml';
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

function delay(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function waitForReleaseBranch(repository, branch) {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const response = await githubApi(
      `/repos/${repository}/branches/${encodeURIComponent(branch)}`,
      {
        env: process.env,
        expectedStatuses: [200, 404],
        includeStatus: true,
      }
    );

    if (response.status === 200) {
      if (attempt > 1) {
        console.log(
          `Release branch ${branch} became visible on attempt ${attempt}.`
        );
      }
      return;
    }

    if (attempt < 10) {
      console.log(
        `Waiting for release branch ${branch} to appear (attempt ${attempt}/10).`
      );
      await delay(attempt * 2000);
    }
  }

  throw new Error(`Release branch ${branch} never appeared on GitHub.`);
}

export async function triggerReleaseBranchCi() {
  const branch = process.env.RELEASE_BRANCH;
  const workflow = process.env.RELEASE_WORKFLOW ?? defaultWorkflow;
  const repository = getGitHubRepository(process.env);

  if (!branch) {
    throw new Error('RELEASE_BRANCH is required to trigger release-branch CI.');
  }

  await waitForReleaseBranch(repository, branch);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await githubApi(
        `/repos/${repository}/actions/workflows/${encodeURIComponent(
          workflow
        )}/dispatches`,
        {
          env: process.env,
          expectedStatuses: [204],
          method: 'POST',
          payload: { ref: branch },
        }
      );
      console.log(`Triggered ${workflow} for ${branch}.`);
      return;
    } catch (error) {
      if (attempt === 3) {
        throw error;
      }

      console.log(
        `Dispatch attempt ${attempt} failed for ${branch}: ${error.message}`
      );
      await delay(attempt * 3000);
    }
  }
}

if (isMain) {
  await triggerReleaseBranchCi();
}
