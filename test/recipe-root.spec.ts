// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  defineConfig,
  defineRecipeConfig,
  recipe,
  variantNames,
  variantOptions,
} from '../src';

describe('recipe() root recipes', () => {
  it('returns the original config reference from defineRecipeConfig()', () => {
    const config = {
      base: 'inline-flex',
      variants: {
        tone: {
          primary: 'text-blue-600',
          secondary: 'text-slate-700',
        },
      },
      defaultVariants: {
        tone: 'primary',
      },
    } as const;

    expect(defineRecipeConfig(config)).toBe(config);
  });

  it('reads variant names and option values from configs and recipes', () => {
    const config = defineRecipeConfig({
      base: 'inline-flex',
      variants: {
        tone: {
          primary: 'text-blue-600',
          secondary: 'text-slate-700',
        },
        disabled: {
          true: 'opacity-50',
        },
      },
      defaultVariants: {
        disabled: false,
      },
    });
    const input = recipe(config);

    expect(variantNames(config)).toEqual(['tone', 'disabled']);
    expect(variantNames(input)).toEqual(['tone', 'disabled']);
    expect(variantOptions(config, 'tone')).toEqual(['primary', 'secondary']);
    expect(variantOptions(input, 'tone')).toEqual(['primary', 'secondary']);
    expect(variantOptions(config, 'disabled')).toEqual([true, false]);
    expect(variantOptions(input, 'disabled')).toEqual([true, false]);
    expect(variantOptions(input, 'missing' as never)).toEqual([]);
  });

  it('resolves root recipes with defaults, booleans, compounds, OR selectors, and className', () => {
    const input = recipe({
      base: ['w-full', 'rounded-md'],
      variants: {
        variant: {
          outline: 'bg-white border',
          filled: 'bg-gray-100 border-transparent',
          flushed: 'bg-transparent border-b-2',
        },
        size: {
          sm: 'px-2 py-1 text-sm',
          md: 'px-3 py-2 text-base',
        },
        disabled: {
          true: 'opacity-50',
        },
      },
      compoundVariants: [
        {
          variant: 'flushed',
          disabled: true,
          className: 'bg-gray-100',
        },
        {
          variant: ['outline', 'filled'],
          disabled: true,
          className: 'cursor-not-allowed',
        },
      ],
      defaultVariants: {
        variant: 'outline',
        size: 'md',
      },
    });

    expect(input()).toBe(
      'w-full rounded-md bg-white border px-3 py-2 text-base'
    );
    expect(
      input({
        variant: 'filled',
        size: 'sm',
        disabled: true,
        className: ['text-black', 'px-4'],
      })
    ).toBe(
      'w-full rounded-md bg-gray-100 border-transparent px-2 py-1 text-sm opacity-50 cursor-not-allowed text-black px-4'
    );

    const toggle = recipe({
      base: 'inline-flex',
      variants: {
        selected: {
          true: 'is-selected',
          false: 'not-selected',
        },
      },
    });

    expect(toggle()).toBe('inline-flex not-selected');
    expect(toggle({ selected: true })).toBe('inline-flex is-selected');
  });

  it('uses a lean runtime by default and only validates strictly when enabled', () => {
    const config = {
      base: 'inline-flex',
      variants: {
        tone: {
          info: 'text-sky-700',
        },
      },
    } as const;

    expect(recipe(config)()).toBe('inline-flex');
    expect(defineConfig().recipe(config)()).toBe('inline-flex');
    expect(() => defineConfig({ validate: 'always' }).recipe(config)()).toThrow(
      /missing required recipe variant "tone"/
    );
  });

  it('keeps valid root recipe output identical across checked and production paths', () => {
    const config = {
      base: ['inline-flex', 'items-center', 'rounded-md'],
      variants: {
        tone: {
          primary: 'bg-blue-600 text-white',
          secondary: 'bg-slate-200 text-slate-950',
          danger: 'bg-rose-600 text-white',
        },
        size: {
          sm: 'h-8 px-3 text-sm',
          md: 'h-10 px-4 text-base',
        },
        variant: {
          solid: '',
          outline: 'border bg-transparent',
        },
        disabled: {
          true: 'opacity-50 pointer-events-none',
          false: '',
        },
      },
      defaultVariants: {
        tone: 'primary',
        size: 'md',
        variant: 'solid',
        disabled: false,
      },
      compoundVariants: [
        {
          tone: ['primary', 'secondary'],
          variant: 'outline',
          className: 'ring-1 ring-current',
        },
        {
          tone: 'danger',
          disabled: true,
          className: 'cursor-not-allowed',
        },
      ],
    } as const;
    const { recipe: strictRecipe } = defineConfig({ validate: 'always' });
    const { recipe: uncheckedRecipe } = defineConfig({ validate: 'never' });
    const strict = strictRecipe(config);
    const unchecked = uncheckedRecipe(config);

    expect(unchecked()).toBe(strict());
    expect(
      unchecked({
        tone: 'secondary',
        variant: 'outline',
        className: ['shadow-sm', 'ring-offset-2'],
      })
    ).toBe(
      strict({
        tone: 'secondary',
        variant: 'outline',
        className: ['shadow-sm', 'ring-offset-2'],
      })
    );
    expect(
      unchecked({
        tone: 'danger',
        disabled: true,
      })
    ).toBe(
      strict({
        tone: 'danger',
        disabled: true,
      })
    );
  });

  it('keeps production-like recipes detached from config mutations', () => {
    const { recipe: uncheckedRecipe } = defineConfig({ validate: 'never' });
    const config = {
      base: 'inline-flex',
      variants: {
        tone: {
          info: 'bg-sky-100',
        },
      },
      defaultVariants: {
        tone: 'info',
      },
    } as const;

    const badge = uncheckedRecipe(config);
    const mutableConfig = config as any;

    mutableConfig.base = 'mutated';
    mutableConfig.variants.tone.info = 'text-red-500';
    mutableConfig.defaultVariants.tone = 'missing';

    expect(badge()).toBe('inline-flex bg-sky-100');
    expect('config' in badge).toBe(false);
  });
});
