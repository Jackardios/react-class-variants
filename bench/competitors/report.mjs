import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdown } from './reporting.mjs';
import { aggregateWorkerResults, createWorkerTasks } from './tasks.mjs';
import { createCompetitorReport } from './schema.mjs';
import { createCompetitorBundleScenarios } from '../fixtures/bundle-sources.mjs';
import { bundleWithEsbuild } from '../shared/esbuild.mjs';
import { measureFile } from '../shared/file-size.mjs';
import { createTempDir, linkPackage, removeTempDir } from '../shared/fs.mjs';
import { runExecFile } from '../shared/process.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = dirname(scriptPath);
const repoRoot = resolve(scriptDir, '../..');
const nodeModulesRoot = join(repoRoot, 'node_modules');
const prettierBin = join(nodeModulesRoot, '.bin', 'prettier');
const workerScript = join(scriptDir, 'worker.mjs');
const defaultJsonPath = join(scriptDir, 'reports', 'competitors.json');
const defaultMarkdownPath = join(scriptDir, 'reports', 'competitors.md');

function parseArgs(argv) {
  const options = {
    json: defaultJsonPath,
    markdown: defaultMarkdownPath,
    nodeEnv: 'production',
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
    if (token === '--node-env') {
      options.nodeEnv = argv[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return options;
}

function prepareBundleFixture() {
  const fixtureDir = createTempDir('react-class-variants-bundle-');
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
    `${JSON.stringify({ private: true, type: 'module' }, null, 2)}\n`
  );

  return {
    cleanup() {
      removeTempDir(fixtureDir);
    },
    dir: fixtureDir,
  };
}

function sanitizeBundleFileName(value) {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
}

async function bundleSyntheticConsumer(fixtureDir, label, source) {
  const fileName = sanitizeBundleFileName(label);
  const entryFile = join(fixtureDir, `${fileName}.mjs`);
  const outputFile = join(fixtureDir, `${fileName}.bundle.mjs`);

  writeFileSync(entryFile, `${source}\n`);
  await bundleWithEsbuild({
    absWorkingDir: fixtureDir,
    entryFile,
    external: ['react'],
    outFile: outputFile,
  });

  return measureFile(outputFile);
}

async function measureBundleScenarios() {
  const fixture = prepareBundleFixture();
  const scenarios = createCompetitorBundleScenarios();

  try {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(scenarios).map(async ([section, entries]) => {
          const results = await Promise.all(
            Object.entries(entries).map(async ([label, source]) => {
              const metric = await bundleSyntheticConsumer(
                fixture.dir,
                `${section}-${label}`,
                source
              );
              return [label, metric];
            })
          );

          return [section, Object.fromEntries(results)];
        })
      )
    );
  } finally {
    fixture.cleanup();
  }
}

export function runWorkerTaskSubprocess(task, options = {}) {
  const script = options.workerScript ?? workerScript;
  const cwd = options.cwd ?? repoRoot;
  const stdout = runExecFile(
    process.execPath,
    [
      '--expose-gc',
      script,
      '--section',
      task.section,
      '--track',
      task.track,
      '--scenario',
      task.scenario,
      '--library',
      task.library,
      '--node-env',
      task.nodeEnv,
    ],
    {
      cwd,
      env: {
        NODE_ENV: task.nodeEnv,
      },
    }
  );

  return JSON.parse(stdout);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!existsSync(join(repoRoot, 'dist', 'index.js'))) {
    throw new Error(
      'Competitor benchmarks require a built dist/. Run `pnpm build` first.'
    );
  }

  process.env.NODE_ENV = options.nodeEnv;
  const workerResults = createWorkerTasks(options.nodeEnv).map(task =>
    runWorkerTaskSubprocess(task)
  );
  const isolatedMeasurements = aggregateWorkerResults(workerResults);
  const report = createCompetitorReport({
    bundles: await measureBundleScenarios(),
    creation: isolatedMeasurements.creation,
    environment: {
      mode: process.env.NODE_ENV,
      node: process.version,
      platform: `${process.platform} ${process.arch}`,
    },
    generatedAt: new Date().toISOString(),
    memory: isolatedMeasurements.memory,
    runtime: isolatedMeasurements.runtime,
  });

  mkdirSync(dirname(options.json), { recursive: true });
  mkdirSync(dirname(options.markdown), { recursive: true });
  writeFileSync(options.json, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(options.markdown, `${renderMarkdown(report).trimEnd()}\n`);
  runExecFile(prettierBin, ['--write', options.json, options.markdown], {
    cwd: repoRoot,
  });

  console.log(`Wrote competitor benchmark JSON to ${options.json}`);
  console.log(`Wrote competitor benchmark Markdown to ${options.markdown}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
