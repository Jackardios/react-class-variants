import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createMinimalReactSurfaceTypeSource,
  createMinimalRootOnlyTypeSource,
  createMinimalSlottedTypeSource,
  createReactSurfaceTypeSource,
  createRootOnlyTypeSource,
  createSlottedTypeSource,
  parseExtendedDiagnostics,
} from '../fixtures/typescript-profiles.mjs';
import { linkPackage, removeTempDir } from '../shared/fs.mjs';
import { runExecFile } from '../shared/process.mjs';

function prepareTypeScriptFixture(projectDir, targetDir) {
  const nodeModulesDir = join(projectDir, 'node_modules');

  mkdirSync(nodeModulesDir, { recursive: true });
  linkPackage(nodeModulesDir, 'react-class-variants', targetDir);

  for (const packageName of [
    'react',
    'react-dom',
    '@types/react',
    '@types/react-dom',
  ]) {
    linkPackage(
      nodeModulesDir,
      packageName,
      join(targetDir, 'node_modules', ...packageName.split('/'))
    );
  }
}

function measureTypeScriptProfile({
  compilerOptions,
  definition,
  fileName,
  profileName,
  sourceBuilder,
  targetDir,
}) {
  const projectDir = mkdtempSync(
    join(targetDir, `.overhead-types-${profileName}-`)
  );

  try {
    prepareTypeScriptFixture(projectDir, targetDir);

    if (definition.packageJson) {
      writeFileSync(
        join(projectDir, 'package.json'),
        `${JSON.stringify(definition.packageJson, null, 2)}\n`
      );
    }

    const source =
      typeof sourceBuilder === 'function'
        ? sourceBuilder(projectDir)
        : sourceBuilder;

    writeFileSync(join(projectDir, fileName), `${source}\n`);
    writeFileSync(
      join(projectDir, 'tsconfig.json'),
      `${JSON.stringify(
        {
          compilerOptions,
          include: [fileName],
        },
        null,
        2
      )}\n`
    );

    const tscBin = join(targetDir, 'node_modules', '.bin', 'tsc');
    const output = runExecFile(
      tscBin,
      ['-p', 'tsconfig.json', '--pretty', 'false', '--extendedDiagnostics'],
      {
        cwd: projectDir,
      }
    );

    return parseExtendedDiagnostics(output);
  } finally {
    removeTempDir(projectDir);
  }
}

export function measureTypeScriptProfiles({ targetDir, surface }) {
  const sharedRootCompilerOptions = {
    baseUrl: '.',
    esModuleInterop: true,
    module: 'ESNext',
    moduleResolution: 'Bundler',
    noEmit: true,
    strict: true,
    target: 'ES2020',
  };
  const sharedReactCompilerOptions = {
    ...sharedRootCompilerOptions,
    jsx: 'react-jsx',
    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
  };
  const imports = {
    coreImport: 'react-class-variants/core',
    reactImport: 'react-class-variants',
  };

  const profiles = {
    bundlerReactSurfaceMinimal: {
      compilerOptions: sharedReactCompilerOptions,
      fileName: 'index.tsx',
      source: () =>
        createMinimalReactSurfaceTypeSource({
          ...imports,
          surface,
        }),
    },
    bundlerReactSurface: {
      compilerOptions: sharedReactCompilerOptions,
      fileName: 'index.tsx',
      source: () =>
        createReactSurfaceTypeSource({
          ...imports,
          surface,
        }),
    },
    bundlerRootOnlyMinimal: {
      compilerOptions: sharedRootCompilerOptions,
      fileName: 'index.ts',
      source: () =>
        createMinimalRootOnlyTypeSource({
          ...imports,
          surface,
        }),
    },
    bundlerRootOnly: {
      compilerOptions: sharedRootCompilerOptions,
      fileName: 'index.ts',
      source: () =>
        createRootOnlyTypeSource({
          ...imports,
          surface,
        }),
    },
    bundlerSlottedRecipeMinimal: {
      compilerOptions: sharedRootCompilerOptions,
      fileName: 'index.ts',
      source: () =>
        createMinimalSlottedTypeSource({
          ...imports,
          surface,
        }),
    },
    bundlerSlottedRecipe: {
      compilerOptions: sharedRootCompilerOptions,
      fileName: 'index.ts',
      source: () =>
        createSlottedTypeSource({
          ...imports,
          surface,
        }),
    },
    nodeNextReactSurfaceMinimal: {
      compilerOptions: {
        ...sharedReactCompilerOptions,
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
      },
      fileName: 'index.tsx',
      packageJson: {
        type: 'module',
      },
      source: () =>
        createMinimalReactSurfaceTypeSource({
          ...imports,
          surface,
        }),
    },
    nodeNextReactSurface: {
      compilerOptions: {
        ...sharedReactCompilerOptions,
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
      },
      fileName: 'index.tsx',
      packageJson: {
        type: 'module',
      },
      source: () =>
        createReactSurfaceTypeSource({
          ...imports,
          surface,
        }),
    },
  };

  return {
    profiles: Object.fromEntries(
      Object.entries(profiles).map(([profileName, definition]) => {
        return [
          profileName,
          measureTypeScriptProfile({
            compilerOptions: definition.compilerOptions,
            definition,
            fileName: definition.fileName,
            profileName,
            sourceBuilder: definition.source,
            targetDir,
          }),
        ];
      })
    ),
  };
}
