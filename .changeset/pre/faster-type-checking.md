---
'react-class-variants': patch
---

Type-check `styled()` components about twice as fast. On a library of 40 buttons and 40 slotted cards with a `view` each, TypeScript 5.9 needs 71% fewer type instantiations (412k to 120k), 46% less check time (1.20 s to 0.65 s), and 42% less memory; TypeScript 7 checks it 64% faster. Emitted declarations are unchanged.

A `view` no longer decides the component's type parameters, so a view annotated with `RootStyledViewProps` or `SlotStyledViewProps` now has to match the options passed next to it:

- A view annotated with `withRender` or `propAliases` that the options leave out used to give the component the props that option adds, such as `render` or `htmlSize`, although the runtime ignored them (`htmlSize` reached the DOM). Those props are now type errors.
- A view annotated for another base or recipe is now reported on the `view` option instead of on the base or recipe argument, and a view typed for a base with compatible props, such as `div` for `section`, is accepted.
- The `view` key's hover reads `ComponentType<NoInfer<...>>`, component prop hovers lose their `Omit<..., "ref">` wrapper, and tag-name completions now work in a `styled()` call that has a `view`.

The speedup comes from four changes:

- `styled()` tells root and slotted recipes apart by the recipe's type brand instead of comparing its call and `resolve()` signatures, which ran on every `styled()` call.
- The `view` option no longer takes part in type inference. Inferring from a view's parameter made TypeScript measure the variance of the view props and, through them, of React's `ComponentPropsWithRef` over every intrinsic element: about 120k instantiations in any program with a `view`.
- Component props drop `ref` in the same pass that drops the variant keys, instead of walking every base prop a second time.
- The input of `recipe.resolve()` is typed from the variants schema directly.
