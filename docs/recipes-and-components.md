# Recipes and Components Guide

This guide is the best next read after the repository `README`. It focuses on the main usage patterns in real code.

If you want exact option shapes, exported types, or runtime rules, use the [API reference](./api-reference.md).

## When to Use What

| You need to...                           | Use                                             |
| ---------------------------------------- | ----------------------------------------------- |
| compute one class string                 | `recipe(input)`                                 |
| compute many slot-specific class strings | `recipe(input).slotName()`                      |
| split variant props from a full prop bag | `recipe.resolve(input, options)`                |
| build a React component from a recipe    | `defineConfig().styled(base, recipe, options?)` |
| share merge and validation behavior      | `defineConfig(options)`                         |
| keep recipe modules React-free           | `react-class-variants/core`                     |

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

### When multiple variants interact

Use `compoundVariants` when the final class depends on a combination of variant values.

```ts
const badgeRecipe = recipe({
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
      false: null,
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
      className: 'ring-current/30',
    },
    {
      tone: 'danger',
      size: 'sm',
      className: 'tracking-wide uppercase',
    },
  ],
});
```

Usage:

```ts
badgeRecipe({ tone: 'info', outlined: true });
badgeRecipe({ tone: 'danger', size: 'sm' });
```

Arrays in compound selectors mean “match any of these values”.

Explicitly `undefined` selector values are treated as absent keys — consistent
with `defaultVariants` and input props. cva instead matches such a selector
only while the variant resolves to `undefined` (never, once a default exists).
`undefined` entries in selector arrays are filtered out (an array that ends up
empty never matches). A selector key that is not a declared variant throws with
`validate: 'always'` and makes the whole compound inert in the lean runtime —
it never applies.

## 2. Turn It into a Component

```tsx
import { defineConfig } from 'react-class-variants';
import { badgeRecipe } from './badge.recipe';

const { styled } = defineConfig();

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

### When a variant key collides with a host prop

Use `propAliases` when the public variant name would otherwise collide with a host prop such as `size` on `<input>`.

```tsx
import { defineConfig, recipe } from 'react-class-variants';

const { styled } = defineConfig();

const inputRecipe = recipe({
  base: 'block rounded-md border',
  variants: {
    size: {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const Input = styled('input', inputRecipe, {
  propAliases: {
    size: 'htmlSize',
  },
});
```

Usage:

```tsx
<Input size="sm" htmlSize={20} />
```

This keeps `size` as the variant prop while still exposing the native input prop under a safe public name.

Alias names must stay distinct from existing host props, reserved React public props, and declared variant keys.

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
      true: 'border-red-500 ring-1 ring-red-500',
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
      propAliases: {
        size: 'htmlSize',
      },
    }
  );

  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium">{label}</span>
      <input
        {...resolved.resolvedProps}
        aria-invalid={resolved.variants.invalid || undefined}
      />
    </label>
  );
}
```

## 4. Build a Slotted Component

Use slot recipes when different parts of the component need different classes.

```tsx
import { defineConfig, recipe } from 'react-class-variants';

const { styled } = defineConfig();

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
  view: ButtonView,
});
```

`view` is a normal React component surface. Hooks and context are allowed
inside it. When the `view` uses hooks, prefer a named component reference such
as `view: ButtonView` so hook linting, React DevTools, and stack traces keep a
clear component name.

Key ideas:

- `view` is required for slot recipes
- `classes` exists only for slotted recipes
- `classes` may be safely destructured inside `view`
- top-level `slotClassNames` applies to matching slots
- `slotClassNames` keys should match declared slot names
- external `className` is routed automatically to the host slot
- slot render functions can still be called many times with local overrides

### External slot overrides

Use top-level `slotClassNames` when callers need to target non-host slots from
outside:

```tsx
<Button
  tone="primary"
  slotClassNames={{
    spinner: 'text-red-500',
    label: 'uppercase',
  }}
>
  Save
</Button>
```

The same shape works on direct slot recipe calls and `resolve()`:

```ts
const slots = buttonRecipe({
  tone: 'primary',
  slotClassNames: {
    spinner: 'text-red-500',
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

Rules:

- top-level `slotClassNames` is consumed before props are forwarded
- local slot-function `className` still wins for that one slot render call
- raw slot `resolve()` still leaves top-level `className` in `resolvedProps`; only `styled(..., { view })` chooses the host slot automatically

## 5. Slot Recipes Do Not Need `root`

If the actual wrapper corresponds to a different slot, provide `hostSlot` with
one of the declared slot names.

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
- context works the same way as in any other React component
- prefer a named component reference such as `view: ButtonView` when you use hooks so hook linting, React DevTools, and stack traces keep a clear component name
- `host.render()` is the canonical way to render the base element or component
- `host.props` exposes normalized forwarded props and aliased base props
- `host.className` is already the resolved host class string
- `host.render()` keeps `host.children` unless you override `children`

Important note:

- call `host.render(...)` directly as a method
- do not destructure `render` from `host`
- this is intentional: keeping `host.render` method-shaped avoids allocating one extra function per `view` render

### Reading `host.props` and extending host classes

Use `host.props` when your `view` needs a pass-through prop, use `host.render({ className })` when the wrapper needs extra host-level classes, and use top-level `slotClassNames` when callers need to target non-host slots from outside.

```tsx
import { defineConfig, recipe } from 'react-class-variants';

const { styled } = defineConfig();

const actionRecipe = recipe({
  base: 'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
    emphasized: {
      true: 'font-semibold',
      false: null,
    },
  },
  defaultVariants: {
    tone: 'primary',
    emphasized: false,
  },
});

function ActionView({ host, variants }) {
  return host.render({
    className: 'justify-between gap-2',
    children: (
      <>
        <span className="truncate">{host.children}</span>
        {host.props['data-shortcut'] ? (
          <kbd className="text-xs opacity-70">
            {String(host.props['data-shortcut'])}
          </kbd>
        ) : null}
      </>
    ),
    title: variants.emphasized ? 'Important action' : host.props.title,
  });
}

const ActionButton = styled('button', actionRecipe, {
  view: ActionView,
});
```

Usage:

```tsx
<ActionButton tone="ghost" emphasized data-shortcut="Ctrl+K">
  Search
</ActionButton>
```

When the prop belongs to the component surface but should not reach the rendered
host, declare it with `defineViewProps()`. This is especially useful for
intrinsic hosts, where leaking extra props to the DOM would be invalid:

```tsx
import { defineConfig, defineViewProps, recipe } from 'react-class-variants';

const { styled } = defineConfig();

const buttonRecipe = recipe({
  slots: {
    root: 'inline-flex items-center gap-2',
    icon: 'size-4',
    label: 'truncate',
  },
});

const Button = styled('button', buttonRecipe, {
  viewProps: defineViewProps<{
    icon?: (props: { className?: string }) => JSX.Element | null;
    shortcut?: string;
  }>('icon', 'shortcut'),
  view({ host, classes }) {
    const { icon: Icon, shortcut } = host.props;

    return host.render({
      'data-shortcut': shortcut,
      children: (
        <>
          {Icon ? <Icon className={classes.icon()} /> : null}
          <span className={classes.label()}>{host.children}</span>
        </>
      ),
    });
  },
});
```

`viewProps` are added to the public component props, stay readable through
`host.props`, and are consumed before props are forwarded to the rendered host.
This is a React-surface helper, so it is available from `react-class-variants`,
not from `react-class-variants/core`. It also works with custom bases when
`view` should consume props before the base receives its forwarded prop bag. It
composes normally with `propAliases`, `forwardProps`, and `withRender`.

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

Usage:

```tsx
<LinkBadge to="/docs" tone="info">
  Docs
</LinkBadge>
```

### When the base also needs the variant value

Use `forwardProps` when the base component needs a resolved variant value in its own props.

```tsx
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { defineConfig, recipe } from 'react-class-variants';

const { styled } = defineConfig();

const NavLinkBase = forwardRef<
  HTMLAnchorElement,
  { active?: boolean } & ComponentPropsWithoutRef<'a'>
>(function NavLinkBase({ active, className, ...props }, ref) {
  return (
    <a
      {...props}
      ref={ref}
      className={className}
      data-active={active || undefined}
    />
  );
});

const navLinkRecipe = recipe({
  base: 'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium',
  variants: {
    active: {
      true: 'bg-sky-100 text-sky-900',
      false: 'text-slate-600 hover:text-slate-900',
    },
  },
  defaultVariants: {
    active: false,
  },
});

const NavLink = styled(NavLinkBase, navLinkRecipe, {
  forwardProps: ['active'],
});
```

Usage:

```tsx
<NavLink href="/docs" active>
  Docs
</NavLink>
```

Without `forwardProps`, the recipe would still style the component, but `NavLinkBase` would not receive `active`.

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
- `viewProps` add component-level props to `host.props` and are consumed before `host.render()` forwards props

## 9. `render`

`render` remains opt-in through `withRender: true` and only exists for intrinsic bases.

```tsx
import { defineConfig, recipe } from 'react-class-variants';

const { styled } = defineConfig();

const linkRecipe = recipe({
  base: 'inline-flex items-center rounded-md font-medium',
  variants: {
    tone: {
      info: 'bg-sky-100 text-sky-900',
      danger: 'bg-rose-100 text-rose-900',
    },
  },
});

const LinkButton = styled('button', linkRecipe, {
  withRender: true,
});

<LinkButton tone="info" render={<a href="/docs" />}>
  Docs
</LinkButton>;
```

Function form:

```tsx
<LinkButton
  tone="danger"
  render={props => <a {...props} href="/docs/api-reference" />}
>
  API
</LinkButton>
```

Use the function form when you want a spread-safe prop bag for cross-element rendering instead of cloning a fixed element instance. The callback receives the resolved `className`, `children`, `ref`, generic HTML attributes, and any variants listed in `forwardProps`, but it does not promise exact intrinsic resolved props such as `type` or alias-resolved native keys.

## 10. Share Merge and Validation Rules

Use `defineConfig()` when you want one factory to enforce the same merge and validation behavior across many recipes.

```ts
import { defineConfig } from 'react-class-variants/core';
import { twMerge } from 'tailwind-merge';

const { recipe } = defineConfig({
  merge: twMerge,
  validate: 'always',
});

export const badgeRecipe = recipe({
  base: 'inline-flex items-center rounded-full',
  variants: {
    tone: {
      info: 'bg-sky-100 text-sky-900',
      danger: 'bg-rose-100 text-rose-900',
    },
  },
});
```

This is useful when:

- your recipe modules live in `react-class-variants/core`
- you want Tailwind conflict resolution everywhere
- you want strict validation in tests or shared design-system packages

## Related Docs

- [API reference](./api-reference.md)
- [Migration guide](./migration-from-react-tailwind-variants.md)
