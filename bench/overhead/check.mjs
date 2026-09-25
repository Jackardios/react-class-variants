import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../..');
const measureScript = join(scriptDir, 'measure.mjs');
// Bundle profiles gated against a baseline, with their default thresholds.
const gatedBundles = [
  { key: 'recipeOnly', label: 'Recipe-only', option: 'recipeMaxRegression' },
  {
    key: 'slottedRecipe',
    label: 'Slotted recipe',
    option: 'slottedRecipeMaxRegression',
  },
  {
    key: 'component',
    label: 'Component',
    option: 'componentMaxRegression',
  },
];

function parseArgs(argv) {
  /**
   * @type {{
   *   baselineFile: string | null;
   *   baselineRef: string | null;
   *   componentMaxGzipBytes: number | null;
   *   componentMaxRegression: number;
   *   recipeMaxRegression: number;
   *   report: string | null;
   *   slottedRecipeMaxRegression: number;
   *   writeBaseline: string | null;
   * }}
   */
  const options = {
    baselineFile: null,
    baselineRef: null,
    componentMaxGzipBytes: null,
    componentMaxRegression: 0.1,
    recipeMaxRegression: 0.15,
    report: null,
    slottedRecipeMaxRegression: 0.15,
    writeBaseline: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--baseline-file') {
      options.baselineFile = resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === '--write-baseline') {
      options.writeBaseline = resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === '--component-max-regression') {
      options.componentMaxRegression = Number(argv[index + 1]);
      index += 1;
      continue;
    }
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
    if (token === '--slotted-recipe-max-regression') {
      options.slottedRecipeMaxRegression = Number(argv[index + 1]);
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

  if (options.baselineFile && options.baselineRef) {
    throw new Error('Pass either --baseline-file or --baseline-ref, not both.');
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

// The committed baseline keeps only the gated gzip sizes, so it changes only
// when a PR intentionally moves the bundle budget.
function writeBaselineFile(baselinePath, report) {
  const bundles = Object.fromEntries(
    gatedBundles.map(({ key }) => [
      key,
      { gzipBytes: report.bundles[key].gzipBytes },
    ])
  );

  writeFileSync(baselinePath, `${JSON.stringify({ bundles }, null, 2)}\n`);
  console.log(`Wrote overhead baseline to ${baselinePath}.`);
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function formatBytes(bytes) {
  return `${bytes} B`;
}

function assertBundleRegressionWithinThreshold({
  baselineMetric,
  currentMetric,
  label,
  regressionThreshold,
}) {
  if (!baselineMetric || !currentMetric) {
    return;
  }

  const allowedGzip = baselineMetric.gzipBytes * (1 + regressionThreshold);
  assertCondition(
    currentMetric.gzipBytes <= allowedGzip,
    `${label} bundle gzip regressed above threshold: current ${formatBytes(
      currentMetric.gzipBytes
    )}, baseline ${formatBytes(
      baselineMetric.gzipBytes
    )}, allowed ${formatBytes(Math.round(allowedGzip))}.`
  );
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

    if (options.writeBaseline) {
      writeBaselineFile(options.writeBaseline, current);
      return;
    }

    let baseline = null;

    if (options.baselineFile) {
      baseline = JSON.parse(readFileSync(options.baselineFile, 'utf8'));
    } else if (options.baselineRef) {
      runMeasure([
        '--ref',
        options.baselineRef,
        '--out',
        baselineReportPath,
        '--size-only',
      ]);
      baseline = readReport(baselineReportPath);
    }

    if (baseline) {
      for (const { key, label, option } of gatedBundles) {
        // A measured older ref may predate a profile; a committed baseline
        // must cover every gated bundle.
        assertCondition(
          !options.baselineFile || baseline.bundles[key],
          `${options.baselineFile} has no "${key}" bundle; regenerate it with pnpm check:overhead:update.`
        );
        assertBundleRegressionWithinThreshold({
          baselineMetric: baseline.bundles[key],
          currentMetric: current.bundles[key],
          label,
          regressionThreshold: options[option],
        });
      }
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
