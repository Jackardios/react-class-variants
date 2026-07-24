---
'react-class-variants': patch
---

Encode result-cache keys with self-delimiting tokens. Boolean `true` versus the string `'true'`, option keys containing the old `\x00` separator, and empty-string versus unset selections no longer collide, so cached output can no longer depend on call history. Malformed non-string selection values (e.g. `null` or a number passed to a boolean variant) are type-tagged and coerced, so cache-enabled recipes neither crash nor serve poisoned entries for garbage input.
