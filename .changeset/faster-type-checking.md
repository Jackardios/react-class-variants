---
'react-class-variants': patch
---

Type-check `styled()` components about twice as fast. On a library of 40 buttons and 40 slotted cards with a `view` each, TypeScript 5.9 needs 71% fewer type instantiations (412k to 120k), 46% less check time (1.20 s to 0.65 s), and 42% less memory; TypeScript 7 checks it 64% faster. Completions, error messages, and emitted declarations are unchanged, and so are hovers except on the `view` key, whose type now reads `ComponentType<NoInfer<...>>`.

- `styled()` tells root and slotted recipes apart by the recipe's type brand instead of comparing its call and `resolve()` signatures, which ran on every `styled()` call.
- The `view` option no longer takes part in type inference. Inferring from a view's parameter made TypeScript measure the variance of the view props and, through them, of React's `ComponentPropsWithRef` over every intrinsic element: about 120k instantiations in any program with a `view`.
- Component props drop `ref` in the same pass that drops the variant keys, instead of walking every base prop a second time.
- The input of `recipe.resolve()` is typed from the variants schema directly.
