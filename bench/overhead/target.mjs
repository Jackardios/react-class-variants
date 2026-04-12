import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { runExecFile } from '../shared/process.mjs';
import { createTempDir, removeTempDir } from '../shared/fs.mjs';

function installTargetDependencies(targetDir) {
  const args = ['install', '--ignore-scripts', '--prefer-offline'];

  if (existsSync(join(targetDir, 'pnpm-lock.yaml'))) {
    args.splice(1, 0, '--frozen-lockfile');
  }

  runExecFile('pnpm', args, {
    cwd: targetDir,
    env: {
      CI: '1',
    },
    stdio: 'inherit',
  });
}

export function prepareTarget(repoRoot, ref) {
  if (!ref) {
    return {
      cleanup() {},
      dir: repoRoot,
      kind: 'workspace',
      label: 'workspace',
    };
  }

  const tempDir = createTempDir('react-class-variants-ref-');
  const archiveBuffer = runExecFile('git', ['archive', '--format=tar', ref], {
    cwd: repoRoot,
    encoding: 'buffer',
  });

  runExecFile('tar', ['-xf', '-', '-C', tempDir], {
    cwd: repoRoot,
    encoding: 'buffer',
    input: archiveBuffer,
  });
  installTargetDependencies(tempDir);

  return {
    cleanup() {
      removeTempDir(tempDir);
    },
    dir: tempDir,
    kind: 'git-ref',
    label: ref,
  };
}

export function buildTarget(targetDir) {
  runExecFile('pnpm', ['build'], { cwd: targetDir });
}
