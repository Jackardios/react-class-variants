import {
  createElement,
  createRef,
  type ComponentPropsWithoutRef,
  type RefCallback,
} from 'react';
import rcv = require('react-class-variants');

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;
type Expect<T extends true> = T;

const { defineConfig, mergeProps, mergeRefs } = rcv;
const { variants, variantComponent, variantPropsResolver } = defineConfig();

const link = variants({
  variants: {
    intent: {
      primary: 'text-blue-600',
      secondary: 'text-slate-700',
    },
    underline: {
      true: 'underline',
      false: 'no-underline',
    },
  },
});

type LinkOptions = rcv.ExtractVariantOptions<typeof link>;
type _LinkOptions = Expect<
  Equal<
    LinkOptions,
    {
      intent: 'primary' | 'secondary';
      underline?: boolean;
    }
  >
>;

const resolveLinkProps = variantPropsResolver({
  variants: {
    intent: {
      primary: 'text-blue-600',
      secondary: 'text-slate-700',
    },
    size: {
      sm: 'text-sm',
      lg: 'text-lg',
    },
  },
  forwardProps: ['size'],
});

const resolvedLinkProps = resolveLinkProps({
  intent: 'primary',
  size: 'lg',
  className: ['inline-flex', ['gap-2'], null, undefined],
});

type _ResolvedClassName = Expect<
  Equal<typeof resolvedLinkProps.className, string>
>;
type _ResolvedForwardedSize = Expect<
  Equal<typeof resolvedLinkProps.size, 'lg'>
>;

const Button = variantComponent('button', {
  variants: {
    intent: {
      primary: 'text-blue-600',
      secondary: 'text-slate-700',
    },
    size: {
      sm: 'text-sm',
      lg: 'text-lg',
    },
  },
  forwardProps: ['intent'],
});

Button({
  intent: 'primary',
  size: 'lg',
  render: props => {
    type _RenderClassName = Expect<Equal<typeof props.className, string>>;
    type _RenderIntent = Expect<
      Equal<typeof props.intent, 'primary' | 'secondary'>
    >;

    // @ts-expect-error non-forwarded variants stay out of render props
    const leakedSize = props.size;
    void leakedSize;

    // @ts-expect-error base-element-specific props are intentionally not promised
    const leakedType = props.type;
    void leakedType;

    return createElement('a', { ...props, href: '/' });
  },
});

const baseButtonProps: ComponentPropsWithoutRef<'button'> = {
  className: 'base',
  disabled: false,
  type: 'button',
};
const overrideButtonProps: Partial<ComponentPropsWithoutRef<'button'>> = {
  className: 'override',
  disabled: true,
};
const mergedButtonProps = mergeProps(baseButtonProps, overrideButtonProps);
type _MergedClassName = Expect<
  Equal<typeof mergedButtonProps.className, string | undefined>
>;
type _MergedType = Expect<
  Equal<
    typeof mergedButtonProps.type,
    'button' | 'submit' | 'reset' | undefined
  >
>;

const mergedConflictProps = mergeProps({ foo: 'base' }, { foo: 1 });
type _MergedConflictFoo = Expect<Equal<typeof mergedConflictProps.foo, number>>;

const buttonRefObject = createRef<HTMLButtonElement>();
const buttonRefCallback: RefCallback<HTMLButtonElement> = () => {};
const mergedRefCallback = mergeRefs(buttonRefObject, buttonRefCallback);
type _MergedRef = Expect<
  Equal<typeof mergedRefCallback, RefCallback<HTMLButtonElement> | undefined>
>;

link({ intent: 'primary', underline: true });

// @ts-expect-error invalid variant value must fail from require() consumers
link({ intent: 'ghost' });

variantPropsResolver({
  variants: {
    size: {
      sm: 'text-sm',
    },
  },
  // @ts-expect-error typo in forwardProps must be rejected from require() consumers
  forwardProps: ['sizze'],
});
