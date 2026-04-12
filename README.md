# React Class Variants

[![npm version](https://img.shields.io/npm/v/react-class-variants.svg)](https://www.npmjs.com/package/react-class-variants)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-class-variants)](https://bundlephobia.com/package/react-class-variants)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`react-class-variants` is a recipe-first API for type-safe class composition in React components.

It provides:

- one adaptive `recipe()` primitive for root-only and slotted recipes
- one `styled()` builder for simple components and custom composition
- `defineRecipeConfig()` for reusable, typed config objects kept outside the recipe instance
- `defineConfig()` for shared merge behavior such as `tailwind-merge`
- strict variant inference for required, defaulted, and boolean variants
- opt-in render polymorphism through `withRender`

## Status

- Package name: `react-class-variants`
- Current release line: `2.0.0-alpha.x`
- Recommended install: `react-class-variants@alpha`
- Legacy v1 package name: `react-tailwind-variants`
- Runtime requirements: Node.js 20.19+ and React 19

The v2 alpha React-oriented public API is exported from the package root:

- `recipe()`
- `styled()`
- `defineRecipeConfig()`
- `defineConfig()`
- `mergeProps()`
- `mergeRefs()`
- `useMergeRefs()`
- `hasOwnProperty()`
- public recipe and React types such as `VariantProps`

The dedicated core subpath is also available when you want a narrower import surface:

- `react-class-variants/core` exports `recipe()`, a core-only `defineConfig()`,
  `defineRecipeConfig()`, core utilities, and recipe types without importing
  React runtime code

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

`Button` is fully typed:

```tsx
<Button tone="ghost" size="sm" type="button">
  Cancel
</Button>
```

## Custom Merge

Use `defineConfig()` to create a configured `recipe()` factory and matching `styled()` builder:

```tsx
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

export const { recipe, styled } = defineConfig({
  merge: twMerge,
});
```

The merge hook runs after class resolution.

For recipe-only modules that should not import React runtime code, use the core subpath:

```ts
import { recipe } from 'react-class-variants/core';
```

## Root Recipes

Root recipes use `base` and return a class string when called directly:

```ts
const inputRecipe = recipe({
  base: [
    'w-full rounded-md border transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
  ],
  variants: {
    variant: {
      outline: 'bg-white border-gray-300 focus:border-blue-500',
      filled: 'bg-gray-100 border-transparent focus:bg-white',
    },
    disabled: {
      true: 'opacity-50 cursor-not-allowed',
    },
  },
  compoundVariants: [
    {
      variant: ['outline', 'filled'],
      disabled: true,
      className: 'opacity-70',
    },
  ],
  defaultVariants: {
    variant: 'outline',
  },
});

inputRecipe({ variant: 'filled', className: 'text-black' });
```

Boolean variants are boolean-only: if a variant declares `"true"` or `"false"`,
do not mix those keys with named options such as `"idle"` or `"active"`. Model
named state as a separate variant instead.

Use `resolve()` when you want to pass a full component-like prop bag:

```ts
inputRecipe.resolve(
  {
    variant: 'filled',
    className: 'text-black',
    type: 'email',
    disabled: true,
    htmlSize: 20,
  },
  {
    forwardProps: ['disabled'],
    nativeAliases: { size: 'htmlSize' },
  }
);
```

`resolve()` strips variant props by default, then optionally re-adds the
effective variant selection through `forwardProps`. That means defaults and
boolean fallbacks are already applied in `resolvedProps` when you opt into
forwarding a variant key.

## Slotted Recipes

Slotted recipes use `slots`. Slot variant values and compound classes must be explicit slot maps.

```tsx
const buttonRecipe = recipe({
  slots: {
    root: 'relative inline-flex items-center justify-center rounded-md font-medium',
    label: 'transition-opacity',
    spinner: 'absolute hidden size-4',
  },
  variants: {
    tone: {
      primary: {
        root: 'bg-blue-600 text-white',
        spinner: 'text-blue-100',
      },
      ghost: {
        root: 'bg-transparent text-slate-900',
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
```

A direct slotted recipe call returns slot functions:

```ts
const slots = buttonRecipe({ tone: 'ghost' });

slots.root({ className: 'px-4' });
slots.spinner({ tone: 'primary' });
```

`SlotRecipe.resolve()` keeps an incoming component-level `className` as a normal
passthrough prop. It never assigns that `className` to a slot automatically;
your `compose` function decides whether it belongs on `slots.root(...)` or
somewhere else.

Slotted components require `compose`, because the recipe does not assume a canonical root slot:

```tsx
export const Button = styled('button', buttonRecipe, {
  withRender: true,
  forwardProps: ['loading'],
  compose: (
    { Root, variants, slots },
    { className, children, render, ref, ...resolvedProps }
  ) => (
    <Root
      {...resolvedProps}
      ref={ref}
      render={render}
      className={slots.root({ className })}
      aria-busy={variants.loading || undefined}
      disabled={variants.loading}
    >
      {variants.loading ? (
        <span aria-hidden="true" className={slots.spinner()} />
      ) : null}
      <span className={slots.label()}>{children}</span>
    </Root>
  ),
});
```

## Polymorphism

`render` is opt-in:

```tsx
const LinkButton = styled('button', buttonRecipe, {
  withRender: true,
});

<LinkButton render={<a href="/docs" />}>Docs</LinkButton>;
```

When `withRender` is `false`, the component does not expose a `render` prop.

## Intrinsic Prop Collisions

Variant keys are variant-first. If you need a native prop with the same name, use `nativeAliases`:

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

## Utilities

- `hasOwnProperty()` is a narrowed object property guard.
- `mergeProps()` merges DOM props and composes event handlers.
- `mergeRefs()` and `useMergeRefs()` compose multiple refs.

## Benchmarks

The repository keeps three complementary benchmark layers:

- `pnpm bench` runs the Vitest microbench suite in [`bench/vitest/`](./bench/vitest)
- `pnpm bench:diagnostics:competitors` runs the optional local cross-library
  diagnostics in [`bench/vitest/diagnostics/`](./bench/vitest/diagnostics)
- `pnpm bench:competitors` writes reproducible speed, retained-memory, and
  synthetic bundle-size reports to
  [`bench/competitors/reports/competitors.md`](./bench/competitors/reports/competitors.md) and
  [`bench/competitors/reports/competitors.json`](./bench/competitors/reports/competitors.json)
- `pnpm bench:overhead` measures package-specific bundle, runtime, retained
  memory, and synthetic TypeScript overhead into
  [`bench/overhead/reports/current.json`](./bench/overhead/reports/current.json)

All benchmark-related tooling now lives under [`bench/`](./bench): local
Vitest suites in `bench/vitest/`, optional local diagnostics in
`bench/vitest/diagnostics/`, competitor reporting in `bench/competitors/`, and
package-overhead measurement in `bench/overhead/`.

The competitor report compares `react-class-variants` against
`class-variance-authority`, `classname-variants`, and `tailwind-variants`
across root-only common-denominator scenarios. The primary creation metric uses
fresh unique complex configs so it reflects first-time compile cost; reused
config creation is reported separately as a diagnostic scenario. Bundle-size
comparisons use minified esbuild synthetic consumers and keep plain,
Tailwind-aware, and React/styled imports in separate tables. Runtime tables
include `RME` so near-parity ratios are read with stability metadata instead of
as hard claims. The package-overhead report keeps named bundle and TypeScript
profiles for root-only, slotted, Tailwind-aware, and `withRender` surfaces.

## Migration

- From legacy v1: [docs/migration-from-react-tailwind-variants.md](./docs/migration-from-react-tailwind-variants.md)
- Benchmark methodology: [docs/benchmarks.md](./docs/benchmarks.md)

## License

MIT
