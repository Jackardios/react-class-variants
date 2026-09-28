---
'react-class-variants': patch
---

Unify the lean and validating recipe engines into one implementation. Validation now sits behind a runtime object that `defineConfig({ validate: 'always' })` selects, so the default `recipe()` bundle still excludes it. The component bundle shrinks by about 8% gzip, validating recipes resolve faster, and lean and validating output can no longer drift apart.
