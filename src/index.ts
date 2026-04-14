export {
  defineConfig,
  defineRecipeConfig,
  mergeProps,
  mergeRefs,
  styled,
  useMergeRefs,
} from './react';
export { recipe } from './core';

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
  AnyElementType,
  HostRenderOverrides,
  HostView,
  PropAliases,
  RenderFunctionProps,
  RenderProp,
  RootStyledOptions,
  RootStyledViewProps,
  SlotStyledOptions,
  SlotStyledViewProps,
  StyledFn,
  StyledComponentProps,
} from './internal/react-types';

export { hasOwnProperty } from './internal/core-utils';
