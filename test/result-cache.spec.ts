// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { defineConfig } from '../src';

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

  it('keeps every entry when maxSize is Infinity', () => {
    const merge = vi.fn(dedup);
    const { recipe: configured } = defineConfig({
      merge,
      cache: { maxSize: Infinity },
    });
    const card = configured({ base: 'p-2' });

    // More distinct inputs than the default bound of 500.
    for (let index = 0; index < 600; index += 1) {
      card({ className: `c${index}` });
    }
    card({ className: 'c0' });

    expect(merge).toHaveBeenCalledTimes(600);
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

  it('does not cache slot recipes, so slot merges always run', () => {
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
    // The result cache only memoizes root recipes; per-slot merges on short
    // strings are already cheap, so slot resolution runs merge every time.
    expect(merge.mock.calls.length).toBeGreaterThan(callsAfterFirst);

    expect(slots.root({ className: 'mt-1' })).toBe('flex bg-blue p-2 mt-1');
  });

  it('distinguishes boolean true from the string "true" in the cache key', () => {
    const config = {
      base: 'btn',
      variants: { disabled: { true: 'is-on', false: 'is-off' } },
    } as const;
    const cached = defineConfig({ merge: dedup }).recipe(config);
    const uncached = defineConfig({ merge: dedup, cache: false }).recipe(
      config
    );

    expect(cached({ disabled: true })).toBe('btn is-on');
    expect(cached({ disabled: 'true' } as never)).toBe(
      uncached({ disabled: 'true' } as never)
    );
  });

  it('keeps cache keys injective for option keys containing control characters', () => {
    const NUL = String.fromCharCode(0);
    const config = {
      base: 'btn',
      variants: {
        first: { [`x${NUL}y`]: 'first-a', x: 'first-b' },
        second: { [`y${NUL}z`]: 'second-a', z: 'second-b' },
      },
    };
    const cached = defineConfig({ merge: dedup }).recipe(config as never);
    const uncached = defineConfig({ merge: dedup, cache: false }).recipe(
      config as never
    );

    const inputs = [
      { first: `x${NUL}y`, second: 'z' },
      { first: 'x', second: `y${NUL}z` },
    ];

    for (const input of inputs) {
      expect(cached(input as never)).toBe(uncached(input as never));
    }
  });

  it('distinguishes empty-string option values from unset variants', () => {
    const config = {
      base: 'btn',
      variants: { tone: { '': 'blank' } },
    };
    const cached = defineConfig({ merge: dedup }).recipe(config as never);

    expect(cached({ tone: '' } as never)).toBe('btn blank');
    expect(cached({} as never)).toBe('btn');
  });

  it('keeps malformed non-string selections cacheable and consistent', () => {
    const config = {
      base: 'B',
      variants: { f: { true: 'T', false: 'F' } },
    } as const;
    const cached = defineConfig({ merge: dedup }).recipe(config);
    const uncached = defineConfig({ merge: dedup, cache: false }).recipe(
      config
    );

    const inputs = [
      { f: null },
      { f: 12 },
      { f: 1, className: '2' },
      { f: ['a', 'b'] },
      { f: 'a,', className: 'b' },
      { f: Object.create(null) as never },
      { f: { toString: null } },
    ];

    for (const input of inputs) {
      expect(cached(input as never)).toBe(uncached(input as never));
    }
  });
});
