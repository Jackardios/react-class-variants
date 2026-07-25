import type {
  AnyRecipe,
  RecipeConfig,
  ResolveOptions,
  SystemOptions,
} from '../core-types';

export const compiledRecipeSymbol = Symbol('react-class-variants.compiled');
const normalizedResolveOptionsSymbol = Symbol(
  'react-class-variants.normalized-resolve-options'
);

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

export type RuntimeMode = 'lean' | 'strict';
export type CompiledSelectionValue = string | boolean | undefined;
export type CompiledExpected =
  | CompiledSelectionValue
  | readonly CompiledSelectionValue[];
export type VariantIndex = Record<string, number>;
export type ForwardPropEntry = readonly [key: string, index: number];
export type SlotClassTable = readonly (string | undefined)[];
export type LeanSlotClassTable = SlotClassTable;

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

export type LeanCompiledCompounds<TClassName> = {
  classNames: readonly TClassName[];
  offsets: readonly number[];
  selectorPairs: readonly (number | CompiledExpected)[];
};

type SharedCompiledRecipe = {
  merge?: (className: string) => string;
  resultCache?: Map<string, string>;
  resultCacheMaxSize?: number;
  runtime: RuntimeMode;
  validate: boolean;
  variantIndex?: VariantIndex;
};

export type StrictRootCompiledRecipe = SharedCompiledRecipe & {
  base: string;
  compounds: readonly CompiledCompound<string>[];
  mode: 'root';
  runtime: 'strict';
  variantTable: readonly CompiledVariant<string>[];
};

export type LeanRootCompiledRecipe = SharedCompiledRecipe & {
  base: string;
  compounds: LeanCompiledCompounds<string>;
  mode: 'root';
  runtime: 'lean';
  variantTable: readonly CompiledVariant<string>[];
};

export type RootCompiledRecipe =
  | LeanRootCompiledRecipe
  | StrictRootCompiledRecipe;

export type StrictSlotCompiledRecipe = SharedCompiledRecipe & {
  base: SlotClassTable;
  compounds: readonly CompiledCompound<SlotClassTable>[];
  mode: 'slot';
  runtime: 'strict';
  slotIndex: Readonly<Record<string, number>>;
  slotNames: readonly string[];
  variantTable: readonly CompiledVariant<SlotClassTable>[];
};

export type LeanSlotCompiledRecipe = SharedCompiledRecipe & {
  base: LeanSlotClassTable;
  compounds: LeanCompiledCompounds<LeanSlotClassTable>;
  mode: 'slot';
  runtime: 'lean';
  slotIndex: Readonly<Record<string, number>>;
  slotNames: readonly string[];
  variantTable: readonly CompiledVariant<LeanSlotClassTable>[];
};

export type SlotCompiledRecipe =
  | LeanSlotCompiledRecipe
  | StrictSlotCompiledRecipe;

export type CompiledRecipe = RootCompiledRecipe | SlotCompiledRecipe;

export type NormalizedResolveOptions = {
  readonly [normalizedResolveOptionsSymbol]: true;
  readonly forwardPropEntries?: readonly ForwardPropEntry[];
  readonly propAliasEntries?: readonly (readonly [string, string])[];
};

export type RuntimeSystemOptions = Omit<SystemOptions, 'validate'> & {
  freeze: 'deep' | 'none' | 'shallow';
  mode: RuntimeMode;
  validate: boolean;
};

// Compiled lookup tables are built as ordinary fast-mode objects and sealed
// with a null prototype once fully populated. Object.setPrototypeOf(obj, null)
// keeps V8's fast properties (unlike `{ __proto__: null }` literals or
// Object.create(null), which end up in dictionary mode), so lookups and
// per-recipe memory match plain objects while inherited Object.prototype
// members stay unreachable — prototype-named input values ("constructor",
// "toString", ...) and polluted Object.prototype entries resolve to undefined
// without a per-lookup hasOwnProperty guard. Invariant: sealed tables are
// write-once — never add keys after the seal.
export function sealNullPrototype<T extends object>(record: T): T {
  return Object.setPrototypeOf(record, null) as T;
}

// Population writes go through this helper: before the seal the table still
// inherits Object.prototype, so a plain assignment of a "__proto__" config key
// (slot name, option key, lean variant key — e.g. from JSON.parse) would hit
// the inherited accessor and silently vanish (or transiently swap the
// prototype for object values) instead of creating an own property. Sealing
// early detaches the accessor, so the assignment creates an own key; only
// tables that actually contain a "__proto__" key take the dictionary-mode hit.
export function setOwnKey<TValue>(
  record: Record<string, TValue>,
  key: string,
  value: TValue
): void {
  if (key === '__proto__') Object.setPrototypeOf(record, null);
  record[key] = value;
}

// Seal before freeze: Object.setPrototypeOf throws on a frozen object.
const emptyVariantOptions: Record<string, never> = Object.freeze(
  sealNullPrototype<Record<string, never>>({})
);

const DEFAULT_RESULT_CACHE_MAX_SIZE = 500;
// Cache-key tokens are self-delimiting: undefined/true/false encode as one
// control character, strings free of the control characters `\x00`-`\x04` as
// `<value>\x00` (the hot path — one short scan, one concat), and everything
// else (strings containing those characters, coerced non-string garbage) as
// `\x04<length>:<value>`, which is length-delimited so its payload may contain
// anything. Decoding is deterministic at every token boundary and the token
// count per recipe is fixed (variantTable.length), so the raw className tail
// needs no terminator — keys collide only for identical inputs. Injectivity
// relies on that fixed count.
const CACHE_KEY_SEPARATOR = '\x00';
const CACHE_TOKEN_UNDEFINED = '\x01';
const CACHE_TOKEN_TRUE = '\x02';
const CACHE_TOKEN_FALSE = '\x03';
const CACHE_TOKEN_ESCAPED = '\x04';

function hasCacheUnsafeChar(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) <= 4) return true;
  }
  return false;
}

// The cache is sound only when the resolved className is a pure function of its
// inputs and `merge` is pure. We therefore enable it only in lean mode (strict
// mode validates per call) and only when a `merge` is configured (without merge
// the result cache costs more than the work it would skip).
export function resolveResultCacheMaxSize(
  merge: ((className: string) => string) | undefined,
  cache: SystemOptions['cache']
): number {
  if (!merge || cache === false) return 0;
  if (cache === undefined || cache === true) {
    return DEFAULT_RESULT_CACHE_MAX_SIZE;
  }
  const { maxSize } = cache;
  if (maxSize === undefined) return DEFAULT_RESULT_CACHE_MAX_SIZE;
  return Number.isFinite(maxSize) && maxSize >= 1 ? Math.floor(maxSize) : 0;
}

function appendSelectionKey(
  prefix: string,
  selection: readonly CompiledSelectionValue[]
): string {
  let key = prefix;
  for (let index = 0; index < selection.length; index += 1) {
    const value = selection[index];
    if (value === undefined) {
      key += CACHE_TOKEN_UNDEFINED;
    } else if (value === true) {
      key += CACHE_TOKEN_TRUE;
    } else if (value === false) {
      key += CACHE_TOKEN_FALSE;
    } else if (typeof value === 'string' && !hasCacheUnsafeChar(value)) {
      key += value + CACHE_KEY_SEPARATOR;
    } else if (typeof value === 'string') {
      key += `${CACHE_TOKEN_ESCAPED}${value.length}:${value}`;
    } else {
      // Lean variants pass malformed non-string inputs through the selection;
      // tag and coerce them so cache-enabled recipes neither crash nor collide
      // with genuine string tokens. Collisions between distinct garbage values
      // are harmless: property lookups coerce identically (named variants) or
      // every non-`true` value resolves to falseClass (boolean variants), so
      // colliding keys always map to identical output.
      let coerced: string;
      try {
        coerced = String(value);
      } catch {
        coerced = 'unstringable';
      }
      key += `${CACHE_TOKEN_ESCAPED}${coerced.length}:${coerced}`;
    }
  }
  return key;
}

export function buildRootResultCacheKey(
  selection: readonly CompiledSelectionValue[],
  className: string
): string {
  return appendSelectionKey('', selection) + className;
}

// FIFO eviction keeps the cache-hit path a pure Map.get (no per-hit reordering).
export function storeResult(
  compiled: CompiledRecipe,
  key: string,
  value: string
): string {
  let cache = compiled.resultCache;
  if (!cache) {
    cache = new Map();
    compiled.resultCache = cache;
  } else if (cache.size >= (compiled.resultCacheMaxSize as number)) {
    cache.delete(cache.keys().next().value as string);
  }
  cache.set(key, value);
  return value;
}

export function hasOwnKey(object: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
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
  variantTable: readonly { key: string; options: object }[]
): VariantIndex {
  const variantIndex: VariantIndex = {};

  for (let index = 0; index < variantTable.length; index += 1) {
    setOwnKey(variantIndex, variantTable[index].key, index);
    // Lazy options seal: recipe creation skips the per-table setPrototypeOf
    // cost (creation is the library's weakest competitive axis) and every
    // resolution path calls ensureVariantIndex before its first raw
    // `variant.options[value]` read. Re-sealing emptyVariantOptions (or a
    // table sealed early by setOwnKey) is a same-value prototype set, which
    // is allowed even on frozen objects.
    Object.setPrototypeOf(variantTable[index].options, null);
  }

  return sealNullPrototype(variantIndex);
}

export function getVariantIndex(
  variantIndex: Readonly<VariantIndex> | undefined,
  key: string
): number | undefined {
  // variantIndex is a null-prototype object, so a plain read cannot pick up
  // inherited Object.prototype members.
  return variantIndex ? variantIndex[key] : undefined;
}

function findVariantIndexByKey(
  variantTable: readonly { key: string }[],
  key: string
) {
  for (let index = 0; index < variantTable.length; index += 1) {
    if (variantTable[index].key === key) {
      return index;
    }
  }

  return undefined;
}

export function ensureVariantIndex(
  compiled: CompiledRecipe
): Readonly<VariantIndex> {
  if (!compiled.variantIndex) {
    compiled.variantIndex = createVariantIndex(compiled.variantTable);
  }
  return compiled.variantIndex;
}

function isReservedPublicProp(mode: CompiledRecipe['mode'], key: string) {
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
  mode: CompiledRecipe['mode'];
  validate: boolean;
  variants: RecipeConfig['variants'];
}): readonly CompiledVariant<TClassName>[] {
  const { compileClassName, defaultVariants, mode, validate, variants } =
    params;
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
      setOwnKey(options, optionKey, className);
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
      // Sealed lazily inside createVariantIndex on the first recipe call.
      // Until then every read is prototype-safe: hasOwnKey during
      // compile-time validation and Object.keys() in variantOptions().
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

  for (const compound of compounds) {
    const selectors: Array<readonly [number, CompiledExpected]> = [];
    let dropped = false;

    for (const key in compound) {
      if (!hasOwnKey(compound, key) || key === 'className') continue;

      const index = findVariantIndexByKey(variantTable, key);
      if (index === undefined) {
        if (validate) {
          throw new Error(
            `react-class-variants: compoundVariants key "${key}" is not declared in variants.`
          );
        }
        // An undeclared selector key can never match, so the whole compound
        // must never apply (matches cva/tailwind-variants semantics).
        dropped = true;
        break;
      }

      const value = (compound as Record<string, unknown>)[key];
      if (value === undefined) continue;

      const variant = variantTable[index];

      if (Array.isArray(value)) {
        const candidates = value.filter(candidate => candidate !== undefined);

        if (validate) {
          for (const candidate of candidates) {
            if (!isAllowedVariantValue(variant, candidate)) {
              throw new Error(
                `react-class-variants: invalid compoundVariants value "${String(
                  candidate
                )}" for variant "${key}".`
              );
            }
          }
        }

        selectors.push([index, compileCompoundSelection(variant, candidates)]);
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

    if (dropped) continue;

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

export function compileLeanCompounds<TClassName>(params: {
  compileClassName: (context: string, value: unknown) => TClassName;
  compounds: RecipeConfig['compoundVariants'];
  validate: boolean;
  variantTable: readonly CompiledVariant<TClassName>[];
}): LeanCompiledCompounds<TClassName> {
  const { compileClassName, compounds, validate, variantTable } = params;
  if (!compounds || compounds.length === 0) {
    return {
      classNames: [],
      offsets: [0],
      selectorPairs: [],
    };
  }

  const classNames: TClassName[] = [];
  const offsets = [0];
  const selectorPairs: Array<number | CompiledExpected> = [];

  for (const compound of compounds) {
    const pairsStart = selectorPairs.length;
    let dropped = false;

    for (const key in compound) {
      if (!hasOwnKey(compound, key) || key === 'className') continue;

      const index = findVariantIndexByKey(variantTable, key);
      if (index === undefined) {
        if (validate) {
          throw new Error(
            `react-class-variants: compoundVariants key "${key}" is not declared in variants.`
          );
        }
        // An undeclared selector key can never match, so the whole compound
        // must never apply (matches cva/tailwind-variants semantics).
        dropped = true;
        break;
      }

      const value = (compound as Record<string, unknown>)[key];
      if (value === undefined) continue;

      const variant = variantTable[index];

      if (Array.isArray(value)) {
        const candidates = value.filter(candidate => candidate !== undefined);

        if (validate) {
          for (const candidate of candidates) {
            if (!isAllowedVariantValue(variant, candidate)) {
              throw new Error(
                `react-class-variants: invalid compoundVariants value "${String(
                  candidate
                )}" for variant "${key}".`
              );
            }
          }
        }

        selectorPairs.push(
          index,
          compileCompoundSelection(variant, candidates)
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

      selectorPairs.push(
        index,
        normalizeSelectionValue(variant.isBoolean, value)
      );
    }

    if (dropped) {
      selectorPairs.length = pairsStart;
      continue;
    }

    classNames.push(
      compileClassName(
        'compoundVariants.className',
        (compound as { className?: unknown }).className
      )
    );
    offsets.push(selectorPairs.length / 2);
  }

  return {
    classNames,
    offsets,
    selectorPairs,
  };
}

function validateKnownRecipeProps(
  compiled: CompiledRecipe,
  source: Record<string, unknown>,
  context: string,
  allowUnknownProps: boolean,
  allowedPublicProps: readonly string[] | undefined
) {
  if (!compiled.validate || allowUnknownProps) return;

  const variantIndex = ensureVariantIndex(compiled);
  for (const key in source) {
    if (!hasOwnKey(source, key)) continue;
    if (allowedPublicProps?.includes(key)) continue;
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
  allowedPublicProps?: readonly string[]
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
    allowedPublicProps
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

function matchesLeanCompoundRange(
  selection: readonly CompiledSelectionValue[],
  compounds: LeanCompiledCompounds<unknown>,
  compoundIndex: number
) {
  const start = compounds.offsets[compoundIndex] * 2;
  const end = compounds.offsets[compoundIndex + 1] * 2;

  for (let index = start; index < end; index += 2) {
    const actual = selection[compounds.selectorPairs[index] as number];
    const expected = compounds.selectorPairs[index + 1] as CompiledExpected;

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

export function forEachMatchingLeanCompound<TClassName>(
  compounds: LeanCompiledCompounds<TClassName>,
  selection: readonly CompiledSelectionValue[],
  callback: (className: TClassName) => void
) {
  for (let index = 0; index < compounds.classNames.length; index += 1) {
    if (matchesLeanCompoundRange(selection, compounds, index)) {
      callback(compounds.classNames[index]);
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
    // Assigning an own '__proto__' input key (e.g. from JSON.parse) would swap
    // the prototype of resolvedProps instead of copying data; drop it.
    if (key === '__proto__') continue;
    if (compiled.mode === 'slot' && key === 'slotClassNames') continue;
    if (getVariantIndex(variantIndex, key) !== undefined) continue;
    resolvedProps[key] = source[key];
  }

  for (const [nativeKey, aliasKey] of options?.propAliasEntries ?? []) {
    if (!hasOwnKey(resolvedProps, aliasKey)) continue;

    if (compiled.validate && hasOwnKey(resolvedProps, nativeKey)) {
      throw new Error(
        `react-class-variants: propAliases target "${nativeKey}" would overwrite an existing resolved prop.`
      );
    }

    resolvedProps[nativeKey] = resolvedProps[aliasKey];
    delete resolvedProps[aliasKey];
  }

  for (const [key, index] of options?.forwardPropEntries ?? []) {
    if (compiled.validate && hasOwnKey(resolvedProps, key)) {
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
  const rawPropAliases = options.propAliases;

  let forwardPropEntries: ForwardPropEntry[] | undefined;
  let propAliasEntries: Array<readonly [string, string]> | undefined;
  let variantIndex: Readonly<VariantIndex> | undefined;
  const seenAliases: Record<string, true> = {};

  if (rawPropAliases) {
    for (const nativeKey in rawPropAliases) {
      if (!hasOwnKey(rawPropAliases, nativeKey)) continue;

      const aliasKey = rawPropAliases[nativeKey];
      if (!aliasKey) continue;

      // Writing resolvedProps['__proto__'] would swap its prototype instead of
      // copying data (see createResolvedProps), so this target is never legal.
      if (nativeKey === '__proto__') {
        if (compiled.validate) {
          throw new Error(
            'react-class-variants: prop alias target "__proto__" is not allowed.'
          );
        }
        continue;
      }

      if (compiled.validate) {
        if (isReservedPublicProp(compiled.mode, nativeKey)) {
          throw new Error(
            `react-class-variants: prop alias target "${nativeKey}" conflicts with a reserved public prop.`
          );
        }

        if (isReservedPublicProp(compiled.mode, aliasKey)) {
          throw new Error(
            `react-class-variants: prop alias "${aliasKey}" conflicts with a reserved public prop.`
          );
        }

        variantIndex ??= ensureVariantIndex(compiled);
        if (getVariantIndex(variantIndex, aliasKey) !== undefined) {
          throw new Error(
            `react-class-variants: prop alias "${aliasKey}" conflicts with a declared variant key.`
          );
        }

        if (hasOwnKey(seenAliases, aliasKey)) {
          throw new Error(
            `react-class-variants: prop alias "${aliasKey}" cannot be reused.`
          );
        }
      }

      seenAliases[aliasKey] = true;
      propAliasEntries ??= [];
      propAliasEntries.push([nativeKey, aliasKey]);
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
        propAliasEntries?.some(([nativeKey]) => nativeKey === key)
      ) {
        throw new Error(
          `react-class-variants: forwardProps key "${key}" conflicts with propAliases target "${key}".`
        );
      }

      if (index === undefined) continue;
      forwardPropEntries ??= [];
      forwardPropEntries.push([key, index]);
    }
  }

  if (!forwardPropEntries && !propAliasEntries) {
    return undefined;
  }

  return {
    [normalizedResolveOptionsSymbol]: true,
    forwardPropEntries,
    propAliasEntries,
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
