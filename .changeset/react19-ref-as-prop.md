---
'react-class-variants': major
---

Build `styled()` components as plain React 19 function components with `ref` as a regular prop.

**Breaking changes:**

- `styled()` now returns a `FunctionComponent` instead of a `ForwardRefExoticComponent`. The component has no `$$typeof`, and calling it directly returns `ReactNode | Promise<ReactNode>`.
- `ref` is read from props. Custom bases receive it as their `ref` prop, and bases written with `forwardRef` keep working. In a `view`, `ref` still stays out of `host.props` and is attached by `host.render()`.
- The component type no longer declares `defaultProps`, which React 19 ignores on function components; set defaults with `defaultVariants` or in a wrapper instead.

`ComponentProps<typeof Component>`, `ComponentRef<typeof Component>`, JSX usage, and `displayName` are unchanged.
