import {
  isValidElement,
  type Ref,
  type RefCallback,
  type RefObject,
} from 'react';

export function getRefProperty(element: unknown): Ref<unknown> | null {
  if (!isValidElement<{ ref?: Ref<unknown> }>(element)) return null;
  return element.props.ref ?? null;
}

export type RefCleanup = () => void;

export function setRef<T>(
  ref: RefCallback<T> | RefObject<T | null> | null | undefined,
  value: T | null
): RefCleanup | undefined {
  if (typeof ref === 'function') {
    const cleanup = ref(value);
    return typeof cleanup === 'function' ? cleanup : undefined;
  }

  if (ref) {
    ref.current = value;
  }

  return undefined;
}

// Calls every ref with the value. React 19 cleanup: run inner cleanups where
// provided and fall back to the legacy null call for refs that returned none.
export function composeRefs<T>(refs: readonly Ref<T>[]): RefCallback<T> {
  return (value: T | null) => {
    let cleanups: Array<RefCleanup | undefined> | undefined;

    for (let index = 0; index < refs.length; index += 1) {
      const cleanup = setRef(refs[index], value);
      if (cleanup) {
        cleanups ??= [];
        cleanups[index] = cleanup;
      }
    }

    if (!cleanups) return;

    const collected = cleanups;
    return () => {
      for (let index = 0; index < refs.length; index += 1) {
        const cleanup = collected[index];
        if (cleanup) cleanup();
        else setRef(refs[index], null);
      }
    };
  };
}

// Memoized per (refA, refB) pair so repeated renders reuse one callback
// identity; otherwise React detaches and re-attaches both refs every render.
// The composed callback is stateless, so sharing it across consumers is safe,
// and WeakMap keys keep dropped refs collectable.
const mergedRefCache = new WeakMap<
  object,
  WeakMap<object, RefCallback<unknown>>
>();

export function mergeTwoRefs<T>(
  refA: Ref<T> | undefined | null,
  refB: Ref<T> | undefined | null
): Ref<T> | RefCallback<T> | undefined {
  if (!refA) return refB || undefined;
  if (!refB) return refA || undefined;

  let cacheForA = mergedRefCache.get(refA);
  if (!cacheForA) {
    cacheForA = new WeakMap();
    mergedRefCache.set(refA, cacheForA);
  }

  let merged = cacheForA.get(refB);
  if (!merged) {
    merged = composeRefs([refA, refB]) as RefCallback<unknown>;
    cacheForA.set(refB, merged);
  }

  return merged as RefCallback<T>;
}

const MAX_DISPLAY_NAME_DEPTH = 5;

// Mirrors how React DevTools names components: an explicit displayName wins,
// then the function name; forwardRef and memo wrappers are unwrapped through
// their `render` / `type` fields.
export function getComponentDisplayName(base: unknown, depth = 0): string {
  if (typeof base === 'string') return base;
  if (depth > MAX_DISPLAY_NAME_DEPTH || !base) return 'Component';

  if (typeof base === 'function' || typeof base === 'object') {
    const component = base as {
      displayName?: unknown;
      name?: unknown;
      render?: unknown;
      type?: unknown;
    };

    if (typeof component.displayName === 'string' && component.displayName) {
      return component.displayName;
    }

    if (typeof base === 'function') {
      return typeof component.name === 'string' && component.name
        ? component.name
        : 'Component';
    }

    if (component.render) {
      return getComponentDisplayName(component.render, depth + 1);
    }

    if (component.type) {
      return getComponentDisplayName(component.type, depth + 1);
    }
  }

  return 'Component';
}
