# Migration from `react-tailwind-variants` v1 to `react-class-variants` v2

This guide is based on the actual v1 code on `v1-maintenance` and the current v2 alpha implementation on `next`.

It is written for teams that need a clean, code-accurate migration path instead of a conceptual overview.

## What Actually Changed

From the code, v1 and v2 are different in five important ways:

1. The package was renamed and the publishing model changed.
2. The API collapsed around one canonical `recipe()` primitive.
3. `styled()` became intrinsic-tag-only instead of a generic component-composition helper.
4. Tailwind merging stopped being implicit.
5. Runtime behavior became much stricter in development.

If you only remember one sentence, make it this:

> v1 was a permissive, Tailwind-first, component-composition API; v2 is a stricter, recipe-first API with explicit prop routing and explicit React composition.

## Before You Start

### Compatibility differences

| Topic            | v1                            | v2                           |
| ---------------- | ----------------------------- | ---------------------------- | --- | --- | --- | --- | ---- | ----- |
| Package name     | `react-tailwind-variants`     | `react-class-variants`       |
| Status           | frozen                        | active alpha line            |
| Install channel  | normal package                | `react-class-variants@alpha` |
| Module format    | CJS + ESM                     | ESM-only                     |
| React peer range | `^16.8                        |                              | ^17 |     | ^18 |     | ^19` | `^19` |
| Tailwind merge   | required peer and always used | optional and explicit        |
| Polymorphism     | `asChild`                     | opt-in `render`              |

Recommended install:

```bash
pnpm add react-class-variants@alpha
```

If you relied on v1's automatic Tailwind conflict resolution, also install:

```bash
pnpm add tailwind-merge
```

### Audit your codebase first

Before changing code, search for the v1-specific entrypoints and patterns:

```bash
rg "react-tailwind-variants|variants\\(|variantProps\\(|extractVariantsConfig\\(|asChild|styled\\(" src test
```

Pay special attention to:

- `styled(CustomComponent, ...)`
- `styled(ExistingStyledComponent, ...)`
- `variantProps(...)`
- `extractVariantsConfig(...)`
- `asChild`
- any code that depends on implicit Tailwind merging
- any config that uses nested class arrays
- any `compoundVariants` entries with a nested `variants:` object

## v1 to v2 Mapping

| v1 export or pattern                 | v2 replacement                                                         | Notes                                              |
| ------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------- |
| `variants(config)`                   | `recipe(config)`                                                       | canonical class resolver                           |
| `styled(tag, config)`                | `const buttonRecipe = recipe(config)` then `styled(tag, buttonRecipe)` | config and component creation are now separate     |
| `variantProps(config)`               | `recipe.resolve(input, options)`                                       | explicit prop routing                              |
| `styled(CustomComponent, config)`    | wrapper component + `recipe.resolve()`                                 | no direct equivalent                               |
| `styled(StyledComponent, config)`    | wrapper component, root `compose`, or a consolidated recipe            | no direct equivalent                               |
| `asChild`                            | `withRender: true` + `render`, or a wrapper component                  | different semantics                                |
| `extractVariantsConfig(component)`   | keep the config explicitly with `defineRecipeConfig()`                 | recipe/component instances no longer expose config |
| `VariantPropsOf<typeof Component>`   | `VariantProps<typeof buttonRecipe>`                                    | types now derive from recipes                      |
| `VariantsConfigOf<typeof Component>` | keep the config object, or `RecipeConfigOf<typeof buttonRecipe>`       | no component-based config extraction               |
| `cx()`                               | your own helper or `twMerge` directly                                  | no exported equivalent                             |
| `tw`                                 | your own no-op tag if you still want one                               | no exported equivalent                             |

## The Biggest Conceptual Shifts

### 1. v2 is recipe-first

In v1 the public API was split across:

- `variants()`
- `variantProps()`
- `styled()`

In v2 everything starts from one recipe:

- call it directly
- call `.resolve()`
- pass it into `styled()`

### 2. `styled()` no longer composes arbitrary React components

In v1, `styled()` accepted any `ElementType`, including:

- intrinsic tags
- custom React components
- previously styled components

In v2, `styled()` only accepts intrinsic tags such as:

- `'button'`
- `'input'`
- `'label'`
- `'a'`

If your v1 architecture was built around layering styled components on top of one another, this is the main migration breakpoint.

### 3. `variantProps()` became `resolve()`

v1 `variantProps()`:

- stripped variant props
- passed everything else through
- always returned `{ className, ...otherProps }`

v2 `recipe.resolve()`:

- resolves variants explicitly
- returns both `variants` and `resolvedProps`
- supports `forwardProps`
- supports `nativeAliases`
- behaves differently for root and slot recipes

### 4. Tailwind merge is no longer automatic

v1 `cx()` always ran `twMerge`, and both `variants()` and `styled()` used `cx()` internally.

In v2, class merging is opt-in:

```ts
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

export const { recipe, styled } = defineConfig({
  merge: twMerge,
});
```

If you skip this, conflicting utilities will be concatenated instead of merged away.

### 5. Development validation is intentionally stricter

The v1 runtime was permissive:

- unknown props passed to `variants()` were ignored
- missing required variants often produced partial output instead of throwing
- invalid runtime values usually resulted in missing classes, not errors

The current v2 implementation throws in validation modes for cases such as:

- unknown direct recipe props
- missing required variants
- invalid variant values
- invalid `defaultVariants`
- invalid `compoundVariants`
- direct `className` on a slotted recipe call

This is a feature, not a regression, but it means sloppy v1 call sites must be cleaned up during migration.

## Step-by-Step Migration

### 1. Replace imports and package installation

Before:

```ts
import { styled, variants, variantProps } from 'react-tailwind-variants';
```

After:

```ts
import { recipe, styled } from 'react-class-variants';
```

If you want recipe-only files without React runtime helpers:

```ts
import { recipe } from 'react-class-variants/core';
```

### 2. Replace `variants(config)` with `recipe(config)`

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
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});
```

After:

```ts
import { recipe } from 'react-class-variants';

export const buttonRecipe = recipe({
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
  },
  defaultVariants: {
    size: 'md',
  },
});
```

This is the easy part. The harder part is the behavioral cleanup that often comes after it.

### 3. Rewrite `compoundVariants`

This is one of the most important config migrations.

In v1, each compound entry looked like this:

```ts
compoundVariants: [
  {
    variants: {
      tone: 'primary',
      size: ['sm', 'md'],
    },
    className: 'uppercase',
  },
];
```

In v2, the selector keys moved to the top level:

```ts
compoundVariants: [
  {
    tone: 'primary',
    size: ['sm', 'md'],
    className: 'uppercase',
  },
];
```

Rules that stay the same:

- selector arrays still mean logical OR
- compounds still apply extra classes after regular variant classes

What changes:

- there is no nested `variants:` object anymore
- slot recipes use slot maps for `className`

For slot recipes:

```ts
compoundVariants: [
  {
    tone: 'primary',
    loading: true,
    className: {
      root: 'cursor-wait',
      icon: 'animate-spin',
    },
  },
];
```

### 4. Replace `styled('tag', config)` with `recipe(...)` + `styled(...)`

Before:

```tsx
import { styled } from 'react-tailwind-variants';

export const Button = styled('button', {
  base: 'inline-flex items-center rounded-md',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
  },
});
```

After:

```tsx
import { recipe, styled } from 'react-class-variants';

const buttonRecipe = recipe({
  base: 'inline-flex items-center rounded-md',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
  },
});

export const Button = styled('button', buttonRecipe);
```

This is the direct migration path for intrinsic components.

### 5. Replace `variantProps(config)` with `recipe.resolve()`

Before:

```ts
import { variantProps } from 'react-tailwind-variants';

const resolveButtonProps = variantProps({
  base: 'inline-flex items-center',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
  },
});

const props = resolveButtonProps({
  tone: 'primary',
  type: 'button',
  className: 'w-full',
});
```

After:

```ts
import { recipe } from 'react-class-variants';

const buttonRecipe = recipe({
  base: 'inline-flex items-center',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
  },
});

const resolved = buttonRecipe.resolve(
  {
    tone: 'primary',
    type: 'button',
    className: 'w-full',
  },
  {
    forwardProps: ['tone'],
  }
);
```

Important difference:

- v1 returned one object
- v2 returns:
  - `resolved.variants`
  - `resolved.resolvedProps`

Why this matters:

- you now have access to the effective variant selection
- defaulted variants and boolean fallbacks are visible
- you can selectively forward variant props

### 6. Replace `asChild` with `render` or a wrapper component

Before:

```tsx
<Button asChild tone="primary">
  <a href="/docs" className="mt-4">
    Docs
  </a>
</Button>
```

Simple v2 replacement for intrinsic components:

```tsx
const Button = styled('button', buttonRecipe, {
  withRender: true,
});

<Button tone="primary" render={<a href="/docs" />}>
  Docs
</Button>;
```

More explicit replacement:

```tsx
<Button tone="primary" render={props => <a {...props} href="/docs" />}>
  Docs
</Button>
```

Important differences:

- `render` is opt-in through `withRender: true`
- `render` only exists on v2 intrinsic-tag styled components
- `render` is not the same API as `asChild`
- for larger wrapper abstractions, use a custom component plus `recipe.resolve()` instead

### 7. Replace `styled(CustomComponent, config)` with a wrapper component

This is the biggest architectural migration.

Before:

```tsx
const CardBase = forwardRef<HTMLDivElement, CardBaseProps>(function CardBase(
  { className, title, ...props },
  ref
) {
  return (
    <section {...props} ref={ref} className={className}>
      <h2>{title}</h2>
    </section>
  );
});

const Card = styled(CardBase, {
  base: 'rounded-xl border p-4',
  variants: {
    tone: {
      neutral: 'bg-white',
      accent: 'bg-sky-50',
    },
  },
});
```

After:

```tsx
import { recipe, type VariantProps } from 'react-class-variants';

const cardRecipe = recipe({
  base: 'rounded-xl border p-4',
  variants: {
    tone: {
      neutral: 'bg-white',
      accent: 'bg-sky-50',
    },
  },
});

type CardProps = Omit<CardBaseProps, 'className'> &
  VariantProps<typeof cardRecipe> & {
    className?: string;
  };

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(props, ref) {
  const resolved = cardRecipe.resolve(props);

  return <CardBase {...resolved.resolvedProps} ref={ref} />;
});
```

This is the correct v2 pattern when:

- the base is a custom component
- you previously stacked styled components
- you need total control over prop routing

### 8. Replace component-to-component styled composition

v1 allowed patterns like:

```tsx
const BaseButton = styled('button', { ... });
const Button = styled(BaseButton, { ... });
const FancyButton = styled(Button, { ... });
```

There is no direct v2 equivalent.

Choose one of these migration strategies:

#### Option A: consolidate into one recipe

Best when the variants all describe the same visual component.

#### Option B: keep one recipe and build wrappers around it

Best when the outer layers mostly add markup or behavior.

#### Option C: use root `compose`

Best when the base is still an intrinsic tag but you need custom structure:

```tsx
const Button = styled('button', buttonRecipe, {
  compose: ({ Root, variants }, { className, children, ...props }) => (
    <Root {...props} className={className} data-tone={variants.tone}>
      <span className="truncate">{children}</span>
    </Root>
  ),
});
```

### 9. Keep configs explicitly instead of extracting them from components

Before:

```ts
const config = extractVariantsConfig(Button);
type ButtonProps = VariantPropsOf<typeof Button>;
type ButtonConfig = VariantsConfigOf<typeof Button>;
```

After:

```ts
import {
  defineRecipeConfig,
  recipe,
  type RecipeConfigOf,
  type VariantProps,
} from 'react-class-variants';

const buttonConfig = defineRecipeConfig({
  base: 'inline-flex',
  variants: {
    tone: {
      primary: 'text-blue-600',
      ghost: 'text-slate-900',
    },
  },
});

const buttonRecipe = recipe(buttonConfig);

type ButtonVariants = VariantProps<typeof buttonRecipe>;
type ButtonConfig = RecipeConfigOf<typeof buttonRecipe>;
```

Practical guidance:

- if you need the config value itself, keep `buttonConfig`
- if you need variant input types, derive them from the recipe
- do not plan around runtime config extraction in v2

### 10. Make Tailwind merging explicit

In v1, this worked automatically:

```ts
const Button = styled('button', {
  base: 'px-4 py-2',
  variants: {
    size: {
      sm: 'px-2 py-1',
    },
  },
});
```

`<Button size="sm" className="px-8" />` ended up with merged output because v1 always ran `twMerge`.

In v2, you must opt in:

```ts
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

const { recipe, styled } = defineConfig({
  merge: twMerge,
});
```

Without that, conflicting utilities will be concatenated instead of normalized.

### 11. Clean up class value shapes

v1 accepted a much looser class value model.

The actual v1 runtime could flatten nested arrays all the way down because `cx()` did:

```ts
classes.flat(Infinity).filter(Boolean).join(' ');
```

v2 is stricter:

```ts
type ClassNameValue = string | null | readonly string[];
```

Migration rules:

- replace nested arrays with flat arrays
- remove `undefined` from arrays
- do not use objects, numbers, or booleans as class leaves

Before:

```ts
base: ['rounded', ['px-4', undefined]];
```

After:

```ts
base: ['rounded', 'px-4'];
```

### 12. Use slot recipes for structured components

v1 had no slot recipe model. If your component had many styled parts, you probably solved it with:

- multiple styled components
- nested component composition
- manual string plumbing

In v2, this usually becomes one slot recipe plus `compose`:

```tsx
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
});

const Button = styled('button', buttonRecipe, {
  compose: ({ Root, slots }, { className, children, ...props }) => (
    <Root {...props} className={slots.root({ className })}>
      <span className={slots.icon()} />
      <span className={slots.label()}>{children}</span>
    </Root>
  ),
});
```

## Runtime Behavior Changes You Must Re-Test

These are the migration issues most likely to surface after a mechanical rewrite.

### Direct resolver calls are no longer permissive

In v1, a direct class resolver call like:

```ts
button({ type: 'button' } as any);
```

would usually just ignore `type`.

In v2, direct recipe calls are variant-only APIs:

- root direct calls accept variant props plus optional `className`
- slot direct calls accept variant props only

Use `resolve()` for arbitrary props.

### Missing required variants are now real runtime errors in validation modes

In v1, a resolver could still return partial output when a required non-boolean variant was missing.

In v2, missing required variants throw in development validation.

### Invalid variant values now throw in validation modes

In v1, invalid values often just produced missing classes.

In v2, invalid values are treated as actual errors when validation is enabled.

### Slot recipes do not accept direct `className`

This is intentional:

```ts
const slots = buttonRecipe({ tone: 'primary' });
slots.root({ className: 'px-4' });
```

The class override belongs at the slot function level, not the top-level slot recipe call.

### Component-level `className` is manual in slotted components

For root recipes, v2 computes the final `className`.

For slot recipes, v2 does not guess where `className` should go:

```tsx
className={slots.root({ className })}
```

Your `compose` callback decides how to route it.

### Native prop collisions are now explicitly supported

If you previously had painful collisions such as `size` on inputs, v2 gives you a real mechanism:

```ts
const Input = styled('input', inputRecipe, {
  nativeAliases: {
    size: 'htmlSize',
  },
});
```

Use this instead of relying on accidental pass-through behavior.

## A Practical Migration Strategy

For medium or large codebases, this order is usually the least painful:

1. Replace package imports.
2. Introduce `defineConfig({ merge: twMerge })` if you need v1-like Tailwind merging.
3. Convert plain `variants()` helpers to `recipe()` first.
4. Convert intrinsic `styled('tag', config)` components next.
5. Replace `variantProps()` call sites with `recipe.resolve()`.
6. Rewrite `asChild` call sites to `render` or wrappers.
7. Rewrite `styled(CustomComponent, ...)` and deep styled composition last.
8. After the API migration, clean up configs for:
   - flat `compoundVariants`
   - flat class arrays
   - removed runtime config extraction
9. Run the app in development and fix validation errors one by one.

## Migration Checklist

- [ ] package name changed to `react-class-variants`
- [ ] install uses `react-class-variants@alpha`
- [ ] CommonJS assumptions removed
- [ ] React version constraints updated
- [ ] `variants()` replaced with `recipe()`
- [ ] `variantProps()` replaced with `recipe.resolve()`
- [ ] `styled(tag, config)` replaced with `recipe(...)` + `styled(tag, recipe)`
- [ ] `styled(CustomComponent, ...)` replaced with wrapper components
- [ ] `asChild` replaced with `render` or wrappers
- [ ] `compoundVariants` rewritten from nested `variants:` to flat selectors
- [ ] nested class arrays removed
- [ ] implicit Tailwind merge replaced with `defineConfig({ merge: twMerge })`
- [ ] config extraction replaced with explicit `defineRecipeConfig()` ownership
- [ ] type helpers updated to derive from recipes, not components
- [ ] slotted components route `className` explicitly in `compose`

## Related Docs

- [API reference](./api-reference.md)
- [Recipes and components guide](./recipes-and-components.md)
- [Legacy v1 reference](./react-tailwind-variants-v1.md)
