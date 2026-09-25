export const simpleComponentProps = /** @type {const} */ ({
  children: 'Click',
  size: 'lg',
  tone: 'secondary',
});

export const complexComponentProps = /** @type {const} */ ({
  children: 'Click',
  disabled: true,
  size: 'lg',
  tone: 'danger',
  variant: 'outline',
});

export function createRenderFixtures(createElement, href = '/docs') {
  return {
    renderElement: createElement('a', { href }),
    renderFunction: props => createElement('a', { ...props, href }),
  };
}

export function createSimpleRerenderProps(toggle) {
  return /** @type {const} */ ({
    children: 'Click',
    size: 'lg',
    tone: toggle ? 'secondary' : 'primary',
  });
}

export function createComplexRerenderProps(toggle) {
  return /** @type {const} */ ({
    ...complexComponentProps,
    tone: toggle ? 'danger' : 'primary',
  });
}

export function createRenderRerenderProps(toggle, render) {
  return /** @type {const} */ ({
    children: 'Link',
    render,
    size: 'lg',
    tone: toggle ? 'secondary' : 'primary',
  });
}
