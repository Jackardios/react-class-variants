---
'react-class-variants': patch
---

Fix public type gaps so the published package more accurately matches runtime behavior:

- keep function-form `variantComponent(...).render` callbacks intentionally broad for ergonomic cross-element composition
- allow `variantPropsResolver()` to accept `ClassNameValue` inputs and still return a flattened `className: string`
- make `mergeProps()` use override-wins types for overlapping keys instead of impossible intersections like `never`
