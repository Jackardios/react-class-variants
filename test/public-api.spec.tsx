import { renderHook } from '@testing-library/react';
import {
  createRef,
  type ComponentPropsWithoutRef,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { describe, expect, it, vi } from 'vitest';
import { hasOwnProperty, mergeProps, mergeRefs, useMergeRefs } from '../src';

describe('public root exports', () => {
  it('should export hasOwnProperty from the package root', () => {
    expect(hasOwnProperty({ foo: 'bar' }, 'foo')).toBe(true);
    expect(hasOwnProperty({ foo: 'bar' }, 'baz')).toBe(false);
  });

  it('should export mergeProps from the package root', () => {
    const baseClick = vi.fn();
    const overrideClick = vi.fn();
    const baseProps: ComponentPropsWithoutRef<'button'> = {
      className: 'base',
      onClick: baseClick,
      disabled: false,
    };
    const overrideProps: Partial<ComponentPropsWithoutRef<'button'>> = {
      className: 'override',
      onClick: overrideClick,
      disabled: true,
    };

    const merged = mergeProps(baseProps, overrideProps);

    expect(merged.className).toBe('base override');
    expect(merged.disabled).toBe(true);
    merged.onClick?.({} as ReactMouseEvent<HTMLButtonElement>);
    expect(overrideClick).toHaveBeenCalledTimes(1);
    expect(baseClick).toHaveBeenCalledTimes(1);
  });

  it('should export mergeRefs from the package root', () => {
    const objectRef = createRef<HTMLDivElement>();
    const callbackRef = vi.fn();
    const mergedRef = mergeRefs(objectRef, callbackRef);
    const element = document.createElement('div');

    expect(mergedRef).toBeTypeOf('function');
    mergedRef?.(element);

    expect(objectRef.current).toBe(element);
    expect(callbackRef).toHaveBeenCalledWith(element);
  });

  it('should export useMergeRefs from the package root', () => {
    const objectRef = createRef<HTMLDivElement>();
    const callbackRef = vi.fn();
    const element = document.createElement('div');
    const { result } = renderHook(() => useMergeRefs(objectRef, callbackRef));

    expect(result.current).toBeTypeOf('function');
    result.current?.(element);

    expect(objectRef.current).toBe(element);
    expect(callbackRef).toHaveBeenCalledWith(element);
  });
});
