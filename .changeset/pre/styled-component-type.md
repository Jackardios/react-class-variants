---
'react-class-variants': major
---

Tighten and name the `styled()` types.

- Export `StyledComponent`, the type `styled()` returns. It is now an interface, so editors and emitted declarations refer to a component by name instead of expanding its props. A component library that emits `.d.ts` files for three styled components and a recipe went from 69 KB of declarations to 3 KB.
- `RootStyledViewProps`, `SlotStyledViewProps`, `HostView`, `HostRenderOverrides`, and `StyledComponentProps` default `WithRender` to `false`, so a named view can be annotated as `SlotStyledViewProps<'button', typeof buttonRecipe>`.
- **Breaking:** `host.render()` overrides accept the base props and `data-*` attributes only, so a typo such as `classname` is a type error. They previously accepted any key.
- **Breaking:** `host.props` no longer declares `key`, which React never passes as a prop.
- **Breaking:** variant keys named after `Object.prototype` members (`constructor`, `toString`, `valueOf`, ...) are type errors. A prop bag without that prop resolves the key to the inherited member instead of the default.
