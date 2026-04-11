import type { ClassNameValue } from './core-types';

export function validateClassNameValue(context: string, value: unknown) {
  if (value === null || typeof value === 'string') return;

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item !== 'string') {
        throw new Error(
          `react-class-variants: invalid ${context}; className arrays may only contain strings.`
        );
      }
    }
    return;
  }

  throw new Error(
    `react-class-variants: invalid ${context}; className values must be strings, null, or arrays of strings.`
  );
}

export function flattenClassName(value: ClassNameValue | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value;

  let output = '';
  for (const item of value) {
    if (!item) continue;
    output = output ? `${output} ${item}` : item;
  }
  return output;
}

export function flattenUserClassName(
  context: string,
  value: ClassNameValue | undefined,
  validate: boolean
): string {
  if (value === undefined) return '';
  if (validate) validateClassNameValue(context, value);
  return flattenClassName(value);
}

export function appendClassName(
  current: string,
  addition: string | undefined
): string {
  if (!addition) return current;
  return current ? `${current} ${addition}` : addition;
}
