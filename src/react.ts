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
  HostRenderOverrides,
  HostView,
  PropAliases,
  RenderFunctionProps,
  RenderProp,
  RootStyledOptions,
  RootStyledViewProps,
  SlotStyledOptions,
  SlotStyledViewProps,
  StyledComponent,
  StyledComponentProps,
  StyledFn,
  ViewPropsDescriptor,
} from './internal/react-types';

/**
 * Declares component props that only a `styled()` view consumes: they reach
 * `host.props` but never the rendered host. List every key of `TViewProps`
 * with `true`; a missing or unknown key is a type error.
 *
 * @example
 * defineViewProps<{ icon?: Icon; shortcut?: string }>({
 *   icon: true,
 *   shortcut: true,
 * });
 */
export function defineViewProps<
  TViewProps extends Record<string, unknown>,
>(keys: {
  readonly [Key in keyof TViewProps]-?: true;
}): ViewPropsDescriptor<TViewProps> {
  // An object rather than a key list: TypeScript cannot infer a key list while
  // TViewProps is given explicitly, so it could not check that the two match.
  return { keys: Object.keys(keys) } as ViewPropsDescriptor<TViewProps>;
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

/**
 * Creates a `recipe()` factory and the `styled()` component builder that
 * share `merge`, `validate`, and `cache` settings.
 *
 * @example
 * const { recipe, styled } = defineConfig({ merge: twMerge });
 */
export function defineConfig(options: SystemOptions = {}) {
  return {
    recipe: createRecipeFactory(options),
    styled,
  } as const;
}

export { mergeProps, mergeRefs, useMergeRefs } from './utils';
