import type {
  AnyRootRecipeConfig,
  AnyRecipe,
  ClassNameValue,
  ResolveOptions,
  RootRecipe,
} from '../core-types';
import {
  appendClassName,
  flattenClassName,
  flattenUserClassName,
  validateClassNameValue,
} from '../class-name';
import {
  attachCompiled,
  buildSelection,
  compileCompounds,
  compileVariants,
  createResolvedProps,
  forEachMatchingCompound,
  freezeConfig,
  materializeSelection,
  normalizeResolveOptions,
  readVariantClassName,
  type NormalizedResolveOptions,
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
  const variantTable = compileVariants({
    compileClassName: (context, value) =>
      compileRootClassName(context, value, options.validate),
    defaultVariants: config.defaultVariants,
    validate: options.validate,
    variants: config.variants,
  });

  const compiled: RootCompiledRecipe = {
    base: compileRootClassName('base', config.base, options.validate),
    compounds: compileCompounds({
      compileClassName: (context, value) =>
        compileRootClassName(context, value, options.validate),
      compounds: config.compoundVariants,
      validate: options.validate,
      variantTable,
    }),
    merge: options.merge,
    mode: 'root',
    validate: options.validate,
    variantTable,
  };

  freezeConfig(config, options.freeze);
  return compiled;
}

function resolveRootClassName(
  compiled: RootCompiledRecipe,
  input: Record<string, unknown> | undefined,
  allowUnknownProps: boolean
) {
  const selection = buildSelection(
    compiled,
    input,
    'recipe',
    allowUnknownProps,
    true
  );
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

  className = appendClassName(
    className,
    flattenUserClassName(
      'input.className',
      input?.className as ClassNameValue | undefined,
      compiled.validate
    )
  );

  return {
    className: compiled.merge ? compiled.merge(className) : className,
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

export function createRootRecipe(compiled: RootCompiledRecipe): AnyRecipe {
  const rootRecipe = ((input?: Record<string, unknown>) =>
    resolveRootClassName(compiled, input, false).className) as RootRecipe & {
    resolve: RootRecipe['resolve'];
  };

  rootRecipe.resolve = (
    input?: Record<string, unknown>,
    options?: ResolveOptions
  ) => {
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
      resolvedProps: resolvedProps as Record<string, unknown> & {
        className: string;
      },
      variants: materializeSelection(compiled, resolved.selection),
    } as ReturnType<RootRecipe['resolve']>;
  };

  return attachCompiled(rootRecipe as AnyRecipe, compiled);
}
