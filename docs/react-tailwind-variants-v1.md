# `react-tailwind-variants` v1 Legacy Reference

This page documents the frozen v1 line of `react-tailwind-variants` for teams that still maintain legacy code while preparing a migration to `react-class-variants`.

## Status

- Package name: `react-tailwind-variants`
- Last documented legacy release: `1.0.4`
- Status: frozen
- Maintenance scope: metadata, documentation, and migration guidance
- Successor package: `react-class-variants`

If you are starting new work, use `react-class-variants` instead and keep the [migration guide](./migration-from-react-tailwind-variants.md) close by.

## Installation and Compatibility

Install the legacy package together with its required peer dependencies:

```bash
npm install react-tailwind-variants tailwind-merge
```

v1 compatibility:

- `react`: `^16.8 || ^17.0 || ^18.0 || ^19.0`
- `react-dom`: `^16.8 || ^17.0 || ^18.0 || ^19.0`
- `tailwind-merge`: `^1.10.0 || ^2.0.0 || ^3.0.0`

`@radix-ui/react-slot` is bundled by the package and powers the intrinsic-element `asChild` pattern.

## Public Surface

### Runtime exports

- `styled()`
- `variants()`
- `variantProps()`
- `extractVariantsConfig()`
- `cx()`
- `tw`

### Type exports

- `StyledComponent`
- `VariantsConfig`
- `VariantsSchema`
- `VariantOptions`
- `VariantsConfigOf`
- `VariantPropsOf`
- `CxOptions`
- `CxReturn`

## Config Model

The v1 API is centered on a Stitches-like variants config:

- `base`: classes that always apply
- `variants`: named variant groups
- `defaultVariants`: default values for optional variants
- `compoundVariants`: extra classes applied when multiple variants match

Accepted class values:

- strings
- arrays of strings
- `null`
- nested arrays of those values

Behavior summary:

- boolean variants use `"true"` and `"false"` keys
- boolean variants become optional automatically
- non-boolean variants are required unless they have defaults
- classes are automatically merged through `tailwind-merge`

## `styled()`

`styled()` is the main v1 component factory.

```tsx
import { styled } from 'react-tailwind-variants';

const Button = styled('button', {
  base: 'rounded font-medium transition',
  variants: {
    color: {
      brand: 'bg-sky-500 text-white',
      accent: 'bg-teal-500 text-white',
    },
    size: {
      small: 'px-3 py-2 text-sm',
      large: 'px-5 py-3 text-base',
    },
  },
  defaultVariants: {
    size: 'small',
  },
});
```

Usage:

```tsx
<Button color="brand">Click me</Button>
<Button color="accent" size="large" className="px-8">
  Click me
</Button>
```

Characteristics:

- variant props are inferred from the config
- class strings are merged through `tailwind-merge`
- intrinsic elements can expose `asChild`
- custom React components can be used as the base type for composition

## Boolean Variants

```tsx
const Button = styled('button', {
  base: 'font-medium',
  variants: {
    disabled: {
      true: 'opacity-50 cursor-not-allowed',
      false: 'opacity-100',
    },
  },
});

<Button disabled>Disabled</Button>;
<Button disabled={false}>Enabled</Button>;
```

If a boolean variant omits one side, the missing side contributes no classes.

## Compound Variants

Use `compoundVariants` when styling depends on multiple variant selections.

```tsx
const Button = styled('button', {
  base: 'rounded',
  variants: {
    color: {
      filled: 'bg-blue-500 text-white',
      outlined: 'border border-blue-500 text-blue-500',
      plain: 'bg-transparent text-blue-500',
    },
    size: {
      sm: 'px-3 py-1.5',
      md: 'px-4 py-2',
      lg: 'px-6 py-3',
    },
  },
  compoundVariants: [
    {
      variants: {
        color: ['filled', 'outlined'],
        size: 'sm',
      },
      className: 'text-sm',
    },
    {
      variants: {
        color: 'plain',
        size: 'lg',
      },
      className: 'font-semibold underline',
    },
  ],
});
```

Compound selectors may match:

- one value, for example `size: 'sm'`
- many values, for example `color: ['filled', 'outlined']`

## Default Variants and Required Props

Variants without defaults are required unless they are boolean.

```tsx
const Button = styled('button', {
  variants: {
    color: {
      brand: 'bg-sky-500 text-white',
      accent: 'bg-teal-500 text-white',
    },
    size: {
      small: 'px-3 py-2 text-sm',
      large: 'px-5 py-3 text-base',
    },
    elevated: {
      true: 'shadow-md',
      false: '',
    },
  },
  defaultVariants: {
    color: 'brand',
  },
});
```

In this example:

- `color` is optional because it has a default
- `elevated` is optional because it is boolean
- `size` is still required

## Polymorphism with `asChild`

For intrinsic elements, v1 supports polymorphism through `asChild`.

```tsx
const Button = styled('button', {
  base: 'rounded font-medium',
  variants: {
    color: {
      brand: 'bg-sky-500 text-white',
      accent: 'bg-teal-500 text-white',
    },
  },
});

<Button asChild color="brand">
  <a href="/docs" className="mt-4">
    Docs
  </a>
</Button>;
```

Notes:

- `asChild` exists only for intrinsic JSX element bases
- it is implemented with `@radix-ui/react-slot`
- custom-component bases do not expose `asChild`

## Component Composition

v1 supports component-to-component composition by passing an existing styled component as the base type.

```tsx
const BaseButton = styled('button', {
  base: 'text-center font-medium',
  variants: {
    size: {
      small: 'px-3 py-2 text-sm',
      large: 'px-5 py-3 text-base',
    },
  },
});

const Button = styled(BaseButton, {
  base: 'rounded',
  variants: {
    color: {
      brand: 'bg-sky-500 text-white',
      accent: 'bg-teal-500 text-white',
    },
  },
});
```

This composition story does not carry over directly to v2.

## `variants(config)`

`variants()` creates a class resolver without creating a React component.

```ts
import { variants } from 'react-tailwind-variants';

const badge = variants({
  base: 'inline-flex rounded-full font-medium',
  variants: {
    tone: {
      info: 'bg-sky-100 text-sky-900',
      success: 'bg-emerald-100 text-emerald-900',
    },
  },
  defaultVariants: {
    tone: 'info',
  },
});

badge();
badge({ tone: 'success', className: 'uppercase' });
```

## `variantProps(config)`

`variantProps()` is the legacy helper for prop splitting plus class resolution.

```ts
import { variantProps } from 'react-tailwind-variants';

const resolveButton = variantProps({
  base: 'inline-flex items-center',
  variants: {
    tone: {
      primary: 'bg-sky-500 text-white',
      ghost: 'bg-transparent text-slate-900',
    },
  },
});

const result = resolveButton({
  tone: 'primary',
  type: 'button',
  className: 'w-full',
});
```

The resulting object keeps the non-variant props and a merged `className`.

## `extractVariantsConfig(component)`

This helper extracts the original variants config from a styled component:

```ts
const buttonConfig = extractVariantsConfig(Button);
```

That pattern does not exist in v2. The migration path is to keep the config object explicitly with `defineRecipeConfig()`.

## `cx()` and `tw`

### `cx(...classes)`

`cx()` is the legacy class-merging helper exported by v1.

Typical use:

```ts
cx('px-4', condition && 'py-2', ['rounded', 'font-medium']);
```

### `tw`

`tw` is the tagged-template convenience helper for class strings:

```ts
const className = tw`px-4 py-2 rounded`;
```

Neither `cx()` nor `tw` exists in v2.

## Type Helpers

### `VariantPropsOf<typeof Component>`

Extracts the public variant props from a styled component.

```ts
type ButtonVariants = VariantPropsOf<typeof Button>;
```

### `VariantsConfigOf<typeof Component>`

Extracts the config shape from a styled component.

```ts
type ButtonConfig = VariantsConfigOf<typeof Button>;
```

### `VariantOptions<Config>`

Projects variant options from a config type.

```ts
type ButtonOptions = VariantOptions<typeof buttonConfig>;
```

These helpers are specific to the v1 model and do not map one-to-one to the v2 type surface.

## Tailwind CSS IntelliSense in v1

When using Tailwind CSS IntelliSense in VS Code, v1 projects commonly configured:

```json
{
  "tailwindCSS.classFunctions": ["variants", "variantProps", "styled"]
}
```

This section is only relevant for legacy v1 codebases.

## When to Stay on v1

Staying on v1 can be reasonable when you still depend on:

- `asChild`
- component-to-component `styled()` composition
- automatic Tailwind merge everywhere
- the existing CommonJS/legacy React compatibility matrix

For new work, the recommendation remains to migrate.

## Where to Migrate Next

- [Migration guide](./migration-from-react-tailwind-variants.md)
- [Recipes and components guide](./recipes-and-components.md)
- [API reference](./api-reference.md)
