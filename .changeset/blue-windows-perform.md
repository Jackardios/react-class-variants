---
'react-class-variants': patch
---

Improve recipe runtime performance by switching the default `recipe()` path to
an environment-gated lean/strict factory, tightening root and slot compilation,
aligning lean slot payload storage with dense indexed slot tables, packing lean
compound selectors, and removing temporary variant-index allocation during
compound compilation.
