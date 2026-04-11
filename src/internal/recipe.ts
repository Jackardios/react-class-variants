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
import {
  appendClassName,
  flattenClassName,
  flattenUserClassName,
  validateClassNameValue,
} from './class-name';

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
type CompiledCompoundCondition = number | CompiledExpected;

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

export type NormalizedResolveOptions = {
  readonly [normalizedResolveOptionsSymbol]: true;
  readonly forwardPropEntries?: readonly ForwardPropEntry[];
  readonly nativeAliasEntries?: readonly [string, string][];
};

type SharedCompiledRecipe = {
  validate: boolean;
  variantIndex?: VariantIndex;
  merge?: (className: string) => string;
};

type RuntimeSystemOptions = Omit<SystemOptions, 'validate'> & {
  validate: boolean;
};

export type RootCompiledRecipe = SharedCompiledRecipe & {
  mode: 'root';
  base: string;
  variantTable: readonly RootCompiledVariant[];
  compoundConditions: readonly CompiledCompoundCondition[];
  compoundClassNames: readonly string[];
};

export type SlotCompiledRecipe = SharedCompiledRecipe & {
  mode: 'slot';
  slotNames: readonly string[];
  base: SlotClasses;
  variantTable: readonly SlotCompiledVariant[];
  compoundConditions: readonly CompiledCompoundCondition[];
  compoundClassNames: readonly SlotClasses[];
};

export type CompiledRecipe = RootCompiledRecipe | SlotCompiledRecipe;

type RecipeWithCompiled = AnyRecipe & {
  [compiledRecipeSymbol]: CompiledRecipe;
};

const emptyVariantOptions: Record<string, never> = {};
const emptyCompoundConditions: readonly CompiledCompoundCondition[] = [];
const emptyCompoundClassNames: readonly never[] = [];
const compoundBoundary = -1;

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

  if (!validate) {
    let allStrings = true;

    for (const slot in value) {
      if (!hasOwnKey(value, slot)) continue;
      if (typeof value[slot] !== 'string') {
        allStrings = false;
        break;
      }
    }

    if (allStrings) {
      return { ...(value as Record<string, string>) };
    }
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
  defaultVariants: RecipeConfig['defaultVariants'],
  validate: boolean,
  compileClassName: (context: string, value: unknown) => TClassName
) {
  const variantTable: Array<CompiledVariant<TClassName>> = [];
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
    return variantTable;
  }

  for (const variantKey in variants) {
    if (!hasOwnKey(variants, variantKey)) continue;

    if (validate && reservedPublicProps.has(variantKey)) {
      throw new Error(
        `react-class-variants: variant key "${variantKey}" is reserved.`
      );
    }

    const options = variants[variantKey] ?? {};
    let compiledOptions: Record<string, TClassName> | undefined;
    let isBoolean = false;
    let hasNamedOption = false;
    let trueClass: TClassName | undefined;
    let falseClass: TClassName | undefined;

    for (const optionKey in options) {
      if (!hasOwnKey(options, optionKey)) continue;

      const context = validate ? `variants.${variantKey}.${optionKey}` : '';
      const compiledClassName = compileClassName(context, options[optionKey]);

      if (optionKey === 'true') {
        isBoolean = true;
        trueClass = compiledClassName;
      } else if (optionKey === 'false') {
        isBoolean = true;
        falseClass = compiledClassName;
      } else {
        hasNamedOption = true;
        compiledOptions ??= {};
        compiledOptions[optionKey] = compiledClassName;
      }
    }

    if (isBoolean && hasNamedOption) {
      throw new Error(
        `react-class-variants: variant "${variantKey}" cannot mix boolean options ("true"/"false") with named options.`
      );
    }

    const variant: CompiledVariant<TClassName> = {
      defaultValue: undefined,
      falseClass,
      isBoolean,
      key: variantKey,
      options:
        compiledOptions ?? (emptyVariantOptions as Record<string, TClassName>),
      trueClass,
    };

    if (defaults && hasOwnKey(defaults, variantKey)) {
      const value = defaults[variantKey];
      if (
        validate &&
        value !== undefined &&
        !isAllowedVariantValue(variant, value)
      ) {
        throw new Error(
          `react-class-variants: invalid defaultVariants value "${String(
            value
          )}" for variant "${variantKey}".`
        );
      }

      variant.defaultValue = normalizeSelectionValue(variant.isBoolean, value);
    }

    variantTable.push(variant);
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

  return variantTable;
}

function getVariantIndex(
  variantIndex: Readonly<VariantIndex> | undefined,
  key: string
): number | undefined {
  return variantIndex && hasOwnKey(variantIndex, key)
    ? variantIndex[key]
    : undefined;
}

function createVariantIndex(variantTable: readonly { key: string }[]) {
  const variantIndex: VariantIndex = {};

  for (let index = 0; index < variantTable.length; index += 1) {
    variantIndex[variantTable[index].key] = index;
  }

  return variantIndex;
}

function ensureVariantIndex(compiled: CompiledRecipe): Readonly<VariantIndex> {
  if (!compiled.variantIndex) {
    compiled.variantIndex = createVariantIndex(compiled.variantTable);
  }
  return compiled.variantIndex;
}

export function isDeclaredVariantKey(
  compiled: CompiledRecipe,
  key: string
): boolean {
  return getVariantIndex(ensureVariantIndex(compiled), key) !== undefined;
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
      variantIndex ??= ensureVariantIndex(compiled);
      if (getVariantIndex(variantIndex, key) === undefined) {
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
    variantIndex ??= ensureVariantIndex(compiled);
    const index = getVariantIndex(variantIndex, key);
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

function compileCompoundVariants<TClassName>(
  compounds: RecipeConfig['compoundVariants'],
  variantTable: readonly CompiledVariant<TClassName>[],
  validate: boolean,
  compileClassName: (context: string, value: unknown) => TClassName
) {
  if (!compounds || compounds.length === 0) {
    return {
      compoundClassNames: emptyCompoundClassNames as readonly TClassName[],
      compoundConditions: emptyCompoundConditions,
    };
  }

  const compoundClassNames: TClassName[] = [];
  const compoundConditions: CompiledCompoundCondition[] = [];
  const variantIndex = createVariantIndex(variantTable);

  for (const compound of compounds) {
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
        compoundConditions.push(
          index,
          compileCompoundSelection(variant, value)
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
      compoundConditions.push(
        index,
        normalizeSelectionValue(variant.isBoolean, value)
      );
    }

    compoundConditions.push(compoundBoundary);
    compoundClassNames.push(
      compileClassName(
        validate ? 'compoundVariants.className' : '',
        (compound as { className?: unknown }).className
      )
    );
  }

  return { compoundClassNames, compoundConditions };
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

function compileCompoundVariantsProd<TClassName>(
  compounds: RecipeConfig['compoundVariants'],
  variantTable: readonly CompiledVariant<TClassName>[],
  compileClassName: (value: unknown) => TClassName
) {
  if (!compounds || compounds.length === 0) {
    return {
      compoundClassNames: emptyCompoundClassNames as readonly TClassName[],
      compoundConditions: emptyCompoundConditions,
    };
  }

  const compoundClassNames: TClassName[] = [];
  const compoundConditions: CompiledCompoundCondition[] = [];
  const variantIndex = createVariantIndex(variantTable);

  for (const compound of compounds) {
    for (const key in compound) {
      if (!hasOwnKey(compound, key)) continue;
      if (key === 'className') continue;

      const index = getVariantIndex(variantIndex, key);
      if (index === undefined) continue;

      const variant = variantTable[index];
      const value = (compound as Record<string, unknown>)[key];

      if (Array.isArray(value)) {
        compoundConditions.push(
          index,
          compileCompoundSelection(variant, value)
        );
      } else {
        compoundConditions.push(
          index,
          normalizeSelectionValue(variant.isBoolean, value)
        );
      }
    }

    compoundConditions.push(compoundBoundary);
    compoundClassNames.push(
      compileClassName((compound as { className?: unknown }).className)
    );
  }

  return { compoundClassNames, compoundConditions };
}

function createRootCompiledRecipe(
  options: RuntimeSystemOptions,
  validate: boolean,
  base: string,
  variantTable: readonly RootCompiledVariant[],
  compoundConditions: readonly CompiledCompoundCondition[],
  compoundClassNames: readonly string[]
): RootCompiledRecipe {
  return {
    base,
    compoundClassNames,
    compoundConditions,
    merge: options.merge,
    mode: 'root',
    validate,
    variantTable,
  };
}

function createSlotCompiledRecipe(
  options: RuntimeSystemOptions,
  validate: boolean,
  slotNames: readonly string[],
  base: SlotClasses,
  variantTable: readonly SlotCompiledVariant[],
  compoundConditions: readonly CompiledCompoundCondition[],
  compoundClassNames: readonly SlotClasses[]
): SlotCompiledRecipe {
  return {
    base,
    compoundClassNames,
    compoundConditions,
    merge: options.merge,
    mode: 'slot',
    slotNames,
    validate,
    variantTable,
  };
}

function compileRootRecipeConfig(
  config: RootRecipeConfig<any, any>,
  options: RuntimeSystemOptions
): RootCompiledRecipe {
  const validate = options.validate;
  const base = validate
    ? compileRootClassName('base', config.base, true, true)
    : flattenClassName(config.base as ClassNameValue | undefined);
  const compileClassName = validate
    ? (context: string, value: unknown) =>
        compileRootClassName(context, value, true)
    : (_: string, value: unknown) =>
        flattenClassName(value as ClassNameValue | undefined);
  const variantTable = compileVariants(
    config.variants,
    config.defaultVariants,
    validate,
    compileClassName
  );
  const { compoundClassNames, compoundConditions } = validate
    ? compileCompoundVariants(
        config.compoundVariants,
        variantTable,
        true,
        compileClassName
      )
    : compileCompoundVariantsProd(
        config.compoundVariants,
        variantTable,
        value => flattenClassName(value as ClassNameValue | undefined)
      );

  if (validate) deepFreeze(config);

  return createRootCompiledRecipe(
    options,
    validate,
    base,
    variantTable,
    compoundConditions,
    compoundClassNames
  );
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

  const rawSlots = config.slots as Record<string, unknown>;
  const slotNames: string[] = [];

  for (const slot in rawSlots) {
    if (!hasOwnKey(rawSlots, slot)) continue;
    slotNames.push(slot);
  }

  if (!validate) {
    let allStrings = true;

    for (let index = 0; index < slotNames.length; index += 1) {
      if (typeof rawSlots[slotNames[index]] !== 'string') {
        allStrings = false;
        break;
      }
    }

    if (allStrings) {
      return {
        base: { ...(rawSlots as Record<string, string>) },
        slotNames,
      };
    }
  }

  const base: SlotClasses = {};
  for (let index = 0; index < slotNames.length; index += 1) {
    const slot = slotNames[index];
    const className = rawSlots[slot];
    if (validate) validateClassNameValue(`slots.${slot}`, className);
    base[slot] = flattenClassName(className as ClassNameValue | undefined);
  }

  return { base, slotNames };
}

function compileSlotRecipeConfig(
  config: SlotRecipeConfig<any, any, any>,
  options: RuntimeSystemOptions
): SlotCompiledRecipe {
  const validate = options.validate;
  const { base, slotNames } = compileSlotBase(config, validate);
  const compileClassName = (context: string, value: unknown) =>
    compileSlotClassMap(context, value, base, validate);
  const variantTable = compileVariants(
    config.variants,
    config.defaultVariants,
    validate,
    compileClassName
  );
  const { compoundClassNames, compoundConditions } = validate
    ? compileCompoundVariants(
        config.compoundVariants,
        variantTable,
        true,
        compileClassName
      )
    : compileCompoundVariantsProd(
        config.compoundVariants,
        variantTable,
        value => compileSlotClassMap('', value, base, false)
      );

  if (validate) deepFreeze(config);

  return createSlotCompiledRecipe(
    options,
    validate,
    slotNames,
    base,
    variantTable,
    compoundConditions,
    compoundClassNames
  );
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

  validateKnownRecipeProps(compiled, source, context, allowUnknownProps);

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

function validateKnownRecipeProps(
  compiled: CompiledRecipe,
  source: Record<string, unknown>,
  context: string,
  allowUnknownProps: boolean
) {
  if (!compiled.validate || allowUnknownProps) return;

  const variantIndex = ensureVariantIndex(compiled);
  for (const key in source) {
    if (!hasOwnKey(source, key)) continue;
    if (key === 'className' && compiled.mode === 'root') continue;
    if (getVariantIndex(variantIndex, key) === undefined) {
      throw new Error(
        `react-class-variants: unknown ${context} prop "${key}". Use resolve() for arbitrary component props.`
      );
    }
  }
}

function appendMatchingCompounds(
  compoundConditions: readonly CompiledCompoundCondition[],
  compoundClassNames: readonly (string | SlotClasses)[],
  selection: readonly CompiledSelectionValue[],
  output: string,
  slot?: string
) {
  let offset = 0;

  for (
    let compoundIndex = 0;
    compoundIndex < compoundClassNames.length;
    compoundIndex += 1
  ) {
    let matched = true;

    while (offset < compoundConditions.length) {
      const variantIndex = compoundConditions[offset] as number;
      offset += 1;
      if (variantIndex === compoundBoundary) break;

      const expected = compoundConditions[offset] as CompiledExpected;
      offset += 1;

      if (matched) {
        const value = selection[variantIndex];

        if (Array.isArray(expected)) {
          let hasExpectedValue = false;

          for (const candidate of expected) {
            if (candidate === value) {
              hasExpectedValue = true;
              break;
            }
          }

          if (!hasExpectedValue) matched = false;
        } else if (expected !== value) {
          matched = false;
        }
      }
    }

    if (matched) {
      const className = compoundClassNames[compoundIndex];
      output = appendClassName(
        output,
        slot ? (className as SlotClasses)[slot] : (className as string)
      );
    }
  }

  return output;
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

  output = appendMatchingCompounds(
    compiled.compoundConditions,
    compiled.compoundClassNames,
    selection,
    output,
    slot
  );

  output = appendClassName(
    output,
    flattenUserClassName('slot input.className', className, compiled.validate)
  );
  return compiled.merge ? compiled.merge(output) : output;
}

function createSlotRenderers(
  compiled: SlotCompiledRecipe,
  parentSelection: readonly CompiledSelectionValue[]
) {
  const slots: Record<string, (input?: Record<string, unknown>) => string> = {};

  for (const slot of compiled.slotNames) {
    slots[slot] = (input?: Record<string, unknown>) => {
      let selection = parentSelection;

      if (input) {
        let variantIndex: Readonly<VariantIndex> | undefined;
        let nextSelection: CompiledSelectionValue[] | undefined;
        for (const key in input) {
          if (!hasOwnKey(input, key)) continue;
          if (key === 'className') continue;

          variantIndex ??= ensureVariantIndex(compiled);
          const variantIndexValue = getVariantIndex(variantIndex, key);
          if (variantIndexValue === undefined) {
            if (compiled.validate) {
              throw new Error(
                `react-class-variants: unknown slot override prop "${key}".`
              );
            }
            continue;
          }

          const variant = compiled.variantTable[variantIndexValue];

          const value = input[key];
          if (value === undefined) continue;

          if (compiled.validate) {
            validateVariantValue(variant, value, 'slot override');
          }

          nextSelection ??= parentSelection.slice();
          nextSelection[variantIndexValue] = normalizeSelectionValue(
            variant.isBoolean,
            value
          );
        }

        selection = nextSelection ?? parentSelection;
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
): { className: string; selection: CompiledSelectionValue[] };
function resolveRoot(
  compiled: RootCompiledRecipe,
  input: Record<string, unknown> | undefined,
  allowUnknownProps: boolean,
  includeSelection: true
): { className: string; selection: CompiledSelectionValue[] };
function resolveRoot(
  compiled: RootCompiledRecipe,
  input: Record<string, unknown> | undefined,
  allowUnknownProps: boolean,
  includeSelection: false
): { className: string; selection?: CompiledSelectionValue[] };
function resolveRoot(
  compiled: RootCompiledRecipe,
  input: Record<string, unknown> | undefined,
  allowUnknownProps: boolean,
  includeSelection = true
) {
  const source = input ?? {};
  const needsSelection =
    includeSelection || compiled.compoundClassNames.length > 0;
  const selection = needsSelection
    ? new Array<CompiledSelectionValue>(compiled.variantTable.length)
    : undefined;
  let output = compiled.base;

  validateKnownRecipeProps(compiled, source, 'recipe', allowUnknownProps);

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
          `react-class-variants: missing required recipe variant "${variant.key}".`
        );
      }
      continue;
    }

    if (compiled.validate) {
      validateVariantValue(variant, value, 'recipe');
    }

    const selectionValue = normalizeSelectionValue(variant.isBoolean, value);
    if (selection) selection[index] = selectionValue;
    output = appendClassName(
      output,
      variant.isBoolean
        ? selectionValue === true
          ? variant.trueClass
          : variant.falseClass
        : variant.options[selectionValue as string]
    );
  }

  if (selection && compiled.compoundClassNames.length > 0) {
    output = appendMatchingCompounds(
      compiled.compoundConditions,
      compiled.compoundClassNames,
      selection,
      output
    );
  }
  output = appendClassName(
    output,
    flattenUserClassName(
      'input.className',
      input?.className as ClassNameValue | undefined,
      compiled.validate
    )
  );

  return {
    className: compiled.merge ? compiled.merge(output) : output,
    selection,
  };
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
    if (key in resolvedProps && compiled.validate) {
      throw new Error(
        `react-class-variants: forwardProps key "${key}" would overwrite an existing resolved prop.`
      );
    }
    resolvedProps[key] = selection[index];
  }

  return resolvedProps;
}

export function resolveRootComponentProps(
  compiled: RootCompiledRecipe,
  input: Record<string, unknown> | undefined,
  options: NormalizedResolveOptions | undefined
) {
  const { className, selection } = resolveRoot(compiled, input, true);
  const resolvedProps = createResolvedProps(
    compiled,
    input,
    options,
    selection
  );
  resolvedProps.className = className;

  return resolvedProps as Record<string, unknown> & {
    className: string;
  };
}

function attachCompiled<TRecipe extends AnyRecipe>(
  recipe: TRecipe,
  compiled: CompiledRecipe
) {
  (recipe as RecipeWithCompiled)[compiledRecipeSymbol] = compiled;
  return recipe;
}

function createRootRecipe(compiled: RootCompiledRecipe): AnyRecipe {
  const rootRecipe = ((input?: Record<string, unknown>) =>
    resolveRoot(compiled, input, false, false).className) as RootRecipe<
    any,
    any,
    any
  >;

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

  return attachCompiled(rootRecipe as AnyRecipe, compiled);
}

function createSlotRecipe(compiled: SlotCompiledRecipe): AnyRecipe {
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

  return attachCompiled(slotRecipe as AnyRecipe, compiled);
}

export function createRecipeFactory(
  options: SystemOptions = {}
): RecipeFactory {
  const runtimeOptions: RuntimeSystemOptions = {
    merge: options.merge,
    validate: isValidateEnabled(options.validate),
  };

  return ((config: RecipeConfig) => {
    if (hasOwnKey(config, 'slots')) {
      const slotConfig = config as SlotRecipeConfig<any, any, any>;
      const compiled = compileSlotRecipeConfig(slotConfig, runtimeOptions);
      return createSlotRecipe(compiled);
    }

    const rootConfig = config as RootRecipeConfig<any, any>;
    const compiled = compileRootRecipeConfig(rootConfig, runtimeOptions);
    return createRootRecipe(compiled);
  }) as RecipeFactory;
}

export function getCompiledRecipe(recipe: AnyRecipe): CompiledRecipe {
  return (recipe as RecipeWithCompiled)[compiledRecipeSymbol];
}

export function isRootRecipe(recipe: AnyRecipe): boolean {
  return getCompiledRecipe(recipe).mode === 'root';
}
