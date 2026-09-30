---
'react-class-variants': patch
---

Type data attributes on `host.props` (`host.props['data-state']` is `unknown`), as `host.render()` overrides already accept them. A named `view` annotated with `RootStyledViewProps` or `SlotStyledViewProps` can now read a data attribute that the caller passed.
