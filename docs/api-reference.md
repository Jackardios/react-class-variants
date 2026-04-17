# API Reference

This document covers the primary user-facing v2 alpha APIs and public helpers:
`recipe()`, `recipe.resolve()`, `styled()`, `defineConfig()`,
`defineRecipeConfig()`, `view`, `render`, and the exported utilities.

Use this page as a reference, not as a tutorial. For guided examples and recommended patterns, start with the [recipes and components guide](./recipes-and-components.md).

## Primary Package Root APIs

```ts
import {
  defineConfig,
  defineRecipeConfig,
  recipe,
  styled,
} from 'react-class-variants';
```

For recipe-only modules, the primary `react-class-variants/core` APIs covered
here are:

- `recipe()`
- `defineConfig()`
- `defineRecipeConfig()`
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
});
```

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

`styled()` is the only high-level React builder.

### Supported bases

- intrinsic tags such as `'button'`, `'input'`, `'label'`, `'a'`
- custom React components

Rules:

- only intrinsic bases support `withRender`
- slotted recipes require `view`
- root recipes may omit `view`
- custom bases should accept and forward `className`, `children`, and `ref` when those behaviors matter

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
function BadgeView({ host, variants }) {
  return host.render({
    'data-tone': variants.tone,
    children: host.children,
  });
}

const Badge = styled('span', badgeRecipe, {
  view: BadgeView,
});
```

### Slot recipe, `view`

```tsx
function ButtonView({ host, classes, variants }) {
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
`Styled(button)` or `Styled(RouterLink)`.

Example:

```ts
const Button = styled('button', buttonRecipe, {
  displayName: 'Button',
});
```

Use this when you want a clearer component name in React DevTools, error
stacks, or profiling output.

### Root recipe options

```ts
type RootStyledOptions = StyledOptionsCommon & {
  withRender?: boolean;
  view?: ComponentType<RootStyledViewProps<...>>;
};
```

### Slot recipe options

```ts
type SlotStyledOptions = StyledOptionsCommon & {
  withRender?: boolean;
  view: ComponentType<SlotStyledViewProps<...>>;
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
- `host.className` is already final for the rendered host
- `host.render()` renders the base with optional overrides
- `host.render({ className })` appends to the resolved host class string
- `host.render()` reuses the current `host.children` unless you override `children`
- for slotted recipes, external component `className` is routed automatically to the host slot
- for slotted recipes, top-level `slotClassNames` applies to the matching slots before local slot-function `className` overrides

Important note:

- call `host.render(...)` directly as a method
- do not destructure `render` from `host`
- this is intentional: keeping `host.render` method-shaped avoids allocating one extra function per `view` render

Example:

```tsx
function ActionView({ host }) {
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

```tsx
import { recipe, styled } from 'react-class-variants';

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

- `className` is concatenated
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
  merge?: (className: string) => string;
  validate?: 'never' | 'always';
};
```

### `merge`

- runs after class resolution
- applies to root results
- applies to each slot render result

### `validate`

- `'always'`: strict validation everywhere
- `'never'`: lean runtime with no validation

Example:

```ts
const strict = defineConfig({ validate: 'always' });
const lean = defineConfig({ validate: 'never' });
```

Package root and core are lean by default. Use `'always'` in strict test
fixtures or shared packages, and use `'never'` when you want to force the lean
path explicitly.

## `defineRecipeConfig(config)`

`defineRecipeConfig()` is a typed identity helper:

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

It returns the original config reference unchanged and preserves `defaultVariants` editor completions plus exact key/value checking when you keep a config object in a variable.

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

Use this in non-hook code such as `cloneElement()` or conditional branches.

### `useMergeRefs(...refs)`

- exported from the package root
- memoized hook form of `mergeRefs(...)`

Use this inside React components when you need one ref prop to update multiple
refs.

## React Type Exports

- `AnyElementType`
- `PropAliases`
- `RenderFunctionProps`
- `RenderProp`
- `StyledComponentProps`
- `HostRenderOverrides`
- `HostView`
- `RootStyledOptions`
- `SlotStyledOptions`
- `RootStyledViewProps`
- `SlotStyledViewProps`
- `StyledFn`

## Common Errors

| Error                                                                    | Cause                                                         | Fix                                           |
| ------------------------------------------------------------------------ | ------------------------------------------------------------- | --------------------------------------------- |
| `unknown recipe prop "type"`                                             | direct recipe calls are variant-only APIs                     | use `resolve()` when you need arbitrary props |
| `className cannot be passed directly to a slotted recipe call`           | slot recipes route class overrides at the slot-function level | use a slot renderer or `resolve()`            |
| `slotted recipes require a view component`                               | slot recipes no longer accept the default direct host path    | pass `view` to `styled()`                     |
| `slotted recipes without a "root" slot require hostSlot`                 | the recipe has no default host slot                           | provide `hostSlot` with a declared slot name  |
| `hostSlot "x" is not declared in recipe.slots`                           | `hostSlot` references an unknown slot                         | use one of the declared slot names            |
| `invalid input.slotClassNames; slot "x" is not declared in recipe.slots` | `slotClassNames` targets an unknown slot                      | only override declared slots                  |
| `variant key "slotClassNames" is reserved`                               | `slotClassNames` cannot also be a variant name                | rename the variant key                        |
| `prop alias target "className" conflicts with a reserved public prop`    | aliasing would shadow a reserved React prop                   | choose a different alias                      |
| `forwardProps key "x" is not declared in variants`                       | `forwardProps` references a non-existent variant              | only forward declared variant keys            |

## Related Docs

- [Recipes and components guide](./recipes-and-components.md)
- [Migration guide](./migration-from-react-tailwind-variants.md)
