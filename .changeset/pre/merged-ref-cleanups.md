---
'react-class-variants': patch
---

Propagate React 19 callback-ref cleanups through `mergeRefs`, `useMergeRefs`, and the merged refs inside `styled()`. When an inner ref returns a cleanup, the merged ref now returns a combined cleanup that runs it and null-resets refs that returned none; previously cleanups were discarded and never ran. Refs without cleanups keep the legacy null-call behavior unchanged.
