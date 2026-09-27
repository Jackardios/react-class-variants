---
'react-class-variants': patch
---

Reduce the memory each `styled()` component keeps. Components without `propAliases` now share one internal table of props to skip instead of building their own, which brings a component definition from about 435 to 215 bytes in Node 22.
