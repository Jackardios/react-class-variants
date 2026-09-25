import type { RecipeConfig } from '../core-types';
import {
  hasOwnKey,
  isAllowedVariantValue,
  normalizeSelectionValue,
  type CompiledSelectionValue,
  type CompiledVariant,
} from './shared';

type CompiledExpected =
  CompiledSelectionValue | readonly CompiledSelectionValue[];

// Flat layout: compound `i` owns the selector pairs
// `selectorPairs[offsets[i] * 2 .. offsets[i + 1] * 2)`, stored as
// `variantIndex, expected` so matching walks one array without allocations.
export type CompiledCompounds<TClassName> = {
  classNames: readonly TClassName[];
  offsets: readonly number[];
  selectorPairs: readonly (number | CompiledExpected)[];
};

const emptyCompounds: CompiledCompounds<never> = {
  classNames: [],
  offsets: [0],
  selectorPairs: [],
};

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

function assertAllowedCompoundValue(
  variant: CompiledVariant<unknown>,
  value: unknown
) {
  if (!isAllowedVariantValue(variant, value)) {
    throw new Error(
      `react-class-variants: invalid compoundVariants value "${String(
        value
      )}" for variant "${variant.key}".`
    );
  }
}

export function compileCompounds<TClassName>(params: {
  compileClassName: (context: string, value: unknown) => TClassName;
  compounds: RecipeConfig['compoundVariants'];
  validate: boolean;
  variantTable: readonly CompiledVariant<TClassName>[];
}): CompiledCompounds<TClassName> {
  const { compileClassName, compounds, validate, variantTable } = params;
  if (!compounds || compounds.length === 0) {
    return emptyCompounds;
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
        const expected = new Array<CompiledSelectionValue>(candidates.length);

        for (let offset = 0; offset < candidates.length; offset += 1) {
          if (validate) assertAllowedCompoundValue(variant, candidates[offset]);
          expected[offset] = normalizeSelectionValue(
            variant.isBoolean,
            candidates[offset]
          );
        }

        selectorPairs.push(index, expected);
        continue;
      }

      if (validate) assertAllowedCompoundValue(variant, value);
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

function matchesCompound(
  selection: readonly CompiledSelectionValue[],
  compounds: CompiledCompounds<unknown>,
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
  compounds: CompiledCompounds<TClassName>,
  selection: readonly CompiledSelectionValue[],
  callback: (className: TClassName) => void
) {
  for (let index = 0; index < compounds.classNames.length; index += 1) {
    if (matchesCompound(selection, compounds, index)) {
      callback(compounds.classNames[index]);
    }
  }
}
