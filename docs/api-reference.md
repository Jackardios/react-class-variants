# API Reference

This document describes the current `react-class-variants` v2 alpha public surface as implemented in the repository today.

## Package Surfaces

### Package root

```ts
import {
  recipe,
  styled,
  defineConfig,
  defineRecipeConfig,
  mergeProps,
  mergeRefs,
  useMergeRefs,
  hasOwnProperty,
  type VariantProps,
} from 'react-class-variants';
```

The package root is the canonical React-oriented surface.

### Core subpath

```ts
import {
  recipe,
  defineConfig,
  defineRecipeConfig,
  hasOwnProperty,
  type VariantProps,
} from 'react-class-variants/core';
```

Use `react-class-variants/core` when you only need recipes, config helpers, utilities, and types without the React runtime surface.

### Packaging notes

- The published package is ESM-only.
- The package root exports the React helpers.
- The `core` subpath omits `styled()`, `mergeProps()`, `mergeRefs()`, and `useMergeRefs()`.

## Runtime Exports

### Package root exports

- `recipe()`
- `styled()`
- `defineConfig()`
- `defineRecipeConfig()`
- `mergeProps()`
- `mergeRefs()`
- `useMergeRefs()`
- `hasOwnProperty()`

### Core subpath exports

- `recipe()`
- `defineConfig()`
- `defineRecipeConfig()`
- `hasOwnProperty()`

## `recipe(config)`

`recipe()` is the canonical styling primitive. The config shape determines which runtime you get back.

- Use `base` for a root-only recipe.
- Use `slots` for a slotted recipe.
- Do not define both.

### Shared value model

#### `ClassNameValue`

```ts
type ClassNameValue = string | null | readonly string[];
```

Supported leaf values:

- string
- `null`
- readonly arrays of strings

Not supported:

- nested arrays
- objects
- numbers
- booleans

#### Boolean variants

A variant is treated as boolean when its options use `"true"` and/or `"false"` keys.

Rules:

- public inputs become `boolean`
- `true` applies the `"true"` branch
- `false` applies the `"false"` branch when present
- if only `"true"` exists, `false` contributes no class
- if only `"false"` exists, `false` contributes the `"false"` class
- boolean options cannot be mixed with named options in the same variant

### Root recipe config

```ts
const buttonRecipe = recipe({
  base: 'inline-flex items-center',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  compoundVariants: [
    {
      tone: ['primary', 'ghost'],
      disabled: true,
      className: 'pointer-events-none',
    },
  ],
  defaultVariants: {
    tone: 'primary',
    size: 'md',
  },
});
```

Rules:

- `base` is the root class source.
- `slots` must not be present.
- `compoundVariants[].className` is a `ClassNameValue`.
- selector arrays inside `compoundVariants` mean logical OR.
- `className` passed to a direct root recipe call is appended after recipe resolution.

### Slot recipe config

```ts
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
    size: {
      sm: {
        input: 'h-9 px-3 text-sm',
      },
      md: {
        input: 'h-10 px-4 text-base',
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});
```

Rules:

- `slots` switches the recipe into slotted mode.
- `base` must not be present.
- slot-bearing variant values must be explicit slot maps
- `compoundVariants[].className` must also be a slot map
- `root` is optional
- the runtime does not treat any slot as canonical automatically

### Variant inference

`VariantProps<TRecipe>` follows three rules:

- variants without defaults are required
- variants with `defaultVariants` are optional
- boolean variants are optional

`ResolvedVariantProps<TRecipe>` represents the effective selection after defaults and boolean fallbacks have been applied.

## Direct Recipe Calls

### Root recipe call

```ts
const className = buttonRecipe({
  tone: 'ghost',
  size: 'sm',
  className: ['shadow-sm', 'ring-offset-2'],
});
```

Root call behavior:

- accepts declared variant props plus optional `className`
- returns one final class string
- in validation modes, rejects unknown non-variant props

### Slot recipe call

```ts
const slots = fieldRecipe({ invalid: true });

slots.label();
slots.input({ className: 'w-full' });
```

Slot call behavior:

- accepts declared variant props only
- returns slot render functions
- does not accept direct `className`
- slot render functions accept partial local variant overrides plus optional `className`

Slot render function contract:

```ts
type SlotRenderFunction<TRecipe> = (
  input?: Partial<VariantProps<TRecipe>> & {
    className?: ClassNameValue;
  }
) => string;
```

Local slot override rules:

- they are merged on top of the parent selection
- `undefined` means "do not override"
- they affect only that one slot render call
- compounds are recomputed against the merged selection
- they do not mutate the parent recipe call result
- slot render functions are plain functions and may be safely destructured

## `resolve()`

`resolve()` accepts a full prop bag and returns both resolved variant state and the remaining props bag.

### Root recipe `resolve()`

```ts
const result = buttonRecipe.resolve(
  {
    tone: 'primary',
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

Return shape:

```ts
type RootResolveResult<TRecipe> = {
  variants: ResolvedVariantProps<TRecipe>;
  resolvedProps: Record<string, unknown> & {
    className: string;
  };
};
```

Notes:

- variant keys are stripped from `resolvedProps` by default
- the final root class string is written to `resolvedProps.className`
- `variants` always contains the effective selection

### Slot recipe `resolve()`

```ts
const result = fieldRecipe.resolve(
  {
    invalid: true,
    className: 'font-medium',
    htmlFor: 'email',
  },
  {
    forwardProps: ['invalid'],
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

Notes:

- slot recipes do not compute a canonical root `className`
- if `className` was present in the input, it stays in `resolvedProps`
- `resolve()` never auto-assigns a component-level `className` to a slot
- the caller decides whether to route that class name to `slots.root(...)`, `slots.label(...)`, or nowhere

### `resolve()` options

```ts
type ResolveOptions = {
  forwardProps?: readonly string[];
  nativeAliases?: Record<string, string>;
};
```

#### `forwardProps`

Use `forwardProps` when you want selected variant keys to remain in `resolvedProps`.

Rules:

- each entry must refer to a declared variant key
- forwarded values reflect the effective resolved selection
- forwarded values include applied defaults and boolean fallbacks
- forwarded values are added after non-variant props and after `nativeAliases`

#### `nativeAliases`

`nativeAliases` maps:

- key: the final native prop name
- value: the alternate public prop name

Example:

```ts
nativeAliases: {
  size: 'htmlSize',
}
```

This means:

- the public component surface accepts `htmlSize`
- `resolvedProps` receives `size`

Rules:

- use it for intrinsic collisions such as `size`
- variant keys stay variant-first on the public surface
- alias targets and alias names must not conflict with reserved React public props
- a `nativeAliases` target must not conflict with `forwardProps`

### Resolution order

`resolve()` follows this mental model:

1. Read the full input props bag.
2. Extract declared variant props by variant key.
3. Ignore `undefined` variant values so defaults still apply.
4. Apply `defaultVariants`.
5. Materialize the effective variant selection.
6. Resolve the root class string or slot render functions.
7. Start `resolvedProps` from the non-variant input props.
8. Apply `nativeAliases`.
9. Re-add forwarded variant props.
10. For root recipes, write the final root `className`.
11. For slot recipes, leave component-level `className` unchanged.

## `defineConfig(options?)`

`defineConfig()` creates configured factories.

Package root:

```ts
const { recipe, styled } = defineConfig(options);
```

Core subpath:

```ts
const { recipe } = defineConfig(options);
```

Supported options:

```ts
type SystemOptions = {
  merge?: (className: string) => string;
  validate?: 'never' | 'dev' | 'always';
};
```

### `merge`

- runs after class resolution
- applies to root recipe results
- applies to each slot render result in slotted recipes
- is a factory concern, not a per-recipe option

Typical Tailwind setup:

```ts
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

export const { recipe, styled } = defineConfig({
  merge: twMerge,
});
```

### `validate`

Supported modes:

- `'dev'`: strict validation in non-production environments, lean runtime in production
- `'always'`: strict validation in all environments and deep-freezes configs
- `'never'`: no validation, no freezing, lean runtime in all environments

Practical guidance:

- use the default behavior unless you have a strong reason to change it
- use `'always'` for debugging or invariant-heavy tests
- use `'never'` when you intentionally want the production-like path during local testing

Config mutation is unsupported in every mode. The only difference is how aggressively the library tries to catch it.

## `defineRecipeConfig(config)`

`defineRecipeConfig()` is a typed identity helper.

```ts
const buttonConfig = defineRecipeConfig({
  base: 'inline-flex',
  variants: {
    tone: {
      primary: 'text-blue-600',
    },
  },
});
```

Use it when you want to:

- keep the author config next to the recipe
- export the config object separately
- derive `RecipeConfigOf<typeof recipe>` from a stable config shape

Runtime behavior:

- it returns the original object reference unchanged
- it does not attach metadata
- recipe instances do not expose `.config`

## `styled(tag, recipe, options?)`

`styled()` builds React components from intrinsic tags and recipes.

### Supported base tags

`tag` must be an intrinsic JSX element such as:

- `'button'`
- `'input'`
- `'label'`
- `'a'`

The current v2 alpha API does not support `styled(CustomComponent, ...)`.

### Root recipe, simple path

```tsx
const Button = styled('button', buttonRecipe);
```

Behavior:

- `compose` is optional for root recipes
- without `compose`, the component renders the intrinsic tag directly
- the resolved root `className` is applied automatically
- `forwardProps` and `nativeAliases` still work

### Root recipe, custom compose path

```tsx
const Badge = styled('span', buttonRecipe, {
  compose: ({ Root, variants }, { className, children, ...props }) => (
    <Root {...props} className={className} data-tone={variants.tone}>
      {children}
    </Root>
  ),
});
```

Root compose notes:

- `className` in the compose input is already the final resolved root class string
- `variants` contains the effective resolved selection
- use this path when you want custom structure or extra derived props

### Slot recipe, composed path

```tsx
const Field = styled('label', fieldRecipe, {
  compose: ({ Root, slots }, { className, children, ...props }) => (
    <Root {...props} className={slots.label({ className })}>
      <input className={slots.input()} />
      {children}
    </Root>
  ),
});
```

Slot compose rules:

- `compose` is required
- the compose input `className` is the external component-level class override
- you decide where to route that class name
- the library never assumes a canonical slot
- slotted components may be built even when the recipe has no `root` slot

### Options

`styled()` options are different for root and slot recipes, but they share the same core fields:

- `displayName?: string`
- `withRender?: boolean`
- `forwardProps?: readonly string[]`
- `nativeAliases?: Record<string, string>`
- `compose?: ...`

#### `displayName`

Overrides the generated React component display name. The default is `Styled(tag)`.

#### `withRender`

Enables the `render` prop.

When `withRender` is `false`:

- the public component props do not include `render`
- the compose input does not include `render`
- the `Root` helper does not expose `render`

When `withRender` is `true`, `render` accepts:

- a React element, for example `<a href="/docs" />`
- a function, for example `props => <a {...props} href="/docs" />`

#### `forwardProps` and `nativeAliases`

These behave the same way as `recipe.resolve()` because `styled()` uses the same prop-routing model internally.

#### `compose`

Root compose receives:

```ts
type RootComposeContext<Tag, TRecipe> = {
  Root: (props: RootHelperProps<Tag>) => ReactNode;
  variants: ResolvedVariantProps<TRecipe>;
};
```

```ts
type RootComposeInput<Tag> = {
  className: string;
  children?: ReactNode;
  ref?: Ref<unknown>;
} & Record<string, unknown>;
```

Slot compose receives:

```ts
type SlotComposeContext<Tag, TRecipe> = {
  Root: (props: RootHelperProps<Tag>) => ReactNode;
  variants: ResolvedVariantProps<TRecipe>;
  slots: {
    [Slot in SlotNames<TRecipe>]: SlotRenderFunction<TRecipe>;
  };
};
```

```ts
type SlotComposeInput<Tag> = {
  className?: ClassNameValue;
  children?: ReactNode;
  ref?: Ref<unknown>;
} & Record<string, unknown>;
```

### `Root` helper

`Root` is a render/ref helper passed to `compose()`.

Responsibilities:

- render the intrinsic tag
- forward props
- merge refs
- support `render` when `withRender` is enabled

Non-responsibilities:

- it does not resolve slot classes for you
- it does not decide where component-level `className` belongs in a slot recipe

### `render` semantics

When `render` receives a React element:

- the component's resolved props are merged with the render element's props
- `className` is concatenated
- `style` is shallow-merged
- both event handlers run, with the render element handler running first
- refs are merged

When `render` receives a function:

- the function is called with the resolved props bag
- it should return the element you want to render

If `render` is used without `withRender: true`, the component throws in validation modes.

## Utilities

### `mergeProps(base, overrides)`

Special cases:

- `className` is concatenated
- `style` is shallow-merged
- event handlers are composed
- other override props replace base props

Event handler order:

- override handler runs first
- base handler runs second

### `mergeRefs(...refs)`

Creates one merged ref callback without using hooks.

Typical use cases:

- cloning elements
- composing forwarded refs with local refs
- non-hook helper utilities

### `useMergeRefs(...refs)`

Hook version of `mergeRefs()` that memoizes the merged ref.

### `hasOwnProperty(object, prop)`

Type-narrowed own-property guard backed by `Object.hasOwn` when available.

## Public Type Exports

### Core and recipe types

- `AnyRecipe`
- `AnyRootRecipe`
- `AnySlotRecipe`
- `Recipe`
- `RootRecipe`
- `SlotRecipe`
- `RecipeFactory`
- `RecipeConfig`
- `RootRecipeConfig`
- `SlotRecipeConfig`
- `RecipeConfigOf`
- `RecipeInput`
- `RecipeResolved`
- `RootRecipeInput`
- `SlotRecipeInput`
- `RootResolveResult`
- `SlotResolveResult`
- `ResolveOptions`
- `ClassNameValue`
- `ClassValue`
- `SlotClassNameMap`
- `RootCompoundVariant`
- `SlotCompoundVariant`
- `SlotRenderInput`
- `SlotRenderFunction`
- `SlotNames`
- `VariantProps`
- `ResolvedVariantProps`
- `SystemOptions`
- `ValidateMode`

### React-specific types

- `AnyIntrinsicElement`
- `NativeAliases`
- `RenderFunctionProps`
- `RenderProp`
- `StyledComponentProps`
- `RootComponentOptions`
- `SlotComponentOptions`
- `RootCompose`
- `SlotCompose`
- `RootComposeContext`
- `SlotComposeContext`
- `RootComposeInput`
- `SlotComposeInput`
- `RootHelperProps`

Most consumers only need:

- `VariantProps<TRecipe>`
- `ResolvedVariantProps<TRecipe>`
- `SlotNames<TRecipe>`
- `RenderProp`

## Development Errors and Unsupported Patterns

Common development-time errors:

| Error                                                                   | Cause                                                                         | Fix                                                                    |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `unknown recipe prop "type"`                                            | direct recipe calls only accept declared variant props, plus root `className` | use `resolve()` when you need arbitrary props                          |
| `className cannot be passed directly to a slotted recipe call`          | slot recipes route className at the slot-function level                       | call a slot renderer with `className`, or use `resolve()` / `styled()` |
| `slotted recipes require a compose callback`                            | slot recipes have no canonical slot target                                    | pass `compose` to `styled()`                                           |
| `native alias target "className" conflicts with a reserved public prop` | aliasing would shadow a reserved React prop                                   | choose a different alias                                               |
| `forwardProps key "x" is not declared in variants`                      | `forwardProps` references a non-existent variant                              | only forward declared variant keys                                     |
| `variant "state" cannot mix boolean options`                            | `"true"` / `"false"` were mixed with named options                            | split boolean state into its own variant                               |

Intentionally unsupported in the current alpha API:

- `class` as an alias for `className`
- `styled(CustomComponent, recipe)`
- automatic slot targeting for external `className`
- plain string values inside slotted variant branches
- `.extend()`, `.defaults`, `.values`, `.slots()`, or runtime `.config` on recipe instances
- `variants()`, `variantProps()`, or other legacy v1 entrypoints
- CommonJS consumer support

Behavioral state should be modeled as normal variants instead of a separate `state` namespace.
