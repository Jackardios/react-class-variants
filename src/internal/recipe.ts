import type {
  AnyRootRecipeConfig,
  AnySlotRecipeConfig,
  RecipeConfig,
  RecipeFactory,
  SystemOptions,
} from './core-types';
import {
  compileRootRecipe,
  createRootRecipe,
  resolveRootComponentProps,
} from './engine/root';
import { compileSlotRecipe, createSlotRecipe } from './engine/slot';
import {
  getCompiledRecipe,
  normalizeResolveOptions,
  resolveRuntimeSystemOptions,
  type CompiledRecipe,
  type NormalizedResolveOptions,
  type RootCompiledRecipe,
} from './engine/shared';

export {
  getCompiledRecipe,
  normalizeResolveOptions,
  type CompiledRecipe,
  type NormalizedResolveOptions,
  type RootCompiledRecipe,
};
export { resolveRootComponentProps };

export function createRecipeFactory(
  options: SystemOptions = {}
): RecipeFactory {
  const runtimeOptions = resolveRuntimeSystemOptions(options);

  return ((config: RecipeConfig) => {
    if ('slots' in config) {
      return createSlotRecipe(
        compileSlotRecipe(config as AnySlotRecipeConfig, runtimeOptions)
      );
    }

    return createRootRecipe(
      compileRootRecipe(config as AnyRootRecipeConfig, runtimeOptions)
    );
  }) as RecipeFactory;
}
