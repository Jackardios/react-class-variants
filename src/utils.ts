import { type CSSProperties, useMemo, type Ref, type RefCallback } from 'react';
import { setRef, type RefCleanup } from './internal/react-utils';
import { hasOwnProperty } from './internal/core-utils';
export { hasOwnProperty } from './internal/core-utils';

/**
 * Merges two sets of props with special handling for className, style, and event handlers.
 *
 * - className: Concatenated with space separator
 * - style: Shallow merged (override wins for same property)
 * - event handlers (on*): Both handlers are called (override first, then base)
 * - other props: Override replaces base
 *
 * @param base - Base props object
 * @param overrides - Props to merge on top of base
 * @returns Merged props object
 */
type MergeableProps = {
  className?: string | null | undefined;
  style?: CSSProperties | undefined;
};

type Simplify<T> = {
  [K in keyof T]: T[K];
} & {};

type MergedProps<TBase extends object, TOverrides extends object> = Simplify<
  Omit<TBase, keyof TOverrides> & TOverrides
>;

export function mergeProps<TBase extends object, TOverrides extends object>(
  base: TBase & MergeableProps,
  overrides: TOverrides & MergeableProps
): MergedProps<TBase, TOverrides> {
  const props = { ...base } as Record<string, unknown> & MergeableProps;
  const baseProps = base as Record<string, unknown> & MergeableProps;
  const overrideProps = overrides as Record<string, unknown> & MergeableProps;

  for (const key in overrideProps) {
    if (!hasOwnProperty(overrideProps, key)) continue;

    if (key === 'className') {
      const baseClass = baseProps.className;
      const overrideClass = overrideProps.className;

      if (baseClass && overrideClass) {
        props.className = `${baseClass} ${overrideClass}`;
      } else if (overrideClass) {
        props.className = overrideClass;
      }

      continue;
    }

    if (key === 'style') {
      props.style = baseProps.style
        ? { ...baseProps.style, ...overrideProps.style }
        : overrideProps.style;
      continue;
    }

    const overrideValue = overrideProps[key];

    const isEventHandlerKey =
      key.length > 2 &&
      key[0] === 'o' &&
      key[1] === 'n' &&
      key[2] >= 'A' &&
      key[2] <= 'Z';

    if (isEventHandlerKey) {
      if (overrideValue == null) {
        continue;
      }

      const baseValue = baseProps[key];
      if (
        typeof overrideValue === 'function' &&
        typeof baseValue === 'function'
      ) {
        props[key] = (...args: unknown[]) => {
          const result = overrideValue(...args);
          baseValue(...args);
          return result;
        };
        continue;
      }
    }

    props[key] = overrideValue;
  }

  return props as MergedProps<TBase, TOverrides>;
}

function mergeRefsImpl<T>(
  refs: Array<Ref<T> | undefined | null>
): Ref<T> | RefCallback<T> | undefined {
  if (refs.length === 0) return;
  if (refs.length === 1) return refs[0] || undefined;

  let validRefCount = 0;
  let singleRef: Ref<T> | undefined;

  for (const ref of refs) {
    if (!ref) continue;
    validRefCount += 1;
    singleRef = ref;
  }

  if (validRefCount === 0) return;
  if (validRefCount === 1) return singleRef;

  return (value: T | null) => {
    let cleanups: Array<RefCleanup | undefined> | undefined;

    for (let index = 0; index < refs.length; index += 1) {
      const ref = refs[index];
      if (!ref) continue;

      const cleanup = setRef(ref, value);
      if (cleanup) {
        cleanups ??= [];
        cleanups[index] = cleanup;
      }
    }

    if (!cleanups) return;

    // React 19 cleanup: run inner cleanups where provided and fall back to the
    // legacy null call for refs that returned none.
    const collected = cleanups;
    return () => {
      for (let index = 0; index < refs.length; index += 1) {
        const ref = refs[index];
        if (!ref) continue;

        const cleanup = collected[index];
        if (cleanup) cleanup();
        else setRef(ref, null);
      }
    };
  };
}

/**
 * Creates a merged ref callback from multiple refs.
 * Use this in event handlers or conditional branches where hooks cannot be used.
 *
 * @param refs - Array of refs to merge
 * @returns A callback ref that sets all provided refs, or undefined if no valid refs
 *
 * @example
 * const merged = mergeRefs(ref1, ref2);
 * // Use in cloneElement or other non-hook contexts
 */
export function mergeRefs(): undefined;
export function mergeRefs<T>(
  ref: Ref<T> | undefined | null
): Ref<T> | undefined;
export function mergeRefs<T>(
  refA: Ref<T> | undefined | null,
  refB: Ref<T> | undefined | null,
  ...refs: Array<Ref<T> | undefined | null>
): RefCallback<T> | undefined;
export function mergeRefs<T = unknown>(
  ...refs: Array<Ref<T> | undefined | null>
): Ref<T> | RefCallback<T> | undefined {
  return mergeRefsImpl(refs);
}

/**
 * Merges React Refs into a single memoized function ref so you can pass it to
 * an element. This is a hook version that memoizes the merged ref.
 *
 * @example
 * const Component = forwardRef((props, ref) => {
 *   const internalRef = useRef();
 *   return <div {...props} ref={useMergeRefs(internalRef, ref)} />;
 * });
 */
export function useMergeRefs(): undefined;
export function useMergeRefs<T>(
  ref: Ref<T> | undefined | null
): Ref<T> | undefined;
export function useMergeRefs<T>(
  refA: Ref<T> | undefined | null,
  refB: Ref<T> | undefined | null,
  ...refs: Array<Ref<T> | undefined | null>
): RefCallback<T> | undefined;
export function useMergeRefs<T = unknown>(
  ...refs: Array<Ref<T> | undefined | null>
): Ref<T> | RefCallback<T> | undefined {
  return useMemo(() => mergeRefsImpl(refs), refs);
}
