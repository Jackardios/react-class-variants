---
'react-class-variants': patch
---

Reject variant keys named after `Object.prototype` members (`constructor`, `toString`, `valueOf`, ...) in lean recipes too, when the recipe is created. Strict recipes already rejected them. In lean mode, a prop bag without that prop resolved the key to the inherited member, so the default was ignored and the wrong class came out: `{ toString: { true: 'on', false: 'off' } }` with `defaultVariants: { toString: true }` rendered `off`.
