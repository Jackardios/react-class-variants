import {
  isValidElement,
  useMemo,
  type HTMLAttributes,
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
export function hasOwnProperty<T extends Record<string, any>>(
  object: T,
  prop: keyof any
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
export function isValidElementWithRef<P extends { ref?: Ref<any> }>(
  element: unknown
): element is ReactElement<P> & { ref?: Ref<any> } {
  if (!element) return false;
  if (!isValidElement<{ ref?: Ref<any> }>(element)) return false;
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
export function getRefProperty(element: unknown) {
  if (!isValidElementWithRef(element)) return null;
  const props = { ...element.props };
  return props.ref || element.ref;
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
export function mergeProps<T extends HTMLAttributes<any>>(
  base: T,
  overrides: T
): T {
  if (!overrides || Object.keys(overrides).length === 0) {
    return base;
  }

  const props = { ...base };

  for (const key in overrides) {
    if (!hasOwnProperty(overrides, key)) continue;

    if (key === 'className') {
      const baseClass = base.className;
      const overrideClass = overrides.className;

      if (baseClass && overrideClass) {
        props.className = `${baseClass} ${overrideClass}`;
      } else if (overrideClass) {
        props.className = overrideClass;
      }

      continue;
    }

    if (key === 'style') {
      const prop = 'style';
      props[prop] = base[prop]
        ? { ...base[prop], ...overrides[prop] }
        : overrides[prop];
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

      const baseValue = base[key];
      if (
        typeof overrideValue === 'function' &&
        typeof baseValue === 'function'
      ) {
        type EventKey = Extract<keyof HTMLAttributes<any>, `on${string}`>;
        props[key as EventKey] = (...args) => {
          overrideValue(...args);
          baseValue(...args);
        };
        continue;
      }
    }

    props[key] = overrideValue;
  }

  return props;
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
export function mergeRefs<T = any>(
  ...refs: Array<Ref<T> | undefined | null>
): Ref<T> | undefined {
  const validRefs = refs.filter((ref): ref is Ref<T> => Boolean(ref));

  if (validRefs.length === 0) return;
  if (validRefs.length === 1) return validRefs[0];

  return (value: T | null) => {
    for (const ref of validRefs) {
      setRef(ref, value);
    }
  };
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
export function useMergeRefs<T = any>(
  ...refs: Array<Ref<T> | undefined | null>
): Ref<T> | undefined {
  return useMemo(() => mergeRefs(...refs), refs);
}
