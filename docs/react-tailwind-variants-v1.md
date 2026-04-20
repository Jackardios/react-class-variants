# `react-tailwind-variants` v1 Legacy Docs

This page stays intentionally brief.

The frozen v1 API reference now lives on the
[`v1-maintenance` branch README](https://github.com/Jackardios/react-class-variants/blob/v1-maintenance/README.md)
so the `next` branch does not carry a second full copy of the same legacy
documentation.

## Status

- Package name: `react-tailwind-variants`
- Last legacy release: `1.0.4`
- Status: frozen
- Maintenance scope: metadata, documentation, and migration guidance
- Successor package: `react-class-variants`

## Install v1

Install the legacy package together with its required peer dependency:

```bash
npm install react-tailwind-variants tailwind-merge
```

Compatibility:

- `react`: `^16.8 || ^17.0 || ^18.0 || ^19.0`
- `react-dom`: `^16.8 || ^17.0 || ^18.0 || ^19.0`
- `tailwind-merge`: `^1.10.0 || ^2.0.0 || ^3.0.0`

`@radix-ui/react-slot` is bundled by the package and powers the intrinsic
`asChild` pattern.

## When to Stay on v1

Staying on v1 can still be reasonable when you depend on:

- `asChild`
- component-to-component `styled()` composition
- automatic Tailwind merge everywhere
- the existing CommonJS and legacy React compatibility matrix

For new work, use `react-class-variants`.

## Canonical Docs

- [v1 API reference on `v1-maintenance`](https://github.com/Jackardios/react-class-variants/blob/v1-maintenance/README.md)
- [Migration guide](./migration-from-react-tailwind-variants.md)
- [Recipes and components guide](./recipes-and-components.md)
- [API reference](./api-reference.md)
