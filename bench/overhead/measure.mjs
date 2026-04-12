import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { measureFile } from '../shared/file-size.mjs';
import { createOverheadSnapshot } from './schema.mjs';
import { bundleConsumers } from './bundles.mjs';
import { measureRetainedMemory } from './memory.mjs';
import { measureRuntime, measureRuntimeForEnv } from './runtime.mjs';
import {
  collectImportGraph,
  detectSurface,
  getEntryLayout,
} from './surface.mjs';
import { buildTarget, prepareTarget } from './target.mjs';
import { measureTypeScriptProfiles } from './typescript.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = resolve(scriptDir, '../..');
const defaultOutPath = join(scriptDir, 'reports', 'current.json');

function parseArgs(argv) {
  const options = {
    keepTemp: false,
    nodeEnv: null,
    out: defaultOutPath,
    ref: null,
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

async function measureTarget(target, options) {
  buildTarget(target.dir);

  const layout = getEntryLayout(target.dir);
  const surface = await detectSurface(target.dir);

  return {
    bundles: await bundleConsumers({
      repoRoot,
      surface,
      targetDir: target.dir,
    }),
    dist: {
      coreDts: measureFile(layout.coreTypes),
      coreImportGraph: collectImportGraph(layout.coreRuntime),
      coreMjs: measureFile(layout.coreRuntime),
      hasDedicatedCoreEntry: layout.hasDedicatedCoreEntry,
      hasDedicatedReactEntry: layout.hasDedicatedReactEntry,
      indexDts: measureFile(layout.rootTypes),
      indexMjs: measureFile(layout.rootRuntime),
      reactDts: measureFile(layout.reactTypes),
      reactMjs: measureFile(layout.reactRuntime),
      rootImportGraph: collectImportGraph(layout.rootRuntime),
    },
    memory: options.sizeOnly ? null : await measureRetainedMemory(target.dir),
    runtime: options.sizeOnly
      ? null
      : measureRuntime({
          repoRoot,
          scriptPath,
          targetDir: target.dir,
        }),
    target: {
      cwd: target.dir,
      kind: target.kind,
      label: target.label,
    },
    typescript: options.sizeOnly
      ? null
      : measureTypeScriptProfiles({
          repoRoot,
          surface,
          targetDir: target.dir,
        }),
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

  const target = prepareTarget(repoRoot, options.ref);

  try {
    const report = await measureTarget(target, options);
    mkdirSync(dirname(options.out), { recursive: true });
    writeFileSync(
      options.out,
      `${JSON.stringify(
        createOverheadSnapshot({
          generatedAt: new Date().toISOString(),
          report,
        }),
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
