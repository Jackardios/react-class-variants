---
'react-class-variants': patch
---

Use own-property checks for `propAliases` and `forwardProps` in `resolve()`. Inherited `Object.prototype` members (e.g. an alias public key named `toString`) no longer count as present props or leak functions into resolved props, and strict mode no longer throws spurious "would overwrite an existing resolved prop" errors for prototype-named targets. Own `__proto__` input keys (e.g. from `JSON.parse`) and `propAliases` targets named `__proto__` are dropped (rejected in strict mode) instead of swapping the prototype of the resolved props object.
