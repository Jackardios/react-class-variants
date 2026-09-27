// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { defineConfig, recipe } from '../src';

describe('recipe().resolve()', () => {
  it('resolves component prop bags with forwardProps and propAliases', () => {
    const input = recipe({
      base: 'block',
      variants: {
        size: {
          sm: 'text-sm',
          md: 'text-base',
        },
        disabled: {
          true: 'opacity-50',
        },
      },
      defaultVariants: {
        size: 'md',
      },
    });

    expect(
      input.resolve(
        {
          size: 'sm',
          htmlSize: 20,
          disabled: true,
          type: 'email',
          className: 'rounded-md',
        },
        {
          forwardProps: ['disabled'],
          propAliases: { size: 'htmlSize' },
        }
      )
    ).toEqual({
      variants: {
        size: 'sm',
        disabled: true,
      },
      resolvedProps: {
        type: 'email',
        disabled: true,
        size: 20,
        className: 'block text-sm opacity-50 rounded-md',
      },
    });
  });

  it('forwards the effective variant selection after defaults are applied', () => {
    const input = recipe({
      base: 'block',
      variants: {
        tone: {
          subtle: 'text-slate-700',
          strong: 'text-slate-950',
        },
        disabled: {
          true: 'opacity-50',
        },
      },
      defaultVariants: {
        tone: 'subtle',
      },
    });

    expect(
      input.resolve(
        {
          id: 'field',
        },
        {
          forwardProps: ['tone', 'disabled'],
        }
      )
    ).toEqual({
      variants: {
        tone: 'subtle',
        disabled: false,
      },
      resolvedProps: {
        id: 'field',
        tone: 'subtle',
        disabled: false,
        className: 'block text-slate-700',
      },
    });
  });

  it('keeps reused resolve options objects stable across calls', () => {
    const input = recipe({
      base: 'block',
      variants: {
        size: {
          sm: 'text-sm',
          md: 'text-base',
        },
        disabled: {
          true: 'opacity-50',
        },
      },
      defaultVariants: {
        size: 'md',
      },
    });
    const options = {
      forwardProps: ['disabled'],
      propAliases: {
        size: 'htmlSize',
      },
    } as const;

    expect(
      input.resolve(
        {
          size: 'sm',
          htmlSize: 20,
          disabled: true,
          type: 'email',
          className: 'rounded-md',
        },
        options
      )
    ).toEqual({
      variants: {
        size: 'sm',
        disabled: true,
      },
      resolvedProps: {
        type: 'email',
        disabled: true,
        size: 20,
        className: 'block text-sm opacity-50 rounded-md',
      },
    });
    expect(
      input.resolve(
        {
          htmlSize: 12,
          type: 'text',
        },
        options
      )
    ).toEqual({
      variants: {
        size: 'md',
        disabled: false,
      },
      resolvedProps: {
        type: 'text',
        size: 12,
        disabled: false,
        className: 'block text-base',
      },
    });
    expect(options).toEqual({
      forwardProps: ['disabled'],
      propAliases: {
        size: 'htmlSize',
      },
    });
  });

  it('resolves slotted prop bags identically in lean and strict runtimes', () => {
    const config = {
      slots: { root: 'flex', icon: 'size-4' },
      variants: {
        size: {
          sm: { root: 'text-sm', icon: 'size-3' },
          lg: { root: 'text-lg' },
        },
      },
      defaultVariants: { size: 'sm' },
    } as const;

    for (const make of [
      recipe,
      defineConfig({ validate: 'always' }).recipe,
    ] as const) {
      const tabs = make(config);
      const { resolvedProps, slots, variants } = tabs.resolve(
        {
          size: 'lg',
          id: 'tabs',
          className: 'mt-2',
          slotClassNames: { icon: 'p-1' },
        },
        { forwardProps: ['size'] }
      );

      expect(variants).toEqual({ size: 'lg' });
      expect(resolvedProps).toEqual({
        className: 'mt-2',
        id: 'tabs',
        size: 'lg',
      });
      expect(slots.root()).toBe('flex text-lg');
      expect(slots.icon()).toBe('size-4 p-1');
      expect(slots.icon({ size: 'sm' })).toBe('size-4 size-3 p-1');
    }
  });

  it('passes ref through resolvedProps untouched', () => {
    const ref = () => {};
    const badge = recipe({
      base: 'inline-flex',
      variants: { tone: { info: 'text-sky-700' } },
    });

    const { resolvedProps } = badge.resolve({ tone: 'info', ref });

    expect(resolvedProps.ref).toBe(ref);
  });

  it('applies chained propAliases in declaration order', () => {
    // Chains are unreachable through the public types (an alias key cannot be
    // a base prop key), so this pins the runtime behavior for casted input.
    const badge = recipe({
      base: 'inline-flex',
      variants: { tone: { info: 'text-sky-700' } },
    });

    const { resolvedProps } = badge.resolve(
      { tone: 'info', c: 'from-c' } as never,
      { propAliases: { b: 'c', a: 'b' } } as never
    );

    expect(resolvedProps).toEqual({
      a: 'from-c',
      className: 'inline-flex text-sky-700',
    });
  });
});
