import { createElement, type ComponentProps } from 'react';
import {
  defineConfig,
  defineRecipeConfig,
  recipe,
  styled,
  type RecipeConfigOf,
  type RecipeInput,
} from 'react-class-variants';
import {
  defineConfig as defineCoreConfig,
  defineRecipeConfig as defineCoreRecipeConfig,
  recipe as coreRecipe,
} from 'react-class-variants/core';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;
type Expect<T extends true> = T;

const { recipe: configuredRecipe } = defineConfig();
const { recipe: configuredCoreRecipe } = defineCoreConfig();

const badgeConfig = defineRecipeConfig({
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
    },
  },
  defaultVariants: {
    size: 'sm',
  },
  compoundVariants: [
    {
      tone: ['neutral', 'accent'],
      size: 'lg',
      className: 'tracking-wide',
    },
  ],
});

const badge = recipe(badgeConfig);

configuredRecipe({
  base: 'inline-flex',
  variants: {
    tone: {
      neutral: 'text-slate-700',
    },
  },
});

const coreOnlyBadge = configuredCoreRecipe({
  base: 'inline-flex',
  variants: {
    tone: {
      neutral: 'text-slate-700',
    },
  },
});
coreOnlyBadge({ tone: 'neutral' });
coreRecipe({ base: 'inline-flex' });
defineCoreRecipeConfig({ base: 'inline-flex' });

type BadgeOptions = RecipeInput<typeof badge>;
type BadgeConfig = RecipeConfigOf<typeof badge>;

const badgePrimary: BadgeOptions = { tone: 'neutral' };
const badgeAccent: BadgeOptions = {
  tone: 'accent',
  size: 'lg',
  disabled: true,
};
void badgePrimary;
void badgeAccent;
type _BadgeToneClass = Expect<
  Equal<NonNullable<BadgeConfig['variants']>['tone']['neutral'], 'bg-slate-100'>
>;

badge({ tone: 'neutral' });
badge({ tone: 'accent', size: 'lg', disabled: true });

// @ts-expect-error tone stays a literal union for ESM consumers
badge({ tone: 'warning' });

// @ts-expect-error tone remains required without a default
badge({});

const Button = styled(
  'button',
  recipe({
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
  }),
  {
    withRender: true,
  }
);

Button({
  tone: 'neutral',
  size: 'lg',
  type: 'submit',
  disabled: true,
  form: 'checkout',
  render: props => {
    type _RenderClassName = Expect<Equal<typeof props.className, string>>;
    return null;
  },
});

const RouterLink = (props: { to: string } & ComponentProps<'a'>) => null;

Button({
  tone: 'accent',
  size: 'sm',
  render: props => createElement(RouterLink, { ...props, to: '/router' }),
});

type _ResolvedButtonClassName = Expect<Equal<ReturnType<typeof badge>, string>>;

const Input = styled(
  'input',
  recipe({
    variants: {
      size: {
        sm: 'text-xs',
        lg: 'text-lg',
      },
    },
  }),
  {
    propAliases: {
      size: 'htmlSize',
    },
  }
);

Input({
  size: 'sm',
  htmlSize: 20,
  value: 'variant size',
});

Input({
  // @ts-expect-error overlap keys are variant-first and require propAliases
  size: 20,
  value: 'native size',
});

const multipartButtonRecipe = recipe({
  slots: {
    root: 'inline-flex',
    icon: 'size-4',
  },
  variants: {
    tone: {
      neutral: {
        root: 'bg-slate-100',
        icon: 'text-sky-500',
      },
    },
  },
});

const MultipartButton = styled('button', multipartButtonRecipe, {
  view: ({ host, classes }) =>
    host.render({
      children: createElement('span', { className: classes.icon() }),
    }),
});

MultipartButton({
  tone: 'neutral',
  className: 'px-4',
});
