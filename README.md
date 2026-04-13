# React Class Variants

[![npm version](https://img.shields.io/npm/v/react-class-variants.svg)](https://www.npmjs.com/package/react-class-variants)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-class-variants)](https://bundlephobia.com/package/react-class-variants)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`react-class-variants` is a recipe-first, type-safe API for composing CSS classes in React components.

The current v2 alpha surface is built around:

- one adaptive `recipe()` primitive
- one React builder, `styled()`
- explicit `render` polymorphism
- explicit merge configuration through `defineConfig()`
- a dedicated `core` subpath for recipe-only modules

## Status

- Package name: `react-class-variants`
- Current line: `2.0.0-alpha.x`
- Recommended install: `react-class-variants@alpha`
- Runtime requirements: Node.js `20.19+` and React `19`
- Module format: ESM-only

## Installation

```bash
pnpm add react-class-variants@alpha
```

Optional Tailwind conflict resolution:

```bash
pnpm add tailwind-merge
```

## Mental Model

| Need                                     | Use                              |
| ---------------------------------------- | -------------------------------- |
| Compute one root class string            | `recipe(input)`                  |
| Compute slot class strings               | `recipe(input).slotName()`       |
| Split variant props from a full prop bag | `recipe.resolve(input, options)` |
| Build a React component from a recipe    | `styled(base, recipe, options?)` |
| Share merge or validate behavior         | `defineConfig(options)`          |
| Keep typed config objects around         | `defineRecipeConfig(config)`     |
| Avoid React runtime imports              | `react-class-variants/core`      |

Four rules explain most of the package:

1. `recipe()` becomes a root recipe when you use `base`, and a slotted recipe when you use `slots`.
2. `resolve()` is the full-prop-bag API. Direct recipe calls stay variant-oriented.
3. `styled()` accepts intrinsic bases and custom React component bases.
4. Slotted recipes require `view`, and `render` is opt-in through `withRender: true` for intrinsic bases only.

## Quick Start

```tsx
import { defineRecipeConfig, recipe, styled } from 'react-class-variants';

const buttonConfig = defineRecipeConfig({
  base: 'inline-flex items-center justify-center rounded-md font-medium transition',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      ghost: 'bg-transparent text-slate-900 hover:bg-slate-100',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
    },
  },
  defaultVariants: {
    tone: 'primary',
    size: 'md',
  },
});

const buttonRecipe = recipe(buttonConfig);

export const Button = styled('button', buttonRecipe);
```

Usage:

```tsx
<Button tone="ghost" size="sm" type="button">
  Cancel
</Button>
```

Direct recipe calls stay available when you only need a class string:

```ts
buttonRecipe({ tone: 'primary', className: 'w-full' });
```

## Slotted Components

Use `slots` when different parts of the component need different classes, then render them through a `view` component:

```tsx
import { recipe, styled } from 'react-class-variants';

const buttonRecipe = recipe({
  slots: {
    root: 'inline-flex items-center gap-2 rounded-md font-medium',
    icon: 'size-4',
    label: 'truncate',
  },
  variants: {
    tone: {
      primary: {
        root: 'bg-blue-600 text-white',
        icon: 'text-blue-100',
      },
      ghost: {
        root: 'bg-transparent text-slate-900',
        icon: 'text-slate-500',
      },
    },
  },
  defaultVariants: {
    tone: 'primary',
  },
});

function ButtonView({ host, classes }) {
  const { icon, label } = classes;

  return host.render({
    children: (
      <>
        <span aria-hidden="true" className={icon()} />
        <span className={label()}>{host.children}</span>
      </>
    ),
  });
}

const Button = styled('button', buttonRecipe, {
  view: ButtonView,
});
```

Usage:

```tsx
<Button tone="ghost" className="w-full">
  Cancel
</Button>
```

Key points:

- `view` is required for slotted recipes
- `classes` is a slot render map
- external component `className` is routed automatically to the host slot
- if the recipe has no `root` slot, provide `hostSlot`

## `resolve()` and Wrappers

Use `recipe.resolve()` when you need class resolution plus a full prop bag:

- wrapper components
- headless abstractions
- host prop aliasing such as `propAliases: { size: 'htmlSize' }`
- explicit forwarding of resolved variant values with `forwardProps`

## Shared Configuration

Use `defineConfig()` when you want one configured factory for many recipes:

```ts
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

export const { recipe, styled } = defineConfig({
  merge: twMerge,
});
```

Supported options:

```ts
type SystemOptions = {
  merge?: (className: string) => string;
  validate?: 'never' | 'dev' | 'always';
};
```

## Main Package Surfaces

Package root: `react-class-variants`

- `recipe()`
- `styled()`
- `defineConfig()`
- `defineRecipeConfig()`
- public core and React types

Core subpath: `react-class-variants/core`

- `recipe()`
- core `defineConfig()`
- `defineRecipeConfig()`
- core recipe types

Use the `core` subpath when you want recipe modules without React runtime helpers.

## Where to Read Next

If you are new to the package, use this order:

1. [Recipes and components guide](./docs/recipes-and-components.md) for the main usage patterns
2. [API reference](./docs/api-reference.md) for exact shapes, options, and runtime rules
3. [Migration guide](./docs/migration-from-react-tailwind-variants.md) if you are moving from `react-tailwind-variants`

Other docs:

- [Benchmarks guide](./docs/benchmarks.md)
- [Legacy v1 reference](./docs/react-tailwind-variants-v1.md)
- [Contributing](./CONTRIBUTING.md)
- [Release process](./docs/release-process.md)
