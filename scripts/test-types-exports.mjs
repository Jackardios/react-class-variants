import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const npmCacheDir = mkdtempSync(
  join(tmpdir(), 'react-class-variants-npm-cache-')
);
const distFiles = readdirSync(resolve(repoRoot, 'dist'));

assert.equal(
  distFiles.some(fileName => /-[^.]+\.d\.ts$/.test(fileName)),
  false,
  'dist/ should not contain hashed shared declaration chunks.'
);

try {
  execFileSync(
    'pnpm',
    [
      'exec',
      'attw',
      '--pack',
      '.',
      '--profile',
      'esm-only',
      '--entrypoints',
      '.',
      './core',
    ],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        npm_config_cache: npmCacheDir,
      },
      stdio: 'inherit',
    }
  );
} finally {
  rmSync(npmCacheDir, { force: true, recursive: true });
}
