import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const fixturesRoot = join(repoRoot, 'test', 'types', 'consumers', 'fixtures');
const tempRoot = mkdtempSync(
  join(tmpdir(), 'react-class-variants-type-tests-')
);
const require = createRequire(import.meta.url);

function run(command, args, cwd) {
  console.log(`\n> (${cwd}) ${command} ${args.join(' ')}`);
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
  });
}

function toFileDependency(projectDir, packagePath) {
  void projectDir;
  return `file:${packagePath}`;
}

function resolveInstalledPackageDir(packageName, fromPath = repoRoot) {
  return dirname(
    require.resolve(`${packageName}/package.json`, {
      paths: [fromPath],
    })
  );
}

function writeFixturePackageJson(projectDir, tarballPath) {
  const tarballSpec = `file:${relative(projectDir, tarballPath)}`;
  const reactTypesDir = resolveInstalledPackageDir('@types/react');
  const csstypeDependency = toFileDependency(
    projectDir,
    resolveInstalledPackageDir('csstype', reactTypesDir)
  );

  const manifest = {
    name: `type-consumer-${basename(projectDir)}`,
    private: true,
    dependencies: {
      react: toFileDependency(projectDir, resolveInstalledPackageDir('react')),
      'react-class-variants': tarballSpec,
    },
    devDependencies: {
      '@types/react': toFileDependency(projectDir, reactTypesDir),
      csstype: csstypeDependency,
      typescript: toFileDependency(
        projectDir,
        resolveInstalledPackageDir('typescript')
      ),
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

try {
  const fixtureNames = readdirSync(fixturesRoot, { withFileTypes: true })
    .filter(
      entry =>
        entry.isDirectory() &&
        existsSync(join(fixturesRoot, entry.name, 'tsconfig.json'))
    )
    .map(entry => entry.name)
    .sort();

  if (fixtureNames.length === 0) {
    throw new Error('No consumer fixtures found.');
  }

  run('pnpm', ['pack', '--pack-destination', tempRoot], repoRoot);

  const tarballs = readdirSync(tempRoot).filter(fileName =>
    fileName.endsWith('.tgz')
  );

  if (tarballs.length !== 1) {
    throw new Error(
      `Expected exactly one packed tarball, received ${tarballs.length}.`
    );
  }

  const tarballPath = join(tempRoot, tarballs[0]);
  const workspaceRoot = join(tempRoot, 'fixtures');
  cpSync(fixturesRoot, workspaceRoot, { recursive: true });

  for (const fixtureName of fixtureNames) {
    const projectDir = join(workspaceRoot, fixtureName);
    writeFixturePackageJson(projectDir, tarballPath);
    run(
      'pnpm',
      ['install', '--ignore-scripts', '--config.lockfile=false'],
      projectDir
    );
    run(
      'pnpm',
      ['exec', 'tsc', '--pretty', 'false', '-p', 'tsconfig.json', '--noEmit'],
      projectDir
    );
  }
} finally {
  rmSync(tempRoot, { force: true, recursive: true });
}
