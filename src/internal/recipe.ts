/* eslint-disable @typescript-eslint/no-explicit-any -- runtime compilation intentionally erases generic recipe details. */
import type {
  AnyRecipe,
  ClassNameValue,
  RecipeConfig,
  RecipeFactory,
  ResolveOptions,
  RootRecipe,
  RootRecipeConfig,
  SlotRecipe,
  SlotRecipeConfig,
  SystemOptions,
  ValidateMode,
} from './core-types';

const compiledRecipeSymbol = Symbol('react-class-variants.compiled');
const normalizedResolveOptionsSymbol = Symbol(
  'react-class-variants.normalized-resolve-options'
);

const reservedPublicProps = new Set(['className', 'children', 'ref', 'render']);

type SlotClasses = Record<string, string>;
type VariantIndex = Record<string, number>;
type CompiledSelectionValue = string | boolean | undefined;
type CompiledExpected =
  | CompiledSelectionValue
  | readonly CompiledSelectionValue[];
type ForwardPropEntry = readonly [key: string, index: number];

type CompiledVariant<TClassName> = {
  key: string;
  defaultValue: CompiledSelectionValue;
  isBoolean: boolean;
  options: Record<string, TClassName>;
  trueClass?: TClassName;
  falseClass?: TClassName;
};

type RootCompiledVariant = CompiledVariant<string>;
type SlotCompiledVariant = CompiledVariant<SlotClasses>;

type RootCompiledCompound = {
  conditions: readonly (number | CompiledExpected)[];
  className: string;
};

type SlotCompiledCompound = {
  conditions: readonly (number | CompiledExpected)[];
  className: SlotClasses;
};

type NormalizedResolveOptions = {
  readonly [normalizedResolveOptionsSymbol]: true;
  readonly forwardPropEntries?: readonly ForwardPropEntry[];
  readonly nativeAliasEntries?: readonly [string, string][];
};

type SharedCompiledRecipe = {
  validate: boolean;
  variantIndex: Readonly<VariantIndex>;
  merge?: (className: string) => string;
};

export type RootCompiledRecipe = SharedCompiledRecipe & {
  mode: 'root';
  base: string;
  variantTable: readonly RootCompiledVariant[];
  compounds: readonly RootCompiledCompound[];
};

export type SlotCompiledRecipe = SharedCompiledRecipe & {
  mode: 'slot';
  slotNames: readonly string[];
  base: SlotClasses;
  variantTable: readonly SlotCompiledVariant[];
  compounds: readonly SlotCompiledCompound[];
};

export type CompiledRecipe = RootCompiledRecipe | SlotCompiledRecipe;

type RecipeWithCompiled = AnyRecipe & {
  [compiledRecipeSymbol]: CompiledRecipe;
};

function hasOwnKey(object: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function isValidateEnabled(mode: ValidateMode | undefined): boolean {
  if (mode === 'always') return true;
  if (mode === 'never') return false;

  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
    .process?.env?.NODE_ENV;
  return env !== 'production';
}

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (!value || typeof value !== 'object') return value;
  const object = value as object;
  if (Object.isFrozen(object)) return value;
  if (seen.has(object)) return value;
  seen.add(object);

  for (const key of Object.getOwnPropertyNames(object)) {
    deepFreeze((object as Record<string, unknown>)[key], seen);
  }

  return Object.freeze(value);
}

function validateClassNameValue(context: string, value: unknown) {
  if (value === null || typeof value === 'string') return;

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item !== 'string') {
        throw new Error(
          `react-class-variants: invalid ${context}; className arrays may only contain strings.`
        );
      }
    }
    return;
  }

  throw new Error(
    `react-class-variants: invalid ${context}; className values must be strings, null, or arrays of strings.`
  );
}

function flattenClassName(value: ClassNameValue | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value;

  let output = '';
  for (const item of value) {
    if (!item) continue;
    output = output ? `${output} ${item}` : item;
  }
  return output;
}

function appendClassName(
  current: string,
  addition: string | undefined
): string {
  if (!addition) return current;
  return current ? `${current} ${addition}` : addition;
}

function optionKeyForValue(value: unknown): string {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return String(value);
}

function normalizeSelectionValue(
  isBoolean: boolean,
  value: unknown
): CompiledSelectionValue {
  if (value === undefined) return undefined;
  return isBoolean ? (value as boolean) : optionKeyForValue(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function compileRootClassName(
  context: string,
  value: unknown,
  validate: boolean,
  allowUndefined = false
): string {
  if (value === undefined && allowUndefined) {
    return '';
  }
  if (validate) validateClassNameValue(context, value);
  return flattenClassName(value as ClassNameValue | undefined);
}

function compileSlotClassMap(
  context: string,
  value: unknown,
  declaredSlots: Readonly<Record<string, unknown>>,
  validate: boolean
): SlotClasses {
  if (!isPlainObject(value)) {
    if (validate) {
      throw new Error(
        `react-class-variants: ${context} must be an explicit slot className map.`
      );
    }
    return {};
  }

  const output: SlotClasses = {};
  for (const slot in value) {
    if (!hasOwnKey(value, slot)) continue;

    if (validate && !hasOwnKey(declaredSlots, slot)) {
      throw new Error(
        `react-class-variants: invalid ${context}; slot "${slot}" is not declared in recipe.slots.`
      );
    }

    const className = value[slot];
    if (validate) validateClassNameValue(`${context}.${slot}`, className);
    output[slot] = flattenClassName(className as ClassNameValue | undefined);
  }
  return output;
}

function compileVariants<TClassName>(
  variants: RecipeConfig['variants'],
  validate: boolean,
  compileClassName: (context: string, value: unknown) => TClassName
) {
  const variantTable: Array<CompiledVariant<TClassName>> = [];
  const variantIndex: VariantIndex = {};

  if (!variants) return { variantIndex, variantTable };

  for (const variantKey in variants) {
    if (!hasOwnKey(variants, variantKey)) continue;

    if (validate && reservedPublicProps.has(variantKey)) {
      throw new Error(
        `react-class-variants: variant key "${variantKey}" is reserved.`
      );
    }

    const options = variants[variantKey] ?? {};
    const compiledOptions: Record<string, TClassName> = {};
    let isBoolean = false;
    let trueClass: TClassName | undefined;
    let falseClass: TClassName | undefined;

    for (const optionKey in options) {
      if (!hasOwnKey(options, optionKey)) continue;

      const context = validate ? `variants.${variantKey}.${optionKey}` : '';
      const compiledClassName = compileClassName(context, options[optionKey]);
      compiledOptions[optionKey] = compiledClassName;

      if (optionKey === 'true') {
        isBoolean = true;
        trueClass = compiledClassName;
      } else if (optionKey === 'false') {
        isBoolean = true;
        falseClass = compiledClassName;
      }
    }

    variantIndex[variantKey] = variantTable.length;
    variantTable.push({
      defaultValue: undefined,
      falseClass,
      isBoolean,
      key: variantKey,
      options: compiledOptions,
      trueClass,
    });
  }

  return { variantIndex, variantTable };
}

function getVariantIndex(
  variantIndex: Readonly<VariantIndex>,
  key: string
): number | undefined {
  return hasOwnKey(variantIndex, key) ? variantIndex[key] : undefined;
}

export function isDeclaredVariantKey(
  compiled: CompiledRecipe,
  key: string
): boolean {
  return getVariantIndex(compiled.variantIndex, key) !== undefined;
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
  if (!options) return;
  if (isNormalizedResolveOptions(options)) return options;

  const forwardProps =
    options.forwardProps && options.forwardProps.length > 0
      ? options.forwardProps
      : undefined;
  const rawNativeAliases = options.nativeAliases;

  let forwardPropEntries: ForwardPropEntry[] | undefined;
  let nativeAliasEntries: Array<[string, string]> | undefined;
  let nativeAliases: Record<string, string> | undefined;
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

        if (getVariantIndex(compiled.variantIndex, aliasKey) !== undefined) {
          throw new Error(
            `react-class-variants: native alias "${aliasKey}" conflicts with a declared variant key.`
          );
        }

        if (hasOwnKey(seenAliases, aliasKey)) {
          throw new Error(
            `react-class-variants: native alias "${aliasKey}" cannot be reused.`
          );
        }
        seenAliases[aliasKey] = true;
      }

      if (!nativeAliases) nativeAliases = {};
      if (!nativeAliasEntries) nativeAliasEntries = [];

      nativeAliases[nativeKey] = aliasKey;
      nativeAliasEntries.push([nativeKey, aliasKey]);
    }
  }

  if (compiled.validate) {
    for (const key of forwardProps ?? []) {
      if (getVariantIndex(compiled.variantIndex, key) === undefined) {
        throw new Error(
          `react-class-variants: forwardProps key "${key}" is not declared in variants.`
        );
      }

      if (nativeAliases && hasOwnKey(nativeAliases, key)) {
        throw new Error(
          `react-class-variants: forwardProps key "${key}" conflicts with nativeAliases target "${key}".`
        );
      }
    }
  }

  for (const key of forwardProps ?? []) {
    const index = getVariantIndex(compiled.variantIndex, key);
    if (index === undefined) continue;
    if (!forwardPropEntries) forwardPropEntries = [];
    forwardPropEntries.push([key, index]);
  }

  if (!forwardPropEntries && !nativeAliasEntries) return;

  return {
    [normalizedResolveOptionsSymbol]: true,
    forwardPropEntries,
    nativeAliasEntries,
  };
}

function isAllowedVariantValue<TClassName>(
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

function compileDefaults(
  defaultVariants: RecipeConfig['defaultVariants'],
  variantTable: Array<CompiledVariant<unknown>>,
  variantIndex: Readonly<VariantIndex>,
  validate: boolean
) {
  if (!defaultVariants) return;

  const defaults = defaultVariants as Record<string, unknown>;

  for (const key in defaults) {
    if (!hasOwnKey(defaults, key)) continue;

    const index = getVariantIndex(variantIndex, key);
    if (index === undefined) {
      if (!validate) continue;
      throw new Error(
        `react-class-variants: defaultVariants key "${key}" is not declared in variants.`
      );
    }

    const variant = variantTable[index];
    const value = defaults[key];
    if (
      validate &&
      value !== undefined &&
      !isAllowedVariantValue(variant, value)
    ) {
      throw new Error(
        `react-class-variants: invalid defaultVariants value "${String(
          value
        )}" for variant "${key}".`
      );
    }

    variant.defaultValue = normalizeSelectionValue(variant.isBoolean, value);
  }
}

function compileCompoundVariants<TClassName>(
  compounds: RecipeConfig['compoundVariants'],
  variantTable: readonly CompiledVariant<TClassName>[],
  variantIndex: Readonly<VariantIndex>,
  validate: boolean,
  compileClassName: (context: string, value: unknown) => TClassName
) {
  const output: Array<{
    conditions: Array<number | CompiledExpected>;
    className: TClassName;
  }> = [];

  if (!compounds) return output;

  for (const compound of compounds) {
    const conditions: Array<number | CompiledExpected> = [];

    for (const key in compound) {
      if (!hasOwnKey(compound, key)) continue;
      if (key === 'className') continue;

      const index = getVariantIndex(variantIndex, key);
      if (index === undefined) {
        if (!validate) continue;
        throw new Error(
          `react-class-variants: compoundVariants key "${key}" is not declared in variants.`
        );
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
        conditions.push(index);
        conditions.push(
          value.map(candidate =>
            normalizeSelectionValue(variant.isBoolean, candidate)
          )
        );
        continue;
      }

      if (validate && !isAllowedVariantValue(variant, value)) {
        throw new Error(
          `react-class-variants: invalid compoundVariants value "${String(
            value
          )}" for variant "${key}".`
        );
      }
      conditions.push(index);
      conditions.push(normalizeSelectionValue(variant.isBoolean, value));
    }

    output.push({
      conditions,
      className: compileClassName(
        validate ? 'compoundVariants.className' : '',
        (compound as { className?: unknown }).className
      ),
    });
  }

  return output;
}

function compileRootRecipeConfig(
  config: RootRecipeConfig<any, any>,
  options: SystemOptions
): RootCompiledRecipe {
  const validate = isValidateEnabled(options.validate);
  const base = compileRootClassName('base', config.base, validate, true);
  const { variantIndex, variantTable } = compileVariants(
    config.variants,
    validate,
    (context, value) => compileRootClassName(context, value, validate)
  );
  compileDefaults(
    config.defaultVariants,
    variantTable as Array<CompiledVariant<unknown>>,
    variantIndex,
    validate
  );
  const compounds = compileCompoundVariants(
    config.compoundVariants,
    variantTable,
    variantIndex,
    validate,
    (context, value) => compileRootClassName(context, value, validate)
  );

  if (validate) deepFreeze(config);

  return {
    base,
    compounds,
    merge: options.merge,
    mode: 'root',
    validate,
    variantIndex,
    variantTable,
  };
}

function compileSlotBase(
  config: SlotRecipeConfig<any, any, any>,
  validate: boolean
) {
  if (validate && hasOwnKey(config, 'base')) {
    throw new Error(
      'react-class-variants: recipe config cannot define both "base" and "slots".'
    );
  }

  if (validate && !isPlainObject(config.slots)) {
    throw new Error(
      'react-class-variants: slotted recipes require a slots object.'
    );
  }

  const slotNames: string[] = [];
  const base: SlotClasses = {};

  for (const slot in config.slots) {
    if (!hasOwnKey(config.slots, slot)) continue;

    slotNames.push(slot);
    const className = config.slots[slot];
    if (validate) validateClassNameValue(`slots.${slot}`, className);
    base[slot] = flattenClassName(className);
  }

  return { base, slotNames };
}

function compileSlotRecipeConfig(
  config: SlotRecipeConfig<any, any, any>,
  options: SystemOptions
): SlotCompiledRecipe {
  const validate = isValidateEnabled(options.validate);
  const { base, slotNames } = compileSlotBase(config, validate);
  const { variantIndex, variantTable } = compileVariants(
    config.variants,
    validate,
    (context, value) => compileSlotClassMap(context, value, base, validate)
  );
  compileDefaults(
    config.defaultVariants,
    variantTable as Array<CompiledVariant<unknown>>,
    variantIndex,
    validate
  );
  const compounds = compileCompoundVariants(
    config.compoundVariants,
    variantTable,
    variantIndex,
    validate,
    (context, value) => compileSlotClassMap(context, value, base, validate)
  );

  if (validate) deepFreeze(config);

  return {
    base,
    compounds,
    merge: options.merge,
    mode: 'slot',
    slotNames,
    validate,
    variantIndex,
    variantTable,
  };
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

function buildSelection(
  compiled: CompiledRecipe,
  input: Record<string, unknown> | undefined,
  context: string,
  allowUnknownProps: boolean
) {
  const source = input ?? {};
  const selection = new Array<CompiledSelectionValue>(
    compiled.variantTable.length
  );

  if (compiled.validate && !allowUnknownProps) {
    for (const key in source) {
      if (!hasOwnKey(source, key)) continue;
      if (key === 'className' && compiled.mode === 'root') continue;
      if (getVariantIndex(compiled.variantIndex, key) === undefined) {
        throw new Error(
          `react-class-variants: unknown ${context} prop "${key}". Use resolve() for arbitrary component props.`
        );
      }
    }
  }

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
  compound: RootCompiledCompound | SlotCompiledCompound,
  selection: readonly CompiledSelectionValue[]
) {
  for (let index = 0; index < compound.conditions.length; index += 2) {
    const value = selection[compound.conditions[index] as number];
    const expected = compound.conditions[index + 1] as CompiledExpected;

    if (Array.isArray(expected)) {
      let matched = false;

      for (const candidate of expected) {
        if (candidate === value) {
          matched = true;
          break;
        }
      }

      if (!matched) return false;
      continue;
    }

    if (expected !== value) {
      return false;
    }
  }

  return true;
}

function resolveRootClassName(
  compiled: RootCompiledRecipe,
  selection: readonly CompiledSelectionValue[],
  className?: ClassNameValue
) {
  let output = compiled.base;

  for (let index = 0; index < compiled.variantTable.length; index += 1) {
    const variant = compiled.variantTable[index];
    const value = selection[index];
    if (value === undefined) continue;

    output = appendClassName(
      output,
      variant.isBoolean
        ? value === true
          ? variant.trueClass
          : variant.falseClass
        : variant.options[value as string]
    );
  }

  for (const compound of compiled.compounds) {
    if (matchesCompound(compound, selection)) {
      output = appendClassName(output, compound.className);
    }
  }

  output = appendClassName(output, flattenClassName(className));
  return compiled.merge ? compiled.merge(output) : output;
}

function resolveSlotClassName(
  compiled: SlotCompiledRecipe,
  slot: string,
  selection: readonly CompiledSelectionValue[],
  className?: ClassNameValue
) {
  let output = compiled.base[slot] ?? '';

  for (let index = 0; index < compiled.variantTable.length; index += 1) {
    const variant = compiled.variantTable[index];
    const value = selection[index];
    if (value === undefined) continue;

    output = appendClassName(
      output,
      variant.isBoolean
        ? value === true
          ? variant.trueClass?.[slot]
          : variant.falseClass?.[slot]
        : variant.options[value as string]?.[slot]
    );
  }

  for (const compound of compiled.compounds) {
    if (matchesCompound(compound, selection)) {
      output = appendClassName(output, compound.className[slot]);
    }
  }

  output = appendClassName(output, flattenClassName(className));
  return compiled.merge ? compiled.merge(output) : output;
}

function createSlotRenderers(
  compiled: SlotCompiledRecipe,
  parentSelection: readonly CompiledSelectionValue[]
) {
  const slots: Record<string, (input?: Record<string, unknown>) => string> = {};

  for (const slot of compiled.slotNames) {
    slots[slot] = (input?: Record<string, unknown>) => {
      const selection = parentSelection.slice();

      if (input) {
        for (const key in input) {
          if (!hasOwnKey(input, key)) continue;
          if (key === 'className') continue;

          const variantIndex = getVariantIndex(compiled.variantIndex, key);
          if (variantIndex === undefined) {
            if (compiled.validate) {
              throw new Error(
                `react-class-variants: unknown slot override prop "${key}".`
              );
            }
            continue;
          }

          const variant = compiled.variantTable[variantIndex];

          const value = input[key];
          if (value === undefined) continue;

          if (compiled.validate) {
            validateVariantValue(variant, value, 'slot override');
          }

          selection[variantIndex] = normalizeSelectionValue(
            variant.isBoolean,
            value
          );
        }
      }

      return resolveSlotClassName(
        compiled,
        slot,
        selection,
        input?.className as ClassNameValue | undefined
      );
    };
  }

  return slots;
}

function resolveRoot(
  compiled: RootCompiledRecipe,
  input: Record<string, unknown> | undefined,
  allowUnknownProps: boolean
) {
  const selection = buildSelection(
    compiled,
    input,
    'recipe',
    allowUnknownProps
  );
  const className = resolveRootClassName(
    compiled,
    selection,
    input?.className as ClassNameValue | undefined
  );
  return { className, selection };
}

function materializeSelection(
  compiled: CompiledRecipe,
  selection: readonly CompiledSelectionValue[]
) {
  const variants: Record<string, CompiledSelectionValue> = {};

  for (let index = 0; index < compiled.variantTable.length; index += 1) {
    variants[compiled.variantTable[index].key] = selection[index];
  }

  return variants;
}

function createResolvedProps(
  compiled: CompiledRecipe,
  input: Record<string, unknown> | undefined,
  options: NormalizedResolveOptions | undefined,
  selection: readonly CompiledSelectionValue[]
) {
  const resolvedProps: Record<string, unknown> = {};
  const source = input ?? {};

  for (const key in source) {
    if (!hasOwnKey(source, key)) continue;
    if (getVariantIndex(compiled.variantIndex, key) !== undefined) continue;
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
    if (key in resolvedProps && compiled.validate) {
      throw new Error(
        `react-class-variants: forwardProps key "${key}" would overwrite an existing resolved prop.`
      );
    }
    resolvedProps[key] = selection[index];
  }

  return resolvedProps;
}

function attachCompiled<TRecipe extends AnyRecipe>(
  recipe: TRecipe,
  compiled: CompiledRecipe
) {
  Object.defineProperty(recipe, compiledRecipeSymbol, {
    value: compiled,
  });
  return recipe;
}

function createRootRecipe(
  config: RootRecipeConfig<any, any>,
  compiled: RootCompiledRecipe
): AnyRecipe {
  const rootRecipe = ((input?: Record<string, unknown>) =>
    resolveRoot(compiled, input, false).className) as RootRecipe<any, any, any>;

  (rootRecipe as any).resolve = (
    input?: Record<string, unknown>,
    options?: ResolveOptions
  ) => {
    const normalizedOptions = normalizeResolveOptions(compiled, options);
    const { className, selection } = resolveRoot(compiled, input, true);
    const resolvedProps = createResolvedProps(
      compiled,
      input,
      normalizedOptions,
      selection
    );
    resolvedProps.className = className;

    return {
      variants: materializeSelection(compiled, selection),
      resolvedProps: resolvedProps as Record<string, unknown> & {
        className: string;
      },
    };
  };

  Object.defineProperty(rootRecipe, 'config', {
    enumerable: true,
    value: config,
  });

  return attachCompiled(rootRecipe as AnyRecipe, compiled);
}

function createSlotRecipe(
  config: SlotRecipeConfig<any, any, any>,
  compiled: SlotCompiledRecipe
): AnyRecipe {
  const slotRecipe = ((input?: Record<string, unknown>) => {
    if (compiled.validate && input && 'className' in input) {
      throw new Error(
        'react-class-variants: className cannot be passed directly to a slotted recipe call. Use slot functions instead.'
      );
    }

    const selection = buildSelection(compiled, input, 'recipe', false);
    return createSlotRenderers(compiled, selection);
  }) as SlotRecipe<any, any, any, any>;

  (slotRecipe as any).resolve = (
    input?: Record<string, unknown>,
    options?: ResolveOptions
  ) => {
    const normalizedOptions = normalizeResolveOptions(compiled, options);
    const selection = buildSelection(compiled, input, 'recipe', true);
    return {
      variants: materializeSelection(compiled, selection),
      slots: createSlotRenderers(compiled, selection),
      resolvedProps: createResolvedProps(
        compiled,
        input,
        normalizedOptions,
        selection
      ),
    };
  };

  Object.defineProperty(slotRecipe, 'config', {
    enumerable: true,
    value: config,
  });

  return attachCompiled(slotRecipe as AnyRecipe, compiled);
}

export function createRecipeFactory(
  options: SystemOptions = {}
): RecipeFactory {
  return ((config: RecipeConfig) => {
    if (hasOwnKey(config, 'slots')) {
      const slotConfig = config as SlotRecipeConfig<any, any, any>;
      const compiled = compileSlotRecipeConfig(slotConfig, options);
      return createSlotRecipe(slotConfig, compiled);
    }

    const rootConfig = config as RootRecipeConfig<any, any>;
    const compiled = compileRootRecipeConfig(rootConfig, options);
    return createRootRecipe(rootConfig, compiled);
  }) as RecipeFactory;
}

export function getCompiledRecipe(recipe: AnyRecipe): CompiledRecipe {
  return (recipe as RecipeWithCompiled)[compiledRecipeSymbol];
}

export function isRootRecipe(recipe: AnyRecipe): boolean {
  return getCompiledRecipe(recipe).mode === 'root';
}
