import {
  expectAssignable,
  expectError,
  expectNotAssignable,
  expectType,
} from 'tsd';
import {
  createRef,
  type ComponentPropsWithoutRef,
  type Ref,
  type RefCallback,
} from 'react';
import {
  defineConfig,
  type ClassNameValue,
  type ExtractVariantConfig,
  type ExtractVariantOptions,
  type VariantOptions,
  mergeProps,
  mergeRefs,
  useMergeRefs,
} from '../../../';

const { variants, variantComponent, variantPropsResolver } = defineConfig();

// =============================================================================
// ClassNameValue
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
// Root utilities
// =============================================================================

const buttonBaseProps: ComponentPropsWithoutRef<'button'> = {
  className: 'base',
  disabled: false,
  type: 'button',
};
const buttonOverrideProps: Partial<ComponentPropsWithoutRef<'button'>> = {
  className: 'override',
  disabled: true,
};
const mergedButtonProps = mergeProps(buttonBaseProps, buttonOverrideProps);
expectType<boolean | undefined>(mergedButtonProps.disabled);
expectType<string | undefined>(mergedButtonProps.className);
expectType<'button' | 'submit' | 'reset' | undefined>(mergedButtonProps.type);

const mergedConflictingProps = mergeProps({ foo: 'base' }, { foo: 1 });
expectType<number>(mergedConflictingProps.foo);

const buttonRefObject = createRef<HTMLButtonElement>();
const buttonRefCallback: RefCallback<HTMLButtonElement> = () => {};
const mergedRefCallback = mergeRefs(buttonRefObject, buttonRefCallback);
expectType<RefCallback<HTMLButtonElement> | undefined>(mergedRefCallback);

const singleMergedRef = mergeRefs(buttonRefObject);
expectType<Ref<HTMLButtonElement> | undefined>(singleMergedRef);

const hookMergedRef = useMergeRefs(buttonRefObject, buttonRefCallback);
expectType<RefCallback<HTMLButtonElement> | undefined>(hookMergedRef);

// =============================================================================
// VariantOptions utility
// =============================================================================

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
// ExtractVariantOptions and ExtractVariantConfig
// =============================================================================

const buttonVariants = variants({
  base: 'btn',
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

type ButtonVariantOptions = ExtractVariantOptions<typeof buttonVariants>;
expectAssignable<ButtonVariantOptions>({ color: 'primary' });
expectAssignable<ButtonVariantOptions>({ color: 'secondary', size: 'large' });
expectNotAssignable<ButtonVariantOptions>({});

type ButtonVariantConfig = ExtractVariantConfig<typeof buttonVariants>;
expectAssignable<ButtonVariantConfig['base']>('btn');
expectAssignable<
  NonNullable<ButtonVariantConfig['variants']>['color']['primary']
>('bg-blue');

const propsResolver = variantPropsResolver({
  base: 'input',
  variants: {
    size: {
      small: 'h-8',
      large: 'h-12',
    },
  },
});

type ResolverOptions = ExtractVariantOptions<typeof propsResolver>;
expectAssignable<ResolverOptions>({ size: 'small' });
expectNotAssignable<ResolverOptions>({});

type ResolverConfig = ExtractVariantConfig<typeof propsResolver>;
expectAssignable<ResolverConfig['base']>('input');
expectAssignable<NonNullable<ResolverConfig['variants']>['size']['small']>(
  'h-8'
);

const Button = variantComponent('button', {
  base: 'btn',
  variants: {
    intent: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
    },
  },
});

type ComponentOptions = ExtractVariantOptions<typeof Button>;
expectAssignable<ComponentOptions>({ intent: 'primary' });
expectNotAssignable<ComponentOptions>({});

type ComponentConfig = ExtractVariantConfig<typeof Button>;
expectAssignable<ComponentConfig['base']>('btn');
expectAssignable<NonNullable<ComponentConfig['variants']>['intent']['primary']>(
  'btn-primary'
);

// =============================================================================
// defineConfig
// =============================================================================

const { variants: mergedVariants } = defineConfig({
  onClassesMerged: (className: string) => className.toUpperCase(),
});
const mergedButton = mergedVariants({ base: 'btn' });
expectType<string>(mergedButton());

const { variants: emptyConfigVariants } = defineConfig({});
const emptyConfigButton = emptyConfigVariants({ base: 'btn' });
expectType<string>(emptyConfigButton());
