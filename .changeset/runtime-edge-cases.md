---
'react-class-variants': patch
---

Fix three runtime edge cases:

- `cache: { maxSize: Infinity }` keeps every entry. It used to disable the cache.
- Strict mode deep-freezes the nested maps of a config that is already frozen. `Object.freeze()` is shallow, and the deep freeze stopped at the frozen root.
- `hostSlot: ''` reports `hostSlot "" is not declared in recipe.slots`. The error used to say that a root slot was missing.
