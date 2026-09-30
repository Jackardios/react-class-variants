---
'react-class-variants': major
---

`defineViewProps()` takes an object of keys instead of a key list: `defineViewProps<{ icon?: Icon; shortcut?: string }>({ icon: true, shortcut: true })`.

**Breaking change:** replace `defineViewProps<T>('icon', 'shortcut')` with `defineViewProps<T>({ icon: true, shortcut: true })`.

The key list could not be checked against `T`: with `T` given explicitly, TypeScript typed the descriptor for every key of `T` even when only some were listed. The unlisted keys were then typed as view props but reached the DOM at runtime. The object form must list exactly the keys of `T`, so a missing or unknown key is a type error.
