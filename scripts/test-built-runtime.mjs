// Checks of the built package that the Vitest suite cannot cover: importing
// the entries in an environment without `process`, the React-free core entry,
// and server rendering in plain Node. Behavioral coverage of dist/ comes from
// `vitest run --config vitest.built.config.ts`.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const packageRootPath = resolve(repoRoot, 'dist/index.js');
const corePath = resolve(repoRoot, 'dist/core.js');

const reactShimSource = `export const cloneElement = () => null;
export const createElement = () => null;
export const forwardRef = render => render;
export const isValidElement = () => false;
export const useMemo = factory => factory();`;

// Node 20 crashes in the ESM->CJS bridge before require.cache shims apply when
// globalThis.process is undefined, so the package-root smoke test redirects
// "react" to an ESM stub through a module.register() resolve hook instead. The
// core entry gets a hook that rejects "react" anywhere in its module graph.
function createReactHooks(shimReact) {
  const tempDir = mkdtempSync(resolve(tmpdir(), 'react-class-variants-'));
  const reactShimPath = resolve(tempDir, 'react-shim.mjs');
  const hooksPath = resolve(tempDir, 'react-hooks.mjs');
  const registerPath = resolve(tempDir, 'register.mjs');

  writeFileSync(reactShimPath, reactShimSource);
  writeFileSync(
    hooksPath,
    `const reactShimUrl = ${JSON.stringify(pathToFileURL(reactShimPath).href)};

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'react' || specifier.startsWith('react/')) {
    ${
      shimReact
        ? 'return { shortCircuit: true, url: reactShimUrl };'
        : 'throw new Error(`${context.parentURL} imports ${specifier}`);'
    }
  }

  return nextResolve(specifier, context);
}
`
  );
  writeFileSync(
    registerPath,
    `import { register } from 'node:module';

register(${JSON.stringify(pathToFileURL(hooksPath).href)});
`
  );

  return {
    registerPath,
    tempDir,
  };
}

function assertImportsWithoutProcess(entryPath, shimReact) {
  const reactHooks = createReactHooks(shimReact);

  try {
    execFileSync(
      process.execPath,
      [
        '--import',
        pathToFileURL(reactHooks.registerPath).href,
        '--input-type=module',
        '--eval',
        `
globalThis.process = undefined;
const module = await import(${JSON.stringify(pathToFileURL(entryPath).href)});
module.recipe({ base: 'inline-flex' });
module.defineConfig().recipe({ base: 'inline-flex' });`,
      ],
      {
        cwd: repoRoot,
        stdio: 'inherit',
      }
    );
  } finally {
    rmSync(reactHooks.tempDir, { force: true, recursive: true });
  }
}

assertImportsWithoutProcess(packageRootPath, true);
assertImportsWithoutProcess(corePath, false);

const packageRoot = await import(pathToFileURL(packageRootPath).href);
const { recipe, styled } = packageRoot.defineConfig();

const buttonRecipe = recipe({
  slots: {
    root: 'inline-flex items-center',
    label: 'truncate',
  },
  variants: {
    tone: {
      primary: { root: 'bg-blue text-white' },
    },
  },
});
const Button = styled('button', buttonRecipe, {
  view: ({ host, classes }) =>
    host.render({
      children: React.createElement(
        'span',
        { className: classes.label() },
        host.children
      ),
    }),
});
const markup = renderToStaticMarkup(
  React.createElement(Button, { tone: 'primary', type: 'button' }, 'Press')
);

assert.equal(
  markup,
  '<button type="button" class="inline-flex items-center bg-blue text-white"><span class="truncate">Press</span></button>'
);

console.log('Built runtime smoke checks passed.');
