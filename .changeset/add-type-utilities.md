---
'react-class-variants': minor
---

Add advanced type utilities and improve type system

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
