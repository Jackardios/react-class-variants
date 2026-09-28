---
'react-class-variants': patch
---

Improve the public type surface for low-level `recipe.resolve()` calls so
`resolvedProps` tracks exact input props, `propAliases`, `forwardProps`, and
root `className` more accurately. Forwarded variant props exposed to
`styled(..., { withRender: true })` render callbacks are now typed as resolved
values, configured `styled` builders use a single typed symbol with a public
`StyledFn` type for cleaner editor navigation, and declaration builds now emit
stable `index.d.ts` and `core.d.ts` entrypoints without hashed shared
declaration chunks.
