---
'react-class-variants': patch
---

Speed up `styled()` rendering. Each render now builds one props object instead of copying the props several times, and slotted views get a plain `classes` map of slot functions rather than lazy getters. The output is unchanged, and the component bundle is about 7.5% smaller gzipped.

`propAliases` now read every alias from the raw input, so a chain such as `{ b: 'c', a: 'b' }` maps `c` to `b` and `b` to `a` independently. In lean mode, an alias that strict mode would reject is dropped instead of half-applied: an alias or target that is a reserved prop, an alias that is a variant key, or an alias reused by two targets.
