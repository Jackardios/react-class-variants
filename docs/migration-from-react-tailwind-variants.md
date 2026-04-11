# Migration from `react-tailwind-variants` v1

`react-tailwind-variants` v1 exposed a Tailwind-first API built around:

- `styled()`
- `variants()`
- `variantProps()`
- implicit `tailwind-merge`

`react-class-variants` v2 alpha is recipe-first and React-oriented. The public API is exported from `react-class-variants`:

- `recipe()`
- `styled()`
- `defineConfig()`
- `mergeProps()`
- `mergeRefs()`
- `useMergeRefs()`
- `hasOwnProperty()`

## Conceptual changes

### 1. One canonical primitive

In v1 you had separate helpers for class strings, components, and prop splitting.

In v2 you define a `recipe()` once and reuse it:

- call it directly for a root class string
- call slotted recipes to get slot render functions
- use `.resolve()` when you need to split component-like props
- pass it into `styled()` to create a component

There is no public `.extend()`, `.slots()`, `.defaults`, or `.values` instance API in the current v2 alpha.

### 2. Merge is explicit

Tailwind conflict resolution is no longer implicit.

```ts
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

export const { recipe, styled } = defineConfig({
  merge: twMerge,
});
```

### 3. Multipart is built into `recipe()`

Use:

- `base` for root-only recipes
- `slots` for slotted recipes

Slotted recipes do not need a `root` slot. Slotted `styled()` components require `compose`, because the library does not pick a canonical slot for you.

### 4. Behavioral state is just variants

There is no separate `state` section.

```ts
variants: {
  loading: {
    true: 'opacity-50',
  },
}
```

Boolean variants accept `boolean` values. If only `"true"` is defined, `false` applies no class.

## Old to new mapping

| v1                        | v2 alpha                           |
| ------------------------- | ---------------------------------- |
| `variants(config)`        | `recipe(config)`                   |
| `styled(tag, config)`     | `styled(tag, recipe(config))`      |
| `variantProps(config)`    | `recipe.resolve()` or `styled()`   |
| implicit `tailwind-merge` | `defineConfig({ merge: twMerge })` |

## Root-only class resolver

Before:

```ts
import { variants } from 'react-tailwind-variants';

export const button = variants({
  base: 'inline-flex items-center',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
  },
});
```

Now:

```ts
import { recipe } from 'react-class-variants';

export const button = recipe({
  base: 'inline-flex items-center',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
  },
});
```

## Component factory

Before:

```ts
import { styled } from 'react-tailwind-variants';

export const Button = styled('button', {
  base: 'inline-flex items-center',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
  },
});
```

Now:

```ts
import { recipe, styled } from 'react-class-variants';

const buttonRecipe = recipe({
  base: 'inline-flex items-center',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
  },
});

export const Button = styled('button', buttonRecipe);
```

## Slotted component

```tsx
import { recipe, styled } from 'react-class-variants';

const buttonRecipe = recipe({
  slots: {
    root: 'inline-flex items-center gap-2',
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
      },
    },
    loading: {
      true: {
        label: 'opacity-0',
      },
    },
  },
  defaultVariants: {
    loading: false,
  },
});

export const Button = styled('button', buttonRecipe, {
  compose: ({ Root, slots, variants }, { className, children, ...props }) => (
    <Root
      {...props}
      className={slots.root({ className })}
      disabled={variants.loading}
    >
      <span className={slots.icon()} />
      <span className={slots.label()}>{children}</span>
    </Root>
  ),
});
```

## Intrinsic prop collisions

Variant keys are variant-first. If you also need a native prop with the same name, use `nativeAliases`:

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
```

## What to expect

- required variants stay required
- defaulted variants become optional
- boolean `"true"` / `"false"` keys become `boolean`
- root recipe `className` is merged into the root class string
- slotted direct calls do not accept `className`
- slotted component `className` is routed by your `compose` function
- slotted variant and compound class values must be explicit slot maps
- `render` remains the polymorphism API, but requires `withRender: true`

## Related docs

- Historical v1 reference: [react-tailwind-variants-v1.md](./react-tailwind-variants-v1.md)
