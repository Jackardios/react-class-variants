import { expectAssignable, expectError, expectType } from 'tsd';
import { type ReactElement, type ReactNode, type Ref } from 'react';
import { defineConfig } from '../../../';

const { variantComponent } = defineConfig();

// =============================================================================
// Basic component props
// =============================================================================

const BasicButton = variantComponent('button', {
  base: 'btn',
});

expectType<ReactNode>(
  BasicButton({
    children: 'Click',
    onClick: () => {},
    className: 'extra',
  })
);

const RequiredButton = variantComponent('button', {
  variants: {
    color: {
      primary: 'bg-blue',
      secondary: 'bg-gray',
    },
  },
});

expectError(RequiredButton({ children: 'Click' }));
expectType<ReactNode>(RequiredButton({ color: 'primary', children: 'Click' }));

const OptionalButton = variantComponent('button', {
  variants: {
    color: {
      primary: 'bg-blue',
    },
  },
  defaultVariants: {
    color: 'primary',
  },
});

expectType<ReactNode>(OptionalButton({ children: 'Click' }));
expectType<ReactNode>(OptionalButton({ color: 'primary', children: 'Click' }));

const DisabledButton = variantComponent('button', {
  variants: {
    disabled: {
      true: 'opacity-50',
      false: 'opacity-100',
    },
  },
});

expectType<ReactNode>(DisabledButton({ children: 'Click' }));
expectType<ReactNode>(DisabledButton({ disabled: true, children: 'Click' }));
expectType<ReactNode>(DisabledButton({ disabled: false, children: 'Click' }));

// =============================================================================
// Render prop behavior
// =============================================================================

const ButtonWithRender = variantComponent('button', {
  base: 'btn',
  variants: {
    color: {
      primary: 'bg-blue',
    },
  },
});

expectType<ReactNode>(
  ButtonWithRender({
    color: 'primary',
    render: <a href="/" />,
    children: 'Link',
  })
);

expectType<ReactNode>(
  ButtonWithRender({
    color: 'primary',
    render: props => {
      expectType<string>(props.className);
      expectType<Ref<any> | undefined>(props.ref);
      expectError(props.color);
      return <a {...props} />;
    },
    children: 'Link',
  })
);

const MultiVariantButton = variantComponent('button', {
  variants: {
    color: { primary: 'bg-blue' },
    size: { large: 'text-lg' },
  },
});

expectType<ReactNode>(
  MultiVariantButton({
    color: 'primary',
    size: 'large',
    onClick: () => {},
    render: props => {
      expectError(props.color);
      expectError(props.size);
      expectType<string>(props.className);
      expectType<React.MouseEventHandler<any> | undefined>(props.onClick);
      return <div {...props} />;
    },
  })
);

const RenderPropsButton = variantComponent('button', {
  variants: {
    color: { primary: 'bg-blue' },
  },
});

expectType<ReactNode>(
  RenderPropsButton({
    color: 'primary',
    id: 'custom-id',
    render: props => {
      expectType<string>(props.className);
      expectAssignable<string | undefined>(props.id);
      expectError(props.color);
      return <div {...props} />;
    },
  })
);

// =============================================================================
// withoutRenderProp and forwardProps
// =============================================================================

const NoRenderButton = variantComponent('button', {
  base: 'btn',
  variants: {
    color: { primary: 'bg-blue' },
  },
  withoutRenderProp: true,
});

expectType<ReactElement>(
  NoRenderButton({ color: 'primary', children: 'Click' })
);

expectError(
  NoRenderButton({
    color: 'primary',
    render: <a />,
  })
);

const ForwardPropsButton = variantComponent('button', {
  variants: {
    color: { primary: 'bg-blue' },
    size: { large: 'text-lg' },
  },
  forwardProps: ['size'],
});

expectType<ReactNode>(
  ForwardPropsButton({
    color: 'primary',
    size: 'large',
    children: 'Click',
  })
);

expectType<ReactNode>(
  ForwardPropsButton({
    color: 'primary',
    size: 'large',
    render: props => {
      expectType<string>(props.className);
      expectAssignable<string>(props.size);
      expectError(props.color);
      return <div {...props} />;
    },
  })
);

const ForwardAllButton = variantComponent('button', {
  variants: {
    color: { primary: 'bg-blue', secondary: 'bg-gray' },
    size: { sm: 'text-sm', lg: 'text-lg' },
  },
  forwardProps: ['color', 'size'],
});

expectType<ReactNode>(
  ForwardAllButton({
    color: 'primary',
    size: 'lg',
    render: props => {
      expectAssignable<string>(props.color);
      expectAssignable<string>(props.size);
      expectType<string>(props.className);
      return <span {...props} />;
    },
  })
);

const NoForwardButton = variantComponent('button', {
  variants: {
    color: { primary: 'bg-blue' },
  },
  forwardProps: [],
});

expectType<ReactNode>(
  NoForwardButton({
    color: 'primary',
    render: props => {
      expectError(props.color);
      return <span {...props} />;
    },
  })
);

// =============================================================================
// Custom components and intrinsic props
// =============================================================================

const CustomComponent = variantComponent(
  (props: { custom: string; children: ReactNode }) => null,
  {
    base: 'custom',
    variants: {
      color: { primary: 'bg-blue' },
    },
  }
);

expectType<ReactElement>(
  CustomComponent({
    color: 'primary',
    custom: 'value',
    children: 'Test',
  })
);

expectError(
  CustomComponent({
    color: 'primary',
    children: 'Test',
  })
);

const Button = variantComponent('button', {
  base: 'btn',
});

expectType<ReactNode>(
  Button({
    type: 'submit',
    disabled: true,
    form: 'my-form',
    children: 'Submit',
  })
);

const Link = variantComponent('a', {
  base: 'link',
});

expectType<ReactNode>(
  Link({
    href: '/path',
    target: '_blank',
    rel: 'noopener',
    children: 'Link',
  })
);

const Input = variantComponent('input', {
  base: 'input',
});

expectType<ReactNode>(
  Input({
    type: 'text',
    placeholder: 'Enter text',
    value: 'test',
    onChange: () => {},
  })
);

// =============================================================================
// Refs and edge cases
// =============================================================================

const RefButton = variantComponent('button', {
  base: 'btn',
});

expectType<ReactNode>(
  RefButton({
    ref: { current: null },
    children: 'Click',
  })
);

expectType<ReactNode>(
  RefButton({
    ref: element => {
      expectType<HTMLButtonElement | null>(element);
    },
    children: 'Click',
  })
);

const EmptyComponent = variantComponent('div', {});
expectType<ReactNode>(EmptyComponent({ children: 'test' }));
expectType<ReactNode>(EmptyComponent({ className: 'custom' }));

const DisplayNameButton = variantComponent('button', {
  variants: {
    color: { primary: 'bg-blue' },
  },
  displayName: 'MyButton',
});
expectType<ReactNode>(DisplayNameButton({ color: 'primary' }));

const ComplexButton = variantComponent('button', {
  base: 'btn',
  variants: {
    color: { primary: 'bg-blue' },
    variant: { solid: 'solid', outline: 'outline' },
  },
});

expectType<ReactNode>(
  ComplexButton({
    color: 'primary',
    variant: 'solid',
    type: 'submit',
    children: 'Click',
  })
);

// =============================================================================
// Exactness and negative DX cases
// =============================================================================

expectError(
  variantComponent('button', {
    variants: {
      size: {
        sm: 'text-sm',
      },
    },
    forwardProps: ['sizze'],
  })
);

expectError(
  variantComponent('button', {
    variants: {
      color: {
        primary: 'bg-blue',
      },
    },
    displayname: 'BrokenButton',
  })
);

expectError(
  variantComponent('button', {
    variants: {
      color: {
        primary: 'bg-blue',
      },
    },
    withoutRenderProps: true,
  })
);
