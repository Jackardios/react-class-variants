import {
  defineConfig,
  defineRecipeConfig,
  recipe,
  styled,
  type RecipeConfigOf,
  type RecipeInput,
  type RootStyledViewProps,
  type SlotStyledViewProps,
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
const { recipe: strictConfiguredRecipe, styled: strictConfiguredStyled } =
  defineConfig({ validate: 'always' });

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
strictConfiguredRecipe({
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

const coreButtonRecipe = coreRecipe({
  base: 'inline-flex',
  variants: {
    tone: {
      info: 'text-sky-700',
      danger: 'text-rose-700',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

const CoreButton = styled('button', coreButtonRecipe, {
  withRender: true,
  forwardProps: ['disabled'],
});
const CoreViewButton = styled('button', coreButtonRecipe, {
  forwardProps: ['disabled'],
  view: ({
    host,
    variants,
  }: RootStyledViewProps<
    'button',
    typeof coreButtonRecipe,
    false,
    {},
    'disabled'
  >) => {
    type _CoreViewTone = Expect<Equal<typeof variants.tone, 'info' | 'danger'>>;
    type _CoreViewDisabled = Expect<Equal<typeof variants.disabled, boolean>>;
    type _CoreViewType = Expect<
      Equal<typeof host.props.type, 'button' | 'submit' | 'reset' | undefined>
    >;
    void (true as _CoreViewTone);
    void (true as _CoreViewDisabled);
    void (true as _CoreViewType);
    return host.render();
  },
});

CoreButton({
  tone: 'info',
  render: props => {
    type _CoreRenderClassName = Expect<Equal<typeof props.className, string>>;
    type _CoreRenderDisabled = Expect<Equal<typeof props.disabled, boolean>>;
    void (true as _CoreRenderDisabled);
    return <a {...props} href="/" />;
  },
});
CoreViewButton({ tone: 'danger' });

const coreFieldRecipe = coreRecipe({
  slots: {
    root: 'grid gap-2',
    label: 'text-sm',
    input: 'rounded-md',
  },
  variants: {
    invalid: {
      true: {
        label: 'text-red-700',
        input: 'border-red-500',
      },
    },
  },
  defaultVariants: {
    invalid: false,
  },
});

const CoreField = styled('label', coreFieldRecipe, {
  view: ({
    host,
    classes,
    variants,
  }: SlotStyledViewProps<'label', typeof coreFieldRecipe, false>) => {
    type _CoreFieldInvalid = Expect<Equal<typeof variants.invalid, boolean>>;
    type _CoreFieldRoot = Expect<
      Equal<ReturnType<typeof classes.root>, string>
    >;
    type _CoreFieldLabel = Expect<
      Equal<ReturnType<typeof classes.label>, string>
    >;
    type _CoreFieldInput = Expect<
      Equal<ReturnType<typeof classes.input>, string>
    >;
    void (true as _CoreFieldInvalid);
    void (true as _CoreFieldRoot);
    void (true as _CoreFieldLabel);
    void (true as _CoreFieldInput);
    return host.render({
      children: (
        <>
          <span className={classes.label()}>{host.children}</span>
          <input className={classes.input()} />
        </>
      ),
    });
  },
});

CoreField({
  invalid: true,
  slotClassNames: {
    input: 'w-full',
  },
  children: 'Email',
});

const Button = styled('button', badge, { withRender: true });
const StrictButton = strictConfiguredStyled('button', badge);

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
    // @ts-expect-error render props intentionally expose a broad spread-safe bag
    const renderType = props.type;
    void renderType;
    return <a {...props} href="/" />;
  },
  children: 'Link button',
});
StrictButton({ tone: 'info', size: 'sm', children: 'Strict button' });

const inputRecipe = recipe({
  variants: {
    size: {
      sm: 'text-sm',
      lg: 'text-lg',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

const Input = configuredStyled('input', inputRecipe, {
  withRender: true,
  forwardProps: ['disabled'],
  propAliases: {
    size: 'htmlSize',
  },
});

const resolvedInput = inputRecipe.resolve(
  {
    size: 'sm',
    htmlSize: 20,
    id: 'field',
  },
  {
    forwardProps: ['disabled'],
    propAliases: {
      size: 'htmlSize',
    },
  }
);

type _ResolvedInputClassName = Expect<
  Equal<typeof resolvedInput.resolvedProps.className, string>
>;
type _ResolvedInputSize = Expect<
  Equal<typeof resolvedInput.resolvedProps.size, number>
>;
type _ResolvedInputDisabled = Expect<
  Equal<typeof resolvedInput.resolvedProps.disabled, boolean>
>;
type _ResolvedInputId = Expect<
  Equal<typeof resolvedInput.resolvedProps.id, string>
>;

Input({
  size: 'sm',
  htmlSize: 20,
  value: 'variant input',
});

Input({
  size: 'sm',
  htmlSize: 20,
  disabled: true,
  render: props => {
    type _InputRenderClassName = Expect<Equal<typeof props.className, string>>;
    type _InputRenderDisabled = Expect<Equal<typeof props.disabled, boolean>>;
    return <a {...props} href="/" />;
  },
});

Input({
  // @ts-expect-error overlap keys are variant-first and require propAliases
  size: 20,
  value: 'typed input',
});

styled(
  // @ts-expect-error alias target must not collide with host props
  'a',
  recipe({
    variants: {
      tone: {
        info: 'text-sky-500',
      },
    },
  }),
  {
    propAliases: {
      href: 'id',
    },
  }
);

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
  view: ({ host, classes }) =>
    host.render({
      children: <span className={classes.icon()} />,
    }),
});

MultipartButton({
  tone: 'info',
  className: 'px-4',
});

// @ts-expect-error validate: 'dev' was removed; use validate: 'always' explicitly
defineConfig({ validate: 'dev' });

type BadgeOptions = RecipeInput<typeof badge>;
type BadgeConfig = RecipeConfigOf<typeof badge>;

const badgePrimary: BadgeOptions = {};
const badgeDanger: BadgeOptions = { tone: 'danger', size: 'lg' };
void badgePrimary;
void badgeDanger;
type _BadgeToneClass = Expect<
  Equal<NonNullable<BadgeConfig['variants']>['tone']['info'], 'bg-sky-500'>
>;
