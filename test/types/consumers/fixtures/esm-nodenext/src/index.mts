import {
  defineConfig,
  type ExtractVariantConfig,
  type ExtractVariantOptions,
} from 'react-class-variants';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;
type Expect<T extends true> = T;

const { variants } = defineConfig();

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
