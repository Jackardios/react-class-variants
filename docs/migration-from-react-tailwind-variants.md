# Migrating from `react-tailwind-variants` v1 to `react-class-variants` v2 alpha

This guide is for teams moving from the frozen v1 line of
`react-tailwind-variants` to the current v2 alpha surface of
`react-class-variants`.

It reflects the current public API and behavior in the `v1-maintenance` and
`next` branches. It does not describe older intermediate v2 alpha designs. If
you see examples that mention `compose`, `Root`, `nativeAliases`, or a tag-only
`styled()` API, treat them as obsolete.

If you are learning v2 from scratch, start with the [README](../README.md), the
[recipes and components guide](./recipes-and-components.md), and the
[API reference](./api-reference.md).

## Before You Start

- The package name changed from `react-tailwind-variants` to
  `react-class-variants`.
- The recommended install target is `react-class-variants@alpha`.
- v2 is ESM-only.
- v2 expects Node.js `20.19+` and React `19`.
- If you cannot move to those runtime requirements yet, stay on v1 for now.

## High-Level Mapping

| v1 export or pattern                 | v2 replacement                                                                           | Notes                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `react-tailwind-variants`            | `react-class-variants@alpha`                                                             | package rename and new runtime requirements             |
| `variants(config)`                   | `recipe(config)`                                                                         | use `react-class-variants/core` in recipe-only modules  |
| `styled(base, config)`               | `const { styled } = defineConfig(); const r = recipe(config); styled(base, r, options?)` | config definition and component creation are separate   |
| `variantProps(config)`               | `recipe.resolve(input, options?)`                                                        | returns structured output, not one merged prop object   |
| `extractVariantsConfig(Component)`   | keep the config explicitly with `defineRecipeConfig()`                                   | no runtime extraction helper in v2                      |
| `VariantPropsOf<typeof Component>`   | `VariantProps<typeof someRecipe>`                                                        | types are recipe-first and use the recipe instance      |
| `VariantsConfigOf<typeof Component>` | `RecipeConfigOf<typeof someRecipe>`                                                      | the recipe carries the config type, not the config data |
| `asChild`                            | `withRender: true` plus `render`, or a wrapper component                                 | intrinsic bases only                                    |
| `cx()`                               | your own `clsx` or `tailwind-merge` utility                                              | no v2 export                                            |
| `tw`                                 | plain strings or your own tagged template                                                | no v2 export                                            |
| automatic `tailwind-merge`           | `defineConfig({ merge: twMerge })`                                                       | merge is explicit in v2                                 |

## A Pragmatic First Step

If you want v2 to behave closer to v1 while you port code, start with a
configured factory:

```ts
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

export const { recipe, styled } = defineConfig({
  merge: twMerge,
  validate: 'never',
});
```

This does two useful things during migration:

- restores automatic Tailwind conflict resolution
- disables dev-time strict validation while you rename APIs and reshape inputs

After the migration is stable, move back to the default validation behavior or
to `validate: 'always'` if you want stricter checking everywhere.

## 1. Replace the Package and Imports

Before:

```ts
import { styled, variantProps, variants } from 'react-tailwind-variants';
```

After:

```ts
import { defineConfig, recipe } from 'react-class-variants';

const { styled } = defineConfig();
```

If you only need recipe creation in a non-React module:

```ts
import { recipe } from 'react-class-variants/core';
```

## 2. Replace `variants(config)` with `recipe(config)`

Most v1 `variants()` calls become root recipes.

Before:

```ts
import { variants } from 'react-tailwind-variants';

export const button = variants({
  base: 'inline-flex items-center rounded-md font-medium',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  defaultVariants: {
    tone: 'primary',
  },
});
```

After:

```ts
import { recipe } from 'react-class-variants/core';

export const buttonRecipe = recipe({
  base: 'inline-flex items-center rounded-md font-medium',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  defaultVariants: {
    tone: 'primary',
  },
});
```

What stays familiar:

- variants without defaults are still required
- boolean variants still use `"true"` and `"false"` keys and accept boolean
  props
- root recipe direct calls still accept an optional `className`

What changed:

- `recipe()` is now the canonical primitive, even when you later build a React
  component from it
- direct recipe calls are variant-only APIs, not arbitrary prop-bag APIs
- mixing boolean options with named options in the same variant is now invalid

## 3. Rewrite `compoundVariants`

This is one of the most important syntax changes.

In v1, each compound variant nested its selectors under `variants`:

```ts
compoundVariants: [
  {
    variants: {
      tone: ['primary', 'ghost'],
      size: 'sm',
    },
    className: 'tracking-wide',
  },
];
```

In v2, the selectors are flat and live next to `className`:

```ts
compoundVariants: [
  {
    tone: ['primary', 'ghost'],
    size: 'sm',
    className: 'tracking-wide',
  },
];
```

Rules:

- arrays in selectors still mean “match any of these values”
- root recipes still end with one `className`
- slotted recipes use the same flat selector shape, but `className` becomes a
  slot map

Slotted example:

```ts
compoundVariants: [
  {
    tone: 'primary',
    loading: true,
    className: {
      root: 'cursor-wait',
      spinner: 'animate-spin',
    },
  },
];
```

## 4. Replace `styled(base, config)` with `recipe(...)` plus `styled(base, recipe)`

Before:

```tsx
import { styled } from 'react-tailwind-variants';

export const Button = styled('button', {
  base: 'inline-flex items-center rounded-md font-medium',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
  },
  defaultVariants: {
    tone: 'primary',
  },
});
```

After:

```tsx
import { defineConfig, recipe } from 'react-class-variants';

const { styled } = defineConfig();

const buttonRecipe = recipe({
  base: 'inline-flex items-center rounded-md font-medium',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
  },
  defaultVariants: {
    tone: 'primary',
  },
});

export const Button = styled('button', buttonRecipe);
```

Current v2 `styled()` supports:

- intrinsic bases such as `'button'`
- custom React component bases

What changed is the data flow:

- v1 combined config definition and component creation in one call
- v2 always creates a recipe first, then builds a component from that recipe

### Update VS Code Tailwind IntelliSense settings

If your v1 workspace configured `tailwindCSS.classFunctions`, switch the list
to the v2 recipe-first helpers:

```json
{
  "tailwindCSS.classFunctions": ["recipe", "defineRecipeConfig"]
}
```

In v2, Tailwind-heavy config usually lives in `recipe()` or
`defineRecipeConfig()`, not in `styled(base, config)` or `variantProps()`. If
you alias `recipe` from `defineConfig()`, add that alias name too.

Two new tools matter during migration:

- use `propAliases` when a variant name would collide with a base prop like
  `size` on `<input>`
- use `forwardProps` when the base component must receive the resolved variant
  value in its own props

Example:

```tsx
const inputRecipe = recipe({
  base: 'block rounded-md border',
  variants: {
    size: {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 text-base',
    },
    disabled: {
      true: 'opacity-50',
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
  forwardProps: ['disabled'],
});
```

Usage:

```tsx
<Input size="sm" htmlSize={20} disabled />
```

## 5. Replace `variantProps(config)` with `recipe.resolve(input, options?)`

v1 `variantProps()` returned a single prop object with unrelated props plus a
merged `className`.

Before:

```ts
import { variantProps } from 'react-tailwind-variants';

const resolveInputProps = variantProps({
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

const props = resolveInputProps({
  size: 'sm',
  type: 'text',
  className: 'w-full',
});
```

After:

```ts
import { recipe } from 'react-class-variants/core';

const inputRecipe = recipe({
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

const resolved = inputRecipe.resolve(
  {
    size: 'sm',
    htmlSize: 20,
    disabled: true,
    type: 'text',
    className: 'w-full',
  },
  {
    propAliases: {
      size: 'htmlSize',
    },
    forwardProps: ['disabled'],
  }
);
```

`resolved` has this shape for root recipes:

```ts
{
  variants: {
    size: 'sm',
    disabled: true,
  },
  resolvedProps: {
    type: 'text',
    size: 20,
    disabled: true,
    className: 'block rounded-md border text-sm opacity-50 w-full',
  },
}
```

Important differences from v1:

- direct `recipe()` calls are not the full prop-bag API anymore
- `resolve()` returns both the effective resolved variants and the resolved prop
  bag
- forwarded variant values reflect defaults and boolean fallbacks too
- `propAliases` is how you avoid collisions between variant names and base props

For slotted recipes, `resolve()` returns:

- `variants`
- `slots`
- `resolvedProps`

One important slot-specific rule:

- `resolve()` does not decide which slot should receive a component-level
  `className`
- if you pass `className` into `slotRecipe.resolve(...)`, it stays in
  `resolvedProps`
- `styled(..., { view })` handles routing component-level `className` to the
  host slot automatically

## 6. Replace `asChild` with opt-in `render`

v1 intrinsic components exposed `asChild` through Radix Slot.

Before:

```tsx
<Button asChild tone="primary">
  <a href="/docs">Docs</a>
</Button>
```

In current v2, the equivalent surface is `render`, and it is opt-in:

```tsx
const LinkButton = styled('button', buttonRecipe, {
  withRender: true,
});

<LinkButton tone="primary" render={<a href="/docs" />}>
  Docs
</LinkButton>;
```

Rules:

- `render` exists only when `withRender: true`
- `withRender` is supported only for intrinsic bases
- `render` may be either a React element or a render function

If your old component relied on `asChild` everywhere, do not assume every v2
component must become render-polymorphic. A small wrapper is often the simpler
migration path.

## 7. Keep Configs Explicitly and Replace Extraction Helpers

v1 let you extract config and types from a styled component:

```ts
import {
  extractVariantsConfig,
  type VariantPropsOf,
  type VariantsConfigOf,
} from 'react-tailwind-variants';

type ButtonVariants = VariantPropsOf<typeof Button>;
type ButtonConfig = VariantsConfigOf<typeof Button>;
const buttonConfig = extractVariantsConfig(Button);
```

That runtime extraction pattern does not exist in v2.

The v2 migration path is:

```ts
import {
  defineRecipeConfig,
  recipe,
  type RecipeConfigOf,
  type VariantProps,
} from 'react-class-variants';

export const buttonConfig = defineRecipeConfig({
  base: 'inline-flex items-center rounded-md font-medium',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
  },
  defaultVariants: {
    tone: 'primary',
  },
});

export const buttonRecipe = recipe(buttonConfig);

type ButtonVariants = VariantProps<typeof buttonRecipe>;
type ButtonConfig = RecipeConfigOf<typeof buttonRecipe>;
```

The important distinction is:

- `RecipeConfigOf<typeof buttonRecipe>` gives you the config type
- `buttonConfig` is still the runtime config value you keep explicitly
- recipe instances do not expose a runtime `.config` property

## 8. Use `slots` Only When the Component Really Has Multiple Styled Parts

v1 had one class output per `variants()` or `styled()` call. v2 adds slot
recipes for multipart components.

Do not force every migrated v1 component into `slots`. Most v1 components should
start as root recipes.

Move to `slots` when you need separate classes for parts like:

- root
- label
- icon
- spinner
- input
- helper text

Example:

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
  hostSlot: 'label',
  view({ host, classes }) {
    return host.render({
      children: (
        <>
          <input className={classes.input()} />
          {host.children}
        </>
      ),
    });
  },
});
```

Slot-specific rules to remember:

- slotted recipes require `view`
- if the recipe has no `root` slot, `hostSlot` is required
- direct slot recipe calls do not accept top-level `className`
- external non-host slot overrides now use top-level `slotClassNames`
- individual slot renderers do accept local overrides and `className`

Example external slot overrides:

```tsx
<Field
  slotClassNames={{
    input: 'bg-white',
  }}
/>
```

```ts
const resolved = fieldRecipe.resolve({
  className: 'w-full',
  slotClassNames: {
    input: 'ring-1 ring-sky-500',
  },
});
```

## 9. Removed v1 Utilities

These v1 exports do not exist in v2:

- `cx()`
- `tw`
- `variantProps()`
- `extractVariantsConfig()`
- `VariantPropsOf`
- `VariantsConfigOf`

There is no single replacement import for all of them.

Use:

- `recipe()` and `defineConfig().styled()` for the main API
- `recipe.resolve()` for prop splitting
- `defineRecipeConfig()` and `RecipeConfigOf` for config retention
- your own class utility for standalone `cx()`-style merging

## Behavior Changes to Re-Test

Re-test these areas carefully after migration:

- Tailwind conflict resolution is no longer implicit. Configure
  `defineConfig({ merge: twMerge })` if you depended on v1's automatic merging.
- Validation is stricter in the checked path. The default root and core
  entrypoints are lean by default. Use `defineConfig({ validate: 'always' })`
  when you want the checked runtime, which rejects unknown props in direct
  recipe calls, missing required variants, invalid variant values, mixed
  boolean variants, invalid slot maps, and invalid alias targets.
- Direct recipe calls are variant-oriented. Use `resolve()` when you have a full
  component prop bag.
- Slotted direct calls do not accept top-level `className`.
- External slot overrides now use `slotClassNames`, and its keys must match the declared slots.
- `className` values are stricter on the validated path. Use strings, `null`, or
  flat arrays of strings. Do not rely on deep flattening or non-string array
  items.
- Variant names are variant-first on component surfaces. If a base prop and a
  variant share the same name, use `propAliases`.
- `withRender` is intrinsic-only. Custom React component bases cannot use
  `render`.
- If a `styled(..., { view })` component needs extra component-level props that
  only `view` should consume, use `defineViewProps()` instead of introducing a
  wrapper only to widen props and strip them before the host renders.
- `styled(..., { view })` routes component-level `className` to the host slot,
  but raw slot `resolve()` does not choose a host slot for you.

## Migration Checklist

- [ ] Replace the package with `react-class-variants@alpha`
- [ ] Confirm the app can run with React `19`, Node.js `20.19+`, and ESM-only
      package consumption
- [ ] Replace `variants()` with `recipe()`
- [ ] Rewrite every `compoundVariants` entry from `variants: { ... }` to flat
      selectors
- [ ] Replace `styled(base, config)` with `recipe(config)` plus
      `defineConfig().styled(base, recipe)`
- [ ] Replace `variantProps()` with `recipe.resolve()`
- [ ] Replace `asChild` with `withRender: true` plus `render`, or with a wrapper
- [ ] Replace `extractVariantsConfig()` by keeping the config explicitly with
      `defineRecipeConfig()`
- [ ] Replace `VariantPropsOf<typeof Component>` with
      `VariantProps<typeof someRecipe>`
- [ ] Replace `VariantsConfigOf<typeof Component>` with
      `RecipeConfigOf<typeof someRecipe>`
- [ ] Add `propAliases` anywhere variant keys collide with base props
- [ ] Add `forwardProps` anywhere the base component needs resolved variant
      values
- [ ] Replace wrapper-only view prop widening/stripping with `defineViewProps()`
      where it simplifies intrinsic or view-driven components
- [ ] Decide whether you need `defineConfig({ merge: twMerge })`
- [ ] Re-test any code that relied on permissive v1 runtime behavior

## Related Docs

- [README](../README.md)
- [Recipes and components guide](./recipes-and-components.md)
- [API reference](./api-reference.md)
- [Legacy v1 docs entrypoint](./react-tailwind-variants-v1.md)
