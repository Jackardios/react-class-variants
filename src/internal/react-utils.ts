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

export function setRef<T>(
  ref: RefCallback<T> | RefObject<T | null> | null | undefined,
  value: T | null
) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

export function mergeTwoRefs<T>(
  refA: Ref<T> | undefined | null,
  refB: Ref<T> | undefined | null
): Ref<T> | RefCallback<T> | undefined {
  if (!refA) return refB || undefined;
  if (!refB) return refA || undefined;

  return (value: T | null) => {
    setRef(refA, value);
    setRef(refB, value);
  };
}
