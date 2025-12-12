# react-tailwind-variants

## 2.0.0-alpha.2

### Patch Changes

- 5dab28e: Optimize variants resolver function performance by pre-computing boolean variants and caching variant names

## 2.0.0-alpha.1

### Minor Changes

- a145ff8: Add advanced type utilities and improve type system

  **New Type Utilities:**

  - `ExtractVariantOptions<T>` - Universal utility to extract variant props type from any variant function, resolver, or component
  - `ExtractVariantConfig<T>` - Universal utility to extract full variant configuration from any variant function, resolver, or component
  - Enhanced internal type metadata with `__config` property for better type extraction

  **Type System Improvements:**

  - Added `VariantsResolverFn<C, V>` type with config metadata
  - Added `VariantPropsResolverFn<C, V>` type with config metadata
  - Simplified `BaseVariantComponentProps` by removing intermediate `OnlyVariantsConfig` type
  - Better type inference for variant configurations

  **Testing:**

  - Added 150+ lines of comprehensive type tests for new utilities
  - Tests for `ExtractVariantOptions` and `ExtractVariantConfig` working with `variants()`, `variantPropsResolver()`, and `variantComponent()`
  - Improved edge case coverage

  **Documentation:**

  - Added detailed section on type utilities in README
  - Examples for `ExtractVariantOptions` and `ExtractVariantConfig`
  - Usage patterns for extracting types from variant functions and components

  **Developer Experience:**

  - Added `test:types` script to package.json
  - Integrated type tests into CI pipeline
  - Added Vitest coverage and UI tools for better testing experience

## 2.0.0-alpha.0

### Major Changes

- 4285122: Complete v2 refactor with consolidated architecture and enhanced functionality

  **Breaking Changes:**

  - Complete library restructure - all functionality consolidated into single module
  - `styled()` API removed in favor of `variantComponent()`
  - `cx()` utility removed - class merging now handled via `defineConfig({ onClassesMerged })`
  - Changed exports structure - now use `defineConfig()` factory pattern

  **New Features:**

  - `defineConfig(options)` - Factory function for creating variants, variantPropsResolver, and variantComponent with shared configuration
  - `variantComponent()` - Create React components with variants support and polymorphic rendering
  - `variantPropsResolver()` - Extract variant props and resolve className from full props objects
  - Enhanced render prop pattern - supports both React elements and render functions
  - `forwardProps` option - Control which variant props get forwarded to DOM
  - `withoutRenderProp` option - Disable render prop pattern when not needed
  - Improved ref forwarding and merging with `useMergeRefs()`
  - Better event handler and props composition with `mergeProps()`

  **Type System Improvements:**

  - Stronger type inference for optional vs required variants
  - Boolean variants automatically optional
  - Variants with defaults automatically optional
  - Better polymorphic component type support

  **Testing:**

  - Complete comprehensive test suite with 170+ tests
  - Tests for variants resolution, React components, utilities, edge cases, and TypeScript types
  - Vitest + React Testing Library + tsd for type testing

  **Documentation:**

  - Complete README rewrite with all new APIs and examples

## 1.0.3

### Patch Changes

- 32ce10a: allow react v19 and tailwind-merge v2 and v3

## 1.0.2

### Patch Changes

- d57c9b7: typescript should throw an error when passed compoundVariants or defaultVariants with non-existing variants

## 1.0.1

### Patch Changes

- ac2ede4: Fix typings

## 1.0.0

### Major Changes

- 9c6f874: BREAKING CHANGE: set type `VariantsConfig` for `config` argument in `styled` function + fix typings
- 8dda492: BREAKING CHANGE: set `variants` in `VariantsConfig` optional + improve type-hints

## 0.1.3

### Patch Changes

- 0c1a5c5: Add vite.config.ts and .prettierrc files to npmignore
- 78d9d8c: Fix package homepage and bugs url

## 0.1.2

### Patch Changes

- fa364d4: update README.md

## 0.1.1

### Patch Changes

- 382b5b8: add test folder to .npmignore

## 0.1.0

### Minor Changes

- 2adff2e: initial release
