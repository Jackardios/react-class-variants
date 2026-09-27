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

  it('applies chained propAliases independently from the raw input', () => {
    // Chains are unreachable through the public types (an alias key cannot be
    // a base prop key), so this pins the runtime behavior for casted input.
    const badge = recipe({
      base: 'inline-flex',
      variants: { tone: { info: 'text-sky-700' } },
    });

    const { resolvedProps } = badge.resolve(
      { tone: 'info', b: 'from-b', c: 'from-c' } as never,
      { propAliases: { b: 'c', a: 'b' } } as never
    );

    expect(resolvedProps).toEqual({
      a: 'from-b',
      b: 'from-c',
      className: 'inline-flex text-sky-700',
    });
  });

  it('forwards resolved defaults when resolve() gets no input', () => {
    const badge = recipe({
      base: 'inline-flex',
      variants: { tone: { info: 'text-sky-700', warn: 'text-amber-700' } },
      defaultVariants: { tone: 'warn' },
    });

    expect(badge.resolve(undefined, { forwardProps: ['tone'] })).toEqual({
      resolvedProps: { className: 'inline-flex text-amber-700', tone: 'warn' },
      variants: { tone: 'warn' },
    });
  });

  it('drops the propAliases that strict mode rejects in lean mode', () => {
    const config = {
      base: 'inline-flex',
      variants: { tone: { info: 'text-sky-700' } },
    };
    const input = {
      tone: 'info',
      className: 'mt-2',
      label: 'x',
      shared: 'y',
    } as never;
    // Reserved alias, variant alias, reserved target, reused alias.
    const propAliases = {
      title: 'className',
      role: 'tone',
      children: 'label',
      id: 'shared',
      name: 'shared',
    } as never;

    expect(
      recipe(config).resolve(input, { propAliases }).resolvedProps
    ).toEqual({
      className: 'inline-flex text-sky-700 mt-2',
      id: 'y',
      label: 'x',
    });
    expect(() =>
      defineConfig({ validate: 'always' })
        .recipe(config)
        .resolve(input, { propAliases })
    ).toThrow(/conflicts with a reserved public prop/);
  });

  it('drops aliases onto forwarded variants and __proto__ aliases in lean mode', () => {
    const config = {
      base: 'inline-flex',
      variants: { size: { sm: 'text-sm' } },
    };
    const input = JSON.parse(
      '{"size":"sm","htmlSize":"H","__proto__":"P"}'
    ) as never;
    const options = {
      forwardProps: ['size'],
      propAliases: { size: 'htmlSize', title: '__proto__' },
    } as never;
    const strict = defineConfig({ validate: 'always' }).recipe(config);

    expect(recipe(config).resolve(input, options).resolvedProps).toEqual({
      className: 'inline-flex text-sm',
      htmlSize: 'H',
      size: 'sm',
    });
    expect(() =>
      strict.resolve(input, {
        forwardProps: ['size'],
        propAliases: { size: 'htmlSize' },
      } as never)
    ).toThrow(/forwardProps key "size" conflicts with propAliases target/);
    expect(() =>
      strict.resolve(input, { propAliases: { title: '__proto__' } } as never)
    ).toThrow(/prop alias "__proto__" is not allowed/);
  });
});
