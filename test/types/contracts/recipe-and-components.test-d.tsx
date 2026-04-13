import type { HTMLInputTypeAttribute, ReactNode } from 'react';
import {
  expectAssignable,
  expectError,
  expectNotAssignable,
  expectType,
} from 'tsd';
import {
  recipe,
  styled,
  type RecipeResolved,
  type ResolvedVariantProps,
  type SlotNames,
  type VariantProps,
} from '../../../dist';

const badge = recipe({
  base: 'inline-flex rounded-full',
  variants: {
    tone: {
      info: 'bg-sky-100',
      danger: 'bg-rose-100',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  defaultVariants: {
    disabled: false,
  },
  compoundVariants: [
    {
      tone: ['info', 'danger'],
      disabled: true,
      className: 'ring-1',
    },
  ],
});

expectType<string>(badge({ tone: 'info' }));
expectType<string>(
  badge({ tone: 'danger', disabled: true, className: 'px-2' })
);
expectError(badge({}));
expectError(badge({ tone: 'warning' }));
expectError(
  recipe({
    base: 'inline-flex',
    variants: {
      tone: {
        info: 'bg-sky-100',
      },
    },
    compoundVariants: [
      {
        tone: 'info',
        class: 'ring-1',
      },
    ],
  })
);

expectError(
  recipe({
    base: 'inline-flex',
    variants: {
      state: {
        true: 'is-true',
        idle: 'is-idle',
      },
    },
  })
);

type BadgeVariants = VariantProps<typeof badge>;
type BadgeResolvedVariants = ResolvedVariantProps<typeof badge>;
type BadgeResolved = RecipeResolved<typeof badge>;

expectAssignable<BadgeVariants>({ tone: 'info' });
expectNotAssignable<BadgeVariants>({});
expectAssignable<BadgeResolvedVariants>({ tone: 'danger', disabled: false });
expectAssignable<BadgeResolved>({
  variants: { tone: 'info', disabled: false },
  resolvedProps: { className: 'inline-flex rounded-full bg-sky-100' },
});

const buttonRecipe = recipe({
  slots: {
    root: 'inline-flex items-center',
    icon: 'size-4',
    label: 'truncate',
  },
  variants: {
    tone: {
      primary: {
        root: 'bg-blue text-white',
        icon: 'text-blue-100',
      },
      ghost: {
        root: 'bg-transparent text-slate-900',
      },
    },
    loading: {
      true: {
        label: 'opacity-0',
      },
    },
  },
  defaultVariants: {
    tone: 'primary',
    loading: false,
  },
  compoundVariants: [
    {
      tone: 'primary',
      loading: true,
      className: {
        root: 'cursor-wait',
        icon: 'animate-spin',
      },
    },
  ],
});

const slots = buttonRecipe({ tone: 'ghost' });
expectType<string>(slots.root());
expectType<string>(slots.icon({ tone: 'primary', className: 'text-red-500' }));
expectType<string>(slots.label({ loading: true }));
expectType<string>(buttonRecipe().root());
expectError(buttonRecipe({ tone: 'primary', className: 'px-4' }));
expectError(slots.icon({ tone: 'danger' }));

const resolvedButton = buttonRecipe.resolve({
  tone: 'primary',
  className: 'external',
  id: 'save',
});
expectType<string>(resolvedButton.slots.icon());
expectType<unknown>(resolvedButton.resolvedProps.className);

type ButtonVariants = VariantProps<typeof buttonRecipe>;
type ButtonResolvedVariants = ResolvedVariantProps<typeof buttonRecipe>;
type ButtonSlots = SlotNames<typeof buttonRecipe>;
type ButtonResolved = RecipeResolved<typeof buttonRecipe>;

expectAssignable<ButtonVariants>({ tone: 'ghost' });
expectAssignable<ButtonVariants>({ loading: true });
expectNotAssignable<ButtonVariants>({ tone: 'danger' });
expectAssignable<ButtonResolvedVariants>({ tone: 'primary', loading: false });
expectAssignable<ButtonSlots>('root');
expectAssignable<ButtonSlots>('icon');
expectAssignable<ButtonSlots>('label');
expectAssignable<ButtonResolved>({
  variants: { tone: 'ghost', loading: false },
  slots,
  resolvedProps: {},
});

expectError(
  recipe({
    slots: {
      root: 'inline-flex',
      icon: 'size-4',
    },
    variants: {
      tone: {
        primary: 'bg-blue text-white',
      },
    },
  })
);

expectError(
  recipe({
    slots: {
      root: 'inline-flex',
    },
    variants: {
      state: {
        true: {
          root: 'is-true',
        },
        idle: {
          root: 'is-idle',
        },
      },
    },
  })
);

expectError(
  recipe({
    slots: {
      root: 'inline-flex',
    },
    variants: {
      tone: {
        primary: {
          root: 'bg-blue',
        },
      },
    },
    compoundVariants: [
      {
        tone: 'primary',
        className: 'ring-1',
      },
    ],
  })
);

const Badge = styled('button', badge, {
  compose: ({ Root, variants }, { className, children, ...props }) => {
    expectType<'info' | 'danger'>(variants.tone);
    expectType<boolean>(variants.disabled);
    expectType<string>(className);

    return (
      <Root {...props} className={className} data-tone={variants.tone}>
        {children}
      </Root>
    );
  },
});

expectType<ReactNode>(
  Badge({ tone: 'info', type: 'button', children: 'Press' })
);
expectError(Badge({ children: 'Missing tone' }));
expectError(Badge({ tone: 'info', render: <a href="/" /> }));

const LinkBadge = styled('button', badge, { withRender: true });
expectType<ReactNode>(
  LinkBadge({
    tone: 'danger',
    render: props => {
      expectType<string>(props.className);
      return <a {...props} href="/" />;
    },
    children: 'Link',
  })
);
expectType<ReactNode>(
  LinkBadge({
    tone: 'danger',
    render: <a href="/" />,
    children: 'Link',
  })
);

const Input = styled(
  'input',
  recipe({
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
      },
      disabled: {
        true: 'opacity-50',
      },
    },
  }),
  {
    forwardProps: ['disabled'],
    nativeAliases: {
      size: 'htmlSize',
    },
  }
);

const ComposedInput = styled(
  'input',
  recipe({
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
  }),
  {
    withRender: true,
    forwardProps: ['disabled'],
    nativeAliases: {
      size: 'htmlSize',
    },
    compose: ({ Root }, props) => {
      expectType<HTMLInputTypeAttribute | undefined>(props.type);
      expectType<number | undefined>(props.size);
      expectType<boolean>(props.disabled);
      expectError(props.htmlSize);

      return <Root {...props} />;
    },
  }
);

expectError(
  styled(
    'input',
    recipe({
      variants: {
        size: {
          sm: 'text-sm',
        },
      },
    }),
    {
      nativeAliases: {
        className: 'htmlClass',
      },
    }
  )
);

expectType<ReactNode>(
  Input({
    size: 'sm',
    htmlSize: 12,
    disabled: true,
    value: 'Hello',
    readOnly: true,
  })
);
expectType<ReactNode>(
  ComposedInput({
    tone: 'info',
    disabled: true,
    htmlSize: 12,
    type: 'number',
    render: props => {
      expectType<string>(props.className);
      return <a {...props} href="/" />;
    },
  })
);
expectError(
  Input({
    size: 12,
    value: 'Hello',
  })
);

const SlottedButton = styled('button', buttonRecipe, {
  withRender: true,
  forwardProps: ['loading'],
  compose: ({ Root, slots: buttonSlots, variants }, props) => {
    const { className, children, ...resolvedProps } = props;

    expectType<'primary' | 'ghost'>(variants.tone);
    expectType<boolean>(variants.loading);
    expectType<boolean>(props.loading);
    expectType<string>(buttonSlots.root({ className }));
    expectType<string>(buttonSlots.icon({ tone: 'ghost' }));
    expectError(buttonSlots.icon({ tone: 'danger' }));

    return (
      <Root
        {...resolvedProps}
        className={buttonSlots.root({ className })}
        aria-busy={variants.loading || undefined}
        disabled={variants.loading}
      >
        <span className={buttonSlots.icon()} />
        <span className={buttonSlots.label()}>{children}</span>
      </Root>
    );
  },
});

expectType<ReactNode>(
  SlottedButton({
    tone: 'primary',
    className: 'px-4',
    render: <a href="/" />,
    children: 'Save',
  })
);
expectError(styled('button', buttonRecipe));

const fieldRecipe = recipe({
  slots: {
    label: 'block text-sm',
    input: 'block rounded-md',
  },
  variants: {
    invalid: {
      true: {
        label: 'text-red-700',
        input: 'border-red-500',
      },
    },
  },
});

styled('label', fieldRecipe, {
  compose: ({ Root, slots: fieldSlots }) => {
    expectType<string>(fieldSlots.label());
    expectType<string>(fieldSlots.input());
    expectError(fieldSlots.root());

    return <Root className={fieldSlots.label()} />;
  },
});
