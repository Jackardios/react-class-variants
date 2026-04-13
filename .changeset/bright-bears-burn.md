---
'react-class-variants': minor
---

Replace the v2 alpha API with the RFC-backed root React surface:

- export `recipe()`, `styled()`, `defineConfig()`, React utilities, and public types from `react-class-variants`
- make `recipe()` adapt from config shape into root or slotted recipes
- require explicit slot maps for slotted variant and compound class values
- make `styled()` accept intrinsic tags and custom React component bases
- replace `compose` with hook-safe `view` components and `host` / `classes` view models
- make slotted `classes` maps enumerable so they behave like normal objects in `view` composition
- keep render polymorphism opt-in through `withRender` for intrinsic bases only
- rename `nativeAliases` to `propAliases`
- tighten `propAliases` typing around host prop collisions
- improve editor typing and navigation for slotted recipes and `view`-based styled components
- add reproducible overhead tooling for bundle size, runtime, retained memory, and synthetic TypeScript diagnostics
