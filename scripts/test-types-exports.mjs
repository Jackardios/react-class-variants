import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const npmCacheDir = mkdtempSync(
  join(tmpdir(), 'react-class-variants-npm-cache-')
);

try {
  execFileSync('pnpm', ['exec', 'attw', '--pack', '.'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      npm_config_cache: npmCacheDir,
    },
    stdio: 'inherit',
  });
} finally {
  rmSync(npmCacheDir, { force: true, recursive: true });
}
