import type { ResolveOptions } from '../core-types';
import {
  createNullProtoRecord,
  ensureVariantIndex,
  hasOwnKey,
  isReservedPublicProp,
  type CompiledRecipe,
  type CompiledSelectionValue,
  type VariantIndex,
} from './shared';

const normalizedResolveOptionsSymbol = Symbol(
  'react-class-variants.normalized-resolve-options'
);

type ForwardPropEntry = readonly [key: string, index: number];

export type NormalizedResolveOptions = {
  readonly [normalizedResolveOptionsSymbol]: true;
  // Public alias keys: read by their alias entry, never copied verbatim.
  readonly aliasKeys?: SkipKeys;
  readonly forwardPropEntries?: readonly ForwardPropEntry[];
  readonly propAliasEntries?: readonly (readonly [string, string])[];
};

// Input keys the copy loop leaves out of resolvedProps: the public alias keys
// (see NormalizedResolveOptions.aliasKeys) plus, for `styled()`, the keys it
// reads from the raw props itself. A null-prototype record built once per
// recipe options or styled() call, so the loop pays one property read per key.
export type SkipKeys = Readonly<Record<string, true>>;

export function createSkipKeys(
  keys: readonly string[],
  extra?: SkipKeys
): SkipKeys {
  const skip = createNullProtoRecord<true>();
  for (const key of keys) skip[key] = true;
  for (const key in extra) skip[key] = true;
  return skip;
}

export function createResolvedProps(
  compiled: CompiledRecipe,
  input: Record<string, unknown> | undefined,
  options: NormalizedResolveOptions | undefined,
  selection: readonly CompiledSelectionValue[],
  skip: SkipKeys | undefined = options?.aliasKeys
) {
  const resolvedProps: Record<string, unknown> = {};

  if (input) {
    const variantIndex = ensureVariantIndex(compiled);

    for (const key in input) {
      if (!hasOwnKey(input, key)) continue;
      // Assigning an own '__proto__' input key (e.g. from JSON.parse) would
      // swap the prototype of resolvedProps instead of copying data; drop it.
      if (key === '__proto__') continue;
      if (compiled.mode === 'slot' && key === 'slotClassNames') continue;
      if (variantIndex[key] !== undefined) continue;
      if (skip !== undefined && skip[key] === true) continue;
      resolvedProps[key] = input[key];
    }

    // Aliases read the raw input, so every alias applies independently of the
    // others (a chain such as `{ b: 'c', a: 'b' }` maps c→b and b→a).
    const propAliasEntries = options?.propAliasEntries;
    if (propAliasEntries !== undefined) {
      for (const [nativeKey, aliasKey] of propAliasEntries) {
        if (!hasOwnKey(input, aliasKey)) continue;

        if (compiled.validate && hasOwnKey(resolvedProps, nativeKey)) {
          throw new Error(
            `react-class-variants: propAliases target "${nativeKey}" would overwrite an existing resolved prop.`
          );
        }

        resolvedProps[nativeKey] = input[aliasKey];
      }
    }
  }

  // forwardProps keys are declared variants, which the copy loop never
  // copies, and aliases targeting them are rejected or dropped (see
  // getPropAliasProblem), so nothing can be overwritten here.
  const forwardPropEntries = options?.forwardPropEntries;
  if (forwardPropEntries !== undefined) {
    for (const [key, index] of forwardPropEntries) {
      resolvedProps[key] = selection[index];
    }
  }

  return resolvedProps;
}

function isNormalizedResolveOptions(
  options: ResolveOptions | NormalizedResolveOptions | undefined
): options is NormalizedResolveOptions {
  return Boolean(options && normalizedResolveOptionsSymbol in options);
}

function getPropAliasProblem(
  mode: CompiledRecipe['mode'],
  variantIndex: Readonly<VariantIndex>,
  aliasKeys: SkipKeys | undefined,
  forwardProps: readonly string[] | undefined,
  nativeKey: string,
  aliasKey: string
) {
  // Writing resolvedProps['__proto__'] would swap its prototype instead of
  // copying data, and the copy loop drops a '__proto__' input key, so an
  // alias on either side could never apply as data (see createResolvedProps).
  if (nativeKey === '__proto__') {
    return 'prop alias target "__proto__" is not allowed.';
  }
  if (aliasKey === '__proto__') {
    return 'prop alias "__proto__" is not allowed.';
  }
  if (isReservedPublicProp(mode, nativeKey)) {
    return `prop alias target "${nativeKey}" conflicts with a reserved public prop.`;
  }
  if (isReservedPublicProp(mode, aliasKey)) {
    return `prop alias "${aliasKey}" conflicts with a reserved public prop.`;
  }
  if (variantIndex[aliasKey] !== undefined) {
    return `prop alias "${aliasKey}" conflicts with a declared variant key.`;
  }
  if (aliasKeys !== undefined && aliasKeys[aliasKey] === true) {
    return `prop alias "${aliasKey}" cannot be reused.`;
  }
  if (forwardProps?.includes(nativeKey)) {
    return `forwardProps key "${nativeKey}" conflicts with propAliases target "${nativeKey}".`;
  }
  return undefined;
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
  let aliasKeys: Record<string, true> | undefined;
  let variantIndex: Readonly<VariantIndex> | undefined;

  if (rawPropAliases) {
    for (const nativeKey in rawPropAliases) {
      if (!hasOwnKey(rawPropAliases, nativeKey)) continue;

      const aliasKey = rawPropAliases[nativeKey];
      if (!aliasKey) continue;

      variantIndex ??= ensureVariantIndex(compiled);
      const problem = getPropAliasProblem(
        compiled.mode,
        variantIndex,
        aliasKeys,
        forwardProps,
        nativeKey,
        aliasKey
      );
      if (problem) {
        // Strict mode rejects the alias; lean mode drops it, since it could
        // never apply cleanly.
        if (compiled.validate) {
          throw new Error(`react-class-variants: ${problem}`);
        }
        continue;
      }

      aliasKeys ??= createNullProtoRecord<true>();
      aliasKeys[aliasKey] = true;
      propAliasEntries ??= [];
      propAliasEntries.push([nativeKey, aliasKey]);
    }
  }

  if (forwardProps) {
    variantIndex ??= ensureVariantIndex(compiled);

    for (const key of forwardProps) {
      const index = variantIndex[key];

      if (compiled.validate && index === undefined) {
        throw new Error(
          `react-class-variants: forwardProps key "${key}" is not declared in variants.`
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
    aliasKeys,
    forwardPropEntries,
    propAliasEntries,
  };
}
