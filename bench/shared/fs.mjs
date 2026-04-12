import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function sleepMs(durationMs) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, durationMs);
}

export function createTempDir(prefix) {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function removeTempDir(directoryPath) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      rmSync(directoryPath, {
        force: true,
        recursive: true,
      });
      return;
    } catch (error) {
      if (!existsSync(directoryPath)) {
        return;
      }

      if (
        !['EBUSY', 'ENOTEMPTY', 'EPERM'].includes(error?.code) ||
        attempt === 7
      ) {
        throw error;
      }

      sleepMs((attempt + 1) * 50);
    }
  }
}

export function ensureNodeModules(targetDir, nodeModulesSourceDir) {
  const targetNodeModules = join(targetDir, 'node_modules');
  if (!existsSync(targetNodeModules)) {
    symlinkSync(
      join(nodeModulesSourceDir, 'node_modules'),
      targetNodeModules,
      'dir'
    );
  }
}

export function packageLinkPath(nodeModulesDir, packageName) {
  const parts = packageName.split('/');
  if (packageName.startsWith('@')) {
    const scopeDir = join(nodeModulesDir, parts[0]);
    mkdirSync(scopeDir, { recursive: true });
    return join(scopeDir, parts[1]);
  }

  return join(nodeModulesDir, packageName);
}

export function linkPackage(nodeModulesDir, packageName, targetPath) {
  if (!existsSync(targetPath)) {
    throw new Error(
      `Unable to prepare bundle fixture; missing package ${packageName} at ${targetPath}.`
    );
  }

  const linkPath = packageLinkPath(nodeModulesDir, packageName);
  if (!existsSync(linkPath)) {
    symlinkSync(targetPath, linkPath, 'dir');
  }
}
