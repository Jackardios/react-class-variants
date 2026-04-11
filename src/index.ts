import { createRecipeFactory } from './internal/recipe';

export {
  defineConfig,
  mergeProps,
  mergeRefs,
  styled,
  useMergeRefs,
} from './react';

export type {
  AnyRecipe,
  AnyRootRecipe,
  AnySlotRecipe,
  ClassNameValue,
  ClassValue,
  Recipe,
  RecipeConfig,
  RecipeConfigOf,
  RecipeFactory,
  RecipeInput,
  RecipeResolved,
  ResolveOptions,
  ResolvedVariantProps,
  RootCompoundVariant,
  RootRecipe,
  RootRecipeConfig,
  RootRecipeInput,
  RootResolveResult,
  SlotClassNameMap,
  SlotCompoundVariant,
  SlotNames,
  SlotRecipe,
  SlotRecipeConfig,
  SlotRecipeInput,
  SlotRenderFunction,
  SlotRenderInput,
  SlotResolveResult,
  SystemOptions,
  ValidateMode,
  VariantProps,
} from './internal/core-types';

export type {
  AnyIntrinsicElement,
  NativeAliases,
  RenderFunctionProps,
  RenderProp,
  RootComponentOptions,
  RootCompose,
  RootComposeContext,
  RootComposeInput,
  RootHelperProps,
  SlotComponentOptions,
  SlotCompose,
  SlotComposeContext,
  SlotComposeInput,
  StyledComponentProps,
} from './internal/react-types';

export const recipe = createRecipeFactory();
export { hasOwnProperty } from './internal/core-utils';
