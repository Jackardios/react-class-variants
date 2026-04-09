# `react-tailwind-variants` v1 legacy reference

This page documents the frozen v1 line of `react-tailwind-variants` as it exists on `v1-maintenance`.

Use this document if you still run the legacy package and need a stable reference without checking out the old branch. If you are planning new work, use `react-class-variants` instead and keep the migration guide nearby.

## Status

- Current legacy package: `react-tailwind-variants`
- Current documented legacy release: `1.0.4`
- Status: frozen
- Maintenance scope: metadata and documentation only
- Successor package: `react-class-variants`

## Installation and compatibility

Install the legacy package together with its required peer dependencies:

```bash
npm install react-tailwind-variants tailwind-merge
```

v1 compatibility:

- `react`: `^16.8 || ^17.0 || ^18.0 || ^19.0`
- `react-dom`: `^16.8 || ^17.0 || ^18.0 || ^19.0`
- `tailwind-merge`: `^1.10.0 || ^2.0.0 || ^3.0.0`

`@radix-ui/react-slot` is bundled by the package and powers the intrinsic-element `asChild` pattern.

## What v1 exports

Runtime exports:

- `styled()`
- `variants()`
- `variantProps()`
- `extractVariantsConfig()`
- `cx()`
- `tw`

Type exports:

- `StyledComponent`
- `VariantsConfig`
- `VariantsSchema`
- `VariantOptions`
- `VariantsConfigOf`
- `VariantPropsOf`
- `CxOptions`
- `CxReturn`

## Core behavior

The v1 API is centered on a Stitches-like variants config:

- `base`: classes always applied
- `variants`: named variant groups
- `defaultVariants`: default values for optional variants
- `compoundVariants`: extra classes applied when multiple variants match

Class values may be:

- strings
- arrays of strings
- `null`
- nested arrays of those values

Boolean variants use `"true"` and `"false"` keys and become optional props automatically. Non-boolean variants are required unless they are given a default in `defaultVariants`.

One important v1 behavior: class strings are automatically merged through `tailwind-merge` because `variants()`, `variantProps()`, and `styled()` all rely on `cx()` internally.

## `styled()`

`styled()` is the main v1 component factory.

```tsx
import { styled } from 'react-tailwind-variants';

const Button = styled('button', {
  base: 'rounded font-medium',
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

`styled()` returns a typed React component whose variant props are inferred from the config.

## Boolean variants

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

If a boolean variant omits one side, the missing side simply contributes no classes.

## Compound variants

Use `compoundVariants` when styling depends on multiple variant selections:

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

Compound selectors can match either:

- one value, for example `size: 'sm'`
- many values, for example `color: ['filled', 'outlined']`

## Default variants and required props

Variants without defaults are required unless they are boolean. Variants with defaults become optional.

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

For intrinsic elements like `'button'` or `'div'`, v1 supports polymorphism through the `asChild` prop:

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

- `asChild` exists only when the base type is an intrinsic JSX element like `'button'`.
- It is implemented with `@radix-ui/react-slot`.
- When you build a styled component from a custom React component, `asChild` is not part of the public props.

## Component composition

v1 supports component composition by passing an existing styled component as the base type:

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

You can also layer components through `asChild` when the outer component is intrinsic and slottable.

## `variants(config)`

`variants()` returns a class name resolver function without creating a React component:

```tsx
import { variants } from 'react-tailwind-variants';

const buttonVariants = variants({
  base: 'rounded font-medium',
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
});

buttonVariants({
  color: 'brand',
  size: 'small',
  className: 'px-8',
});
```

Because `variants()` uses `cx()` internally, Tailwind conflicts are merged automatically.

## `variantProps(config)`

`variantProps()` returns a function that consumes variant props, resolves `className`, and passes through unrelated props.

```tsx
import { variantProps } from 'react-tailwind-variants';

const resolveButtonProps = variantProps({
  base: 'rounded font-medium',
  variants: {
    color: {
      brand: 'bg-sky-500 text-white',
      accent: 'bg-teal-500 text-white',
    },
  },
});

const props = resolveButtonProps({
  color: 'brand',
  type: 'button',
  className: 'px-8',
});
```

`props` will contain:

- `className` with merged variant classes
- non-variant props such as `type`, `onClick`, `data-*`, and `aria-*`

It will not contain consumed variant props such as `color`.

## `extractVariantsConfig(component)`

`extractVariantsConfig()` returns the original config stored on a styled component:

```tsx
import { extractVariantsConfig, styled } from 'react-tailwind-variants';

const Button = styled('button', {
  base: ['rounded', 'font-medium'],
  variants: {
    color: {
      brand: 'bg-sky-500 text-white',
      accent: 'bg-teal-500 text-white',
    },
  },
});

const config = extractVariantsConfig(Button);
```

This works only for components created by `styled()`.

## `cx()` and `tw`

v1 also exposes two small helpers:

### `cx(...classes)`

```tsx
import { cx } from 'react-tailwind-variants';

const className = cx('px-4 py-2', 'px-8', ['text-white', null]);
```

`cx()` flattens nested class arrays, removes falsy values, joins them into a string, and then runs the result through `tailwind-merge`.

### `tw`

```tsx
import { tw } from 'react-tailwind-variants';

const classes = tw`px-4 py-2 text-white`;
```

`tw` is only `String.raw`. It exists mainly for editor tooling and tagged-template ergonomics.

## Type helpers

Common v1 type helpers:

### `VariantPropsOf<typeof Component>`

Extracts the variant prop type from a styled component.

```tsx
import { type VariantPropsOf, styled } from 'react-tailwind-variants';

const Button = styled('button', {
  variants: {
    color: {
      brand: 'bg-sky-500 text-white',
      accent: 'bg-teal-500 text-white',
    },
  },
});

type ButtonVariantProps = VariantPropsOf<typeof Button>;
```

### `VariantsConfigOf<typeof Component>`

Extracts the config type from a styled component.

```tsx
import { type VariantsConfigOf, styled } from 'react-tailwind-variants';

const Button = styled('button', {
  variants: {
    color: {
      brand: 'bg-sky-500 text-white',
      accent: 'bg-teal-500 text-white',
    },
  },
});

type ButtonConfig = VariantsConfigOf<typeof Button>;
```

### `VariantOptions<Config>`

Extracts variant props from a config type directly.

```tsx
import { type VariantOptions } from 'react-tailwind-variants';

type ButtonOptions = VariantOptions<{
  variants: {
    color: {
      brand: string;
      accent: string;
    };
    elevated: {
      true: string;
      false: string;
    };
  };
  defaultVariants: {
    color: 'brand';
  };
}>;
```

## Tailwind CSS IntelliSense in v1

If you want Tailwind class completion inside tagged template literals, use `tw` and configure VS Code like this:

```tsx
import { styled, tw } from 'react-tailwind-variants';

const Button = styled('button', {
  base: tw`px-5 py-2 text-white`,
  variants: {
    color: {
      neutral: tw`bg-slate-500 hover:bg-slate-400`,
      accent: tw`bg-teal-500 hover:bg-teal-400`,
    },
  },
});
```

```json
{
  "tailwindCSS.experimental.classRegex": ["tw`(\\`|[^`]+?)`"]
}
```

## When to stay on v1

Staying on v1 is reasonable when:

- your codebase is built around `styled()` and `asChild`
- you need the old React compatibility range
- you are not ready for the v2 package rename
- you want to defer a larger migration until `react-class-variants` leaves alpha

## Where to migrate next

- Migration guide: [migration-from-react-tailwind-variants.md](./migration-from-react-tailwind-variants.md)
- Current package docs: [../README.md](../README.md)
