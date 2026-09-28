---
'react-class-variants': major
---

First stable release of v2. The package is now published as `react-class-variants` (v1 shipped as `react-tailwind-variants`), and the API is a redesign: follow the [migration guide](https://github.com/Jackardios/react-class-variants/blob/v2.0.0/docs/migration-from-react-tailwind-variants.md) to upgrade from v1. The `2.0.0-alpha.*` sections of the [changelog](https://github.com/Jackardios/react-class-variants/blob/v2.0.0/CHANGELOG.md) record every change made during the alpha.

**Requirements**

- ESM-only, with the package root and a `react-class-variants/core` subpath.
- Node.js 22.12 or newer and React 19. The published JavaScript targets ES2020.
- TypeScript 5.4 or newer for the published types.

**API**

- `recipe()` is the single styling primitive. `base` builds a root recipe that returns a class string; `slots` builds a slotted recipe that returns one class function per slot. `recipe.resolve()` splits variant props from a full prop bag and supports `propAliases` and `forwardProps`.
- `defineConfig()` shares a `merge` function such as `tailwind-merge`, strict validation (`validate: 'always'`), and the result cache that root recipes use when `merge` is set. It returns `{ recipe, styled }`.
- `styled()` builds plain React 19 function components, with `ref` as a regular prop, from intrinsic elements or custom components. Slotted recipes render through `view`, `withRender` adds a `render` prop to intrinsic bases, and `defineViewProps()` declares props that only `view` consumes.
- `react-class-variants/core` exposes the recipe API without importing React.
- Helpers: `defineRecipeConfig()`, `variantNames()`, `variantOptions()`, `hasOwnProperty()`, `mergeProps()`, `mergeRefs()`, and `useMergeRefs()`.
