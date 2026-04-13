# Recipes and Components Guide

This guide shows the current v2 alpha API in real code.

## Choose the Right Primitive

| You need to...                           | Use                              |
| ---------------------------------------- | -------------------------------- |
| compute one class string                 | `recipe(input)`                  |
| compute many slot-specific class strings | `recipe(input).slotName()`       |
| split variant props from a full prop bag | `recipe.resolve(input, options)` |
| build a React component from a recipe    | `styled(base, recipe, options?)` |
| share merge and validation behavior      | `defineConfig(options)`          |
| keep recipe modules React-free           | `react-class-variants/core`      |

## 1. Start with a Root Recipe

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
});
```

Usage:

```ts
badgeRecipe({ tone: 'info' });
badgeRecipe({ tone: 'danger', outlined: true, className: 'uppercase' });
```

## 2. Turn It into a Component

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

For root recipes this is the default fast path:

- no `view` required
- the resolved `className` is applied automatically
- variant props stay fully typed

## 3. Use `resolve()` in a Wrapper

When you want total control over markup or prop routing, use `resolve()` manually.

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
    htmlSize?: number;
    label: string;
  };

export function InputField({ label, htmlSize, ...props }: InputFieldProps) {
  const resolved = inputRecipe.resolve(
    {
      ...props,
      htmlSize,
    },
    {
      forwardProps: ['invalid'],
      propAliases: {
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

## 4. Build a Slotted Component

Use slot recipes when different parts of the component need different classes.

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

function ButtonView({ host, classes, variants }) {
  const { spinner, label } = classes;

  return host.render({
    'aria-busy': variants.loading || undefined,
    disabled: variants.loading,
    children: (
      <>
        {variants.loading ? (
          <span aria-hidden="true" className={spinner()} />
        ) : null}
        <span className={label()}>{host.children}</span>
      </>
    ),
  });
}

export const Button = styled('button', buttonRecipe, {
  withRender: true,
  forwardProps: ['loading'],
  view: ButtonView,
});
```

Key ideas:

- `view` is required for slot recipes
- `classes` exists only for slotted recipes
- `classes` may be safely destructured inside `view`
- external `className` is routed automatically to the host slot
- slot render functions can still be called many times with local overrides

## 5. Slot Recipes Do Not Need `root`

If the actual wrapper corresponds to a different slot, provide `hostSlot`.

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

function FieldView({ host, classes }) {
  return host.render({
    children: (
      <>
        <input aria-label="field" className={classes.input()} />
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

## 6. `view` Is a Real React Component

`view` is not a callback DSL. It is a normal React component surface:

- hooks are allowed
- prefer a named component reference such as `view: ButtonView` when you plan to use hooks so hook linting stays happy
- `host.render()` is the canonical way to render the base element or component
- `host.props` exposes normalized forwarded props and aliased base props
- `host.className` is already the resolved host class string
- `host.render()` keeps `host.children` unless you override `children`

## 7. Custom Component Bases

You can pass custom React components as the base:

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
- custom bases should accept and forward `className`, `children`, and `ref` when those behaviors matter
- use custom bases when you already own the host component contract

## 8. Local Slot Overrides

Slot renderers can override variants locally without changing the parent selection.

```ts
const slots = buttonRecipe({ tone: 'primary', loading: true });

slots.spinner();
slots.spinner({ tone: 'ghost' });
slots.label({ className: 'uppercase' });
```

Local override rules:

- they are merged on top of the parent selection
- `undefined` means "do not override"
- they affect only that one slot render call
- compounds are recomputed against the merged selection
- slot render functions are plain functions and may be safely destructured

When you are inside `view`, `host.props` follows the resolved shape:

- `propAliases` change the public prop name, but `host.props` uses the resolved base prop key
- `forwardProps` re-add selected variant keys to `host.props` with their resolved values

## 9. `render`

`render` remains opt-in through `withRender: true` and only exists for intrinsic bases.

```tsx
const LinkButton = styled('button', badgeRecipe, {
  withRender: true,
});

<LinkButton tone="info" render={<a href="/docs" />}>
  Docs
</LinkButton>;
```

## Related Docs

- [API reference](./api-reference.md)
- [Migration guide](./migration-from-react-tailwind-variants.md)
