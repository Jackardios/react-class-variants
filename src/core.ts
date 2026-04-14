import { createRecipeFactory } from './internal/recipe';
import { defaultRecipeFactory } from './internal/recipe-default';
import type {
  ClassNameValue,
  RecipeConfig,
  RootRecipeConfig,
  RootRecipeConfigInput,
  RootVariantsSchema,
  SlotRecipeConfig,
  SlotRecipeConfigInput,
  SlotVariantsSchema,
  SystemOptions,
  VariantSelectionValues,
} from './internal/core-types';

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

export function defineConfig(options: SystemOptions = {}) {
  return {
    recipe: createRecipeFactory(options),
  } as const;
}

export { hasOwnProperty } from './internal/core-utils';
