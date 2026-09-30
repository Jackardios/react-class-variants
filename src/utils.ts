import { type CSSProperties, useMemo, type Ref, type RefCallback } from 'react';
import { composeRefs } from './internal/react-utils';
import { hasOwnProperty } from './internal/core-utils';
export { hasOwnProperty } from './internal/core-utils';

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
export function mergeProps<TBase extends object, TOverrides extends object>(
  base: TBase & MergeableProps,
  overrides: TOverrides & MergeableProps
): MergedProps<TBase, TOverrides> {
  const props = { ...base } as Record<string, unknown>;
  assignMergedProps(props, overrides as Record<string, unknown>);
  return props as MergedProps<TBase, TOverrides>;
}

// mergeProps() in place: merges `overrides` into `target`, whose current
// values act as the base. Keys listed in `skip` are left to the caller.
export function assignMergedProps(
  target: Record<string, unknown>,
  overrides: Record<string, unknown>,
  skip?: Readonly<Record<string, true>>
): void {
  for (const key in overrides) {
    if (!hasOwnProperty(overrides, key)) continue;
    if (skip !== undefined && skip[key] === true) continue;

    if (key === 'className') {
      const baseClass = target.className;
      const overrideClass = overrides.className;

      if (baseClass && overrideClass) {
        target.className = `${baseClass} ${overrideClass}`;
      } else if (overrideClass) {
        target.className = overrideClass;
      }

      continue;
    }

    if (key === 'style') {
      const baseStyle = target.style as CSSProperties | undefined;
      target.style = baseStyle
        ? { ...baseStyle, ...(overrides.style as CSSProperties | undefined) }
        : overrides.style;
      continue;
    }

    const overrideValue = overrides[key];

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

      const baseValue = target[key];
      if (
        typeof overrideValue === 'function' &&
        typeof baseValue === 'function'
      ) {
        target[key] = (...args: unknown[]) => {
          const result = overrideValue(...args);
          baseValue(...args);
          return result;
        };
        continue;
      }
    }

    target[key] = overrideValue;
  }
}

function mergeRefsImpl<T>(
  refs: Array<Ref<T> | undefined | null>
): Ref<T> | RefCallback<T> | undefined {
  const validRefs = refs.filter(Boolean) as Ref<T>[];
  if (validRefs.length === 0) return undefined;
  if (validRefs.length === 1) return validRefs[0];
  return composeRefs(validRefs);
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
 * function Component({ ref, ...props }: ComponentProps<'div'>) {
 *   const internalRef = useRef<HTMLDivElement>(null);
 *   return <div {...props} ref={useMergeRefs(internalRef, ref)} />;
 * }
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
