# React Class Variants

[![npm version](https://img.shields.io/npm/v/react-class-variants.svg)](https://www.npmjs.com/package/react-class-variants)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-class-variants)](https://bundlephobia.com/package/react-class-variants)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, type-safe library for building composable React components with dynamic CSS class variations. Works seamlessly with **Tailwind CSS**, **CSS Modules**, or any CSS solution.

## Why React Class Variants?

Building UI components often requires managing multiple visual states and combinations. React Class Variants provides a powerful API inspired by [Stitches.js](https://stitches.dev/) that makes this trivial:

```tsx
// Define variants once
const Button = variantComponent('button', {
  variants: {
    color: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-500 text-white',
    },
    size: {
      sm: 'px-3 py-1 text-sm',
      lg: 'px-6 py-3 text-lg',
    },
  },
});

// Use anywhere with full type safety
<Button color="primary" size="lg">
  Click me
</Button>;
```

No more messy `className` logic, no more props duplication, just clean, type-safe components.

## Features

- **🎯 Type-Safe** - Automatic TypeScript inference for all variant combinations
- **🎨 Flexible** - Works with Tailwind CSS, CSS Modules, or plain CSS classes
- **⚡ Lightweight** - Zero dependencies (~2KB minified + gzipped)
- **🔀 Compound Variants** - Apply styles based on multiple variant combinations
- **🎭 Polymorphic** - Render components as different elements with full type safety
- **🔧 Smart Merging** - Optional class conflict resolution via `tailwind-merge` or custom function
- **📦 Tree-Shakeable** - Import only what you need
- **⚛️ React 19 Ready** - Full support for modern React

## Table of Contents

- [Why React Class Variants?](#why-react-class-variants)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [1. Basic Usage](#1-basic-usage)
  - [2. Creating Components](#2-creating-components)
  - [3. With Tailwind Merge (Recommended for Tailwind CSS)](#3-with-tailwind-merge-recommended-for-tailwind-css)
- [Tailwind CSS IntelliSense](#tailwind-css-intellisense)
  - [Setting Up VS Code](#setting-up-vs-code)
- [Core Concepts](#core-concepts)
  - [Variants](#variants)
  - [Boolean Variants](#boolean-variants)
  - [Compound Variants](#compound-variants)
  - [Default Variants](#default-variants)
  - [Polymorphic Components](#polymorphic-components)
- [API Reference](#api-reference)
  - [defineConfig(options?)](#defineconfigoptions)
  - [variants(config)](#variantsconfig)
  - [variantComponent(element, config)](#variantcomponentelement-config)
  - [variantPropsResolver(config)](#variantpropsresolverconfig)
- [TypeScript](#typescript)
  - [Type Inference](#type-inference)
  - [Optional vs Required](#optional-vs-required)
  - [Type Utilities](#type-utilities)
- [Usage with Different CSS Solutions](#usage-with-different-css-solutions)
  - [Tailwind CSS](#tailwind-css)
  - [CSS Modules](#css-modules)
  - [Plain CSS](#plain-css)
  - [Mixed Approaches](#mixed-approaches)
- [Real-World Examples](#real-world-examples)
  - [Button Component](#button-component)
  - [Card Component](#card-component)
  - [Badge Component](#badge-component)
  - [Input Component](#input-component)
- [Advanced Patterns](#advanced-patterns)
  - [Sharing Configurations](#sharing-configurations)
  - [Extending Components](#extending-components)
  - [Dynamic Variants](#dynamic-variants)
  - [Forwarding Variant Props](#forwarding-variant-props)
- [Performance](#performance)
- [Comparison](#comparison)
- [Contributing](#contributing)
- [License](#license)
- [Links](#links)

## Installation

```bash
npm install react-class-variants
```

```bash
yarn add react-class-variants
```

```bash
pnpm add react-class-variants
```

**Optional:** For Tailwind CSS class conflict resolution:

```bash
npm install tailwind-merge
```

## Quick Start

### 1. Basic Usage

```tsx
import { defineConfig } from 'react-class-variants';

const { variants } = defineConfig();

// Create a variant function
const buttonClasses = variants({
  base: 'font-semibold rounded transition',
  variants: {
    color: {
      blue: 'bg-blue-500 text-white hover:bg-blue-600',
      gray: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    },
  },
});

// Use it
function MyButton() {
  return <button className={buttonClasses({ color: 'blue' })}>Click me</button>;
}
```

### 2. Creating Components

```tsx
import { defineConfig } from 'react-class-variants';

const { variantComponent } = defineConfig();

const Button = variantComponent('button', {
  base: 'font-semibold rounded transition',
  variants: {
    color: {
      blue: 'bg-blue-500 text-white hover:bg-blue-600',
      gray: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    },
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    },
  },
  defaultVariants: {
    color: 'blue',
    size: 'md',
  },
});

// Component is fully typed!
function App() {
  return (
    <Button color="gray" size="lg">
      Hello
    </Button>
  );
}
```

### 3. With Tailwind Merge (Recommended for Tailwind CSS)

```tsx
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

// Configure once for your entire app
const { variants, variantComponent } = defineConfig({
  onClassesMerged: twMerge, // Handles conflicting Tailwind classes
});

const Button = variantComponent('button', {
  base: 'px-4 py-2', // These get properly merged...
  variants: {
    spacing: {
      tight: 'px-2 py-1', // ...with these
      wide: 'px-8 py-4',
    },
  },
});

// px-4 from base is overridden by px-2 from variant
<Button spacing="tight" />;
```

## Tailwind CSS IntelliSense

If you're using Tailwind CSS, you can enable autocompletion and syntax highlighting for class names inside your variant configurations.

### Setting Up VS Code

1. Install the [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) extension for VS Code

2. Add the following configuration to your VS Code `settings.json`:

```json
{
  "tailwindCSS.classFunctions": [
    "variants",
    "variantPropsResolver",
    "variantComponent"
  ]
}
```

3. Now you'll get full IntelliSense support in your variant configurations:

```tsx
import { defineConfig } from 'react-class-variants';

const { variantComponent } = defineConfig();

const Button = variantComponent('button', {
  base: 'px-5 py-2 text-white transition-colors',
  variants: {
    color: {
      neutral: 'bg-slate-500 hover:bg-slate-400', // Full IntelliSense here
      accent: 'bg-teal-500 hover:bg-teal-400',
    },
    size: {
      sm: 'text-sm',
      lg: 'text-lg',
    },
  },
});
```

You'll get:

- Autocompletion for Tailwind classes
- Hover previews showing the actual CSS
- Linting for invalid or conflicting classes
- Color decorators

## Core Concepts

### Variants

Variants are different visual states of a component:

```tsx
const alert = variants({
  variants: {
    variant: {
      info: 'bg-blue-100 text-blue-900 border-blue-200',
      success: 'bg-green-100 text-green-900 border-green-200',
      warning: 'bg-yellow-100 text-yellow-900 border-yellow-200',
      error: 'bg-red-100 text-red-900 border-red-200',
    },
  },
});

alert({ variant: 'success' }); // Returns success classes
```

### Boolean Variants

Use `"true"` and `"false"` string keys for boolean props:

```tsx
const button = variants({
  variants: {
    outlined: {
      true: 'border-2 bg-transparent',
      false: 'border-0',
    },
    disabled: {
      true: 'opacity-50 cursor-not-allowed',
    },
  },
});

// Usage
<Button outlined /> // outlined: true
<Button outlined={false} /> // outlined: false
<Button disabled /> // disabled: true
```

### Compound Variants

Apply styles when multiple variants match:

```tsx
const button = variants({
  variants: {
    color: {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-500',
    },
    size: {
      sm: 'text-sm',
      lg: 'text-lg',
    },
  },
  compoundVariants: [
    {
      variants: {
        color: 'primary',
        size: 'lg',
      },
      className: 'font-bold shadow-lg',
    },
  ],
});

// Gets: bg-blue-500 + text-lg + font-bold shadow-lg
button({ color: 'primary', size: 'lg' });
```

Compound variants support array matching (OR condition):

```tsx
compoundVariants: [
  {
    variants: {
      color: ['primary', 'secondary'], // Matches if primary OR secondary
      size: 'lg',
    },
    className: 'uppercase',
  },
];
```

### Default Variants

Make variants optional by providing defaults:

```tsx
const button = variants({
  variants: {
    color: {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-500',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    color: 'primary', // Now optional
    size: 'md', // Now optional
  },
});

// All equivalent:
button({});
button({ color: 'primary' });
button({ size: 'md' });
button({ color: 'primary', size: 'md' });
```

### Polymorphic Components

Render components as different elements while preserving styles:

```tsx
const Button = variantComponent('button', {
  base: 'px-4 py-2 rounded font-semibold',
  variants: {
    color: {
      primary: 'bg-blue-500 text-white',
    },
  },
});

// Render as a link
<Button color="primary" render={<a href="/home" />}>
  Go Home
</Button>;

// Render with custom component
import { Link } from 'react-router-dom';

<Button color="primary" render={props => <Link {...props} to="/home" />}>
  Go Home
</Button>;
```

Props, refs, and event handlers are automatically merged!

> **Note:** The `render` prop pattern is a well-established composition pattern in the React ecosystem, used by libraries like [Base UI](https://base-ui.com/) and [Ariakit](https://ariakit.org/) for building accessible, composable components.

## API Reference

### `defineConfig(options?)`

Creates a configured factory for creating variants and components.

```typescript
const config = defineConfig({
  onClassesMerged?: (classNames: string) => string;
});
```

**Options:**

- `onClassesMerged` - Function to merge/process final class names (e.g., `twMerge`)

**Returns:**

- `variants` - Function to create class name resolvers
- `variantComponent` - Function to create React components
- `variantPropsResolver` - Function to create props resolvers

---

### `variants(config)`

Creates a function that resolves variant props to class names.

```typescript
const buttonVariants = variants({
  base?: string | string[] | null;
  variants?: {
    [variantName: string]: {
      [variantValue: string]: string | string[] | null;
    };
  };
  compoundVariants?: Array<{
    variants: Record<string, string | string[]>;
    className: string | string[] | null;
  }>;
  defaultVariants?: Record<string, string>;
});
```

**Returns:** `(props) => string`

---

### `variantComponent(element, config)`

Creates a React component with variant support.

```typescript
const Button = variantComponent(
  element: string | React.ComponentType,
  config: VariantsConfig & {
    withoutRenderProp?: boolean;
    forwardProps?: string[];
  }
);
```

**Config Options:**

- All `VariantsConfig` options (`base`, `variants`, `compoundVariants`, `defaultVariants`)
- `withoutRenderProp` - Disables the `render` prop pattern (optional)
- `forwardProps` - Array of variant prop names to forward to the rendered element (optional)

**Component Props:**

- All variant props (inferred from config)
- Native element props (e.g., `onClick`, `disabled`)
- `className` - Additional classes (merged with highest priority)
- `render` - Polymorphic rendering (unless `withoutRenderProp` is true)

---

### `variantPropsResolver(config)`

Creates a function that extracts variant props and resolves them to a className.

```typescript
const resolveButtonProps = variantPropsResolver(config);

const { className, ...rest } = resolveButtonProps({
  color: 'primary',
  size: 'lg',
  onClick: handleClick,
});
// className: resolved variant classes
// rest: { onClick: handleClick }
```

## TypeScript

Full TypeScript support with automatic type inference.

### Type Inference

```typescript
const Button = variantComponent('button', {
  variants: {
    color: {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-500',
    },
    size: {
      sm: 'text-sm',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

// TypeScript knows:
// ✅ color is required (no default)
// ✅ size is optional (has default)
// ✅ color only accepts 'primary' | 'secondary'
// ✅ size only accepts 'sm' | 'lg'

<Button color="primary" />              // ✅
<Button color="invalid" />              // ❌ Type error
<Button size="sm" />                    // ❌ Type error (missing color)
<Button color="primary" size="lg" />    // ✅
```

### Optional vs Required

Variants are **required** by default. They become **optional** when:

1. They are boolean variants (`"true"` / `"false"` keys)
2. They have a value in `defaultVariants`

```typescript
const component = variants({
  variants: {
    color: { red: '...', blue: '...' }, // Required
    size: { sm: '...', lg: '...' }, // Required
    outlined: { true: '...', false: '...' }, // Optional (boolean)
  },
  defaultVariants: {
    size: 'sm', // Makes size optional
  },
});
// color: required
// size: optional (has default)
// outlined: optional (boolean)
```

### Type Utilities

```typescript
import type {
  VariantsConfig,
  VariantOptions,
  ClassNameValue,
  VariantComponentProps,
} from 'react-class-variants';

// Extract config type
type Config = VariantsConfig<typeof myConfig>;

// Extract variant props
type Variants = VariantOptions<typeof myConfig>;

// Use in props
type Props = {
  className?: ClassNameValue;
};
```

## Usage with Different CSS Solutions

### Tailwind CSS

```tsx
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

const { variantComponent } = defineConfig({
  onClassesMerged: twMerge,
});

const Button = variantComponent('button', {
  base: 'rounded font-medium transition-colors',
  variants: {
    color: {
      blue: 'bg-blue-500 hover:bg-blue-600 text-white',
      red: 'bg-red-500 hover:bg-red-600 text-white',
    },
  },
});
```

### CSS Modules

```tsx
import { defineConfig } from 'react-class-variants';
import styles from './Button.module.css';

const { variantComponent } = defineConfig();

const Button = variantComponent('button', {
  base: styles.button,
  variants: {
    color: {
      primary: styles.primary,
      secondary: styles.secondary,
    },
    size: {
      sm: styles.small,
      lg: styles.large,
    },
  },
});
```

### Plain CSS

```tsx
import { defineConfig } from 'react-class-variants';
import './Button.css';

const { variantComponent } = defineConfig();

const Button = variantComponent('button', {
  base: 'btn',
  variants: {
    color: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
    },
  },
});
```

### Mixed Approaches

```tsx
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';
import styles from './Button.module.css';

const { variantComponent } = defineConfig({
  onClassesMerged: twMerge,
});

const Button = variantComponent('button', {
  base: [styles.button, 'transition-all'],
  variants: {
    color: {
      primary: [styles.primary, 'shadow-lg'],
      secondary: [styles.secondary, 'shadow-md'],
    },
  },
});
```

## Real-World Examples

### Button Component

```tsx
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

const { variantComponent } = defineConfig({ onClassesMerged: twMerge });

export const Button = variantComponent('button', {
  base: [
    'inline-flex items-center justify-center',
    'font-medium rounded-lg',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  variants: {
    variant: {
      solid: '',
      outline: 'bg-transparent border-2',
      ghost: 'bg-transparent',
    },
    color: {
      blue: '',
      red: '',
      green: '',
      gray: '',
    },
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    },
  },
  compoundVariants: [
    // Solid variants
    {
      variants: { variant: 'solid', color: 'blue' },
      className: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    },
    {
      variants: { variant: 'solid', color: 'red' },
      className: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    },
    {
      variants: { variant: 'solid', color: 'green' },
      className:
        'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    },
    {
      variants: { variant: 'solid', color: 'gray' },
      className: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    },
    // Outline variants
    {
      variants: { variant: 'outline', color: 'blue' },
      className:
        'border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    },
    {
      variants: { variant: 'outline', color: 'red' },
      className:
        'border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
    },
    // Ghost variants
    {
      variants: { variant: 'ghost', color: 'blue' },
      className: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    },
  ],
  defaultVariants: {
    variant: 'solid',
    color: 'blue',
    size: 'md',
  },
});
```

Usage:

```tsx
<Button>Default</Button>
<Button variant="outline" color="red" size="lg">Outline</Button>
<Button variant="ghost" color="green">Ghost</Button>
<Button disabled>Disabled</Button>
<Button render={<a href="/" />}>Link Button</Button>
```

### Card Component

```tsx
export const Card = variantComponent('div', {
  base: 'rounded-lg overflow-hidden',
  variants: {
    variant: {
      elevated: 'shadow-md hover:shadow-lg transition-shadow',
      outlined: 'border border-gray-200',
      filled: 'bg-gray-50',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'elevated',
    padding: 'md',
  },
});

export const CardHeader = variantComponent('div', {
  base: 'border-b border-gray-200 pb-4 mb-4',
});

export const CardTitle = variantComponent('h3', {
  base: 'text-lg font-semibold text-gray-900',
});

export const CardContent = variantComponent('div', {
  base: 'text-gray-600',
});
```

Usage:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>Card content goes here</CardContent>
</Card>
```

### Badge Component

```tsx
export const Badge = variantComponent('span', {
  base: 'inline-flex items-center font-medium rounded-full',
  variants: {
    variant: {
      solid: '',
      outline: 'border bg-transparent',
      subtle: '',
    },
    color: {
      gray: '',
      blue: '',
      green: '',
      yellow: '',
      red: '',
    },
    size: {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-base',
    },
  },
  compoundVariants: [
    // Solid
    {
      variants: { variant: 'solid', color: 'gray' },
      className: 'bg-gray-100 text-gray-800',
    },
    {
      variants: { variant: 'solid', color: 'blue' },
      className: 'bg-blue-100 text-blue-800',
    },
    {
      variants: { variant: 'solid', color: 'green' },
      className: 'bg-green-100 text-green-800',
    },
    {
      variants: { variant: 'solid', color: 'yellow' },
      className: 'bg-yellow-100 text-yellow-800',
    },
    {
      variants: { variant: 'solid', color: 'red' },
      className: 'bg-red-100 text-red-800',
    },
    // Outline
    {
      variants: { variant: 'outline', color: 'blue' },
      className: 'border-blue-500 text-blue-700',
    },
    // Subtle
    {
      variants: { variant: 'subtle', color: 'blue' },
      className: 'bg-blue-50 text-blue-700',
    },
  ],
  defaultVariants: {
    variant: 'solid',
    color: 'gray',
    size: 'md',
  },
});
```

### Input Component

```tsx
export const Input = variantComponent('input', {
  base: [
    'w-full rounded-md border transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  variants: {
    variant: {
      outline:
        'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200',
      filled:
        'bg-gray-100 border-transparent focus:bg-white focus:ring-blue-200',
      flushed:
        'bg-transparent border-t-0 border-x-0 border-b-2 rounded-none focus:ring-0',
    },
    size: {
      sm: 'px-2 py-1.5 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    },
    error: {
      true: 'border-red-500 focus:border-red-500 focus:ring-red-200',
    },
  },
  defaultVariants: {
    variant: 'outline',
    size: 'md',
  },
});
```

## Advanced Patterns

### Sharing Configurations

```tsx
// config/variants.ts
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

export const { variants, variantComponent } = defineConfig({
  onClassesMerged: twMerge,
});

// components/Button.tsx
import { variantComponent } from '@/config/variants';

export const Button = variantComponent('button', { ... });

// components/Card.tsx
import { variantComponent } from '@/config/variants';

export const Card = variantComponent('div', { ... });
```

### Extending Components

```tsx
const BaseButton = variantComponent('button', {
  base: 'rounded font-medium',
  variants: {
    size: {
      sm: 'px-3 py-1',
      lg: 'px-6 py-3',
    },
  },
});

// Extend with additional props
const IconButton = ({
  icon,
  children,
  ...props
}: React.ComponentProps<typeof BaseButton> & { icon: React.ReactNode }) => {
  return (
    <BaseButton {...props}>
      {icon}
      {children}
    </BaseButton>
  );
};
```

### Dynamic Variants

```tsx
const createColorVariants = (colors: string[]) => {
  return colors.reduce((acc, color) => {
    acc[color] = `bg-${color}-500 text-white hover:bg-${color}-600`;
    return acc;
  }, {} as Record<string, string>);
};

const Button = variantComponent('button', {
  variants: {
    color: createColorVariants(['blue', 'red', 'green', 'purple']),
  },
});
```

### Forwarding Variant Props

By default, variant props are consumed and not passed to the rendered element. Use `forwardProps` to forward specific variant props:

```tsx
const Button = variantComponent('button', {
  base: 'px-4 py-2 rounded font-medium transition-colors',
  variants: {
    color: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    },
    disabled: {
      true: 'opacity-50 cursor-not-allowed',
      false: '',
    },
  },
  // Forward 'disabled' prop to the <button> element
  forwardProps: ['disabled'],
});

// The 'color' prop is consumed (not forwarded)
// The 'disabled' prop is both used for styling AND forwarded as HTML attribute
<Button color="primary" disabled>
  Submit
</Button>;
```

This is useful when you want variant props to also be available as HTML attributes (like `disabled`, `aria-*`, `data-*`) or for integration with third-party components that expect certain props.

## Performance

React Class Variants is optimized for performance:

- **Zero Runtime Dependencies** - Only peer dependency is React
- **Minimal Bundle Size** - ~2KB minified + gzipped
- **Efficient Caching** - Boolean variant lookups are cached
- **No Re-renders** - Components only re-render when props change
- **Tree-Shakeable** - Import only what you use

## Comparison

|                   |      react-class-variants       |   CVA    |     classname-variants      | tailwind-variants | Stitches  |
| ----------------- | :-----------------------------: | :------: | :-------------------------: | :---------------: | --------- |
| Framework         |              React              | Agnostic |            React            |     Agnostic      | React     |
| TypeScript        |               ✅                |    ✅    |             ✅              |        ✅         | ✅        |
| Variants          |               ✅                |    ✅    |             ✅              |        ✅         | ✅        |
| Compound Variants |               ✅                |    ✅    |             ✅              |        ✅         | ✅        |
| React Components  |           ✅ Built-in           |    ❌    |         ✅ Built-in         |        ❌         | ✅        |
| Polymorphic       | ✅ Built-in (via `render` prop) |    ❌    | ✅ Built-in (via `as` prop) |        ❌         | ✅        |
| Forward Props     |        ✅ `forwardProps`        |    ❌    |      ✅ `forwardProps`      |        ❌         | ❌        |
| CSS Solution      |               Any               |   Any    |             Any             |     Tailwind      | CSS-in-JS |

## Contributing

Contributions are welcome! Please check out our [Contributing Guide](CONTRIBUTING.md).

```bash
# Clone the repo
git clone https://github.com/jackardios/react-class-variants.git

# Install dependencies
pnpm install

# Run tests in watch mode
pnpm dev

# Build
pnpm build

# Run all checks
pnpm ci
```

## License

MIT © [Salavat Salakhutdinov](https://github.com/jackardios)

## Links

- [GitHub](https://github.com/jackardios/react-class-variants)
- [npm](https://www.npmjs.com/package/react-class-variants)
- [Issues](https://github.com/jackardios/react-class-variants/issues)
- [Changelog](https://github.com/jackardios/react-class-variants/releases)

---

**Built with ❤️ for the React community**
`
