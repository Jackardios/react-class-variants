---
'react-class-variants': patch
---

Narrow the result cache to root recipes. Slotted recipes are no longer cached: each slot resolves into a few short class strings that `merge` (e.g. tailwind-merge) already caches internally, so memoizing per-slot results cost more than it saved. Root recipe caching is unchanged.
