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

export function createRecipeFactoryWith(runtimeOptions: RuntimeSystemOptions) {
  return (config: RecipeConfig) =>
    'slots' in config
      ? createSlotRecipe(
          compileSlotRecipe(config as AnySlotRecipeConfig, runtimeOptions)
        )
      : createRootRecipe(
          compileRootRecipe(config as AnyRootRecipeConfig, runtimeOptions)
        );
}

// Nothing reachable from the lean factory references the validating runtime,
// so bundles that only use the default recipe() never include it.
export function createLeanRecipeFactory(options: SystemOptions): RecipeFactory {
  return createRecipeFactoryWith({
    cache: options.cache,
    merge: options.merge,
    runtime: leanRuntime,
    validate: false,
  }) as RecipeFactory;
}

// Pure, so helper-only imports such as hasOwnProperty() drop the engine.
export const defaultRecipeFactory = /* @__PURE__ */ createLeanRecipeFactory({});
