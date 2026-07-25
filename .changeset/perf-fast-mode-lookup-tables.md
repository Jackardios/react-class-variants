---
'react-class-variants': patch
---

Rebuild compiled lookup tables (variant index, variant options, slot index) as fast-mode null-prototype objects: they are populated as plain objects and sealed with `Object.setPrototypeOf(table, null)` — the slot index eagerly at compile time, variant options lazily on the first recipe call. This restores pre-hardening slot-render throughput, recipe-creation throughput, and per-recipe memory that dictionary-mode tables had cost, while prototype-named keys and polluted `Object.prototype` entries stay unreachable on every read path. Config keys named `__proto__` (slot names, option keys, variant keys) keep compiling as regular own keys.
