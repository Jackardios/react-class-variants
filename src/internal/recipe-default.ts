import type {
  AnyRootRecipeConfig,
  AnySlotRecipeConfig,
  RecipeConfig,
  RecipeFactory,
} from './core-types';
import {
  compileLeanRootRecipe,
  compileStrictRootRecipe,
  createLeanRootRecipe,
  createStrictRootRecipe,
} from './engine/root';
import {
  compileLeanSlotRecipe,
  compileStrictSlotRecipe,
  createLeanSlotRecipe,
  createStrictSlotRecipe,
} from './engine/slot';
import type { RuntimeSystemOptions } from './engine/shared';

declare const process: {
  env: {
    NODE_ENV?: string;
  };
};

const leanRuntimeOptions: RuntimeSystemOptions = {
  freeze: 'none',
  mode: 'lean',
  validate: false,
};

const strictRuntimeOptions: RuntimeSystemOptions = {
  freeze: 'shallow',
  mode: 'strict',
  validate: true,
};

export const defaultRecipeFactory = (
  process.env.NODE_ENV === 'production'
    ? (config: RecipeConfig) => {
        if ('slots' in config) {
          return createLeanSlotRecipe(
            compileLeanSlotRecipe(
              config as AnySlotRecipeConfig,
              leanRuntimeOptions
            )
          );
        }

        return createLeanRootRecipe(
          compileLeanRootRecipe(
            config as AnyRootRecipeConfig,
            leanRuntimeOptions
          )
        );
      }
    : (config: RecipeConfig) => {
        if ('slots' in config) {
          return createStrictSlotRecipe(
            compileStrictSlotRecipe(
              config as AnySlotRecipeConfig,
              strictRuntimeOptions
            )
          );
        }

        return createStrictRootRecipe(
          compileStrictRootRecipe(
            config as AnyRootRecipeConfig,
            strictRuntimeOptions
          )
        );
      }
) as RecipeFactory;
