// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { defineConfig, hasOwnProperty, recipe, variantOptions } from '../src';

describe('prototype-named keys', () => {
  it('ignores prototype-named slot override keys in lean mode', () => {
    const tabs = recipe({
      slots: { root: 'flex', icon: 'size-4' },
      variants: { tone: { red: { root: 'text-red' } } },
      defaultVariants: { tone: 'red' },
    });

    expect(tabs().root({ constructor: 'x' } as never)).toBe('flex text-red');
  });

  it('rejects prototype-named slot override keys in strict mode', () => {
    const tabs = defineConfig({ validate: 'always' }).recipe({
      slots: { root: 'flex' },
      variants: { tone: { red: { root: 'text-red' } } },
      defaultVariants: { tone: 'red' },
    });

    expect(() => tabs().root({ constructor: 'x' } as never)).toThrow(
      /unknown slot override prop "constructor"/
    );
  });

  it('keeps prototype-named option values out of lean class output', () => {
    const badge = recipe({
      base: 'inline-flex',
      variants: { color: { red: 'text-red' } },
      defaultVariants: { color: 'red' },
    });

    expect(badge({ color: 'constructor' } as never)).toBe('inline-flex');
  });

  it('rejects undeclared prototype-named slotClassNames slots in strict mode', () => {
    const tabs = defineConfig({ validate: 'always' }).recipe({
      slots: { root: 'flex' },
    });

    expect(() =>
      tabs({ slotClassNames: { constructor: 'p-1' } } as never)
    ).toThrow(/slot "constructor" is not declared/);
  });

  it('rejects variant keys that shadow Object.prototype members in strict mode', () => {
    expect(() =>
      defineConfig({ validate: 'always' }).recipe({
        base: 'inline-flex',
        variants: { toString: { fancy: 'font-serif' } },
      } as never)
    ).toThrow(/shadows an Object.prototype member/);
  });

  it('does not resolve inherited props through propAliases', () => {
    const input = recipe({
      base: 'block',
      variants: { size: { sm: 'text-sm' } },
      defaultVariants: { size: 'sm' },
    });

    const { resolvedProps } = input.resolve({}, {
      propAliases: { title: 'toString' },
    } as never);

    expect(hasOwnProperty(resolvedProps, 'title')).toBe(false);
  });

  it('allows prototype-named alias targets in strict mode without spurious overwrite errors', () => {
    const input = defineConfig({ validate: 'always' }).recipe({
      base: 'block',
      variants: { size: { sm: 'text-sm' } },
      defaultVariants: { size: 'sm' },
    });

    const { resolvedProps } = input.resolve(
      { foo: 1 } as never,
      {
        propAliases: { constructor: 'foo' },
      } as never
    );

    expect(hasOwnProperty(resolvedProps as object, 'constructor')).toBe(true);
    expect((resolvedProps as Record<string, unknown>).constructor).toBe(1);
  });

  it('does not let own __proto__ input keys swap the resolvedProps prototype', () => {
    const input = recipe({
      base: 'block',
      variants: { size: { sm: 'text-sm' } },
      defaultVariants: { size: 'sm' },
    });
    const source = JSON.parse(
      '{"id":"a","__proto__":{"polluted":1}}'
    ) as Record<string, unknown>;

    const { resolvedProps } = input.resolve(source as never);

    expect(Object.getPrototypeOf(resolvedProps)).toBe(Object.prototype);
    expect((resolvedProps as Record<string, unknown>).polluted).toBeUndefined();
    expect(hasOwnProperty(resolvedProps, '__proto__')).toBe(false);
    expect((resolvedProps as Record<string, unknown>).id).toBe('a');
  });

  it('never applies prop alias targets named __proto__', () => {
    const aliases = JSON.parse('{"__proto__":"payload"}') as Record<
      string,
      string
    >;
    const lean = recipe({
      base: 'block',
      variants: { size: { sm: 'text-sm' } },
      defaultVariants: { size: 'sm' },
    });

    const { resolvedProps } = lean.resolve(
      { payload: { polluted: 9 } } as never,
      {
        propAliases: aliases,
      } as never
    );

    expect(Object.getPrototypeOf(resolvedProps)).toBe(Object.prototype);
    expect((resolvedProps as Record<string, unknown>).polluted).toBeUndefined();
    expect(hasOwnProperty(resolvedProps, 'payload')).toBe(true);

    const strict = defineConfig({ validate: 'always' }).recipe({
      base: 'block',
      variants: { size: { sm: 'text-sm' } },
      defaultVariants: { size: 'sm' },
    });

    expect(() => strict.resolve({}, { propAliases: aliases } as never)).toThrow(
      /prop alias target "__proto__"/
    );
  });

  it('keeps prototype-named lookups safe for variants with many options', () => {
    const options: Record<string, string> = {};
    for (let index = 0; index < 24; index += 1) {
      options[`opt${index}`] = `cls${index}`;
    }
    const badge = recipe({
      base: 'inline-flex',
      variants: { color: options },
      defaultVariants: { color: 'opt0' },
    });

    expect(badge({ color: 'opt17' })).toBe('inline-flex cls17');
    expect(badge({ color: 'missing' } as never)).toBe('inline-flex');
    expect(badge({ color: 'constructor' } as never)).toBe('inline-flex');
    expect(badge({ color: 'toString' } as never)).toBe('inline-flex');
  });

  it('ignores undeclared prototype-named slotClassNames slots in lean mode', () => {
    const tabs = recipe({ slots: { root: 'flex' } });

    expect(
      tabs({ slotClassNames: { constructor: 'p-1' } } as never).root()
    ).toBe('flex');
  });

  it('does not read polluted Object.prototype entries through lookup tables', () => {
    (Object.prototype as Record<string, unknown>).__rcvPolluted = 'evil';
    try {
      const badge = recipe({
        base: 'inline-flex',
        variants: { color: { red: 'text-red' } },
        defaultVariants: { color: 'red' },
      });
      expect(badge({ color: '__rcvPolluted' } as never)).toBe('inline-flex');

      const { resolvedProps } = badge.resolve({ __rcvPolluted: 1 } as never);
      expect((resolvedProps as Record<string, unknown>).__rcvPolluted).toBe(1);

      const tabs = recipe({
        slots: { root: 'flex' },
        variants: { tone: { red: { root: 'text-red' } } },
        defaultVariants: { tone: 'red' },
      });
      expect(tabs().root({ __rcvPolluted: 'x' } as never)).toBe(
        'flex text-red'
      );
      expect(
        tabs({ slotClassNames: { __rcvPolluted: 'p-1' } } as never).root()
      ).toBe('flex text-red');

      // A numeric pollution value would be a valid table index if the lookup
      // tables were left with Object.prototype reachable.
      (Object.prototype as Record<string, unknown>).__rcvPolluted = 0;
      expect(
        tabs({ slotClassNames: { __rcvPolluted: 'p-1' } } as never).root()
      ).toBe('flex text-red');
      const numeric = badge.resolve({ __rcvPolluted: 1 } as never);
      expect(
        (numeric.resolvedProps as Record<string, unknown>).__rcvPolluted
      ).toBe(1);
    } finally {
      delete (Object.prototype as Record<string, unknown>).__rcvPolluted;
    }
  });

  it('compiles slots named __proto__ as regular slots', () => {
    const slots = JSON.parse('{"root":"flex","__proto__":"p-1"}') as Record<
      string,
      string
    >;
    const payload = JSON.parse('{"root":"ra","__proto__":"pa"}') as Record<
      string,
      string
    >;

    for (const make of [recipe, defineConfig({ validate: 'always' }).recipe]) {
      const tabs = make({
        slots,
        variants: { tone: { a: payload } },
        defaultVariants: { tone: 'a' },
      } as never);
      const rendered = tabs({} as never) as Record<string, () => string>;

      expect(typeof rendered['__proto__']).toBe('function');
      expect(rendered['__proto__']()).toBe('p-1 pa');
    }
  });

  it('compiles variant options named __proto__ as regular options', () => {
    const options = JSON.parse('{"red":"r","__proto__":"px"}') as Record<
      string,
      string
    >;
    const badge = recipe({
      base: 'b',
      variants: { color: options },
      defaultVariants: { color: 'red' },
    });

    expect(badge({ color: '__proto__' } as never)).toBe('b px');
    expect(variantOptions(badge, 'color')).toEqual(['red', '__proto__']);
  });

  it('indexes lean variant keys named __proto__ without leaking props', () => {
    const variants = JSON.parse(
      '{"__proto__":{"on":"vp"},"tone":{"a":"ta"}}'
    ) as Record<string, Record<string, string>>;
    const badge = recipe({
      base: 'b',
      variants,
      defaultVariants: JSON.parse('{"__proto__":"on","tone":"a"}') as never,
    } as never);

    expect(badge({} as never)).toBe('b ta');
    const { resolvedProps } = badge.resolve({ tone: 'a' } as never);
    expect(Object.keys(resolvedProps as object)).toEqual(['className']);

    // Slot overrides read the variant index directly, which makes the
    // __proto__ entry observable in lean output.
    const tabs = recipe({
      slots: { root: 'flex' },
      variants: JSON.parse(
        '{"__proto__":{"on":{"root":"vp"}},"tone":{"a":{"root":"ta"}}}'
      ) as never,
      defaultVariants: { tone: 'a' },
    } as never);
    const rendered = tabs({} as never) as Record<
      string,
      (input?: Record<string, unknown>) => string
    >;
    expect(rendered.root()).toBe('flex ta');
    expect(rendered.root(JSON.parse('{"__proto__":"on"}') as never)).toBe(
      'flex vp ta'
    );
  });
});
