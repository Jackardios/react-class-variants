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

const { recipe: configuredRecipe, styled: configuredStyled } = defineConfig();
const { recipe: configuredCoreRecipe } = defineCoreConfig();

const badgeConfig = defineRecipeConfig({
  base: ['badge', 'rounded-full'],
  variants: {
    tone: {
      info: 'bg-sky-500',
      danger: 'bg-rose-500',
    },
    size: {
      sm: 'text-sm',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    tone: 'info',
    size: 'sm',
  },
  compoundVariants: [
    {
      tone: 'danger',
      size: 'lg',
      className: ['tracking-wide'],
    },
  ],
});

const badge = recipe(badgeConfig);

badge();
badge({ tone: 'danger', size: 'lg' });

configuredRecipe({
  base: 'inline-flex',
  variants: {
    tone: {
      info: 'text-sky-500',
    },
  },
});

const coreOnlyBadge = configuredCoreRecipe({
  base: 'inline-flex',
  variants: {
    tone: {
      info: 'text-sky-700',
    },
  },
});
coreRecipe({
  base: 'inline-flex',
});
coreOnlyBadge({ tone: 'info' });
defineCoreRecipeConfig({
  base: 'inline-flex',
  variants: {
    tone: {
      info: 'text-sky-700',
    },
  },
});

const Button = styled('button', badge, { withRender: true });

type ButtonProps = Parameters<typeof Button>[0];
type _IntrinsicButtonType = Expect<
  Equal<ButtonProps['type'], 'button' | 'submit' | 'reset' | undefined>
>;
type _ResolvedButtonClassName = Expect<Equal<ReturnType<typeof badge>, string>>;

Button({
  tone: 'info',
  size: 'lg',
  ref: element => {
    const refType: Expect<Equal<typeof element, HTMLButtonElement | null>> =
      true;
    void refType;
  },
  render: props => {
    type _ClassName = Expect<Equal<typeof props.className, string>>;
    return <a {...props} href="/" />;
  },
  children: 'Link button',
});

const Input = configuredStyled(
  'input',
  recipe({
    variants: {
      size: {
        sm: 'text-sm',
        lg: 'text-lg',
      },
    },
  }),
  {
    nativeAliases: {
      size: 'htmlSize',
    },
  }
);

Input({
  size: 'sm',
  htmlSize: 20,
  value: 'variant input',
});

Input({
  // @ts-expect-error overlap keys are variant-first and require nativeAliases
  size: 20,
  value: 'typed input',
});

// @ts-expect-error invalid tone should fail in bundler projects too
Button({ tone: 'ghost' });

const multipartButtonRecipe = recipe({
  slots: {
    root: 'inline-flex',
    icon: 'size-4',
  },
  variants: {
    tone: {
      info: {
        root: 'bg-sky-500',
        icon: 'text-white',
      },
    },
  },
});

const MultipartButton = styled('button', multipartButtonRecipe, {
  compose: ({ Root, slots }) => (
    <Root className={slots.root()}>
      <span className={slots.icon()} />
    </Root>
  ),
});

MultipartButton({
  tone: 'info',
  className: 'px-4',
});

type BadgeOptions = RecipeInput<typeof badge>;
type BadgeConfig = RecipeConfigOf<typeof badge>;

const badgePrimary: BadgeOptions = {};
const badgeDanger: BadgeOptions = { tone: 'danger', size: 'lg' };
void badgePrimary;
void badgeDanger;
type _BadgeToneClass = Expect<
  Equal<NonNullable<BadgeConfig['variants']>['tone']['info'], 'bg-sky-500'>
>;
