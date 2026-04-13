---
'react-class-variants': patch
---

Improve recipe runtime performance by switching the default package-root and
core recipe factories to a lean, process-less-safe path, keeping checked
runtime validation behind explicit `defineConfig({ validate: 'always' })`,
tightening root and slot compilation, aligning lean slot payload storage with
dense indexed slot tables, packing lean compound selectors, and removing
temporary variant-index allocation during compound compilation.
