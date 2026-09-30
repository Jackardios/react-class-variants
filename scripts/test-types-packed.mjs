// Packs the package once from a clean-checkout state (dist/ hidden, so the
// `prepack` build runs) and validates that single tarball:
//   --exports    attw export-map validation
//   --consumers  Bundler and NodeNext consumer fixtures, compiled with every
//                TypeScript version in typeScriptPackages
// Without flags both run.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const consumersRoot = join(repoRoot, 'test', 'types', 'consumers');
const fixturesRoot = join(consumersRoot, 'fixtures');
const smokeSourcePath = join(consumersRoot, 'smoke.ts');
const distPath = resolve(repoRoot, 'dist');
const require = createRequire(import.meta.url);

// The documented minimum (5.4 added NoInfer, which the declarations use), the
// repository's own compiler, and the newest release of each later major.
// Inference changes between majors, so the published types are checked
// against each of them rather than against one compiler. The extra versions
// live in a workspace package so their tsc binaries stay out of the root
// node_modules/.bin.
const compilersPackageDir = join(repoRoot, 'test', 'types', 'compilers');
const typeScriptPackages = [
  ['typescript-5.4', compilersPackageDir],
  ['typescript', repoRoot],
  ['typescript-6', compilersPackageDir],
  ['typescript-7', compilersPackageDir],
];

const flags = new Set(process.argv.slice(2).filter(arg => arg !== '--'));
for (const flag of flags) {
  if (flag !== '--exports' && flag !== '--consumers') {
    throw new Error(`Unknown flag: ${flag}`);
  }
}
const runAll = !flags.has('--exports') && !flags.has('--consumers');
const checkExports = runAll || flags.has('--exports');
const checkConsumers = runAll || flags.has('--consumers');

// dist/ is moved aside with a same-device rename, so its backup stays inside
// the repo. The tarball and fixtures live outside it: pnpm would otherwise
// resolve the fixtures against the enclosing project.
const backupRoot = mkdtempSync(join(repoRoot, '.pack-check-'));
const distBackupPath = join(backupRoot, 'dist');
const tempRoot = mkdtempSync(join(tmpdir(), 'react-class-variants-pack-'));

function run(command, args, cwd = repoRoot) {
  console.log(
    `\n> (${cwd === repoRoot ? '.' : basename(cwd)}) ${command} ${args.join(
      ' '
    )}`
  );
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

function restoreDist() {
  rmSync(distPath, { force: true, recursive: true });
  if (existsSync(distBackupPath)) {
    renameSync(distBackupPath, distPath);
  }
  rmSync(backupRoot, { force: true, recursive: true });
  rmSync(tempRoot, { force: true, recursive: true });
}

// By default an interrupt kills Node at once and leaves the developer's dist/
// inside .pack-check-*. A listener keeps Node alive instead: the interrupted
// child command fails, `finally` restores dist/, and the handler, which only
// runs once the synchronous script has finished, exits with the signal code.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    process.exit(128 + (signal === 'SIGINT' ? 2 : 15));
  });
}

function packFromCleanCheckout() {
  if (existsSync(distPath)) {
    renameSync(distPath, distBackupPath);
  }

  run('pnpm', ['pack', '--pack-destination', tempRoot]);

  assert.equal(
    readdirSync(distPath).some(fileName => /-[^.]+\.d\.ts$/.test(fileName)),
    false,
    'dist/ should not contain hashed shared declaration chunks.'
  );

  const tarballs = readdirSync(tempRoot).filter(fileName =>
    fileName.endsWith('.tgz')
  );
  assert.equal(tarballs.length, 1, 'Expected exactly one packed tarball.');

  return join(tempRoot, tarballs[0]);
}

function resolveInstalledPackageDir(packageName, fromPath = repoRoot) {
  return dirname(
    require.resolve(`${packageName}/package.json`, {
      paths: [fromPath],
    })
  );
}

function writeFixturePackageJson(projectDir, tarballPath) {
  const reactTypesDir = resolveInstalledPackageDir('@types/react');
  const csstypeDependency = `file:${resolveInstalledPackageDir(
    'csstype',
    reactTypesDir
  )}`;
  const manifest = {
    name: `type-consumer-${basename(projectDir)}`,
    private: true,
    // NodeNext treats .ts files as CommonJS without it, and CommonJS cannot
    // import this ESM-only package.
    type: 'module',
    dependencies: {
      react: `file:${resolveInstalledPackageDir('react')}`,
      'react-class-variants': `file:${relative(projectDir, tarballPath)}`,
    },
    devDependencies: {
      '@types/react': `file:${reactTypesDir}`,
      csstype: csstypeDependency,
    },
    pnpm: {
      overrides: {
        csstype: csstypeDependency,
      },
    },
  };

  writeFileSync(
    join(projectDir, 'package.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
}

function checkConsumerFixtures(tarballPath) {
  const fixtureNames = readdirSync(fixturesRoot, { withFileTypes: true })
    .filter(
      entry =>
        entry.isDirectory() &&
        existsSync(join(fixturesRoot, entry.name, 'tsconfig.json'))
    )
    .map(entry => entry.name)
    .sort();

  assert.notEqual(fixtureNames.length, 0, 'No consumer fixtures found.');

  const compilers = typeScriptPackages.map(([packageName, fromPath]) =>
    join(resolveInstalledPackageDir(packageName, fromPath), 'bin', 'tsc')
  );
  const workspaceRoot = join(tempRoot, 'fixtures');
  cpSync(fixturesRoot, workspaceRoot, { recursive: true });

  for (const fixtureName of fixtureNames) {
    const projectDir = join(workspaceRoot, fixtureName);

    mkdirSync(join(projectDir, 'src'), { recursive: true });
    copyFileSync(smokeSourcePath, join(projectDir, 'src', 'index.ts'));
    writeFixturePackageJson(projectDir, tarballPath);
    run(
      'pnpm',
      ['install', '--ignore-scripts', '--config.lockfile=false'],
      projectDir
    );
    for (const compiler of compilers) {
      run(process.execPath, [compiler, '--version'], projectDir);
      run(
        process.execPath,
        [compiler, '--pretty', 'false', '-p', 'tsconfig.json', '--noEmit'],
        projectDir
      );
    }
  }
}

try {
  const tarballPath = packFromCleanCheckout();

  if (checkExports) {
    run('pnpm', [
      'exec',
      'attw',
      tarballPath,
      '--profile',
      'esm-only',
      '--entrypoints',
      '.',
      './core',
    ]);
  }

  if (checkConsumers) {
    checkConsumerFixtures(tarballPath);
  }
} finally {
  restoreDist();
}
