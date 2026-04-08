import { bench, describe } from 'vitest';
import { createElement, ReactElement } from 'react';
import { defineConfig } from '../src';

const { variantComponent, variantPropsResolver } = defineConfig();

const SimpleButton = variantComponent('button', {
  base: 'btn px-4 py-2 rounded',
  variants: {
    color: { primary: 'bg-blue-500', secondary: 'bg-gray-500' },
    size: { sm: 'text-sm', md: 'text-base', lg: 'text-lg' },
  },
  defaultVariants: {
    color: 'primary',
    size: 'md',
  },
});

const ComplexButton = variantComponent('button', {
  base: 'btn px-4 py-2 rounded font-medium transition-colors',
  variants: {
    color: {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-500',
      danger: 'bg-red-500',
    },
    size: { sm: 'text-sm h-8', md: 'text-base h-10', lg: 'text-lg h-12' },
    variant: {
      solid: '',
      outline: 'border-2 bg-transparent',
      ghost: 'bg-transparent',
    },
    disabled: { true: 'opacity-50 cursor-not-allowed', false: '' },
  },
  defaultVariants: {
    color: 'primary',
    size: 'md',
    variant: 'solid',
    disabled: false,
  },
  compoundVariants: [
    {
      variants: { color: 'primary', variant: 'outline' },
      className: 'border-blue-500 text-blue-500',
    },
    {
      variants: { color: 'secondary', variant: 'outline' },
      className: 'border-gray-500 text-gray-500',
    },
    {
      variants: { color: 'danger', variant: 'outline' },
      className: 'border-red-500 text-red-500',
    },
  ],
});

const NoRenderPropButton = variantComponent('button', {
  base: 'btn',
  variants: {
    color: { primary: 'bg-blue', secondary: 'bg-gray' },
  },
  withoutRenderProp: true,
});

const resolveButtonProps = variantPropsResolver({
  base: 'btn px-4 py-2',
  variants: {
    color: { primary: 'bg-blue-500', secondary: 'bg-gray-500' },
    size: { sm: 'text-sm', md: 'text-base', lg: 'text-lg' },
  },
  defaultVariants: {
    color: 'primary',
    size: 'md',
  },
});

const resolveWithForwardProps = variantPropsResolver({
  base: 'btn',
  variants: {
    color: { primary: 'bg-blue', secondary: 'bg-gray' },
    size: { sm: 'text-sm', lg: 'text-lg' },
  },
  forwardProps: ['size'],
});

describe('variantComponent()', () => {
  describe('element creation', () => {
    bench('simple component with defaults', () => {
      createElement(SimpleButton, { children: 'Click' });
    });

    bench('simple component with props', () => {
      createElement(SimpleButton, {
        color: 'secondary',
        size: 'lg',
        children: 'Click',
      });
    });

    bench('complex component with defaults', () => {
      createElement(ComplexButton, { children: 'Click' });
    });

    bench('complex component with props', () => {
      createElement(ComplexButton, {
        color: 'danger',
        size: 'lg',
        variant: 'outline',
        children: 'Click',
      });
    });

    bench('component without render prop', () => {
      createElement(NoRenderPropButton, {
        color: 'primary',
        children: 'Click',
      });
    });
  });

  describe('render prop', () => {
    // Pre-create elements to avoid measuring element creation overhead
    const linkElement = createElement('a', { href: '/' });
    const renderFn = (props: Record<string, unknown>) =>
      createElement('a', { ...props, href: '/' });

    bench('render prop with element', () => {
      createElement(SimpleButton, {
        render: linkElement,
        children: 'Link',
      });
    });

    bench('render prop with function', () => {
      createElement(SimpleButton, {
        render: renderFn as unknown as ReactElement,
        children: 'Link',
      });
    });

    bench('render prop element with variant props', () => {
      createElement(ComplexButton, {
        render: linkElement,
        color: 'danger',
        size: 'lg',
        variant: 'outline',
        children: 'Link',
      });
    });

    bench('render prop function with variant props', () => {
      createElement(ComplexButton, {
        render: renderFn as unknown as ReactElement,
        color: 'danger',
        size: 'lg',
        variant: 'outline',
        children: 'Link',
      });
    });
  });
});

describe('variantPropsResolver()', () => {
  bench('resolve with defaults', () => {
    resolveButtonProps({});
  });

  bench('resolve with props', () => {
    resolveButtonProps({ color: 'secondary', size: 'lg' });
  });

  bench('resolve with className', () => {
    resolveButtonProps({ color: 'primary', className: 'extra-class' });
  });

  bench('resolve with extra props', () => {
    resolveButtonProps({
      color: 'secondary',
      size: 'sm',
      onClick: () => {},
      'aria-label': 'Button',
    });
  });

  bench('resolve with forwardProps', () => {
    resolveWithForwardProps({ color: 'primary', size: 'lg' });
  });
});

describe('variantComponent() creation', () => {
  bench('create simple component', () => {
    variantComponent('button', {
      base: 'btn',
      variants: {
        color: { primary: 'bg-blue', secondary: 'bg-gray' },
      },
    });
  });

  bench('create complex component', () => {
    variantComponent('button', {
      base: 'btn px-4 py-2',
      variants: {
        color: { primary: 'bg-blue', secondary: 'bg-gray', danger: 'bg-red' },
        size: { sm: 'text-sm', md: 'text-md', lg: 'text-lg' },
        variant: { solid: '', outline: 'border' },
      },
      defaultVariants: {
        color: 'primary',
        size: 'md',
        variant: 'solid',
      },
      compoundVariants: [
        {
          variants: { color: 'primary', variant: 'outline' },
          className: 'border-blue',
        },
      ],
    });
  });

  bench('create component with displayName', () => {
    variantComponent('button', {
      base: 'btn',
      variants: {
        color: { primary: 'bg-blue' },
      },
      displayName: 'MyButton',
    });
  });
});
