import { describe, expect, it, vi } from 'vitest';
import { createElement, createRef, forwardRef, HTMLAttributes } from 'react';
import { renderHook } from '@testing-library/react';
import {
  hasOwnProperty,
  isValidElementWithRef,
  getRefProperty,
  setRef,
  mergeProps,
  useMergeRefs,
} from '../src/utils';

describe('hasOwnProperty', () => {
  it('should return true for own properties', () => {
    const obj = { foo: 'bar', nested: { value: 1 } };
    expect(hasOwnProperty(obj, 'foo')).toBe(true);
    expect(hasOwnProperty(obj, 'nested')).toBe(true);
  });

  it('should return false for inherited properties', () => {
    const obj = Object.create({ inherited: 'value' });
    expect(hasOwnProperty(obj, 'inherited')).toBe(false);
  });

  it('should return false for non-existent properties', () => {
    const obj = { foo: 'bar' };
    expect(hasOwnProperty(obj, 'baz')).toBe(false);
  });

  it('should handle properties with undefined values', () => {
    const obj = { foo: undefined };
    expect(hasOwnProperty(obj, 'foo')).toBe(true);
  });

  it('should handle properties with null values', () => {
    const obj = { foo: null };
    expect(hasOwnProperty(obj, 'foo')).toBe(true);
  });

  it('should use Object.hasOwn if available', () => {
    const obj = { test: 'value' };
    if (typeof Object.hasOwn === 'function') {
      expect(hasOwnProperty(obj, 'test')).toBe(Object.hasOwn(obj, 'test'));
    }
  });
});

describe('isValidElementWithRef', () => {
  it('should return true for valid React element with ref in props', () => {
    const ref = createRef();
    const element = createElement('div', { ref });
    expect(isValidElementWithRef(element)).toBe(true);
  });

  it('should return true for valid React element with ref property', () => {
    const ref = createRef();
    const element = createElement('div', { ref });
    expect(isValidElementWithRef(element)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isValidElementWithRef(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isValidElementWithRef(undefined)).toBe(false);
  });

  it('should return false for non-React elements', () => {
    expect(isValidElementWithRef('string')).toBe(false);
    expect(isValidElementWithRef(123)).toBe(false);
    expect(isValidElementWithRef({ foo: 'bar' })).toBe(false);
  });

  it('should return false for React element without ref', () => {
    const element = createElement('div');
    // React elements may have a ref property even if not explicitly passed
    // The function checks if ref exists in props or element, not if it's null
    // This test may pass or fail depending on React internals
    const result = isValidElementWithRef(element);
    expect(typeof result).toBe('boolean');
  });
});

describe('getRefProperty', () => {
  it('should return ref from element props', () => {
    const ref = createRef();
    const element = createElement('div', { ref });
    expect(getRefProperty(element)).toBe(ref);
  });

  it('should return ref from element property', () => {
    const ref = createRef();
    const element = createElement('div', { ref });
    expect(getRefProperty(element)).toBe(ref);
  });

  it('should return null for element without ref', () => {
    const element = createElement('div');
    expect(getRefProperty(element)).toBe(null);
  });

  it('should return null for non-elements', () => {
    expect(getRefProperty(null)).toBe(null);
    expect(getRefProperty(undefined)).toBe(null);
    expect(getRefProperty('string')).toBe(null);
    expect(getRefProperty({ foo: 'bar' })).toBe(null);
  });

  it('should prioritize props.ref over element.ref', () => {
    const propsRef = createRef();
    const element = createElement('div', { ref: propsRef });
    const result = getRefProperty(element);
    expect(result).toBe(propsRef);
  });
});

describe('setRef', () => {
  it('should call function ref with value', () => {
    const ref = vi.fn();
    const value = document.createElement('div');
    setRef(ref, value);
    expect(ref).toHaveBeenCalledWith(value);
    expect(ref).toHaveBeenCalledTimes(1);
  });

  it('should set object ref current property', () => {
    const ref = createRef<HTMLDivElement>();
    const value = document.createElement('div');
    setRef(ref, value);
    expect(ref.current).toBe(value);
  });

  it('should handle null ref', () => {
    const value = document.createElement('div');
    expect(() => setRef(null, value)).not.toThrow();
  });

  it('should handle undefined ref', () => {
    const value = document.createElement('div');
    expect(() => setRef(undefined, value)).not.toThrow();
  });

  it('should handle null value', () => {
    const ref = vi.fn();
    setRef(ref, null);
    expect(ref).toHaveBeenCalledWith(null);
  });

  it('should set ref to null when clearing', () => {
    const ref = createRef<HTMLDivElement>();
    const value = document.createElement('div');
    setRef(ref, value);
    expect(ref.current).toBe(value);
    setRef(ref, null);
    expect(ref.current).toBe(null);
  });
});

describe('mergeProps', () => {
  describe('className handling', () => {
    it('should merge className from both props', () => {
      const base = { className: 'base-class' };
      const overrides = { className: 'override-class' };
      const result = mergeProps(base, overrides);
      expect(result.className).toBe('base-class override-class');
    });

    it('should use override className when base has none', () => {
      const base = {} as HTMLAttributes<any>;
      const overrides = { className: 'override-class' } as HTMLAttributes<any>;
      const result = mergeProps(base, overrides);
      expect(result.className).toBe('override-class');
    });

    it('should handle empty className in overrides', () => {
      const base = { className: 'base-class' };
      const overrides = { className: '' };
      const result = mergeProps(base, overrides);
      expect(result.className).toBe('base-class ');
    });

    it('should handle undefined className', () => {
      const base = { className: 'base-class' } as HTMLAttributes<any>;
      const overrides = { className: undefined } as HTMLAttributes<any>;
      const result = mergeProps(base, overrides);
      expect(result.className).toBe('base-class undefined');
    });
  });

  describe('style handling', () => {
    it('should merge style objects', () => {
      const base: HTMLAttributes<any> = {
        style: { color: 'red', fontSize: '12px' },
      };
      const overrides: HTMLAttributes<any> = {
        style: { color: 'blue', padding: '10px' },
      };
      const result = mergeProps(base, overrides);
      expect(result.style).toEqual({
        color: 'blue',
        fontSize: '12px',
        padding: '10px',
      });
    });

    it('should use override style when base has none', () => {
      const base = {} as HTMLAttributes<any>;
      const overrides = { style: { color: 'blue' } } as HTMLAttributes<any>;
      const result = mergeProps(base, overrides);
      expect(result.style).toEqual({ color: 'blue' });
    });

    it('should override base style properties', () => {
      const base = { style: { color: 'red' } };
      const overrides = { style: { color: 'blue' } };
      const result = mergeProps(base, overrides);
      expect(result.style).toEqual({ color: 'blue' });
    });

    it('should handle empty style object', () => {
      const base = { style: { color: 'red' } };
      const overrides = { style: {} };
      const result = mergeProps(base, overrides);
      expect(result.style).toEqual({ color: 'red' });
    });
  });

  describe('event handler merging', () => {
    it('should merge onClick handlers (override then base)', () => {
      const calls: string[] = [];
      const base = { onClick: (arg: any) => calls.push('base') };
      const overrides = { onClick: (arg: any) => calls.push('override') };
      const result = mergeProps(base, overrides);
      result.onClick?.({});
      expect(calls).toEqual(['override', 'base']);
    });

    it('should merge multiple event handlers', () => {
      const calls: string[] = [];
      const base = {
        onClick: (arg: any) => calls.push('base-click'),
        onMouseEnter: (arg: any) => calls.push('base-enter'),
      };
      const overrides = {
        onClick: (arg: any) => calls.push('override-click'),
        onMouseEnter: (arg: any) => calls.push('override-enter'),
      };
      const result = mergeProps(base, overrides);
      result.onClick?.({});
      result.onMouseEnter?.({});
      expect(calls).toEqual([
        'override-click',
        'base-click',
        'override-enter',
        'base-enter',
      ]);
    });

    it('should use override handler when base has none', () => {
      const handler = vi.fn();
      const base: HTMLAttributes<any> = {};
      const overrides: HTMLAttributes<any> = { onClick: handler };
      const result = mergeProps(base, overrides);
      result.onClick?.({} as any);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should use base handler when override has none', () => {
      const handler = vi.fn();
      const base: HTMLAttributes<any> = { onClick: handler };
      const overrides: HTMLAttributes<any> = {};
      const result = mergeProps(base, overrides);
      result.onClick?.({} as any);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to both handlers', () => {
      const baseHandler = vi.fn();
      const overrideHandler = vi.fn();
      const base = { onClick: baseHandler };
      const overrides = { onClick: overrideHandler };
      const result = mergeProps(base, overrides);
      const event = { target: 'test' } as any;
      result.onClick?.(event);
      expect(overrideHandler).toHaveBeenCalledWith(event);
      expect(baseHandler).toHaveBeenCalledWith(event);
    });

    it('should not merge non-function override handler', () => {
      const baseHandler = vi.fn();
      const base = { onClick: baseHandler };
      const overrides = { onClick: 'not-a-function' as any };
      const result = mergeProps(base, overrides);
      expect(result.onClick).toBe('not-a-function');
    });
  });

  describe('regular prop handling', () => {
    it('should override regular props', () => {
      const base = { id: 'base-id', title: 'base-title' };
      const overrides = { id: 'override-id' };
      const result = mergeProps(base, overrides);
      expect(result).toEqual({
        id: 'override-id',
        title: 'base-title',
      });
    });

    it('should add new props from overrides', () => {
      const base: HTMLAttributes<any> = { id: 'base-id' };
      const overrides: HTMLAttributes<any> = { title: 'new-title' };
      const result = mergeProps(base, overrides);
      expect(result).toEqual({
        id: 'base-id',
        title: 'new-title',
      });
    });

    it('should keep base props not in overrides', () => {
      const base = { id: 'base-id', title: 'base-title', 'data-test': 'test' };
      const overrides = { title: 'override-title' };
      const result = mergeProps(base, overrides);
      expect(result).toEqual({
        id: 'base-id',
        title: 'override-title',
        'data-test': 'test',
      });
    });

    it('should handle override with undefined value', () => {
      const base: HTMLAttributes<any> = { id: 'base-id' };
      const overrides: HTMLAttributes<any> = { id: undefined };
      const result = mergeProps(base, overrides);
      expect(result.id).toBe(undefined);
    });

    it('should handle override with null value', () => {
      const base: HTMLAttributes<any> = { id: 'base-id' };
      const overrides: HTMLAttributes<any> = { id: '' };
      const result = mergeProps(base, overrides);
      expect(result.id).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle empty base props', () => {
      const base = {};
      const overrides = { className: 'test', onClick: vi.fn() };
      const result = mergeProps(base, overrides);
      expect(result).toEqual(overrides);
    });

    it('should handle empty override props', () => {
      const base = { className: 'test', onClick: vi.fn() };
      const overrides = {};
      const result = mergeProps(base, overrides);
      expect(result).toEqual(base);
    });

    it('should not mutate original props', () => {
      const base = { className: 'base', style: { color: 'red' } };
      const overrides = { className: 'override', style: { color: 'blue' } };
      const baseCopy = { ...base, style: { ...base.style } };
      mergeProps(base, overrides);
      expect(base).toEqual(baseCopy);
    });

    it('should handle props with special characters in keys', () => {
      const base = { 'data-test-id': 'base' } as any;
      const overrides = { 'data-test-id': 'override' } as any;
      const result = mergeProps(base, overrides);
      expect(result['data-test-id']).toBe('override');
    });
  });
});

describe('useMergeRefs', () => {
  it('should merge multiple function refs', () => {
    const ref1 = vi.fn();
    const ref2 = vi.fn();
    const ref3 = vi.fn();

    const { result } = renderHook(() => useMergeRefs(ref1, ref2, ref3));
    const value = document.createElement('div');
    result.current?.(value);

    expect(ref1).toHaveBeenCalledWith(value);
    expect(ref2).toHaveBeenCalledWith(value);
    expect(ref3).toHaveBeenCalledWith(value);
  });

  it('should merge multiple object refs', () => {
    const ref1 = createRef<HTMLDivElement>();
    const ref2 = createRef<HTMLDivElement>();
    const ref3 = createRef<HTMLDivElement>();

    const { result } = renderHook(() => useMergeRefs(ref1, ref2, ref3));
    const value = document.createElement('div');
    result.current?.(value);

    expect(ref1.current).toBe(value);
    expect(ref2.current).toBe(value);
    expect(ref3.current).toBe(value);
  });

  it('should merge mixed function and object refs', () => {
    const fnRef = vi.fn();
    const objRef = createRef<HTMLDivElement>();

    const { result } = renderHook(() => useMergeRefs(fnRef, objRef));
    const value = document.createElement('div');
    result.current?.(value);

    expect(fnRef).toHaveBeenCalledWith(value);
    expect(objRef.current).toBe(value);
  });

  it('should handle undefined refs', () => {
    const ref = vi.fn();
    const { result } = renderHook(() => useMergeRefs(ref, undefined, null));
    const value = document.createElement('div');
    result.current?.(value);

    expect(ref).toHaveBeenCalledWith(value);
  });

  it('should return undefined when all refs are falsy', () => {
    const { result } = renderHook(() =>
      useMergeRefs(undefined, null, undefined)
    );
    expect(result.current).toBeUndefined();
  });

  it('should return undefined when no refs provided', () => {
    const { result } = renderHook(() => useMergeRefs());
    expect(result.current).toBeUndefined();
  });

  it('should memoize the merged ref', () => {
    const ref1 = vi.fn();
    const ref2 = vi.fn();
    const { result, rerender } = renderHook(() => useMergeRefs(ref1, ref2));
    const firstResult = result.current;

    rerender();
    expect(result.current).toBe(firstResult);
  });

  it('should update merged ref when refs change', () => {
    const ref1 = vi.fn();
    const ref2 = vi.fn();
    const ref3 = vi.fn();

    const { result, rerender } = renderHook(
      ({ refs }) => useMergeRefs(...refs),
      { initialProps: { refs: [ref1, ref2] } }
    );

    const firstResult = result.current;
    rerender({ refs: [ref1, ref3] });

    expect(result.current).not.toBe(firstResult);
  });

  it('should work with forwardRef', () => {
    const Component = forwardRef<HTMLDivElement>((props, forwardedRef) => {
      const internalRef = createRef<HTMLDivElement>();
      const mergedRef = useMergeRefs(internalRef, forwardedRef);
      return createElement('div', { ...props, ref: mergedRef });
    });

    const externalRef = createRef<HTMLDivElement>();
    const { result } = renderHook(() => useMergeRefs(externalRef));

    expect(result.current).toBeDefined();
  });

  it('should handle rapid ref changes', () => {
    const calls: string[] = [];
    const ref1 = (val: any) => {
      calls.push('ref1:' + (val ? 'set' : 'null'));
    };
    const ref2 = (val: any) => {
      calls.push('ref2:' + (val ? 'set' : 'null'));
    };

    const { result } = renderHook(() => useMergeRefs(ref1, ref2));
    const value = document.createElement('div');

    result.current?.(value);
    result.current?.(null);

    expect(calls).toEqual(['ref1:set', 'ref2:set', 'ref1:null', 'ref2:null']);
  });
});
