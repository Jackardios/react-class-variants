// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { defineConfig, recipe } from '../src';

describe('compound variant semantics', () => {
  it('drops compounds containing undeclared keys in lean mode', () => {
    const button = recipe({
      base: 'btn',
      variants: { color: { red: 'c-red', blue: 'c-blue' } },
      defaultVariants: { color: 'red' },
      compoundVariants: [{ colr: 'red', className: 'ring' } as never],
    });

    expect(button()).toBe('btn c-red');
    expect(button({ color: 'blue' })).toBe('btn c-blue');
  });

  it('throws for undeclared compound keys in strict mode regardless of value', () => {
    const strictRecipe = defineConfig({ validate: 'always' }).recipe;
    const build = (compound: unknown) => () =>
      strictRecipe({
        base: 'btn',
        variants: { color: { red: 'c-red' } },
        defaultVariants: { color: 'red' },
        compoundVariants: [compound as never],
      });

    expect(build({ colr: 'red', className: 'ring' })).toThrow(
      /compoundVariants key "colr" is not declared/
    );
    expect(build({ colr: undefined, className: 'ring' })).toThrow(
      /compoundVariants key "colr" is not declared/
    );
  });

  it('treats explicit undefined compound values as absent in both runtimes', () => {
    const config = {
      base: 'btn',
      variants: { size: { sm: 's', lg: 'l' } },
      defaultVariants: { size: 'sm' },
      compoundVariants: [{ size: undefined, className: 'x' } as never],
    };
    const lean = defineConfig({ validate: 'never' }).recipe(config as never);
    const strict = defineConfig({ validate: 'always' }).recipe(config as never);

    // A compound whose selector keys are all absent applies to every selection.
    expect(lean()).toBe('btn s x');
    expect(lean({ size: 'lg' } as never)).toBe('btn l x');
    expect(strict()).toBe(lean());
    expect(strict({ size: 'lg' } as never)).toBe(lean({ size: 'lg' } as never));
  });

  it('filters undefined from compound value arrays in both runtimes', () => {
    for (const validate of ['always', 'never'] as const) {
      const button = defineConfig({ validate }).recipe({
        base: 'btn',
        variants: { tone: { info: 't-info', danger: 't-danger' } },
        defaultVariants: { tone: 'info' },
        compoundVariants: [
          { tone: [undefined, 'info'], className: 'ring' } as never,
          { tone: [undefined], className: 'never-applies' } as never,
        ],
      });

      expect(button()).toBe('btn t-info ring');
      expect(button({ tone: 'danger' })).toBe('btn t-danger');
    }
  });

  it('applies the same compound semantics to slotted recipes', () => {
    const tabs = recipe({
      slots: { root: 'flex', icon: 'size-4' },
      variants: {
        tone: { red: { root: 't-red' }, blue: { root: 't-blue' } },
      },
      defaultVariants: { tone: 'red' },
      compoundVariants: [
        { tone: 'red', typo: 'x', className: { root: 'ring' } } as never,
        { tone: undefined, className: { icon: 'shadow' } } as never,
      ],
    });

    const slots = tabs();
    expect(slots.root()).toBe('flex t-red');
    expect(slots.icon()).toBe('size-4 shadow');
  });
});
