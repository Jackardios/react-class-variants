# Migration from `react-tailwind-variants`

`react-tailwind-variants` v1 and `react-class-variants` v2 share the same repository, but they are different npm package names.

## What changed

- Package rename: `react-tailwind-variants` -> `react-class-variants`
- Current v2 channel: `alpha`
- Recommended install for v2:

```bash
npm install react-class-variants@alpha
```

- Legacy v1 package remains installable for existing users:

```bash
npm install react-tailwind-variants
```

## Import path changes

```tsx
// v1
import { styled } from 'react-tailwind-variants';

// v2
import { defineConfig } from 'react-class-variants';
```

## API mapping

| v1 | v2 | Notes |
| --- | --- | --- |
| `styled()` | `defineConfig().variantComponent()` | `variantComponent()` replaces the v1 component factory API |
| `variants()` | `defineConfig().variants()` | Same core purpose, now created from `defineConfig()` |
| `variantProps()` | `defineConfig().variantPropsResolver()` | Resolver API renamed and created from `defineConfig()` |
| `cx()` | `defineConfig({ onClassesMerged })` | Use `onClassesMerged` with `tailwind-merge` or a custom merge function |

## Breaking changes to expect

- `defineConfig()` is now the entrypoint for all v2 helpers.
- `styled()` was removed in favor of `variantComponent()`.
- `cx()` was removed; class merging is configured once through `defineConfig({ onClassesMerged })`.
- Exports and examples use the new `react-class-variants` package name.

## Suggested migration path

1. Replace the package dependency with `react-class-variants@alpha`.
2. Swap imports from `react-tailwind-variants` to `react-class-variants`.
3. Create a shared `defineConfig()` instance and derive `variants()`, `variantComponent()`, and `variantPropsResolver()` from it.
4. Replace `styled()` usage with `variantComponent()`.
5. Replace `cx()` usage by wiring `tailwind-merge` or your merge function into `defineConfig({ onClassesMerged })`.
6. Run your type checks and component tests before removing the v1 dependency.

## Legacy docs

Use [react-tailwind-variants-v1.md](./react-tailwind-variants-v1.md) for the legacy line and keep the v1 tag checkout available if you need exact historical examples.
