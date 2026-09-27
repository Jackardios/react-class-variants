// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { defineConfig, hasOwnProperty, recipe } from '../src';

describe('recipe() slotted recipes', () => {
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
});
