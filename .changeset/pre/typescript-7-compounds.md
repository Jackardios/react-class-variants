---
'react-class-variants': patch
---

Fix `compoundVariants` type inference on TypeScript 7. TypeScript 7 also inferred the recipe's variants and slots from compound selectors, so boolean selectors (`{ disabled: true }`) and any compound on a slotted recipe failed to compile, and invalid compound options were no longer rejected. Compound selectors no longer take part in inference.

The published types need TypeScript 5.4 or newer (they use `NoInfer`), and CI now type-checks a consumer project with TypeScript 5.4, 5.9, 6, and 7.
