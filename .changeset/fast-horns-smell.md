---
'react-class-variants': major
---

Require React builders to come from `defineConfig()` instead of the package-root
`styled` export.

- remove the top-level `styled` value export from `react-class-variants`
- keep `defineConfig().styled` as the supported React builder entrypoint
- update docs, fixtures, and editor/runtime checks to use configured builders
