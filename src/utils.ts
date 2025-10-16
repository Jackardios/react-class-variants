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
 * Checks if an element is a valid React element with a ref.
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
 * Gets the ref property from a React element.
 */
export function getRefProperty(element: unknown) {
  if (!isValidElementWithRef(element)) return null;
  const props = { ...element.props };
  return props.ref || element.ref;
}

/**
 * Sets both a function and object React ref.
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
 * Merges two sets of props.
 */
export function mergeProps<T extends HTMLAttributes<any>>(
  base: T,
  overrides: T
) {
  const props = { ...base };

  for (const key in overrides) {
    if (!hasOwnProperty(overrides, key)) continue;

    if (key === 'className') {
      const prop = 'className';
      props[prop] = base[prop]
        ? `${base[prop]} ${overrides[prop]}`
        : overrides[prop];
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

    if (typeof overrideValue === 'function' && key.startsWith('on')) {
      const baseValue = base[key];
      if (typeof baseValue === 'function') {
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
 * Merges React Refs into a single memoized function ref so you can pass it to
 * an element.
 * @example
 * const Component = forwardRef((props, ref) => {
 *   const internalRef = useRef();
 *   return <div {...props} ref={useMergeRefs(internalRef, ref)} />;
 * });
 */
export function useMergeRefs(...refs: Array<Ref<any> | undefined>) {
  return useMemo(() => {
    if (!refs.some(Boolean)) return;
    return (value: unknown) => {
      for (const ref of refs) {
        setRef(ref, value);
      }
    };
  }, refs);
}
