# API Reference

This document describes the current v2 alpha surface.

## Package Root

```ts
import {
  defineConfig,
  defineRecipeConfig,
  hasOwnProperty,
  mergeProps,
  mergeRefs,
  recipe,
  styled,
  useMergeRefs,
} from 'react-class-variants';
```

The `react-class-variants/core` subpath exposes:

- `recipe()`
- `defineConfig()`
- `defineRecipeConfig()`
- `hasOwnProperty()`
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
        root: 'bg-blue text-white',
        icon: 'text-blue-100',
      },
    },
  },
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
const slots = buttonRecipe({ tone: 'primary' });

slots.root();
slots.icon({ className: 'text-red-500' });
```

Rules:

- top-level slot recipe calls do not accept `className`
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
const Button = styled('button', buttonRecipe);
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
    'aria-busy': variants.loading || undefined,
    children: (
      <>
        <span className={icon()} />
        <span className={label()}>{host.children}</span>
      </>
    ),
  });
}

const Button = styled('button', buttonRecipe, {
  withRender: true,
  forwardProps: ['loading'],
  view: ButtonView,
});
```

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
  hostSlot?: string;
  view: ComponentType<SlotStyledViewProps<...>>;
};
```

If the recipe does not declare a `root` slot, `hostSlot` is required.

## `view` Model

`view` is a real React component surface, not a callback DSL.

Guidance:

- prefer a named component reference such as `view: ButtonView` when you plan to use hooks so hook linting stays happy
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

For slotted views:

- `classes` is a readonly slot render map
- `classes` may be safely destructured
- local slot overrides still recompute compounds against the merged local selection

## `render`

`render` is available only when `withRender: true` and the base is intrinsic.

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
- you always receive the resolved `className`, `children`, `ref`, and normalized host props

## `defineConfig(options?)`

```ts
const { recipe, styled } = defineConfig(options);
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
- applies to root results
- applies to each slot render result

### `validate`

- `'dev'`: strict validation in non-production environments
- `'always'`: strict validation everywhere
- `'never'`: lean runtime with no validation

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

It returns the original config reference unchanged.

## Utilities

### `mergeProps(base, overrides)`

- concatenates `className`
- shallow-merges `style`
- composes event handlers with override first

### `mergeRefs(...refs)`

Creates one merged ref callback without hooks.

### `useMergeRefs(...refs)`

Hook version of `mergeRefs()`.

### `hasOwnProperty(object, prop)`

Type-narrowed own-property guard.

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

## Common Errors

| Error                                                                 | Cause                                                         | Fix                                           |
| --------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| `unknown recipe prop "type"`                                          | direct recipe calls are variant-only APIs                     | use `resolve()` when you need arbitrary props |
| `className cannot be passed directly to a slotted recipe call`        | slot recipes route class overrides at the slot-function level | use a slot renderer or `resolve()`            |
| `slotted recipes require a view component`                            | slot recipes no longer accept the default direct host path    | pass `view` to `styled()`                     |
| `prop alias target "className" conflicts with a reserved public prop` | aliasing would shadow a reserved React prop                   | choose a different alias                      |
| `forwardProps key "x" is not declared in variants`                    | `forwardProps` references a non-existent variant              | only forward declared variant keys            |

## Related Docs

- [Recipes and components guide](./recipes-and-components.md)
- [Migration guide](./migration-from-react-tailwind-variants.md)
