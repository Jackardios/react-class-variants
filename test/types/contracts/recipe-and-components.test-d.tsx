import type {
  ComponentPropsWithoutRef,
  HTMLInputTypeAttribute,
  ReactNode,
} from 'react';
import {
  expectAssignable,
  expectError,
  expectNotAssignable,
  expectType,
} from 'tsd';
import { recipe as coreRecipe } from '../../../dist/core';
import {
  defineConfig,
  recipe,
  styled,
  type RecipeResolved,
  type ResolveOptions,
  type ResolvedVariantProps,
  type RootStyledViewProps,
  type SlotNames,
  type SlotStyledViewProps,
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
const resolvedBadge = badge.resolve(
  {
    tone: 'danger',
    className: 'external',
    id: 'badge',
  },
  {
    forwardProps: ['disabled'],
  }
);

expectAssignable<BadgeVariants>({ tone: 'info' });
expectNotAssignable<BadgeVariants>({});
expectAssignable<BadgeResolvedVariants>({ tone: 'danger', disabled: false });
expectAssignable<BadgeResolved>({
  variants: { tone: 'info', disabled: false },
  resolvedProps: { className: 'inline-flex rounded-full bg-sky-100' },
});
expectType<string>(resolvedBadge.resolvedProps.className);
expectType<string>(resolvedBadge.resolvedProps.id);
expectType<boolean>(resolvedBadge.resolvedProps.disabled);
expectError(defineConfig({ validate: 'dev' }));
expectType<string>(
  defineConfig().recipe({
    base: 'inline-flex',
    variants: {
      tone: {
        info: 'text-sky-700',
      },
    },
    defaultVariants: {
      tone: 'info',
    },
  })()
);
expectType<string>(
  defineConfig({ validate: 'always' }).recipe({
    base: 'inline-flex',
    variants: {
      tone: {
        info: 'text-sky-700',
      },
    },
    defaultVariants: {
      tone: 'info',
    },
  })()
);

const coreBadge = coreRecipe({
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
});

const CoreBadgeButton = styled('button', coreBadge, {
  withRender: true,
  forwardProps: ['disabled'],
});
const CoreBadgeViewButton = styled('button', coreBadge, {
  view: ({
    host,
    variants,
  }: RootStyledViewProps<'button', typeof coreBadge, false>) => {
    expectType<'info' | 'danger'>(variants.tone);
    expectType<boolean>(variants.disabled);
    expectType<'button' | 'submit' | 'reset' | undefined>(host.props.type);
    return host.render({
      'data-tone': variants.tone,
      children: host.children,
    });
  },
});

expectType<ReactNode>(CoreBadgeViewButton({ tone: 'danger' }));

expectType<ReactNode>(
  CoreBadgeButton({
    tone: 'info',
    render: props => {
      expectType<string>(props.className);
      expectType<boolean>(props.disabled);
      return <a {...props} href="/" />;
    },
  })
);

const coreField = coreRecipe({
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

const CoreField = styled('label', coreField, {
  view: ({
    host,
    classes,
    variants,
  }: SlotStyledViewProps<'label', typeof coreField, false>) => {
    expectType<boolean>(variants.invalid);
    expectType<string>(classes.root());
    expectType<string>(classes.label());
    expectType<string>(classes.input());
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

expectType<ReactNode>(CoreField({ invalid: true, children: 'Email' }));

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
expectType<string>(resolvedButton.resolvedProps.className);
expectType<string>(resolvedButton.resolvedProps.id);

const inputRecipe = recipe({
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

const resolvedInput = inputRecipe.resolve(
  {
    size: 'md',
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

expectType<string>(resolvedInput.resolvedProps.className);
expectType<number>(resolvedInput.resolvedProps.size);
expectType<string>(resolvedInput.resolvedProps.id);
expectType<boolean>(resolvedInput.resolvedProps.disabled);

declare const dynamicResolveOptions: ResolveOptions<'size' | 'disabled'>;

const dynamicallyResolvedInput = inputRecipe.resolve(
  {
    size: 'md',
    htmlSize: 20,
    id: 'field',
  },
  dynamicResolveOptions
);

expectType<string>(dynamicallyResolvedInput.resolvedProps.className);
expectType<number>(dynamicallyResolvedInput.resolvedProps.htmlSize);
expectType<string>(dynamicallyResolvedInput.resolvedProps.id);
expectType<'sm' | 'md' | undefined>(
  dynamicallyResolvedInput.resolvedProps.size
);
expectType<boolean | undefined>(
  dynamicallyResolvedInput.resolvedProps.disabled
);

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
  view: ({
    host,
    variants,
  }: RootStyledViewProps<'button', typeof badge, false>) => {
    expectType<'info' | 'danger'>(variants.tone);
    expectType<boolean>(variants.disabled);
    expectType<string>(host.className);
    expectType<'button' | 'submit' | 'reset' | undefined>(host.props.type);

    return host.render({
      'data-tone': variants.tone,
      children: host.children,
    });
  },
});

expectType<ReactNode>(
  Badge({ tone: 'info', type: 'button', children: 'Press' })
);
expectError(Badge({ children: 'Missing tone' }));
expectError(Badge({ tone: 'info', render: <a href="/" /> }));

const LinkBadge = styled('button', badge, {
  withRender: true,
  view: ({ host }: RootStyledViewProps<'button', typeof badge, true>) =>
    host.render({
      children: host.children,
    }),
});
expectType<ReactNode>(
  LinkBadge({
    tone: 'danger',
    render: props => {
      expectType<string>(props.className);
      expectError(props.type);
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

const RouterLink = (props: { to: string } & ComponentPropsWithoutRef<'a'>) =>
  null;

const RoutedBadge = styled(RouterLink, badge);

expectType<ReactNode>(
  RoutedBadge({
    tone: 'info',
    to: '/docs',
    children: 'Docs',
  })
);
expectError(
  styled(RouterLink, badge, {
    withRender: true,
  })
);
expectError(
  RoutedBadge({
    tone: 'info',
    to: '/docs',
    render: <a href="/" />,
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
    propAliases: {
      size: 'htmlSize',
    },
  }
);

const viewedInputRecipe = recipe({
  variants: {
    tone: {
      info: 'text-sky-700',
      danger: 'text-rose-700',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

const ViewedInput = styled('input', viewedInputRecipe, {
  withRender: true,
  forwardProps: ['disabled'],
  propAliases: {
    size: 'htmlSize',
  },
  view: ({
    host,
  }: RootStyledViewProps<
    'input',
    typeof viewedInputRecipe,
    true,
    { size: 'htmlSize' },
    'disabled'
  >) => {
    expectType<HTMLInputTypeAttribute | undefined>(host.props.type);
    expectType<number | undefined>(host.props.size);
    expectType<boolean>(host.props.disabled);
    expectError(host.props.htmlSize);

    return host.render();
  },
});

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
      propAliases: {
        className: 'htmlClass',
      },
    }
  )
);

expectError(
  styled(
    'a',
    recipe({
      variants: {
        tone: {
          info: 'text-sky-700',
        },
      },
    }),
    {
      propAliases: {
        href: 'id',
      },
    }
  )
);

const RouterLinkWithHref = (
  props: { to: string; href?: string } & ComponentPropsWithoutRef<'a'>
) => null;

expectError(
  styled(RouterLinkWithHref, badge, {
    propAliases: {
      href: 'to',
    },
  })
);

expectError(
  styled(
    'input',
    recipe({
      variants: {
        tone: {
          info: 'text-sky-700',
        },
        size: {
          sm: 'text-sm',
        },
      },
    }),
    {
      propAliases: {
        size: 'tone',
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
  ViewedInput({
    tone: 'info',
    size: 'sm',
    disabled: true,
    htmlSize: 12,
    type: 'number',
    render: props => {
      expectType<string>(props.className);
      expectType<boolean>(props.disabled);
      expectError(props.type);
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
  view: ({
    host,
    classes,
    variants,
  }: SlotStyledViewProps<
    'button',
    typeof buttonRecipe,
    true,
    {},
    'loading'
  >) => {
    expectType<'primary' | 'ghost'>(variants.tone);
    expectType<boolean>(variants.loading);
    expectType<boolean>(host.props.loading);
    expectType<string>(host.className);
    expectType<string>(classes.root());
    expectType<string>(classes.icon({ tone: 'ghost' }));
    expectError(classes.icon({ tone: 'danger' }));

    return host.render({
      'aria-busy': variants.loading || undefined,
      children: (
        <>
          <span className={classes.icon()} />
          <span className={classes.label()}>{host.children}</span>
        </>
      ),
    });
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

expectError(
  styled('label', fieldRecipe, {
    view: ({ host }) => host.render({ children: host.children }),
  })
);

styled('label', fieldRecipe, {
  hostSlot: 'label',
  view: ({
    host,
    classes: fieldClasses,
  }: SlotStyledViewProps<'label', typeof fieldRecipe, false>) => {
    expectType<string>(fieldClasses.label());
    expectType<string>(fieldClasses.input());
    expectError(fieldClasses.root());

    return host.render({
      children: (
        <>
          <input className={fieldClasses.input()} />
          {host.children}
        </>
      ),
    });
  },
});
