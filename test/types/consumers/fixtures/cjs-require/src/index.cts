import { createElement } from 'react';
import rcv = require('react-class-variants');

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;
type Expect<T extends true> = T;

const { recipe: configuredRecipe, styled: configuredStyled } =
  rcv.defineConfig();

const link = rcv.recipe({
  variants: {
    intent: {
      primary: 'text-blue-600',
      secondary: 'text-slate-700',
    },
    underline: {
      true: 'underline',
    },
  },
});

type LinkOptions = rcv.RecipeInput<typeof link>;
const linkPrimary: LinkOptions = { intent: 'primary' };
const linkSecondary: LinkOptions = { intent: 'secondary', underline: true };
void linkPrimary;
void linkSecondary;

configuredRecipe({
  base: 'inline-flex',
  variants: {
    intent: {
      primary: 'text-blue-600',
    },
  },
});

const Button = rcv.styled(
  'button',
  rcv.recipe({
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
  }),
  {
    withRender: true,
  }
);

Button({
  intent: 'primary',
  size: 'lg',
  render: props => {
    type _RenderClassName = Expect<Equal<typeof props.className, string>>;
    return createElement('a', { ...props, href: '/' });
  },
});

const Input = configuredStyled(
  'input',
  rcv.recipe({
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
  value: 'variant size',
});

Input({
  // @ts-expect-error overlap keys are variant-first and require nativeAliases
  size: 20,
  value: 'native size',
});

link({ intent: 'primary', underline: true });

// @ts-expect-error invalid variant value must fail from require() consumers
link({ intent: 'ghost' });

const multipartButtonRecipe = rcv.recipe({
  slots: {
    root: 'inline-flex',
    icon: 'size-4',
  },
  variants: {
    intent: {
      primary: {
        root: 'text-blue-600',
        icon: 'text-blue-300',
      },
    },
  },
});

const MultipartButton = rcv.styled('button', multipartButtonRecipe, {
  compose: ({ Root, slots }) =>
    createElement(
      Root,
      { className: slots.root() },
      createElement('span', { className: slots.icon() })
    ),
});

MultipartButton({
  intent: 'primary',
  className: 'px-4',
});
