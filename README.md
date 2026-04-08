# React Tailwind Variants

[![npm package][npm-img]][npm-url]
[![npm bundle size][bundle-size-img]][bundle-size-url]
[![Downloads][downloads-img]][downloads-url]

`Stitches.js`-like API for creating composable components. You can define a single variant, multiple variants, and even compound variants which allow you to define classes based on a combination of variants.

This is a modified version of the [`classname-variants`](https://github.com/fgnass/classname-variants/)

> [!IMPORTANT]
> `react-tailwind-variants` is the legacy v1 package line.
> New development moved to [`react-class-variants`](https://www.npmjs.com/package/react-class-variants), and the current v2 line is published on the `alpha` channel.
> Install v2 with `npm install react-class-variants@alpha`.
> Use the [Migration Guide](https://github.com/Jackardios/react-class-variants/blob/next/docs/migration-from-react-tailwind-variants.md) to move off v1 when you are ready.

## Features

- 📦 Lightweight
- 📜 Fully type-safe
- 💅🏼 Elegant [Stitches-like](https://github.com/stitchesjs/stitches) variants API
- 🗑️ Automatic tailwindcss classes conflict resolution via [tailwind-merge](https://github.com/dcastil/tailwind-merge)
- ♻️ Polymorphic components via [@radix-ui/slot](https://www.radix-ui.com/docs/primitives/utilities/slot)

## Installation

```bash
npm install tailwind-merge react-tailwind-variants
```

## Migration status

- `react-tailwind-variants` remains installable for existing applications
- The package is frozen and only receives metadata and documentation maintenance
- The successor package is `react-class-variants`
- Migration guide: <https://github.com/Jackardios/react-class-variants/blob/next/docs/migration-from-react-tailwind-variants.md>
- Legacy v1 docs: <https://github.com/Jackardios/react-class-variants/blob/next/docs/react-tailwind-variants-v1.md>

## Usage

- [Basics](#basics)
- [Boolean variants](#boolean-variants)
- [Compound variants](#compound-variants)
- [Default variants](#default-variants)
- [Polymorphic components](#polymorphic-components)
- [Composing components](#composing-components)
- [Utilities](#utilities)
  - [variants(config)](#variantsconfig)
  - [variantProps(config)](#variantpropsconfig)
  - [extractVariantsConfig(component)](#extractvariantsconfigcomponent)
- [Typescript utilities](#typescript-utilities)
  - [VariantsConfigOf\<Component\>](#variantsconfigofcomponent)
  - [VariantPropsOf\<Component\>](#variantpropsofcomponent)
- [Tailwind CSS IntelliSense](#tailwind-css-intellisense)

### Basics

Let's assume we want to build a button component with Tailwind CSS that comes in different sizes and colors.

It consists of some _base classes_ that are always present as well as some optional classes that need to be added depending on the desired _variants_.

```tsx
import { styled } from 'react-tailwind-variants';

const Button = styled('button', {
  base: 'rounded text-white',
  variants: {
    color: {
      brand: 'bg-sky-500',
      accent: 'bg-teal-500',
    },
    size: {
      small: 'px-5 py-3 text-xs',
      large: 'px-6 py-4 text-base',
    },
  },
});
```

The result is a react component:

```tsx
<Button type="submit" color="brand" size="large" className="px-8">
  Click me!
</Button>
```

Component will be rendered as:

```html
<button
  type="submit"
  className="rounded text-white bg-sky-500 py-4 text-base px-8"
>
  Click me!
</button>
```

As a value for classes, you can use a `"string"`, an `"array"` of strings, or `"null"`:

```tsx
import { styled } from 'react-tailwind-variants';

const Button = styled('button', {
  base: ['rounded', 'text-white'],
  variants: {
    color: {
      none: null,
      brand: 'bg-sky-500',
      accent: 'bg-teal-500',
    },
  },
});
```

---

### Boolean variants

Variants can be of type `boolean` by using `"true"` or/and `"false"` as the key:

```tsx
import { styled } from 'react-tailwind-variants';

const Button = styled('button', {
  base: 'text-white',
  variants: {
    rounded: {
      true: 'rounded-full',
    },
  },
});
```

---

### Compound variants

The `compoundVariants` option can be used to apply class names based on a combination of other variants.

```tsx
import { styled } from 'react-tailwind-variants';

const Button = styled('button', {
  base: 'text-base'
  variants: {
    variant: {
      none: null,
      filled: 'bg-blue-500 text-white',
      outlined: 'border border-blue-500 text-blue-500',
      plain: 'bg-transparent text-blue-500',
    },
    size: {
      sm: 'px-3 py-1.5'
      md: 'px-4 py-2'
      lg: 'px-6 py-3'
    },
  },
  compoundVariants: [
    {
      variants: {
        variant: ['filled', 'outlined'],
        size: 'sm'
      },
      className: 'text-sm'
    },
    {
      // `compoundVariants` className takes
      // precedence over `variants`,
      // so in this case the class `p-0`
      // will override `padding` classes
      variants: {
        variant: 'none'
      },
      className: 'p-0'
    },
  ],
});
```

```tsx
<Button variant="outlined" size="sm">Outlined button</Button>
<Button variant="none" size="sm">Unstyled button</Button>
```

will be rendered as:

```html
<button
  class="text-base border border-blue-500 text-blue-500 px-3 py-1.5 text-sm"
>
  Outlined button
</button>
<button class="text-base p-0">Unstyled button</button>
```

---

### Default variants

The `defaultVariants` option can be used to select a variant by default.
All non-boolean variants for which no default values are specified are required.
If no default value is specified for boolean options, it evaluates to "false"

Below is an example with a component that has a required `size` and an optional `color` variants

```tsx
import { styled } from 'react-tailwind-variants';

const Button = styled('button', {
  variants: {
    color: {
      brand: 'bg-sky-500',
      accent: 'bg-teal-500',
    },
    size: {
      small: 'px-5 py-3 text-xs',
      large: 'px-6 py-4 text-base',
    },
    elevated: {
      true: 'shadow',
    },
  },
  defaultVariants: {
    color: 'neutral',
  },
});
```

---

### Polymorphic components

If you want to keep all the variants you have defined for a component but want to render a different HTML tag or a different custom component, you can use the `"asChild"` prop to do so:

```tsx
import { styled } from 'react-tailwind-variants';

const Button = styled('button', {
  base: 'rounded text-white',
  variants: {
    color: {
      brand: 'bg-sky-500',
      accent: 'bg-teal-500',
    },
    size: {
      small: 'px-5 py-3 text-xs',
      large: 'px-6 py-4 text-base',
    },
  },
});
```

```tsx
<Button asChild color="brand" size="large">
  <a href="/test" className="mt-4 mb-2">
    Button as link
  </a>
</Button>
```

will be rendered as:

```html
<a
  href="/test"
  className="rounded text-white bg-sky-500 px-6 py-4 text-base mt-4 mb-2"
>
  Button as link
</a>
```

---

### Composing components

Composing one styled component into another.

1. Components can be composed via the `styled` function.

```tsx
import { styled } from 'react-tailwind-variants';

const BaseButton = styled('button', {
  base: 'text-center bg-blue-500 text-white',
  variants: {
    size: {
      small: 'px-5 py-3 text-xs',
      large: 'px-6 py-4 text-base',
    },
  },
});

const Button = styled(BaseButton, {
  base: 'rounded text-white',
  variants: {
    color: {
      brand: 'bg-sky-500',
      accent: 'bg-teal-500',
    },
  },
});
```

```tsx
<Button type="submit" color="brand" size="large">
  Click me!
</Button>
```

will be rendered as:

```html
<button
  type="submit"
  className="text-center text-white px-6 py-4 text-base rounded text-white bg-sky-500"
>
  Click me!
</button>
```

2. You can also achieve the same result using `"asChild"` prop:

```tsx
import { styled } from 'react-tailwind-variants';

const BaseButton = styled('button', {
  base: 'text-center bg-blue-500 text-white',
  variants: {
    size: {
      small: 'px-5 py-3 text-xs',
      large: 'px-6 py-4 text-base',
    },
  },
});

const Button = styled('button', {
  base: 'rounded text-white',
  variants: {
    color: {
      brand: 'bg-sky-500',
      accent: 'bg-teal-500',
    },
  },
});
```

```tsx
<BaseButton asChild size="large">
  <Button type="submit" color="brand">
    Click me!
  </Button>
</Button>
```

will be rendered as:

```html
<button
  type="submit"
  className="text-center text-white px-6 py-4 text-base rounded text-white bg-sky-500"
>
  Click me!
</button>
```

---

### Utilities

#### `variants(config)`

The function accepts variants config as argument and returns a `className` builder function

```ts
import { variants } from 'react-tailwind-variants';

const buttonVariants = variants({
  base: 'rounded text-white',
  variants: {
    color: {
      brand: 'bg-sky-500',
      accent: 'bg-teal-500',
    },
    size: {
      small: 'px-5 py-3 text-xs',
      large: 'px-6 py-4 text-base',
    },
  },
});

console.log(
  buttonVariants({
    color: 'brand',
    size: 'small',
    className: 'text-sky-900 px-8',
  })
);
// Console output:
// 'rounded bg-sky-500 py-3 text-xs text-sky-900 px-8'
```

#### `variantProps(config)`

The function accepts variants config as argument and returns props builder function

```ts
import { variantProps } from 'react-tailwind-variants';

const buttonVariantProps = variantProps({
  base: 'rounded text-white',
  variants: {
    color: {
      brand: 'bg-sky-500',
      accent: 'bg-teal-500',
    },
    size: {
      small: 'px-5 py-3 text-xs',
      large: 'px-6 py-4 text-base',
    },
  },
});

console.log(
  buttonVariantProps({
    color: 'brand',
    size: 'small',
    className: 'text-sky-900 px-8',
    type: 'button',
    onClick: e => {
      // ...
    },
  })
);
// Console output:
// {
//   className: 'rounded bg-sky-500 py-3 text-xs text-sky-900 px-8'
//   type: "button",
//   onClick: ...
// }
```

#### `extractVariantsConfig(component)`

The function accepts a component from which it extracts the configuration of variants

```ts
import { styled, extractVariantsConfig } from 'react-tailwind-variants';

const Button = styled('button', {
  base: ['rounded', 'text-white'],
  variants: {
    color: {
      none: null,
      brand: 'bg-sky-500',
      accent: 'bg-teal-500',
    },
  },
});

console.log(extractVariantsConfig(Button));
// Console output:
// {
//   base: ['rounded', 'text-white'],
//   variants: {
//     color: {
//       none: null,
//       brand: 'bg-sky-500',
//       accent: 'bg-teal-500',
//     },
//   },
// }
```

### Typescript utilities

#### `VariantsConfigOf<Component>`

A utility that allows you to extract the configuration type from the component type

```ts
import { type VariantsConfigOf, styled } from 'react-tailwind-variants';

const Button = styled('button', {
  base: ['rounded', 'text-white'],
  variants: {
    color: {
      none: null,
      brand: 'bg-sky-500',
      accent: 'bg-teal-500',
    },
  },
});

type ButtonVariantsConfig = VariantsConfigOf<typeof Button>;
```

#### `VariantPropsOf<Component>`

A utility that allows you to extract the variant props type from the component type

```ts
import { type VariantPropsOf, styled } from 'react-tailwind-variants';

const Button = styled('button', {
  base: ['rounded', 'text-white'],
  variants: {
    color: {
      none: null,
      brand: 'bg-sky-500',
      accent: 'bg-teal-500',
    },
  },
});

type ButtonVariantProps = VariantPropsOf<typeof Button>;
```

### Tailwind CSS IntelliSense

In order to get auto-completion for the CSS classes themselves, you can use the [Tailwind CSS IntelliSense](https://github.com/tailwindlabs/tailwindcss-intellisense) plugin for VS Code. In order to make it recognize the strings inside your variants-config, you have to somehow mark them and configure the plugin accordingly.

One way of doing so is by using tagged template literals:

```ts
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

You can then add the following line to your `settings.json`:

```
"tailwindCSS.experimental.classRegex": ["tw`(\\`|[^`]+?)`"]
```

> **Note**
> The `tw` helper function is just an alias for [`String.raw`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/raw).

[npm-img]: https://img.shields.io/npm/v/react-tailwind-variants
[npm-url]: https://www.npmjs.com/package/react-tailwind-variants
[bundle-size-img]: https://img.shields.io/bundlephobia/minzip/react-tailwind-variants
[bundle-size-url]: https://bundlephobia.com/package/react-tailwind-variants
[downloads-img]: https://img.shields.io/npm/dt/react-tailwind-variants
[downloads-url]: https://www.npmtrends.com/react-tailwind-variants
