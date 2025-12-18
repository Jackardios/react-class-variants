---
"react-class-variants": patch
---

Fix `mergeProps` utility:

- Preserve base `className` when override is falsy (null, undefined, empty string)
- Preserve base event handler when override is null/undefined
- Only merge React event handlers (onClick, onMouseDown, etc.), not props like "onboarding"
