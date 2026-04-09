# Migration from `react-tailwind-variants` to `react-class-variants`

This guide covers the public migration path from `react-tailwind-variants` v1 (`v1-maintenance`) to `react-class-variants` v2 (`next`, currently `2.0.0-alpha.x`).

The good news: the core variant config model is still familiar. `base`, `variants`, `defaultVariants`, and `compoundVariants` still work the same way. The main changes are the package name, the factory-based entrypoint, the component API, the polymorphism model, the class merging strategy, and some type utilities.

## What stayed the same

- Variant configs still use `base`, `variants`, `defaultVariants`, and `compoundVariants`.
- Class values still support strings, arrays, `null`, and `undefined`.
- Boolean variants still use `"true"` and `"false"` keys and remain optional.
- Variants with defaults remain optional; variants without defaults remain required.
- Compound variants still support matching single values or arrays of values.

## Before you start

- v2 is published under a new package name: `react-class-variants`.
- The current v2 release channel is `alpha`.
- v1 and v2 can coexist in the same application during migration because they have different package names.
- v2 requires `react@^19`, `react-dom@^19`, and Node `>=20.19`.
- `tailwind-merge` is no longer a peer dependency. Install it only if you want Tailwind conflict resolution.
- v2 ships an `exports` map, so import from the package root rather than internal paths.

## Quick checklist

1. Install `react-class-variants@alpha`.
2. Create a shared `defineConfig()` instance.
3. Replace `styled()` with `variantComponent()`.
4. Replace `variantProps()` with `variantPropsResolver()`.
5. Replace `asChild` with the `render` prop.
6. Re-enable Tailwind conflict resolution with `defineConfig({ onClassesMerged: twMerge })` if you relied on it in v1.
7. Replace removed type utilities and remove `tw`.
8. Re-run runtime tests and type checks before removing v1.

## API mapping

| v1                                   | v2                                                | Notes                                                                   |
| ------------------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------- |
| `styled()`                           | `defineConfig().variantComponent()`               | Main component factory                                                  |
| `variants()`                         | `defineConfig().variants()`                       | Same config shape, now created from a shared factory                    |
| `variantProps()`                     | `defineConfig().variantPropsResolver()`           | Same role, new name                                                     |
| `cx()`                               | `defineConfig({ onClassesMerged })`               | No standalone `cx()` export in v2                                       |
| `extractVariantsConfig(component)`   | No runtime equivalent                             | Keep the config object yourself; `ExtractVariantConfig<T>` is type-only |
| `VariantPropsOf<typeof Component>`   | `ExtractVariantOptions<typeof Component>`         | Also works with `variants()` and `variantPropsResolver()`               |
| `VariantsConfigOf<typeof Component>` | `ExtractVariantConfig<typeof Component>`          | Type-only                                                               |
| `StyledComponent`                    | `typeof Component` or `VariantComponentType<...>` | In most app code, `typeof Button` is enough                             |
| `tw`                                 | Removed                                           | Use normal strings or arrays and update Tailwind IntelliSense settings  |
| `CxOptions`, `CxReturn`              | Removed with `cx()`                               | Usually no replacement is needed                                        |

## 1. Replace install and imports

Install v2:

```bash
npm install react-class-variants@alpha
```

Install `tailwind-merge` as well if you want the same Tailwind conflict resolution behavior that v1 had by default:

```bash
npm install tailwind-merge
```

Update imports:

```tsx
// v1
import {
  styled,
  variantProps,
  variants,
  type VariantPropsOf,
} from 'react-tailwind-variants';

// v2
import {
  defineConfig,
  type ExtractVariantOptions,
  type ExtractVariantConfig,
} from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

const { variants, variantComponent, variantPropsResolver } = defineConfig({
  onClassesMerged: twMerge,
});
```

## 2. Create a shared v2 factory

In v1, helpers were exported directly. In v2, you create them from `defineConfig()`. This lets you configure class post-processing once and reuse it everywhere.

```tsx
// variants.config.ts
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

export const { variants, variantComponent, variantPropsResolver } =
  defineConfig({
    onClassesMerged: twMerge,
  });
```

If you do not pass `onClassesMerged`, v2 will only flatten and concatenate class names. Conflicting Tailwind classes will no longer be resolved automatically.

## 3. Migrate `variants()`

The config shape is unchanged. The main difference is that the helper comes from your shared `defineConfig()` instance.

```tsx
// v1
import { variants } from 'react-tailwind-variants';

export const buttonVariants = variants({
  base: 'rounded font-medium',
  variants: {
    color: {
      brand: 'bg-sky-500 text-white',
      accent: 'bg-teal-500 text-white',
    },
  },
  defaultVariants: {
    color: 'brand',
  },
});

// v2
import { variants } from './variants.config';

export const buttonVariants = variants({
  base: 'rounded font-medium',
  variants: {
    color: {
      brand: 'bg-sky-500 text-white',
      accent: 'bg-teal-500 text-white',
    },
  },
  defaultVariants: {
    color: 'brand',
  },
});
```

## 4. Migrate `styled()` to `variantComponent()`

The config itself stays familiar:

```tsx
// v1
import { styled } from 'react-tailwind-variants';

export const Button = styled('button', {
  base: 'rounded font-medium',
  variants: {
    color: {
      brand: 'bg-sky-500 text-white',
      accent: 'bg-teal-500 text-white',
    },
    size: {
      sm: 'px-3 py-2 text-sm',
      lg: 'px-5 py-3 text-base',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

// v2
import { variantComponent } from './variants.config';

export const Button = variantComponent('button', {
  base: 'rounded font-medium',
  variants: {
    color: {
      brand: 'bg-sky-500 text-white',
      accent: 'bg-teal-500 text-white',
    },
    size: {
      sm: 'px-3 py-2 text-sm',
      lg: 'px-5 py-3 text-base',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});
```

If you previously used `styled(BaseButton, config)`, you now have two common options:

- Pass the base component to `variantComponent(BaseButton, config)` when you want another variant layer on top of an existing component.
- Wrap the existing component with `React.ComponentProps<typeof BaseButton>` when you only need extra behavior or extra markup.

## 5. Replace `asChild` with `render`

v1 polymorphism used `asChild` and `@radix-ui/react-slot`. v2 replaces that with a `render` prop.

### Element replacement

```tsx
// v1
<Button asChild color="brand" size="lg">
  <a href="/docs" className="mt-4">
    Docs
  </a>
</Button>

// v2
<Button
  color="brand"
  size="lg"
  render={<a href="/docs" className="mt-4" />}
>
  Docs
</Button>
```

### Function form

Use the function form when you need to adapt props for router links or custom components:

```tsx
<Button color="brand" render={props => <Link {...props} to="/docs" />}>
  Docs
</Button>
```

### Behavior differences to expect

- When `render` receives a React element, that element's props override the resolved props.
- Render functions receive a broad resolved props bag, not all variant props. The typed/stable contract intentionally guarantees spread-safe HTML attributes, `className`, `ref`, and any variant props listed in `forwardProps`.
- `className` values are concatenated.
- `style` objects are shallow-merged.
- React event handlers are composed, and the render element's handler runs first.
- Refs from the component and the render element are merged.

If you do not want polymorphism on a string element component, set `withoutRenderProp: true`. If you pass a custom React component as the base element, the generated component does not expose `render`.

## 6. Migrate `variantProps()` to `variantPropsResolver()`

The purpose is the same: separate variant props from other props and return a resolved `className`.

```tsx
// v1
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

// v2
import { variantPropsResolver } from './variants.config';

const resolveButtonProps = variantPropsResolver({
  base: 'rounded font-medium',
  variants: {
    color: {
      brand: 'bg-sky-500 text-white',
      accent: 'bg-teal-500 text-white',
    },
  },
});
```

By default, variant props are consumed and removed from the resolved props object. If you need specific variant props to survive resolution, use `forwardProps`:

```tsx
const Button = variantComponent('button', {
  variants: {
    disabled: {
      true: 'opacity-50 cursor-not-allowed',
      false: 'opacity-100',
    },
  },
  forwardProps: ['disabled'],
});
```

`forwardProps` keeps those props in the resolved props object, which is useful for valid DOM props like `disabled`, custom components, or `render` functions. It does not force React to keep arbitrary unknown attributes on native DOM elements.

## 7. Re-enable Tailwind conflict resolution explicitly

This is the most important runtime difference.

In v1, `styled()`, `variants()`, and `variantProps()` all ended up going through `cx()`, which used `tailwind-merge` by default. In v2, that behavior is opt-in.

```tsx
import { defineConfig } from 'react-class-variants';
import { twMerge } from 'tailwind-merge';

export const { variants, variantComponent, variantPropsResolver } =
  defineConfig({
    onClassesMerged: twMerge,
  });
```

Without that configuration, conflicting Tailwind classes such as `px-2 px-6` or `bg-blue-500 bg-red-500` will both remain in the final string.

## 8. Replace removed type helpers and runtime extraction

v2 adds better extractor types, but removes the v1 runtime config extractor.

```tsx
// v1
import {
  extractVariantsConfig,
  type VariantPropsOf,
  type VariantsConfigOf,
} from 'react-tailwind-variants';

type ButtonVariants = VariantPropsOf<typeof Button>;
type ButtonConfig = VariantsConfigOf<typeof Button>;
const buttonConfig = extractVariantsConfig(Button);

// v2
import {
  type ExtractVariantOptions,
  type ExtractVariantConfig,
} from 'react-class-variants';

type ButtonVariants = ExtractVariantOptions<typeof Button>;
type ButtonConfig = ExtractVariantConfig<typeof Button>;
```

If you need the config at runtime, keep it in your own variable instead of extracting it from the component:

```tsx
const buttonConfig = {
  base: 'rounded font-medium',
  variants: {
    color: {
      brand: 'bg-sky-500 text-white',
      accent: 'bg-teal-500 text-white',
    },
  },
} as const;

const buttonVariants = variants(buttonConfig);
const Button = variantComponent('button', buttonConfig);
```

`ExtractVariantOptions<T>` and `ExtractVariantConfig<T>` work with all three v2 APIs:

- `variants()`
- `variantPropsResolver()`
- `variantComponent()`

## 9. Remove `tw` and update Tailwind IntelliSense

The v1 `tw` helper is gone. It was only a `String.raw` alias for editor tooling, so in v2 you can use normal strings and arrays directly.

```tsx
// v1
import { styled, tw } from 'react-tailwind-variants';

const Button = styled('button', {
  base: tw`px-5 py-2 text-white`,
  variants: {
    color: {
      neutral: tw`bg-slate-500 hover:bg-slate-400`,
    },
  },
});

// v2
const Button = variantComponent('button', {
  base: 'px-5 py-2 text-white',
  variants: {
    color: {
      neutral: 'bg-slate-500 hover:bg-slate-400',
    },
  },
});
```

Update VS Code Tailwind IntelliSense to use `classFunctions`:

```json
{
  "tailwindCSS.classFunctions": [
    "variants",
    "variantPropsResolver",
    "variantComponent"
  ]
}
```

If you only added `tailwindCSS.experimental.classRegex` for `tw`, you can remove that old setting.

## Breaking changes summary

- Package renamed from `react-tailwind-variants` to `react-class-variants`.
- v2 requires React 19, React DOM 19, and Node 20.19+.
- `defineConfig()` is now the entrypoint for all helper creation.
- `styled()` was replaced by `variantComponent()`.
- `variantProps()` was renamed to `variantPropsResolver()`.
- `cx()` was removed; Tailwind conflict resolution is now opt-in through `onClassesMerged`.
- `asChild` was removed in favor of `render`.
- `extractVariantsConfig()` has no runtime replacement.
- `tw` was removed.
- Some v1 helper types were replaced by the new extractor utilities.

## Legacy docs

Use [react-tailwind-variants-v1.md](./react-tailwind-variants-v1.md) for the frozen v1 line. If you need exact legacy examples while migrating incrementally, keep that document open alongside the v2 [README](../README.md).
