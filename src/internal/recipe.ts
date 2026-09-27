import type { RecipeConfig, RecipeFactory, SystemOptions } from './core-types';
import {
  buildValidatedSelection,
  deepFreeze,
  type RecipeRuntime,
} from './engine/shared';
import { validateSlotOverride } from './engine/slot';
import {
  createLeanRecipeFactory,
  createRecipeFactoryWith,
} from './recipe-default';

const validatingRuntime: RecipeRuntime = {
  select: buildValidatedSelection,
  validateOverride: validateSlotOverride,
};

function createStrictRecipeFactory(options: SystemOptions): RecipeFactory {
  const factory = createRecipeFactoryWith({
    merge: options.merge,
    runtime: validatingRuntime,
    validate: true,
  });

  // Validated configs are frozen after compilation so later mutations fail
  // loudly instead of silently diverging from the compiled recipe.
  return ((config: RecipeConfig) => {
    const recipe = factory(config);
    deepFreeze(config);
    return recipe;
  }) as RecipeFactory;
}

export function createRecipeFactory(
  options: SystemOptions = {}
): RecipeFactory {
  // 'never' and the default both resolve to the lean runtime.
  return options.validate === 'always'
    ? createStrictRecipeFactory(options)
    : createLeanRecipeFactory(options);
}
