import type {
  AnyRecipe,
  AnyRootRecipe,
  AnyRootRecipeConfig,
  ClassNameValue,
  ResolveOptions,
  RootRecipe,
  RootResolveResult,
} from '../core-types';
import {
  appendClassName,
  flattenClassName,
  flattenUserClassName,
  validateClassNameValue,
} from '../class-name';
import {
  buildRootResultCacheKey,
  resolveResultCacheMaxSize,
  storeResult,
} from './cache';
import { compileCompounds, forEachMatchingCompound } from './compounds';
import {
  createResolvedProps,
  normalizeResolveOptions,
  type NormalizedResolveOptions,
} from './props';
import {
  attachCompiled,
  compileVariants,
  materializeSelection,
  readVariantClassName,
  type RootCompiledRecipe,
  type RuntimeSystemOptions,
} from './shared';

function compileRootClassName(
  context: string,
  value: unknown,
  validate: boolean
) {
  if (value === undefined) {
    return '';
  }
  if (validate) {
    validateClassNameValue(context, value);
  }
  return flattenClassName(value as ClassNameValue | undefined);
}

export function compileRootRecipe(
  config: AnyRootRecipeConfig,
  options: RuntimeSystemOptions
): RootCompiledRecipe {
  const { validate } = options;
  const compileClassName = (context: string, value: unknown) =>
    compileRootClassName(context, value, validate);
  const variantTable = compileVariants({
    compileClassName,
    defaultVariants: config.defaultVariants,
    mode: 'root',
    validate,
    variants: config.variants,
  });

  return {
    base: compileClassName('base', config.base),
    compounds: compileCompounds({
      compileClassName,
      compounds: config.compoundVariants,
      validate,
      variantTable,
    }),
    merge: options.merge,
    mode: 'root',
    resultCacheMaxSize: resolveResultCacheMaxSize(
      validate,
      options.merge,
      options.cache
    ),
    runtime: options.runtime,
    validate,
    variantTable,
  };
}

function resolveRootClassName(
  compiled: RootCompiledRecipe,
  input: Record<string, unknown> | undefined,
  allowUnknownProps: boolean
) {
  const selection = compiled.runtime.select(compiled, input, allowUnknownProps);
  const userClassName = flattenUserClassName(
    'input.className',
    input?.className as ClassNameValue | undefined,
    compiled.validate
  );

  let key: string | undefined;
  if (compiled.resultCacheMaxSize) {
    key = buildRootResultCacheKey(selection, userClassName);
    const cached = compiled.resultCache?.get(key);
    if (cached !== undefined) {
      return { className: cached, selection };
    }
  }

  let className = compiled.base;

  for (let index = 0; index < compiled.variantTable.length; index += 1) {
    className = appendClassName(
      className,
      readVariantClassName(compiled.variantTable[index], selection[index])
    );
  }

  forEachMatchingCompound(compiled.compounds, selection, compoundClassName => {
    className = appendClassName(className, compoundClassName);
  });

  className = appendClassName(className, userClassName);
  const merged = compiled.merge ? compiled.merge(className) : className;

  return {
    className: key !== undefined ? storeResult(compiled, key, merged) : merged,
    selection,
  };
}

export function resolveRootComponentProps(
  compiled: RootCompiledRecipe,
  input: Record<string, unknown> | undefined,
  options: NormalizedResolveOptions | undefined
) {
  const resolved = resolveRootClassName(compiled, input, true);
  const resolvedProps = createResolvedProps(
    compiled,
    input,
    options,
    resolved.selection
  );
  resolvedProps.className = resolved.className;

  return resolvedProps as Record<string, unknown> & {
    className: string;
  };
}

export function resolveRootViewState(
  compiled: RootCompiledRecipe,
  input: Record<string, unknown> | undefined,
  options: NormalizedResolveOptions | undefined
) {
  const resolved = resolveRootClassName(compiled, input, true);
  const resolvedProps = createResolvedProps(
    compiled,
    input,
    options,
    resolved.selection
  );
  resolvedProps.className = resolved.className;

  return {
    resolvedProps: resolvedProps as Record<string, unknown> & {
      className: string;
    },
    selection: resolved.selection,
    variants: materializeSelection(compiled, resolved.selection),
  };
}

export function createRootRecipe(compiled: RootCompiledRecipe): AnyRecipe {
  const rootRecipe = ((input?: Record<string, unknown>) =>
    resolveRootClassName(compiled, input, false).className) as RootRecipe & {
    resolve: RootRecipe['resolve'];
  };

  rootRecipe.resolve = <
    TInput extends Record<string, unknown> | undefined = undefined,
    const TOptions extends ResolveOptions | undefined = undefined
  >(
    input?: TInput,
    options?: TOptions
  ): RootResolveResult<AnyRootRecipe, TInput, TOptions> => {
    const normalizedOptions = normalizeResolveOptions(compiled, options);
    const resolved = resolveRootClassName(compiled, input, true);
    const resolvedProps = createResolvedProps(
      compiled,
      input,
      normalizedOptions,
      resolved.selection
    );
    resolvedProps.className = resolved.className;

    return {
      resolvedProps: resolvedProps as RootResolveResult<
        AnyRootRecipe,
        TInput,
        TOptions
      >['resolvedProps'],
      variants: materializeSelection(
        compiled,
        resolved.selection
      ) as RootResolveResult<AnyRootRecipe, TInput, TOptions>['variants'],
    };
  };

  return attachCompiled(rootRecipe as AnyRecipe, compiled);
}
