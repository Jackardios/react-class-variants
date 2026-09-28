---
'react-class-variants': patch
---

Throw a descriptive error when `styled()`, `variantNames()`, or `variantOptions()` receives a function without compiled recipe metadata, and when `styled()` receives `null` or `undefined`, instead of an opaque `TypeError`. The message also hints at duplicated copies of the package, the other way a real recipe can lose its per-module brand.
