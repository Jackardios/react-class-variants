---
'react-class-variants': major
---

Complete v2 refactor with consolidated architecture and enhanced functionality

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