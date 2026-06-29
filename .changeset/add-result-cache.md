---
'react-class-variants': minor
---

Add an opt-out result cache to lean recipes. When a `merge` function is configured (e.g. `defineConfig({ merge: twMerge })`), resolved class names are memoized per recipe so repeated identical inputs skip variant resolution and the `merge` call entirely — a large win for server-side rendering, where the same component variants resolve many times per request.

The cache is enabled automatically only in lean mode and only when `merge` is set; disable it with `cache: false` or size it with `cache: { maxSize }` (default `500`, FIFO eviction). Strict mode (`validate: 'always'`) is never cached, so per-call validation always runs. Enabling the cache assumes `merge` is a pure function of its input.
