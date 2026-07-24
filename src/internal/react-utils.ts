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

function composeTwoRefs<T>(refA: Ref<T>, refB: Ref<T>): RefCallback<T> {
  return (value: T | null) => {
    const cleanupA = setRef(refA, value);
    const cleanupB = setRef(refB, value);

    if (!cleanupA && !cleanupB) return;

    // React 19 cleanup: run inner cleanups where provided and fall back to the
    // legacy null call for refs that returned none.
    return () => {
      if (cleanupA) cleanupA();
      else setRef(refA, null);
      if (cleanupB) cleanupB();
      else setRef(refB, null);
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
    merged = composeTwoRefs(refA, refB) as RefCallback<unknown>;
    cacheForA.set(refB, merged);
  }

  return merged as RefCallback<T>;
}
