import { describe, expect, it, vi } from 'vitest';
import {
  defineConfig,
  defineRecipeConfig,
  recipe,
  variantNames,
  variantOptions,
} from '../src';

describe('recipe()', () => {
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

  it('returns slot render functions with top-level and local slot overrides', () => {
    const button = recipe({
      slots: {
        root: 'inline-flex items-center',
        label: 'transition-opacity',
        spinner: 'hidden size-4',
      },
      variants: {
        tone: {
          primary: {
            root: 'bg-blue text-white',
            spinner: 'text-blue-100',
          },
          ghost: {
            root: 'bg-transparent text-slate-900',
            spinner: 'text-slate-500',
          },
        },
        loading: {
          true: {
            label: 'opacity-0',
            spinner: 'inline-block animate-spin',
          },
        },
      },
      compoundVariants: [
        {
          tone: 'primary',
          loading: true,
          className: {
            spinner: 'drop-shadow',
          },
        },
      ],
      defaultVariants: {
        tone: 'primary',
        loading: false,
      },
    });

    const slots = button({
      loading: true,
      slotClassNames: {
        root: 'cursor-wait',
        spinner: 'animate-pulse',
      },
    });

    expect(Object.keys(slots)).toEqual(['root', 'label', 'spinner']);
    expect(Object.prototype.hasOwnProperty.call(slots, 'root')).toBe(true);
    expect(slots.root()).toBe(
      'inline-flex items-center bg-blue text-white cursor-wait'
    );
    expect(slots.label()).toBe('transition-opacity opacity-0');
    expect(slots.spinner()).toBe(
      'hidden size-4 text-blue-100 inline-block animate-spin drop-shadow animate-pulse'
    );
    expect(slots.spinner({ tone: 'ghost', className: 'text-red-500' })).toBe(
      'hidden size-4 text-slate-500 inline-block animate-spin animate-pulse text-red-500'
    );
  });

  it('treats destructured slot renderers as normal functions', () => {
    const button = recipe({
      slots: {
        root: 'inline-flex items-center',
        label: 'truncate',
      },
      variants: {
        tone: {
          primary: {
            root: 'bg-blue text-white',
          },
          ghost: {
            root: 'bg-transparent text-slate-900',
          },
        },
        loading: {
          true: {
            label: 'opacity-0',
          },
        },
      },
      defaultVariants: {
        tone: 'primary',
        loading: false,
      },
    });

    const slots = button({ loading: true });
    const { root, label } = slots;

    expect(root()).toBe('inline-flex items-center bg-blue text-white');
    expect(root({ tone: 'ghost', className: 'rounded-md' })).toBe(
      'inline-flex items-center bg-transparent text-slate-900 rounded-md'
    );
    expect(label()).toBe('truncate opacity-0');
  });

  it('supports slotted recipes without a root slot', () => {
    const field = recipe({
      slots: {
        label: 'block text-sm',
        input: 'block rounded-md',
      },
      variants: {
        invalid: {
          true: {
            label: 'text-red-700',
            input: 'border-red-500',
          },
        },
      },
    });

    const slots = field({ invalid: true });

    expect(slots.label()).toBe('block text-sm text-red-700');
    expect(slots.input({ className: 'w-full' })).toBe(
      'block rounded-md border-red-500 w-full'
    );
  });

  it('passes className through SlotRecipe.resolve() without assigning it to a slot', () => {
    const button = recipe({
      slots: {
        root: 'inline-flex',
        label: 'truncate',
      },
      variants: {
        disabled: {
          true: {
            root: 'opacity-50',
          },
        },
      },
    });

    expect(
      button.resolve(
        {
          disabled: true,
          className: 'external',
          slotClassNames: {
            label: 'uppercase',
          },
          type: 'button',
        },
        {
          forwardProps: ['disabled'],
        }
      )
    ).toEqual({
      variants: {
        disabled: true,
      },
      resolvedProps: {
        className: 'external',
        type: 'button',
        disabled: true,
      },
      slots: {
        root: expect.any(Function),
        label: expect.any(Function),
      },
    });

    const resolved = button.resolve({
      disabled: true,
      className: 'external',
      slotClassNames: {
        label: 'uppercase',
      },
    });
    expect(resolved.slots.root()).toBe('inline-flex opacity-50');
    expect(resolved.slots.label()).toBe('truncate uppercase');
    expect(
      resolved.slots.root({
        className: resolved.resolvedProps.className as string,
      })
    ).toBe('inline-flex opacity-50 external');
    expect('slotClassNames' in resolved.resolvedProps).toBe(false);
  });

  it('applies the configured merge hook to each resolved slot independently', () => {
    const { recipe: mergedRecipe } = defineConfig({
      merge: className =>
        className
          .split(/\s+/)
          .filter(Boolean)
          .filter((token, index, tokens) => tokens.indexOf(token) === index)
          .join(' '),
    });

    const button = mergedRecipe({
      slots: {
        root: 'rounded rounded p-4',
        icon: 'size-4 size-4',
      },
      variants: {
        tone: {
          primary: {
            root: 'bg-white bg-white',
            icon: 'text-blue-500 text-blue-500',
          },
        },
      },
    });

    const slots = button({
      tone: 'primary',
      slotClassNames: {
        root: 'p-4 shadow-sm shadow-sm',
        icon: 'size-4 text-red-500 text-red-500',
      },
    });

    expect(slots.root()).toBe('rounded p-4 bg-white shadow-sm');
    expect(slots.icon()).toBe('size-4 text-blue-500 text-red-500');
  });

  it('uses the configured merge hook from the React factory', () => {
    const { recipe: mergedRecipe } = defineConfig({
      merge: className =>
        className
          .split(/\s+/)
          .filter(Boolean)
          .filter((token, index, tokens) => tokens.indexOf(token) === index)
          .join(' '),
    });

    const card = mergedRecipe({
      base: 'rounded rounded p-4',
      variants: {
        tone: {
          neutral: 'bg-white bg-white',
        },
      },
    });

    expect(card({ tone: 'neutral', className: 'p-4 shadow-sm' })).toBe(
      'rounded p-4 bg-white shadow-sm'
    );
  });

  it('rejects reserved variant keys in lean mode too', () => {
    expect(() =>
      recipe({
        base: 'inline-flex',
        variants: {
          className: {
            compact: 'gap-1',
          },
        },
      } as never)
    ).toThrow(/variant key "className" is reserved/);

    expect(() =>
      recipe({
        slots: {
          root: 'inline-flex',
        },
        variants: {
          slotClassNames: {
            compact: {
              root: 'gap-1',
            },
          },
        },
      } as never)
    ).toThrow(/variant key "slotClassNames" is reserved/);
  });

  it('rejects invalid direct calls and slotted string shortcuts in validate mode', () => {
    const { recipe: strictRecipe } = defineConfig({ validate: 'always' });

    const root = strictRecipe({
      base: 'inline-flex',
      variants: {
        tone: {
          info: 'bg-sky-100',
        },
      },
    });

    expect(() => root({ tone: 'info', type: 'button' } as never)).toThrow(
      /unknown recipe prop "type"/
    );
    expect(() =>
      root.resolve(
        { tone: 'info' },
        {
          propAliases: {
            type: 'tone',
          },
        }
      )
    ).toThrow(/conflicts with a declared variant key/);

    const slots = strictRecipe({
      slots: {
        root: 'inline-flex',
      },
      variants: {
        tone: {
          info: {
            root: 'bg-sky-100',
          },
        },
      },
    });

    expect(() => slots({ tone: 'info', className: 'px-4' } as never)).toThrow(
      /className cannot be passed directly/
    );

    expect(() =>
      strictRecipe({
        slots: {
          root: 'inline-flex',
        },
        base: '',
      } as never)
    ).toThrow(/cannot define both "base" and "slots"/);

    expect(() =>
      root.resolve(
        { tone: 'info', htmlClass: 'rounded-md' },
        {
          propAliases: {
            className: 'htmlClass',
          },
        }
      )
    ).toThrow(/prop alias target "className" conflicts with a reserved/);

    expect(() =>
      strictRecipe({
        slots: {
          root: 'inline-flex',
        },
        variants: {
          tone: {
            info: 'bg-sky-100',
          },
        },
      } as never)
    ).toThrow(/must be an explicit slot className map/);

    expect(() =>
      strictRecipe({
        base: ['inline-flex', null],
      } as never)
    ).toThrow(/className arrays may only contain strings/);

    expect(() =>
      strictRecipe({
        variants: {
          state: {
            true: 'is-true',
            idle: 'is-idle',
          },
        },
      } as never)
    ).toThrow(/cannot mix boolean options/);

    expect(() =>
      strictRecipe({
        base: 'inline-flex',
        variants: {
          tone: {
            info: 'bg-sky-100',
          },
        },
        defaultVariants: {
          tone: 'missing',
        },
      } as never)
    ).toThrow(/invalid defaultVariants value "missing" for variant "tone"/);

    expect(() =>
      strictRecipe({
        base: 'inline-flex',
        variants: {
          tone: {
            info: 'bg-sky-100',
          },
        },
        defaultVariants: {
          missing: 'info',
        },
      } as never)
    ).toThrow(/defaultVariants key "missing" is not declared in variants/);

    expect(() => root({ tone: 'info', className: [1] } as never)).toThrow(
      /invalid input\.className/
    );

    expect(() => root.resolve({ tone: 'info', className: 1 })).toThrow(
      /invalid input\.className/
    );

    const slotRenderers = slots({ tone: 'info' });
    expect(() => slotRenderers.root({ className: [1] } as never)).toThrow(
      /invalid slot input\.className/
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

  it('keeps slotted recipe output identical across checked and production paths for string-only slot maps', () => {
    const config = {
      slots: {
        root: 'inline-flex items-center gap-2',
        label: 'font-medium',
        icon: 'size-4',
      },
      variants: {
        tone: {
          primary: {
            root: 'bg-blue-600 text-white',
            label: 'text-white',
            icon: 'text-blue-100',
          },
          ghost: {
            root: 'bg-transparent text-slate-900',
            label: 'text-slate-900',
            icon: 'text-slate-500',
          },
        },
        size: {
          sm: {
            root: 'h-8 px-3',
            label: 'text-sm',
            icon: 'size-3.5',
          },
          md: {
            root: 'h-10 px-4',
            label: 'text-base',
            icon: 'size-4',
          },
        },
      },
      defaultVariants: {
        tone: 'primary',
        size: 'md',
      },
    } as const;
    const { recipe: strictRecipe } = defineConfig({ validate: 'always' });
    const { recipe: uncheckedRecipe } = defineConfig({ validate: 'never' });
    const strict = strictRecipe(config);
    const unchecked = uncheckedRecipe(config);

    const strictSlots = strict({
      tone: 'ghost',
      size: 'sm',
    });
    const uncheckedSlots = unchecked({
      tone: 'ghost',
      size: 'sm',
    });

    expect(uncheckedSlots.root()).toBe(strictSlots.root());
    expect(uncheckedSlots.label()).toBe(strictSlots.label());
    expect(uncheckedSlots.icon()).toBe(strictSlots.icon());
    expect(uncheckedSlots.root({ className: 'rounded-md' })).toBe(
      strictSlots.root({ className: 'rounded-md' })
    );
  });

  it('keeps slotted recipe output identical across checked and production paths for mixed slot maps and compounds', () => {
    const config = {
      slots: {
        root: 'inline-flex items-center gap-2',
        label: ['font-medium', 'leading-none'],
        badge: null,
      },
      variants: {
        tone: {
          primary: {
            root: 'bg-blue-600 text-white',
            label: ['text-white', 'uppercase'],
            badge: null,
          },
          secondary: {
            root: ['bg-slate-200', 'text-slate-950'],
            label: 'text-slate-900',
            badge: 'text-slate-500',
          },
        },
        emphasis: {
          quiet: {
            root: 'shadow-sm',
            label: null,
            badge: ['hidden'],
          },
          loud: {
            root: 'ring-2',
            label: ['tracking-wide'],
            badge: 'block',
          },
        },
      },
      defaultVariants: {
        tone: 'primary',
        emphasis: 'quiet',
      },
      compoundVariants: [
        {
          tone: ['primary', 'secondary'],
          emphasis: 'loud',
          className: {
            root: 'ring-offset-2',
            label: 'underline',
            badge: 'opacity-100',
          },
        },
      ],
    } as const;
    const { recipe: strictRecipe } = defineConfig({ validate: 'always' });
    const { recipe: uncheckedRecipe } = defineConfig({ validate: 'never' });
    const strict = strictRecipe(config);
    const unchecked = uncheckedRecipe(config);

    const strictSlots = strict({
      tone: 'secondary',
      emphasis: 'loud',
    });
    const uncheckedSlots = unchecked({
      tone: 'secondary',
      emphasis: 'loud',
    });

    expect(uncheckedSlots.root()).toBe(strictSlots.root());
    expect(uncheckedSlots.label()).toBe(strictSlots.label());
    expect(uncheckedSlots.badge()).toBe(strictSlots.badge());
    expect(uncheckedSlots.label({ className: ['italic', 'opacity-80'] })).toBe(
      strictSlots.label({ className: ['italic', 'opacity-80'] })
    );
    expect(uncheckedSlots.badge({ className: 'rounded-full' })).toBe(
      strictSlots.badge({ className: 'rounded-full' })
    );
  });

  it('still rejects mixed boolean variants in production-like mode', () => {
    const { recipe: uncheckedRecipe } = defineConfig({ validate: 'never' });

    expect(() =>
      uncheckedRecipe({
        variants: {
          state: {
            true: 'is-true',
            idle: 'is-idle',
          },
        },
      } as never)
    ).toThrow(/cannot mix boolean options/);
  });

  it('keeps strict recipes deeply frozen in validate: always mode', () => {
    const { recipe: strictRecipe } = defineConfig({ validate: 'always' });
    const config = {
      base: 'inline-flex',
      variants: {
        tone: {
          info: 'bg-sky-100',
        },
      },
    };

    strictRecipe(config);

    expect(() => {
      config.variants.tone.info = 'text-red-500';
    }).toThrow();
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

describe('result cache', () => {
  const dedup = (className: string) =>
    className
      .split(/\s+/)
      .filter(Boolean)
      .filter((token, index, tokens) => tokens.indexOf(token) === index)
      .join(' ');

  it('serves repeated identical input from cache without re-invoking merge', () => {
    const merge = vi.fn(dedup);
    const { recipe: configured } = defineConfig({ merge });
    const button = configured({
      base: 'p-2 p-2',
      variants: { tone: { primary: 'bg-blue-500' } },
    });

    const first = button({ tone: 'primary' });
    expect(first).toBe('p-2 bg-blue-500');
    expect(merge).toHaveBeenCalledTimes(1);

    const second = button({ tone: 'primary' });
    expect(second).toBe(first);
    expect(merge).toHaveBeenCalledTimes(1);

    button({ tone: 'primary', className: 'mt-1' });
    expect(merge).toHaveBeenCalledTimes(2);
  });

  it('produces identical output with and without the cache', () => {
    const config = {
      base: 'p-2 p-2',
      variants: {
        tone: { primary: 'bg-a', secondary: 'bg-b' },
        big: { true: 'text-lg' },
      },
    } as const;
    const cached = defineConfig({ merge: dedup }).recipe(config);
    const uncached = defineConfig({ merge: dedup, cache: false }).recipe(
      config
    );

    const inputs = [
      {},
      { tone: 'primary' },
      { tone: 'secondary', big: true },
      { tone: 'primary', className: 'mt-1' },
      { big: true, className: ['a', 'b'] },
    ];

    for (const input of inputs) {
      expect(cached(input as never)).toBe(uncached(input as never));
    }
  });

  it('keeps distinct selections apart across the \\x00 separator', () => {
    const { recipe: configured } = defineConfig({ merge: dedup });
    const recipeFn = configured({
      variants: {
        one: { a: 'one-a', ab: 'one-ab' },
        two: { bc: 'two-bc', c: 'two-c' },
      },
    });

    expect(recipeFn({ one: 'a', two: 'bc' })).toBe('one-a two-bc');
    expect(recipeFn({ one: 'ab', two: 'c' })).toBe('one-ab two-c');
  });

  it('keys className content, not reference', () => {
    const { recipe: configured } = defineConfig({ merge: dedup });
    const card = configured({ base: 'p-2' });

    expect(card({ className: ['mt-1', 'mb-1'] })).toBe('p-2 mt-1 mb-1');
    expect(card({ className: 'mt-1 mb-1' })).toBe('p-2 mt-1 mb-1');
    expect(card({ className: 'mb-1 mt-1' })).toBe('p-2 mb-1 mt-1');
  });

  it('evicts oldest entries (FIFO) at maxSize', () => {
    const merge = vi.fn(dedup);
    const { recipe: configured } = defineConfig({
      merge,
      cache: { maxSize: 1 },
    });
    const button = configured({
      variants: { tone: { primary: 'bg-a', secondary: 'bg-b' } },
    });

    expect(button({ tone: 'primary' })).toBe('bg-a');
    expect(merge).toHaveBeenCalledTimes(1);
    expect(button({ tone: 'primary' })).toBe('bg-a');
    expect(merge).toHaveBeenCalledTimes(1);

    expect(button({ tone: 'secondary' })).toBe('bg-b');
    expect(merge).toHaveBeenCalledTimes(2);
    expect(button({ tone: 'primary' })).toBe('bg-a');
    expect(merge).toHaveBeenCalledTimes(3);
  });

  it('disables the cache when maxSize is not positive', () => {
    const merge = vi.fn(dedup);
    const { recipe: configured } = defineConfig({
      merge,
      cache: { maxSize: 0 },
    });
    const button = configured({ base: 'p-2 p-2' });

    button();
    button();
    expect(merge).toHaveBeenCalledTimes(2);
  });

  it('stays inert when no merge is configured', () => {
    const merge = vi.fn(dedup);
    const noMerge = defineConfig({ cache: true }).recipe({
      base: 'p-2 p-2',
      variants: { tone: { primary: 'bg-a' } },
    });

    expect(noMerge({ tone: 'primary' })).toBe('p-2 p-2 bg-a');
    expect(noMerge({ tone: 'primary' })).toBe('p-2 p-2 bg-a');
    expect(merge).not.toHaveBeenCalled();
  });

  it('never engages in strict mode, so validation always runs', () => {
    const { recipe: configured } = defineConfig({
      validate: 'always',
      merge: dedup,
      cache: true,
    });
    const button = configured({
      base: 'p-2',
      variants: { tone: { primary: 'bg-a' } },
    });

    expect(() => button({ nope: true } as never)).toThrow();
    expect(() => button({ nope: true } as never)).toThrow();
    expect(() => button({ className: 42 } as never)).toThrow();
  });

  it('caches each slot independently and keys on slotIndex', () => {
    const merge = vi.fn(dedup);
    const { recipe: configured } = defineConfig({ merge, cache: true });
    const button = configured({
      slots: { root: 'flex flex', icon: 'size-4 size-4' },
      variants: {
        tone: {
          primary: { root: 'bg-blue bg-blue', icon: 'text-blue text-blue' },
        },
      },
    });

    const slots = button({
      tone: 'primary',
      slotClassNames: { root: 'p-2 p-2' },
    });
    expect(slots.root()).toBe('flex bg-blue p-2');
    expect(slots.icon()).toBe('size-4 text-blue');
    expect(slots.root()).not.toBe(slots.icon());

    const callsAfterFirst = merge.mock.calls.length;
    const next = button({
      tone: 'primary',
      slotClassNames: { root: 'p-2 p-2' },
    });
    expect(next.root()).toBe('flex bg-blue p-2');
    expect(next.icon()).toBe('size-4 text-blue');
    expect(merge).toHaveBeenCalledTimes(callsAfterFirst);

    expect(slots.root({ className: 'mt-1' })).toBe('flex bg-blue p-2 mt-1');
  });
});
