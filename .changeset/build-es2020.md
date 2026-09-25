---
'react-class-variants': patch
---

Build the published ESM for ES2020 instead of ES2016. The package now ships native optional chaining, nullish coalescing, and object spread instead of downleveled helpers, so the output is smaller and faster. ES2020 is supported by every browser that React 19 supports.
