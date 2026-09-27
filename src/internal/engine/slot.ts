import type {
  AnyRecipe,
  AnySlotRecipe,
  AnySlotRecipeConfig,
  ClassNameValue,
  ResolveOptions,
  SlotRecipe,
  SlotResolveResult,
} from '../core-types';
import {
  appendClassName,
  flattenClassName,
  flattenUserClassName,
  validateClassNameValue,
} from '../class-name';
import { compileCompounds, forEachMatchingCompound } from './compounds';
import {
  createResolvedProps,
  normalizeResolveOptions,
  type NormalizedResolveOptions,
  type SkipKeys,
} from './props';
import {
  attachCompiled,
  compileVariants,
  createNullProtoRecord,
  ensureVariantIndex,
  hasOwnKey,
  isAllowedVariantValue,
  isPlainObject,
  materializeSelection,
  normalizeSelectionValue,
  readVariantClassName,
  type CompiledSelectionValue,
  type RuntimeSystemOptions,
  type SlotClassTable,
  type SlotCompiledRecipe,
} from './shared';

const emptySlotClassTable: SlotClassTable = [];

function normalizeSlotLeaf(
  value: ClassNameValue | undefined,
  validate: boolean,
  context: string
) {
  if (validate) {
    validateClassNameValue(context, value);
  }
  const className = flattenClassName(value);
  return className || undefined;
}

function compileSlotClassTable(
  value: unknown,
  slotNames: readonly string[],
  slotIndex: Readonly<Record<string, number>>,
  validate: boolean,
  context: string,
  invalidAsEmpty = false
): SlotClassTable {
  if (!isPlainObject(value)) {
    if (!validate && invalidAsEmpty) {
      return emptySlotClassTable;
    }

    throw new Error(
      validate
        ? `react-class-variants: ${context} must be an explicit slot className map.`
        : 'react-class-variants: slotted variant values must be explicit slot className maps.'
    );
  }

  const classNames = new Array<string | undefined>(slotNames.length);
  let hasClassName = false;

  for (const slot in value) {
    if (!hasOwnKey(value, slot)) continue;
    const index = slotIndex[slot];

    if (index === undefined) {
      if (validate) {
        throw new Error(
          `react-class-variants: invalid ${context}; slot "${slot}" is not declared in recipe.slots.`
        );
      }
      continue;
    }

    const className = normalizeSlotLeaf(
      value[slot] as ClassNameValue | undefined,
      validate,
      validate ? `${context}.${slot}` : ''
    );
    if (className) {
      hasClassName = true;
    }
    classNames[index] = className;
  }

  return hasClassName ? classNames : emptySlotClassTable;
}

function readSlotClassName(
  classTable: SlotClassTable | undefined,
  index: number
) {
  if (!classTable || classTable.length === 0) {
    return undefined;
  }
  return classTable[index];
}

function resolveTopLevelSlotClassNames(
  compiled: SlotCompiledRecipe,
  input: Record<string, unknown> | undefined
) {
  const value = input?.slotClassNames;
  if (value === undefined) {
    return emptySlotClassTable;
  }

  return compileSlotClassTable(
    value,
    compiled.slotNames,
    compiled.slotIndex,
    compiled.validate,
    'input.slotClassNames',
    !compiled.validate
  );
}

function compileSlotBase(config: AnySlotRecipeConfig, validate: boolean) {
  if (hasOwnKey(config, 'base')) {
    throw new Error(
      'react-class-variants: recipe config cannot define both "base" and "slots".'
    );
  }

  if (!isPlainObject(config.slots)) {
    throw new Error(
      'react-class-variants: slotted recipes require a slots object.'
    );
  }

  const slotNames: string[] = [];
  // Null-prototype so prototype-named slot keys cannot resolve to inherited
  // Object.prototype members (see createNullProtoRecord in engine/shared.ts).
  const slotIndex = createNullProtoRecord<number>();
  const base = [] as Array<string | undefined>;
  const rawSlots = config.slots as Record<string, unknown>;

  for (const slot in rawSlots) {
    if (!hasOwnKey(rawSlots, slot)) continue;
    slotIndex[slot] = slotNames.length;
    slotNames.push(slot);
  }

  for (let index = 0; index < slotNames.length; index += 1) {
    const slotName = slotNames[index];
    base[index] = normalizeSlotLeaf(
      rawSlots[slotName] as ClassNameValue | undefined,
      validate,
      validate ? `slots.${slotName}` : ''
    );
  }

  return {
    base: base.some(Boolean) ? base : emptySlotClassTable,
    slotIndex,
    slotNames,
  };
}

export function compileSlotRecipe(
  config: AnySlotRecipeConfig,
  options: RuntimeSystemOptions
): SlotCompiledRecipe {
  const { validate } = options;
  const compiledBase = compileSlotBase(config, validate);
  const variantTable = compileVariants({
    compileClassName: (context, value) =>
      compileSlotClassTable(
        value,
        compiledBase.slotNames,
        compiledBase.slotIndex,
        validate,
        context
      ),
    defaultVariants: config.defaultVariants,
    mode: 'slot',
    validate,
    variants: config.variants,
  });
  const compounds = compileCompounds({
    compileClassName: (context, value) =>
      compileSlotClassTable(
        value,
        compiledBase.slotNames,
        compiledBase.slotIndex,
        validate,
        context,
        !validate
      ),
    compounds: config.compoundVariants,
    validate,
    variantTable,
  });

  return {
    base: compiledBase.base,
    compounds,
    merge: options.merge,
    mode: 'slot',
    runtime: options.runtime,
    slotIndex: compiledBase.slotIndex,
    slotNames: compiledBase.slotNames,
    validate,
    variantTable,
  };
}

// Applies per-slot variant overrides on top of the recipe-level selection.
function overrideSelection(
  compiled: SlotCompiledRecipe,
  parentSelection: readonly CompiledSelectionValue[],
  input: Record<string, unknown>
) {
  const { validateOverride } = compiled.runtime;
  if (validateOverride) validateOverride(compiled, input);

  let nextSelection: CompiledSelectionValue[] | undefined;
  const variantIndex = ensureVariantIndex(compiled);

  for (const key in input) {
    if (!hasOwnKey(input, key) || key === 'className') continue;

    const index = variantIndex[key];
    if (index === undefined) continue;

    const value = input[key];
    if (value === undefined) continue;

    nextSelection ??= parentSelection.slice();
    nextSelection[index] = normalizeSelectionValue(
      compiled.variantTable[index].isBoolean,
      value
    );
  }

  return nextSelection ?? parentSelection;
}

export function validateSlotOverride(
  compiled: SlotCompiledRecipe,
  input: Record<string, unknown>
) {
  const variantIndex = ensureVariantIndex(compiled);

  for (const key in input) {
    if (!hasOwnKey(input, key) || key === 'className') continue;

    const index = variantIndex[key];
    if (index === undefined) {
      throw new Error(
        `react-class-variants: unknown slot override prop "${key}".`
      );
    }

    const value = input[key];
    const variant = compiled.variantTable[index];
    if (value !== undefined && !isAllowedVariantValue(variant, value)) {
      throw new Error(
        `react-class-variants: invalid slot override value "${String(
          value
        )}" for variant "${variant.key}".`
      );
    }
  }
}

export function resolveSlotClassName(
  compiled: SlotCompiledRecipe,
  slotIndex: number,
  selection: readonly CompiledSelectionValue[],
  slotClassNames: SlotClassTable,
  className?: ClassNameValue
) {
  let output = readSlotClassName(compiled.base, slotIndex) ?? '';

  for (let index = 0; index < compiled.variantTable.length; index += 1) {
    output = appendClassName(
      output,
      readSlotClassName(
        readVariantClassName(compiled.variantTable[index], selection[index]),
        slotIndex
      )
    );
  }

  forEachMatchingCompound(compiled.compounds, selection, compoundClassName => {
    output = appendClassName(
      output,
      readSlotClassName(compoundClassName, slotIndex)
    );
  });

  output = appendClassName(
    output,
    readSlotClassName(slotClassNames, slotIndex)
  );
  output = appendClassName(
    output,
    flattenUserClassName('slot input.className', className, compiled.validate)
  );

  return compiled.merge ? compiled.merge(output) : output;
}

// `styled()` view path: className and slotClassNames stay out of the host
// props (the skip record and the slot copy rule drop them).
export function resolveSlotViewState(
  compiled: SlotCompiledRecipe,
  input: Record<string, unknown>,
  options: NormalizedResolveOptions | undefined,
  skip: SkipKeys
) {
  const selection = compiled.runtime.select(compiled, input, true);

  return {
    props: createResolvedProps(compiled, input, options, selection, skip),
    selection,
    slotClassNames: resolveTopLevelSlotClassNames(compiled, input),
    variants: materializeSelection(compiled, selection),
  };
}

export function createSlotRenderers(
  compiled: SlotCompiledRecipe,
  selection: readonly CompiledSelectionValue[],
  slotClassNames: SlotClassTable
) {
  const slots =
    createNullProtoRecord<(input?: Record<string, unknown>) => string>();

  for (
    let slotIndex = 0;
    slotIndex < compiled.slotNames.length;
    slotIndex += 1
  ) {
    slots[compiled.slotNames[slotIndex]] = input =>
      input
        ? resolveSlotClassName(
            compiled,
            slotIndex,
            overrideSelection(compiled, selection, input),
            slotClassNames,
            input.className as ClassNameValue | undefined
          )
        : resolveSlotClassName(compiled, slotIndex, selection, slotClassNames);
  }

  return slots;
}

export function createSlotRecipe(compiled: SlotCompiledRecipe): AnyRecipe {
  const slotRecipe = ((input?: Record<string, unknown>) => {
    return createSlotRenderers(
      compiled,
      compiled.runtime.select(compiled, input, false),
      resolveTopLevelSlotClassNames(compiled, input)
    );
  }) as SlotRecipe & {
    resolve: SlotRecipe['resolve'];
  };

  slotRecipe.resolve = <
    TInput extends Record<string, unknown> | undefined = undefined,
    const TOptions extends ResolveOptions | undefined = undefined,
  >(
    input?: TInput,
    options?: TOptions
  ): SlotResolveResult<AnySlotRecipe, TInput, TOptions> => {
    const normalizedOptions = normalizeResolveOptions(compiled, options);
    const selection = compiled.runtime.select(compiled, input, true);

    return {
      resolvedProps: createResolvedProps(
        compiled,
        input,
        normalizedOptions,
        selection
      ) as SlotResolveResult<AnySlotRecipe, TInput, TOptions>['resolvedProps'],
      slots: createSlotRenderers(
        compiled,
        selection,
        resolveTopLevelSlotClassNames(compiled, input)
      ),
      variants: materializeSelection(compiled, selection) as SlotResolveResult<
        AnySlotRecipe,
        TInput,
        TOptions
      >['variants'],
    };
  };

  return attachCompiled(slotRecipe as AnyRecipe, compiled);
}
