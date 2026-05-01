import { createRecipeFactory, getCompiledRecipe } from './internal/recipe';
import { defaultRecipeFactory } from './internal/recipe-default';
import type {
  AnyRecipe,
  ClassNameValue,
  RecipeConfig,
  RootRecipeConfig,
  RootRecipeConfigInput,
  RootVariantsSchema,
  SlotRecipeConfig,
  SlotRecipeConfigInput,
  SlotVariantsSchema,
  SystemOptions,
  VariantName,
  VariantOption,
  VariantSelectionValues,
  VariantSource,
} from './internal/core-types';
import { hasOwnKey } from './internal/engine/shared';

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

export const recipe = defaultRecipeFactory;

export function defineRecipeConfig<
  const SlotDefs extends Record<string, ClassNameValue>,
  const Variants extends SlotVariantsSchema<keyof SlotDefs & string> = {},
  const Defaults extends Partial<VariantSelectionValues<Variants>> = {}
>(
  config: SlotRecipeConfigInput<SlotDefs, Variants, Defaults>
): SlotRecipeConfig<SlotDefs, Variants, Defaults>;

export function defineRecipeConfig<
  const Variants extends RootVariantsSchema = {},
  const Defaults extends Partial<VariantSelectionValues<Variants>> = {}
>(
  config: RootRecipeConfigInput<Variants, Defaults>
): RootRecipeConfig<Variants, Defaults>;

export function defineRecipeConfig(config: RecipeConfig): RecipeConfig {
  return config;
}

function isRecipe(source: VariantSource): source is AnyRecipe {
  return typeof source === 'function';
}

function isBooleanVariantOptions(options: Record<string, unknown>) {
  return hasOwnKey(options, 'true') || hasOwnKey(options, 'false');
}

export function variantNames<const TSource extends VariantSource>(
  source: TSource
): VariantName<TSource>[] {
  if (isRecipe(source)) {
    return getCompiledRecipe(source).variantTable.map(
      variant => variant.key
    ) as VariantName<TSource>[];
  }

  return Object.keys(source.variants ?? {}) as VariantName<TSource>[];
}

export function variantOptions<
  const TSource extends VariantSource,
  const Name extends VariantName<TSource>
>(source: TSource, variantName: Name): VariantOption<TSource, Name>[] {
  if (isRecipe(source)) {
    const variant = getCompiledRecipe(source).variantTable.find(
      entry => entry.key === variantName
    );

    if (!variant) {
      return [];
    }

    return (
      variant.isBoolean ? [true, false] : Object.keys(variant.options)
    ) as VariantOption<TSource, Name>[];
  }

  const options = source.variants?.[variantName] as
    | Record<string, unknown>
    | undefined;

  if (!options) {
    return [];
  }

  return (
    isBooleanVariantOptions(options) ? [true, false] : Object.keys(options)
  ) as VariantOption<TSource, Name>[];
}

export function defineConfig(options: SystemOptions = {}) {
  return {
    recipe: createRecipeFactory(options),
  } as const;
}

export { hasOwnProperty } from './internal/core-utils';
