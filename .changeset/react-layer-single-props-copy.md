---
'react-class-variants': patch
---

Speed up `styled()` rendering. Each render now builds one props object instead of copying the props several times, and slotted views get a plain `classes` map of slot functions rather than lazy getters. The component bundle is about 7.5% smaller gzipped. The rendered output is unchanged except for two edge cases: strict mode now validates a slotted component's `className` like a root one (`className={false}` throws instead of being ignored), and lean `viewProps` that list a reserved prop such as `className` or `children` no longer swallow it.

`propAliases` now read every alias from the raw input, so a chain such as `{ b: 'c', a: 'b' }` maps `c` to `b` and `b` to `a` independently. In lean mode, an alias that strict mode would reject is dropped instead of half-applied: an alias or target that is a reserved prop or `__proto__`, an alias that is a variant key, an alias reused by two targets, or a target that is also listed in `forwardProps`.
