import { execFileSync } from 'node:child_process';
import {
  brotliCompressSync,
  constants as zlibConstants,
  gzipSync,
} from 'node:zlib';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = resolve(scriptDir, '..');
const defaultOutPath = join(
  repoRoot,
  'bench',
  'overhead',
  'reports',
  'current.json'
);
const reactImportPattern =
  /\bfrom\s+['"]react['"]|\brequire\(\s*['"]react['"]\s*\)/;

const simpleRootConfig = {
  base: 'inline-flex items-center rounded-md font-medium transition-colors',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-slate-200 text-slate-950',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-5 text-lg',
    },
  },
  defaultVariants: {
    tone: 'primary',
    size: 'md',
  },
};

function makeSimpleRootConfig() {
  return {
    base: simpleRootConfig.base,
    variants: {
      tone: { ...simpleRootConfig.variants.tone },
      size: { ...simpleRootConfig.variants.size },
    },
    defaultVariants: {
      ...simpleRootConfig.defaultVariants,
    },
  };
}

const complexRootConfig = {
  base: 'inline-flex items-center justify-center rounded-md font-medium transition',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-slate-200 text-slate-950',
      danger: 'bg-rose-600 text-white',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-5 text-lg',
    },
    variant: {
      solid: '',
      outline: 'border bg-transparent',
      ghost: 'bg-transparent',
    },
    disabled: {
      true: 'opacity-50 pointer-events-none',
      false: '',
    },
  },
  defaultVariants: {
    tone: 'primary',
    size: 'md',
    variant: 'solid',
    disabled: false,
  },
  compoundVariants: [
    {
      tone: 'primary',
      variant: 'outline',
      className: 'border-blue-600 text-blue-600',
    },
    {
      tone: 'secondary',
      variant: 'outline',
      className: 'border-slate-300 text-slate-900',
    },
    {
      tone: 'danger',
      variant: 'outline',
      className: 'border-rose-600 text-rose-600',
    },
  ],
};

const complexRootNoCompoundsConfig = {
  base: complexRootConfig.base,
  variants: complexRootConfig.variants,
  defaultVariants: complexRootConfig.defaultVariants,
};

function makeComplexRootConfig() {
  return {
    base: complexRootConfig.base,
    variants: {
      tone: { ...complexRootConfig.variants.tone },
      size: { ...complexRootConfig.variants.size },
      variant: { ...complexRootConfig.variants.variant },
      disabled: { ...complexRootConfig.variants.disabled },
    },
    defaultVariants: {
      ...complexRootConfig.defaultVariants,
    },
    compoundVariants: complexRootConfig.compoundVariants.map(compound => ({
      ...compound,
    })),
  };
}

function makeComplexRootNoCompoundsConfig() {
  return {
    base: complexRootNoCompoundsConfig.base,
    variants: {
      tone: { ...complexRootNoCompoundsConfig.variants.tone },
      size: { ...complexRootNoCompoundsConfig.variants.size },
      variant: { ...complexRootNoCompoundsConfig.variants.variant },
      disabled: { ...complexRootNoCompoundsConfig.variants.disabled },
    },
    defaultVariants: {
      ...complexRootNoCompoundsConfig.defaultVariants,
    },
  };
}

const simpleSlotConfig = {
  slots: {
    root: 'inline-flex items-center gap-2 rounded-md',
    label: 'font-medium',
    icon: 'size-4',
  },
  variants: {
    tone: {
      primary: {
        root: 'bg-blue-600 text-white',
        label: 'text-white',
        icon: 'text-blue-100',
      },
      secondary: {
        root: 'bg-slate-200 text-slate-950',
        label: 'text-slate-950',
        icon: 'text-slate-500',
      },
    },
    size: {
      sm: {
        root: 'h-8 px-3',
        label: 'text-sm',
        icon: 'size-3.5',
      },
      md: {
        root: 'h-10 px-4',
        label: 'text-base',
        icon: 'size-4',
      },
    },
  },
  defaultVariants: {
    tone: 'primary',
    size: 'md',
  },
};

function makeSimpleSlotConfig() {
  return {
    slots: {
      ...simpleSlotConfig.slots,
    },
    variants: {
      tone: {
        primary: { ...simpleSlotConfig.variants.tone.primary },
        secondary: { ...simpleSlotConfig.variants.tone.secondary },
      },
      size: {
        sm: { ...simpleSlotConfig.variants.size.sm },
        md: { ...simpleSlotConfig.variants.size.md },
      },
    },
    defaultVariants: {
      ...simpleSlotConfig.defaultVariants,
    },
  };
}

const complexSlotConfig = {
  slots: {
    root: 'inline-flex items-center justify-center gap-2 rounded-md',
    label: ['font-medium', 'leading-none'],
    icon: 'shrink-0',
    badge: null,
  },
  variants: {
    tone: {
      primary: {
        root: 'bg-blue-600 text-white',
        label: ['text-white', 'uppercase'],
        icon: 'text-blue-100',
        badge: null,
      },
      secondary: {
        root: ['bg-slate-200', 'text-slate-950'],
        label: 'text-slate-900',
        icon: 'text-slate-500',
        badge: 'bg-slate-50 text-slate-700',
      },
      danger: {
        root: 'bg-rose-600 text-white',
        label: 'text-white',
        icon: 'text-rose-100',
        badge: 'bg-rose-100 text-rose-700',
      },
    },
    size: {
      sm: {
        root: 'h-8 px-3',
        label: 'text-sm',
        icon: 'size-3.5',
        badge: 'text-[10px]',
      },
      md: {
        root: 'h-10 px-4',
        label: 'text-base',
        icon: 'size-4',
        badge: 'text-xs',
      },
      lg: {
        root: 'h-12 px-5',
        label: 'text-lg',
        icon: 'size-5',
        badge: 'text-sm',
      },
    },
    emphasis: {
      quiet: {
        root: 'shadow-sm',
        label: null,
        icon: 'opacity-80',
        badge: ['hidden'],
      },
      loud: {
        root: 'ring-2 ring-offset-2',
        label: ['tracking-wide'],
        icon: 'opacity-100',
        badge: 'inline-flex',
      },
    },
    disabled: {
      true: {
        root: 'opacity-50 pointer-events-none',
        label: '',
        icon: '',
        badge: 'opacity-50',
      },
      false: {
        root: '',
        label: '',
        icon: '',
        badge: '',
      },
    },
  },
  defaultVariants: {
    tone: 'primary',
    size: 'md',
    emphasis: 'quiet',
    disabled: false,
  },
};

function makeComplexSlotConfig() {
  return {
    slots: {
      root: complexSlotConfig.slots.root,
      label: [...complexSlotConfig.slots.label],
      icon: complexSlotConfig.slots.icon,
      badge: complexSlotConfig.slots.badge,
    },
    variants: {
      tone: {
        primary: {
          root: complexSlotConfig.variants.tone.primary.root,
          label: [...complexSlotConfig.variants.tone.primary.label],
          icon: complexSlotConfig.variants.tone.primary.icon,
          badge: complexSlotConfig.variants.tone.primary.badge,
        },
        secondary: {
          root: [...complexSlotConfig.variants.tone.secondary.root],
          label: complexSlotConfig.variants.tone.secondary.label,
          icon: complexSlotConfig.variants.tone.secondary.icon,
          badge: complexSlotConfig.variants.tone.secondary.badge,
        },
        danger: { ...complexSlotConfig.variants.tone.danger },
      },
      size: {
        sm: { ...complexSlotConfig.variants.size.sm },
        md: { ...complexSlotConfig.variants.size.md },
        lg: { ...complexSlotConfig.variants.size.lg },
      },
      emphasis: {
        quiet: {
          root: complexSlotConfig.variants.emphasis.quiet.root,
          label: complexSlotConfig.variants.emphasis.quiet.label,
          icon: complexSlotConfig.variants.emphasis.quiet.icon,
          badge: [...complexSlotConfig.variants.emphasis.quiet.badge],
        },
        loud: {
          root: complexSlotConfig.variants.emphasis.loud.root,
          label: [...complexSlotConfig.variants.emphasis.loud.label],
          icon: complexSlotConfig.variants.emphasis.loud.icon,
          badge: complexSlotConfig.variants.emphasis.loud.badge,
        },
      },
      disabled: {
        true: { ...complexSlotConfig.variants.disabled.true },
        false: { ...complexSlotConfig.variants.disabled.false },
      },
    },
    defaultVariants: {
      ...complexSlotConfig.defaultVariants,
    },
  };
}

function parseArgs(argv) {
  const options = {
    out: defaultOutPath,
    ref: null,
    keepTemp: false,
    nodeEnv: null,
    runtimeWorker: false,
    sizeOnly: false,
    targetDir: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--out') {
      options.out = resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === '--ref') {
      options.ref = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--keep-temp') {
      options.keepTemp = true;
      continue;
    }
    if (token === '--runtime-worker') {
      options.runtimeWorker = true;
      continue;
    }
    if (token === '--size-only') {
      options.sizeOnly = true;
      continue;
    }
    if (token === '--target-dir') {
      options.targetDir = resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === '--node-env') {
      options.nodeEnv = argv[index + 1];
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return options;
}

function run(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      cwd: options.cwd ?? repoRoot,
      env: {
        ...process.env,
        ...(options.env ?? {}),
      },
      input: options.input,
      encoding: options.encoding ?? 'utf8',
      stdio: options.stdio ?? 'pipe',
    });
  } catch (error) {
    const stdout = error.stdout?.toString?.() ?? '';
    const stderr = error.stderr?.toString?.() ?? '';
    throw new Error(
      [
        `${command} ${args.join(' ')} failed.`,
        stdout && `stdout:\n${stdout}`,
        stderr && `stderr:\n${stderr}`,
      ]
        .filter(Boolean)
        .join('\n\n')
    );
  }
}

function ensureNodeModules(targetDir) {
  const targetNodeModules = join(targetDir, 'node_modules');
  if (existsSync(targetNodeModules)) {
    return;
  }

  symlinkSync(join(repoRoot, 'node_modules'), targetNodeModules, 'dir');
}

function prepareTarget(ref) {
  if (!ref) {
    return {
      cleanup() {},
      dir: repoRoot,
      kind: 'workspace',
      label: 'workspace',
    };
  }

  const tempDir = mkdtempSync(join(tmpdir(), 'react-class-variants-ref-'));
  const archiveBuffer = execFileSync('git', ['archive', '--format=tar', ref], {
    cwd: repoRoot,
  });
  run('tar', ['-xf', '-', '-C', tempDir], {
    cwd: repoRoot,
    input: archiveBuffer,
    encoding: 'buffer',
  });
  ensureNodeModules(tempDir);

  return {
    cleanup() {
      rmSync(tempDir, { force: true, recursive: true });
    },
    dir: tempDir,
    kind: 'git-ref',
    label: ref,
  };
}

function buildTarget(targetDir) {
  run('pnpm', ['build'], { cwd: targetDir });
}

function getEntryLayout(targetDir) {
  const distDir = join(targetDir, 'dist');
  const rootRuntime = join(distDir, 'index.mjs');
  const rootTypes = join(distDir, 'index.d.ts');
  const dedicatedCoreRuntime = join(distDir, 'core.mjs');
  const dedicatedCoreTypes = join(distDir, 'core.d.ts');
  const dedicatedReactRuntime = join(distDir, 'react.mjs');
  const dedicatedReactTypes = join(distDir, 'react.d.ts');
  const hasDedicatedCoreEntry = existsSync(dedicatedCoreRuntime);
  const hasDedicatedReactEntry = existsSync(dedicatedReactRuntime);
  const coreRuntime = hasDedicatedCoreEntry
    ? dedicatedCoreRuntime
    : rootRuntime;
  const coreTypes = existsSync(dedicatedCoreTypes)
    ? dedicatedCoreTypes
    : rootTypes;
  const reactRuntime = hasDedicatedReactEntry
    ? dedicatedReactRuntime
    : rootRuntime;
  const reactTypes = existsSync(dedicatedReactTypes)
    ? dedicatedReactTypes
    : rootTypes;

  return {
    coreRuntime,
    coreTypes,
    distDir,
    hasDedicatedCoreEntry,
    hasDedicatedReactEntry,
    reactRuntime,
    reactTypes,
    rootRuntime,
    rootTypes,
  };
}

function getPublicSurface(coreModule, reactModule) {
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

async function detectSurface(targetDir) {
  const layout = getEntryLayout(targetDir);
  const coreModule = await importModule(layout.coreRuntime);
  const reactModule = layout.hasDedicatedReactEntry
    ? await importModule(layout.reactRuntime)
    : coreModule;

  return getPublicSurface(coreModule, reactModule);
}

function resolveAccess(coreModule, reactModule, access) {
  const module = access.module === 'react' ? reactModule : coreModule;
  if (access.kind === 'direct') {
    return module[access.exportName];
  }
  return module[access.exportName]()[access.property];
}

function buildSourcePrelude({
  coreImport,
  includeMergeProps = true,
  includeStyled = true,
  reactImport,
  surface,
}) {
  const coreImports = new Set();
  const reactImports = new Set();
  const setupLines = [];

  const registerAccess = (access, localName) => {
    const imports = access.module === 'react' ? reactImports : coreImports;
    const sourceName =
      access.kind === 'factory' ? access.exportName : access.exportName;
    imports.add(
      access.kind === 'direct' && access.exportName !== localName
        ? `${sourceName} as ${localName}`
        : sourceName
    );

    if (access.kind === 'factory') {
      setupLines.push(
        `const { ${access.property}: ${localName} } = ${access.exportName}();`
      );
    }
  };

  registerAccess(surface.recipeAccess, 'recipe');
  if (includeStyled) {
    registerAccess(surface.styledAccess, 'styled');
  }

  if (includeMergeProps && surface.mergePropsAccess) {
    const imports =
      surface.mergePropsAccess.module === 'react' ? reactImports : coreImports;
    imports.add('mergeProps');
  }

  const importLines = [];
  if (coreImports.size > 0) {
    importLines.push(
      `import { ${[...coreImports].join(
        ', '
      )}, type RecipeConfigOf, type RecipeInput, type RecipeResolved } from ${JSON.stringify(
        coreImport
      )};`
    );
  }
  if (reactImports.size > 0) {
    importLines.push(
      `import { ${[...reactImports].join(', ')} } from ${JSON.stringify(
        reactImport
      )};`
    );
  }

  return {
    importLines,
    setupLines,
  };
}

function measureFile(filePath) {
  const buffer = readFileSync(filePath);
  return {
    brotliBytes: brotliCompressSync(buffer, {
      params: {
        [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
      },
    }).byteLength,
    gzipBytes: gzipSync(buffer).byteLength,
    rawBytes: buffer.byteLength,
  };
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

function collectImportGraph(entryFile) {
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
      /\bfrom\s+['"]([^'"]+)['"]|\brequire\(\s*['"]([^'"]+)['"]\s*\)/g
    );

    for (const match of matches) {
      const specifier = match[1] ?? match[2];
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

function bundleFixture({
  entryFile,
  external = [],
  outFile,
  platform = 'browser',
}) {
  const esbuildBin = join(repoRoot, 'node_modules', '.bin', 'esbuild');
  const args = [
    entryFile,
    '--bundle',
    '--format=esm',
    '--minify',
    '--target=es2018',
    '--tree-shaking=true',
    `--platform=${platform}`,
    `--outfile=${outFile}`,
  ];

  for (const value of external) {
    args.push(`--external:${value}`);
  }

  run(esbuildBin, args, { cwd: repoRoot });
  return measureFile(outFile);
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function benchmarkOps(fn, { batchSize = 1, durationMs = 250, samples = 5 }) {
  const results = [];

  for (let sample = 0; sample < samples; sample += 1) {
    const warmupEnd = performance.now() + 50;
    while (performance.now() < warmupEnd) {
      for (let index = 0; index < batchSize; index += 1) {
        fn();
      }
    }

    let iterations = 0;
    const start = performance.now();
    let elapsedMs = 0;

    do {
      for (let index = 0; index < batchSize; index += 1) {
        fn();
      }
      iterations += batchSize;
      elapsedMs = performance.now() - start;
    } while (elapsedMs < durationMs);

    results.push(iterations / (elapsedMs / 1000));
  }

  return {
    opsPerSec: median(results),
    samples,
  };
}

async function importModule(modulePath) {
  return import(`${pathToFileURL(modulePath).href}?t=${Date.now()}`);
}

async function measureRuntimeForEnv(targetDir, nodeEnv) {
  process.env.NODE_ENV = nodeEnv;

  const layout = getEntryLayout(targetDir);
  const coreModule = await importModule(layout.coreRuntime);
  const reactModule = layout.hasDedicatedReactEntry
    ? await importModule(layout.reactRuntime)
    : coreModule;
  const surface = getPublicSurface(coreModule, reactModule);
  const react = await import('react');
  const reactDomServer = await import('react-dom/server');
  const { createElement } = react;
  const { renderToStaticMarkup } = reactDomServer;
  const recipe = resolveAccess(coreModule, reactModule, surface.recipeAccess);
  const styled = resolveAccess(coreModule, reactModule, surface.styledAccess);

  function buildScenarios() {
    const simpleRecipe = recipe(simpleRootConfig);
    const complexRecipe = recipe(complexRootConfig);

    const simpleComponent = styled('button', simpleRecipe);
    const complexComponent = styled('button', complexRecipe);
    const simpleRenderComponent = styled('button', simpleRecipe, {
      withRender: true,
    });
    const complexRenderComponent = styled('button', complexRecipe, {
      withRender: true,
    });
    const renderElement = createElement('a', { href: '/docs' });
    const renderFunction = props =>
      createElement('a', { ...props, href: '/docs' });

    return {
      complexComponent,
      complexRecipe,
      complexRenderComponent,
      renderElement,
      renderFunction,
      simpleComponent,
      simpleRecipe,
      simpleRenderComponent,
      styled,
    };
  }

  const scenario = buildScenarios();

  return {
    componentCreationComplex: benchmarkOps(
      () => scenario.styled('button', scenario.complexRecipe),
      {
        batchSize: 50,
        durationMs: 250,
      }
    ),
    componentCreationSimple: benchmarkOps(
      () => scenario.styled('button', scenario.simpleRecipe),
      {
        batchSize: 50,
        durationMs: 250,
      }
    ),
    componentRenderComplex: benchmarkOps(
      () =>
        renderToStaticMarkup(
          createElement(scenario.complexComponent, {
            children: 'Save',
            disabled: true,
            size: 'lg',
            tone: 'danger',
            variant: 'outline',
          })
        ),
      {
        batchSize: 10,
        durationMs: 250,
      }
    ),
    componentRenderPropElementComplex: benchmarkOps(
      () =>
        renderToStaticMarkup(
          createElement(scenario.complexRenderComponent, {
            children: 'Docs',
            disabled: true,
            render: scenario.renderElement,
            size: 'lg',
            tone: 'danger',
            variant: 'outline',
          })
        ),
      {
        batchSize: 10,
        durationMs: 250,
      }
    ),
    componentRenderPropElementSimple: benchmarkOps(
      () =>
        renderToStaticMarkup(
          createElement(scenario.simpleRenderComponent, {
            children: 'Docs',
            render: scenario.renderElement,
            size: 'lg',
            tone: 'secondary',
          })
        ),
      {
        batchSize: 25,
        durationMs: 250,
      }
    ),
    componentRenderPropFunctionComplex: benchmarkOps(
      () =>
        renderToStaticMarkup(
          createElement(scenario.complexRenderComponent, {
            children: 'Docs',
            disabled: true,
            render: scenario.renderFunction,
            size: 'lg',
            tone: 'danger',
            variant: 'outline',
          })
        ),
      {
        batchSize: 10,
        durationMs: 250,
      }
    ),
    componentRenderPropFunctionSimple: benchmarkOps(
      () =>
        renderToStaticMarkup(
          createElement(scenario.simpleRenderComponent, {
            children: 'Docs',
            render: scenario.renderFunction,
            size: 'lg',
            tone: 'secondary',
          })
        ),
      {
        batchSize: 25,
        durationMs: 250,
      }
    ),
    componentRenderSimple: benchmarkOps(
      () =>
        renderToStaticMarkup(
          createElement(scenario.simpleComponent, {
            children: 'Save',
            size: 'lg',
            tone: 'secondary',
          })
        ),
      {
        batchSize: 25,
        durationMs: 250,
      }
    ),
    recipeCreationComplex: benchmarkOps(() => recipe(makeComplexRootConfig()), {
      batchSize: 50,
      durationMs: 250,
    }),
    recipeCreationComplexNoCompounds: benchmarkOps(
      () => recipe(makeComplexRootNoCompoundsConfig()),
      {
        batchSize: 50,
        durationMs: 250,
      }
    ),
    recipeCreationSimple: benchmarkOps(() => recipe(makeSimpleRootConfig()), {
      batchSize: 100,
      durationMs: 250,
    }),
    recipeCreationSlotComplex: benchmarkOps(
      () => recipe(makeComplexSlotConfig()),
      {
        batchSize: 25,
        durationMs: 250,
      }
    ),
    recipeCreationSlotSimple: benchmarkOps(
      () => recipe(makeSimpleSlotConfig()),
      {
        batchSize: 50,
        durationMs: 250,
      }
    ),
    resolveComplex: benchmarkOps(
      () =>
        scenario.complexRecipe({
          className: 'shadow-lg',
          disabled: true,
          size: 'lg',
          tone: 'danger',
          variant: 'outline',
        }),
      {
        batchSize: 100,
        durationMs: 250,
      }
    ),
    resolveSimple: benchmarkOps(
      () =>
        scenario.simpleRecipe({
          className: 'shadow-sm',
          size: 'lg',
          tone: 'secondary',
        }),
      {
        batchSize: 250,
        durationMs: 250,
      }
    ),
  };
}

function measureRuntime(targetDir) {
  const production = run(
    process.execPath,
    [
      scriptPath,
      '--runtime-worker',
      '--target-dir',
      targetDir,
      '--node-env',
      'production',
    ],
    {
      cwd: repoRoot,
    }
  );
  const development = run(
    process.execPath,
    [
      scriptPath,
      '--runtime-worker',
      '--target-dir',
      targetDir,
      '--node-env',
      'development',
    ],
    {
      cwd: repoRoot,
    }
  );

  return {
    development: JSON.parse(development),
    production: JSON.parse(production),
  };
}

function assertGcAvailable() {
  if (typeof global.gc !== 'function') {
    throw new Error(
      'measure-overhead.mjs requires --expose-gc so retained-heap measurements are meaningful.'
    );
  }
}

function heapUsed() {
  assertGcAvailable();
  global.gc();
  global.gc();
  return process.memoryUsage().heapUsed;
}

async function measureRetainedMemory(targetDir) {
  process.env.NODE_ENV = 'production';

  const layout = getEntryLayout(targetDir);
  const coreModule = await importModule(layout.coreRuntime);
  const reactModule = layout.hasDedicatedReactEntry
    ? await importModule(layout.reactRuntime)
    : coreModule;
  const surface = getPublicSurface(coreModule, reactModule);
  const react = await import('react');
  const { createElement } = react;
  const recipe = resolveAccess(coreModule, reactModule, surface.recipeAccess);
  const styled = resolveAccess(coreModule, reactModule, surface.styledAccess);

  const simpleRecipeForComponent = recipe(simpleRootConfig);
  const complexRecipeForComponent = recipe(complexRootConfig);
  const simpleComponent = styled('button', simpleRecipeForComponent);
  const complexComponent = styled('button', complexRecipeForComponent);
  const simpleRenderComponent = styled('button', simpleRecipeForComponent, {
    withRender: true,
  });
  const complexRenderComponent = styled('button', complexRecipeForComponent, {
    withRender: true,
  });
  const renderElement = createElement('a', { href: '/docs' });
  const renderFunction = props =>
    createElement('a', { ...props, href: '/docs' });

  function measureGroup(label, createValue, count) {
    const before = heapUsed();
    const values = [];
    for (let index = 0; index < count; index += 1) {
      values.push(createValue());
    }
    const after = heapUsed();
    const retainedBytes = after - before;
    void values[0];
    values.length = 0;
    heapUsed();

    return {
      bytesPerInstance: retainedBytes / count,
      count,
      retainedBytes,
      sample: label,
    };
  }

  return {
    componentComplex: measureGroup(
      'componentComplex',
      () => styled('button', complexRecipeForComponent),
      15000
    ),
    componentSimple: measureGroup(
      'componentSimple',
      () => styled('button', simpleRecipeForComponent),
      20000
    ),
    componentWithRenderComplex: measureGroup(
      'componentWithRenderComplex',
      () => styled('button', complexRecipeForComponent, { withRender: true }),
      15000
    ),
    componentWithRenderSimple: measureGroup(
      'componentWithRenderSimple',
      () => styled('button', simpleRecipeForComponent, { withRender: true }),
      20000
    ),
    elementComplex: measureGroup(
      'elementComplex',
      () =>
        createElement(complexComponent, {
          children: 'Save',
          disabled: true,
          size: 'lg',
          tone: 'danger',
          variant: 'outline',
        }),
      25000
    ),
    elementRenderPropElementComplex: measureGroup(
      'elementRenderPropElementComplex',
      () =>
        createElement(complexRenderComponent, {
          children: 'Docs',
          disabled: true,
          render: renderElement,
          size: 'lg',
          tone: 'danger',
          variant: 'outline',
        }),
      25000
    ),
    elementRenderPropElementSimple: measureGroup(
      'elementRenderPropElementSimple',
      () =>
        createElement(simpleRenderComponent, {
          children: 'Docs',
          render: renderElement,
          size: 'lg',
          tone: 'secondary',
        }),
      30000
    ),
    elementRenderPropFunctionComplex: measureGroup(
      'elementRenderPropFunctionComplex',
      () =>
        createElement(complexRenderComponent, {
          children: 'Docs',
          disabled: true,
          render: renderFunction,
          size: 'lg',
          tone: 'danger',
          variant: 'outline',
        }),
      25000
    ),
    elementRenderPropFunctionSimple: measureGroup(
      'elementRenderPropFunctionSimple',
      () =>
        createElement(simpleRenderComponent, {
          children: 'Docs',
          render: renderFunction,
          size: 'lg',
          tone: 'secondary',
        }),
      30000
    ),
    elementSimple: measureGroup(
      'elementSimple',
      () =>
        createElement(simpleComponent, {
          children: 'Save',
          size: 'lg',
          tone: 'secondary',
        }),
      30000
    ),
    recipeComplex: measureGroup(
      'recipeComplex',
      () => recipe(makeComplexRootConfig()),
      20000
    ),
    recipeSimple: measureGroup(
      'recipeSimple',
      () => recipe(makeSimpleRootConfig()),
      25000
    ),
  };
}

function normalizeImportSpecifier(value) {
  const normalized = value.replaceAll('\\', '/');
  return normalized.startsWith('.') ? normalized : `./${normalized}`;
}

function createSyntheticTypeSource({ coreImport, reactImport, surface }) {
  const { importLines, setupLines } = buildSourcePrelude({
    coreImport,
    reactImport,
    surface,
  });

  const blocks = [];
  for (let index = 0; index < 70; index += 1) {
    blocks.push(`
const recipe${index} = recipe({
  base: 'inline-flex items-center rounded-md',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-slate-200 text-slate-950',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type Config${index} = RecipeConfigOf<typeof recipe${index}>;
type Input${index} = RecipeInput<typeof recipe${index}>;
type Resolved${index} = RecipeResolved<typeof recipe${index}>;

const input${index}: Input${index} = {
  tone: ${index % 2 === 0 ? "'primary'" : "'secondary'"},
  size: 'md',
};

const resolved${index}: Resolved${index} = recipe${index}.resolve(input${index});
const Button${index} = styled('button', recipe${index});
const node${index} = Button${index}({
  tone: input${index}.tone,
  size: input${index}.size,
  children: resolved${index}.resolvedProps.className,
});
${
  surface.mergePropsAccess
    ? `const merge${index} = mergeProps(
  { className: resolved${index}.resolvedProps.className },
  { className: recipe${index}({ tone: 'primary' }) }
);`
    : `const merge${index} = { className: recipe${index}({ tone: 'primary' }) };`
}
void node${index};
void merge${index};
`);
  }

  return [
    "import type { ReactNode } from 'react';",
    ...importLines,
    ...setupLines,
    'const outputs: ReactNode[] = [];',
    ...blocks,
    'outputs.length;',
  ].join('\n');
}

function parseExtendedDiagnostics(output) {
  const metrics = {
    checkTimeMs: null,
    instantiations: null,
    memoryUsedKb: null,
    symbols: null,
    totalTimeMs: null,
    types: null,
  };

  const patterns = {
    checkTimeMs: /Check time:\s+([\d.]+)s/,
    instantiations: /Instantiations:\s+([\d,]+)/,
    memoryUsedKb: /Memory used:\s+([\d,]+)K/,
    symbols: /Symbols:\s+([\d,]+)/,
    totalTimeMs: /Total time:\s+([\d.]+)s/,
    types: /Types:\s+([\d,]+)/,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = output.match(pattern);
    if (!match) {
      continue;
    }

    const numeric = Number(match[1].replace(/,/g, ''));
    metrics[key] = key.endsWith('Ms') ? numeric * 1000 : numeric;
  }

  return metrics;
}

function measureTypeScript(targetDir, surface) {
  const layout = getEntryLayout(targetDir);
  const projectDir = mkdtempSync(join(targetDir, '.overhead-types-'));

  const coreImport = normalizeImportSpecifier(
    relative(projectDir, layout.coreRuntime)
  );
  const reactImport = normalizeImportSpecifier(
    relative(projectDir, layout.reactRuntime)
  );

  writeFileSync(
    join(projectDir, 'index.tsx'),
    `${createSyntheticTypeSource({
      coreImport,
      reactImport,
      surface,
    })}\n`
  );
  writeFileSync(
    join(projectDir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          baseUrl: '.',
          esModuleInterop: true,
          jsx: 'react-jsx',
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          moduleResolution: 'Bundler',
          noEmit: true,
          strict: true,
        },
        include: ['index.tsx'],
      },
      null,
      2
    )}\n`
  );

  try {
    const tscBin = join(repoRoot, 'node_modules', '.bin', 'tsc');
    const output = run(
      tscBin,
      ['-p', 'tsconfig.json', '--pretty', 'false', '--extendedDiagnostics'],
      {
        cwd: projectDir,
      }
    );
    return parseExtendedDiagnostics(output);
  } finally {
    rmSync(projectDir, { force: true, recursive: true });
  }
}

function bundleConsumers(targetDir, surface) {
  const layout = getEntryLayout(targetDir);
  const tempDir = mkdtempSync(join(tmpdir(), 'react-class-variants-bundle-'));
  const coreImport = layout.coreRuntime.replaceAll('\\', '/');
  const reactImport = layout.reactRuntime.replaceAll('\\', '/');

  try {
    const recipeOnlyEntry = join(tempDir, 'recipe-only.ts');
    const componentEntry = join(tempDir, 'component.ts');
    const recipeOnlyOut = join(tempDir, 'recipe-only.mjs');
    const componentOut = join(tempDir, 'component.mjs');
    const prelude = buildSourcePrelude({
      coreImport,
      includeMergeProps: false,
      includeStyled: false,
      reactImport,
      surface,
    });
    const componentPrelude = buildSourcePrelude({
      coreImport,
      reactImport,
      surface,
    });

    writeFileSync(
      recipeOnlyEntry,
      prelude.importLines
        .concat(prelude.setupLines, [
          'const button = recipe({',
          "  base: 'inline-flex items-center rounded-md',",
          '  variants: {',
          '    tone: {',
          "      primary: 'bg-blue-600 text-white',",
          "      secondary: 'bg-slate-200 text-slate-950',",
          '    },',
          '  },',
          '});',
          "console.log(button({ tone: 'primary' }));",
        ])
        .join('\n')
    );

    writeFileSync(
      componentEntry,
      componentPrelude.importLines
        .concat(componentPrelude.setupLines, [
          'const button = recipe({',
          "  base: 'inline-flex items-center rounded-md',",
          '  variants: {',
          '    tone: {',
          "      primary: 'bg-blue-600 text-white',",
          "      secondary: 'bg-slate-200 text-slate-950',",
          '    },',
          '  },',
          '});',
          "const Button = styled('button', button);",
          'console.log(Button);',
        ])
        .join('\n')
    );

    return {
      component: bundleFixture({
        entryFile: componentEntry,
        external: ['react'],
        outFile: componentOut,
      }),
      recipeOnly: bundleFixture({
        entryFile: recipeOnlyEntry,
        external: ['react'],
        outFile: recipeOnlyOut,
      }),
    };
  } finally {
    rmSync(tempDir, { force: true, recursive: true });
  }
}

async function measureTarget(target, options) {
  buildTarget(target.dir);

  const layout = getEntryLayout(target.dir);
  const surface = await detectSurface(target.dir);
  const coreImportGraph = collectImportGraph(layout.coreRuntime);
  const rootImportGraph = collectImportGraph(layout.rootRuntime);

  return {
    bundles: bundleConsumers(target.dir, surface),
    dist: {
      coreDts: measureFile(layout.coreTypes),
      coreImportGraph,
      coreMjs: measureFile(layout.coreRuntime),
      hasDedicatedCoreEntry: layout.hasDedicatedCoreEntry,
      hasDedicatedReactEntry: layout.hasDedicatedReactEntry,
      indexDts: measureFile(layout.rootTypes),
      indexMjs: measureFile(layout.rootRuntime),
      reactDts: measureFile(layout.reactTypes),
      reactMjs: measureFile(layout.reactRuntime),
      rootImportGraph,
    },
    memory: options.sizeOnly ? null : await measureRetainedMemory(target.dir),
    runtime: options.sizeOnly ? null : measureRuntime(target.dir),
    target: {
      cwd: target.dir,
      kind: target.kind,
      label: target.label,
    },
    typescript: options.sizeOnly
      ? null
      : measureTypeScript(target.dir, surface),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.runtimeWorker) {
    if (!options.targetDir || !options.nodeEnv) {
      throw new Error(
        '--runtime-worker requires both --target-dir and --node-env.'
      );
    }

    const report = await measureRuntimeForEnv(
      options.targetDir,
      options.nodeEnv
    );
    process.stdout.write(JSON.stringify(report));
    return;
  }

  const target = prepareTarget(options.ref);

  try {
    const report = await measureTarget(target, options);
    mkdirSync(dirname(options.out), { recursive: true });
    writeFileSync(
      options.out,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          report,
        },
        null,
        2
      )}\n`
    );

    console.log(`Wrote overhead report to ${options.out}`);
  } finally {
    if (!options.keepTemp) {
      target.cleanup();
    }
  }
}

await main();
