import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cva } from 'class-variance-authority';
import { variants as cnVariants } from 'classname-variants';
import { twMerge } from 'tailwind-merge';
import { tv as tvMerged } from 'tailwind-variants';
import { tv as tvLite } from 'tailwind-variants/lite';
import {
  createCompetitorBenchmarkFactories,
  competitorRuntimeScenarios,
} from '../fixtures/competitors.mjs';
import { benchmarkOps } from '../shared/stats.mjs';
import { heapUsed, measureRetainedBytes } from '../shared/memory.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = dirname(scriptPath);
const repoRoot = resolve(scriptDir, '../..');
const scriptLabel = 'benchmark-competitors-worker.mjs';

function parseArgs(argv) {
  const options = {
    library: null,
    nodeEnv: 'production',
    scenario: null,
    section: null,
    track: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--section') {
      options.section = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--track') {
      options.track = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--scenario') {
      options.scenario = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--library') {
      options.library = argv[index + 1];
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

  if (
    !options.section ||
    !options.track ||
    !options.scenario ||
    !options.library
  ) {
    throw new Error(
      '--section, --track, --scenario, and --library are required for competitor worker tasks.'
    );
  }

  return options;
}

async function loadLibrarySurface() {
  const modulePath = pathToFileURL(join(repoRoot, 'dist', 'index.js')).href;
  return import(`${modulePath}?t=${Date.now()}`);
}

function benchmarkRuntimeTask(collection, task) {
  const implementation = collection[task.library];
  const props = competitorRuntimeScenarios[task.scenario];
  const resolver =
    task.scenario.startsWith('simple') || task.scenario === 'simpleDefaults'
      ? implementation.simple
      : implementation.complex;
  const batchSize =
    task.scenario === 'complexExplicit'
      ? 100
      : task.scenario.startsWith('simple')
      ? 250
      : 150;

  return benchmarkOps(() => resolver(props), {
    batchSize,
    durationMs: 250,
  });
}

function benchmarkCreationTask(collection, task) {
  const implementation = collection[task.library];
  const createKey =
    task.scenario === 'freshComplexConfig'
      ? 'createComplexFresh'
      : 'createComplexReused';
  const benchmarkOptions =
    task.scenario === 'reusedComplexConfig'
      ? {
          batchSize: 5000,
          durationMs: 500,
          samples: 7,
          warmupMs: 100,
        }
      : {
          batchSize: 100,
          durationMs: 350,
          samples: 7,
          warmupMs: 75,
        };

  heapUsed(scriptLabel);
  const metric = benchmarkOps(
    () => implementation[createKey](),
    benchmarkOptions
  );
  heapUsed(scriptLabel);

  return metric;
}

function benchmarkMemoryTask(collection, task) {
  const implementation = collection[task.library];
  const createValue =
    task.scenario === 'freshComplexConfig'
      ? () => implementation.createComplexFresh()
      : () => implementation.createSimpleFresh();

  return measureRetainedBytes(createValue, 10000, {
    scriptLabel,
  });
}

export async function measureWorkerTask(task) {
  process.env.NODE_ENV = task.nodeEnv;
  const { defineConfig, recipe } = await loadLibrarySurface();
  const factories = createCompetitorBenchmarkFactories({
    cnVariants,
    cva,
    defineConfig,
    recipe,
    tvLite,
    tvMerged,
    twMerge,
  });
  const collection = factories[task.track];

  let metric;
  if (task.section === 'runtime') {
    metric = benchmarkRuntimeTask(collection, task);
  } else if (task.section === 'creation') {
    metric = benchmarkCreationTask(collection, task);
  } else if (task.section === 'memory') {
    metric = benchmarkMemoryTask(collection, task);
  } else {
    throw new Error(`Unknown worker section: ${task.section}`);
  }

  return {
    library: task.library,
    metric,
    nodeEnv: task.nodeEnv,
    scenario: task.scenario,
    section: task.section,
    track: task.track,
  };
}

async function main() {
  const task = parseArgs(process.argv.slice(2));
  const result = await measureWorkerTask(task);
  process.stdout.write(JSON.stringify(result));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
