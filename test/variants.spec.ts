import { describe, expect, it } from 'vitest';
import { defineConfig } from '../src/index';

describe('defineConfig', () => {
  it('should return factory functions', () => {
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
    const button = variants({
      base: 'btn',
      variants: {
        color: {
          primary: 'btn-primary',
          secondary: 'btn-secondary',
        },
      },
    });
    expect(button({ color: 'primary' })).toBe('btn btn-primary');
  });

  it('should apply onClassesMerged when provided', () => {
    const { variants } = defineConfig({
      onClassesMerged: (cls) => cls.toUpperCase(),
    });
    const button = variants({
      base: 'btn',
      variants: {
        color: {
          primary: 'btn-primary',
        },
      },
    });
    expect(button({ color: 'primary' })).toBe('BTN BTN-PRIMARY');
  });

  it('should concatenate classes without onClassesMerged', () => {
    const { variants } = defineConfig();
    const button = variants({
      base: 'px-5',
      variants: {
        size: {
          large: 'px-8',
        },
      },
    });
    expect(button({ size: 'large' })).toBe('px-5 px-8');
  });
});

describe('mergeClassNames (via variants)', () => {
  const { variants } = defineConfig();

  it('should flatten nested arrays', () => {
    const component = variants({
      base: [['btn', 'rounded'], 'shadow'],
      variants: {
        color: {
          primary: [['bg-blue', 'text-white']],
        },
      },
    });
    expect(component({ color: 'primary' })).toBe(
      'btn rounded shadow bg-blue text-white'
    );
  });

  it('should filter out null and undefined values', () => {
    const component = variants({
      base: ['btn', null, undefined, 'rounded'],
      variants: {
        color: {
          primary: [null, 'bg-blue', undefined, 'text-white', null],
        },
      },
    });
    expect(component({ color: 'primary' })).toBe('btn rounded bg-blue text-white');
  });

  it('should handle deeply nested arrays', () => {
    const component = variants({
      base: [[[['btn']]], 'rounded'],
    });
    expect(component()).toBe('btn rounded');
  });

  it('should handle empty arrays', () => {
    const component = variants({
      base: [[], 'btn', []],
    });
    expect(component()).toBe('btn');
  });

  it('should handle all null/undefined values', () => {
    const component = variants({
      base: [null, undefined, null],
    });
    expect(component()).toBe('');
  });
});

describe('variants function', () => {
  const { variants } = defineConfig();

  describe('base classes', () => {
    it('should return base classes only when no variants', () => {
      const component = variants({
        base: 'btn rounded',
      });
      expect(component()).toBe('btn rounded');
    });

    it('should work with base as array', () => {
      const component = variants({
        base: ['btn', 'rounded', 'shadow'],
      });
      expect(component()).toBe('btn rounded shadow');
    });

    it('should work without base', () => {
      const component = variants({
        variants: {
          color: {
            primary: 'bg-blue',
          },
        },
      });
      expect(component({ color: 'primary' })).toBe('bg-blue');
    });

    it('should handle null base', () => {
      const component = variants({
        base: null,
        variants: {
          color: {
            primary: 'bg-blue',
          },
        },
      });
      expect(component({ color: 'primary' })).toBe('bg-blue');
    });
  });

  describe('single variants', () => {
    it('should apply selected variant', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
            secondary: 'bg-gray',
            danger: 'bg-red',
          },
        },
      });
      expect(button({ color: 'primary' })).toBe('btn bg-blue');
      expect(button({ color: 'secondary' })).toBe('btn bg-gray');
      expect(button({ color: 'danger' })).toBe('btn bg-red');
    });

    it('should handle variant with null value', () => {
      const component = variants({
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
            none: null,
          },
        },
      });
      expect(component({ color: 'none' })).toBe('btn');
    });
  });

  describe('multiple variants', () => {
    it('should apply multiple variants', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
            secondary: 'bg-gray',
          },
          size: {
            small: 'text-sm px-2',
            large: 'text-lg px-6',
          },
        },
      });
      expect(button({ color: 'primary', size: 'small' })).toBe(
        'btn bg-blue text-sm px-2'
      );
      expect(button({ color: 'secondary', size: 'large' })).toBe(
        'btn bg-gray text-lg px-6'
      );
    });

    it('should handle partial variant selection', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
          },
          size: {
            small: 'text-sm',
          },
        },
        defaultVariants: {
          color: 'primary',
          size: 'small',
        },
      });
      expect(button({ color: 'primary' })).toBe('btn bg-blue text-sm');
    });
  });

  describe('defaultVariants', () => {
    it('should apply default variants when not specified', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
            secondary: 'bg-gray',
          },
          size: {
            small: 'text-sm',
            large: 'text-lg',
          },
        },
        defaultVariants: {
          color: 'primary',
          size: 'small',
        },
      });
      expect(button()).toBe('btn bg-blue text-sm');
    });

    it('should override default variants with provided values', () => {
      const button = variants({
        base: 'btn',
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
      expect(button({ color: 'secondary' })).toBe('btn bg-gray');
    });

    it('should handle partial default variants', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
            secondary: 'bg-gray',
          },
          size: {
            small: 'text-sm',
            large: 'text-lg',
          },
        },
        defaultVariants: {
          color: 'primary',
        },
      });
      expect(button({ size: 'large' })).toBe('btn bg-blue text-lg');
    });
  });

  describe('boolean variants', () => {
    it('should treat boolean variants with string keys', () => {
      const button = variants({
        base: 'btn',
        variants: {
          disabled: {
            true: 'opacity-50 cursor-not-allowed',
            false: 'cursor-pointer',
          },
        },
      });
      expect(button({ disabled: true })).toBe('btn opacity-50 cursor-not-allowed');
      expect(button({ disabled: false })).toBe('btn cursor-pointer');
    });

    it('should default boolean variants to false when not provided', () => {
      const button = variants({
        base: 'btn',
        variants: {
          disabled: {
            true: 'opacity-50',
            false: 'opacity-100',
          },
        },
      });
      expect(button()).toBe('btn opacity-100');
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

    it('should handle boolean variant with only true key', () => {
      const button = variants({
        base: 'btn',
        variants: {
          disabled: {
            true: 'opacity-50',
          },
        },
      });
      expect(button({ disabled: true })).toBe('btn opacity-50');
      expect(button()).toBe('btn');
    });

    it('should handle boolean variant with only false key', () => {
      const button = variants({
        base: 'btn',
        variants: {
          enabled: {
            false: 'opacity-50',
          },
        },
      });
      expect(button()).toBe('btn opacity-50');
      expect(button({ enabled: true })).toBe('btn');
    });
  });

  describe('compoundVariants', () => {
    it('should apply compound variant when all conditions match', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
            secondary: 'bg-gray',
          },
          size: {
            small: 'text-sm',
            large: 'text-lg',
          },
        },
        compoundVariants: [
          {
            variants: {
              color: 'primary',
              size: 'large',
            },
            className: 'font-bold',
          },
        ],
      });
      expect(button({ color: 'primary', size: 'large' })).toBe(
        'btn bg-blue text-lg font-bold'
      );
      expect(button({ color: 'primary', size: 'small' })).toBe('btn bg-blue text-sm');
    });

    it('should support array of values in compound variants', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
            secondary: 'bg-purple',
            danger: 'bg-red',
          },
          size: {
            large: 'text-lg',
            small: 'text-sm',
          },
        },
        compoundVariants: [
          {
            variants: {
              color: ['primary', 'secondary'],
              size: 'large',
            },
            className: 'font-bold',
          },
        ],
      });
      expect(button({ color: 'primary', size: 'large' })).toBe(
        'btn bg-blue text-lg font-bold'
      );
      expect(button({ color: 'secondary', size: 'large' })).toBe(
        'btn bg-purple text-lg font-bold'
      );
      expect(button({ color: 'danger', size: 'large' })).toBe('btn bg-red text-lg');
    });

    it('should apply multiple compound variants', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
            danger: 'bg-red',
          },
          size: {
            large: 'text-lg',
            small: 'text-sm',
          },
        },
        compoundVariants: [
          {
            variants: { color: 'primary', size: 'large' },
            className: 'font-bold',
          },
          {
            variants: { color: 'primary', size: 'large' },
            className: 'uppercase',
          },
        ],
      });
      expect(button({ color: 'primary', size: 'large' })).toBe(
        'btn bg-blue text-lg font-bold uppercase'
      );
    });

    it('should not apply compound variant when conditions do not match', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
            secondary: 'bg-gray',
          },
          size: {
            large: 'text-lg',
            small: 'text-sm',
          },
        },
        compoundVariants: [
          {
            variants: { color: 'primary', size: 'large' },
            className: 'font-bold',
          },
        ],
      });
      expect(button({ color: 'secondary', size: 'large' })).toBe(
        'btn bg-gray text-lg'
      );
    });

    it('should work with boolean variants in compound variants', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
          },
          disabled: {
            true: 'opacity-50',
            false: 'opacity-100',
          },
        },
        compoundVariants: [
          {
            variants: { color: 'primary', disabled: true },
            className: 'cursor-not-allowed',
          },
        ],
      });
      expect(button({ color: 'primary', disabled: true })).toBe(
        'btn bg-blue opacity-50 cursor-not-allowed'
      );
    });

    it('should handle partial compound variant conditions', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
          },
          size: {
            large: 'text-lg',
          },
          rounded: {
            true: 'rounded',
          },
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

  describe('className prop override', () => {
    it('should append className prop at the end', () => {
      const button = variants({
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
          },
        },
      });
      expect(button({ color: 'primary', className: 'custom-class' })).toBe(
        'btn bg-blue custom-class'
      );
    });

    it('should handle className prop without variants', () => {
      const component = variants({
        base: 'btn',
      });
      expect(component({ className: 'custom-class' })).toBe('btn custom-class');
    });

    it('should handle className as array', () => {
      const button = variants({
        base: 'btn',
      });
      expect(button({ className: ['custom-1', 'custom-2'] })).toBe(
        'btn custom-1 custom-2'
      );
    });

    it('should merge className with onClassesMerged', () => {
      const { variants } = defineConfig({
        onClassesMerged: (cls) => cls.replace(/\s+/g, '-'),
      });
      const button = variants({
        base: 'btn rounded',
      });
      expect(button({ className: 'custom' })).toBe('btn-rounded-custom');
    });
  });

  describe('config without variants', () => {
    it('should work with only base and className', () => {
      const component = variants({
        base: 'container',
      });
      expect(component({ className: 'mx-auto' })).toBe('container mx-auto');
    });

    it('should work with empty config', () => {
      const component = variants({});
      expect(component()).toBe('');
    });

    it('should work with only className prop', () => {
      const component = variants({});
      expect(component({ className: 'test' })).toBe('test');
    });
  });
});

describe('variantPropsResolver', () => {
  const { variantPropsResolver } = defineConfig();

  it('should separate variant props from other props', () => {
    const resolveProps = variantPropsResolver({
      base: 'btn',
      variants: {
        color: {
          primary: 'bg-blue',
          secondary: 'bg-gray',
        },
      },
    });

    const result = resolveProps({
      color: 'primary',
      onClick: () => {},
      id: 'my-button',
    } as any);

    expect(result).toEqual({
      className: 'btn bg-blue',
      onClick: expect.any(Function),
      id: 'my-button',
    });
    expect(result).not.toHaveProperty('color');
  });

  it('should merge className prop correctly', () => {
    const resolveProps = variantPropsResolver({
      base: 'btn',
      variants: {
        color: {
          primary: 'bg-blue',
        },
      },
    });

    const result = resolveProps({
      color: 'primary',
      className: 'custom-class',
    } as any);

    expect(result.className).toBe('btn bg-blue custom-class');
  });

  it('should preserve non-variant props', () => {
    const resolveProps = variantPropsResolver({
      variants: {
        size: {
          small: 'text-sm',
        },
      },
    });

    const result = resolveProps({
      size: 'small',
      'data-testid': 'button',
      'aria-label': 'Click me',
      disabled: true,
    } as any);

    expect(result).toEqual({
      className: 'text-sm',
      'data-testid': 'button',
      'aria-label': 'Click me',
      disabled: true,
    });
  });

  describe('forwardProps option', () => {
    it('should keep specified variant props in output', () => {
      const resolveProps = variantPropsResolver({
        variants: {
          size: {
            small: 'text-sm',
            large: 'text-lg',
          },
          color: {
            primary: 'bg-blue',
            secondary: 'bg-gray',
          },
        },
        forwardProps: ['size'],
      });

      const result = resolveProps({
        size: 'small',
        color: 'primary',
        id: 'test',
      } as any);

      expect(result).toEqual({
        className: 'text-sm bg-blue',
        size: 'small',
        id: 'test',
      });
      expect(result).not.toHaveProperty('color');
    });

    it('should forward multiple variant props', () => {
      const resolveProps = variantPropsResolver({
        variants: {
          size: { small: 'text-sm' },
          color: { primary: 'bg-blue' },
          rounded: { true: 'rounded' },
        },
        forwardProps: ['size', 'color'],
      });

      const result = resolveProps({
        size: 'small',
        color: 'primary',
        rounded: true,
      } as any);

      expect(result).toEqual({
        className: 'text-sm bg-blue rounded',
        size: 'small',
        color: 'primary',
      });
      expect(result).not.toHaveProperty('rounded');
    });

    it('should work with empty forwardProps array', () => {
      const resolveProps = variantPropsResolver({
        variants: {
          color: { primary: 'bg-blue' },
        },
        forwardProps: [],
      });

      const result = resolveProps({
        color: 'primary',
      } as any);

      expect(result).toEqual({
        className: 'bg-blue',
      });
      expect(result).not.toHaveProperty('color');
    });
  });

  describe('edge cases', () => {
    it('should handle config without variants', () => {
      const resolveProps = variantPropsResolver({
        base: 'btn',
      });

      const result = resolveProps({
        onClick: () => {},
        className: 'custom',
      } as any);

      expect(result).toEqual({
        className: 'btn custom',
        onClick: expect.any(Function),
      });
    });

    it('should handle empty props', () => {
      const resolveProps = variantPropsResolver({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
        defaultVariants: {
          color: 'primary',
        },
      });

      const result = resolveProps({} as any);

      expect(result).toEqual({
        className: 'btn bg-blue',
      });
    });

    it('should handle props with undefined variant values', () => {
      const resolveProps = variantPropsResolver({
        variants: {
          color: {
            primary: 'bg-blue',
            secondary: 'bg-gray',
          },
        },
      });

      const result = resolveProps({
        color: undefined,
        id: 'test',
      } as any);

      expect(result.className).toBe('');
      expect(result.id).toBe('test');
    });

    it('should work with boolean variants', () => {
      const resolveProps = variantPropsResolver({
        variants: {
          disabled: {
            true: 'opacity-50',
            false: 'opacity-100',
          },
        },
      });

      const result1 = resolveProps({ disabled: true } as any);
      expect(result1.className).toBe('opacity-50');

      const result2 = resolveProps({ disabled: false } as any);
      expect(result2.className).toBe('opacity-100');
    });

    it('should handle withoutRenderProp option', () => {
      const resolveProps = variantPropsResolver({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
        withoutRenderProp: true,
      });

      const result = resolveProps({
        color: 'primary',
        onClick: () => {},
      } as any);

      expect(result).toEqual({
        className: 'btn bg-blue',
        onClick: expect.any(Function),
      });
    });
  });
});
