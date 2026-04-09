import { defineConfig } from 'react-class-variants';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;
type Expect<T extends true> = T;

const { variantComponent } = defineConfig();

const Button = variantComponent('button', {
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
  forwardProps: ['tone'],
});

type ButtonProps = Parameters<typeof Button>[0];
type _IntrinsicButtonType = Expect<
  Equal<ButtonProps['type'], 'button' | 'submit' | 'reset' | undefined>
>;

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
    type _ForwardedTone = Expect<Equal<typeof props.tone, 'info' | 'danger'>>;

    // @ts-expect-error non-forwarded variant props must stay out of render props
    const leakedSize = props.size;
    void leakedSize;

    return <a {...props} href="/" />;
  },
  children: 'Link button',
});

const NoRenderButton = variantComponent('button', {
  variants: {
    tone: {
      info: 'bg-sky-500',
    },
  },
  withoutRenderProp: true,
});

NoRenderButton({
  tone: 'info',
  type: 'button',
  children: 'Plain button',
});

NoRenderButton({
  tone: 'info',
  // @ts-expect-error render is disabled when withoutRenderProp is true
  render: <a href="/" />,
});

// @ts-expect-error invalid tone should fail in bundler projects too
Button({ tone: 'ghost' });
