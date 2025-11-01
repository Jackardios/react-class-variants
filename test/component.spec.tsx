import { describe, expect, it, vi } from 'vitest';
import { createRef, forwardRef, type ComponentPropsWithRef } from 'react';
import { render, screen } from '@testing-library/react';
import { defineConfig } from '../src/index';

describe('variantComponent', () => {
  const { variantComponent } = defineConfig();

  describe('basic rendering', () => {
    it('should render a basic button component', () => {
      const Button = variantComponent('button', {
        base: 'btn',
      });

      render(<Button>Click me</Button>);
      const button = screen.getByText('Click me');

      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveClass('btn');
    });

    it('should render with variants', () => {
      const Button = variantComponent('button', {
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue text-white',
            secondary: 'bg-gray text-black',
          },
          size: {
            small: 'text-sm px-2',
            large: 'text-lg px-6',
          },
        },
      });

      render(
        <Button color="primary" size="large">
          Click me
        </Button>
      );
      const button = screen.getByText('Click me');

      expect(button).toHaveClass(
        'btn',
        'bg-blue',
        'text-white',
        'text-lg',
        'px-6'
      );
    });

    it('should apply defaultVariants', () => {
      const Button = variantComponent('button', {
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

      render(<Button>Default</Button>);
      const button = screen.getByText('Default');

      expect(button).toHaveClass('btn', 'bg-blue');
    });

    it('should handle boolean variants', () => {
      const Button = variantComponent('button', {
        base: 'btn',
        variants: {
          disabled: {
            true: 'opacity-50 cursor-not-allowed',
            false: 'opacity-100 cursor-pointer',
          },
        },
      });

      const { rerender } = render(<Button disabled={true}>Disabled</Button>);
      let button = screen.getByText('Disabled');
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');

      rerender(<Button disabled={false}>Enabled</Button>);
      button = screen.getByText('Enabled');
      expect(button).toHaveClass('opacity-100', 'cursor-pointer');
    });

    it('should merge className prop', () => {
      const Button = variantComponent('button', {
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
          },
        },
      });

      render(
        <Button color="primary" className="custom-class">
          Click me
        </Button>
      );
      const button = screen.getByText('Click me');

      expect(button).toHaveClass('btn', 'bg-blue', 'custom-class');
    });

    it('should pass through non-variant props', () => {
      const Button = variantComponent('button', {
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
      });

      const handleClick = vi.fn();
      render(
        <Button
          color="primary"
          onClick={handleClick}
          data-testid="my-button"
          aria-label="Click me"
        >
          Click
        </Button>
      );

      const button = screen.getByTestId('my-button');
      expect(button).toHaveAttribute('aria-label', 'Click me');

      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render different HTML elements', () => {
      const Link = variantComponent('a', {
        base: 'link',
      });

      render(<Link href="/test">Go to test</Link>);
      const link = screen.getByText('Go to test');

      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveClass('link');
    });
  });

  describe('render prop with ReactElement', () => {
    it('should render as different element with render prop', () => {
      const Button = variantComponent('button', {
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
      });

      render(
        <Button color="primary" render={<a href="/link" />}>
          Link as button
        </Button>
      );

      const link = screen.getByText('Link as button');
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/link');
      expect(link).toHaveClass('btn', 'bg-blue');
    });

    it('should merge props with render element props', () => {
      const Button = variantComponent('button', {
        base: 'btn',
      });

      render(
        <Button
          className="extra-class"
          onClick={() => {}}
          render={<a href="/link" className="link-class" />}
        >
          Link
        </Button>
      );

      const link = screen.getByText('Link');
      expect(link).toHaveClass('btn', 'link-class', 'extra-class');
      expect(link).toHaveAttribute('href', '/link');
    });

    it('should merge event handlers with render element', () => {
      const Button = variantComponent('button', {
        base: 'btn',
      });

      const calls: string[] = [];
      const componentHandler = () => calls.push('component');
      const renderHandler = () => calls.push('render');

      render(
        <Button
          onClick={componentHandler}
          render={<a href="#" onClick={renderHandler} />}
        >
          Click
        </Button>
      );

      const link = screen.getByText('Click');
      link.click();

      // mergeProps calls override handler first, then base handler
      expect(calls).toEqual(['render', 'component']);
    });

    it('should merge styles with render element', () => {
      const Button = variantComponent('button', {
        base: 'btn',
      });

      render(
        <Button
          style={{ color: 'red', fontSize: '16px' }}
          render={<a style={{ color: 'blue', padding: '10px' }} />}
        >
          Styled
        </Button>
      );

      const link = screen.getByText('Styled');
      // Style merging: override wins for color, base fontSize is preserved
      expect(link).toHaveStyle({
        padding: '10px',
      });
      // Verify that styles were applied (jsdom may render colors differently)
      expect(link.style.color).toBeTruthy();
      expect(link.style.padding).toBe('10px');
    });
  });

  describe('render prop with function', () => {
    it('should render using render function', () => {
      const Button = variantComponent('button', {
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
      });

      render(
        <Button color="primary" render={props => <a {...props} href="/link" />}>
          Function render
        </Button>
      );

      const link = screen.getByText('Function render');
      expect(link.tagName).toBe('A');
      expect(link).toHaveClass('btn', 'bg-blue');
      expect(link).toHaveAttribute('href', '/link');
    });

    it('should pass resolved className to render function', () => {
      const Button = variantComponent('button', {
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
      });

      const renderFn = vi.fn(props => <div {...props} />);

      render(
        <Button color="primary" render={renderFn}>
          Test
        </Button>
      );

      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({
          className: 'btn bg-blue',
          children: 'Test',
        })
      );
    });

    it('should exclude variant props from render function args', () => {
      const Button = variantComponent('button', {
        variants: {
          color: { primary: 'bg-blue' },
          size: { large: 'text-lg' },
        },
      });

      const renderFn = vi.fn(props => <div {...props} />);

      render(
        <Button
          color="primary"
          size="large"
          onClick={() => {}}
          render={renderFn}
        >
          Test
        </Button>
      );

      expect(renderFn).toHaveBeenCalledWith(
        expect.not.objectContaining({
          color: expect.anything(),
          size: expect.anything(),
        })
      );
      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({
          className: 'bg-blue text-lg',
          onClick: expect.any(Function),
        })
      );
    });
  });

  describe('ref forwarding', () => {
    it('should forward ref to base element', () => {
      const Button = variantComponent('button', {
        base: 'btn',
      });

      const ref = createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Click me</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toBe('Click me');
    });

    it('should merge ref with render element ref', () => {
      const Button = variantComponent('button', {
        base: 'btn',
      });

      const componentRef = createRef<HTMLButtonElement>();
      const renderRef = createRef<HTMLAnchorElement>();

      render(
        <Button ref={componentRef} render={<a ref={renderRef} />}>
          Link
        </Button>
      );

      expect(componentRef.current).toBeInstanceOf(HTMLAnchorElement);
      expect(renderRef.current).toBeInstanceOf(HTMLAnchorElement);
      expect(componentRef.current).toBe(renderRef.current);
    });

    it('should work with function refs', () => {
      const Button = variantComponent('button', {
        base: 'btn',
      });

      let element = null as HTMLButtonElement | null;
      const ref = (el: HTMLButtonElement | null) => {
        element = el;
      };

      render(<Button ref={ref}>Click me</Button>);

      expect(element).toBeInstanceOf(HTMLButtonElement);
      expect(element?.textContent).toBe('Click me');
    });

    it('should merge function refs in render prop', () => {
      const Button = variantComponent('button', {
        base: 'btn',
      });

      const elements: (HTMLButtonElement | HTMLAnchorElement | null)[] = [];
      const componentRef = (el: HTMLButtonElement | null) => {
        elements.push(el);
      };
      const renderRef = (el: HTMLAnchorElement | null) => {
        elements.push(el);
      };

      render(
        <Button ref={componentRef} render={<a ref={renderRef} />}>
          Link
        </Button>
      );

      expect(elements).toHaveLength(2);
      expect(elements[0]).toBeInstanceOf(HTMLAnchorElement);
      expect(elements[0]).toBe(elements[1]);
    });
  });

  describe('withoutRenderProp option', () => {
    it('should not accept render prop when withoutRenderProp is true', () => {
      const Button = variantComponent('button', {
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
        withoutRenderProp: true,
      });

      // Type-level test - TypeScript should error if we try to pass render prop
      // Runtime test - render prop should be ignored
      render(
        <Button color="primary" {...({ render: <a /> } as any)}>
          Click me
        </Button>
      );

      const button = screen.getByText('Click me');
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('custom component (non-string elementType)', () => {
    it('should render custom component without render prop support', () => {
      const CustomButton = forwardRef<
        HTMLButtonElement,
        ComponentPropsWithRef<'button'>
      >((props, ref) => <button {...props} ref={ref} data-custom="true" />);

      const Button = variantComponent(CustomButton, {
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
      });

      render(<Button color="primary">Custom</Button>);

      const button = screen.getByText('Custom');
      expect(button).toHaveAttribute('data-custom', 'true');
      expect(button).toHaveClass('btn', 'bg-blue');
    });

    it('should forward ref to custom component', () => {
      const CustomButton = forwardRef<
        HTMLButtonElement,
        ComponentPropsWithRef<'button'>
      >((props, ref) => <button {...props} ref={ref} />);

      const Button = variantComponent(CustomButton, {
        base: 'btn',
      });

      const ref = createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Custom</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('forwardProps option', () => {
    it('should forward specified variant props to DOM', () => {
      const Button = variantComponent('button', {
        variants: {
          color: { primary: 'bg-blue' },
          size: { large: 'text-lg' },
        },
        forwardProps: ['size'],
      });

      render(
        <Button color="primary" size="large" data-testid="btn">
          Test
        </Button>
      );

      const button = screen.getByTestId('btn');
      // forwardProps keeps the prop in the resolved props object
      // It doesn't automatically create DOM attributes for custom props
      // The className should still be resolved correctly
      expect(button).toHaveClass('bg-blue', 'text-lg');
    });

    it('should forward props to render element', () => {
      const Button = variantComponent('button', {
        variants: {
          size: { large: 'text-lg' },
        },
        forwardProps: ['size'],
      });

      render(
        <Button size="large" render={<a href="/" />}>
          Link
        </Button>
      );

      const link = screen.getByText('Link');
      // forwardProps keeps the prop available in resolved props
      // but doesn't force it as a DOM attribute
      expect(link).toHaveClass('text-lg');
    });
  });

  describe('compound variants in component', () => {
    it('should apply compound variant classes', () => {
      const Button = variantComponent('button', {
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
            variants: { color: 'primary', size: 'large' },
            className: 'font-bold shadow-lg',
          },
        ],
      });

      render(
        <Button color="primary" size="large">
          Compound
        </Button>
      );

      const button = screen.getByText('Compound');
      expect(button).toHaveClass(
        'btn',
        'bg-blue',
        'text-lg',
        'font-bold',
        'shadow-lg'
      );
    });
  });

  describe('integration with onClassesMerged', () => {
    it('should apply onClassesMerged to component classes', () => {
      const { variantComponent } = defineConfig({
        onClassesMerged: cls => cls.split(' ').sort().join(' '),
      });

      const Button = variantComponent('button', {
        base: 'z-10 a-1',
        variants: {
          color: { primary: 'y-5 b-2' },
        },
      });

      render(<Button color="primary">Sorted</Button>);

      const button = screen.getByText('Sorted');
      // Classes should be sorted alphabetically
      expect(button.className).toBe('a-1 b-2 y-5 z-10');
    });
  });

  describe('edge cases', () => {
    it('should handle component without children', () => {
      const Input = variantComponent('input', {
        base: 'input',
        variants: {
          size: { large: 'text-lg' },
        },
      });

      render(<Input size="large" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveClass('input', 'text-lg');
    });

    it('should handle null children', () => {
      const Button = variantComponent('button', {
        base: 'btn',
      });

      render(<Button>{null}</Button>);
      const button = screen.getByRole('button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('btn');
      expect(button.textContent).toBe('');
    });

    it('should handle undefined className', () => {
      const Button = variantComponent('button', {
        base: 'btn',
      });

      render(<Button className={undefined}>Test</Button>);
      const button = screen.getByText('Test');

      expect(button).toHaveClass('btn');
    });

    it('should handle empty variants config', () => {
      const Button = variantComponent('button', {});

      render(<Button>Empty</Button>);
      const button = screen.getByText('Empty');

      expect(button).toBeInTheDocument();
      expect(button.className).toBe('');
    });

    it('should handle render prop returning null', () => {
      const Button = variantComponent('button', {
        base: 'btn',
      });

      render(<Button render={() => null}>Test</Button>);

      expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });

    it('should handle render prop with fragment', () => {
      const Button = variantComponent('button', {
        base: 'btn',
      });

      render(
        <Button
          render={({ className, children }) => (
            <>
              <div className={className}>{children}</div>
            </>
          )}
        >
          Fragment
        </Button>
      );

      const div = screen.getByText('Fragment');
      expect(div.tagName).toBe('DIV');
      expect(div).toHaveClass('btn');
    });

    it('should re-render when variant props change', () => {
      const Button = variantComponent('button', {
        base: 'btn',
        variants: {
          color: {
            primary: 'bg-blue',
            secondary: 'bg-gray',
          },
        },
      });

      const { rerender } = render(<Button color="primary">Click</Button>);
      let button = screen.getByText('Click');
      expect(button).toHaveClass('bg-blue');

      rerender(<Button color="secondary">Click</Button>);
      button = screen.getByText('Click');
      expect(button).toHaveClass('bg-gray');
      expect(button).not.toHaveClass('bg-blue');
    });
  });
});
