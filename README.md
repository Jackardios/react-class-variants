# React Class Variants

[![npm version](https://img.shields.io/npm/v/react-class-variants.svg)](https://www.npmjs.com/package/react-class-variants)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-class-variants)](https://bundlephobia.com/package/react-class-variants)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`react-class-variants` is a recipe-first, type-safe API for composing CSS classes in React components.

The v2 alpha surface is built around:

- one adaptive `recipe()` primitive
- one React builder, `styled()`
- explicit `render` polymorphism
- explicit `merge` configuration through `defineConfig()`
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

Two rules explain most of the package:

1. `recipe()` becomes a root recipe when you use `base`, and a slotted recipe when you use `slots`.
2. `styled()` accepts any React `ElementType`. Intrinsic bases may opt into `render`; slotted recipes must provide a `view` component.

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

## `resolve()` for Full Prop Bags

Use `resolve()` when you need class resolution plus prop routing.

```ts
const fieldRecipe = recipe({
  base: 'block rounded-md border',
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const resolved = fieldRecipe.resolve(
  {
    size: 'sm',
    htmlSize: 20,
    disabled: true,
    type: 'email',
    className: 'w-full',
  },
  {
    forwardProps: ['disabled'],
    propAliases: { size: 'htmlSize' },
  }
);
```

`resolved` contains:

- `resolved.variants`: the effective variant selection after defaults and boolean fallbacks
- `resolved.resolvedProps`: the remaining prop bag with the final `className`

`forwardProps` re-adds selected variant keys to `resolvedProps`. `propAliases` lets you expose an alternate public prop name when a variant key collides with a base prop such as `size`.

## Slotted Recipes

Slotted recipes use `slots` and return slot render functions.

```ts
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
    loading: {
      true: {
        icon: 'animate-spin',
        label: 'opacity-0',
      },
    },
  },
  defaultVariants: {
    tone: 'primary',
    loading: false,
  },
});

const slots = buttonRecipe({ tone: 'ghost' });

slots.root({ className: 'px-4' });
slots.icon({ loading: true });
slots.label();
```

Slot render functions are plain functions:

- they may be destructured safely
- they may override variants locally
- they recompute compounds against the merged local selection
- they do not assign component-level `className` for you

## `styled()` Basics

### Root recipe, simple path

```tsx
const Badge = styled('span', badgeRecipe);
```

This path:

- applies the resolved root class string automatically
- keeps variant props typed
- is the cheapest runtime path

### Root recipe, custom `view`

```tsx
function BadgeView({ host, variants }) {
  return host.render({
    'data-tone': variants.tone,
    children: host.children,
  });
}

const Badge = styled('span', badgeRecipe, {
  view: BadgeView,
});
```

`view` is a real React component:

- hooks are allowed
- prefer a named component reference such as `view: BadgeView` when you plan to use hooks so hook linting stays happy
- the `host` object models the rendered base element or component
- `host.className` already contains the resolved root classes
- `host.render()` renders the base with optional overrides

### Slot recipe, `view`

```tsx
function ButtonView({ host, classes, variants }) {
  const { icon, label } = classes;

  return host.render({
    'aria-busy': variants.loading || undefined,
    children: (
      <>
        {variants.loading ? (
          <span aria-hidden="true" className={icon()} />
        ) : null}
        <span className={label()}>{host.children}</span>
      </>
    ),
  });
}

const Button = styled('button', buttonRecipe, {
  withRender: true,
  forwardProps: ['loading'],
  view: ButtonView,
});
```

Slot recipe rules:

- `view` is required
- `classes` exists only for slotted recipes
- `classes` may be safely destructured inside `view`
- external component `className` is routed automatically to the host slot
- if the recipe does not declare a `root` slot, provide `hostSlot`

Example without a `root` slot:

```tsx
function FieldView({ host, classes }) {
  return host.render({
    children: (
      <>
        <input className={classes.input()} />
        {host.children}
      </>
    ),
  });
}

const Field = styled('label', fieldRecipe, {
  hostSlot: 'label',
  view: FieldView,
});
```

Useful `view` details:

- `host.props` contains normalized pass-through props under their resolved base names, plus any `forwardProps` variant keys
- `propAliases` change the public prop name, but `host.props` still uses the resolved base prop key such as `size`
- `host.render()` reuses the current `host.children` unless you override `children`

### Custom component bases

`styled()` also accepts custom React components as the base:

```tsx
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

const RouterLink = forwardRef<
  HTMLAnchorElement,
  { to: string } & ComponentPropsWithoutRef<'a'>
>(function RouterLink({ to, ...props }, ref) {
  return <a {...props} ref={ref} href={to} />;
});

const LinkBadge = styled(RouterLink, badgeRecipe);
```

Rules:

- custom bases do not support `withRender`
- custom bases should accept and forward `className`, `children`, and `ref` when those behaviors matter to your component
- use custom bases when you want recipe-driven class resolution on top of an existing component contract

## `render` Polymorphism

`render` stays opt-in through `withRender: true` and is available only for intrinsic bases.

```tsx
const Button = styled('button', buttonRecipe, {
  withRender: true,
});

<Button tone="primary" render={<a href="/docs" />}>
  Docs
</Button>;

<Button tone="primary" render={props => <a {...props} href="/docs" />}>
  Docs
</Button>;
```

When `render` receives a React element:

- `className` is concatenated
- `style` is shallow-merged
- event handlers are composed
- refs are merged

When `render` receives a function, its input is intentionally broad: you always get a resolved `className`, `children`, `ref`, and the normalized host prop bag.

## Shared Configuration

Use `defineConfig()` to share merge and validation behavior:

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

## Utilities

The package root also exports:

- `mergeProps()`
- `mergeRefs()`
- `useMergeRefs()`
- `hasOwnProperty()`

## Docs

- [API reference](./docs/api-reference.md)
- [Recipes and components guide](./docs/recipes-and-components.md)
- [Migration guide](./docs/migration-from-react-tailwind-variants.md)
- [Benchmarks guide](./docs/benchmarks.md)
- [Legacy v1 reference](./docs/react-tailwind-variants-v1.md)
