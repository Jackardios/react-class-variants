import type { ResolveOptions } from '../core-types';
import {
  ensureVariantIndex,
  getVariantIndex,
  hasOwnKey,
  isReservedPublicProp,
  type CompiledRecipe,
  type CompiledSelectionValue,
  type VariantIndex,
} from './shared';

const normalizedResolveOptionsSymbol = Symbol(
  'react-class-variants.normalized-resolve-options'
);

export type ForwardPropEntry = readonly [key: string, index: number];

export type NormalizedResolveOptions = {
  readonly [normalizedResolveOptionsSymbol]: true;
  readonly forwardPropEntries?: readonly ForwardPropEntry[];
  readonly propAliasEntries?: readonly (readonly [string, string])[];
};

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
