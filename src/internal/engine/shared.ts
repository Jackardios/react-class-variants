import type {
  AnyRecipe,
  RecipeConfig,
  ResolveOptions,
  SystemOptions,
  ValidateMode,
} from '../core-types';

export const compiledRecipeSymbol = Symbol('react-class-variants.compiled');
const normalizedResolveOptionsSymbol = Symbol(
  'react-class-variants.normalized-resolve-options'
);

export const reservedPublicProps = new Set([
  'children',
  'className',
  'ref',
  'render',
]);

type RecipeWithCompiled = AnyRecipe & {
  [compiledRecipeSymbol]: CompiledRecipe;
};

export type CompiledSelectionValue = string | boolean | undefined;
export type CompiledExpected =
  | CompiledSelectionValue
  | readonly CompiledSelectionValue[];
export type VariantIndex = Record<string, number>;
export type ForwardPropEntry = readonly [key: string, index: number];
export type SlotClassTable = readonly (string | undefined)[];

export type CompiledVariant<TClassName> = {
  key: string;
  defaultValue: CompiledSelectionValue;
  isBoolean: boolean;
  options: Record<string, TClassName>;
  trueClass?: TClassName;
  falseClass?: TClassName;
};

export type CompiledCompound<TClassName> = {
  className: TClassName;
  selectors: readonly (readonly [index: number, expected: CompiledExpected])[];
};

type SharedCompiledRecipe = {
  merge?: (className: string) => string;
  validate: boolean;
  variantIndex?: VariantIndex;
};

export type RootCompiledRecipe = SharedCompiledRecipe & {
  base: string;
  compounds: readonly CompiledCompound<string>[];
  mode: 'root';
  variantTable: readonly CompiledVariant<string>[];
};

export type SlotCompiledRecipe = SharedCompiledRecipe & {
  base: SlotClassTable;
  compounds: readonly CompiledCompound<SlotClassTable>[];
  mode: 'slot';
  slotNames: readonly string[];
  variantTable: readonly CompiledVariant<SlotClassTable>[];
};

export type CompiledRecipe = RootCompiledRecipe | SlotCompiledRecipe;

export type NormalizedResolveOptions = {
  readonly [normalizedResolveOptionsSymbol]: true;
  readonly forwardPropEntries?: readonly ForwardPropEntry[];
  readonly nativeAliasEntries?: readonly (readonly [string, string])[];
};

export type RuntimeSystemOptions = Omit<SystemOptions, 'validate'> & {
  freeze: 'deep' | 'none' | 'shallow';
  validate: boolean;
};

const emptyVariantOptions: Record<string, never> = {};

export function hasOwnKey(object: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isValidateEnabled(mode: ValidateMode | undefined): boolean {
  if (mode === 'always') return true;
  if (mode === 'never') return false;

  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
    .process?.env?.NODE_ENV;
  return env !== 'production';
}

export function resolveRuntimeSystemOptions(
  options: SystemOptions = {}
): RuntimeSystemOptions {
  const validate = isValidateEnabled(options.validate);

  return {
    freeze:
      options.validate === 'always' ? 'deep' : validate ? 'shallow' : 'none',
    merge: options.merge,
    validate,
  };
}

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (!value || typeof value !== 'object') return value;
  const object = value as object;
  if (Object.isFrozen(object) || seen.has(object)) return value;
  seen.add(object);

  for (const key of Object.getOwnPropertyNames(object)) {
    deepFreeze((object as Record<string, unknown>)[key], seen);
  }

  return Object.freeze(value);
}

export function freezeConfig(
  config: RecipeConfig,
  freeze: RuntimeSystemOptions['freeze']
) {
  if (freeze === 'deep') {
    deepFreeze(config);
    return;
  }

  if (freeze === 'shallow' && !Object.isFrozen(config)) {
    Object.freeze(config);
  }
}

function optionKeyForValue(value: unknown): string {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return String(value);
}

export function normalizeSelectionValue(
  isBoolean: boolean,
  value: unknown
): CompiledSelectionValue {
  if (value === undefined) return undefined;
  return isBoolean ? (value as boolean) : optionKeyForValue(value);
}

export function createVariantIndex(
  variantTable: readonly { key: string }[]
): VariantIndex {
  const variantIndex: VariantIndex = {};

  for (let index = 0; index < variantTable.length; index += 1) {
    variantIndex[variantTable[index].key] = index;
  }

  return variantIndex;
}

export function getVariantIndex(
  variantIndex: Readonly<VariantIndex> | undefined,
  key: string
): number | undefined {
  return variantIndex && hasOwnKey(variantIndex, key)
    ? variantIndex[key]
    : undefined;
}

export function ensureVariantIndex(
  compiled: CompiledRecipe
): Readonly<VariantIndex> {
  if (!compiled.variantIndex) {
    compiled.variantIndex = createVariantIndex(compiled.variantTable);
  }
  return compiled.variantIndex;
}

export function isAllowedVariantValue<TClassName>(
  variant: CompiledVariant<TClassName> | undefined,
  value: unknown
): boolean {
  if (!variant || value === undefined) {
    return false;
  }

  if (variant.isBoolean) {
    return value === true || value === false;
  }

  return hasOwnKey(variant.options, optionKeyForValue(value));
}

export function readVariantClassName<TClassName>(
  variant: CompiledVariant<TClassName>,
  value: CompiledSelectionValue
): TClassName | undefined {
  if (value === undefined) return undefined;
  if (variant.isBoolean) {
    return value === true ? variant.trueClass : variant.falseClass;
  }
  return variant.options[value as string];
}

function validateVariantValue(
  variant: CompiledVariant<unknown>,
  value: unknown,
  context: string
) {
  if (value === undefined) return;

  if (!isAllowedVariantValue(variant, value)) {
    throw new Error(
      `react-class-variants: invalid ${context} value "${String(
        value
      )}" for variant "${variant.key}".`
    );
  }
}

function compileCompoundSelection<TClassName>(
  variant: CompiledVariant<TClassName>,
  value: readonly unknown[]
) {
  const expected = new Array<CompiledSelectionValue>(value.length);

  for (let index = 0; index < value.length; index += 1) {
    expected[index] = normalizeSelectionValue(variant.isBoolean, value[index]);
  }

  return expected as readonly CompiledSelectionValue[];
}

export function compileVariants<TClassName>(params: {
  compileClassName: (context: string, value: unknown) => TClassName;
  defaultVariants: RecipeConfig['defaultVariants'];
  validate: boolean;
  variants: RecipeConfig['variants'];
}): readonly CompiledVariant<TClassName>[] {
  const { compileClassName, defaultVariants, validate, variants } = params;
  const compiledVariants: Array<CompiledVariant<TClassName>> = [];
  const defaults = defaultVariants as Record<string, unknown> | undefined;

  if (!variants) {
    if (validate && defaults) {
      for (const key in defaults) {
        if (!hasOwnKey(defaults, key)) continue;
        throw new Error(
          `react-class-variants: defaultVariants key "${key}" is not declared in variants.`
        );
      }
    }
    return compiledVariants;
  }

  for (const variantKey in variants) {
    if (!hasOwnKey(variants, variantKey)) continue;

    if (validate && reservedPublicProps.has(variantKey)) {
      throw new Error(
        `react-class-variants: variant key "${variantKey}" is reserved.`
      );
    }

    const optionMap = variants[variantKey] ?? {};
    let falseClass: TClassName | undefined;
    let hasNamedOption = false;
    let isBoolean = false;
    let options: Record<string, TClassName> | undefined;
    let trueClass: TClassName | undefined;

    for (const optionKey in optionMap) {
      if (!hasOwnKey(optionMap, optionKey)) continue;

      const className = compileClassName(
        `variants.${variantKey}.${optionKey}`,
        optionMap[optionKey]
      );

      if (optionKey === 'true') {
        isBoolean = true;
        trueClass = className;
        continue;
      }

      if (optionKey === 'false') {
        isBoolean = true;
        falseClass = className;
        continue;
      }

      hasNamedOption = true;
      options ??= {};
      options[optionKey] = className;
    }

    if (isBoolean && hasNamedOption) {
      throw new Error(
        `react-class-variants: variant "${variantKey}" cannot mix boolean options ("true"/"false") with named options.`
      );
    }

    const compiledVariant: CompiledVariant<TClassName> = {
      defaultValue: undefined,
      falseClass,
      isBoolean,
      key: variantKey,
      options: options ?? (emptyVariantOptions as Record<string, TClassName>),
      trueClass,
    };

    if (defaults && hasOwnKey(defaults, variantKey)) {
      const value = defaults[variantKey];

      if (
        validate &&
        value !== undefined &&
        !isAllowedVariantValue(compiledVariant, value)
      ) {
        throw new Error(
          `react-class-variants: invalid defaultVariants value "${String(
            value
          )}" for variant "${variantKey}".`
        );
      }

      compiledVariant.defaultValue = normalizeSelectionValue(
        compiledVariant.isBoolean,
        value
      );
    }

    compiledVariants.push(compiledVariant);
  }

  if (validate && defaults) {
    for (const key in defaults) {
      if (!hasOwnKey(defaults, key)) continue;
      if (!hasOwnKey(variants, key)) {
        throw new Error(
          `react-class-variants: defaultVariants key "${key}" is not declared in variants.`
        );
      }
    }
  }

  return compiledVariants;
}

export function compileCompounds<TClassName>(params: {
  compileClassName: (context: string, value: unknown) => TClassName;
  compounds: RecipeConfig['compoundVariants'];
  validate: boolean;
  variantTable: readonly CompiledVariant<TClassName>[];
}): readonly CompiledCompound<TClassName>[] {
  const { compileClassName, compounds, validate, variantTable } = params;
  if (!compounds || compounds.length === 0) {
    return [];
  }

  const compiledCompounds: Array<CompiledCompound<TClassName>> = [];
  const variantIndex = createVariantIndex(variantTable);

  for (const compound of compounds) {
    const selectors: Array<readonly [number, CompiledExpected]> = [];

    for (const key in compound) {
      if (!hasOwnKey(compound, key) || key === 'className') continue;

      const index = getVariantIndex(variantIndex, key);
      if (index === undefined) {
        if (validate) {
          throw new Error(
            `react-class-variants: compoundVariants key "${key}" is not declared in variants.`
          );
        }
        continue;
      }

      const variant = variantTable[index];
      const value = (compound as Record<string, unknown>)[key];

      if (Array.isArray(value)) {
        if (validate) {
          for (const candidate of value) {
            if (!isAllowedVariantValue(variant, candidate)) {
              throw new Error(
                `react-class-variants: invalid compoundVariants value "${String(
                  candidate
                )}" for variant "${key}".`
              );
            }
          }
        }

        selectors.push([index, compileCompoundSelection(variant, value)]);
        continue;
      }

      if (validate && !isAllowedVariantValue(variant, value)) {
        throw new Error(
          `react-class-variants: invalid compoundVariants value "${String(
            value
          )}" for variant "${key}".`
        );
      }

      selectors.push([
        index,
        normalizeSelectionValue(variant.isBoolean, value),
      ]);
    }

    compiledCompounds.push({
      className: compileClassName(
        'compoundVariants.className',
        (compound as { className?: unknown }).className
      ),
      selectors,
    });
  }

  return compiledCompounds;
}

function validateKnownRecipeProps(
  compiled: CompiledRecipe,
  source: Record<string, unknown>,
  context: string,
  allowUnknownProps: boolean,
  allowClassName: boolean
) {
  if (!compiled.validate || allowUnknownProps) return;

  const variantIndex = ensureVariantIndex(compiled);
  for (const key in source) {
    if (!hasOwnKey(source, key)) continue;
    if (allowClassName && key === 'className') continue;
    if (getVariantIndex(variantIndex, key) === undefined) {
      throw new Error(
        `react-class-variants: unknown ${context} prop "${key}". Use resolve() for arbitrary component props.`
      );
    }
  }
}

export function buildSelection(
  compiled: CompiledRecipe,
  input: Record<string, unknown> | undefined,
  context: string,
  allowUnknownProps: boolean,
  allowClassName: boolean
) {
  const source = input ?? {};
  const selection = new Array<CompiledSelectionValue>(
    compiled.variantTable.length
  );

  validateKnownRecipeProps(
    compiled,
    source,
    context,
    allowUnknownProps,
    allowClassName
  );

  for (let index = 0; index < compiled.variantTable.length; index += 1) {
    const variant = compiled.variantTable[index];
    let value = source[variant.key];

    if (value === undefined) {
      value = variant.defaultValue;
    }

    if (value === undefined && variant.isBoolean) {
      value = false;
    }

    if (value === undefined) {
      if (compiled.validate) {
        throw new Error(
          `react-class-variants: missing required ${context} variant "${variant.key}".`
        );
      }
      continue;
    }

    if (compiled.validate) {
      validateVariantValue(variant, value, context);
    }

    selection[index] = normalizeSelectionValue(variant.isBoolean, value);
  }

  return selection;
}

function matchesCompound(
  selection: readonly CompiledSelectionValue[],
  selectors: readonly (readonly [number, CompiledExpected])[]
) {
  for (const [index, expected] of selectors) {
    const actual = selection[index];

    if (Array.isArray(expected)) {
      let matched = false;
      for (const candidate of expected) {
        if (candidate === actual) {
          matched = true;
          break;
        }
      }
      if (!matched) return false;
      continue;
    }

    if (expected !== actual) {
      return false;
    }
  }

  return true;
}

export function forEachMatchingCompound<TClassName>(
  compounds: readonly CompiledCompound<TClassName>[],
  selection: readonly CompiledSelectionValue[],
  callback: (className: TClassName) => void
) {
  for (const compound of compounds) {
    if (matchesCompound(selection, compound.selectors)) {
      callback(compound.className);
    }
  }
}

export function materializeSelection(
  compiled: CompiledRecipe,
  selection: readonly CompiledSelectionValue[]
) {
  const variants: Record<string, CompiledSelectionValue> = {};

  for (let index = 0; index < compiled.variantTable.length; index += 1) {
    variants[compiled.variantTable[index].key] = selection[index];
  }

  return variants;
}

export function createResolvedProps(
  compiled: CompiledRecipe,
  input: Record<string, unknown> | undefined,
  options: NormalizedResolveOptions | undefined,
  selection: readonly CompiledSelectionValue[]
) {
  const resolvedProps: Record<string, unknown> = {};
  const source = input ?? {};
  const variantIndex = ensureVariantIndex(compiled);

  for (const key in source) {
    if (!hasOwnKey(source, key)) continue;
    if (getVariantIndex(variantIndex, key) !== undefined) continue;
    resolvedProps[key] = source[key];
  }

  for (const [nativeKey, aliasKey] of options?.nativeAliasEntries ?? []) {
    if (!(aliasKey in resolvedProps)) continue;

    if (compiled.validate && nativeKey in resolvedProps) {
      throw new Error(
        `react-class-variants: nativeAliases target "${nativeKey}" would overwrite an existing resolved prop.`
      );
    }

    resolvedProps[nativeKey] = resolvedProps[aliasKey];
    delete resolvedProps[aliasKey];
  }

  for (const [key, index] of options?.forwardPropEntries ?? []) {
    if (compiled.validate && key in resolvedProps) {
      throw new Error(
        `react-class-variants: forwardProps key "${key}" would overwrite an existing resolved prop.`
      );
    }

    resolvedProps[key] = selection[index];
  }

  return resolvedProps;
}

function isNormalizedResolveOptions(
  options: ResolveOptions | NormalizedResolveOptions | undefined
): options is NormalizedResolveOptions {
  return Boolean(options && normalizedResolveOptionsSymbol in options);
}

export function normalizeResolveOptions(
  compiled: CompiledRecipe,
  options: ResolveOptions | undefined
): NormalizedResolveOptions | undefined {
  if (!options) return undefined;
  if (isNormalizedResolveOptions(options)) return options;

  const forwardProps =
    options.forwardProps && options.forwardProps.length > 0
      ? options.forwardProps
      : undefined;
  const rawNativeAliases = options.nativeAliases;

  let forwardPropEntries: ForwardPropEntry[] | undefined;
  let nativeAliasEntries: Array<readonly [string, string]> | undefined;
  let variantIndex: Readonly<VariantIndex> | undefined;
  const seenAliases: Record<string, true> = {};

  if (rawNativeAliases) {
    for (const nativeKey in rawNativeAliases) {
      if (!hasOwnKey(rawNativeAliases, nativeKey)) continue;

      const aliasKey = rawNativeAliases[nativeKey];
      if (!aliasKey) continue;

      if (compiled.validate) {
        if (reservedPublicProps.has(nativeKey)) {
          throw new Error(
            `react-class-variants: native alias target "${nativeKey}" conflicts with a reserved public prop.`
          );
        }

        if (reservedPublicProps.has(aliasKey)) {
          throw new Error(
            `react-class-variants: native alias "${aliasKey}" conflicts with a reserved public prop.`
          );
        }

        variantIndex ??= ensureVariantIndex(compiled);
        if (getVariantIndex(variantIndex, aliasKey) !== undefined) {
          throw new Error(
            `react-class-variants: native alias "${aliasKey}" conflicts with a declared variant key.`
          );
        }

        if (hasOwnKey(seenAliases, aliasKey)) {
          throw new Error(
            `react-class-variants: native alias "${aliasKey}" cannot be reused.`
          );
        }
      }

      seenAliases[aliasKey] = true;
      nativeAliasEntries ??= [];
      nativeAliasEntries.push([nativeKey, aliasKey]);
    }
  }

  if (forwardProps) {
    variantIndex ??= ensureVariantIndex(compiled);

    for (const key of forwardProps) {
      const index = getVariantIndex(variantIndex, key);

      if (compiled.validate && index === undefined) {
        throw new Error(
          `react-class-variants: forwardProps key "${key}" is not declared in variants.`
        );
      }

      if (
        compiled.validate &&
        nativeAliasEntries?.some(([nativeKey]) => nativeKey === key)
      ) {
        throw new Error(
          `react-class-variants: forwardProps key "${key}" conflicts with nativeAliases target "${key}".`
        );
      }

      if (index === undefined) continue;
      forwardPropEntries ??= [];
      forwardPropEntries.push([key, index]);
    }
  }

  if (!forwardPropEntries && !nativeAliasEntries) {
    return undefined;
  }

  return {
    [normalizedResolveOptionsSymbol]: true,
    forwardPropEntries,
    nativeAliasEntries,
  };
}

export function attachCompiled<TRecipe extends AnyRecipe>(
  recipe: TRecipe,
  compiled: CompiledRecipe
) {
  (recipe as RecipeWithCompiled)[compiledRecipeSymbol] = compiled;
  return recipe;
}

export function getCompiledRecipe(recipe: AnyRecipe): CompiledRecipe {
  return (recipe as RecipeWithCompiled)[compiledRecipeSymbol];
}
