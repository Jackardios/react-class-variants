// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { defineConfig, recipe, variantNames, variantOptions } from '../src';

describe('recipe() validation', () => {
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

    expect(() => root.resolve({ tone: 'info', className: 1 } as never)).toThrow(
      /invalid input\.className/
    );

    const slotRenderers = slots({ tone: 'info' });
    expect(() => slotRenderers.root({ className: [1] } as never)).toThrow(
      /invalid slot input\.className/
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

  it('freezes the nested maps of an already-frozen config', () => {
    const { recipe: strictRecipe } = defineConfig({ validate: 'always' });
    const variants = { tone: { info: 'bg-sky-100' } };

    strictRecipe(Object.freeze({ base: 'inline-flex', variants }));

    expect(Object.isFrozen(variants.tone)).toBe(true);
    expect(() => {
      variants.tone.info = 'text-red-500';
    }).toThrow();
  });
});

describe('lean mode', () => {
  it('ignores forwardProps keys that are not declared variants', () => {
    const badge = recipe({
      base: 'badge',
      variants: { tone: { info: 'info' } },
      defaultVariants: { tone: 'info' },
    });

    expect(
      badge.resolve({ id: 'x' }, { forwardProps: ['size' as never, 'tone'] })
        .resolvedProps
    ).toEqual({ className: 'badge info', id: 'x', tone: 'info' });
  });

  it('requires a slots object', () => {
    expect(() => recipe({ slots: null } as never)).toThrow(
      'react-class-variants: slotted recipes require a slots object.'
    );
  });

  it('keeps the result cache on its default bound for an empty cache object', () => {
    const merge = vi.fn((className: string) => className);
    const card = defineConfig({ merge, cache: {} }).recipe({ base: 'p-2' });

    card();
    card();
    expect(merge).toHaveBeenCalledTimes(1);
  });
});

describe('non-recipe inputs', () => {
  it('throws a descriptive error when variant helpers receive a non-recipe function', () => {
    expect(() => variantNames((() => 'x') as never)).toThrow(
      /variantNames\(\)/
    );
    expect(() => variantOptions((() => 'x') as never, 'tone' as never)).toThrow(
      /variantOptions\(\)/
    );
  });
});

describe('strict validation messages', () => {
  const strict = defineConfig({ validate: 'always' }).recipe;
  const createButton = () =>
    strict({
      base: 'inline-flex',
      variants: {
        tone: { info: 'text-sky-700', danger: 'text-rose-700' },
        disabled: { true: 'opacity-50', false: '' },
      },
      defaultVariants: { disabled: false },
    });

  it('rejects missing required variants and invalid values in direct calls', () => {
    const button = createButton();

    expect(() => (button as (input?: object) => string)()).toThrow(
      'react-class-variants: missing required recipe variant "tone".'
    );
    expect(() => button({ tone: 'bogus' as never })).toThrow(
      /invalid recipe value "bogus" for variant "tone"/
    );
  });

  it('rejects defaultVariants when no variants are declared', () => {
    expect(() =>
      strict({
        base: 'inline-flex',
        defaultVariants: { tone: 'info' },
      } as never)
    ).toThrow(
      'react-class-variants: defaultVariants key "tone" is not declared in variants.'
    );
  });

  it('rejects invalid compoundVariants values in root and slotted recipes', () => {
    const variants = { tone: { info: 'text-sky-700' } };

    expect(() =>
      strict({
        base: 'inline-flex',
        variants,
        compoundVariants: [{ tone: 'bogus', className: 'ring' }],
      } as never)
    ).toThrow(
      'react-class-variants: invalid compoundVariants value "bogus" for variant "tone".'
    );
    expect(() =>
      strict({
        base: 'inline-flex',
        variants,
        compoundVariants: [{ tone: ['info', 'bogus'], className: 'ring' }],
      } as never)
    ).toThrow(
      'react-class-variants: invalid compoundVariants value "bogus" for variant "tone".'
    );
    expect(() =>
      strict({
        slots: { root: 'flex' },
        variants: { tone: { info: { root: 'text-sky-700' } } },
        compoundVariants: [{ tone: 'bogus', className: { root: 'ring' } }],
      } as never)
    ).toThrow(
      'react-class-variants: invalid compoundVariants value "bogus" for variant "tone".'
    );
    expect(() =>
      strict({
        slots: { root: 'flex' },
        variants: { tone: { info: { root: 'text-sky-700' } } },
        compoundVariants: [
          { tone: ['info', 'bogus'], className: { root: 'ring' } },
        ],
      } as never)
    ).toThrow(
      'react-class-variants: invalid compoundVariants value "bogus" for variant "tone".'
    );
  });

  it('validates slot override props in strict slot renderers', () => {
    const tabs = strict({
      slots: { root: 'flex', icon: 'size-4' },
      variants: {
        size: {
          sm: { root: 'text-sm', icon: 'size-3' },
          lg: { root: 'text-lg' },
        },
      },
      defaultVariants: { size: 'sm' },
    });
    const slots = tabs();

    expect(slots.root({ size: 'lg' })).toBe('flex text-lg');
    expect(slots.icon({ size: 'lg', className: 'p-1' })).toBe('size-4 p-1');
    expect(slots.root({ size: undefined })).toBe('flex text-sm');
    expect(() => slots.root({ bogus: true } as never)).toThrow(
      'react-class-variants: unknown slot override prop "bogus".'
    );
    expect(() => slots.root({ size: 'xl' } as never)).toThrow(
      'react-class-variants: invalid slot override value "xl" for variant "size".'
    );
  });

  it('rejects conflicting propAliases', () => {
    const button = createButton();

    expect(() =>
      button.resolve(
        { tone: 'info', size: 1, htmlSize: 2 },
        { propAliases: { size: 'htmlSize' } }
      )
    ).toThrow(
      'react-class-variants: propAliases target "size" would overwrite an existing resolved prop.'
    );
    expect(() =>
      button.resolve(
        { tone: 'info' },
        { propAliases: { size: 'alias', width: 'alias' } }
      )
    ).toThrow('react-class-variants: prop alias "alias" cannot be reused.');
    expect(() =>
      button.resolve({ tone: 'info' }, { propAliases: { size: 'className' } })
    ).toThrow(
      'react-class-variants: prop alias "className" conflicts with a reserved public prop.'
    );
    expect(() =>
      button.resolve({ tone: 'info' }, { propAliases: { size: 'tone' } })
    ).toThrow(
      'react-class-variants: prop alias "tone" conflicts with a declared variant key.'
    );
    expect(() =>
      button.resolve({ tone: 'info' }, { propAliases: { className: 'cls' } })
    ).toThrow(
      'react-class-variants: prop alias target "className" conflicts with a reserved public prop.'
    );
  });

  it('rejects invalid forwardProps', () => {
    const button = createButton();

    expect(() =>
      button.resolve({ tone: 'info' }, { forwardProps: ['size' as never] })
    ).toThrow(
      'react-class-variants: forwardProps key "size" is not declared in variants.'
    );
    expect(() =>
      button.resolve({ tone: 'info' }, {
        forwardProps: ['disabled'],
        propAliases: { disabled: 'isDisabled' },
      } as never)
    ).toThrow(
      'react-class-variants: forwardProps key "disabled" conflicts with propAliases target "disabled".'
    );
  });
});

// Optional inputs accept an explicit undefined (exactOptionalPropertyTypes);
// both runtimes treat it as absent.
describe('explicit undefined inputs', () => {
  const lean = defineConfig({
    cache: { maxSize: undefined },
    merge: undefined,
    validate: undefined,
  });
  const strict = defineConfig({ validate: 'always' });

  it.each([
    ['lean', lean],
    ['strict', strict],
  ] as const)('treats undefined as absent in %s mode', (_mode, config) => {
    const badge = config.recipe({
      base: 'badge',
      variants: {
        tone: { info: 'info', danger: 'danger' },
        outlined: { true: 'border' },
      },
      compoundVariants: [
        { tone: 'danger', outlined: undefined, className: 'danger-any' },
      ],
      defaultVariants: { tone: 'info', outlined: undefined },
    });

    expect(badge({ tone: undefined, outlined: undefined })).toBe('badge info');
    expect(badge({ tone: 'danger', className: undefined })).toBe(
      'badge danger danger-any'
    );
    expect(
      badge.resolve(
        { tone: 'danger', id: 'x' },
        { forwardProps: undefined, propAliases: undefined }
      ).resolvedProps
    ).toEqual({ className: 'badge danger danger-any', id: 'x' });
    expect(
      badge.resolve(
        { tone: 'danger', title: 't', label: 'l' },
        // The React PropAliases type allows an undefined entry; the runtime
        // skips it for resolve() too.
        {
          propAliases: { title: undefined, 'aria-label': 'label' },
        } as never
      ).resolvedProps
    ).toEqual({
      'aria-label': 'l',
      className: 'badge danger danger-any',
      title: 't',
    });

    const empty = config.recipe({
      base: undefined,
      variants: undefined,
      compoundVariants: undefined,
      defaultVariants: undefined,
    });
    expect(empty()).toBe('');

    const tabs = config.recipe({
      slots: { root: 'root', tab: 'tab' },
      variants: {
        size: {
          sm: { root: 'root-sm', tab: undefined },
          lg: { root: undefined, tab: 'tab-lg' },
        },
      },
      compoundVariants: [
        { size: 'lg', className: { root: 'root-lg', tab: undefined } },
      ],
      defaultVariants: { size: 'sm' },
    });

    const small = tabs({ slotClassNames: { tab: undefined } });
    expect([small.root(), small.tab()]).toEqual(['root root-sm', 'tab']);
    const large = tabs({ size: 'lg', slotClassNames: undefined });
    expect([large.root(), large.tab({ className: undefined })]).toEqual([
      'root root-lg',
      'tab tab-lg',
    ]);
  });
});
