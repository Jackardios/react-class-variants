# `react-tailwind-variants` v1 legacy docs

`react-tailwind-variants` is the legacy v1 package line. It is frozen and kept only so existing applications have a stable migration path to `react-class-variants`.

## Install the legacy package

```bash
npm install react-tailwind-variants
```

## What to expect from v1

- No new features
- No v2 API backports
- Metadata and documentation maintenance only
- Migration guidance points to the shared `react-class-variants` repository

## When to stay on v1

Stay on v1 only if you cannot migrate to the v2 alpha line yet.

- Existing code depends on `styled()` and you are not ready to move to `variantComponent()`
- You need to defer package renaming work in a larger codebase
- You want to wait for stable `2.0.0`

## Where to migrate next

- Migration guide: [migration-from-react-tailwind-variants.md](./migration-from-react-tailwind-variants.md)
- Current package docs: [../README.md](../README.md)
