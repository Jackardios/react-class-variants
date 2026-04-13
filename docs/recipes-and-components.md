# Recipes and Components Guide

This guide shows how to use the current v2 alpha API in real code, from simple class strings to fully composed slotted components.

## Choose the Right Primitive

| You need to...                           | Use                              |
| ---------------------------------------- | -------------------------------- |
| compute one class string                 | `recipe(input)`                  |
| compute many slot-specific class strings | `recipe(input).slotName()`       |
| split variant props from a full prop bag | `recipe.resolve(input, options)` |
| build an intrinsic React component       | `styled(tag, recipe, options?)`  |
| share merge and validation behavior      | `defineConfig(options)`          |
| keep recipe modules React-free           | `react-class-variants/core`      |

## 1. Start with a Root Recipe

Root recipes are the simplest entry point and the best mental model for the whole package.

```ts
import { recipe } from 'react-class-variants/core';

export const badgeRecipe = recipe({
  base: 'inline-flex items-center rounded-full font-medium',
  variants: {
    tone: {
      info: 'bg-sky-100 text-sky-900',
      success: 'bg-emerald-100 text-emerald-900',
      danger: 'bg-rose-100 text-rose-900',
    },
    size: {
      sm: 'h-6 px-2 text-xs',
      md: 'h-7 px-2.5 text-sm',
    },
    outlined: {
      true: 'ring-1 ring-inset',
    },
  },
  defaultVariants: {
    size: 'md',
    outlined: false,
  },
  compoundVariants: [
    {
      tone: ['info', 'success'],
      outlined: true,
      className: 'ring-current/20',
    },
  ],
});
```

Usage:

```ts
badgeRecipe({ tone: 'info' });
badgeRecipe({ tone: 'danger', outlined: true, className: 'uppercase' });
```

What this gives you:

- `tone` is required because it has no default
- `size` is optional because it has a default
- `outlined` is optional because it is boolean
- direct calls return one final class string

## 2. Turn It into an Intrinsic Component

When you want a regular DOM component, pass the recipe into `styled()`.

```tsx
import { styled } from 'react-class-variants';
import { badgeRecipe } from './badge.recipe';

export const Badge = styled('span', badgeRecipe);
```

Usage:

```tsx
<Badge tone="success">Live</Badge>
<Badge tone="danger" outlined className="uppercase">
  Error
</Badge>
```

This simple path is the default for root recipes:

- no `compose` required
- the resolved `className` is applied automatically
- variant props stay fully typed

## 3. Use `resolve()` Inside Your Own Wrapper

The current alpha API intentionally does not support `styled(CustomComponent, recipe)`.

When you want a custom wrapper, use `resolve()` manually:

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
      true: 'border-red-500',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type InputFieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'size'> &
  VariantProps<typeof inputRecipe> & {
    label: string;
    htmlSize?: number;
  };

export function InputField({ label, htmlSize, ...props }: InputFieldProps) {
  const resolved = inputRecipe.resolve(
    {
      ...props,
      htmlSize,
    },
    {
      forwardProps: ['invalid'],
      nativeAliases: {
        size: 'htmlSize',
      },
    }
  );

  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium">{label}</span>
      <input {...resolved.resolvedProps} />
    </label>
  );
}
```

This pattern is the escape hatch for headless wrappers, design-system wrappers, and situations where you want total control over markup.

## 4. Build a Slotted Component

Slotted recipes are for components where different parts need different classes.

```tsx
import { recipe, styled } from 'react-class-variants';

const buttonRecipe = recipe({
  slots: {
    root: 'relative inline-flex items-center justify-center gap-2 rounded-md font-medium',
    spinner: 'absolute hidden size-4',
    label: 'transition-opacity',
  },
  variants: {
    tone: {
      primary: {
        root: 'bg-blue-600 text-white',
        spinner: 'text-blue-100',
      },
      ghost: {
        root: 'bg-transparent text-slate-900',
        spinner: 'text-slate-500',
      },
    },
    size: {
      sm: {
        root: 'h-9 px-3 text-sm',
      },
      md: {
        root: 'h-10 px-4 text-base',
      },
    },
    loading: {
      true: {
        spinner: 'inline-block animate-spin',
        label: 'opacity-0',
      },
    },
  },
  defaultVariants: {
    tone: 'primary',
    size: 'md',
    loading: false,
  },
});

export const Button = styled('button', buttonRecipe, {
  withRender: true,
  forwardProps: ['loading'],
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
      {variants.loading ? (
        <span aria-hidden="true" className={slots.spinner()} />
      ) : null}
      <span className={slots.label()}>{children}</span>
    </Root>
  ),
});
```

Key ideas:

- `compose` is required for slot recipes
- external `className` stays at the component level until you route it
- `slots.root({ className })` is just one possible routing choice
- slot render functions may be called many times with different local overrides

## 5. Slot Recipes Do Not Need `root`

You can model multipart structure without a canonical root slot.

```tsx
const fieldRecipe = recipe({
  slots: {
    label: 'block text-sm',
    input: 'block rounded-md border',
  },
  variants: {
    invalid: {
      true: {
        label: 'text-red-700',
        input: 'border-red-500',
      },
    },
  },
});

const Field = styled('label', fieldRecipe, {
  compose: ({ Root, slots }, { className, children, ...props }) => (
    <Root {...props} className={slots.label({ className })}>
      <input aria-label="field" className={slots.input()} />
      {children}
    </Root>
  ),
});
```

This is the intended pattern when your actual wrapper tag is only one part of the whole recipe and you do not want the recipe runtime to pretend there is a special `root`.

## 6. Local Slot Overrides

Slot renderers can override variants locally without changing the parent selection.

```ts
const slots = buttonRecipe({ tone: 'primary', loading: true });

slots.spinner();
slots.spinner({ tone: 'ghost' });
slots.spinner({ tone: 'ghost', className: 'text-red-500' });
```

This is useful when:

- one slot needs a slightly different tone
- one slot needs an extra class override
- you want to reuse the same recipe selection but render parts differently

## 7. Opt In to Polymorphism with `render`

`render` is available only when `withRender: true`.

Element form:

```tsx
<Button tone="primary" render={<a href="/docs" />}>
  Docs
</Button>
```

Function form:

```tsx
<Button tone="primary" render={props => <a {...props} href="/docs" />}>
  Docs
</Button>
```

Use `render` when:

- the default tag is usually correct
- a few call sites need a different element
- you want to preserve the rest of the component contract

Do not reach for it when you need a fully separate component abstraction. In that case, prefer a wrapper component plus `resolve()`.

## 8. Keep Recipe Modules React-Free with `/core`

A good default structure for design systems is:

```ts
// button.recipe.ts
import { recipe } from 'react-class-variants/core';

export const buttonRecipe = recipe({
  base: 'inline-flex items-center justify-center rounded-md font-medium',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
  },
});
```

```tsx
// button.tsx
import { styled } from 'react-class-variants';
import { buttonRecipe } from './button.recipe';

export const Button = styled('button', buttonRecipe);
```

Why this split is useful:

- recipe modules stay usable outside React
- root-only recipe modules do not need React helper imports
- component modules stay thin

## 9. Tailwind Merge and Validation Modes

Tailwind merge is explicit:

```ts
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

export const { recipe, styled } = defineConfig({
  merge: twMerge,
});
```

Validation is also explicit when you need it:

```ts
const strict = defineConfig({ validate: 'always' });
const productionLike = defineConfig({ validate: 'never' });
```

Use cases:

- `validate: 'always'` when debugging config mistakes or test invariants
- `validate: 'never'` when you want the lean path during local benchmarking or production-like checks

## 10. Things That Do Not Exist in v2

If you are coming from `react-tailwind-variants` v1, these absences are intentional:

- no `variants()` helper
- no `variantProps()` helper
- no `styled(CustomComponent, ...)`
- no `asChild`
- no implicit `tailwind-merge`
- no public recipe-instance `.extend()`, `.defaults`, `.values`, or `.config`
- no automatic routing of component-level `className` into a slot

What to do instead:

- use `recipe()` for class resolution
- use `recipe.resolve()` for wrapper components
- use `styled(tag, recipe, options)` for intrinsic React components
- use `render` for opt-in polymorphism
- use `defineConfig({ merge: twMerge })` for Tailwind conflict handling

## See Also

- [API reference](./api-reference.md)
- [Migration from v1](./migration-from-react-tailwind-variants.md)
- [Legacy v1 reference](./react-tailwind-variants-v1.md)
