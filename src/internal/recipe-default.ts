import type {
  AnyRootRecipeConfig,
  AnySlotRecipeConfig,
  RecipeConfig,
  RecipeFactory,
  SystemOptions,
} from './core-types';
import { compileRootRecipe, createRootRecipe } from './engine/root';
import {
  buildSelectionLean,
  type RecipeRuntime,
  type RuntimeSystemOptions,
} from './engine/shared';
import { compileSlotRecipe, createSlotRecipe } from './engine/slot';

const leanRuntime: RecipeRuntime = {
  select: buildSelectionLean,
};

export function createRecipeFactoryWith(
  runtimeOptions: RuntimeSystemOptions
): RecipeFactory {
  return ((config: RecipeConfig) =>
    'slots' in config
      ? createSlotRecipe(
          compileSlotRecipe(config as AnySlotRecipeConfig, runtimeOptions)
        )
      : createRootRecipe(
          compileRootRecipe(config as AnyRootRecipeConfig, runtimeOptions)
        )) as RecipeFactory;
}

// Kept apart from recipe.ts so a bundle that only uses the default recipe()
// never pulls in the validating runtime.
export function createLeanRecipeFactory(options: SystemOptions): RecipeFactory {
  return createRecipeFactoryWith({
    cache: options.cache,
    merge: options.merge,
    runtime: leanRuntime,
    validate: false,
  });
}

export const defaultRecipeFactory = createLeanRecipeFactory({});
