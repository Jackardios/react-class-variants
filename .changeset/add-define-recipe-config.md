---
'react-class-variants': minor
---

Add `defineRecipeConfig()` as a zero-cost typed helper on the package root and the `/core` and `/react` subpath exports, remove the runtime `recipe.config` property in favor of storing configs separately, and tighten recipe creation performance with production-oriented compilation fast paths for root and slotted recipes.
