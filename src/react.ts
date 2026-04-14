/* eslint-disable @typescript-eslint/no-explicit-any -- public styled overloads intentionally erase recipe generics in the implementation signature. */
import { createRootStyled, createSlotStyled } from './internal/builders';
import { createRecipeFactory, getCompiledRecipe } from './internal/recipe';
import type {
  AnyRootRecipe,
  AnySlotRecipe,
  SystemOptions,
} from './internal/core-types';
import type {
  AnyElementType,
  AnyIntrinsicElement,
  PropAliases,
  RootStyledOptions,
  SlotStyledOptions,
  StyledComponentType,
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
} from './internal/react-types';

export function styled<
  Base extends AnyIntrinsicElement,
  TRecipe extends AnyRootRecipe,
  const WithRender extends boolean = false,
  const Aliases extends PropAliases<Base> = {},
  const Forwarded extends string = never
>(
  base: Base,
  inputRecipe: TRecipe,
  options?: RootStyledOptions<Base, TRecipe, WithRender, Aliases, Forwarded>
): StyledComponentType<Base, TRecipe, WithRender, Aliases, Forwarded>;

export function styled<
  Base extends Exclude<AnyElementType, AnyIntrinsicElement>,
  TRecipe extends AnyRootRecipe,
  const Aliases extends PropAliases<Base> = {},
  const Forwarded extends string = never
>(
  base: Base,
  inputRecipe: TRecipe,
  options?: RootStyledOptions<Base, TRecipe, false, Aliases, Forwarded>
): StyledComponentType<Base, TRecipe, false, Aliases, Forwarded>;

export function styled<
  Base extends AnyIntrinsicElement,
  TRecipe extends AnySlotRecipe,
  const WithRender extends boolean = false,
  const Aliases extends PropAliases<Base> = {},
  const Forwarded extends string = never
>(
  base: Base,
  inputRecipe: TRecipe,
  options: SlotStyledOptions<Base, TRecipe, WithRender, Aliases, Forwarded>
): StyledComponentType<Base, TRecipe, WithRender, Aliases, Forwarded>;

export function styled<
  Base extends Exclude<AnyElementType, AnyIntrinsicElement>,
  TRecipe extends AnySlotRecipe,
  const Aliases extends PropAliases<Base> = {},
  const Forwarded extends string = never
>(
  base: Base,
  inputRecipe: TRecipe,
  options: SlotStyledOptions<Base, TRecipe, false, Aliases, Forwarded>
): StyledComponentType<Base, TRecipe, false, Aliases, Forwarded>;

export function styled(
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

export function defineConfig(options: SystemOptions = {}) {
  return {
    recipe: createRecipeFactory(options),
    styled,
  } as const;
}

export { mergeProps, mergeRefs, useMergeRefs } from './utils';
