import type { AnyRecipe, RecipeConfig, SystemOptions } from '../core-types';
import type { CompiledCompounds } from './compounds';

const compiledRecipeSymbol = Symbol('react-class-variants.compiled');

const sharedReservedPublicProps = new Set([
  'children',
  'className',
  'ref',
  'render',
]);
const slotReservedPublicProps = new Set(['slotClassNames']);

type RecipeWithCompiled = AnyRecipe & {
  [compiledRecipeSymbol]: CompiledRecipe;
};

export type CompiledSelectionValue = string | boolean | undefined;
export type VariantIndex = Record<string, number>;
export type SlotClassTable = readonly (string | undefined)[];

export type CompiledVariant<TClassName> = {
  key: string;
  defaultValue: CompiledSelectionValue;
  isBoolean: boolean;
  options: Record<string, TClassName>;
  trueClass?: TClassName;
  falseClass?: TClassName;
};

// Per-call selection logic, picked by the recipe factory: the lean runtime
// (recipe-default.ts) or the validating one (recipe.ts). Keeping the validating
// implementations behind this object lets bundles that only use the default
// recipe() drop them entirely.
export type RecipeRuntime = {
  // Builds the recipe-level variant selection.
  select(
    compiled: CompiledRecipe,
    input: Record<string, unknown> | undefined,
    allowUnknownProps: boolean
  ): CompiledSelectionValue[];
  // Checks per-slot override props before they are applied; only the
  // validating runtime defines it.
  validateOverride?(
    compiled: SlotCompiledRecipe,
    input: Record<string, unknown>
  ): void;
};

type CompiledRecipeBase<TClassName> = {
  compounds: CompiledCompounds<TClassName>;
  merge?: (className: string) => string;
  runtime: RecipeRuntime;
  validate: boolean;
  variantIndex?: VariantIndex;
  variantTable: readonly CompiledVariant<TClassName>[];
};

export type RootCompiledRecipe = CompiledRecipeBase<string> & {
  base: string;
  mode: 'root';
  resultCache?: Map<string, string>;
  resultCacheMaxSize: number;
};

export type SlotCompiledRecipe = CompiledRecipeBase<SlotClassTable> & {
  base: SlotClassTable;
  mode: 'slot';
  slotIndex: Readonly<Record<string, number>>;
  slotNames: readonly string[];
};

export type CompiledRecipe = RootCompiledRecipe | SlotCompiledRecipe;

export type RuntimeSystemOptions = Omit<SystemOptions, 'validate'> & {
  runtime: RecipeRuntime;
  validate: boolean;
};

// Null-prototype so lean-mode lookups with prototype-named input values
// ("constructor", "toString", ...) resolve to undefined instead of inherited
// Object.prototype members, without a per-lookup hasOwnProperty guard.
export function createNullProtoRecord<TValue>(): Record<string, TValue> {
  return { __proto__: null } as unknown as Record<string, TValue>;
}

const emptyVariantOptions: Record<string, never> = Object.freeze(
  createNullProtoRecord<never>()
);

export function hasOwnKey(object: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (!value || typeof value !== 'object') return value;
  const object = value as object;
  if (Object.isFrozen(object) || seen.has(object)) return value;
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

export function normalizeSelectionValue(
  isBoolean: boolean,
  value: unknown
): CompiledSelectionValue {
  if (value === undefined) return undefined;
  return isBoolean ? (value as boolean) : optionKeyForValue(value);
}

function createVariantIndex(
  variantTable: readonly { key: string }[]
): VariantIndex {
  const variantIndex = createNullProtoRecord<number>();

  for (let index = 0; index < variantTable.length; index += 1) {
    variantIndex[variantTable[index].key] = index;
  }

  return variantIndex;
}

export function ensureVariantIndex(
  compiled: CompiledRecipe
): Readonly<VariantIndex> {
  if (!compiled.variantIndex) {
    compiled.variantIndex = createVariantIndex(compiled.variantTable);
  }
  return compiled.variantIndex;
}

export function isReservedPublicProp(
  mode: CompiledRecipe['mode'],
  key: string
) {
  return (
    sharedReservedPublicProps.has(key) ||
    (mode === 'slot' && slotReservedPublicProps.has(key))
  );
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

export function compileVariants<TClassName>(params: {
  compileClassName: (context: string, value: unknown) => TClassName;
  defaultVariants: RecipeConfig['defaultVariants'];
  mode: CompiledRecipe['mode'];
  validate: boolean;
  variants: RecipeConfig['variants'];
}): readonly CompiledVariant<TClassName>[] {
  const { compileClassName, defaultVariants, mode, validate, variants } =
    params;
  const compiledVariants: Array<CompiledVariant<TClassName>> = [];
  const defaults = defaultVariants as Record<string, unknown> | undefined;
  const variantMap: NonNullable<typeof variants> = variants ?? {};

  for (const variantKey in variantMap) {
    if (!hasOwnKey(variantMap, variantKey)) continue;

    if (isReservedPublicProp(mode, variantKey)) {
      throw new Error(
        `react-class-variants: variant key "${variantKey}" is reserved.`
      );
    }

    if (validate && variantKey in Object.prototype) {
      throw new Error(
        `react-class-variants: variant key "${variantKey}" shadows an Object.prototype member.`
      );
    }

    const optionMap = variantMap[variantKey] ?? {};
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
      options ??= createNullProtoRecord<TClassName>();
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
      if (!hasOwnKey(variantMap, key)) {
        throw new Error(
          `react-class-variants: defaultVariants key "${key}" is not declared in variants.`
        );
      }
    }
  }

  return compiledVariants;
}

export function buildSelectionLean(
  compiled: CompiledRecipe,
  input: Record<string, unknown> | undefined
): CompiledSelectionValue[] {
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

    if (value === undefined) {
      if (variant.isBoolean) selection[index] = false;
      continue;
    }

    selection[index] = normalizeSelectionValue(variant.isBoolean, value);
  }

  return selection;
}

// Direct calls reject props that are not variants (the root className and the
// slotted slotClassNames excepted); component and resolve() callers pass
// allowUnknownProps because their input is a full prop bag.
export function buildValidatedSelection(
  compiled: CompiledRecipe,
  input: Record<string, unknown> | undefined,
  allowUnknownProps: boolean
): CompiledSelectionValue[] {
  const source = input ?? {};

  if (!allowUnknownProps) {
    if (compiled.mode === 'slot' && 'className' in source) {
      throw new Error(
        'react-class-variants: className cannot be passed directly to a slotted recipe call. Use slot functions instead.'
      );
    }

    const variantIndex = ensureVariantIndex(compiled);
    const publicProp =
      compiled.mode === 'root' ? 'className' : 'slotClassNames';

    for (const key in source) {
      if (!hasOwnKey(source, key) || key === publicProp) continue;
      if (variantIndex[key] === undefined) {
        throw new Error(
          `react-class-variants: unknown recipe prop "${key}". Use resolve() for arbitrary component props.`
        );
      }
    }
  }

  const selection = new Array<CompiledSelectionValue>(
    compiled.variantTable.length
  );

  for (let index = 0; index < compiled.variantTable.length; index += 1) {
    const variant: CompiledVariant<unknown> = compiled.variantTable[index];
    let value = source[variant.key];

    if (value === undefined) {
      value = variant.defaultValue;
    }

    if (value === undefined && variant.isBoolean) {
      value = false;
    }

    if (value === undefined) {
      throw new Error(
        `react-class-variants: missing required recipe variant "${variant.key}".`
      );
    }

    if (!isAllowedVariantValue(variant, value)) {
      throw new Error(
        `react-class-variants: invalid recipe value "${String(
          value
        )}" for variant "${variant.key}".`
      );
    }

    selection[index] = normalizeSelectionValue(variant.isBoolean, value);
  }

  return selection;
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

export function getCompiledRecipeOrThrow(
  recipe: AnyRecipe,
  api: string
): CompiledRecipe {
  const compiled = recipe ? getCompiledRecipe(recipe) : undefined;

  if (!compiled) {
    throw new Error(
      `react-class-variants: ${api} received a value without compiled recipe metadata. ` +
        'Pass a recipe created by recipe() or defineConfig().recipe(). ' +
        'If it is a recipe, duplicate copies of react-class-variants may be installed.'
    );
  }

  return compiled;
}
