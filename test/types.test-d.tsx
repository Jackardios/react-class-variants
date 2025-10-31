import {
  expectType,
  expectAssignable,
  expectNotAssignable,
  expectError,
} from 'tsd';
import { type ReactElement, type ReactNode } from 'react';
import {
  defineConfig,
  type VariantOptions,
  type ClassNameValue,
} from '../src/index';

const { variants, variantPropsResolver, variantComponent } = defineConfig();

// =============================================================================
// ClassNameValue Type Tests
// =============================================================================

expectAssignable<ClassNameValue>('string');
expectAssignable<ClassNameValue>(null);
expectAssignable<ClassNameValue>(undefined);
expectAssignable<ClassNameValue>(['string', 'another']);
expectAssignable<ClassNameValue>(['string', null, undefined]);
expectAssignable<ClassNameValue>([['nested'], 'string']);
expectAssignable<ClassNameValue>([[['deeply', 'nested']]]);

expectNotAssignable<ClassNameValue>(123);
expectNotAssignable<ClassNameValue>(true);
expectNotAssignable<ClassNameValue>({ foo: 'bar' });

// =============================================================================
// Variant Options Type Tests - Required vs Optional
// =============================================================================

// Required variant (no default, not boolean)
const requiredVariant = variants({
  variants: {
    color: {
      primary: 'bg-blue',
      secondary: 'bg-gray',
    },
  },
});

expectError(requiredVariant());
expectError(requiredVariant({}));
expectType<string>(requiredVariant({ color: 'primary' }));
expectType<string>(requiredVariant({ color: 'secondary' }));

// Optional variant with default
const optionalWithDefault = variants({
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

expectType<string>(optionalWithDefault());
expectType<string>(optionalWithDefault({}));
expectType<string>(optionalWithDefault({ color: 'secondary' }));

// Boolean variant is optional (defaults to false)
const booleanVariant = variants({
  variants: {
    disabled: {
      true: 'opacity-50',
      false: 'opacity-100',
    },
  },
});

expectType<string>(booleanVariant());
expectType<string>(booleanVariant({}));
expectType<string>(booleanVariant({ disabled: true }));
expectType<string>(booleanVariant({ disabled: false }));

// Multiple variants with mixed optionality
const mixedVariants = variants({
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
    size: 'small',
  },
});

// color is required, size is optional (has default), disabled is optional (boolean)
expectError(mixedVariants());
expectError(mixedVariants({}));
expectError(mixedVariants({ size: 'large' }));
expectType<string>(mixedVariants({ color: 'primary' }));
expectType<string>(mixedVariants({ color: 'primary', size: 'large' }));
expectType<string>(mixedVariants({ color: 'primary', disabled: true }));
expectType<string>(
  mixedVariants({ color: 'primary', size: 'large', disabled: true })
);

// =============================================================================
// Variant Options Type Extraction
// =============================================================================

// Test VariantOptions type utility
type RequiredConfig = {
  variants: {
    color: {
      primary: string;
      secondary: string;
    };
  };
};

type RequiredOptions = VariantOptions<RequiredConfig>;
expectAssignable<RequiredOptions>({ color: 'primary' });
expectAssignable<RequiredOptions>({ color: 'secondary' });
expectNotAssignable<RequiredOptions>({});
expectError<RequiredOptions>({ color: 'invalid' });

type OptionalConfig = {
  variants: {
    disabled: {
      true: string;
      false: string;
    };
  };
  defaultVariants: {
    disabled: boolean;
  };
};

type OptionalOptions = VariantOptions<OptionalConfig>;
expectAssignable<OptionalOptions>({});
expectAssignable<OptionalOptions>({ disabled: true });
expectAssignable<OptionalOptions>({ disabled: false });

// =============================================================================
// Variants Function Type Tests
// =============================================================================

// No variants config
const noVariants = variants({
  base: 'btn',
});

expectType<string>(noVariants());
expectType<string>(noVariants({}));
expectType<string>(noVariants({ className: 'extra' }));

// className prop
const withClassName = variants({
  base: 'btn',
  variants: {
    color: {
      primary: 'bg-blue',
    },
  },
});

expectType<string>(withClassName({ color: 'primary', className: 'extra' }));
expectType<string>(withClassName({ color: 'primary', className: ['a', 'b'] }));
expectType<string>(
  withClassName({ color: 'primary', className: [['nested']] })
);

// Compound variants don't affect type
const withCompound = variants({
  variants: {
    color: {
      primary: 'bg-blue',
    },
    size: {
      large: 'text-lg',
    },
  },
  compoundVariants: [
    {
      variants: { color: 'primary', size: 'large' },
      className: 'font-bold',
    },
  ],
});

expectType<string>(withCompound({ color: 'primary', size: 'large' }));

// =============================================================================
// Component Props Type Tests
// =============================================================================

// Basic component
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

// Component with required variant
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

// Component with optional variant
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

// Component with boolean variant
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
// Render Prop Type Tests
// =============================================================================

// Render prop with ReactElement
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

// Render prop with function
expectType<ReactNode>(
  ButtonWithRender({
    color: 'primary',
    render: props => {
      expectType<{ className: string; children: string }>(props);
      return <a {...props} />;
    },
    children: 'Link',
  })
);

// Variant props should not be in render function args
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
      // color and size should NOT be in props
      expectError(props.color);
      expectError(props.size);
      // className and onClick should be in props
      expectType<string>(props.className);
      expectType<Function>(props.onClick);
      return <div {...props} />;
    },
  })
);

// =============================================================================
// withoutRenderProp Option Type Tests
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

// render prop should not be allowed (type level)
expectError(
  NoRenderButton({
    color: 'primary',
    render: <a />,
  })
);

// =============================================================================
// forwardProps Option Type Tests
// =============================================================================

const ForwardPropsButton = variantComponent('button', {
  variants: {
    color: { primary: 'bg-blue' },
    size: { large: 'text-lg' },
  },
  forwardProps: ['size'],
});

// size should be forwarded but type system doesn't change
expectType<ReactNode>(
  ForwardPropsButton({
    color: 'primary',
    size: 'large',
    children: 'Click',
  })
);

// With render prop, forwarded props should still be excluded from render fn args
expectType<ReactNode>(
  ForwardPropsButton({
    color: 'primary',
    size: 'large',
    render: props => {
      expectType<string>(props.className);
      expectType<string>(props.size);
      expectError(props.color);
      return <div {...props} />;
    },
  })
);

// =============================================================================
// Custom Component Type Tests
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
    // missing custom prop
    children: 'Test',
  })
);

// =============================================================================
// variantPropsResolver Type Tests
// =============================================================================

const resolveProps = variantPropsResolver({
  base: 'btn',
  variants: {
    color: {
      primary: 'bg-blue',
      secondary: 'bg-gray',
    },
  },
});

const resolved = resolveProps({
  color: 'primary',
  onClick: () => {},
  'data-testid': 'button',
});

expectType<string>(resolved.className);
expectType<Function>(resolved.onClick);
expectType<string>(resolved['data-testid']);
expectError(resolved.color);

// With forwardProps
const resolveWithForward = variantPropsResolver({
  variants: {
    color: { primary: 'bg-blue' },
    size: { large: 'text-lg' },
  },
  forwardProps: ['size'],
});

const resolvedWithForward = resolveWithForward({
  color: 'primary',
  size: 'large',
  onClick: () => {},
});

expectType<string>(resolvedWithForward.className);
expectType<string>(resolvedWithForward.size);
expectType<Function>(resolvedWithForward.onClick);
expectError(resolvedWithForward.color);

// =============================================================================
// HTML Attribute Type Tests
// =============================================================================

// Button should accept button attributes
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

// Anchor should accept anchor attributes
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

// Input should accept input attributes
const Input = variantComponent('input', {
  base: 'input',
});

expectType<ReactElement>(
  Input({
    type: 'text',
    placeholder: 'Enter text',
    value: 'test',
    onChange: () => {},
  })
);

// =============================================================================
// Ref Type Tests
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
    ref: el => {
      expectType<HTMLButtonElement | null>(el);
    },
    children: 'Click',
  })
);

// =============================================================================
// Edge Case Type Tests
// =============================================================================

// Empty config
const emptyVariants = variants({});
expectType<string>(emptyVariants());
expectType<string>(emptyVariants({ className: 'test' }));

// Only base
const onlyBase = variants({
  base: 'btn',
});
expectType<string>(onlyBase());
expectType<string>(onlyBase({ className: 'test' }));

// No variants object but has defaultVariants (edge case)
const noVariantsWithDefaults = variants({
  base: 'btn',
  defaultVariants: {},
});
expectType<string>(noVariantsWithDefaults());

// Single variant value
const singleValue = variants({
  variants: {
    color: {
      primary: 'bg-blue',
    },
  },
});
expectType<string>(singleValue({ color: 'primary' }));
expectError(singleValue({ color: 'secondary' }));

// Boolean variant with only true
const onlyTrue = variants({
  variants: {
    active: {
      true: 'active',
    },
  },
});
expectType<string>(onlyTrue());
expectType<string>(onlyTrue({ active: true }));
expectType<string>(onlyTrue({ active: false }));

// Boolean variant with only false
const onlyFalse = variants({
  variants: {
    inactive: {
      false: 'inactive',
    },
  },
});
expectType<string>(onlyFalse());
expectType<string>(onlyFalse({ inactive: true }));
expectType<string>(onlyFalse({ inactive: false }));
