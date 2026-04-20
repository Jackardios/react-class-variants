# React Class Variants

[![npm version](https://img.shields.io/npm/v/react-class-variants.svg)](https://www.npmjs.com/package/react-class-variants)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-class-variants)](https://bundlephobia.com/package/react-class-variants)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`react-class-variants` is a recipe-first, type-safe API for composing CSS classes in React components.

This documentation describes the current `react-class-variants` v2.x surface.
If you are looking for the legacy `react-tailwind-variants` v1.x docs, start
with the [legacy v1 docs entrypoint](./docs/react-tailwind-variants-v1.md).

The current v2 alpha surface is built around:

- one adaptive `recipe()` primitive
- one React builder, `styled()`
- explicit view-consumed component props through `defineViewProps()`
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

| Need                                       | Use                              |
| ------------------------------------------ | -------------------------------- |
| Compute one root class string              | `recipe(input)`                  |
| Compute slot class strings                 | `recipe(input).slotName()`       |
| Split variant props from a full prop bag   | `recipe.resolve(input, options)` |
| Build a React component from a recipe      | `styled(base, recipe, options?)` |
| Declare component props consumed by `view` | `defineViewProps<T>(...keys)`    |
| Share merge or validate behavior           | `defineConfig(options)`          |
| Keep typed config objects around           | `defineRecipeConfig(config)`     |
| Avoid React runtime imports                | `react-class-variants/core`      |

Four rules explain most of the package:

1. `recipe()` becomes a root recipe when you use `base`, and a slotted recipe when you use `slots`.
2. `resolve()` is the full-prop-bag API. Direct recipe calls stay variant-oriented.
3. `styled()` accepts intrinsic bases and custom React component bases.
4. Slotted recipes require `view`, and `render` is opt-in through `withRender: true` for intrinsic bases only.

## Quick Start

```tsx
import { recipe, styled } from 'react-class-variants';

const buttonRecipe = recipe({
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

## Keeping Config Objects Explicit

Use `defineRecipeConfig()` when you want the config itself to stay available as a typed source of truth, for example to power Storybook controls, docs, or test fixtures from the same declared variants:

```ts
import { defineRecipeConfig, recipe } from 'react-class-variants';

export const badgeConfig = defineRecipeConfig({
  base: 'inline-flex items-center rounded-full font-medium',
  variants: {
    tone: {
      info: 'bg-sky-100 text-sky-800',
      success: 'bg-emerald-100 text-emerald-800',
      danger: 'bg-red-100 text-red-800',
    },
    size: {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    },
  },
  defaultVariants: {
    tone: 'info',
    size: 'md',
  },
});

export const badgeRecipe = recipe(badgeConfig);

export const badgeToneOptions = Object.keys(badgeConfig.variants.tone);
```

`defineRecipeConfig()` is a zero-cost typed helper. Reach for it when you keep a config object in a variable and want `defaultVariants` completions plus exact key/value checks. In v2, recipe instances do not expose a runtime `.config` property, so this is the intended way to keep config data around.

## Tailwind CSS IntelliSense in VS Code

If you use the Tailwind CSS IntelliSense extension, register the v2 recipe
helpers in `tailwindCSS.classFunctions` so completions, hovers, and linting
work inside `recipe(...)` and `defineRecipeConfig(...)` calls:

```json
{
  "editor.quickSuggestions": {
    "strings": "on"
  },
  "tailwindCSS.classFunctions": ["recipe", "defineRecipeConfig"]
}
```

This is the setting that covers class strings in `base`, `slots`, variant
branches, and `compoundVariants[].className` inside JavaScript and TypeScript
config objects.

If you rename a configured factory, add that alias too:

```ts
const { recipe: uiRecipe } = defineConfig();
```

```json
{
  "tailwindCSS.classFunctions": ["recipe", "defineRecipeConfig", "uiRecipe"]
}
```

Tailwind CSS IntelliSense matches function names, so wrapper or alias names
must be listed explicitly. This still depends on the extension detecting your
Tailwind project normally.

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
  return host.render({
    children: (
      <>
        <span aria-hidden="true" className={classes.icon()} />
        <span className={classes.label()}>{host.children}</span>
      </>
    ),
  });
}

const Button = styled('button', buttonRecipe, {
  withRender: true,
  view: ButtonView,
});
```

Usage:

```tsx
<Button tone="ghost" className="w-full">
  Cancel
</Button>

<Button
  tone="primary"
  slotClassNames={{
    icon: 'text-red-500',
    label: 'uppercase',
  }}
>
  Save
</Button>

<Button tone="primary" render={<a href="/docs" />}>
  Docs
</Button>
```

External non-host slot overrides use `slotClassNames`:

```ts
const slots = buttonRecipe({
  tone: 'primary',
  slotClassNames: {
    icon: 'text-red-500',
  },
});

const resolved = buttonRecipe.resolve({
  tone: 'primary',
  className: 'w-full',
  slotClassNames: {
    label: 'uppercase',
  },
  id: 'save',
});
```

Key points:

- `view` is required for slotted recipes
- `view` is a normal React component, so hooks and context work inside it
- prefer a named component such as `ButtonView` when you use hooks
- use `defineViewProps()` when a `view` needs component-level props such as `icon`, `startIcon`, `endIcon`, or `shortcut`; those props stay on `host.props` and are stripped before the rendered host receives its props
- use `classes.slotName()` for the most direct slot lookup in `view`
- `classes` is still an enumerable slot render map and may be safely destructured when that reads better
- top-level `slotClassNames` applies to matching slots, while top-level `className` still routes only to the host slot
- `slotClassNames` keys should match declared slot names
- `slotClassNames` is consumed before props are forwarded, while local slot-function `className` still wins for that one slot call
- external component `className` is routed automatically to the host slot
- if the recipe has no `root` slot, provide `hostSlot` with one of the declared slot names
- call `host.render(...)` directly as a method
- do not destructure `render` from `host`
- this is intentional: keeping `host.render` method-shaped avoids allocating one extra function per `view` render

Inline `view` functions are still fine for trivial cases. A named component is
easier for hook linting, React DevTools, and stack traces once the `view`
starts using hooks.

## `resolve()` and Wrappers

Use `recipe.resolve()` when you need class resolution plus a full prop bag:

- wrapper components
- headless abstractions
- host prop aliasing such as `propAliases: { size: 'htmlSize' }`
- explicit forwarding of resolved variant values with `forwardProps`

Example:

```tsx
import type { ComponentPropsWithoutRef } from 'react';
import { recipe, type VariantProps } from 'react-class-variants';

const inputRecipe = recipe({
  base: 'block w-full rounded-md border',
  variants: {
    size: {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 text-base',
    },
    invalid: {
      true: 'border-red-500 ring-1 ring-red-500',
    },
  },
  defaultVariants: {
    size: 'md',
    invalid: false,
  },
});

type InputProps = Omit<ComponentPropsWithoutRef<'input'>, 'size'> &
  VariantProps<typeof inputRecipe> & {
    htmlSize?: number;
  };

export function Input(props: InputProps) {
  const resolved = inputRecipe.resolve(props, {
    propAliases: {
      size: 'htmlSize',
    },
  });

  return (
    <input
      {...resolved.resolvedProps}
      aria-invalid={resolved.variants.invalid || undefined}
    />
  );
}
```

Usage:

```tsx
<Input size="sm" htmlSize={20} invalid type="email" />
```

What `resolve()` gives you here:

- `resolved.resolvedProps` is the host-ready prop bag, including the merged `className`
- `propAliases` lets the public API accept `htmlSize` while `resolvedProps` receives the native `size` prop
- `resolved.variants` gives you the effective variant selection after defaults and boolean fallbacks
- for slot recipes, `resolve()` returns `slots` plus `resolvedProps` instead of one root `className`
- for slot recipes, top-level `slotClassNames` applies to matching slots and is consumed before props are forwarded

Alias names must not collide with existing host props, reserved React public props, or declared variant keys.

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
  validate?: 'never' | 'always';
};
```

Default root and core imports are lean and process-less safe. Use
`defineConfig({ validate: 'always' })` when you want checked runtime behavior
for a shared factory.

## Utilities

Package root also exports a few low-level helpers for wrappers and polymorphic
components:

```ts
import {
  hasOwnProperty,
  mergeProps,
  mergeRefs,
  useMergeRefs,
} from 'react-class-variants';
```

- `hasOwnProperty(object, key)` is a typed own-property guard and is also available from `react-class-variants/core`
- `mergeProps(base, overrides)` concatenates `className`, shallow-merges `style`, composes React event handlers with override-first ordering, and replaces other props with the override value
- `mergeRefs(...refs)` creates a merged ref callback for non-hook contexts such as `cloneElement()` or conditional branches
- `useMergeRefs(...refs)` is the memoized hook form for React components

## Primary APIs

Most users will work with these package-root APIs from `react-class-variants`:

- `recipe()`
- `styled()`
- `defineConfig()`
- `defineRecipeConfig()`
- `defineViewProps()`
- public core and React types

Package root also exports `mergeProps`, `mergeRefs`, `useMergeRefs`, and
`hasOwnProperty` for lower-level integration work.

For recipe-only modules, the primary `react-class-variants/core` APIs are:

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
- [Legacy v1 docs entrypoint](./docs/react-tailwind-variants-v1.md)
- [Contributing](./CONTRIBUTING.md)
- [Release process](./docs/release-process.md)
