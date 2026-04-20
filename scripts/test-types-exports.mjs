import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const tempRoot = mkdtempSync(join(repoRoot, '.pack-check-'));
const npmCacheDir = join(tempRoot, 'npm-cache');
const distPath = resolve(repoRoot, 'dist');
const distBackupPath = join(tempRoot, 'dist-backup');
const distExistedAtStart = existsSync(distPath);

function runPnpm(args) {
  execFileSync('pnpm', args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      npm_config_cache: npmCacheDir,
    },
    stdio: 'inherit',
  });
}

function assertBuiltDistIsStable() {
  const distFiles = readdirSync(distPath);

  assert.equal(
    distFiles.some(fileName => /-[^.]+\.d\.ts$/.test(fileName)),
    false,
    'dist/ should not contain hashed shared declaration chunks.'
  );
}

try {
  if (!distExistedAtStart) {
    runPnpm(['run', 'build']);
  }

  assertBuiltDistIsStable();

  if (distExistedAtStart) {
    // Hide the existing build so packed-export validation exercises clean-checkout prepack behavior.
    renameSync(distPath, distBackupPath);
  } else {
    rmSync(distPath, { force: true, recursive: true });
  }

  runPnpm([
    'exec',
    'attw',
    '--pack',
    '.',
    '--profile',
    'esm-only',
    '--entrypoints',
    '.',
    './core',
  ]);
} finally {
  rmSync(distPath, { force: true, recursive: true });
  if (existsSync(distBackupPath)) {
    renameSync(distBackupPath, distPath);
  }
  rmSync(tempRoot, { force: true, recursive: true });
}
