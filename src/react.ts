/* eslint-disable @typescript-eslint/no-explicit-any -- public styled implementation intentionally erases recipe generics behind a typed export surface. */
import type { ElementType } from 'react';
import { createStyled } from './internal/builders';
import { getCompiledRecipeOrThrow } from './internal/engine/shared';
import { createRecipeFactory } from './internal/recipe';
import type {
  AnyRootRecipe,
  AnySlotRecipe,
  SystemOptions,
} from './internal/core-types';
import type {
  RootStyledOptions,
  SlotStyledOptions,
  StyledFn,
  ViewPropsDescriptor,
} from './internal/react-types';

export {
  defineRecipeConfig,
  recipe,
  variantNames,
  variantOptions,
} from './core';

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
  VariantName,
  VariantOption,
  VariantProps,
  VariantSource,
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
  ViewPropsDescriptor,
} from './internal/react-types';

export function defineViewProps<
  TViewProps extends Record<string, unknown>,
  const Keys extends readonly (keyof TViewProps & string)[] =
    readonly (keyof TViewProps & string)[],
>(...keys: Keys): ViewPropsDescriptor<Pick<TViewProps, Keys[number]>> {
  return {
    keys: [...new Set(keys)],
  } as ViewPropsDescriptor<Pick<TViewProps, Keys[number]>>;
}

function styledImpl(
  base: ElementType,
  inputRecipe: AnyRootRecipe | AnySlotRecipe,
  options?:
    | RootStyledOptions<any, any, any, any, any, any>
    | SlotStyledOptions<any, any, any, any, any, any>
) {
  const compiled = getCompiledRecipeOrThrow(
    inputRecipe as AnyRootRecipe,
    'styled()'
  );
  const isSlotRecipe = compiled.mode === 'slot';

  if (typeof base !== 'string' && options?.withRender) {
    throw new Error(
      'react-class-variants: withRender is only supported for intrinsic base elements.'
    );
  }

  if (isSlotRecipe && !options?.view) {
    throw new Error(
      'react-class-variants: slotted recipes require a view component.'
    );
  }

  if (options?.viewProps && !options?.view) {
    throw new Error(
      'react-class-variants: viewProps require a view component.'
    );
  }

  return createStyled(base, compiled, options);
}

export const styled: StyledFn = styledImpl as StyledFn;

export function defineConfig(options: SystemOptions = {}) {
  return {
    recipe: createRecipeFactory(options),
    styled,
  } as const;
}

export { mergeProps, mergeRefs, useMergeRefs } from './utils';
