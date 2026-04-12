import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const reactImportPattern =
  /\bfrom\s+['"]react(?:\/[^'"]+)?['"]|\bimport\s+['"]react(?:\/[^'"]+)?['"]|\brequire\(\s*['"]react(?:\/[^'"]+)?['"]\s*\)/;

export function getEntryLayout(targetDir) {
  const distDir = join(targetDir, 'dist');
  const rootRuntime = join(distDir, 'index.js');
  const rootTypes = join(distDir, 'index.d.ts');
  const dedicatedCoreRuntime = join(distDir, 'core.js');
  const dedicatedCoreTypes = join(distDir, 'core.d.ts');
  const dedicatedReactRuntime = join(distDir, 'react.js');
  const dedicatedReactTypes = join(distDir, 'react.d.ts');
  const hasDedicatedCoreEntry = existsSync(dedicatedCoreRuntime);
  const hasDedicatedReactEntry = existsSync(dedicatedReactRuntime);

  return {
    coreRuntime: hasDedicatedCoreEntry ? dedicatedCoreRuntime : rootRuntime,
    coreTypes: existsSync(dedicatedCoreTypes) ? dedicatedCoreTypes : rootTypes,
    distDir,
    hasDedicatedCoreEntry,
    hasDedicatedReactEntry,
    reactRuntime: hasDedicatedReactEntry ? dedicatedReactRuntime : rootRuntime,
    reactTypes: existsSync(dedicatedReactTypes)
      ? dedicatedReactTypes
      : rootTypes,
    rootRuntime,
    rootTypes,
  };
}

export function getPublicSurface(coreModule, reactModule) {
  const coreFactory =
    typeof coreModule.defineConfig === 'function'
      ? coreModule.defineConfig()
      : null;
  const reactFactory =
    typeof reactModule.defineReactConfig === 'function'
      ? reactModule.defineReactConfig()
      : null;

  const recipeAccess = coreModule.recipe
    ? {
        exportName: 'recipe',
        kind: 'direct',
        module: 'core',
      }
    : coreModule.variants
    ? {
        exportName: 'variants',
        kind: 'direct',
        module: 'core',
      }
    : coreFactory?.recipe
    ? {
        exportName: 'defineConfig',
        kind: 'factory',
        module: 'core',
        property: 'recipe',
      }
    : coreFactory?.variants
    ? {
        exportName: 'defineConfig',
        kind: 'factory',
        module: 'core',
        property: 'variants',
      }
    : null;

  const styledAccess = reactModule.styled
    ? {
        exportName: 'styled',
        kind: 'direct',
        module: 'react',
      }
    : coreModule.styled
    ? {
        exportName: 'styled',
        kind: 'direct',
        module: 'core',
      }
    : coreModule.variantComponent
    ? {
        exportName: 'variantComponent',
        kind: 'direct',
        module: 'core',
      }
    : reactFactory?.styled
    ? {
        exportName: 'defineReactConfig',
        kind: 'factory',
        module: 'react',
        property: 'styled',
      }
    : coreFactory?.styled
    ? {
        exportName: 'defineConfig',
        kind: 'factory',
        module: 'core',
        property: 'styled',
      }
    : coreFactory?.variantComponent
    ? {
        exportName: 'defineConfig',
        kind: 'factory',
        module: 'core',
        property: 'variantComponent',
      }
    : null;

  if (!recipeAccess) {
    throw new Error(
      'Unable to locate recipe-style export for overhead harness.'
    );
  }
  if (!styledAccess) {
    throw new Error('Unable to locate styled() export for overhead harness.');
  }

  return {
    mergePropsAccess: reactModule.mergeProps
      ? {
          exportName: 'mergeProps',
          module: 'react',
        }
      : coreModule.mergeProps
      ? {
          exportName: 'mergeProps',
          module: 'core',
        }
      : null,
    recipeAccess,
    styledAccess,
  };
}

export async function importModule(modulePath) {
  return import(`${pathToFileURL(modulePath).href}?t=${Date.now()}`);
}

export async function detectSurface(targetDir) {
  const layout = getEntryLayout(targetDir);
  const coreModule = await importModule(layout.coreRuntime);
  const reactModule = await importModule(layout.reactRuntime);
  return getPublicSurface(coreModule, reactModule);
}

export function resolveAccess(coreModule, reactModule, access) {
  const module = access.module === 'react' ? reactModule : coreModule;
  if (access.kind === 'direct') {
    return module[access.exportName];
  }
  return module[access.exportName]()[access.property];
}

function resolveRelativeImport(fromFile, specifier) {
  if (!specifier.startsWith('.')) {
    return null;
  }

  const basePath = resolve(dirname(fromFile), specifier);
  const candidates = [basePath, `${basePath}.mjs`, `${basePath}.js`];

  for (const candidate of candidates) {
    if (existsSync(candidate) && lstatSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

export function collectImportGraph(entryFile) {
  const visited = new Set();
  const stack = [entryFile];
  let hasReactRuntime = false;

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);
    const source = readFileSync(current, 'utf8');
    if (reactImportPattern.test(source)) {
      hasReactRuntime = true;
    }

    const matches = source.matchAll(
      /\bfrom\s+['"]([^'"]+)['"]|\bimport\s+['"]([^'"]+)['"]|\brequire\(\s*['"]([^'"]+)['"]\s*\)/g
    );

    for (const match of matches) {
      const specifier = match[1] ?? match[2] ?? match[3];
      const resolvedImport = resolveRelativeImport(current, specifier);
      if (resolvedImport) {
        stack.push(resolvedImport);
      }
    }
  }

  return {
    files: [...visited].map(filePath => relative(dirname(entryFile), filePath)),
    hasReactRuntime,
  };
}
