import type {
  AnyRecipe,
  AnyRootRecipeConfig,
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
  compileLeanCompounds,
  compileVariants,
  createResolvedProps,
  forEachMatchingCompound,
  forEachMatchingLeanCompound,
  freezeConfig,
  materializeSelection,
  normalizeResolveOptions,
  normalizeSelectionValue,
  readVariantClassName,
  type LeanRootCompiledRecipe,
  type NormalizedResolveOptions,
  type RootCompiledRecipe,
  type RuntimeSystemOptions,
  type StrictRootCompiledRecipe,
  type CompiledSelectionValue,
} from './shared';

function compileRootClassNameStrict(
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

function compileRootClassNameLean(value: unknown) {
  if (value === undefined) {
    return '';
  }
  return flattenClassName(value as ClassNameValue | undefined);
}

export function compileStrictRootRecipe(
  config: AnyRootRecipeConfig,
  options: RuntimeSystemOptions
): StrictRootCompiledRecipe {
  const variantTable = compileVariants({
    compileClassName: (context, value) =>
      compileRootClassNameStrict(context, value, options.validate),
    defaultVariants: config.defaultVariants,
    validate: options.validate,
    variants: config.variants,
  });

  const compiled: StrictRootCompiledRecipe = {
    base: compileRootClassNameStrict('base', config.base, options.validate),
    compounds: compileCompounds({
      compileClassName: (context, value) =>
        compileRootClassNameStrict(context, value, options.validate),
      compounds: config.compoundVariants,
      validate: options.validate,
      variantTable,
    }),
    merge: options.merge,
    mode: 'root',
    runtime: 'strict',
    validate: options.validate,
    variantTable,
  };

  freezeConfig(config, options.freeze);
  return compiled;
}

export function compileLeanRootRecipe(
  config: AnyRootRecipeConfig,
  options: RuntimeSystemOptions
): LeanRootCompiledRecipe {
  const variantTable = compileVariants({
    compileClassName: (_context, value) => compileRootClassNameLean(value),
    defaultVariants: config.defaultVariants,
    validate: false,
    variants: config.variants,
  });

  return {
    base: compileRootClassNameLean(config.base),
    compounds: compileLeanCompounds({
      compileClassName: (_context, value) => compileRootClassNameLean(value),
      compounds: config.compoundVariants,
      validate: false,
      variantTable,
    }),
    merge: options.merge,
    mode: 'root',
    runtime: 'lean',
    validate: false,
    variantTable,
  };
}

export function compileRootRecipe(
  config: AnyRootRecipeConfig,
  options: RuntimeSystemOptions
): RootCompiledRecipe {
  return options.mode === 'lean'
    ? compileLeanRootRecipe(config, options)
    : compileStrictRootRecipe(config, options);
}

function buildRootSelectionLean(
  compiled: LeanRootCompiledRecipe,
  input: Record<string, unknown> | undefined
) {
  const selection = new Array<CompiledSelectionValue>(
    compiled.variantTable.length
  );
  const source = input ?? {};

  for (let index = 0; index < compiled.variantTable.length; index += 1) {
    const variant = compiled.variantTable[index];
    let value = source[variant.key];

    if (value === undefined) {
      value = variant.defaultValue;
    }

    if (value === undefined && variant.isBoolean) {
      selection[index] = false;
      continue;
    }

    if (value === undefined) {
      continue;
    }

    selection[index] = normalizeSelectionValue(variant.isBoolean, value);
  }

  return selection;
}

function resolveStrictRootClassName(
  compiled: StrictRootCompiledRecipe,
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
      true
    )
  );

  return {
    className: compiled.merge ? compiled.merge(className) : className,
    selection,
  };
}

function resolveLeanRootClassName(
  compiled: LeanRootCompiledRecipe,
  input: Record<string, unknown> | undefined
) {
  const selection = buildRootSelectionLean(compiled, input);
  let className = compiled.base;

  for (let index = 0; index < compiled.variantTable.length; index += 1) {
    className = appendClassName(
      className,
      readVariantClassName(compiled.variantTable[index], selection[index])
    );
  }

  forEachMatchingLeanCompound(
    compiled.compounds,
    selection,
    compoundClassName => {
      className = appendClassName(className, compoundClassName);
    }
  );

  className = appendClassName(
    className,
    flattenUserClassName(
      'input.className',
      input?.className as ClassNameValue | undefined,
      false
    )
  );

  return {
    className: compiled.merge ? compiled.merge(className) : className,
    selection,
  };
}

function resolveRootClassName(
  compiled: RootCompiledRecipe,
  input: Record<string, unknown> | undefined,
  allowUnknownProps: boolean
) {
  if (compiled.runtime === 'lean') {
    return resolveLeanRootClassName(compiled, input);
  }

  return resolveStrictRootClassName(compiled, input, allowUnknownProps);
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

export function createStrictRootRecipe(
  compiled: StrictRootCompiledRecipe
): AnyRecipe {
  const rootRecipe = ((input?: Record<string, unknown>) =>
    resolveStrictRootClassName(compiled, input, false)
      .className) as RootRecipe & {
    resolve: RootRecipe['resolve'];
  };

  rootRecipe.resolve = (
    input?: Record<string, unknown>,
    options?: ResolveOptions
  ) => {
    const normalizedOptions = normalizeResolveOptions(compiled, options);
    const resolved = resolveStrictRootClassName(compiled, input, true);
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

export function createLeanRootRecipe(
  compiled: LeanRootCompiledRecipe
): AnyRecipe {
  const rootRecipe = ((input?: Record<string, unknown>) =>
    resolveLeanRootClassName(compiled, input).className) as RootRecipe & {
    resolve: RootRecipe['resolve'];
  };

  rootRecipe.resolve = (
    input?: Record<string, unknown>,
    options?: ResolveOptions
  ) => {
    const normalizedOptions = normalizeResolveOptions(compiled, options);
    const resolved = resolveLeanRootClassName(compiled, input);
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

export function createRootRecipe(compiled: RootCompiledRecipe): AnyRecipe {
  return compiled.runtime === 'lean'
    ? createLeanRootRecipe(compiled)
    : createStrictRootRecipe(compiled);
}
