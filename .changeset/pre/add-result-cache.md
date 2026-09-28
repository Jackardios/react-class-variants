---
'react-class-variants': minor
---

Add an opt-out result cache to lean root recipes. When a `merge` function is configured (e.g. `defineConfig({ merge: twMerge })`), resolved root class names are memoized per recipe, so repeated identical inputs skip variant resolution and the `merge` call entirely. This is a large win for server-side rendering, where the same component variants resolve many times per request. Slotted recipes are not cached: each slot resolves to a few short strings, which `merge` functions such as tailwind-merge already cache internally.

The cache turns on automatically only in lean mode and only when `merge` is set. Disable it with `cache: false`, or size it with `cache: { maxSize }` (default `500`, FIFO eviction). Strict mode (`validate: 'always'`) is never cached, so per-call validation always runs. The cache assumes `merge` is a pure function of its input.
