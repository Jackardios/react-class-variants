---
'react-class-variants': minor
---

Replace the v2 alpha API with the RFC-backed root React surface:

- export `recipe()`, `styled()`, `defineConfig()`, React utilities, and public types from `react-class-variants`
- remove the public `react-class-variants/react` subpath from package exports
- make `recipe()` adapt from config shape into root or slotted recipes
- require explicit slot maps for slotted variant and compound class values
- make slotted `styled()` composition explicit through required `compose`
- keep render polymorphism opt-in through `withRender`
- add reproducible overhead tooling for bundle size, runtime, retained memory, and synthetic TypeScript diagnostics
