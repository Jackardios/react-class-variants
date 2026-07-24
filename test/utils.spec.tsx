import { render, screen } from '@testing-library/react';
import { createRef, useRef, type RefCallback } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { mergeProps, mergeRefs, useMergeRefs } from '../src';

describe('React utilities', () => {
  it('merges className, style, and React event handlers predictably', () => {
    const baseClick = vi.fn<(event: string) => void>();
    const overrideClick = vi.fn<(event: string) => string>(
      () => 'override-result'
    );
    const baseMouseDown = vi.fn<(event: string) => void>();

    const props = mergeProps(
      {
        className: 'base',
        onClick: baseClick,
        onMouseDown: baseMouseDown,
        onboarding: 'base-value',
        style: {
          color: 'red',
          marginTop: 4,
        },
      },
      {
        className: 'override',
        onClick: overrideClick,
        onboarding: 'override-value',
        style: {
          color: 'blue',
        },
      }
    );

    expect(props.className).toBe('base override');
    expect(props.style).toEqual({
      color: 'blue',
      marginTop: 4,
    });
    expect(props.onboarding).toBe('override-value');
    expect(props.onClick('event')).toBe('override-result');
    expect(overrideClick).toHaveBeenCalledWith('event');
    expect(baseClick).toHaveBeenCalledWith('event');
    expect(baseClick.mock.invocationCallOrder[0]).toBeGreaterThan(
      overrideClick.mock.invocationCallOrder[0]
    );
    expect(baseMouseDown).not.toHaveBeenCalled();
  });

  it('preserves base props when overrides are intentionally empty', () => {
    const baseClick = vi.fn();
    const props = mergeProps(
      {
        className: 'base',
        onClick: baseClick,
      },
      {
        className: null,
        onClick: undefined,
      }
    );

    expect(props.className).toBe('base');
    expect(props.onClick).toBe(baseClick);
  });

  it('fans out merged refs without wrapping a single ref unnecessarily', () => {
    const firstRef = createRef<HTMLDivElement>();
    const secondRef = createRef<HTMLDivElement>();
    const callbackRef = vi.fn<RefCallback<HTMLDivElement>>();
    const singleRef = mergeRefs(firstRef);
    const mergedRef = mergeRefs(firstRef, secondRef, callbackRef);
    const node = document.createElement('div');

    expect(singleRef).toBe(firstRef);

    mergedRef?.(node);
    expect(firstRef.current).toBe(node);
    expect(secondRef.current).toBe(node);
    expect(callbackRef).toHaveBeenCalledWith(node);

    mergedRef?.(null);
    expect(firstRef.current).toBeNull();
    expect(secondRef.current).toBeNull();
    expect(callbackRef).toHaveBeenCalledWith(null);
  });

  it('memoizes merged refs for React components', () => {
    const outerRef = createRef<HTMLDivElement>();
    const callbackRef = vi.fn<RefCallback<HTMLDivElement>>();

    function Probe() {
      const previousRef = useRef<RefCallback<HTMLDivElement> | undefined>(
        undefined
      );
      const mergedRef = useMergeRefs(outerRef, callbackRef);

      if (previousRef.current) {
        expect(mergedRef).toBe(previousRef.current);
      }
      previousRef.current = mergedRef;

      return <div data-testid="target" ref={mergedRef} />;
    }

    const { rerender } = render(<Probe />);
    const target = screen.getByTestId('target');

    expect(outerRef.current).toBe(target);
    expect(callbackRef).toHaveBeenLastCalledWith(target);

    rerender(<Probe />);
    expect(outerRef.current).toBe(target);
  });

  it('propagates React 19 cleanups through mergeRefs', () => {
    const cleanup = vi.fn();
    const attach = vi.fn(() => cleanup);
    const objectRef = createRef<HTMLDivElement>();
    const merged = mergeRefs<HTMLDivElement>(attach, objectRef);
    const node = document.createElement('div');

    const detach = merged?.(node);
    expect(objectRef.current).toBe(node);
    expect(typeof detach).toBe('function');

    (detach as () => void)();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(attach).toHaveBeenCalledTimes(1);
    expect(attach).not.toHaveBeenCalledWith(null);
    expect(objectRef.current).toBeNull();
  });

  it('returns no cleanup when no inner ref provides one', () => {
    const firstRef = createRef<HTMLDivElement>();
    const callbackRef = vi.fn<RefCallback<HTMLDivElement>>();
    const merged = mergeRefs(firstRef, callbackRef);
    const node = document.createElement('div');

    expect(merged?.(node)).toBeUndefined();
  });

  it('runs cleanups through useMergeRefs on unmount', () => {
    const cleanup = vi.fn();
    const attach = vi.fn(() => cleanup);
    const objectRef = createRef<HTMLDivElement>();

    function Probe() {
      return (
        <div data-testid="probe-target" ref={useMergeRefs(attach, objectRef)} />
      );
    }

    const view = render(<Probe />);
    expect(objectRef.current).toBe(screen.getByTestId('probe-target'));

    view.unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(attach).toHaveBeenCalledTimes(1);
    expect(attach).not.toHaveBeenCalledWith(null);
    expect(objectRef.current).toBeNull();
  });
});
