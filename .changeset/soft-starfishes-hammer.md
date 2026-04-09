---
'react-class-variants': patch
---

Remove generic helper runtime validation, keep `variantComponent()` responsible for runtime collision guardrails, treat explicit `undefined` variant values as omission, and simplify the shared runtime resolver logic.
