import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const fixturesRoot = join(repoRoot, 'test', 'types', 'consumers', 'fixtures');
const tempRoot = mkdtempSync(
  join(tmpdir(), 'react-class-variants-type-tests-')
);
const pnpmStoreDir = join(tempRoot, '.pnpm-store');

function run(command, args, cwd) {
  console.log(`\n> (${cwd}) ${command} ${args.join(' ')}`);
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
  });
}

function writeFixturePackageJson(projectDir, tarballPath, rootPackageJson) {
  const tarballSpec = `file:${relative(projectDir, tarballPath)}`;
  const reactVersion = JSON.parse(
    readFileSync(
      join(repoRoot, 'node_modules', 'react', 'package.json'),
      'utf8'
    )
  ).version;

  const manifest = {
    name: `type-consumer-${basename(projectDir)}`,
    private: true,
    dependencies: {
      react: reactVersion,
      'react-class-variants': tarballSpec,
    },
    devDependencies: {
      '@types/react': rootPackageJson.devDependencies['@types/react'],
      typescript: rootPackageJson.devDependencies.typescript,
    },
  };

  writeFileSync(
    join(projectDir, 'package.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
}

try {
  const rootPackageJson = JSON.parse(
    readFileSync(join(repoRoot, 'package.json'), 'utf8')
  );
  const fixtureNames = readdirSync(fixturesRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
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
    writeFixturePackageJson(projectDir, tarballPath, rootPackageJson);
    run(
      'pnpm',
      [
        'install',
        '--ignore-scripts',
        '--config.lockfile=false',
        '--store-dir',
        pnpmStoreDir,
      ],
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
