import { createRecipeFactory } from './internal/recipe';
import { defaultRecipeFactory } from './internal/recipe-default';
import type {
  AnyRecipe,
  ClassNameValue,
  RecipeConfig,
  RecipeFactory,
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
import { getCompiledRecipeOrThrow, hasOwnKey } from './internal/engine/shared';

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

/**
 * Creates a recipe. A config with `base` builds a root recipe, whose call
 * returns a class string; a config with `slots` builds a slotted recipe,
 * whose call returns one class function per slot. `recipe.resolve()` splits
 * variant props from a full prop bag.
 *
 * This default factory neither merges classes nor validates input; use
 * `defineConfig()` for a `merge` function or `validate: 'always'`.
 */
export const recipe = defaultRecipeFactory;

/**
 * Returns `config` unchanged, typed as a recipe config, so it can be declared
 * separately from `recipe()` and still keep its literal variant types.
 */
export function defineRecipeConfig<
  const SlotDefs extends Record<string, ClassNameValue>,
  const Variants extends SlotVariantsSchema<keyof SlotDefs & string> = {},
  const Defaults extends Partial<VariantSelectionValues<Variants>> = {},
>(
  config: SlotRecipeConfigInput<SlotDefs, Variants, Defaults>
): SlotRecipeConfig<SlotDefs, Variants, Defaults>;

export function defineRecipeConfig<
  const Variants extends RootVariantsSchema = {},
  const Defaults extends Partial<VariantSelectionValues<Variants>> = {},
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

/** Lists the variant names of a recipe or recipe config. */
export function variantNames<const TSource extends VariantSource>(
  source: TSource
): VariantName<TSource>[] {
  if (isRecipe(source)) {
    return getCompiledRecipeOrThrow(source, 'variantNames()').variantTable.map(
      variant => variant.key
    ) as VariantName<TSource>[];
  }

  return Object.keys(source.variants ?? {}) as VariantName<TSource>[];
}

/**
 * Lists the options of one variant of a recipe or recipe config. Boolean
 * variants return `[true, false]`; an unknown variant returns `[]`.
 */
export function variantOptions<
  const TSource extends VariantSource,
  const Name extends VariantName<TSource>,
>(source: TSource, variantName: Name): VariantOption<TSource, Name>[] {
  if (isRecipe(source)) {
    const variant = getCompiledRecipeOrThrow(
      source,
      'variantOptions()'
    ).variantTable.find(entry => entry.key === variantName);

    if (!variant) {
      return [];
    }

    return (
      variant.isBoolean ? [true, false] : Object.keys(variant.options)
    ) as VariantOption<TSource, Name>[];
  }

  const options = source.variants?.[variantName] as
    Record<string, unknown> | undefined;

  if (!options) {
    return [];
  }

  return (
    isBooleanVariantOptions(options) ? [true, false] : Object.keys(options)
  ) as VariantOption<TSource, Name>[];
}

/**
 * Creates a `recipe()` factory that shares `merge`, `validate`, and `cache`
 * settings. The package root's `defineConfig()` also returns `styled`.
 */
export function defineConfig(options: SystemOptions = {}): {
  /** Creates recipes that share this config's `merge`, `validate`, and `cache`. */
  readonly recipe: RecipeFactory;
} {
  return {
    recipe: createRecipeFactory(options),
  } as const;
}

export { hasOwnProperty } from './internal/core-utils';
