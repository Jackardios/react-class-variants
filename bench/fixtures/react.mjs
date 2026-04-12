export const simpleComponentProps = {
  children: 'Click',
  size: 'lg',
  tone: 'secondary',
};

export const complexComponentProps = {
  children: 'Click',
  disabled: true,
  size: 'lg',
  tone: 'danger',
  variant: 'outline',
};

export function createRenderFixtures(createElement, href = '/docs') {
  return {
    renderElement: createElement('a', { href }),
    renderFunction: props => createElement('a', { ...props, href }),
  };
}

export function createSimpleRerenderProps(toggle) {
  return {
    children: 'Click',
    size: 'lg',
    tone: toggle ? 'secondary' : 'primary',
  };
}

export function createComplexRerenderProps(toggle) {
  return {
    ...complexComponentProps,
    tone: toggle ? 'danger' : 'primary',
  };
}

export function createRenderRerenderProps(toggle, render) {
  return {
    children: 'Link',
    render,
    size: 'lg',
    tone: toggle ? 'secondary' : 'primary',
  };
}
