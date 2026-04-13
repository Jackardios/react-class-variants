---
'react-class-variants': minor
---

Add `defineRecipeConfig()` as a zero-cost typed helper on the package root and `react-class-variants/core`, remove the runtime `recipe.config` property in favor of keeping recipe configs explicit, accept readonly string arrays across `ClassNameValue`-backed recipe fields, and tighten recipe creation performance with production-oriented compilation fast paths for root and slotted recipes.
