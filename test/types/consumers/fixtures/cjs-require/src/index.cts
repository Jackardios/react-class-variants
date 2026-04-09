import {
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
const { variants, variantPropsResolver } = defineConfig();

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
  className: 'inline-flex',
});

type _ResolvedClassName = Expect<
  Equal<typeof resolvedLinkProps.className, string>
>;
type _ResolvedForwardedSize = Expect<
  Equal<typeof resolvedLinkProps.size, 'lg'>
>;

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
