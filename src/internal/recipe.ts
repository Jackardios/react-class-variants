import type {
  AnyRootRecipeConfig,
  AnySlotRecipeConfig,
  RecipeConfig,
  RecipeFactory,
  SystemOptions,
} from './core-types';
import {
  compileLeanRootRecipe,
  compileStrictRootRecipe,
  createLeanRootRecipe,
  createStrictRootRecipe,
  resolveRootComponentProps,
  resolveRootViewState,
} from './engine/root';
import {
  compileLeanSlotRecipe,
  compileStrictSlotRecipe,
  createLeanSlotRecipe,
  createStrictSlotRecipe,
  resolveSlotClassNameForRender,
  resolveSlotViewState,
} from './engine/slot';
import {
  getCompiledRecipe,
  getCompiledRecipeOrThrow,
  normalizeResolveOptions,
  type CompiledRecipe,
  type NormalizedResolveOptions,
  type RootCompiledRecipe,
  type RuntimeSystemOptions,
} from './engine/shared';

export {
  getCompiledRecipe,
  getCompiledRecipeOrThrow,
  normalizeResolveOptions,
  type CompiledRecipe,
  type NormalizedResolveOptions,
  type RootCompiledRecipe,
};
export { resolveRootComponentProps };
export {
  resolveRootViewState,
  resolveSlotClassNameForRender,
  resolveSlotViewState,
};

function createLeanRecipeFactory(options: SystemOptions): RecipeFactory {
  const runtimeOptions: RuntimeSystemOptions = {
    cache: options.cache,
    freeze: 'none',
    merge: options.merge,
    mode: 'lean',
    validate: false,
  };

  return ((config: RecipeConfig) => {
    if ('slots' in config) {
      return createLeanSlotRecipe(
        compileLeanSlotRecipe(config as AnySlotRecipeConfig, runtimeOptions)
      );
    }

    return createLeanRootRecipe(
      compileLeanRootRecipe(config as AnyRootRecipeConfig, runtimeOptions)
    );
  }) as RecipeFactory;
}

function createStrictRecipeFactory(options: SystemOptions): RecipeFactory {
  const runtimeOptions: RuntimeSystemOptions = {
    freeze: options.validate === 'always' ? 'deep' : 'shallow',
    merge: options.merge,
    mode: 'strict',
    validate: true,
  };

  return ((config: RecipeConfig) => {
    if ('slots' in config) {
      return createStrictSlotRecipe(
        compileStrictSlotRecipe(config as AnySlotRecipeConfig, runtimeOptions)
      );
    }

    return createStrictRootRecipe(
      compileStrictRootRecipe(config as AnyRootRecipeConfig, runtimeOptions)
    );
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
