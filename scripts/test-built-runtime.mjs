import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
// "react" to an ESM stub via a loader instead.
function createReactShimLoader() {
  const tempDir = mkdtempSync(resolve(tmpdir(), 'react-class-variants-'));
  const reactShimPath = resolve(tempDir, 'react-shim.mjs');
  const loaderPath = resolve(tempDir, 'react-loader.mjs');

  writeFileSync(reactShimPath, reactShimSource);
  writeFileSync(
    loaderPath,
    `const reactShimUrl = ${JSON.stringify(pathToFileURL(reactShimPath).href)};

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'react') {
    return {
      shortCircuit: true,
      url: reactShimUrl,
    };
  }

  return nextResolve(specifier, context);
}
`
  );

  return {
    loaderPath,
    tempDir,
  };
}

function assertImportsWithoutProcess(entryPath, shimReact = false) {
  const reactShimLoader = shimReact ? createReactShimLoader() : null;

  try {
    execFileSync(
      process.execPath,
      [
        ...(reactShimLoader
          ? ['--no-warnings', '--loader', reactShimLoader.loaderPath]
          : []),
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
    if (reactShimLoader) {
      rmSync(reactShimLoader.tempDir, { force: true, recursive: true });
    }
  }
}

assertImportsWithoutProcess(packageRootPath, true);
assertImportsWithoutProcess(corePath);

const packageRoot = await import(pathToFileURL(packageRootPath).href);
const core = await import(pathToFileURL(corePath).href);

const coreSource = readFileSync(corePath, 'utf8');
assert.equal(/from ['"]react['"]/.test(coreSource), false);

const rootRecipe = core.recipe({
  base: 'inline-flex items-center',
  variants: {
    tone: {
      primary: 'bg-blue text-white',
      ghost: 'bg-transparent text-slate-900',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  defaultVariants: {
    tone: 'primary',
    disabled: false,
  },
});

assert.equal(rootRecipe(), 'inline-flex items-center bg-blue text-white');
assert.deepEqual(
  rootRecipe.resolve(
    {
      disabled: true,
      htmlSize: 12,
      type: 'button',
    },
    {
      forwardProps: ['disabled'],
      propAliases: { size: 'htmlSize' },
    }
  ),
  {
    variants: {
      tone: 'primary',
      disabled: true,
    },
    resolvedProps: {
      type: 'button',
      size: 12,
      disabled: true,
      className: 'inline-flex items-center bg-blue text-white opacity-50',
    },
  }
);

const slotRecipe = core.recipe({
  slots: {
    root: 'inline-flex items-center gap-2',
    label: 'truncate',
    spinner: 'hidden size-4',
  },
  variants: {
    tone: {
      primary: {
        root: 'bg-blue text-white',
        spinner: 'text-blue-100',
      },
      ghost: {
        root: 'bg-transparent text-slate-900',
        spinner: 'text-slate-500',
      },
    },
    loading: {
      true: {
        label: 'opacity-0',
        spinner: 'inline-block animate-spin',
      },
    },
  },
  defaultVariants: {
    tone: 'primary',
    loading: false,
  },
});

const renderedSlots = slotRecipe({ loading: true });
const { root, label, spinner } = renderedSlots;
assert.equal(root(), 'inline-flex items-center gap-2 bg-blue text-white');
assert.equal(
  root({ tone: 'ghost', className: 'rounded-md' }),
  'inline-flex items-center gap-2 bg-transparent text-slate-900 rounded-md'
);
assert.equal(label(), 'truncate opacity-0');
assert.equal(
  spinner(),
  'hidden size-4 text-blue-100 inline-block animate-spin'
);

const resolvedSlotRecipe = slotRecipe.resolve(
  {
    className: 'external',
    id: 'save',
    loading: true,
  },
  {
    forwardProps: ['loading'],
  }
);
assert.deepEqual(resolvedSlotRecipe.variants, {
  tone: 'primary',
  loading: true,
});
assert.deepEqual(resolvedSlotRecipe.resolvedProps, {
  className: 'external',
  id: 'save',
  loading: true,
});
assert.equal(
  resolvedSlotRecipe.slots.root({ className: 'rounded-md' }),
  'inline-flex items-center gap-2 bg-blue text-white rounded-md'
);

const Button = packageRoot.styled('button', rootRecipe);
const buttonMarkup = renderToStaticMarkup(
  React.createElement(Button, { tone: 'primary', type: 'button' }, 'Press')
);
assert.match(
  buttonMarkup,
  /class="inline-flex items-center bg-blue text-white"/
);
assert.match(buttonMarkup, /type="button"/);

const Badge = packageRoot.styled('span', rootRecipe, {
  view: ({ host, variants }) =>
    host.render({ 'data-tone': variants.tone, children: host.children }),
});
const badgeMarkup = renderToStaticMarkup(
  React.createElement(Badge, { tone: 'ghost' }, 'Info')
);
assert.match(badgeMarkup, /data-tone="ghost"/);
assert.match(
  badgeMarkup,
  /class="inline-flex items-center bg-transparent text-slate-900"/
);

const SlotButton = packageRoot.styled('button', slotRecipe, {
  view: ({ host, classes, variants }) =>
    host.render({
      'aria-busy': variants.loading || undefined,
      children: [
        variants.loading
          ? React.createElement('span', {
              className: classes.spinner(),
              'data-slot': 'spinner',
              key: 'spinner',
            })
          : null,
        React.createElement(
          'span',
          { className: classes.label(), 'data-slot': 'label', key: 'label' },
          host.children
        ),
      ],
    }),
});
const slotButtonMarkup = renderToStaticMarkup(
  React.createElement(
    SlotButton,
    { className: 'rounded-md', loading: true },
    'Save'
  )
);
assert.match(slotButtonMarkup, /aria-busy="true"/);
assert.match(
  slotButtonMarkup,
  /class="inline-flex items-center gap-2 bg-blue text-white rounded-md"/
);
assert.match(
  slotButtonMarkup,
  /class="hidden size-4 text-blue-100 inline-block animate-spin" data-slot="spinner"/
);

const configuredCore = core.defineConfig({
  merge: className => className,
});
assert.equal(
  configuredCore.recipe({
    base: 'inline-flex',
    variants: {
      tone: {
        info: 'text-sky-700',
      },
    },
  })({ tone: 'info' }),
  'inline-flex text-sky-700'
);

const leanDefaultRecipe = core.recipe({
  base: 'inline-flex',
  variants: {
    tone: {
      info: 'text-sky-700',
    },
  },
});
assert.equal(leanDefaultRecipe(), 'inline-flex');
assert.equal(packageRoot.recipe({ base: 'inline-flex' })(), 'inline-flex');

const validationDefaultRecipe = core
  .defineConfig({
    validate: 'always',
  })
  .recipe({
    base: 'inline-flex',
    variants: {
      tone: {
        info: 'text-sky-700',
      },
    },
  });
assert.throws(
  () => validationDefaultRecipe(),
  /missing required recipe variant "tone"/
);
assert.throws(
  () =>
    core.defineConfig({ validate: 'always' }).recipe({
      base: 'inline-flex',
      variants: {
        tone: {
          info: 'text-sky-700',
        },
      },
    })(),
  /missing required recipe variant "tone"/
);
assert.throws(
  () =>
    packageRoot.defineConfig({ validate: 'always' }).recipe({
      base: 'inline-flex',
      variants: {
        tone: {
          info: 'text-sky-700',
        },
      },
    })(),
  /missing required recipe variant "tone"/
);

const configuredPackage = packageRoot.defineConfig({
  merge: className => className,
});
const ConfiguredButton = configuredPackage.styled(
  'button',
  configuredPackage.recipe({
    base: 'inline-flex',
    variants: {
      tone: {
        info: 'text-sky-700',
      },
    },
  })
);
const configuredMarkup = renderToStaticMarkup(
  React.createElement(ConfiguredButton, { tone: 'info', type: 'button' }, 'Go')
);
assert.match(configuredMarkup, /class="inline-flex text-sky-700"/);

console.log('Built runtime smoke checks passed.');
