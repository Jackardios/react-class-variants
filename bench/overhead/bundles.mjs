import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createOverheadBundleSources } from '../fixtures/bundle-sources.mjs';
import { buildSourcePrelude } from '../fixtures/typescript-profiles.mjs';
import { bundleWithEsbuild } from '../shared/esbuild.mjs';
import { measureFile } from '../shared/file-size.mjs';
import { createTempDir, linkPackage, removeTempDir } from '../shared/fs.mjs';
import { getEntryLayout } from './surface.mjs';

export async function bundleConsumers({ repoRoot, targetDir, surface }) {
  const layout = getEntryLayout(targetDir);
  const tempDir = createTempDir('react-class-variants-bundle-');
  const tempNodeModules = join(tempDir, 'node_modules');

  mkdirSync(tempNodeModules, { recursive: true });
  linkPackage(
    tempNodeModules,
    'tailwind-merge',
    join(repoRoot, 'node_modules', 'tailwind-merge')
  );

  const coreImport = layout.coreRuntime.replaceAll('\\', '/');
  const reactImport = layout.reactRuntime.replaceAll('\\', '/');
  const preludeRecipe = buildSourcePrelude({
    coreImport,
    includeMergeProps: false,
    includeRecipeTypeImports: false,
    includeStyled: false,
    reactImport,
    surface,
  });
  const preludeComponent = buildSourcePrelude({
    coreImport,
    includeRecipeTypeImports: false,
    reactImport,
    surface,
  });
  const sources = createOverheadBundleSources({
    coreImport,
    preludeComponent,
    preludeRecipe,
  });

  try {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(sources).map(async ([profileName, source]) => {
          const entryFile = join(tempDir, `${profileName}.ts`);
          const outFile = join(tempDir, `${profileName}.mjs`);

          writeFileSync(entryFile, `${source}\n`);
          await bundleWithEsbuild({
            absWorkingDir: tempDir,
            entryFile,
            external: ['react'],
            outFile,
          });

          return [profileName, measureFile(outFile)];
        })
      )
    );
  } finally {
    removeTempDir(tempDir);
  }
}
