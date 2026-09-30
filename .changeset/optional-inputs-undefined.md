---
'react-class-variants': patch
---

Accept an explicit `undefined` for every optional input property, so code compiled with `exactOptionalPropertyTypes` can pass optional values through, for example `<Button tone={props.tone} />` or `recipe({ size: maybeSize })`. The runtime already treated `undefined` as absent. This covers variant props, `className`, `slotClassNames`, recipe configs, `resolve()` options, `defineConfig()` options, and `styled()` options. In slot className maps, an `undefined` slot value now means "no class" in strict mode too, instead of throwing.
