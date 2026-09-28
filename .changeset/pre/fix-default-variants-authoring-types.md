---
'react-class-variants': patch
---

Tighten `defaultVariants` authoring types for `recipe()` and `defineRecipeConfig()` so editors surface the declared variant keys and values, while unknown `defaultVariants` keys now fail type checking.
