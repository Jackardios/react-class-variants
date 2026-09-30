// Consumer smoke test, compiled against the packed tarball once per fixture
// (Bundler and NodeNext resolution) and TypeScript version (see
// scripts/test-types-packed.mjs). It proves that every public export resolves
// through the published declarations, that the main surfaces type-check, and
// that the key mistakes stay errors on every compiler; the Bundler fixture
// also enables exactOptionalPropertyTypes. Detailed type behavior lives in
// test/types/contracts/, which runs on one compiler only.
import { createRef, type ComponentRef, type ReactNode } from 'react';
import * as root from 'react-class-variants';
import * as core from 'react-class-variants/core';
// Importing a name that is not exported is a compile error, so these lists
// catch public types that disappear from either entry.
import type {
  AnyRecipe,
  AnyRootRecipe,
  AnySlotRecipe,
  ClassNameValue,
  HostRenderOverrides,
  HostView,
  PropAliases,
  RecipeConfig,
  RecipeConfigOf,
  RecipeFactory,
  RecipeInput,
  RecipeResolved,
  RenderFunctionProps,
  RenderProp,
  ResolveOptions,
  ResolvedVariantProps,
  RootCompoundVariant,
  RootRecipe,
  RootRecipeConfig,
  RootRecipeInput,
  RootResolveResult,
  RootStyledOptions,
  RootStyledViewProps,
  SlotClassNameMap,
  SlotCompoundVariant,
  SlotNames,
  SlotRecipe,
  SlotRecipeConfig,
  SlotRecipeInput,
  SlotRenderFunction,
  SlotRenderInput,
  SlotResolveResult,
  SlotStyledOptions,
  SlotStyledViewProps,
  StyledComponent,
  StyledComponentProps,
  StyledFn,
  SystemOptions,
  ValidateMode,
  VariantName,
  VariantOption,
  VariantProps,
  VariantSource,
  ViewPropsDescriptor,
} from 'react-class-variants';
import type {
  AnyRecipe as CoreAnyRecipe,
  AnyRootRecipe as CoreAnyRootRecipe,
  AnySlotRecipe as CoreAnySlotRecipe,
  ClassNameValue as CoreClassNameValue,
  RecipeConfig as CoreRecipeConfig,
  RecipeConfigOf as CoreRecipeConfigOf,
  RecipeFactory as CoreRecipeFactory,
  RecipeInput as CoreRecipeInput,
  RecipeResolved as CoreRecipeResolved,
  ResolveOptions as CoreResolveOptions,
  ResolvedVariantProps as CoreResolvedVariantProps,
  RootCompoundVariant as CoreRootCompoundVariant,
  RootRecipe as CoreRootRecipe,
  RootRecipeConfig as CoreRootRecipeConfig,
  RootRecipeInput as CoreRootRecipeInput,
  RootResolveResult as CoreRootResolveResult,
  SlotClassNameMap as CoreSlotClassNameMap,
  SlotCompoundVariant as CoreSlotCompoundVariant,
  SlotNames as CoreSlotNames,
  SlotRecipe as CoreSlotRecipe,
  SlotRecipeConfig as CoreSlotRecipeConfig,
  SlotRecipeInput as CoreSlotRecipeInput,
  SlotRenderFunction as CoreSlotRenderFunction,
  SlotRenderInput as CoreSlotRenderInput,
  SlotResolveResult as CoreSlotResolveResult,
  SystemOptions as CoreSystemOptions,
  ValidateMode as CoreValidateMode,
  VariantName as CoreVariantName,
  VariantOption as CoreVariantOption,
  VariantProps as CoreVariantProps,
  VariantSource as CoreVariantSource,
} from 'react-class-variants/core';

// A styled component is a React 19 function component.
type StyledRender = ReactNode | Promise<ReactNode>;

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

type _RootValues = Expect<
  Equal<
    keyof typeof root,
    | 'defineConfig'
    | 'defineRecipeConfig'
    | 'defineViewProps'
    | 'hasOwnProperty'
    | 'mergeProps'
    | 'mergeRefs'
    | 'recipe'
    | 'useMergeRefs'
    | 'variantNames'
    | 'variantOptions'
  >
>;
type _CoreValues = Expect<
  Equal<
    keyof typeof core,
    | 'defineConfig'
    | 'defineRecipeConfig'
    | 'hasOwnProperty'
    | 'recipe'
    | 'variantNames'
    | 'variantOptions'
  >
>;

const { recipe, styled } = root.defineConfig();
const strict = root.defineConfig({ validate: 'always' });

const buttonConfig = root.defineRecipeConfig({
  base: 'inline-flex',
  variants: {
    tone: { primary: 'bg-blue', ghost: 'bg-transparent' },
    disabled: { true: 'opacity-50' },
  },
  defaultVariants: { disabled: false },
  compoundVariants: [{ tone: 'ghost', disabled: true, className: 'ring' }],
});
const button = recipe(buttonConfig);
const tabs = strict.recipe({
  slots: { root: 'flex', tab: 'px-2' },
  variants: { size: { sm: { tab: 'text-sm' }, lg: { tab: 'text-lg' } } },
  defaultVariants: { size: 'sm' },
});

type _ButtonVariants = Expect<
  Equal<
    VariantProps<typeof button>,
    {
      readonly tone: 'primary' | 'ghost';
      readonly disabled?: boolean | undefined;
    }
  >
>;
const buttonClassName: string = button({ tone: 'primary' });
const tabClassName: string = tabs({ size: 'lg' }).tab({ className: 'mt-1' });
const resolved = button.resolve(
  { tone: 'ghost', htmlSize: 3, type: 'button' as const },
  { forwardProps: ['disabled'], propAliases: { size: 'htmlSize' } }
);
type _ResolvedSize = Expect<Equal<typeof resolved.resolvedProps.size, number>>;
type _ResolvedDisabled = Expect<
  Equal<typeof resolved.resolvedProps.disabled, boolean>
>;
type _ResolvedClassName = Expect<
  Equal<typeof resolved.resolvedProps.className, string>
>;
const names: ('tone' | 'disabled')[] = root.variantNames(button);

const Button = styled('button', button, { withRender: true });
type _ButtonComponent = Expect<
  Equal<typeof Button, StyledComponent<'button', typeof button, true>>
>;
const Tabs = styled('div', tabs, {
  viewProps: root.defineViewProps<{ label?: ReactNode }>({ label: true }),
  view: ({ host, classes }) =>
    host.render({ children: [host.props.label, classes.tab()] }),
});
type _ButtonRef = Expect<Equal<ComponentRef<typeof Button>, HTMLButtonElement>>;
const buttonElement: StyledRender = Button({
  tone: 'primary',
  ref: createRef<HTMLButtonElement>(),
  render: props => props.children,
});
const tabsElement: StyledRender = Tabs({ size: 'lg', label: 'Tab' });
// Recipes created inline in a styled() argument resolve.
const InlineCard = styled('article', recipe({ slots: { root: 'p-4' } }), {
  view: ({ host, classes }) => host.render({ children: classes.root() }),
});
const InlineBadge = styled('span', recipe({ base: 'px-2' }), {
  withRender: true,
  view: ({ host }) => host.render(),
});
const inlineElements: StyledRender[] = [InlineCard({}), InlineBadge({})];
const merged = root.mergeProps({ className: 'a' }, { className: 'b' });

// Optional inputs accept an explicit undefined (exactOptionalPropertyTypes).
declare const maybeDisabled: boolean | undefined;
const passThrough = [
  root.defineConfig({
    cache: undefined,
    merge: undefined,
    validate: undefined,
  }),
  button({ tone: 'primary', disabled: maybeDisabled, className: undefined }),
  tabs({ size: undefined, slotClassNames: { tab: undefined } }).tab({
    size: undefined,
    className: undefined,
  }),
  button.resolve(
    { tone: 'ghost' },
    { forwardProps: undefined, propAliases: undefined }
  ),
  Button({ tone: 'ghost', disabled: maybeDisabled, render: undefined }),
  styled('span', button, { displayName: undefined, withRender: undefined }),
];

// Mistakes stay errors on every compiler. Each case is one line, because
// compilers report some of these errors on different lines of a statement.
const toneA = { tone: { a: 'x' } } as const;
// @ts-expect-error unknown compound option
recipe({ variants: toneA, compoundVariants: [{ tone: 'b', className: '' }] });
// @ts-expect-error missing required variant
button({});
// @ts-expect-error unknown variant option
button({ tone: 'danger' });
// @ts-expect-error variant key shadows an Object.prototype member
recipe({ variants: { constructor: { a: 'x' } } });
// @ts-expect-error every view prop key must be listed
root.defineViewProps<{ icon?: string; shortcut?: string }>({ icon: true });

// Recipes built from the core entry work with root-entry helpers and styled().
const coreBadge = core.recipe({
  base: 'inline-flex',
  variants: { tone: { info: 'text-sky-700', danger: 'text-rose-700' } },
});
type _CrossEntryTone = Expect<
  Equal<VariantProps<typeof coreBadge>, { readonly tone: 'info' | 'danger' }>
>;
const crossEntryInput: RecipeInput<typeof coreBadge> = { tone: 'info' };
const CoreBadge = styled('span', coreBadge);
const coreBadgeElement: StyledRender = CoreBadge({ tone: 'danger' });
const coreConfigured: string = core
  .defineConfig({ merge: className => className })
  .recipe({ base: 'flex' })();

export {
  buttonClassName,
  buttonElement,
  coreBadgeElement,
  coreConfigured,
  crossEntryInput,
  inlineElements,
  merged,
  names,
  passThrough,
  tabClassName,
  tabsElement,
};
