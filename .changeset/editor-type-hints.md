---
'react-class-variants': patch
---

Improve editor hints and type errors for `styled()`, `resolve()`, and configs.

- A wrong `styled()` option is reported on that option. A bad `forwardProps` entry, `hostSlot`, or `propAliases` value used to be reported on the base as "Argument of type 'string' is not assignable to parameter of type 'ComponentType<any>'", because TypeScript reported the last of four failing overloads. `styled()` now has one signature for calls with options, and:
  - `forwardProps: ['bogus']` reports `'"bogus"' is not assignable to type '"tone" | "size"'`;
  - `hostSlot` lists the slot names instead of `RecipeSlotNames<...>`;
  - an alias that is already a variant, base, or reserved prop name says so;
  - `withRender: true` on a component base is reported on `withRender`.
- Editors complete `styled()` options from the right signature: `forwardProps` values, `hostSlot` and its values, and `propAliases` keys.
- `recipe.resolve()` completes its options (`forwardProps`, `propAliases`) and the keys and values of its input. The input of a root recipe's `resolve()` is now typed like the slotted one: variant props must be declared options, and `className` must be a class value.
- Config keys (`base`, `slots`, `variants`, `compoundVariants`, `defaultVariants`), `defineConfig()` options, `ResolveOptions`, `styled()` options, and the `recipe` and `styled` that `defineConfig()` returns now show documentation on hover.
