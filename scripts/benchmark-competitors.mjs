import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  brotliCompressSync,
  constants as zlibConstants,
  gzipSync,
} from 'node:zlib';
import { cva } from 'class-variance-authority';
import { variants as cnVariants } from 'classname-variants';
import { twMerge } from 'tailwind-merge';
import { tv as tvMerged } from 'tailwind-variants';
import { tv as tvLite } from 'tailwind-variants/lite';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const nodeModulesRoot = join(repoRoot, 'node_modules');
const defaultJsonPath = join(repoRoot, 'bench', 'reports', 'competitors.json');
const defaultMarkdownPath = join(
  repoRoot,
  'bench',
  'reports',
  'competitors.md'
);

function parseArgs(argv) {
  const options = {
    json: defaultJsonPath,
    markdown: defaultMarkdownPath,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--json') {
      options.json = resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === '--markdown') {
      options.markdown = resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return options;
}

function assertGcAvailable() {
  if (typeof global.gc !== 'function') {
    throw new Error(
      'benchmark-competitors.mjs requires --expose-gc so retained-memory measurements are meaningful.'
    );
  }
}

function heapUsed() {
  assertGcAvailable();
  global.gc();
  global.gc();
  return process.memoryUsage().heapUsed;
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

function measureRetainedBytes(createValue, count) {
  const before = heapUsed();
  const values = [];

  for (let index = 0; index < count; index += 1) {
    values.push(createValue());
  }

  const after = heapUsed();
  const retainedBytes = after - before;

  values.length = 0;
  heapUsed();

  return {
    bytesPerInstance: retainedBytes / count,
    count,
    retainedBytes,
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

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatBytes(value) {
  return `${formatNumber(value)} B`;
}

function createComparisonTable(
  title,
  metrics,
  formatter,
  baselineLabel,
  sortDirection = 'desc'
) {
  const baselineValue = metrics[baselineLabel];
  const rows = Object.entries(metrics).sort((left, right) => {
    const leftValue = left[1];
    const rightValue = right[1];
    return sortDirection === 'asc'
      ? leftValue - rightValue
      : rightValue - leftValue;
  });

  return [
    `### ${title}`,
    '',
    '| Library | Value | Relative to react-class-variants |',
    '| --- | ---: | ---: |',
    ...rows.map(([label, value]) => {
      const relative =
        baselineValue === 0 ? 'n/a' : `${formatNumber(value / baselineValue)}x`;

      return `| ${label} | ${formatter(value)} | ${relative} |`;
    }),
    '',
  ].join('\n');
}

function summarizeBenchmarkSection(section) {
  const summary = {};

  for (const [scenario, results] of Object.entries(section)) {
    summary[scenario] = Object.fromEntries(
      Object.entries(results).map(([label, metric]) => [
        label,
        metric.opsPerSec,
      ])
    );
  }

  return summary;
}

async function loadLibrarySurface() {
  const modulePath = pathToFileURL(join(repoRoot, 'dist', 'index.mjs')).href;
  return import(`${modulePath}?t=${Date.now()}`);
}

function createBenchmarkFactories({ recipe, defineConfig }) {
  const { recipe: mergedRecipe } = defineConfig({ merge: twMerge });

  const simpleConfig = {
    base: 'btn px-4 py-2 rounded',
    variants: {
      color: { primary: 'bg-blue-500', secondary: 'bg-gray-500' },
      size: { sm: 'text-sm', md: 'text-base', lg: 'text-lg' },
    },
    defaultVariants: {
      color: 'primary',
      size: 'md',
    },
  };

  const complexConfig = {
    base: 'btn px-4 py-2 rounded font-medium',
    variants: {
      color: {
        primary: 'bg-blue-500',
        secondary: 'bg-gray-500',
        danger: 'bg-red-500',
      },
      size: { sm: 'text-sm h-8', md: 'text-base h-10', lg: 'text-lg h-12' },
      variant: {
        solid: '',
        outline: 'border-2 bg-transparent',
        ghost: 'bg-transparent',
      },
      disabled: { true: 'opacity-50 cursor-not-allowed', false: '' },
    },
    defaultVariants: {
      color: 'primary',
      size: 'md',
      variant: 'solid',
      disabled: false,
    },
    compoundVariants: [
      {
        color: 'primary',
        variant: 'outline',
        className: 'border-blue-500 text-blue-500',
      },
      {
        color: 'secondary',
        variant: 'outline',
        className: 'border-gray-500 text-gray-500',
      },
      {
        color: 'danger',
        variant: 'outline',
        className: 'border-red-500 text-red-500',
      },
      {
        disabled: true,
        variant: 'outline',
        className: 'border-opacity-50',
      },
    ],
  };

  const sharedComplexVariants = {
    color: complexConfig.variants.color,
    size: complexConfig.variants.size,
    variant: complexConfig.variants.variant,
    disabled: complexConfig.variants.disabled,
  };

  function makeSimpleConfig() {
    return {
      base: simpleConfig.base,
      variants: {
        color: { ...simpleConfig.variants.color },
        size: { ...simpleConfig.variants.size },
      },
      defaultVariants: { ...simpleConfig.defaultVariants },
    };
  }

  function makeSharedComplexVariants() {
    return {
      color: { ...complexConfig.variants.color },
      size: { ...complexConfig.variants.size },
      variant: { ...complexConfig.variants.variant },
      disabled: { ...complexConfig.variants.disabled },
    };
  }

  function makeRcvComplexConfig() {
    return {
      base: complexConfig.base,
      variants: makeSharedComplexVariants(),
      defaultVariants: { ...complexConfig.defaultVariants },
      compoundVariants: complexConfig.compoundVariants.map(compound => ({
        ...compound,
      })),
    };
  }

  function makeCvaCompoundVariants() {
    return [
      {
        color: 'primary',
        variant: 'outline',
        class: 'border-blue-500 text-blue-500',
      },
      {
        color: 'secondary',
        variant: 'outline',
        class: 'border-gray-500 text-gray-500',
      },
      {
        color: 'danger',
        variant: 'outline',
        class: 'border-red-500 text-red-500',
      },
      {
        disabled: true,
        variant: 'outline',
        class: 'border-opacity-50',
      },
    ];
  }

  function makeCnCompoundVariants() {
    return [
      {
        variants: { color: 'primary', variant: 'outline' },
        className: 'border-blue-500 text-blue-500',
      },
      {
        variants: { color: 'secondary', variant: 'outline' },
        className: 'border-gray-500 text-gray-500',
      },
      {
        variants: { color: 'danger', variant: 'outline' },
        className: 'border-red-500 text-red-500',
      },
      {
        variants: { disabled: true, variant: 'outline' },
        className: 'border-opacity-50',
      },
    ];
  }

  const cvaComplexCompoundVariants = makeCvaCompoundVariants();
  const cnComplexCompoundVariants = makeCnCompoundVariants();

  const plain = {
    'react-class-variants': {
      createSimple: () => recipe(simpleConfig),
      createSimpleFresh: () => recipe(makeSimpleConfig()),
      createComplex: () => recipe(complexConfig),
      createComplexReused: () => recipe(complexConfig),
      createComplexFresh: () => recipe(makeRcvComplexConfig()),
      simple: recipe(simpleConfig),
      complex: recipe(complexConfig),
    },
    'class-variance-authority': {
      createSimple: () =>
        cva(simpleConfig.base, {
          variants: simpleConfig.variants,
          defaultVariants: simpleConfig.defaultVariants,
        }),
      createSimpleFresh: () => {
        const config = makeSimpleConfig();
        return cva(config.base, {
          variants: config.variants,
          defaultVariants: config.defaultVariants,
        });
      },
      createComplex: () =>
        cva(complexConfig.base, {
          variants: sharedComplexVariants,
          defaultVariants: complexConfig.defaultVariants,
          compoundVariants: cvaComplexCompoundVariants,
        }),
      createComplexReused: () =>
        cva(complexConfig.base, {
          variants: sharedComplexVariants,
          defaultVariants: complexConfig.defaultVariants,
          compoundVariants: cvaComplexCompoundVariants,
        }),
      createComplexFresh: () =>
        cva(complexConfig.base, {
          variants: makeSharedComplexVariants(),
          defaultVariants: { ...complexConfig.defaultVariants },
          compoundVariants: makeCvaCompoundVariants(),
        }),
      simple: cva(simpleConfig.base, {
        variants: simpleConfig.variants,
        defaultVariants: simpleConfig.defaultVariants,
      }),
      complex: cva(complexConfig.base, {
        variants: sharedComplexVariants,
        defaultVariants: complexConfig.defaultVariants,
        compoundVariants: cvaComplexCompoundVariants,
      }),
    },
    'classname-variants': {
      createSimple: () =>
        cnVariants({
          base: simpleConfig.base,
          variants: simpleConfig.variants,
          defaultVariants: simpleConfig.defaultVariants,
        }),
      createSimpleFresh: () => cnVariants(makeSimpleConfig()),
      createComplex: () =>
        cnVariants({
          base: complexConfig.base,
          variants: sharedComplexVariants,
          defaultVariants: complexConfig.defaultVariants,
          compoundVariants: cnComplexCompoundVariants,
        }),
      createComplexReused: () =>
        cnVariants({
          base: complexConfig.base,
          variants: sharedComplexVariants,
          defaultVariants: complexConfig.defaultVariants,
          compoundVariants: cnComplexCompoundVariants,
        }),
      createComplexFresh: () =>
        cnVariants({
          base: complexConfig.base,
          variants: makeSharedComplexVariants(),
          defaultVariants: { ...complexConfig.defaultVariants },
          compoundVariants: makeCnCompoundVariants(),
        }),
      simple: cnVariants({
        base: simpleConfig.base,
        variants: simpleConfig.variants,
        defaultVariants: simpleConfig.defaultVariants,
      }),
      complex: cnVariants({
        base: complexConfig.base,
        variants: sharedComplexVariants,
        defaultVariants: complexConfig.defaultVariants,
        compoundVariants: cnComplexCompoundVariants,
      }),
    },
    'tailwind-variants/lite': {
      createSimple: () =>
        tvLite({
          base: simpleConfig.base,
          variants: simpleConfig.variants,
          defaultVariants: simpleConfig.defaultVariants,
        }),
      createSimpleFresh: () => tvLite(makeSimpleConfig()),
      createComplex: () =>
        tvLite({
          base: complexConfig.base,
          variants: sharedComplexVariants,
          defaultVariants: complexConfig.defaultVariants,
          compoundVariants: cvaComplexCompoundVariants,
        }),
      createComplexReused: () =>
        tvLite({
          base: complexConfig.base,
          variants: sharedComplexVariants,
          defaultVariants: complexConfig.defaultVariants,
          compoundVariants: cvaComplexCompoundVariants,
        }),
      createComplexFresh: () =>
        tvLite({
          base: complexConfig.base,
          variants: makeSharedComplexVariants(),
          defaultVariants: { ...complexConfig.defaultVariants },
          compoundVariants: makeCvaCompoundVariants(),
        }),
      simple: tvLite({
        base: simpleConfig.base,
        variants: simpleConfig.variants,
        defaultVariants: simpleConfig.defaultVariants,
      }),
      complex: tvLite({
        base: complexConfig.base,
        variants: sharedComplexVariants,
        defaultVariants: complexConfig.defaultVariants,
        compoundVariants: cvaComplexCompoundVariants,
      }),
    },
  };

  const merged = {
    'react-class-variants + twMerge': {
      createSimple: () => mergedRecipe(simpleConfig),
      createSimpleFresh: () => mergedRecipe(makeSimpleConfig()),
      createComplex: () => mergedRecipe(complexConfig),
      createComplexReused: () => mergedRecipe(complexConfig),
      createComplexFresh: () => mergedRecipe(makeRcvComplexConfig()),
      simple: mergedRecipe(simpleConfig),
      complex: mergedRecipe(complexConfig),
    },
    'class-variance-authority + twMerge': {
      createSimple: () => {
        const resolver = cva(simpleConfig.base, {
          variants: simpleConfig.variants,
          defaultVariants: simpleConfig.defaultVariants,
        });
        return props => twMerge(resolver(props));
      },
      createSimpleFresh: () => {
        const config = makeSimpleConfig();
        const resolver = cva(config.base, {
          variants: config.variants,
          defaultVariants: config.defaultVariants,
        });
        return props => twMerge(resolver(props));
      },
      createComplex: () => {
        const resolver = cva(complexConfig.base, {
          variants: sharedComplexVariants,
          defaultVariants: complexConfig.defaultVariants,
          compoundVariants: cvaComplexCompoundVariants,
        });
        return props => twMerge(resolver(props));
      },
      createComplexReused: () => {
        const resolver = cva(complexConfig.base, {
          variants: sharedComplexVariants,
          defaultVariants: complexConfig.defaultVariants,
          compoundVariants: cvaComplexCompoundVariants,
        });
        return props => twMerge(resolver(props));
      },
      createComplexFresh: () => {
        const resolver = cva(complexConfig.base, {
          variants: makeSharedComplexVariants(),
          defaultVariants: { ...complexConfig.defaultVariants },
          compoundVariants: makeCvaCompoundVariants(),
        });
        return props => twMerge(resolver(props));
      },
      simple: (() => {
        const resolver = cva(simpleConfig.base, {
          variants: simpleConfig.variants,
          defaultVariants: simpleConfig.defaultVariants,
        });
        return props => twMerge(resolver(props));
      })(),
      complex: (() => {
        const resolver = cva(complexConfig.base, {
          variants: sharedComplexVariants,
          defaultVariants: complexConfig.defaultVariants,
          compoundVariants: cvaComplexCompoundVariants,
        });
        return props => twMerge(resolver(props));
      })(),
    },
    'classname-variants + twMerge': {
      createSimple: () => {
        const resolver = cnVariants({
          base: simpleConfig.base,
          variants: simpleConfig.variants,
          defaultVariants: simpleConfig.defaultVariants,
        });
        return props => twMerge(resolver(props));
      },
      createSimpleFresh: () => {
        const resolver = cnVariants(makeSimpleConfig());
        return props => twMerge(resolver(props));
      },
      createComplex: () => {
        const resolver = cnVariants({
          base: complexConfig.base,
          variants: sharedComplexVariants,
          defaultVariants: complexConfig.defaultVariants,
          compoundVariants: cnComplexCompoundVariants,
        });
        return props => twMerge(resolver(props));
      },
      createComplexReused: () => {
        const resolver = cnVariants({
          base: complexConfig.base,
          variants: sharedComplexVariants,
          defaultVariants: complexConfig.defaultVariants,
          compoundVariants: cnComplexCompoundVariants,
        });
        return props => twMerge(resolver(props));
      },
      createComplexFresh: () => {
        const resolver = cnVariants({
          base: complexConfig.base,
          variants: makeSharedComplexVariants(),
          defaultVariants: { ...complexConfig.defaultVariants },
          compoundVariants: makeCnCompoundVariants(),
        });
        return props => twMerge(resolver(props));
      },
      simple: (() => {
        const resolver = cnVariants({
          base: simpleConfig.base,
          variants: simpleConfig.variants,
          defaultVariants: simpleConfig.defaultVariants,
        });
        return props => twMerge(resolver(props));
      })(),
      complex: (() => {
        const resolver = cnVariants({
          base: complexConfig.base,
          variants: sharedComplexVariants,
          defaultVariants: complexConfig.defaultVariants,
          compoundVariants: cnComplexCompoundVariants,
        });
        return props => twMerge(resolver(props));
      })(),
    },
    'tailwind-variants': {
      createSimple: () =>
        tvMerged({
          base: simpleConfig.base,
          variants: simpleConfig.variants,
          defaultVariants: simpleConfig.defaultVariants,
        }),
      createSimpleFresh: () => tvMerged(makeSimpleConfig()),
      createComplex: () =>
        tvMerged({
          base: complexConfig.base,
          variants: sharedComplexVariants,
          defaultVariants: complexConfig.defaultVariants,
          compoundVariants: cvaComplexCompoundVariants,
        }),
      createComplexReused: () =>
        tvMerged({
          base: complexConfig.base,
          variants: sharedComplexVariants,
          defaultVariants: complexConfig.defaultVariants,
          compoundVariants: cvaComplexCompoundVariants,
        }),
      createComplexFresh: () =>
        tvMerged({
          base: complexConfig.base,
          variants: makeSharedComplexVariants(),
          defaultVariants: { ...complexConfig.defaultVariants },
          compoundVariants: makeCvaCompoundVariants(),
        }),
      simple: tvMerged({
        base: simpleConfig.base,
        variants: simpleConfig.variants,
        defaultVariants: simpleConfig.defaultVariants,
      }),
      complex: tvMerged({
        base: complexConfig.base,
        variants: sharedComplexVariants,
        defaultVariants: complexConfig.defaultVariants,
        compoundVariants: cvaComplexCompoundVariants,
      }),
    },
  };

  return {
    complexExplicit: {
      color: 'danger',
      size: 'lg',
      variant: 'outline',
      disabled: true,
    },
    complexNoCompound: {
      color: 'primary',
      variant: 'solid',
    },
    complexWithCompound: {
      color: 'primary',
      variant: 'outline',
    },
    plain,
    simpleExplicit: {
      color: 'secondary',
      size: 'lg',
    },
    merged,
  };
}

function benchmarkResolvers(collection, scenarios) {
  const results = {};

  for (const [scenarioLabel, props] of Object.entries(scenarios)) {
    results[scenarioLabel] = {};
    for (const [libraryLabel, implementation] of Object.entries(collection)) {
      const resolver =
        scenarioLabel.startsWith('simple') || scenarioLabel === 'simpleDefaults'
          ? implementation.simple
          : implementation.complex;
      const batchSize =
        scenarioLabel === 'complexExplicit'
          ? 100
          : scenarioLabel.startsWith('simple')
          ? 250
          : 150;

      results[scenarioLabel][libraryLabel] = benchmarkOps(
        () => resolver(props),
        {
          batchSize,
          durationMs: 250,
        }
      );
    }
  }

  return results;
}

function benchmarkCreation(collection, createKey) {
  const results = {};

  for (const [libraryLabel, implementation] of Object.entries(collection)) {
    heapUsed();
    results[libraryLabel] = benchmarkOps(() => implementation[createKey](), {
      batchSize: 50,
      durationMs: 250,
    });
    heapUsed();
  }

  return results;
}

function benchmarkMemory(collection) {
  const results = {
    freshComplexConfig: {},
    freshSimpleConfig: {},
  };

  for (const [libraryLabel, implementation] of Object.entries(collection)) {
    results.freshComplexConfig[libraryLabel] = measureRetainedBytes(
      () => implementation.createComplexFresh(),
      10000
    );
    results.freshSimpleConfig[libraryLabel] = measureRetainedBytes(
      () => implementation.createSimpleFresh(),
      10000
    );
  }

  return results;
}

function packageLinkPath(nodeModulesDir, packageName) {
  const parts = packageName.split('/');
  if (packageName.startsWith('@')) {
    const scopeDir = join(nodeModulesDir, parts[0]);
    mkdirSync(scopeDir, { recursive: true });
    return join(scopeDir, parts[1]);
  }
  return join(nodeModulesDir, packageName);
}

function linkPackage(nodeModulesDir, packageName, targetPath) {
  if (!existsSync(targetPath)) {
    throw new Error(
      `Unable to prepare bundle fixture; missing package ${packageName} at ${targetPath}.`
    );
  }

  const linkPath = packageLinkPath(nodeModulesDir, packageName);
  if (existsSync(linkPath)) return;

  symlinkSync(targetPath, linkPath, 'dir');
}

function prepareBundleFixture() {
  const fixtureDir = mkdtempSync(
    join(tmpdir(), 'react-class-variants-bundle-')
  );
  const fixtureNodeModules = join(fixtureDir, 'node_modules');
  mkdirSync(fixtureNodeModules, { recursive: true });

  linkPackage(fixtureNodeModules, 'react-class-variants', repoRoot);

  for (const packageName of [
    'class-variance-authority',
    'classname-variants',
    'tailwind-merge',
    'tailwind-variants',
  ]) {
    linkPackage(
      fixtureNodeModules,
      packageName,
      join(nodeModulesRoot, packageName)
    );
  }

  writeFileSync(
    join(fixtureDir, 'package.json'),
    `${JSON.stringify(
      {
        private: true,
        type: 'module',
      },
      null,
      2
    )}\n`
  );

  return {
    cleanup() {
      rmSync(fixtureDir, { force: true, recursive: true });
    },
    dir: fixtureDir,
  };
}

function sanitizeBundleFileName(value) {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
}

function bundleSyntheticConsumer(fixtureDir, label, source) {
  const esbuildBin = join(repoRoot, 'node_modules', '.bin', 'esbuild');
  const fileName = sanitizeBundleFileName(label);
  const entryFile = join(fixtureDir, `${fileName}.mjs`);
  const outputFile = join(fixtureDir, `${fileName}.bundle.mjs`);

  writeFileSync(entryFile, `${source}\n`);

  try {
    execFileSync(
      esbuildBin,
      [
        entryFile,
        '--bundle',
        '--format=esm',
        '--minify',
        '--tree-shaking=true',
        '--target=es2018',
        '--platform=browser',
        '--external:react',
        `--outfile=${outputFile}`,
      ],
      {
        cwd: fixtureDir,
        env: {
          ...process.env,
          NODE_ENV: 'production',
        },
        stdio: 'pipe',
      }
    );
  } catch (error) {
    const stdout = error.stdout?.toString?.() ?? '';
    const stderr = error.stderr?.toString?.() ?? '';
    throw new Error(
      [
        `Failed to bundle synthetic consumer "${label}".`,
        stdout && `stdout:\n${stdout}`,
        stderr && `stderr:\n${stderr}`,
      ]
        .filter(Boolean)
        .join('\n\n')
    );
  }

  return measureFile(outputFile);
}

function createBundleScenarios() {
  const recipeConfig = `{
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
    tone: 'primary',
    size: 'md',
  },
}`;

  const cvaConfig = `{
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
    tone: 'primary',
    size: 'md',
  },
}`;

  return {
    plainRecipe: {
      'class-variance-authority': `import { cva } from 'class-variance-authority';
const button = cva('inline-flex items-center rounded-md', ${cvaConfig});
console.log(button({ tone: 'secondary' }));`,
      'classname-variants': `import { variants } from 'classname-variants';
const button = variants(${recipeConfig});
console.log(button({ tone: 'secondary' }));`,
      'react-class-variants': `import { recipe } from 'react-class-variants';
const button = recipe(${recipeConfig});
console.log(button({ tone: 'secondary' }));`,
      'react-class-variants/core': `import { recipe } from 'react-class-variants/core';
const button = recipe(${recipeConfig});
console.log(button({ tone: 'secondary' }));`,
      'tailwind-variants/lite': `import { tv } from 'tailwind-variants/lite';
const button = tv(${recipeConfig});
console.log(button({ tone: 'secondary' }));`,
    },
    reactStyled: {
      'classname-variants/react': `import { styled } from 'classname-variants/react';
const Button = styled('button', ${recipeConfig});
console.log(Button);`,
      'react-class-variants': `import { recipe, styled } from 'react-class-variants';
const button = recipe(${recipeConfig});
const Button = styled('button', button);
console.log(Button);`,
      'react-class-variants/react': `import { recipe, styled } from 'react-class-variants/react';
const button = recipe(${recipeConfig});
const Button = styled('button', button);
console.log(Button);`,
    },
    tailwindAwareRecipe: {
      'class-variance-authority + twMerge': `import { cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
const button = cva('inline-flex items-center rounded-md', ${cvaConfig});
console.log(twMerge(button({ tone: 'secondary' })));`,
      'classname-variants + twMerge': `import { variants } from 'classname-variants';
import { twMerge } from 'tailwind-merge';
const button = variants(${recipeConfig});
console.log(twMerge(button({ tone: 'secondary' })));`,
      'react-class-variants/core + twMerge': `import { defineConfig } from 'react-class-variants/core';
import { twMerge } from 'tailwind-merge';
const { recipe } = defineConfig({ merge: twMerge });
const button = recipe(${recipeConfig});
console.log(button({ tone: 'secondary' }));`,
      'tailwind-variants': `import { tv } from 'tailwind-variants';
const button = tv(${recipeConfig});
console.log(button({ tone: 'secondary' }));`,
    },
  };
}

function measureBundleScenarios() {
  const fixture = prepareBundleFixture();
  const scenarios = createBundleScenarios();

  try {
    return Object.fromEntries(
      Object.entries(scenarios).map(([section, entries]) => [
        section,
        Object.fromEntries(
          Object.entries(entries).map(([label, source]) => [
            label,
            bundleSyntheticConsumer(fixture.dir, `${section}-${label}`, source),
          ])
        ),
      ])
    );
  } finally {
    fixture.cleanup();
  }
}

function renderMarkdown(report) {
  const sections = [
    '# Competitive Benchmarks',
    '',
    'This report compares `react-class-variants` against `class-variance-authority`, `classname-variants`, and `tailwind-variants` on root-only common-denominator scenarios.',
    '',
    '- All numbers are collected with `NODE_ENV=production`.',
    '- `resolver-only` uses plain resolvers; `tailwind-variants/lite` is used there to isolate raw resolver cost from built-in merge work.',
    '- `tailwind-aware` compares `react-class-variants + twMerge`, wrapper-based `twMerge` integrations for CVA / classname-variants, and full `tailwind-variants`.',
    '- Primary creation throughput uses `fresh unique complex config` so it reflects first-time compile cost.',
    '- `reused complex config` remains as a diagnostic appendix for same-object config reuse versus fresh config object setup cost.',
    '- Memory numbers are retained bytes per created resolver instance under forced GC with fresh unique config objects.',
    '- Bundle size numbers are minified synthetic consumer bundles built with esbuild, reported primarily by gzip bytes with React marked external.',
    '',
    `Generated at: ${report.generatedAt}`,
    `Node: ${report.environment.node}`,
    `Mode: ${report.environment.mode}`,
    `Platform: ${report.environment.platform}`,
    '',
    '## Runtime',
    '',
  ];

  const runtimePlain = summarizeBenchmarkSection(report.runtime.plain);
  for (const [scenario, metrics] of Object.entries(runtimePlain)) {
    sections.push(
      createComparisonTable(
        `Resolver only: ${scenario}`,
        metrics,
        value => `${formatNumber(value)} ops/sec`,
        'react-class-variants'
      )
    );
  }

  const runtimeMerged = summarizeBenchmarkSection(report.runtime.tailwindAware);
  for (const [scenario, metrics] of Object.entries(runtimeMerged)) {
    sections.push(
      createComparisonTable(
        `Tailwind-aware: ${scenario}`,
        metrics,
        value => `${formatNumber(value)} ops/sec`,
        'react-class-variants + twMerge'
      )
    );
  }

  sections.push(
    createComparisonTable(
      'Resolver creation: plain (fresh unique complex config)',
      Object.fromEntries(
        Object.entries(report.creation.plain.freshComplexConfig).map(
          ([label, metric]) => [label, metric.opsPerSec]
        )
      ),
      value => `${formatNumber(value)} ops/sec`,
      'react-class-variants'
    )
  );

  sections.push(
    createComparisonTable(
      'Resolver creation: plain (diagnostic reused complex config)',
      Object.fromEntries(
        Object.entries(report.creation.plain.reusedComplexConfig).map(
          ([label, metric]) => [label, metric.opsPerSec]
        )
      ),
      value => `${formatNumber(value)} ops/sec`,
      'react-class-variants'
    )
  );

  sections.push(
    createComparisonTable(
      'Resolver creation: tailwind-aware (fresh unique complex config)',
      Object.fromEntries(
        Object.entries(report.creation.tailwindAware.freshComplexConfig).map(
          ([label, metric]) => [label, metric.opsPerSec]
        )
      ),
      value => `${formatNumber(value)} ops/sec`,
      'react-class-variants + twMerge'
    )
  );

  sections.push(
    createComparisonTable(
      'Resolver creation: tailwind-aware (diagnostic reused complex config)',
      Object.fromEntries(
        Object.entries(report.creation.tailwindAware.reusedComplexConfig).map(
          ([label, metric]) => [label, metric.opsPerSec]
        )
      ),
      value => `${formatNumber(value)} ops/sec`,
      'react-class-variants + twMerge'
    )
  );

  sections.push('## Bundle Size', '');
  sections.push(
    createBundleSizeTable(
      'Bundle size: plain recipe',
      report.bundles.plainRecipe,
      'react-class-variants/core'
    )
  );
  sections.push(
    createBundleSizeTable(
      'Bundle size: tailwind-aware recipe',
      report.bundles.tailwindAwareRecipe,
      'react-class-variants/core + twMerge'
    )
  );
  sections.push(
    createBundleSizeTable(
      'Bundle size: React/styled',
      report.bundles.reactStyled,
      'react-class-variants/react'
    )
  );

  sections.push('## Retained Memory', '');

  for (const [scenario, results] of Object.entries(report.memory.plain)) {
    sections.push(
      createComparisonTable(
        `Resolver instances: plain ${scenario}`,
        Object.fromEntries(
          Object.entries(results).map(([label, metric]) => [
            label,
            metric.bytesPerInstance,
          ])
        ),
        formatBytes,
        'react-class-variants',
        'asc'
      )
    );
  }

  for (const [scenario, results] of Object.entries(
    report.memory.tailwindAware
  )) {
    sections.push(
      createComparisonTable(
        `Resolver instances: tailwind-aware ${scenario}`,
        Object.fromEntries(
          Object.entries(results).map(([label, metric]) => [
            label,
            metric.bytesPerInstance,
          ])
        ),
        formatBytes,
        'react-class-variants + twMerge',
        'asc'
      )
    );
  }

  return sections.join('\n');
}

function createBundleSizeTable(title, results, baselineLabel) {
  const baselineValue = results[baselineLabel]?.gzipBytes;
  const rows = Object.entries(results).sort(
    (left, right) => left[1].gzipBytes - right[1].gzipBytes
  );

  return [
    `### ${title}`,
    '',
    '| Package import | gzip | raw | brotli | Relative gzip |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...rows.map(([label, metric]) => {
      const relative =
        !baselineValue || baselineValue === 0
          ? 'n/a'
          : `${formatNumber(metric.gzipBytes / baselineValue)}x`;

      return `| ${label} | ${formatBytes(metric.gzipBytes)} | ${formatBytes(
        metric.rawBytes
      )} | ${formatBytes(metric.brotliBytes)} | ${relative} |`;
    }),
    '',
  ].join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  process.env.NODE_ENV = 'production';
  const { defineConfig, recipe } = await loadLibrarySurface();
  const factories = createBenchmarkFactories({ defineConfig, recipe });

  const runtimeScenarios = {
    simpleDefaults: {},
    simpleExplicit: factories.simpleExplicit,
    complexWithCompound: factories.complexWithCompound,
    complexNoCompound: factories.complexNoCompound,
    complexExplicit: factories.complexExplicit,
  };

  const report = {
    environment: {
      mode: process.env.NODE_ENV,
      node: process.version,
      platform: `${process.platform} ${process.arch}`,
    },
    generatedAt: new Date().toISOString(),
    runtime: {
      plain: benchmarkResolvers(factories.plain, runtimeScenarios),
      tailwindAware: benchmarkResolvers(factories.merged, runtimeScenarios),
    },
    creation: {
      plain: {
        freshComplexConfig: benchmarkCreation(
          factories.plain,
          'createComplexFresh'
        ),
        reusedComplexConfig: benchmarkCreation(
          factories.plain,
          'createComplexReused'
        ),
      },
      tailwindAware: {
        freshComplexConfig: benchmarkCreation(
          factories.merged,
          'createComplexFresh'
        ),
        reusedComplexConfig: benchmarkCreation(
          factories.merged,
          'createComplexReused'
        ),
      },
    },
    memory: {
      plain: benchmarkMemory(factories.plain),
      tailwindAware: benchmarkMemory(factories.merged),
    },
    bundles: measureBundleScenarios(),
  };

  mkdirSync(dirname(options.json), { recursive: true });
  mkdirSync(dirname(options.markdown), { recursive: true });
  writeFileSync(options.json, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(options.markdown, `${renderMarkdown(report).trimEnd()}\n`);

  console.log(`Wrote competitor benchmark JSON to ${options.json}`);
  console.log(`Wrote competitor benchmark Markdown to ${options.markdown}`);
}

await main();
