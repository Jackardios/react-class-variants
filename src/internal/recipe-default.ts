import type {
  AnyRootRecipeConfig,
  AnySlotRecipeConfig,
  RecipeConfig,
  RecipeFactory,
} from './core-types';
import { compileLeanRootRecipe, createLeanRootRecipe } from './engine/root';
import { compileLeanSlotRecipe, createLeanSlotRecipe } from './engine/slot';
import type { RuntimeSystemOptions } from './engine/shared';

const leanRuntimeOptions: RuntimeSystemOptions = {
  freeze: 'none',
  mode: 'lean',
  validate: false,
};

export const defaultRecipeFactory = ((config: RecipeConfig) => {
  if ('slots' in config) {
    return createLeanSlotRecipe(
      compileLeanSlotRecipe(config as AnySlotRecipeConfig, leanRuntimeOptions)
    );
  }

  return createLeanRootRecipe(
    compileLeanRootRecipe(config as AnyRootRecipeConfig, leanRuntimeOptions)
  );
}) as RecipeFactory;
