import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, test } from 'vitest';
import { defineConfig, recipe } from '../../src';
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

const { styled } = defineConfig();
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
const slottedButtonRecipe = recipe({
  slots: {
    root: 'inline-flex items-center gap-2',
    icon: 'size-4',
    label: 'truncate',
    badge: 'hidden rounded-full',
  },
  variants: {
    tone: {
      primary: {
        root: 'bg-blue text-white',
        icon: 'text-blue-100',
      },
      ghost: {
        root: 'bg-transparent text-slate-900',
        icon: 'text-slate-500',
      },
    },
    loading: {
      true: {
        label: 'opacity-0',
        badge: 'inline-flex',
      },
    },
  },
  defaultVariants: {
    tone: 'primary',
    loading: false,
  },
});
const SlottedButton = styled('button', slottedButtonRecipe, {
  view({ host, classes, variants }) {
    return host.render({
      children: (
        <>
          <span className={classes.icon()} />
          <span className={classes.label()}>{host.children}</span>
          {variants.loading ? <span className={classes.badge()} /> : null}
        </>
      ),
    });
  },
});
const EnumeratedSlottedButton = styled('button', slottedButtonRecipe, {
  view({ host, classes, variants }) {
    const slotNames = Object.keys(classes);
    const slotMap = { ...classes };

    return host.render({
      'data-slot-count': slotNames.length,
      children: (
        <>
          <span className={slotMap.icon()} />
          <span className={slotMap.label()}>{host.children}</span>
          {variants.loading ? <span className={slotMap.badge()} /> : null}
        </>
      ),
    });
  },
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
      const nextRoot = createRoot(container);
      root = nextRoot;
      flushSync(() => {
        nextRoot.render(createNode(toggle));
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

function hooks(rerender: ReturnType<typeof createClientRerenderBench>) {
  return { beforeAll: rerender.setup, afterAll: rerender.teardown };
}

describe('styled()', () => {
  test('element creation', async ({ bench }) => {
    await bench.compare(
      bench('simple component with defaults', () => {
        createElement(SimpleButton, { children: 'Click' });
      }),
      bench('simple component with props', () => {
        createElement(SimpleButton, simpleComponentProps);
      }),
      bench('complex component with defaults', () => {
        createElement(ComplexButton, { children: 'Click' });
      }),
      bench('complex component with props', () => {
        createElement(ComplexButton, complexComponentProps);
      })
    );
  });

  test('render prop', async ({ bench }) => {
    await bench.compare(
      bench('render prop with element', () => {
        createElement(SimpleButtonWithRender, {
          children: 'Link',
          render: renderElement,
        });
      }),
      bench('render prop with function', () => {
        createElement(SimpleButtonWithRender, {
          children: 'Link',
          render: renderFunction,
        });
      }),
      bench('render prop element with variant props', () => {
        createElement(ComplexButtonWithRender, {
          ...complexComponentProps,
          render: renderElement,
        });
      }),
      bench('render prop function with variant props', () => {
        createElement(ComplexButtonWithRender, {
          ...complexComponentProps,
          render: renderFunction,
        });
      })
    );
  });

  test('server render', async ({ bench }) => {
    await bench.compare(
      bench('simple component with defaults', () => {
        renderToStaticMarkup(
          createElement(SimpleButton, {
            children: 'Click',
          })
        );
      }),
      bench('simple component with props', () => {
        renderToStaticMarkup(createElement(SimpleButton, simpleComponentProps));
      }),
      bench('complex component with props', () => {
        renderToStaticMarkup(
          createElement(ComplexButton, complexComponentProps)
        );
      }),
      bench('render prop element with simple props', () => {
        renderToStaticMarkup(
          createElement(SimpleButtonWithRender, {
            ...simpleComponentProps,
            render: renderElement,
          })
        );
      }),
      bench('render prop function with simple props', () => {
        renderToStaticMarkup(
          createElement(SimpleButtonWithRender, {
            ...simpleComponentProps,
            render: renderFunction,
          })
        );
      }),
      bench('render prop element with complex props', () => {
        renderToStaticMarkup(
          createElement(ComplexButtonWithRender, {
            ...complexComponentProps,
            render: renderElement,
          })
        );
      }),
      bench('render prop function with complex props', () => {
        renderToStaticMarkup(
          createElement(ComplexButtonWithRender, {
            ...complexComponentProps,
            render: renderFunction,
          })
        );
      }),
      bench('slotted view with direct slot access', () => {
        renderToStaticMarkup(
          createElement(SlottedButton, {
            children: 'Save',
            loading: true,
            tone: 'primary',
          })
        );
      }),
      bench('slotted view with Object.keys and spread', () => {
        renderToStaticMarkup(
          createElement(EnumeratedSlottedButton, {
            children: 'Save',
            loading: true,
            tone: 'ghost',
          })
        );
      })
    );
  });

  test('client rerender', async ({ bench }) => {
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
    const slottedEnumeratedRerender = createClientRerenderBench(toggle =>
      createElement(EnumeratedSlottedButton, {
        children: 'Save',
        loading: toggle,
        tone: toggle ? 'ghost' : 'primary',
      })
    );

    await bench.compare(
      bench('simple component rerender', hooks(simple), simple.run),
      bench('complex component rerender', hooks(complex), complex.run),
      bench(
        'render prop element rerender',
        hooks(renderElementRerender),
        renderElementRerender.run
      ),
      bench(
        'render prop function rerender',
        hooks(renderFunctionRerender),
        renderFunctionRerender.run
      ),
      bench(
        'slotted view rerender with Object.keys and spread',
        hooks(slottedEnumeratedRerender),
        slottedEnumeratedRerender.run
      ),
      { throws: true }
    );
  });
});

test('recipe.resolve()', async ({ bench }) => {
  await bench.compare(
    bench('resolve simple with defaults', () => {
      simpleButtonRecipe.resolve({});
    }),
    bench('resolve simple with props', () => {
      simpleButtonRecipe.resolve(rootScenarioInputs.simpleExplicit);
    }),
    bench('resolve simple with className', () => {
      simpleButtonRecipe.resolve(rootScenarioInputs.simpleWithClassName);
    }),
    bench('resolve complex with extra props', () => {
      complexButtonRecipe.resolve(rootScenarioInputs.complexWithClassName);
    })
  );
});

test('styled() creation', async ({ bench }) => {
  await bench.compare(
    bench('create simple component from prepared recipe', () => {
      styled('button', simpleButtonRecipe);
    }),
    bench('create complex component from prepared recipe', () => {
      styled('button', complexButtonRecipe);
    }),
    bench('create component with render from prepared recipe', () => {
      styled('button', simpleButtonRecipe, { withRender: true });
    })
  );
});

test('recipe() + styled() creation', async ({ bench }) => {
  await bench.compare(
    bench('create simple component including recipe creation', () => {
      styled('button', recipe(simpleRootConfig));
    }),
    bench('create complex component including recipe creation', () => {
      styled('button', recipe(complexRootConfig));
    }),
    bench('create component with render including recipe creation', () => {
      styled('button', recipe(simpleRootConfig), { withRender: true });
    })
  );
});
