import { describe, expect, it, vi } from 'vitest';
import { defineConfig } from '../src/index';

// =============================================================================
// defineConfig() Tests
// =============================================================================

describe('defineConfig', () => {
  describe('factory function', () => {
    it('should return variants, variantPropsResolver, and variantComponent', () => {
      const config = defineConfig();
      expect(config).toHaveProperty('variants');
      expect(config).toHaveProperty('variantPropsResolver');
      expect(config).toHaveProperty('variantComponent');
      expect(typeof config.variants).toBe('function');
      expect(typeof config.variantPropsResolver).toBe('function');
      expect(typeof config.variantComponent).toBe('function');
    });

    it('should work without options', () => {
      const { variants } = defineConfig();
      const button = variants({ base: 'btn' });
      expect(button()).toBe('btn');
    });

    it('should work with empty options object', () => {
      const { variants } = defineConfig({});
      const button = variants({ base: 'btn' });
      expect(button()).toBe('btn');
    });

    it('should work with undefined options', () => {
      const { variants } = defineConfig(undefined);
      const button = variants({ base: 'btn' });
      expect(button()).toBe('btn');
    });
  });

  describe('onClassesMerged option', () => {
    it('should apply onClassesMerged to final className', () => {
      const mockMerge = vi.fn((cls: string) => cls.toUpperCase());
      const { variants } = defineConfig({ onClassesMerged: mockMerge });

      const button = variants({
        base: 'btn',
        variants: { color: { primary: 'bg-blue' } },
      });

      const result = button({ color: 'primary' });
      expect(mockMerge).toHaveBeenCalledWith('btn bg-blue');
      expect(result).toBe('BTN BG-BLUE');
    });

    it('should pass joined className string to onClassesMerged', () => {
      const mockMerge = vi.fn((cls: string) => cls);
      const { variants } = defineConfig({ onClassesMerged: mockMerge });

      const button = variants({
        base: ['a', 'b'],
        variants: { size: { lg: ['c', 'd'] } },
      });

      button({ size: 'lg' });
      expect(mockMerge).toHaveBeenCalledWith('a b c d');
    });

    it('should work with tailwind-merge-like deduplication', () => {
      const { variants } = defineConfig({
        onClassesMerged: (cls) => {
          // Simple mock: remove duplicate "px-" prefixed classes, keeping last
          const classes = cls.split(' ');
          const seen = new Map<string, string>();
          for (const c of classes) {
            const prefix = c.split('-')[0];
            seen.set(prefix, c);
          }
          return Array.from(seen.values()).join(' ');
        },
      });

      const button = variants({
        base: 'px-4',
        variants: { size: { lg: 'px-8' } },
      });

      expect(button({ size: 'lg' })).toBe('px-8');
    });

    it('should apply onClassesMerged to empty result', () => {
      const mockMerge = vi.fn((cls: string) => cls || 'default');
      const { variants } = defineConfig({ onClassesMerged: mockMerge });

      const empty = variants({});
      expect(empty()).toBe('default');
      expect(mockMerge).toHaveBeenCalledWith('');
    });
  });
});

// =============================================================================
// variants() Tests
// =============================================================================

describe('variants()', () => {
  const { variants } = defineConfig();

  // ---------------------------------------------------------------------------
  // Base Classes
  // ---------------------------------------------------------------------------

  describe('base classes', () => {
    it('should return base className when no variants defined', () => {
      const button = variants({ base: 'btn' });
      expect(button()).toBe('btn');
    });

    it('should handle empty string base', () => {
      const button = variants({ base: '' });
      expect(button()).toBe('');
    });

    it('should handle null base', () => {
      const button = variants({ base: null });
      expect(button()).toBe('');
    });

    it('should handle undefined base', () => {
      const button = variants({ base: undefined });
      expect(button()).toBe('');
    });

    it('should handle array base', () => {
      const button = variants({ base: ['btn', 'rounded'] });
      expect(button()).toBe('btn rounded');
    });

    it('should handle nested array base', () => {
      const button = variants({ base: [['btn'], ['rounded', 'shadow']] });
      expect(button()).toBe('btn rounded shadow');
    });

    it('should filter null/undefined from array base', () => {
      const button = variants({ base: ['btn', null, undefined, 'rounded'] });
      expect(button()).toBe('btn rounded');
    });

    it('should handle deeply nested arrays', () => {
      const button = variants({
        base: [[[[['deep', 'nested']]]]],
      });
      expect(button()).toBe('deep nested');
    });

    it('should handle empty arrays in base', () => {
      const button = variants({ base: [[], 'btn', []] });
      expect(button()).toBe('btn');
    });

    it('should handle array with only null/undefined', () => {
      const button = variants({ base: [null, undefined, null] });
      expect(button()).toBe('');
    });

    it('should handle whitespace-only strings', () => {
      const button = variants({ base: '   ' });
      expect(button()).toBe('   ');
    });

    it('should handle very long class strings', () => {
      const longClass = 'a'.repeat(10000);
      const button = variants({ base: longClass });
      expect(button()).toBe(longClass);
    });
  });

  // ---------------------------------------------------------------------------
  // Empty Configuration
  // ---------------------------------------------------------------------------

  describe('empty configuration', () => {
    it('should work with empty config object', () => {
      const empty = variants({});
      expect(empty()).toBe('');
    });

    it('should accept className prop with empty config', () => {
      const empty = variants({});
      expect(empty({ className: 'custom' })).toBe('custom');
    });

    it('should merge base with className prop', () => {
      const withBase = variants({ base: 'base' });
      expect(withBase({ className: 'custom' })).toBe('base custom');
    });

    it('should handle props with undefined className', () => {
      const empty = variants({});
      expect(empty({ className: undefined })).toBe('');
    });

    it('should handle props with null className', () => {
      const empty = variants({});
      expect(empty({ className: null })).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Single Variant
  // ---------------------------------------------------------------------------

  describe('single variant', () => {
    it('should apply variant className', () => {
      const button = variants({
        variants: {
          color: {
            primary: 'bg-blue',
            secondary: 'bg-gray',
          },
        },
      });

      expect(button({ color: 'primary' })).toBe('bg-blue');
      expect(button({ color: 'secondary' })).toBe('bg-gray');
    });

    it('should combine base with variant', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
      });

      expect(button({ color: 'primary' })).toBe('btn bg-blue');
    });

    it('should handle variant with null className', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
            none: null,
          },
        },
      });

      expect(button({ color: 'none' })).toBe('btn');
    });

    it('should handle variant with undefined className', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
            none: undefined,
          },
        },
      });

      expect(button({ color: 'none' })).toBe('btn');
    });

    it('should handle variant with array className', () => {
      const button = variants({
        variants: {
          color: {
            primary: ['bg-blue', 'text-white'],
          },
        },
      });

      expect(button({ color: 'primary' })).toBe('bg-blue text-white');
    });

    it('should handle variant with empty string className', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: { empty: '' },
        },
      });

      expect(button({ color: 'empty' })).toBe('btn');
    });

    it('should handle variant with nested array className', () => {
      const button = variants({
        variants: {
          color: {
            primary: [['bg-blue', 'text-white'], ['shadow']],
          },
        },
      });

      expect(button({ color: 'primary' })).toBe('bg-blue text-white shadow');
    });

    it('should handle single variant value', () => {
      const button = variants({
        variants: {
          color: {
            primary: 'bg-blue',
          },
        },
      });

      expect(button({ color: 'primary' })).toBe('bg-blue');
    });
  });

  // ---------------------------------------------------------------------------
  // Multiple Variants
  // ---------------------------------------------------------------------------

  describe('multiple variants', () => {
    it('should apply multiple variants', () => {
      const button = variants({
        variants: {
          color: { primary: 'bg-blue' },
          size: { large: 'text-lg' },
        },
      });

      expect(button({ color: 'primary', size: 'large' })).toBe(
        'bg-blue text-lg'
      );
    });

    it('should maintain variant declaration order in output', () => {
      const button = variants({
        base: 'btn',
        variants: {
          a: { x: 'a-x' },
          b: { y: 'b-y' },
          c: { z: 'c-z' },
        },
      });

      expect(button({ a: 'x', b: 'y', c: 'z' })).toBe('btn a-x b-y c-z');
    });

    it('should combine base with multiple variants', () => {
      const button = variants({
        base: 'btn rounded',
        variants: {
          color: { primary: 'bg-blue' },
          size: { lg: 'text-lg' },
        },
      });

      expect(button({ color: 'primary', size: 'lg' })).toBe(
        'btn rounded bg-blue text-lg'
      );
    });

    it('should handle many variants', () => {
      const variantsConfig: any = { base: 'base', variants: {} };
      for (let i = 0; i < 20; i++) {
        variantsConfig.variants[`variant${i}`] = {
          a: `class-${i}-a`,
          b: `class-${i}-b`,
        };
      }

      const button = variants(variantsConfig);
      const props: any = {};
      for (let i = 0; i < 20; i++) {
        props[`variant${i}`] = 'a';
      }

      const result = button(props);
      expect(result.split(' ').length).toBe(21); // base + 20 variants
    });
  });

  // ---------------------------------------------------------------------------
  // Boolean Variants
  // ---------------------------------------------------------------------------

  describe('boolean variants', () => {
    it('should handle true/false string keys with boolean props', () => {
      const button = variants({
        variants: {
          disabled: {
            true: 'opacity-50 cursor-not-allowed',
            false: 'opacity-100 cursor-pointer',
          },
        },
      });

      expect(button({ disabled: true })).toBe('opacity-50 cursor-not-allowed');
      expect(button({ disabled: false })).toBe('opacity-100 cursor-pointer');
    });

    it('should default boolean variant to false when not provided', () => {
      const button = variants({
        variants: {
          disabled: {
            true: 'opacity-50',
            false: 'opacity-100',
          },
        },
      });

      expect(button()).toBe('opacity-100');
      expect(button({})).toBe('opacity-100');
    });

    it('should handle boolean variant with only true key', () => {
      const button = variants({
        variants: {
          active: { true: 'is-active' },
        },
      });

      expect(button({ active: true })).toBe('is-active');
      expect(button({ active: false })).toBe('');
      expect(button()).toBe('');
    });

    it('should handle boolean variant with only false key', () => {
      const button = variants({
        variants: {
          hidden: { false: 'is-visible' },
        },
      });

      expect(button({ hidden: false })).toBe('is-visible');
      expect(button({ hidden: true })).toBe('');
      expect(button()).toBe('is-visible');
    });

    it('should combine boolean and non-boolean variants', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
          disabled: {
            true: 'opacity-50',
            false: 'opacity-100',
          },
        },
      });

      expect(button({ color: 'primary' })).toBe('btn bg-blue opacity-100');
      expect(button({ color: 'primary', disabled: true })).toBe(
        'btn bg-blue opacity-50'
      );
    });

    it('should handle multiple boolean variants', () => {
      const button = variants({
        base: 'btn',
        variants: {
          disabled: {
            true: 'opacity-50',
            false: 'opacity-100',
          },
          loading: {
            true: 'cursor-wait',
            false: 'cursor-pointer',
          },
        },
      });

      expect(button({ disabled: true, loading: true })).toBe(
        'btn opacity-50 cursor-wait'
      );
      expect(button()).toBe('btn opacity-100 cursor-pointer');
    });
  });

  // ---------------------------------------------------------------------------
  // Default Variants
  // ---------------------------------------------------------------------------

  describe('default variants', () => {
    it('should apply default variant when not specified', () => {
      const button = variants({
        variants: {
          color: {
            primary: 'bg-blue',
            secondary: 'bg-gray',
          },
        },
        defaultVariants: {
          color: 'primary',
        },
      });

      expect(button()).toBe('bg-blue');
      expect(button({})).toBe('bg-blue');
    });

    it('should override default with explicit value', () => {
      const button = variants({
        variants: {
          color: {
            primary: 'bg-blue',
            secondary: 'bg-gray',
          },
        },
        defaultVariants: {
          color: 'primary',
        },
      });

      expect(button({ color: 'secondary' })).toBe('bg-gray');
    });

    it('should apply multiple defaults', () => {
      const button = variants({
        variants: {
          color: { primary: 'bg-blue', secondary: 'bg-gray' },
          size: { sm: 'text-sm', lg: 'text-lg' },
        },
        defaultVariants: {
          color: 'primary',
          size: 'sm',
        },
      });

      expect(button()).toBe('bg-blue text-sm');
    });

    it('should allow partial override of defaults', () => {
      const button = variants({
        variants: {
          color: { primary: 'bg-blue', secondary: 'bg-gray' },
          size: { sm: 'text-sm', lg: 'text-lg' },
        },
        defaultVariants: {
          color: 'primary',
          size: 'sm',
        },
      });

      expect(button({ size: 'lg' })).toBe('bg-blue text-lg');
    });

    it('should handle default for boolean variant', () => {
      const button = variants({
        variants: {
          disabled: {
            true: 'opacity-50',
            false: 'opacity-100',
          },
        },
        defaultVariants: {
          disabled: true,
        },
      });

      expect(button()).toBe('opacity-50');
      expect(button({ disabled: false })).toBe('opacity-100');
    });

    it('should handle undefined in defaultVariants', () => {
      const button = variants({
        variants: {
          color: { primary: 'bg-blue' },
        },
        defaultVariants: {
          color: undefined,
        },
      });

      expect(button({ color: 'primary' })).toBe('bg-blue');
    });

    it('should fallback to default when explicit undefined is passed', () => {
      const button = variants({
        variants: {
          color: { primary: 'bg-blue', secondary: 'bg-gray' },
        },
        defaultVariants: {
          color: 'primary',
        },
      });

      expect(button({ color: undefined })).toBe('bg-blue');
    });

    it('should work with empty defaultVariants object', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
        defaultVariants: {},
      });

      expect(button({ color: 'primary' })).toBe('btn bg-blue');
    });
  });

  // ---------------------------------------------------------------------------
  // Compound Variants
  // ---------------------------------------------------------------------------

  describe('compound variants', () => {
    it('should apply compound variant when all conditions match', () => {
      const button = variants({
        variants: {
          color: { primary: 'bg-blue', secondary: 'bg-gray' },
          size: { sm: 'text-sm', lg: 'text-lg' },
        },
        compoundVariants: [
          {
            variants: { color: 'primary', size: 'lg' },
            className: 'font-bold',
          },
        ],
      });

      expect(button({ color: 'primary', size: 'lg' })).toBe(
        'bg-blue text-lg font-bold'
      );
    });

    it('should not apply compound variant when conditions do not match', () => {
      const button = variants({
        variants: {
          color: { primary: 'bg-blue', secondary: 'bg-gray' },
          size: { sm: 'text-sm', lg: 'text-lg' },
        },
        compoundVariants: [
          {
            variants: { color: 'primary', size: 'lg' },
            className: 'font-bold',
          },
        ],
      });

      expect(button({ color: 'primary', size: 'sm' })).toBe('bg-blue text-sm');
      expect(button({ color: 'secondary', size: 'lg' })).toBe(
        'bg-gray text-lg'
      );
    });

    it('should apply multiple compound variants when matching', () => {
      const button = variants({
        variants: {
          color: { primary: 'bg-blue' },
          size: { lg: 'text-lg' },
        },
        compoundVariants: [
          {
            variants: { color: 'primary' },
            className: 'border-blue',
          },
          {
            variants: { size: 'lg' },
            className: 'p-4',
          },
          {
            variants: { color: 'primary', size: 'lg' },
            className: 'shadow-lg',
          },
        ],
      });

      const result = button({ color: 'primary', size: 'lg' });
      expect(result).toContain('border-blue');
      expect(result).toContain('p-4');
      expect(result).toContain('shadow-lg');
    });

    it('should support array matching in compound variants', () => {
      const button = variants({
        variants: {
          color: { primary: 'bg-blue', secondary: 'bg-gray', danger: 'bg-red' },
          size: { sm: 'text-sm' },
        },
        compoundVariants: [
          {
            variants: {
              color: ['primary', 'secondary'],
              size: 'sm',
            },
            className: 'special',
          },
        ],
      });

      expect(button({ color: 'primary', size: 'sm' })).toContain('special');
      expect(button({ color: 'secondary', size: 'sm' })).toContain('special');
      expect(button({ color: 'danger', size: 'sm' })).not.toContain('special');
    });

    it('should handle compound variant with single-item array', () => {
      const button = variants({
        variants: {
          color: { primary: 'bg-blue', secondary: 'bg-gray' },
        },
        compoundVariants: [
          {
            variants: { color: ['primary'] },
            className: 'special',
          },
        ],
      });

      expect(button({ color: 'primary' })).toContain('special');
      expect(button({ color: 'secondary' })).not.toContain('special');
    });

    it('should handle compound variant with boolean variants', () => {
      const button = variants({
        variants: {
          color: { primary: 'bg-blue' },
          disabled: { true: 'opacity-50', false: 'opacity-100' },
        },
        compoundVariants: [
          {
            variants: { color: 'primary', disabled: true },
            className: 'cursor-not-allowed',
          },
        ],
      });

      expect(button({ color: 'primary', disabled: true })).toContain(
        'cursor-not-allowed'
      );
      expect(button({ color: 'primary', disabled: false })).not.toContain(
        'cursor-not-allowed'
      );
    });

    it('should apply compound variant with array className', () => {
      const button = variants({
        variants: {
          color: { primary: 'bg-blue' },
          size: { lg: 'text-lg' },
        },
        compoundVariants: [
          {
            variants: { color: 'primary', size: 'lg' },
            className: ['font-bold', 'shadow-lg'],
          },
        ],
      });

      const result = button({ color: 'primary', size: 'lg' });
      expect(result).toContain('font-bold');
      expect(result).toContain('shadow-lg');
    });

    it('should handle compound variant with null className', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
        compoundVariants: [
          {
            variants: { color: 'primary' },
            className: null,
          },
        ],
      });

      expect(button({ color: 'primary' })).toBe('btn bg-blue');
    });

    it('should handle empty compound variants array', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
        compoundVariants: [],
      });

      expect(button({ color: 'primary' })).toBe('btn bg-blue');
    });

    it('should work with defaultVariants', () => {
      const button = variants({
        variants: {
          color: { primary: 'bg-blue', secondary: 'bg-gray' },
          size: { sm: 'text-sm', lg: 'text-lg' },
        },
        defaultVariants: {
          color: 'primary',
          size: 'lg',
        },
        compoundVariants: [
          {
            variants: { color: 'primary', size: 'lg' },
            className: 'font-bold',
          },
        ],
      });

      expect(button()).toContain('font-bold');
    });

    it('should handle many compound variants', () => {
      const button = variants({
        variants: {
          color: { primary: 'bg-blue' },
        },
        compoundVariants: Array.from({ length: 50 }, (_, i) => ({
          variants: { color: 'primary' as const },
          className: `compound-${i}`,
        })),
      });

      const result = button({ color: 'primary' });
      expect(result).toContain('compound-0');
      expect(result).toContain('compound-49');
    });

    it('should handle partial compound variant conditions', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
          size: { large: 'text-lg' },
          rounded: { true: 'rounded', false: '' },
        },
        compoundVariants: [
          {
            variants: { color: 'primary' },
            className: 'shadow',
          },
        ],
      });

      expect(button({ color: 'primary', size: 'large' })).toBe(
        'btn bg-blue text-lg shadow'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // className Prop
  // ---------------------------------------------------------------------------

  describe('className prop', () => {
    it('should append user className at the end', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
      });

      expect(button({ color: 'primary', className: 'custom' })).toBe(
        'btn bg-blue custom'
      );
    });

    it('should handle array className', () => {
      const button = variants({ base: 'btn' });
      expect(button({ className: ['a', 'b', 'c'] })).toBe('btn a b c');
    });

    it('should handle nested array className', () => {
      const button = variants({ base: 'btn' });
      expect(button({ className: [['a', 'b'], ['c']] })).toBe('btn a b c');
    });

    it('should filter null/undefined from className', () => {
      const button = variants({ base: 'btn' });
      expect(button({ className: ['a', null, undefined, 'b'] })).toBe(
        'btn a b'
      );
    });

    it('should handle empty string className', () => {
      const button = variants({ base: 'btn' });
      expect(button({ className: '' })).toBe('btn');
    });

    it('should handle null className', () => {
      const button = variants({ base: 'btn' });
      expect(button({ className: null })).toBe('btn');
    });

    it('should handle undefined className', () => {
      const button = variants({ base: 'btn' });
      expect(button({ className: undefined })).toBe('btn');
    });

    it('should merge className with onClassesMerged', () => {
      const { variants } = defineConfig({
        onClassesMerged: (cls) => cls.replace(/\s+/g, '-'),
      });
      const button = variants({ base: 'btn rounded' });
      expect(button({ className: 'custom' })).toBe('btn-rounded-custom');
    });
  });

  // ---------------------------------------------------------------------------
  // Class Resolution Order
  // ---------------------------------------------------------------------------

  describe('class resolution order', () => {
    it('should resolve in order: base -> variants -> compoundVariants -> className', () => {
      const button = variants({
        base: 'base',
        variants: {
          color: { primary: 'variant' },
        },
        compoundVariants: [
          {
            variants: { color: 'primary' },
            className: 'compound',
          },
        ],
      });

      expect(button({ color: 'primary', className: 'user' })).toBe(
        'base variant compound user'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Special Characters in Variants
  // ---------------------------------------------------------------------------

  describe('variant with special characters', () => {
    it('should handle variant names with hyphens', () => {
      const button = variants({
        variants: {
          'data-size': {
            small: 'text-sm',
            large: 'text-lg',
          },
        } as any,
      });

      expect(button({ 'data-size': 'small' } as any)).toBe('text-sm');
    });

    it('should handle variant values with spaces', () => {
      const button = variants({
        variants: {
          theme: {
            'light mode': 'bg-white text-black',
            'dark mode': 'bg-black text-white',
          },
        },
      });

      expect(button({ theme: 'light mode' })).toBe('bg-white text-black');
    });

    it('should handle numeric string variant keys', () => {
      const button = variants({
        variants: {
          level: {
            '1': 'level-1',
            '2': 'level-2',
            '100': 'level-100',
          },
        },
      });

      expect(button({ level: '1' })).toBe('level-1');
      expect(button({ level: '100' })).toBe('level-100');
    });

    it('should handle empty string variant key', () => {
      const button = variants({
        variants: {
          color: {
            '': 'no-color',
            primary: 'bg-blue',
          },
        },
      });

      expect(button({ color: '' })).toBe('no-color');
    });
  });

  // ---------------------------------------------------------------------------
  // Performance Edge Cases
  // ---------------------------------------------------------------------------

  describe('performance edge cases', () => {
    it('should handle many variants efficiently', () => {
      const variantsConfig: any = { base: 'base', variants: {} };
      for (let i = 0; i < 50; i++) {
        variantsConfig.variants[`variant${i}`] = {
          a: `class-${i}-a`,
          b: `class-${i}-b`,
        };
      }

      const button = variants(variantsConfig);
      const props: any = {};
      for (let i = 0; i < 50; i++) {
        props[`variant${i}`] = 'a';
      }

      const result = button(props);
      expect(result.split(' ').length).toBeGreaterThan(50);
    });

    it('should handle calling resolver many times', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
      });

      for (let i = 0; i < 1000; i++) {
        const result = button({ color: 'primary' });
        expect(result).toBe('btn bg-blue');
      }
    });

    it('should handle creating many resolvers', () => {
      const resolvers = Array.from({ length: 100 }, (_, i) =>
        variants({
          base: `base-${i}`,
          variants: {
            color: { primary: `color-${i}` },
          },
        })
      );

      expect(resolvers).toHaveLength(100);
      expect(resolvers[50]({ color: 'primary' })).toBe('base-50 color-50');
    });
  });
});

// =============================================================================
// variantPropsResolver() Tests
// =============================================================================

describe('variantPropsResolver()', () => {
  const { variantPropsResolver } = defineConfig();

  describe('basic functionality', () => {
    it('should resolve className and remove variant props', () => {
      const resolve = variantPropsResolver({
        variants: {
          color: { primary: 'bg-blue' },
        },
      });

      const result = resolve({ color: 'primary', id: 'btn' });
      expect(result.className).toBe('bg-blue');
      expect(result.id).toBe('btn');
      expect(result).not.toHaveProperty('color');
    });

    it('should preserve non-variant props', () => {
      const resolve = variantPropsResolver({
        variants: {
          color: { primary: 'bg-blue' },
        },
      });

      const onClick = () => {};
      const result = resolve({
        color: 'primary',
        id: 'test',
        'data-testid': 'button',
        onClick,
      });

      expect(result.id).toBe('test');
      expect(result['data-testid']).toBe('button');
      expect(result.onClick).toBe(onClick);
    });

    it('should handle empty config', () => {
      const resolve = variantPropsResolver({});
      const result = resolve({ className: 'custom', id: 'test' });
      expect(result.className).toBe('custom');
      expect(result.id).toBe('test');
    });

    it('should merge base with variant classNames', () => {
      const resolve = variantPropsResolver({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
      });

      const result = resolve({ color: 'primary' });
      expect(result.className).toBe('btn bg-blue');
    });

    it('should include user className', () => {
      const resolve = variantPropsResolver({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
      });

      const result = resolve({ color: 'primary', className: 'custom' });
      expect(result.className).toBe('btn bg-blue custom');
    });
  });

  describe('forwardProps option', () => {
    it('should forward specified variant props', () => {
      const resolve = variantPropsResolver({
        variants: {
          color: { primary: 'bg-blue' },
          size: { lg: 'text-lg' },
        },
        forwardProps: ['size'],
      });

      const result = resolve({ color: 'primary', size: 'lg' });
      expect(result.className).toBe('bg-blue text-lg');
      expect(result).not.toHaveProperty('color');
      expect(result).toHaveProperty('size', 'lg');
    });

    it('should forward multiple props', () => {
      const resolve = variantPropsResolver({
        variants: {
          color: { primary: 'bg-blue' },
          size: { lg: 'text-lg' },
          disabled: { true: 'opacity-50', false: '' },
        },
        forwardProps: ['size', 'disabled'],
      });

      const result = resolve({ color: 'primary', size: 'lg', disabled: true });
      expect(result).not.toHaveProperty('color');
      expect(result).toHaveProperty('size', 'lg');
      expect(result).toHaveProperty('disabled', true);
    });

    it('should handle empty forwardProps array', () => {
      const resolve = variantPropsResolver({
        variants: {
          color: { primary: 'bg-blue' },
        },
        forwardProps: [],
      });

      const result = resolve({ color: 'primary' });
      expect(result).not.toHaveProperty('color');
    });

    it('should handle forwardProps with non-existent variant', () => {
      const resolve = variantPropsResolver({
        variants: {
          color: { primary: 'bg-blue' },
        },
        forwardProps: ['nonExistent' as any],
      });

      const result = resolve({ color: 'primary' });
      expect(result).not.toHaveProperty('nonExistent');
    });
  });

  describe('edge cases', () => {
    it('should handle config without variants', () => {
      const resolve = variantPropsResolver({ base: 'btn' });
      const onClick = () => {};
      const result = resolve({ onClick, className: 'custom' });

      expect(result).toEqual({
        className: 'btn custom',
        onClick,
      });
    });

    it('should handle empty props with defaultVariants', () => {
      const resolve = variantPropsResolver({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
        defaultVariants: {
          color: 'primary',
        },
      });

      const result = resolve({} as any);
      expect(result).toEqual({ className: 'btn bg-blue' });
    });

    it('should handle props with undefined variant values', () => {
      const resolve = variantPropsResolver({
        variants: {
          color: { primary: 'bg-blue', secondary: 'bg-gray' },
        },
      });

      const result = resolve({ color: undefined, id: 'test' } as any);
      expect(result.className).toBe('');
      expect(result.id).toBe('test');
    });

    it('should work with boolean variants', () => {
      const resolve = variantPropsResolver({
        variants: {
          disabled: {
            true: 'opacity-50',
            false: 'opacity-100',
          },
        },
      });

      expect(resolve({ disabled: true } as any).className).toBe('opacity-50');
      expect(resolve({ disabled: false } as any).className).toBe('opacity-100');
    });

    it('should handle withoutRenderProp option', () => {
      const resolve = variantPropsResolver({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
        withoutRenderProp: true,
      });

      const onClick = () => {};
      const result = resolve({ color: 'primary', onClick } as any);

      expect(result).toEqual({
        className: 'btn bg-blue',
        onClick,
      });
    });
  });
});
