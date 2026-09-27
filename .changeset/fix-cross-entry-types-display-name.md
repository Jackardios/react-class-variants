---
'react-class-variants': patch
---

Fix type helpers across entry points and the default `styled()` display name.

- Package-root type helpers (`VariantProps`, `ResolvedVariantProps`, `RecipeInput`, `RecipeResolved`, `RecipeConfigOf`, `VariantName`, `SlotNames`, `variantNames()`, `variantOptions()`) no longer resolve to `never` for recipes created through `react-class-variants/core` (and vice versa). The two entries ship separate declaration files, so the recipe brand is now a type-only string key instead of a per-file `unique symbol`, and `AnyRootRecipe` / `AnySlotRecipe` accept recipes with boolean variants from either entry.
- `styled()` now derives its default `displayName` from the base component's `displayName` or function name (unwrapping `forwardRef` and `memo`), for example `Styled(RouterLink)`. Previously component bases produced the full function source or `Styled([object Object])`.
