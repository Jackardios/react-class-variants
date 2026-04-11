import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const measureScript = join(scriptDir, 'measure-overhead.mjs');

function parseArgs(argv) {
  const options = {
    baselineRef: null,
    componentMaxGzipBytes: null,
    recipeMaxRegression: 0.15,
    report: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--baseline-ref') {
      options.baselineRef = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--component-max-gzip-bytes') {
      options.componentMaxGzipBytes = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === '--recipe-max-regression') {
      options.recipeMaxRegression = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === '--report') {
      options.report = resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return options;
}

function runMeasure(args) {
  execFileSync(process.execPath, ['--expose-gc', measureScript, ...args], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
}

function readReport(reportPath) {
  return JSON.parse(readFileSync(reportPath, 'utf8')).report;
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function formatBytes(bytes) {
  return `${bytes} B`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const tempDir = mkdtempSync(join(tmpdir(), 'react-class-variants-check-'));
  const currentReportPath = options.report ?? join(tempDir, 'current.json');
  const baselineReportPath = join(tempDir, 'baseline.json');

  try {
    if (!options.report || !existsSync(options.report)) {
      runMeasure(['--out', currentReportPath, '--size-only']);
    }

    const current = readReport(currentReportPath);

    if (options.baselineRef) {
      runMeasure([
        '--ref',
        options.baselineRef,
        '--out',
        baselineReportPath,
        '--size-only',
      ]);
      const baseline = readReport(baselineReportPath);
      const allowedRecipeGzip =
        baseline.bundles.recipeOnly.gzipBytes *
        (1 + options.recipeMaxRegression);

      assertCondition(
        current.bundles.recipeOnly.gzipBytes <= allowedRecipeGzip,
        `Recipe-only bundle gzip regressed above threshold: current ${formatBytes(
          current.bundles.recipeOnly.gzipBytes
        )}, baseline ${formatBytes(
          baseline.bundles.recipeOnly.gzipBytes
        )}, allowed ${formatBytes(Math.round(allowedRecipeGzip))}.`
      );
    }

    if (options.componentMaxGzipBytes != null) {
      assertCondition(
        current.bundles.component.gzipBytes <= options.componentMaxGzipBytes,
        `Component bundle gzip exceeds configured cap: current ${formatBytes(
          current.bundles.component.gzipBytes
        )}, cap ${formatBytes(options.componentMaxGzipBytes)}.`
      );
    }

    console.log('Overhead checks passed.');
  } finally {
    rmSync(tempDir, { force: true, recursive: true });
  }
}

main();
