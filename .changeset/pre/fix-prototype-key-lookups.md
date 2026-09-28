---
'react-class-variants': patch
---

Create engine lookup tables (variant indexes, slot indexes, variant option maps) with null prototypes. Prototype-named keys and values such as `constructor` or `toString` no longer crash slot overrides, silently bypass strict slot validation, or leak `Object.prototype` members into class strings. Strict mode (`validate: 'always'`) now rejects variant keys that shadow an `Object.prototype` member at recipe creation.
