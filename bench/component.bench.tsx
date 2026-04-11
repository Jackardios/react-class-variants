import { bench, describe } from 'vitest';
import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
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
const linkElement = createElement('a', { href: '/' });
const renderFn = (props: Record<string, unknown>) =>
  createElement('a', { ...props, href: '/' });

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

  describe('server render', () => {
    bench('simple component with defaults', () => {
      renderToStaticMarkup(
        createElement(SimpleButton, {
          children: 'Click',
        })
      );
    });

    bench('simple component with props', () => {
      renderToStaticMarkup(createElement(SimpleButton, simpleButtonProps));
    });

    bench('complex component with props', () => {
      renderToStaticMarkup(createElement(ComplexButton, complexButtonProps));
    });

    bench('render prop element with simple props', () => {
      renderToStaticMarkup(
        createElement(SimpleButtonWithRender, {
          render: linkElement,
          ...simpleButtonProps,
        })
      );
    });

    bench('render prop function with simple props', () => {
      renderToStaticMarkup(
        createElement(SimpleButtonWithRender, {
          render: renderFn,
          ...simpleButtonProps,
        })
      );
    });

    bench('render prop element with complex props', () => {
      renderToStaticMarkup(
        createElement(ComplexButtonWithRender, {
          render: linkElement,
          ...complexButtonProps,
        })
      );
    });

    bench('render prop function with complex props', () => {
      renderToStaticMarkup(
        createElement(ComplexButtonWithRender, {
          render: renderFn,
          ...complexButtonProps,
        })
      );
    });
  });

  describe('client rerender', () => {
    function createClientRerenderBench(
      createNode: (toggle: boolean) => ReturnType<typeof createElement>
    ) {
      let container: HTMLDivElement | undefined;
      let root: Root | undefined;
      let toggle = false;

      return {
        run() {
          toggle = !toggle;
          flushSync(() => {
            root?.render(createNode(toggle));
          });
        },
        setup() {
          container = document.createElement('div');
          document.body.appendChild(container);
          root = createRoot(container);
        },
        teardown() {
          if (root) {
            flushSync(() => {
              root?.unmount();
            });
          }
          container?.remove();
          container = undefined;
          root = undefined;
          toggle = false;
        },
      };
    }

    const simple = createClientRerenderBench(toggle =>
      createElement(SimpleButton, {
        children: 'Click',
        color: toggle ? 'secondary' : 'primary',
        size: 'lg',
      })
    );
    const complex = createClientRerenderBench(toggle =>
      createElement(ComplexButton, {
        ...complexButtonProps,
        color: toggle ? 'danger' : 'primary',
      })
    );
    const renderElement = createClientRerenderBench(toggle =>
      createElement(SimpleButtonWithRender, {
        children: 'Link',
        color: toggle ? 'secondary' : 'primary',
        render: linkElement,
        size: 'lg',
      })
    );
    const renderFunction = createClientRerenderBench(toggle =>
      createElement(SimpleButtonWithRender, {
        children: 'Link',
        color: toggle ? 'secondary' : 'primary',
        render: renderFn,
        size: 'lg',
      })
    );

    bench('simple component rerender', simple.run, {
      setup: simple.setup,
      teardown: simple.teardown,
      throws: true,
    });

    bench('complex component rerender', complex.run, {
      setup: complex.setup,
      teardown: complex.teardown,
      throws: true,
    });

    bench('render prop element rerender', renderElement.run, {
      setup: renderElement.setup,
      teardown: renderElement.teardown,
      throws: true,
    });

    bench('render prop function rerender', renderFunction.run, {
      setup: renderFunction.setup,
      teardown: renderFunction.teardown,
      throws: true,
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
