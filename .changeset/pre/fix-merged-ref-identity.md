---
'react-class-variants': patch
---

Memoize merged refs in the `styled()` render paths per ref pair. The render-prop and `host.render()` paths previously created a new callback ref every render, so React detached (`null`) and re-attached both underlying refs on every re-render; stable ref pairs now keep one identity across renders.
