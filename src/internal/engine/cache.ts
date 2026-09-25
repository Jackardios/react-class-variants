import type { SystemOptions } from '../core-types';
import type { CompiledSelectionValue, RootCompiledRecipe } from './shared';

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
// inputs and `merge` is pure. We therefore enable it only without validation
// (validating recipes check every call) and only when a `merge` is configured
// (without merge the result cache costs more than the work it would skip).
export function resolveResultCacheMaxSize(
  validate: boolean,
  merge: ((className: string) => string) | undefined,
  cache: SystemOptions['cache']
): number {
  if (validate || !merge || cache === false) return 0;
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
  compiled: RootCompiledRecipe,
  key: string,
  value: string
): string {
  let cache = compiled.resultCache;
  if (!cache) {
    cache = new Map();
    compiled.resultCache = cache;
  } else if (cache.size >= compiled.resultCacheMaxSize) {
    cache.delete(cache.keys().next().value as string);
  }
  cache.set(key, value);
  return value;
}
