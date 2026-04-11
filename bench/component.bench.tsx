import { bench, describe } from 'vitest';
import { createElement } from 'react';
import { recipe, styled } from '../src';

const simpleButtonRecipe = recipe({
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

const complexButtonRecipe = recipe({
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
      color: 'primary',
      variant: 'outline',
      className: 'border-blue-500 text-blue-500',
    },
    {
      color: 'secondary',
      variant: 'outline',
      className: 'border-gray-500 text-gray-500',
    },
    {
      color: 'danger',
      variant: 'outline',
      className: 'border-red-500 text-red-500',
    },
  ],
});

const simpleButtonProps = {
  color: 'secondary' as const,
  size: 'lg' as const,
  children: 'Click',
};

const complexButtonProps = {
  color: 'danger' as const,
  size: 'lg' as const,
  variant: 'outline' as const,
  disabled: true,
  children: 'Click',
};

const SimpleButton = styled('button', simpleButtonRecipe);
const ComplexButton = styled('button', complexButtonRecipe);
const SimpleButtonWithRender = styled('button', simpleButtonRecipe, {
  withRender: true,
});
const ComplexButtonWithRender = styled('button', complexButtonRecipe, {
  withRender: true,
});

describe('styled()', () => {
  describe('element creation', () => {
    bench('simple component with defaults', () => {
      createElement(SimpleButton, { children: 'Click' });
    });

    bench('simple component with props', () => {
      createElement(SimpleButton, simpleButtonProps);
    });

    bench('complex component with defaults', () => {
      createElement(ComplexButton, { children: 'Click' });
    });

    bench('complex component with props', () => {
      createElement(ComplexButton, complexButtonProps);
    });
  });

  describe('render prop', () => {
    const linkElement = createElement('a', { href: '/' });
    const renderFn = (props: Record<string, unknown>) =>
      createElement('a', { ...props, href: '/' });

    bench('render prop with element', () => {
      createElement(SimpleButtonWithRender, {
        render: linkElement,
        children: 'Link',
      });
    });

    bench('render prop with function', () => {
      createElement(SimpleButtonWithRender, {
        render: renderFn,
        children: 'Link',
      });
    });

    bench('render prop element with variant props', () => {
      createElement(ComplexButtonWithRender, {
        render: linkElement,
        ...complexButtonProps,
      });
    });

    bench('render prop function with variant props', () => {
      createElement(ComplexButtonWithRender, {
        render: renderFn,
        ...complexButtonProps,
      });
    });
  });
});

describe('recipe.resolve()', () => {
  bench('resolve simple with defaults', () => {
    simpleButtonRecipe.resolve({});
  });

  bench('resolve simple with props', () => {
    simpleButtonRecipe.resolve({ color: 'secondary', size: 'lg' });
  });

  bench('resolve simple with className', () => {
    simpleButtonRecipe.resolve({ color: 'primary', className: 'extra-class' });
  });

  bench('resolve complex with extra props', () => {
    complexButtonRecipe.resolve({
      color: 'secondary',
      size: 'sm',
      variant: 'ghost',
      disabled: true,
      className: 'shadow-lg',
    });
  });
});

describe('styled() creation', () => {
  bench('create simple component', () => {
    styled(
      'button',
      recipe({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue', secondary: 'bg-gray' },
        },
      })
    );
  });

  bench('create complex component', () => {
    styled(
      'button',
      recipe({
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
            color: 'primary',
            variant: 'outline',
            className: 'border-blue',
          },
        ],
      })
    );
  });

  bench('create component with displayName', () => {
    styled(
      'button',
      recipe({
        base: 'btn',
        variants: {
          color: { primary: 'bg-blue' },
        },
      }),
      {
        displayName: 'MyButton',
      }
    );
  });
});
