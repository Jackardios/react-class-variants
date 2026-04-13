# React Class Variants

[![npm version](https://img.shields.io/npm/v/react-class-variants.svg)](https://www.npmjs.com/package/react-class-variants)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-class-variants)](https://bundlephobia.com/package/react-class-variants)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`react-class-variants` is a recipe-first, type-safe API for composing CSS classes in React components.

It is built around one adaptive `recipe()` primitive, one React `styled()` builder, strong TypeScript inference, and an explicit opt-in story for Tailwind class merging and render polymorphism.

> **Important**
>
> - The package was renamed from `react-tailwind-variants` to `react-class-variants`.
> - The current v2 line is `2.0.0-alpha.x`.
> - The recommended install command is `react-class-variants@alpha`.
> - The published v2 surface is ESM-only.
> - If you are migrating from v1, start with the [migration guide](https://github.com/Jackardios/react-class-variants/blob/next/docs/migration-from-react-tailwind-variants.md) and keep the [legacy v1 reference](https://github.com/Jackardios/react-class-variants/blob/next/docs/react-tailwind-variants-v1.md) nearby.

## Why

- One canonical styling primitive for root-only and slotted recipes.
- Strong inference for required, defaulted, and boolean variants.
- A clear split between direct class resolution, prop resolution, and React component creation.
- An explicit merge pipeline through `defineConfig({ merge })` instead of hidden Tailwind behavior.
- A React-free `core` subpath for recipe-only modules.
- Opt-in polymorphism through `render` instead of paying for it everywhere.

## Package Status

- Package name: `react-class-variants`
- Current release line: `2.0.0-alpha.x`
- Recommended install: `react-class-variants@alpha`
- Legacy package name: `react-tailwind-variants`
- Runtime requirements: Node.js `20.19+` and React `19`
- Module format: ESM-only

The package root is the canonical React-oriented surface:

- `recipe()`
- `styled()`
- `defineConfig()`
- `defineRecipeConfig()`
- `mergeProps()`
- `mergeRefs()`
- `useMergeRefs()`
- `hasOwnProperty()`
- public recipe and React types such as `VariantProps`

The dedicated `react-class-variants/core` subpath is available when you only need recipe creation and types without the React runtime helpers.

## Installation

```bash
pnpm add react-class-variants@alpha
```

Optional Tailwind conflict resolution:

```bash
pnpm add tailwind-merge
```

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

## Mental Model

| Need                                                         | Use                              |
| ------------------------------------------------------------ | -------------------------------- |
| Compute a root class string                                  | `recipe(input)`                  |
| Compute slot class strings                                   | `recipe(input).slotName()`       |
| Split variant props from a full prop bag                     | `recipe.resolve(input, options)` |
| Build an intrinsic React component                           | `styled(tag, recipe, options?)`  |
| Share `merge` / `validate` behavior across many recipes      | `defineConfig(options)`          |
| Keep a typed config object separate from the recipe instance | `defineRecipeConfig(config)`     |
| Avoid React runtime imports in recipe-only modules           | `react-class-variants/core`      |

Two core rules drive most of the API:

1. `recipe()` becomes a root recipe when you use `base`, and a slotted recipe when you use `slots`.
2. `styled()` only accepts intrinsic tags such as `'button'` or `'input'`. Custom structure is handled through `compose`, not by passing custom React components as the base.

## Root Recipes

Root recipes use `base` and resolve to one final class string.

```ts
import { recipe } from 'react-class-variants';

const inputRecipe = recipe({
  base: [
    'block w-full rounded-md border transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
  ],
  variants: {
    variant: {
      outline: 'bg-white border-slate-300 focus:border-blue-500',
      filled: 'bg-slate-100 border-transparent focus:bg-white',
    },
    size: {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 text-base',
    },
    disabled: {
      true: 'opacity-50 cursor-not-allowed',
    },
  },
  compoundVariants: [
    {
      variant: ['outline', 'filled'],
      disabled: true,
      className: 'pointer-events-none',
    },
  ],
  defaultVariants: {
    variant: 'outline',
    size: 'md',
  },
});

inputRecipe({
  variant: 'filled',
  size: 'sm',
  disabled: true,
  className: ['shadow-sm', 'ring-offset-2'],
});
```

Important rules:

- Variants without defaults are required.
- Variants with `defaultVariants` are optional.
- Boolean variants use `"true"` and `"false"` keys and accept `boolean` inputs.
- Boolean variants cannot be mixed with named options in the same variant.
- `compoundVariants` arrays mean logical OR.
- Root recipe direct calls accept declared variant props plus optional `className`.

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
    nativeAliases: { size: 'htmlSize' },
  }
);
```

`resolved` contains:

- `resolved.variants`: the effective variant selection after defaults and boolean fallbacks.
- `resolved.resolvedProps`: the remaining props bag with the final `className`.

`forwardProps` re-adds selected variant keys to `resolvedProps`. `nativeAliases` lets you expose an alternate external prop name when a variant key collides with an intrinsic prop such as `size`.

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

Slotted recipe rules:

- Slot-bearing variant values must be explicit slot maps.
- `base` and `slots` are mutually exclusive.
- `root` is optional. It is not treated as a canonical slot by the runtime.
- Direct slotted recipe calls do not accept `className`.
- Slot render functions accept local variant overrides plus optional `className`.
- Local slot overrides only affect that slot render call.

## `styled()`

`styled()` is the React adapter for intrinsic tags.

Simple root component:

```tsx
const Input = styled('input', inputRecipe);
```

Advanced root composition:

```tsx
const Badge = styled('span', recipe({ base: 'inline-flex rounded-full' }), {
  compose: ({ Root }, { children, className, ...props }) => (
    <Root {...props} className={className}>
      {children}
    </Root>
  ),
});
```

Slotted components require `compose` because the library does not decide where a component-level `className` belongs:

```tsx
const Button = styled('button', buttonRecipe, {
  withRender: true,
  compose: (
    { Root, slots, variants },
    { className, children, render, ...props }
  ) => (
    <Root
      {...props}
      render={render}
      className={slots.root({ className })}
      aria-busy={variants.loading || undefined}
      disabled={variants.loading}
    >
      <span aria-hidden="true" className={slots.icon()} />
      <span className={slots.label()}>{children}</span>
    </Root>
  ),
});
```

## Polymorphism and Prop Collisions

Render polymorphism is opt-in through `withRender: true`.

```tsx
const LinkButton = styled('button', buttonRecipe, {
  withRender: true,
  compose: ({ Root, slots }, { className, children, render, ...props }) => (
    <Root {...props} render={render} className={slots.root({ className })}>
      <span className={slots.label()}>{children}</span>
    </Root>
  ),
});

<LinkButton render={<a href="/docs" />}>Docs</LinkButton>;
```

When a variant key collides with a native prop, variant keys stay variant-first on the public surface. Use `nativeAliases` to expose the native prop under another name:

```tsx
const Input = styled(
  'input',
  recipe({
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
      },
    },
  }),
  {
    nativeAliases: {
      size: 'htmlSize',
    },
  }
);

<Input size="sm" htmlSize={20} />;
```

## Merge and Validation

Use `defineConfig()` when you want one configured factory for many recipes.

```tsx
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

export const { recipe, styled } = defineConfig({
  merge: twMerge,
});
```

Notes:

- `merge` runs after class resolution.
- For slotted recipes, the merge hook runs on each slot render result.
- The default export behavior is effectively `validate: 'dev'`.
- `validate: 'always'` keeps strict validation and deep-freezes configs.
- `validate: 'never'` disables validation and freezing.
- Mutating a config after recipe creation is unsupported in all modes.

## Utilities and Types

Runtime helpers exported from the package root:

- `mergeProps()` merges props with special handling for `className`, `style`, and event handlers.
- `mergeRefs()` and `useMergeRefs()` compose multiple refs.
- `hasOwnProperty()` is a narrowed own-property guard.

Common type exports:

- `VariantProps<TRecipe>`
- `ResolvedVariantProps<TRecipe>`
- `SlotNames<TRecipe>`
- `RecipeConfigOf<TRecipe>`
- `RecipeInput<TRecipe>`
- `RecipeResolved<TRecipe>`
- `RootComponentOptions`, `SlotComponentOptions`, `RenderProp`

The full surface is documented in [docs/api-reference.md](https://github.com/Jackardios/react-class-variants/blob/next/docs/api-reference.md).

## Documentation Map

- [API reference](https://github.com/Jackardios/react-class-variants/blob/next/docs/api-reference.md)
- [Recipes and components guide](https://github.com/Jackardios/react-class-variants/blob/next/docs/recipes-and-components.md)
- [Migration from `react-tailwind-variants` v1](https://github.com/Jackardios/react-class-variants/blob/next/docs/migration-from-react-tailwind-variants.md)
- [Legacy v1 reference](https://github.com/Jackardios/react-class-variants/blob/next/docs/react-tailwind-variants-v1.md)
- [Benchmark methodology](https://github.com/Jackardios/react-class-variants/blob/next/docs/benchmarks.md)
- [Contributing](https://github.com/Jackardios/react-class-variants/blob/next/CONTRIBUTING.md)
- [Release process](https://github.com/Jackardios/react-class-variants/blob/next/docs/release-process.md)

## Benchmarks

This repository keeps separate benchmark layers for local iteration, reproducible competitor reports, and package-overhead tracking. Start with [docs/benchmarks.md](https://github.com/Jackardios/react-class-variants/blob/next/docs/benchmarks.md) for methodology and report layout.

## License

MIT
