import {
  type CSSProperties,
  isValidElement,
  useMemo,
  type ReactElement,
  type Ref,
  type RefCallback,
  type RefObject,
} from 'react';

/**
 * Checks whether `prop` is an own property of `obj` or not.
 * Uses Object.hasOwn when available, falls back to Object.prototype.hasOwnProperty.
 *
 * @param object - The object to check
 * @param prop - The property name to check for
 * @returns True if the property is an own property of the object
 *
 * @example
 * hasOwnProperty({ foo: 1 }, 'foo'); // true
 * hasOwnProperty({ foo: 1 }, 'bar'); // false
 */
export function hasOwnProperty<T extends object>(
  object: T,
  prop: PropertyKey
): prop is keyof T {
  if (typeof Object.hasOwn === 'function') {
    return Object.hasOwn(object, prop);
  }

  return Object.prototype.hasOwnProperty.call(object, prop);
}

/**
 * Checks if an element is a valid React element with a ref property.
 *
 * @param element - The value to check
 * @returns True if the element is a valid React element with a ref
 *
 * @example
 * isValidElementWithRef(<div ref={ref} />); // true
 * isValidElementWithRef(<div />); // depends on React version
 * isValidElementWithRef(null); // false
 */
export function isValidElementWithRef<P extends { ref?: Ref<unknown> }>(
  element: unknown
): element is ReactElement<P> & { ref?: Ref<unknown> } {
  if (!element) return false;
  if (!isValidElement<{ ref?: Ref<unknown> }>(element)) return false;
  if ('ref' in element.props) return true;
  if ('ref' in element) return true;
  return false;
}

/**
 * Extracts the ref property from a React element.
 * Returns null if the element is not a valid React element or has no ref.
 *
 * @param element - The React element to extract ref from
 * @returns The ref property or null
 *
 * @example
 * const ref = createRef();
 * getRefProperty(<div ref={ref} />); // ref
 * getRefProperty(<div />); // null
 */
export function getRefProperty(element: unknown): Ref<unknown> | null {
  if (!isValidElementWithRef(element)) return null;
  const props = { ...element.props };
  return props.ref ?? element.ref ?? null;
}

/**
 * Sets a React ref value, handling both function refs and object refs.
 *
 * @param ref - The ref to set (function ref, object ref, or null/undefined)
 * @param value - The value to set the ref to
 *
 * @example
 * const objRef = createRef<HTMLDivElement>();
 * setRef(objRef, element); // objRef.current = element
 *
 * const fnRef = (el) => console.log(el);
 * setRef(fnRef, element); // calls fnRef(element)
 */
export function setRef<T>(
  ref: RefCallback<T> | RefObject<T> | null | undefined,
  value: T
) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

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
  if (!overrides || Object.keys(overrides).length === 0) {
    return base as MergedProps<TBase, TOverrides>;
  }

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

  const validRefs = refs.filter((ref): ref is Ref<T> => Boolean(ref));
  if (validRefs.length === 0) return;

  return (value: T | null) => {
    for (const ref of validRefs) {
      setRef(ref, value);
    }
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
