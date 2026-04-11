/**
 * Checks whether `prop` is an own property of `obj` or not.
 * Uses Object.hasOwn when available, falls back to Object.prototype.hasOwnProperty.
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
