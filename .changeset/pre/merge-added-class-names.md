---
'react-class-variants': patch
---

Run `merge` over the classes that `host.render({ className })` and a `render` element's `className` add to the resolved class string. These classes were appended after `merge` had already run. With tailwind-merge, `host.render({ className: 'px-4' })` on a recipe with `px-2` therefore kept both classes, and which one applied depended on CSS order. It now resolves the same way as a `className` prop.
