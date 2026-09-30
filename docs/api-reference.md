# API Reference

This document covers the primary user-facing v2 alpha APIs and public helpers:
`recipe()`, `recipe.resolve()`, `defineConfig().styled`, `defineConfig()`,
`defineRecipeConfig()`, `defineViewProps()`, `view`, `render`, and the
exported utilities.

Use this page as a reference, not as a tutorial. For guided examples and recommended patterns, start with the [recipes and components guide](./recipes-and-components.md).

## Primary Package Root APIs

```ts
import {
  defineConfig,
  defineRecipeConfig,
  defineViewProps,
  recipe,
} from 'react-class-variants';

const { styled } = defineConfig();
```

For recipe-only modules, the primary `react-class-variants/core` APIs covered
here are:

- `recipe()`
- `defineConfig()` (returns `{ recipe }`)
- `defineRecipeConfig()`
- `variantNames()` and `variantOptions()`
- `hasOwnProperty()`
- core recipe types

## `recipe(config)`

`recipe()` is the canonical styling primitive.

Use `base` for root recipes:

```ts
const badgeRecipe = recipe({
  base: 'inline-flex rounded-full',
  variants: {
    tone: {
      info: 'bg-sky-100',
      danger: 'bg-rose-100',
    },
  },
});
```

Root compound variants use a flat selector object plus one final `className`:

```ts
const badgeRecipe = recipe({
  base: 'inline-flex rounded-full',
  variants: {
    tone: {
      info: 'bg-sky-100',
      danger: 'bg-rose-100',
    },
    size: {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
    },
  },
  compoundVariants: [
    {
      tone: ['info', 'danger'],
      size: 'sm',
      className: 'tracking-wide',
    },
  ],
  defaultVariants: {
    size: 'md',
  },
});
```

Compound selector semantics:

- an explicitly `undefined` selector value is treated as if the key were absent, in both runtimes (cva instead matches such a selector only while the variant resolves to `undefined` — never, once a default exists)
- `undefined` entries inside array selectors are filtered out; an array that ends up empty never matches
- a selector key that is not a declared variant throws at recipe creation with `validate: 'always'`; the lean runtime drops that whole compound so it never applies (matching cva/tailwind-variants semantics)

Use `slots` for slotted recipes:

```ts
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
        icon: 'text-slate-500',
      },
    },
  },
  defaultVariants: {
    tone: 'primary',
  },
});
```

Slot compound variants use the same selectors, but `className` becomes a slot map:

```ts
const fieldRecipe = recipe({
  slots: {
    label: 'text-sm',
    input: 'rounded-md border',
  },
  variants: {
    invalid: {
      true: {
        label: 'text-red-700',
        input: 'border-red-500',
      },
    },
    size: {
      sm: {
        input: 'h-9 px-3 text-sm',
      },
      md: {
        input: 'h-10 px-4 text-base',
      },
    },
  },
  compoundVariants: [
    {
      invalid: true,
      size: 'sm',
      className: {
        input: 'pr-9',
        label: 'font-semibold',
      },
    },
  ],
});
```

### Root recipe direct call

```ts
badgeRecipe({ tone: 'info', className: 'px-2' });
```

Rules:

- root direct calls accept variant props plus optional `className`
- variants without defaults are required
- boolean variants use `"true"` and `"false"` keys and accept boolean inputs

### Slot recipe direct call

```ts
const slots = buttonRecipe({
  tone: 'primary',
  slotClassNames: {
    icon: 'text-red-500',
  },
});

slots.root();
slots.icon({ className: 'text-red-500' });
```

Rules:

- top-level slot recipe calls do not accept `className`
- top-level slot recipe calls accept optional `slotClassNames`
- `slotClassNames` keys should match declared slot names
- slot render functions accept local variant overrides plus optional `className`
- slot render functions are plain functions and may be safely destructured

## `recipe.resolve(input, options?)`

Use `resolve()` when you need class resolution and a full prop bag.

The input is typed like the props of a component built from the recipe:
variant props take the recipe's options, `className` (and `slotClassNames` on
slotted recipes) takes class values, and any other prop passes through.

### Root recipe `resolve()`

```ts
const result = badgeRecipe.resolve(
  {
    tone: 'info',
    type: 'button',
    className: 'w-full',
  },
  {
    forwardProps: ['tone'],
  }
);
```

Return shape:

```ts
type RootResolveResult<TRecipe> = {
  variants: ResolvedVariantProps<TRecipe>;
  resolvedProps: Record<string, unknown> & {
    className: string;
  };
};
```

### Slot recipe `resolve()`

```ts
const result = buttonRecipe.resolve(
  {
    tone: 'primary',
    className: 'external',
    slotClassNames: {
      icon: 'text-red-500',
    },
    id: 'save',
  },
  {
    forwardProps: ['tone'],
  }
);
```

Return shape:

```ts
type SlotResolveResult<TRecipe> = {
  variants: ResolvedVariantProps<TRecipe>;
  slots: {
    [Slot in SlotNames<TRecipe>]: SlotRenderFunction<TRecipe>;
  };
  resolvedProps: Record<string, unknown>;
};
```

For slot recipes:

- `resolve()` does not choose a canonical slot for component-level `className`
- if `className` was present in the input, it stays in `resolvedProps`
- if `slotClassNames` was present in the input, it is consumed and applied to the matching slots

### `ResolveOptions`

```ts
type ResolveOptions = {
  forwardProps?: readonly string[];
  propAliases?: Record<string, string>;
};
```

#### `forwardProps`

- each entry must be a declared variant key
- forwarded values reflect the effective resolved selection
- forwarded values include defaults and boolean fallbacks

Example:

```tsx
const NavLink = styled(NavLinkBase, navLinkRecipe, {
  forwardProps: ['active'],
});
```

Use this when the host base needs a resolved variant value in its own props.

#### `propAliases`

`propAliases` maps:

- key: the resolved base prop name
- value: the alternate public prop name

Example:

```ts
propAliases: {
  size: 'htmlSize',
}
```

This means:

- the public surface accepts `htmlSize`
- `resolvedProps` receives `size`
- `host.props` inside `view` also receives `size`
- variant props are not renamed; `propAliases` only solve collisions with base props
- alias names must not collide with existing base prop names, reserved React public props, or declared variant keys

Typical styled usage:

```tsx
const Input = styled('input', inputRecipe, {
  propAliases: {
    size: 'htmlSize',
  },
});
```

## `styled(base, recipe, options?)`

`styled()` is the only high-level React builder, and you get it from
`defineConfig()`.

### Supported bases

- intrinsic tags such as `'button'`, `'input'`, `'label'`, `'a'`
- custom React components

Rules:

- only intrinsic bases support `withRender`
- a custom base receives `render` as an ordinary prop, so components that own
  a `render` prop (Base UI, Ark UI) keep it
- slotted recipes require `view`
- root recipes may omit `view`
- custom bases should accept and forward `className`, `children`, and `ref` when those behaviors matter

### Return value and refs

`styled()` returns a plain React 19 function component (`FunctionComponent`),
not a `forwardRef` object. `ref` is a regular prop:

- it reaches the rendered host element, or the base component as its `ref` prop
- in a `view`, it stays out of `host.props` and is attached by `host.render()`,
  merged with any `ref` passed to `host.render()`
- `ComponentRef<typeof Component>` resolves to the base element or component instance

Component bases may take `ref` as a regular prop or still use `forwardRef`.

### Server Components

`recipe()` and `styled()` use no client-only hooks or state, so modules that
define recipes and styled components need no `'use client'` directive and
render in React Server Components.

A `view` receives `host` and, for slotted recipes, `classes`, and both hold
functions. React cannot pass functions from the server to a Client Component,
so a `view` must render where its styled component renders: keep a
`'use client'` view (one that uses hooks or event state) together with the
`styled()` call in a client module.

### Root recipe, simple path

```tsx
const Badge = styled('span', badgeRecipe);
```

Behavior:

- renders the base directly
- applies the resolved root class string automatically
- preserves base props and variant props on the component surface

### Root recipe, `view`

```tsx
import type { RootStyledViewProps } from 'react-class-variants';

function BadgeView({
  host,
  variants,
}: RootStyledViewProps<'span', typeof badgeRecipe>) {
  return host.render({
    'data-tone': variants.tone,
    children: host.children,
  });
}

const Badge = styled('span', badgeRecipe, {
  view: BadgeView,
});
```

An inline `view` infers its props. A named one is annotated with
`RootStyledViewProps<Base, typeof recipe>` or
`SlotStyledViewProps<Base, typeof recipe>`; pass `true` as a third type
argument when the component uses `withRender`.

### Slot recipe, `view`

```tsx
import type { SlotStyledViewProps } from 'react-class-variants';

function ButtonView({
  host,
  classes,
  variants,
}: SlotStyledViewProps<'button', typeof buttonRecipe>) {
  const { icon, label } = classes;

  return host.render({
    'data-tone': variants.tone,
    children: (
      <>
        <span className={icon()} />
        <span className={label()}>{host.children}</span>
      </>
    ),
  });
}

const Button = styled('button', buttonRecipe, {
  view: ButtonView,
});
```

`view` is rendered as a normal React component. Hooks and context are allowed
inside it. When you use hooks, prefer a named component reference such as
`view: ButtonView` so hook linting, React DevTools, and stack traces have a
stable component name.

If the slot recipe has no `root` slot:

```tsx
function FieldView({
  host,
  classes,
}: SlotStyledViewProps<'label', typeof fieldRecipe>) {
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

## Styled Options

### Shared fields

```ts
type StyledOptionsCommon = {
  displayName?: string;
  forwardProps?: readonly string[];
  propAliases?: Record<string, string>;
};
```

#### `displayName`

Overrides the generated React component name.

By default, `styled()` uses `Styled(<base>)`, for example
`Styled(button)` or `Styled(RouterLink)`. For component bases the name comes
from the base's `displayName`, then its function name; `forwardRef` and `memo`
wrappers are unwrapped. Anonymous components fall back to `Styled(Component)`.

Example:

```ts
const Badge = styled('span', badgeRecipe, {
  displayName: 'Badge',
});
```

Use this when you want a clearer component name in React DevTools, error
stacks, or profiling output.

### Root recipe options

```ts
type RootStyledOptions = StyledOptionsCommon & {
  withRender?: boolean;
  view?: ComponentType<RootStyledViewProps<...>>;
  viewProps?: ViewPropsDescriptor;
};
```

`viewProps` requires `view`.

### Slot recipe options

```ts
type SlotStyledOptions = StyledOptionsCommon & {
  withRender?: boolean;
  view: ComponentType<SlotStyledViewProps<...>>;
  viewProps?: ViewPropsDescriptor;
} & (
  'root' extends SlotNames<TRecipe>
    ? {
        hostSlot?: SlotNames<TRecipe>;
      }
    : {
        hostSlot: SlotNames<TRecipe>;
      }
);
```

If the recipe does not declare a `root` slot, `hostSlot` is required.
When you provide `hostSlot`, it must be one of the declared slot names.

## `defineViewProps<T>(keys)`

Use `defineViewProps()` when a `styled(..., { view })` component needs extra
public props that belong to the component surface, not to the rendered host.
This is most useful for intrinsic hosts, where leaking those props to the DOM
would be invalid.

Notes:

- list every key of `T` with `true`, as in `defineViewProps<{ icon?: Icon }>({ icon: true })`; a missing or unknown key is a type error, so the declared type and the consumed keys cannot drift apart
- `defineViewProps()` is a React-layer helper and is exported from the package root, not from `react-class-variants/core`
- it only affects `styled(..., { view })`; `recipe.resolve()` does not consume `viewProps`
- it also works with custom bases when `view` should consume props before the base receives its forwarded prop bag

Example:

```tsx
import type { ReactElement } from 'react';
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
    icon?: (props: { className?: string }) => ReactElement | null;
    shortcut?: string;
  }>({ icon: true, shortcut: true }),
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

Behavior:

- declared keys are added to the component's public prop surface
- declared keys are available in `host.props`
- declared keys are consumed before `host.render()` forwards props to the rendered host
- declared keys must not collide with host props, reserved React public props, variant keys, or public `propAliases`
- `viewProps` compose with `propAliases`, `forwardProps`, and `withRender`; `host.props` reflects the same normalized prop-routing rules before `view` renders

## `view` Model

`view` is a real React component surface, not a callback DSL.

Guidance:

- hooks and context are allowed inside `view`
- prefer a named component reference such as `view: ButtonView` when you use hooks so hook linting, React DevTools, and stack traces keep a clear component name
- inline `view` functions are still valid when you do not need hooks

### Root view props

```ts
type RootStyledViewProps<Base, TRecipe, WithRender> = {
  host: HostView<Base, TRecipe, WithRender>;
  variants: ResolvedVariantProps<TRecipe>;
};
```

### Slot view props

```ts
type SlotStyledViewProps<Base, TRecipe, WithRender> = {
  host: HostView<Base, TRecipe, WithRender>;
  variants: ResolvedVariantProps<TRecipe>;
  classes: {
    [Slot in SlotNames<TRecipe>]: SlotRenderFunction<TRecipe>;
  };
};
```

### `host`

```ts
type HostView<Base, TRecipe, WithRender> = {
  props: Record<string, unknown>;
  className: string;
  children?: ReactNode;
  render(overrides?: HostRenderOverrides<Base, WithRender>): ReactNode;
};
```

Behavior:

- `host.props` contains normalized pass-through props
- aliased base props appear here under their resolved base names, not their public alias names
- forwarded variant keys reappear here with their resolved values
- consumed `viewProps` also appear here and stay available to `view`
- `host.className` is already final for the rendered host
- `host.render()` renders the base with optional overrides
- `host.render({ className })` appends to the resolved host class string and
  runs `merge` over the result, so an added class wins a conflict the same
  way a `className` prop does
- `host.render()` reuses the current `host.children` unless you override `children`
- declared `viewProps` are stripped before props reach the rendered host or `render` target
- for slotted recipes, external component `className` is routed automatically to the host slot
- for slotted recipes, top-level `slotClassNames` applies to the matching slots before local slot-function `className` overrides

Important note:

- call `host.render(...)` directly as a method
- do not destructure `render` from `host`
- this is intentional: keeping `host.render` method-shaped avoids allocating one extra function per `view` render

Example:

```tsx
function ActionView({
  host,
}: SlotStyledViewProps<'button', typeof buttonRecipe>) {
  return host.render({
    className: 'justify-between gap-2',
    children: (
      <>
        <span>{host.children}</span>
        {host.props['data-shortcut'] ? (
          <kbd>{String(host.props['data-shortcut'])}</kbd>
        ) : null}
      </>
    ),
  });
}
```

For slotted views:

- `classes` is a readonly slot render map with enumerable object semantics
- `Object.keys(classes)`, `Object.entries(classes)`, and `{ ...classes }` all expose the declared slots in order
- `classes` may be safely destructured
- local slot overrides still recompute compounds against the merged local selection

## `render`

`render` is available only when `withRender: true` and the base is intrinsic.
A custom base receives `render` as an ordinary prop instead (see
[Supported bases](#supported-bases)).

```tsx
import { defineConfig, recipe } from 'react-class-variants';

const { styled } = defineConfig();

const linkRecipe = recipe({
  base: 'inline-flex items-center rounded-md font-medium',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
  },
});

const LinkButton = styled('button', linkRecipe, {
  withRender: true,
});

<LinkButton tone="primary" render={<a href="/docs" />}>
  Docs
</LinkButton>;
```

Function form:

```tsx
<LinkButton
  tone="ghost"
  render={props => <a {...props} href="/docs/api-reference" />}
>
  API
</LinkButton>
```

It accepts:

- a React element, for example `<a href="/docs" />`
- a function, for example `props => <a {...props} href="/docs" />`

When the render target is a React element:

- `className` is appended after the resolved class string, and `merge` runs
  over the result
- `style` is shallow-merged
- event handlers are composed
- refs are merged

When the render target is a function:

- its props are intentionally broad
- you always receive the resolved `className`, `children`, and `ref`
- you receive a spread-safe generic HTML attribute bag rather than exact intrinsic resolved props
- any variants listed in `forwardProps` are included on that bag

## `defineConfig(options?)`

```ts
const { recipe, styled } = defineConfig(options);
```

Core-only usage:

```ts
import { defineConfig } from 'react-class-variants/core';

const { recipe } = defineConfig({
  validate: 'always',
});
```

Supported options:

```ts
type SystemOptions = {
  cache?: boolean | { maxSize?: number };
  merge?: (className: string) => string;
  validate?: 'never' | 'always';
};
```

### `merge`

- runs after class resolution
- applies to root results
- applies to each slot render result

### `validate`

The option type is exported as `ValidateMode` (`'never' | 'always'`).

- `'always'`: strict validation everywhere
- `'never'`: lean runtime with no validation

Both modes throw on structural errors:

- recipe configs with both `base` and `slots`, a slotted recipe without a
  `slots` object, a variant key that is a reserved prop (`children`,
  `className`, `ref`, `render`, and `slotClassNames` on slotted recipes), a
  variant that mixes boolean and named options, and slotted variant values
  that are not slot className maps
- a variant key that shadows an `Object.prototype` member (`constructor`,
  `toString`, `valueOf`, ...): a prop bag without that prop would otherwise
  read the inherited member
- `styled()` given a value that is not a recipe, `withRender` on a
  non-intrinsic base, a slotted recipe or `viewProps` without `view`, or an
  undeclared or missing `hostSlot`

Strict mode adds these checks when a recipe is created, and then deep-freezes
the config, including the nested maps of a config that is already frozen:

- undeclared `defaultVariants` or `compoundVariants` keys, and values those
  variants do not declare
- invalid `className` values, and slot className maps that name undeclared
  slots

It checks prop routing options once per `styled()` component, and
`propAliases` / `forwardProps` again on every `resolve()` call that passes
them:

- aliases or targets that are reserved props or `__proto__`, aliases that are
  variant keys, aliases reused by two targets, and targets that are also
  listed in `forwardProps`
- `forwardProps` keys that are not declared variants
- `viewProps` keys that are reserved props, variant keys, or alias keys

On every call, strict mode also rejects:

- missing required variants and undeclared option values
- unknown props on direct recipe calls, and `className` on a direct slotted
  call
- invalid `className` values, and invalid or undeclared `slotClassNames` slots
- unknown slot override props and undeclared override values
- a `render` prop on an intrinsic-base component without `withRender`
  (`render={undefined}` is accepted)
- an alias whose target prop is also passed directly

Lean mode skips the strict checks and ignores input it cannot use: undeclared
values add no class, invalid `slotClassNames` and unsupported `render` props
are ignored, and aliases that strict mode would reject are dropped.

There is deliberately no environment-based mode such as "validate in
development": the choice is made explicitly per factory, so the published code
never branches on `process.env` and the default `recipe()` bundle does not
contain the validating runtime at all.

Example:

```ts
const strict = defineConfig({ validate: 'always' });
const lean = defineConfig({ validate: 'never' });
```

Package root and core are lean by default. Use `'always'` in strict test
fixtures or shared packages, and use `'never'` when you want to force the lean
path explicitly.

### `cache`

Memoizes resolved class names of **root recipes** so repeated identical inputs
skip variant resolution and the `merge` call entirely.

- enabled automatically when `merge` is set and the runtime is lean (the default,
  and `validate: 'never'`); has no effect without `merge`
- `cache: false` disables it; `cache: { maxSize }` bounds it (default `500`,
  FIFO eviction); `maxSize: Infinity` keeps every entry, and a `maxSize` below
  `1` disables the cache
- **slotted recipes are not cached**: a slot resolves into several short class
  strings, and `merge` (e.g. tailwind-merge) already keeps its own cache for
  those, so memoizing each slot result would cost more than it saves
- never engages in strict mode (`validate: 'always'`), so validation always runs
- assumes `merge` is a pure function of its input

```ts
const cached = defineConfig({ merge: twMerge }); // cache on by default
const larger = defineConfig({ merge: twMerge, cache: { maxSize: 2000 } });
const off = defineConfig({ merge: twMerge, cache: false });
```

## `defineRecipeConfig(config)`

`defineRecipeConfig()` is a typed identity helper:

```ts
const buttonConfig = defineRecipeConfig({
  base: 'inline-flex',
  variants: {
    tone: {
      primary: 'text-blue-600',
      ghost: 'text-slate-900',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
});
```

It returns the original config reference unchanged and preserves `defaultVariants` editor completions plus exact key/value checking when you keep a config object in a variable.

## `variantNames(source)` and `variantOptions(source, variantName)`

`variantNames()` returns declared variant keys from either a config object or a
compiled recipe:

```ts
const names = variantNames(buttonConfig); // ['tone', 'disabled']
```

`variantOptions()` returns the public values accepted for a single variant:

```ts
const tones = variantOptions(buttonConfig, 'tone'); // ['primary', 'ghost']
const disabled = variantOptions(buttonConfig, 'disabled'); // [true, false]
```

Named variants return string option keys. Boolean variants return boolean values
`[true, false]`, matching the values accepted by recipe calls.

- exported from both the package root and `react-class-variants/core`
- accepts values returned by `defineRecipeConfig()` or `recipe()`
- returns an empty array at runtime for an unknown variant key

## Utilities

### `hasOwnProperty(object, key)`

- typed own-property guard
- uses `Object.hasOwn` when available and falls back to `Object.prototype.hasOwnProperty.call(...)`
- exported from both the package root and `react-class-variants/core`

### `mergeProps(base, overrides)`

- exported from the package root
- concatenates `className`
- shallow-merges `style`
- composes React event handlers with override-first ordering
- replaces other props with the override value

Use this when a wrapper or polymorphic helper needs the same prop-merging
semantics as the render path.

### `mergeRefs(...refs)`

- exported from the package root
- merges multiple refs into one callback ref
- avoids wrapping when there is only one non-null ref
- propagates React 19 callback-ref cleanups: when an inner ref returns a cleanup, the merged ref returns a combined cleanup that runs it and null-resets the refs that returned none

Use this in non-hook code such as `cloneElement()` or conditional branches.

### `useMergeRefs(...refs)`

- exported from the package root
- memoized hook form of `mergeRefs(...)`, including cleanup propagation

Use this inside React components when you need one ref prop to update multiple
refs.

## React Type Exports

- `PropAliases`
- `ViewPropsDescriptor`
- `RenderFunctionProps`
- `RenderProp`
- `StyledComponent`: the type `styled()` returns, a React function component
- `StyledComponentProps`
- `HostRenderOverrides`
- `HostView`
- `RootStyledOptions`
- `SlotStyledOptions`
- `RootStyledViewProps`
- `SlotStyledViewProps`
- `StyledFn`

## Common Errors

| Error                                                                    | Cause                                                                          | Fix                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `unknown recipe prop "type"`                                             | direct recipe calls are variant-only APIs                                      | use `resolve()` when you need arbitrary props     |
| `className cannot be passed directly to a slotted recipe call`           | slot recipes route class overrides at the slot-function level                  | use a slot renderer or `resolve()`                |
| `slotted recipes require a view component`                               | a slotted recipe renders only through `view`                                   | pass `view` to `styled()`                         |
| `slotted recipes without a "root" slot require hostSlot`                 | the recipe has no default host slot                                            | provide `hostSlot` with a declared slot name      |
| `hostSlot "x" is not declared in recipe.slots`                           | `hostSlot` references an unknown slot                                          | use one of the declared slot names                |
| `invalid input.slotClassNames; slot "x" is not declared in recipe.slots` | `slotClassNames` targets an unknown slot                                       | only override declared slots                      |
| `variant key "slotClassNames" is reserved`                               | `slotClassNames` cannot also be a variant name                                 | rename the variant key                            |
| `prop alias target "className" conflicts with a reserved public prop`    | aliasing would shadow a reserved React prop                                    | choose a different alias                          |
| `forwardProps key "x" is not declared in variants`                       | `forwardProps` references a non-existent variant                               | only forward declared variant keys                |
| `compoundVariants key "x" is not declared in variants`                   | a compound selector references an unknown variant (`validate: 'always'`)       | fix the selector key                              |
| `variant key "x" shadows an Object.prototype member`                     | variant names like `toString` break plain-object lookups                       | rename the variant key                            |
| `styled() received a value without compiled recipe metadata`             | the second argument is not a recipe, or duplicate package copies are installed | pass a `recipe()` result; deduplicate the package |

## Related Docs

- [Recipes and components guide](./recipes-and-components.md)
- [Migration guide](./migration-from-react-tailwind-variants.md)
