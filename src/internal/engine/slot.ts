import type {
  AnyRecipe,
  AnySlotRecipeConfig,
  ClassNameValue,
  ResolveOptions,
  SlotRecipe,
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
  ensureVariantIndex,
  forEachMatchingCompound,
  forEachMatchingLeanCompound,
  freezeConfig,
  hasOwnKey,
  isAllowedVariantValue,
  isPlainObject,
  materializeSelection,
  normalizeResolveOptions,
  normalizeSelectionValue,
  readVariantClassName,
  type CompiledSelectionValue,
  type LeanSlotClassTable,
  type NormalizedResolveOptions,
  type RuntimeSystemOptions,
  type SlotClassTable,
  type SlotCompiledRecipe,
  type LeanSlotCompiledRecipe,
  type StrictSlotCompiledRecipe,
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
  const slotIndex: Record<string, number> = {};
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

export function compileStrictSlotRecipe(
  config: AnySlotRecipeConfig,
  options: RuntimeSystemOptions
): StrictSlotCompiledRecipe {
  const compiledBase = compileSlotBase(config, options.validate);
  const variantTable = compileVariants({
    compileClassName: (context, value) =>
      compileSlotClassTable(
        value,
        compiledBase.slotNames,
        compiledBase.slotIndex,
        options.validate,
        context
      ),
    defaultVariants: config.defaultVariants,
    validate: options.validate,
    variants: config.variants,
  });
  const compounds = compileCompounds({
    compileClassName: (context, value) =>
      compileSlotClassTable(
        value,
        compiledBase.slotNames,
        compiledBase.slotIndex,
        options.validate,
        context,
        !options.validate
      ),
    compounds: config.compoundVariants,
    validate: options.validate,
    variantTable,
  });

  freezeConfig(config, options.freeze);

  return {
    base: compiledBase.base,
    compounds,
    merge: options.merge,
    mode: 'slot',
    runtime: 'strict',
    slotNames: compiledBase.slotNames,
    validate: options.validate,
    variantTable,
  };
}

function compileLeanSlotPayload(
  value: unknown,
  slotNames: readonly string[],
  slotIndex: Readonly<Record<string, number>>,
  invalidAsEmpty = false
): LeanSlotClassTable {
  return compileSlotClassTable(
    value,
    slotNames,
    slotIndex,
    false,
    '',
    invalidAsEmpty
  );
}

export function compileLeanSlotRecipe(
  config: AnySlotRecipeConfig,
  options: RuntimeSystemOptions
): LeanSlotCompiledRecipe {
  const compiledBase = compileSlotBase(config, false);
  const variantTable = compileVariants({
    compileClassName: (_context, value) =>
      compileLeanSlotPayload(
        value,
        compiledBase.slotNames,
        compiledBase.slotIndex
      ),
    defaultVariants: config.defaultVariants,
    validate: false,
    variants: config.variants,
  });
  const compounds = compileLeanCompounds({
    compileClassName: (_context, value) =>
      compileLeanSlotPayload(
        value,
        compiledBase.slotNames,
        compiledBase.slotIndex,
        true
      ),
    compounds: config.compoundVariants,
    validate: false,
    variantTable,
  });

  return {
    base: compiledBase.base,
    compounds,
    merge: options.merge,
    mode: 'slot',
    runtime: 'lean',
    slotNames: compiledBase.slotNames,
    validate: false,
    variantTable,
  };
}

export function compileSlotRecipe(
  config: AnySlotRecipeConfig,
  options: RuntimeSystemOptions
): SlotCompiledRecipe {
  return options.mode === 'lean'
    ? compileLeanSlotRecipe(config, options)
    : compileStrictSlotRecipe(config, options);
}

function buildSlotSelectionLean(
  compiled: LeanSlotCompiledRecipe,
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

function resolveStrictSlotSelection(
  compiled: StrictSlotCompiledRecipe,
  parentSelection: readonly CompiledSelectionValue[],
  input: Record<string, unknown> | undefined
) {
  if (!input) {
    return parentSelection;
  }

  let nextSelection: CompiledSelectionValue[] | undefined;
  const variantIndex = ensureVariantIndex(compiled);

  for (const key in input) {
    if (!hasOwnKey(input, key) || key === 'className') continue;

    const index = variantIndex[key];
    if (index === undefined) {
      if (compiled.validate) {
        throw new Error(
          `react-class-variants: unknown slot override prop "${key}".`
        );
      }
      continue;
    }

    const value = input[key];
    if (value === undefined) continue;
    const variant = compiled.variantTable[index];

    if (compiled.validate && !isAllowedVariantValue(variant, value)) {
      throw new Error(
        `react-class-variants: invalid slot override value "${String(
          value
        )}" for variant "${variant.key}".`
      );
    }

    nextSelection ??= parentSelection.slice();
    nextSelection[index] = normalizeSelectionValue(variant.isBoolean, value);
  }

  return nextSelection ?? parentSelection;
}

function resolveLeanSlotSelection(
  compiled: LeanSlotCompiledRecipe,
  parentSelection: readonly CompiledSelectionValue[],
  input: Record<string, unknown> | undefined
) {
  if (!input) {
    return parentSelection;
  }

  let nextSelection: CompiledSelectionValue[] | undefined;
  const variantIndex = ensureVariantIndex(compiled);

  for (const key in input) {
    if (!hasOwnKey(input, key) || key === 'className') continue;

    const index = variantIndex[key];
    if (index === undefined) {
      continue;
    }

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

function resolveStrictSlotClassName(
  compiled: StrictSlotCompiledRecipe,
  slotIndex: number,
  selection: readonly CompiledSelectionValue[],
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
    flattenUserClassName('slot input.className', className, true)
  );

  return compiled.merge ? compiled.merge(output) : output;
}

function resolveLeanSlotClassName(
  compiled: LeanSlotCompiledRecipe,
  slotIndex: number,
  selection: readonly CompiledSelectionValue[],
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

  forEachMatchingLeanCompound(
    compiled.compounds,
    selection,
    compoundClassName => {
      output = appendClassName(
        output,
        readSlotClassName(compoundClassName, slotIndex)
      );
    }
  );

  output = appendClassName(
    output,
    flattenUserClassName('slot input.className', className, false)
  );

  return compiled.merge ? compiled.merge(output) : output;
}

export function resolveSlotClassNameForRender(
  compiled: SlotCompiledRecipe,
  slotIndex: number,
  parentSelection: readonly CompiledSelectionValue[],
  input?: Record<string, unknown>
) {
  if (compiled.runtime === 'lean') {
    const selection = resolveLeanSlotSelection(
      compiled,
      parentSelection,
      input
    );
    return resolveLeanSlotClassName(
      compiled,
      slotIndex,
      selection,
      input?.className as ClassNameValue | undefined
    );
  }

  const selection = resolveStrictSlotSelection(
    compiled,
    parentSelection,
    input
  );
  return resolveStrictSlotClassName(
    compiled,
    slotIndex,
    selection,
    input?.className as ClassNameValue | undefined
  );
}

export function resolveSlotViewState(
  compiled: SlotCompiledRecipe,
  input: Record<string, unknown> | undefined,
  options: NormalizedResolveOptions | undefined
) {
  const selection =
    compiled.runtime === 'lean'
      ? buildSlotSelectionLean(compiled, input)
      : buildSelection(compiled, input, 'recipe', true, false);

  return {
    resolvedProps: createResolvedProps(compiled, input, options, selection),
    selection,
    variants: materializeSelection(compiled, selection),
  };
}

function createStrictSlotRenderers(
  compiled: StrictSlotCompiledRecipe,
  selection: readonly CompiledSelectionValue[]
) {
  const slots = Object.create(null) as Record<
    string,
    (input?: Record<string, unknown>) => string
  >;
  ensureVariantIndex(compiled);

  for (
    let slotIndex = 0;
    slotIndex < compiled.slotNames.length;
    slotIndex += 1
  ) {
    const slotName = compiled.slotNames[slotIndex];
    slots[slotName] = input => {
      const slotSelection = resolveStrictSlotSelection(
        compiled,
        selection,
        input
      );
      return resolveStrictSlotClassName(
        compiled,
        slotIndex,
        slotSelection,
        input?.className as ClassNameValue | undefined
      );
    };
  }

  return slots;
}

function createLeanSlotRenderers(
  compiled: LeanSlotCompiledRecipe,
  selection: readonly CompiledSelectionValue[]
) {
  const slots = Object.create(null) as Record<
    string,
    (input?: Record<string, unknown>) => string
  >;
  ensureVariantIndex(compiled);

  for (
    let slotIndex = 0;
    slotIndex < compiled.slotNames.length;
    slotIndex += 1
  ) {
    const slotName = compiled.slotNames[slotIndex];
    slots[slotName] = input => {
      if (!input) {
        return resolveLeanSlotClassName(compiled, slotIndex, selection);
      }

      const slotSelection = resolveLeanSlotSelection(
        compiled,
        selection,
        input
      );
      return resolveLeanSlotClassName(
        compiled,
        slotIndex,
        slotSelection,
        input.className as ClassNameValue | undefined
      );
    };
  }

  return slots;
}

export function createStrictSlotRecipe(
  compiled: StrictSlotCompiledRecipe
): AnyRecipe {
  const slotRecipe = ((input?: Record<string, unknown>) => {
    if (input && 'className' in input) {
      throw new Error(
        'react-class-variants: className cannot be passed directly to a slotted recipe call. Use slot functions instead.'
      );
    }

    const selection = buildSelection(compiled, input, 'recipe', false, false);
    return createStrictSlotRenderers(compiled, selection);
  }) as SlotRecipe & {
    resolve: SlotRecipe['resolve'];
  };

  slotRecipe.resolve = (
    input?: Record<string, unknown>,
    options?: ResolveOptions
  ) => {
    const normalizedOptions = normalizeResolveOptions(compiled, options);
    const selection = buildSelection(compiled, input, 'recipe', true, false);

    return {
      resolvedProps: createResolvedProps(
        compiled,
        input,
        normalizedOptions,
        selection
      ),
      slots: createStrictSlotRenderers(compiled, selection),
      variants: materializeSelection(compiled, selection),
    } as ReturnType<SlotRecipe['resolve']>;
  };

  return attachCompiled(slotRecipe as AnyRecipe, compiled);
}

export function createLeanSlotRecipe(
  compiled: LeanSlotCompiledRecipe
): AnyRecipe {
  const slotRecipe = ((input?: Record<string, unknown>) => {
    const selection = buildSlotSelectionLean(compiled, input);
    return createLeanSlotRenderers(compiled, selection);
  }) as SlotRecipe & {
    resolve: SlotRecipe['resolve'];
  };

  slotRecipe.resolve = (
    input?: Record<string, unknown>,
    options?: ResolveOptions
  ) => {
    const normalizedOptions = normalizeResolveOptions(compiled, options);
    const selection = buildSlotSelectionLean(compiled, input);

    return {
      resolvedProps: createResolvedProps(
        compiled,
        input,
        normalizedOptions,
        selection
      ),
      slots: createLeanSlotRenderers(compiled, selection),
      variants: materializeSelection(compiled, selection),
    } as ReturnType<SlotRecipe['resolve']>;
  };

  return attachCompiled(slotRecipe as AnyRecipe, compiled);
}

export function createSlotRecipe(compiled: SlotCompiledRecipe): AnyRecipe {
  return compiled.runtime === 'lean'
    ? createLeanSlotRecipe(compiled)
    : createStrictSlotRecipe(compiled);
}
