---
'react-class-variants': patch
---

Pass `render` to custom component bases as an ordinary prop, so bases that own a `render` prop (Base UI, Ark UI) keep it.

- The types already accepted the prop, but lean mode dropped it and strict mode threw.
- In a `view`, `host.props.render` holds it and `host.render({ render })` overrides it.
- Strict mode also accepts `render={undefined}` on an intrinsic base without `withRender`, so a wrapper can forward its own optional `render` prop.
