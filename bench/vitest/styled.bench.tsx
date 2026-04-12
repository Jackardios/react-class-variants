import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { bench, describe } from 'vitest';
import { recipe, styled } from '../../src';
import {
  complexRootConfig,
  rootScenarioInputs,
  simpleRootConfig,
} from '../fixtures/root.mjs';
import {
  complexComponentProps,
  createComplexRerenderProps,
  createRenderFixtures,
  createRenderRerenderProps,
  createSimpleRerenderProps,
  simpleComponentProps,
} from '../fixtures/react.mjs';

const simpleButtonRecipe = recipe(simpleRootConfig);
const complexButtonRecipe = recipe(complexRootConfig);

const SimpleButton = styled('button', simpleButtonRecipe);
const ComplexButton = styled('button', complexButtonRecipe);
const SimpleButtonWithRender = styled('button', simpleButtonRecipe, {
  withRender: true,
});
const ComplexButtonWithRender = styled('button', complexButtonRecipe, {
  withRender: true,
});
const { renderElement, renderFunction } = createRenderFixtures(
  createElement,
  '/'
);

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
      toggle = false;
      container = document.createElement('div');
      document.body.appendChild(container);
      root = createRoot(container);
      flushSync(() => {
        root.render(createNode(toggle));
      });
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

describe('styled()', () => {
  describe('element creation', () => {
    bench('simple component with defaults', () => {
      createElement(SimpleButton, { children: 'Click' });
    });

    bench('simple component with props', () => {
      createElement(SimpleButton, simpleComponentProps);
    });

    bench('complex component with defaults', () => {
      createElement(ComplexButton, { children: 'Click' });
    });

    bench('complex component with props', () => {
      createElement(ComplexButton, complexComponentProps);
    });
  });

  describe('render prop', () => {
    bench('render prop with element', () => {
      createElement(SimpleButtonWithRender, {
        children: 'Link',
        render: renderElement,
      });
    });

    bench('render prop with function', () => {
      createElement(SimpleButtonWithRender, {
        children: 'Link',
        render: renderFunction,
      });
    });

    bench('render prop element with variant props', () => {
      createElement(ComplexButtonWithRender, {
        ...complexComponentProps,
        render: renderElement,
      });
    });

    bench('render prop function with variant props', () => {
      createElement(ComplexButtonWithRender, {
        ...complexComponentProps,
        render: renderFunction,
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
      renderToStaticMarkup(createElement(SimpleButton, simpleComponentProps));
    });

    bench('complex component with props', () => {
      renderToStaticMarkup(createElement(ComplexButton, complexComponentProps));
    });

    bench('render prop element with simple props', () => {
      renderToStaticMarkup(
        createElement(SimpleButtonWithRender, {
          ...simpleComponentProps,
          render: renderElement,
        })
      );
    });

    bench('render prop function with simple props', () => {
      renderToStaticMarkup(
        createElement(SimpleButtonWithRender, {
          ...simpleComponentProps,
          render: renderFunction,
        })
      );
    });

    bench('render prop element with complex props', () => {
      renderToStaticMarkup(
        createElement(ComplexButtonWithRender, {
          ...complexComponentProps,
          render: renderElement,
        })
      );
    });

    bench('render prop function with complex props', () => {
      renderToStaticMarkup(
        createElement(ComplexButtonWithRender, {
          ...complexComponentProps,
          render: renderFunction,
        })
      );
    });
  });

  describe('client rerender', () => {
    const simple = createClientRerenderBench(toggle =>
      createElement(SimpleButton, createSimpleRerenderProps(toggle))
    );
    const complex = createClientRerenderBench(toggle =>
      createElement(ComplexButton, createComplexRerenderProps(toggle))
    );
    const renderElementRerender = createClientRerenderBench(toggle =>
      createElement(
        SimpleButtonWithRender,
        createRenderRerenderProps(toggle, renderElement)
      )
    );
    const renderFunctionRerender = createClientRerenderBench(toggle =>
      createElement(
        SimpleButtonWithRender,
        createRenderRerenderProps(toggle, renderFunction)
      )
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

    bench('render prop element rerender', renderElementRerender.run, {
      setup: renderElementRerender.setup,
      teardown: renderElementRerender.teardown,
      throws: true,
    });

    bench('render prop function rerender', renderFunctionRerender.run, {
      setup: renderFunctionRerender.setup,
      teardown: renderFunctionRerender.teardown,
      throws: true,
    });
  });
});

describe('recipe.resolve()', () => {
  bench('resolve simple with defaults', () => {
    simpleButtonRecipe.resolve({});
  });

  bench('resolve simple with props', () => {
    simpleButtonRecipe.resolve(rootScenarioInputs.simpleExplicit);
  });

  bench('resolve simple with className', () => {
    simpleButtonRecipe.resolve(rootScenarioInputs.simpleWithClassName);
  });

  bench('resolve complex with extra props', () => {
    complexButtonRecipe.resolve(rootScenarioInputs.complexWithClassName);
  });
});

describe('styled() creation', () => {
  bench('create simple component from prepared recipe', () => {
    styled('button', simpleButtonRecipe);
  });

  bench('create complex component from prepared recipe', () => {
    styled('button', complexButtonRecipe);
  });

  bench('create component with render from prepared recipe', () => {
    styled('button', simpleButtonRecipe, { withRender: true });
  });
});

describe('recipe() + styled() creation', () => {
  bench('create simple component including recipe creation', () => {
    styled('button', recipe(simpleRootConfig));
  });

  bench('create complex component including recipe creation', () => {
    styled('button', recipe(complexRootConfig));
  });

  bench('create component with render including recipe creation', () => {
    styled('button', recipe(simpleRootConfig), { withRender: true });
  });
});
