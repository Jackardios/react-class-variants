import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement, createRef } from 'react';
import { defineConfig } from '../src/index';

describe('Edge Cases and Complex Scenarios', () => {
  describe('ClassNameValue edge cases', () => {
    const { variants } = defineConfig();

    it('should handle extremely deeply nested arrays', () => {
      const component = variants({
        base: [[[[[['deeply', 'nested']]]]]] as any,
      });
      expect(component()).toBe('deeply nested');
    });

    it('should handle mixed null/undefined/string in nested arrays', () => {
      const component = variants({
        base: [
          'a',
          [null, 'b', [undefined, 'c', [null, undefined, 'd']]],
          undefined,
        ],
      });
      expect(component()).toBe('a b c d');
    });

    it('should handle empty strings in arrays', () => {
      const component = variants({
        base: ['', 'valid', '', null, 'another', ''],
      });
      expect(component()).toBe('valid another');
    });

    it('should handle arrays with only null/undefined', () => {
      const component = variants({
        base: [[null], [undefined], [null, undefined]],
        variants: {
          color: {
            primary: [null, undefined, null],
          },
        },
      });
      expect(component({ color: 'primary' })).toBe('');
    });

    it('should handle whitespace-only strings', () => {
      const component = variants({
        base: '   ',
      });
      expect(component()).toBe('   ');
    });

    it('should handle very long class strings', () => {
      const longClass = 'a'.repeat(10000);
      const component = variants({
        base: longClass,
      });
      expect(component()).toBe(longClass);
    });
  });

  describe('Variant key edge cases', () => {
    const { variants } = defineConfig();

    it('should handle variant names with special characters', () => {
      const component = variants({
        variants: {
          'data-size': {
            small: 'text-sm',
            large: 'text-lg',
          },
        } as any,
      });
      expect(component({ 'data-size': 'small' } as any)).toBe('text-sm');
    });

    it('should handle variant values with spaces', () => {
      const component = variants({
        variants: {
          color: {
            'primary light': 'bg-blue-100',
            'primary dark': 'bg-blue-900',
          },
        },
      });
      expect(component({ color: 'primary light' })).toBe('bg-blue-100');
    });

    it('should handle empty string as variant value', () => {
      const component = variants({
        variants: {
          color: {
            '': 'no-color',
            primary: 'bg-blue',
          },
        },
      });
      expect(component({ color: '' })).toBe('no-color');
    });

    it('should handle numeric-looking string variant keys', () => {
      const component = variants({
        variants: {
          level: {
            '1': 'level-1',
            '2': 'level-2',
            '100': 'level-100',
          },
        },
      });
      expect(component({ level: '100' })).toBe('level-100');
    });
  });

  describe('Complex compound variants', () => {
    const { variants } = defineConfig();

    it('should handle multiple compound variants with overlapping conditions', () => {
      const component = variants({
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
          rounded: {
            true: 'rounded',
            false: 'square',
          },
        },
        compoundVariants: [
          {
            variants: { color: 'primary', size: 'large' },
            className: 'shadow-lg',
          },
          {
            variants: { color: 'primary' },
            className: 'border-blue',
          },
          {
            variants: { size: 'large', rounded: true },
            className: 'p-4',
          },
          {
            variants: { color: 'primary', size: 'large', rounded: true },
            className: 'font-bold',
          },
        ],
      });

      const result = component({
        color: 'primary',
        size: 'large',
        rounded: true,
      });
      expect(result).toContain('shadow-lg');
      expect(result).toContain('border-blue');
      expect(result).toContain('p-4');
      expect(result).toContain('font-bold');
    });

    it('should handle compound variant with array containing all variant values', () => {
      const component = variants({
        variants: {
          color: {
            red: 'text-red',
            blue: 'text-blue',
            green: 'text-green',
          },
          size: {
            small: 'text-sm',
          },
        },
        compoundVariants: [
          {
            variants: {
              color: ['red', 'blue', 'green'],
              size: 'small',
            },
            className: 'uppercase',
          },
        ],
      });

      expect(component({ color: 'red', size: 'small' })).toContain('uppercase');
      expect(component({ color: 'blue', size: 'small' })).toContain(
        'uppercase'
      );
      expect(component({ color: 'green', size: 'small' })).toContain(
        'uppercase'
      );
    });

    it('should handle compound variant with single-item array', () => {
      const component = variants({
        variants: {
          color: {
            primary: 'bg-blue',
            secondary: 'bg-gray',
          },
        },
        compoundVariants: [
          {
            variants: {
              color: ['primary'],
            },
            className: 'special',
          },
        ],
      });

      expect(component({ color: 'primary' })).toContain('special');
      expect(component({ color: 'secondary' })).not.toContain('special');
    });

    it('should handle compound variant with empty conditions', () => {
      const component = variants({
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
          },
        },
        compoundVariants: [
          {
            variants: {},
            className: 'always-applied',
          } as any,
        ],
      });

      expect(component({ color: 'primary' })).toContain('always-applied');
    });
  });

  describe('Default variants edge cases', () => {
    const { variants } = defineConfig();

    it('should handle undefined in defaultVariants', () => {
      const component = variants({
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
          size: undefined,
        },
      });

      // @ts-expect-error - Testing edge case: size is required but has undefined default
      expect(component()).toBe('bg-blue');
    });

    it('should override default with explicit undefined', () => {
      const component = variants({
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

      // When explicitly passing undefined, it falls back to default
      // because the condition is: props?.[name] ?? defaultVariants?.[name]
      expect(component({ color: undefined })).toBe('bg-blue');
    });

    it('should handle boolean variant defaults', () => {
      const component = variants({
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

      expect(component()).toBe('opacity-50');
      expect(component({ disabled: false })).toBe('opacity-100');
    });
  });

  describe('onClassesMerged edge cases', () => {
    it('should handle onClassesMerged throwing error', () => {
      const { variants } = defineConfig({
        onClassesMerged: () => {
          throw new Error('Merge failed');
        },
      });

      const component = variants({
        base: 'btn',
      });

      expect(() => component()).toThrow('Merge failed');
    });

    it('should handle onClassesMerged returning empty string', () => {
      const { variants } = defineConfig({
        onClassesMerged: () => '',
      });

      const component = variants({
        base: 'btn bg-blue text-white',
      });

      expect(component()).toBe('');
    });

    it('should handle onClassesMerged with very long input', () => {
      const { variants } = defineConfig({
        onClassesMerged: cls => cls.split(' ').reverse().join(' '),
      });

      const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`);
      const component = variants({
        base: classes,
      });

      const result = component();
      expect(result.split(' ')).toHaveLength(100);
      expect(result.startsWith('class-99')).toBe(true);
    });

    it('should handle onClassesMerged with special characters', () => {
      const { variants } = defineConfig({
        onClassesMerged: cls => cls.replace(/[^a-z\s-]/gi, ''),
      });

      const component = variants({
        base: 'btn!@# bg-blue$%^ text-white&*()',
      });

      expect(component()).toBe('btn bg-blue text-white');
    });
  });

  describe('Component render edge cases', () => {
    const { variantComponent } = defineConfig();

    it('should handle component with no base and no variants', () => {
      const Component = variantComponent('div', {});

      render(createElement(Component, {}, 'Content'));
      const div = screen.getByText('Content');

      expect(div).toBeInTheDocument();
      expect(div.className).toBe('');
    });

    it('should handle very large number of variants', () => {
      const variantConfig: any = {
        base: 'base',
        variants: {},
      };

      // Create 50 variants
      for (let i = 0; i < 50; i++) {
        variantConfig.variants[`variant${i}`] = {
          a: `class-${i}-a`,
          b: `class-${i}-b`,
        };
      }

      const Component = variantComponent('div', variantConfig);

      const props: any = { children: 'Test' };
      for (let i = 0; i < 50; i++) {
        props[`variant${i}`] = 'a';
      }

      render(createElement(Component, props));
      const div = screen.getByText('Test');

      expect(div.className.split(' ').length).toBeGreaterThan(50);
    });

    it('should handle rapid ref changes', () => {
      const Component = variantComponent('div', { base: 'test' });

      const ref1 = createRef<HTMLDivElement>();
      const ref2 = createRef<HTMLDivElement>();

      const { rerender } = render(
        createElement(Component, { ref: ref1 }, 'Content')
      );

      expect(ref1.current).toBeInstanceOf(HTMLDivElement);

      rerender(createElement(Component, { ref: ref2 }, 'Content'));

      expect(ref2.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should handle render prop switching between element and function', () => {
      const Component = variantComponent('button', { base: 'btn' });

      const { rerender } = render(
        createElement(
          Component,
          { render: createElement('a', { href: '/' }) },
          'Link'
        )
      );

      let element = screen.getByText('Link');
      expect(element.tagName).toBe('A');

      rerender(
        createElement(
          Component,
          { render: (props: any) => createElement('span', props) },
          'Span'
        )
      );

      element = screen.getByText('Span');
      expect(element.tagName).toBe('SPAN');
    });

    it('should handle className as deeply nested array in component', () => {
      const Component = variantComponent('div', { base: 'base' });

      render(
        createElement(
          Component,
          { className: [['a', 'b'], [['c', 'd']]] as any },
          'Nested'
        )
      );

      const div = screen.getByText('Nested');
      expect(div).toHaveClass('base', 'a', 'b', 'c', 'd');
    });
  });

  describe('Type coercion edge cases', () => {
    const { variants } = defineConfig();

    it('should handle boolean true/false as variant values', () => {
      const component = variants({
        variants: {
          active: {
            true: 'bg-blue',
            false: 'bg-gray',
          },
        },
      });

      expect(component({ active: true })).toBe('bg-blue');
      expect(component({ active: false })).toBe('bg-gray');
    });

    it('should handle number-like variant selections', () => {
      const component = variants({
        variants: {
          priority: {
            '0': 'priority-low',
            '1': 'priority-medium',
            '2': 'priority-high',
          },
        },
      });

      expect(component({ priority: '0' })).toBe('priority-low');
      expect(component({ priority: '2' })).toBe('priority-high');
    });
  });

  describe('forwardProps edge cases', () => {
    const { variantComponent } = defineConfig();

    it('should handle forwardProps with non-existent variant', () => {
      const Component = variantComponent('button', {
        variants: {
          color: { primary: 'bg-blue' },
        },
        forwardProps: ['nonExistent' as any],
      });

      render(createElement(Component, { color: 'primary' }, 'Test'));

      const button = screen.getByText('Test');
      expect(button).not.toHaveAttribute('nonExistent');
    });

    it('should forward all variants when forwardProps contains all variant names', () => {
      const Component = variantComponent('button', {
        variants: {
          color: { primary: 'bg-blue' },
          size: { large: 'text-lg' },
        },
        forwardProps: ['color', 'size'],
      });

      render(
        createElement(Component, { color: 'primary', size: 'large' }, 'Test')
      );

      const button = screen.getByText('Test');
      // forwardProps keeps props in resolved object but doesn't create DOM attributes
      // The className should be correctly resolved
      expect(button).toHaveClass('bg-blue', 'text-lg');
    });
  });

  describe('Memory and performance edge cases', () => {
    const { variants } = defineConfig();

    it('should handle creating many variant resolvers', () => {
      const resolvers = Array.from({ length: 1000 }, (_, i) =>
        variants({
          base: `base-${i}`,
          variants: {
            color: {
              primary: `color-${i}`,
            },
          },
        })
      );

      expect(resolvers).toHaveLength(1000);
      expect(resolvers[500]({ color: 'primary' })).toBe('base-500 color-500');
    });

    it('should handle calling variant resolver many times', () => {
      const component = variants({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
      });

      for (let i = 0; i < 10000; i++) {
        const result = component({ color: 'primary' });
        expect(result).toBe('btn bg-blue');
      }
    });
  });

  describe('Integration edge cases', () => {
    it('should handle all features combined', () => {
      const { variantComponent } = defineConfig({
        onClassesMerged: cls => cls.trim().replace(/\s+/g, ' '),
      });

      const Component = variantComponent('button', {
        base: ['btn', null, 'rounded'],
        variants: {
          color: {
            primary: 'bg-blue',
            secondary: 'bg-gray',
          },
          size: {
            small: 'text-sm',
            large: 'text-lg',
          },
          disabled: {
            true: 'opacity-50',
            false: 'opacity-100',
          },
        },
        defaultVariants: {
          color: 'primary',
          size: 'small',
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
        forwardProps: ['size'],
      });

      render(
        createElement(
          Component,
          {
            size: 'large',
            disabled: true,
            className: '  extra   classes  ',
            onClick: () => {},
          },
          'Complex'
        )
      );

      const button = screen.getByText('Complex');
      expect(button).toHaveClass('btn', 'rounded', 'bg-blue', 'text-lg');
      // forwardProps keeps the prop in resolved props but doesn't create DOM attribute
      // Just verify className is correct
      expect(button.className).toContain('text-lg');
    });
  });
});
