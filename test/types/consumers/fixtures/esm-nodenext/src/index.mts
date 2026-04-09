import { createElement, type ComponentProps } from 'react';
import {
  defineConfig,
  type ExtractVariantConfig,
  type ExtractVariantOptions,
  mergeProps,
} from 'react-class-variants';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;
type Expect<T extends true> = T;

const { variants, variantComponent, variantPropsResolver } = defineConfig();

const badge = variants({
  base: 'badge',
  variants: {
    tone: {
      neutral: 'bg-slate-100',
      accent: 'bg-sky-500',
    },
    size: {
      sm: 'text-xs',
      lg: 'text-lg',
    },
    disabled: {
      true: 'opacity-50',
      false: 'opacity-100',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
  compoundVariants: [
    {
      variants: {
        tone: ['neutral', 'accent'],
        size: 'lg',
      },
      className: 'tracking-wide',
    },
  ],
});

type BadgeOptions = ExtractVariantOptions<typeof badge>;
type BadgeConfig = ExtractVariantConfig<typeof badge>;

type _BadgeOptions = Expect<
  Equal<
    BadgeOptions,
    {
      tone: 'neutral' | 'accent';
      size?: 'sm' | 'lg';
      disabled?: boolean;
    }
  >
>;
type _BadgeToneClass = Expect<
  Equal<NonNullable<BadgeConfig['variants']>['tone']['neutral'], string>
>;

badge({ tone: 'neutral' });
badge({ tone: 'accent', size: 'lg', disabled: true });

// @ts-expect-error tone stays a literal union for ESM consumers
badge({ tone: 'warning' });

// @ts-expect-error tone remains required without a default variant
badge({});

variants({
  variants: {
    tone: {
      neutral: 'bg-slate-100',
    },
  },
  defaultVariants: {
    // @ts-expect-error typo in defaultVariants key must be rejected from packed types
    tonee: 'neutral',
  },
});

variants({
  variants: {
    tone: {
      neutral: 'bg-slate-100',
    },
  },
  compoundVariants: [
    {
      variants: {
        // @ts-expect-error typo in compoundVariants selector key must be rejected
        tonee: 'neutral',
      },
      className: 'tracking-wide',
    },
  ],
});

const Button = variantComponent('button', {
  variants: {
    tone: {
      neutral: 'bg-slate-100',
      accent: 'bg-sky-500',
    },
    size: {
      sm: 'text-xs',
      lg: 'text-lg',
    },
  },
  forwardProps: ['tone'],
});

Button({
  tone: 'neutral',
  size: 'lg',
  type: 'submit',
  disabled: true,
  form: 'checkout',
  render: props => {
    type _RenderClassName = Expect<Equal<typeof props.className, string>>;
    type _RenderTone = Expect<Equal<typeof props.tone, 'neutral' | 'accent'>>;

    // @ts-expect-error non-forwarded variants stay out of render props
    const leakedSize = props.size;
    void leakedSize;

    // @ts-expect-error base-element-specific props are intentionally not promised
    const leakedType = props.type;
    void leakedType;

    return null;
  },
});

const RouterLink = (props: { to: string } & ComponentProps<'a'>) => null;

Button({
  tone: 'accent',
  size: 'sm',
  render: props => createElement(RouterLink, { ...props, to: '/router' }),
});

const resolveButtonProps = variantPropsResolver({
  variants: {
    tone: {
      neutral: 'bg-slate-100',
      accent: 'bg-sky-500',
    },
  },
});

const resolvedButtonProps = resolveButtonProps({
  tone: 'neutral',
  className: ['inline-flex', ['gap-2'], null, undefined],
});

type _ResolvedButtonClassName = Expect<
  Equal<typeof resolvedButtonProps.className, string>
>;

const mergedConflictProps = mergeProps({ foo: 'base' }, { foo: 1 });
type _MergedConflictFoo = Expect<Equal<typeof mergedConflictProps.foo, number>>;
