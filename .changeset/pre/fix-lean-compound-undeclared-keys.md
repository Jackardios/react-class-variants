---
'react-class-variants': patch
---

Drop compound variants that reference undeclared variant keys in the lean runtime. Previously the unknown key was skipped but the compound's `className` still compiled, so the compound applied on every render; it now never applies, matching cva/tailwind-variants semantics. Strict mode (`validate: 'always'`) keeps throwing at recipe creation.
