import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const failures = [];
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

async function runStep(label, scriptPath) {
  try {
    const { stderr, stdout } = await execFileAsync(
      'node',
      [fileURLToPath(scriptPath)],
      {
        env: process.env,
        maxBuffer: 1024 * 1024 * 20,
      }
    );

    if (stdout) {
      process.stdout.write(stdout);
    }

    if (stderr) {
      process.stderr.write(stderr);
    }
  } catch (error) {
    if (error.stdout) {
      process.stdout.write(error.stdout);
    }

    if (error.stderr) {
      process.stderr.write(error.stderr);
    }

    failures.push({ error, label });
  }
}

async function reconcileRelease() {
  await runStep(
    'npm dist-tag sync',
    new URL('./sync-dist-tags.mjs', import.meta.url)
  );
  await runStep(
    'GitHub release sync',
    new URL('./sync-github-releases.mjs', import.meta.url)
  );

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`Release reconciliation failed during ${failure.label}.`);
      console.error(failure.error.message);
    }

    process.exit(1);
  }

  console.log('Release reconciliation completed successfully.');
}

if (isMain) {
  await reconcileRelease();
}
