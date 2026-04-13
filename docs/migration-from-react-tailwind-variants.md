# Migration from `react-tailwind-variants`

This guide covers the current v2 alpha API of `react-class-variants`.

## High-Level Mapping

| v1 export or pattern                 | v2 replacement                                                                     | Notes                                      |
| ------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------ |
| `variants(config)`                   | `recipe(config)`                                                                   | one canonical styling primitive            |
| `variantProps(config)`               | `recipe.resolve(input, options)`                                                   | explicit prop routing                      |
| `styled(tag, config)`                | `const r = recipe(config)` then `styled(tag, r)`                                   | config and component creation are separate |
| `styled(CustomComponent, config)`    | `const r = recipe(config)` then `styled(CustomComponent, r)`                       | supported again in v2 alpha                |
| `styled(StyledComponent, config)`    | usually `styled(StyledComponent, recipe)` or a wrapper around `recipe.resolve()`   | depends on your layering model             |
| `asChild`                            | `withRender: true` + `render`                                                      | intrinsic bases only                       |
| `VariantPropsOf<typeof Component>`   | `VariantProps<typeof recipe>`                                                      | types derive from recipes                  |
| `VariantsConfigOf<typeof Component>` | keep the config with `defineRecipeConfig()` or use `RecipeConfigOf<typeof recipe>` | no runtime config extraction               |

## The Biggest Conceptual Shifts

### 1. v2 is recipe-first

In v1 the public API was spread across:

- `variants()`
- `variantProps()`
- `styled()`

In v2 everything starts from one recipe:

- call it directly
- call `.resolve()`
- pass it into `styled()`

### 2. `styled()` accepts real React bases again

The current v2 alpha supports:

- intrinsic tags such as `'button'`
- custom React components

This is different from the earlier tag-only alpha surface.

Rule:

- only intrinsic bases support `withRender`
- custom bases should accept and forward `className`, `children`, and `ref` when those behaviors matter

### 3. Custom structure moved to `view`

The old alpha used `compose` and a `Root` helper. The current surface uses a real React `view` component instead.

This means:

- hooks are allowed
- there is no pseudo-component helper
- slotted components receive `classes`
- the rendered base is modeled through `host`
- prefer a named component reference such as `view: ButtonView` when you plan to use hooks so hook linting stays happy

### 4. `nativeAliases` became `propAliases`

The aliasing model is no longer described as intrinsic-only because `styled()` accepts custom bases again.

Before:

```ts
nativeAliases: {
  size: 'htmlSize',
}
```

After:

```ts
propAliases: {
  size: 'htmlSize',
}
```

### 5. Tailwind merging is still explicit

v2 does not hide merge behavior inside the runtime. If you want Tailwind conflict resolution, configure it:

```ts
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

export const { recipe, styled } = defineConfig({
  merge: twMerge,
});
```

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

If you want recipe-only files without React helpers:

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
  },
});
```

### 3. Replace `variantProps()` with `recipe.resolve()`

Before:

```ts
const resolveButtonProps = variantProps({
  base: 'inline-flex items-center',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
    },
  },
});
```

After:

```ts
const buttonRecipe = recipe({
  base: 'inline-flex items-center',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
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

- v1 returned one prop bag
- v2 returns `variants` plus `resolvedProps`

### 4. Replace `styled(tag, config)` with `recipe(...)` + `styled(...)`

Before:

```tsx
const Button = styled('button', {
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
const buttonRecipe = recipe({
  base: 'inline-flex items-center rounded-md',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
  },
});

const Button = styled('button', buttonRecipe);
```

### 5. Replace `asChild` with `render`

Before:

```tsx
<Button asChild tone="primary">
  <a href="/docs">Docs</a>
</Button>
```

After:

```tsx
const Button = styled('button', buttonRecipe, {
  withRender: true,
});

<Button tone="primary" render={<a href="/docs" />}>
  Docs
</Button>;
```

### 6. Replace old `compose`-based alpha code with `view`

Old alpha:

```tsx
const Button = styled('button', buttonRecipe, {
  compose: ({ Root, slots }, { className, children, ...props }) => (
    <Root {...props} className={slots.root({ className })}>
      <span className={slots.icon()} />
      <span className={slots.label()}>{children}</span>
    </Root>
  ),
});
```

Current alpha:

```tsx
function ButtonView({ host, classes }) {
  const { icon, label } = classes;

  return host.render({
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

This is the main mental-model shift:

- old alpha `compose` was a callback DSL with a pseudo-component helper
- current `view` is an actual React component surface
- `classes` can be safely destructured

### 7. Migrate slotted components without `root`

Use `hostSlot` when the rendered wrapper corresponds to another slot:

```tsx
function FieldView({ host, classes }) {
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

### 8. Keep configs explicitly

Before:

```ts
const config = extractVariantsConfig(Button);
```

After:

```ts
const buttonConfig = defineRecipeConfig({
  base: 'inline-flex',
  variants: {
    tone: {
      primary: 'text-blue-600',
    },
  },
});

const buttonRecipe = recipe(buttonConfig);
```

## Runtime Behavior Changes to Re-Test

- direct recipe calls are variant-only APIs
- missing required variants throw in validation modes
- invalid variant values throw in validation modes
- slotted recipe direct calls still do not accept top-level `className`
- slotted components route component-level `className` automatically to the host slot
- `withRender` works only for intrinsic bases

## Migration Checklist

- [ ] package name changed to `react-class-variants`
- [ ] install uses `react-class-variants@alpha`
- [ ] `variants()` replaced with `recipe()`
- [ ] `variantProps()` replaced with `recipe.resolve()`
- [ ] `styled(tag, config)` replaced with `recipe(...)` + `styled(tag, recipe)`
- [ ] old alpha `compose` usage replaced with `view`
- [ ] `nativeAliases` renamed to `propAliases`
- [ ] `asChild` replaced with `render` or wrapper components
- [ ] `compoundVariants` rewritten to flat selectors
- [ ] implicit Tailwind merge replaced with `defineConfig({ merge: twMerge })`
- [ ] type helpers derive from recipes, not components

## Related Docs

- [API reference](./api-reference.md)
- [Recipes and components guide](./recipes-and-components.md)
