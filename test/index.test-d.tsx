import {
  expectType,
  expectAssignable,
  expectNotAssignable,
  expectError,
} from 'tsd';
import { type Ref, type ReactElement, type ReactNode } from 'react';
import {
  defineConfig,
  type VariantOptions,
  type ClassNameValue,
  type ExtractVariantOptions,
  type ExtractVariantConfig,
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
      expectType<string>(props.className);
      expectType<Ref<any> | undefined>(props.ref);
      expectError(props.color);
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
      expectType<React.MouseEventHandler<any> | undefined>(props.onClick);
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
      expectAssignable<string>(props.size);
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
expectAssignable<Function>(resolved.onClick);
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
expectAssignable<string>(resolvedWithForward.size);
expectAssignable<Function>(resolvedWithForward.onClick);
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

expectType<ReactNode>(
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

// =============================================================================
// ExtractVariantConfig Type Tests
// =============================================================================

// Extract full config from component
const ConfigButton = variantComponent('button', {
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
  compoundVariants: [
    {
      variants: { color: 'primary' },
      className: 'font-bold',
    },
  ],
});

type ConfigButtonConfig = ExtractVariantConfig<typeof ConfigButton>;

// Config should have all properties (base, variants, defaultVariants, compoundVariants)
expectAssignable<ConfigButtonConfig['base']>('btn');
expectAssignable<
  NonNullable<ConfigButtonConfig['variants']>['color']['primary']
>('bg-blue');
expectAssignable<NonNullable<ConfigButtonConfig['defaultVariants']>['color']>(
  'primary' // literal 'primary'
);

// =============================================================================
// ExtractVariantOptions - Universal Type Tests (works with all functions)
// =============================================================================

// Extract from variants() function
const testVariants = variants({
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
  defaultVariants: {
    size: 'small',
  },
});

type VariantsOptions = ExtractVariantOptions<typeof testVariants>;
expectAssignable<VariantsOptions>({ color: 'primary' });
expectAssignable<VariantsOptions>({ color: 'secondary', size: 'large' });
expectNotAssignable<VariantsOptions>({}); // color is required

// Extract from variantPropsResolver() function
const testResolver = variantPropsResolver({
  variants: {
    variant: {
      outline: 'border',
      solid: 'bg-fill',
    },
    disabled: {
      true: 'opacity-50',
      false: 'opacity-100',
    },
  },
});

type ResolverOptions = ExtractVariantOptions<typeof testResolver>;
expectAssignable<ResolverOptions>({ variant: 'outline' });
expectAssignable<ResolverOptions>({ variant: 'solid', disabled: true });
expectNotAssignable<ResolverOptions>({}); // variant is required

// Extract from variantComponent() - should work same as before
const testComponent = variantComponent('button', {
  variants: {
    intent: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
    },
  },
});

type ComponentOptions = ExtractVariantOptions<typeof testComponent>;
expectAssignable<ComponentOptions>({ intent: 'primary' });
expectNotAssignable<ComponentOptions>({});

// =============================================================================
// ExtractVariantConfig - Universal Type Tests (works with all functions)
// =============================================================================

// Extract config from variants() function
const configTestVariants = variants({
  base: 'btn',
  variants: {
    color: { primary: 'bg-blue' },
  },
  defaultVariants: {
    color: 'primary',
  },
  compoundVariants: [
    {
      variants: { color: 'primary' },
      className: 'font-bold',
    },
  ],
});

type VariantsConfig = ExtractVariantConfig<typeof configTestVariants>;
expectAssignable<VariantsConfig['base']>('btn');
expectAssignable<NonNullable<VariantsConfig['variants']>['color']['primary']>(
  'bg-blue'
);

// Extract config from variantPropsResolver() function
const configTestResolver = variantPropsResolver({
  base: 'input',
  variants: {
    size: { small: 'h-8', large: 'h-12' },
  },
});

type ResolverConfig = ExtractVariantConfig<typeof configTestResolver>;
expectAssignable<ResolverConfig['base']>('input');
expectAssignable<NonNullable<ResolverConfig['variants']>['size']['small']>(
  'h-8'
);

// Extract config from variantComponent() function - should work same as before
const configTestComponent = variantComponent('div', {
  base: 'container',
  variants: {
    spacing: { normal: 'p-4', tight: 'p-2' },
  },
});

type ComponentConfig = ExtractVariantConfig<typeof configTestComponent>;
expectAssignable<ComponentConfig['base']>('container');
expectAssignable<NonNullable<ComponentConfig['variants']>['spacing']['normal']>(
  'p-4'
);

// =============================================================================
// Compound Variants Type Tests
// =============================================================================

// Compound variants with array matching
const compoundArrayVariants = variants({
  variants: {
    color: {
      primary: 'bg-blue',
      secondary: 'bg-gray',
      danger: 'bg-red',
    },
    size: {
      sm: 'text-sm',
      lg: 'text-lg',
    },
  },
  compoundVariants: [
    {
      variants: {
        color: ['primary', 'secondary'],
        size: 'lg',
      },
      className: 'font-bold',
    },
  ],
});

expectType<string>(compoundArrayVariants({ color: 'primary', size: 'lg' }));
expectType<string>(compoundArrayVariants({ color: 'danger', size: 'sm' }));

// Compound variants should not affect required vs optional
expectError(compoundArrayVariants());
expectError(compoundArrayVariants({ color: 'primary' }));

// =============================================================================
// ClassNameValue in Different Positions Type Tests
// =============================================================================

// Array className in variants
const arrayClassVariants = variants({
  base: ['base', 'class'],
  variants: {
    color: {
      primary: ['bg-blue', 'text-white'],
      secondary: ['bg-gray', null, 'text-black'],
    },
  },
  compoundVariants: [
    {
      variants: { color: 'primary' },
      className: ['compound', ['nested']],
    },
  ],
});

expectType<string>(arrayClassVariants({ color: 'primary' }));

// Null/undefined in className arrays
const nullableClassVariants = variants({
  base: [null, 'base', undefined],
  variants: {
    size: {
      sm: [null, 'sm', undefined],
    },
  },
});

expectType<string>(nullableClassVariants({ size: 'sm' }));

// =============================================================================
// Component with Complex Props Type Tests
// =============================================================================

// Component with intersection of variant props and HTML attributes
const ComplexButton = variantComponent('button', {
  base: 'btn',
  variants: {
    color: { primary: 'bg-blue' },
    // 'type' is also an HTML button attribute - variant should win
    variant: { solid: 'solid', outline: 'outline' },
  },
});

expectType<ReactNode>(
  ComplexButton({
    color: 'primary',
    variant: 'solid',
    type: 'submit', // HTML attribute
    children: 'Click',
  })
);

// =============================================================================
// defineConfig Type Tests
// =============================================================================

// With onClassesMerged callback
const { variants: mergedVariants } = defineConfig({
  onClassesMerged: (cls: string) => cls.toUpperCase(),
});

const mergedButton = mergedVariants({
  base: 'btn',
});

expectType<string>(mergedButton());

// Empty config
const { variants: emptyConfigVariants } = defineConfig({});
const emptyConfigButton = emptyConfigVariants({ base: 'btn' });
expectType<string>(emptyConfigButton());

// =============================================================================
// Type Inference Edge Cases
// =============================================================================

// Variant with undefined value
const undefinedVariantValue = variants({
  base: 'btn',
  variants: {
    color: {
      primary: 'bg-blue',
      none: undefined,
    },
  },
});

expectType<string>(undefinedVariantValue({ color: 'primary' }));
expectType<string>(undefinedVariantValue({ color: 'none' }));

// Variant with null value
const nullVariantValue = variants({
  base: 'btn',
  variants: {
    color: {
      primary: 'bg-blue',
      none: null,
    },
  },
});

expectType<string>(nullVariantValue({ color: 'primary' }));
expectType<string>(nullVariantValue({ color: 'none' }));

// Many variants
const manyVariants = variants({
  variants: {
    a: { x: 'a' },
    b: { x: 'b' },
    c: { x: 'c' },
    d: { x: 'd' },
    e: { x: 'e' },
    f: { true: 'f-true', false: 'f-false' },
    g: { true: 'g-true', false: 'g-false' },
  },
  defaultVariants: {
    a: 'x',
    b: 'x',
  },
});

// c, d, e are required; a, b have defaults; f, g are boolean (optional)
expectError(manyVariants());
expectType<string>(manyVariants({ c: 'x', d: 'x', e: 'x' }));
expectType<string>(manyVariants({ a: 'x', c: 'x', d: 'x', e: 'x', f: true }));

// =============================================================================
// Render Prop Edge Cases Type Tests
// =============================================================================

// Render function should receive correct props type
const RenderPropsButton = variantComponent('button', {
  variants: {
    color: { primary: 'bg-blue' },
  },
});

expectType<ReactNode>(
  RenderPropsButton({
    color: 'primary',
    id: 'custom-id',
    render: (props) => {
      // Should have className
      expectType<string>(props.className);
      // Should have id passed through
      expectAssignable<string | undefined>(props.id);
      // Should NOT have color (variant prop)
      expectError(props.color);
      return <div {...props} />;
    },
  })
);

// =============================================================================
// Empty/Minimal Configuration Type Tests
// =============================================================================

// Completely empty variants object
const emptyVariantsObject = variants({
  variants: {},
});
expectType<string>(emptyVariantsObject());
expectType<string>(emptyVariantsObject({ className: 'test' }));

// Undefined variants
const undefinedVariantsConfig = variants({
  base: 'btn',
  variants: undefined,
});
expectType<string>(undefinedVariantsConfig());

// Empty component config
const EmptyComponent = variantComponent('div', {});
expectType<ReactNode>(EmptyComponent({ children: 'test' }));
expectType<ReactNode>(EmptyComponent({ className: 'custom' }));

// =============================================================================
// forwardProps Type Tests
// =============================================================================

// forwardProps should include variant props in render function
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
    render: (props) => {
      // Both color and size should be available since they're forwarded
      expectAssignable<string>(props.color);
      expectAssignable<string>(props.size);
      expectType<string>(props.className);
      return <span {...props} />;
    },
  })
);

// Empty forwardProps
const NoForwardButton = variantComponent('button', {
  variants: {
    color: { primary: 'bg-blue' },
  },
  forwardProps: [],
});

expectType<ReactNode>(
  NoForwardButton({
    color: 'primary',
    render: (props) => {
      expectError(props.color); // Not forwarded
      return <span {...props} />;
    },
  })
);
