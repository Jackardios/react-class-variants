import { describe, expect, it } from 'vitest';
import { defineConfig, defineRecipeConfig, recipe } from '../src';

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

  it('resolves component prop bags with forwardProps and nativeAliases', () => {
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
          nativeAliases: { size: 'htmlSize' },
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
      nativeAliases: {
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
      nativeAliases: {
        size: 'htmlSize',
      },
    });
  });

  it('returns slot render functions with local variant overrides', () => {
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

    const slots = button({ loading: true });

    expect(slots.root()).toBe('inline-flex items-center bg-blue text-white');
    expect(slots.label()).toBe('transition-opacity opacity-0');
    expect(slots.spinner()).toBe(
      'hidden size-4 text-blue-100 inline-block animate-spin drop-shadow'
    );
    expect(slots.spinner({ tone: 'ghost', className: 'text-red-500' })).toBe(
      'hidden size-4 text-slate-500 inline-block animate-spin text-red-500'
    );
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

    const resolved = button.resolve({ disabled: true, className: 'external' });
    expect(resolved.slots.root()).toBe('inline-flex opacity-50');
    expect(
      resolved.slots.root({
        className: resolved.resolvedProps.className as string,
      })
    ).toBe('inline-flex opacity-50 external');
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
          nativeAliases: {
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
          nativeAliases: {
            className: 'htmlClass',
          },
        }
      )
    ).toThrow(/native alias target "className" conflicts with a reserved/);

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

  it('treats config mutation after creation as unsupported', () => {
    const config = {
      base: 'inline-flex',
      variants: {
        tone: {
          info: 'bg-sky-100',
        },
      },
    };

    const badge = recipe(config);

    expect(() => {
      config.base = 'mutated';
    }).toThrow();
    expect(badge({ tone: 'info' })).toBe('inline-flex bg-sky-100');
    expect('config' in badge).toBe(false);
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
