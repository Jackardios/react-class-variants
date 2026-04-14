/* eslint-disable @typescript-eslint/no-explicit-any -- public styled implementation intentionally erases recipe generics behind a typed export surface. */
import { createRootStyled, createSlotStyled } from './internal/builders';
import { createRecipeFactory, getCompiledRecipe } from './internal/recipe';
import type {
  AnyRootRecipe,
  AnySlotRecipe,
  SystemOptions,
} from './internal/core-types';
import type {
  AnyElementType,
  RootStyledOptions,
  SlotStyledOptions,
  StyledFn,
} from './internal/react-types';

export { defineRecipeConfig, recipe } from './core';

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
  StyledComponentProps,
  StyledFn,
} from './internal/react-types';

function styledImpl(
  base: AnyElementType,
  inputRecipe: AnyRootRecipe | AnySlotRecipe,
  options?:
    | RootStyledOptions<any, any, any, any, any>
    | SlotStyledOptions<any, any, any, any, any>
) {
  const compiled = getCompiledRecipe(inputRecipe as AnyRootRecipe);
  const isSlotRecipe = compiled.mode === 'slot';

  if (typeof base !== 'string' && options?.withRender) {
    throw new Error(
      'react-class-variants: withRender is only supported for intrinsic base elements.'
    );
  }

  if (isSlotRecipe) {
    if (!options?.view) {
      throw new Error(
        'react-class-variants: slotted recipes require a view component.'
      );
    }

    return createSlotStyled(
      base,
      inputRecipe as AnySlotRecipe,
      options as SlotStyledOptions<any, any, any, any, any>
    );
  }

  return createRootStyled(
    base,
    inputRecipe as AnyRootRecipe,
    options as RootStyledOptions<any, any, any, any, any> | undefined
  );
}

export const styled: StyledFn = styledImpl as StyledFn;

export function defineConfig(options: SystemOptions = {}) {
  return {
    recipe: createRecipeFactory(options),
    styled,
  } as const;
}

export { mergeProps, mergeRefs, useMergeRefs } from './utils';
