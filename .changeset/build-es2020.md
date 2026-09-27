---
'react-class-variants': patch
---

Build the published ESM for ES2020 instead of ES2016. The package now ships native optional chaining, nullish coalescing, and object spread instead of downleveled helpers, which shrinks the root entry by about 5% gzip. The build needs Chrome/Edge 80, Firefox 74, or Safari 13.1 and later.
