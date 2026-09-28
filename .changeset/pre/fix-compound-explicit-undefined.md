---
'react-class-variants': patch
---

Treat explicitly `undefined` compound selector values as absent keys in both runtimes, consistent with `defaultVariants` and input props. Strict mode no longer throws at recipe creation for them, and the lean runtime no longer compiles them into matches-only-when-unset selectors. `undefined` entries inside selector arrays are filtered out; an array that ends up empty never matches.
