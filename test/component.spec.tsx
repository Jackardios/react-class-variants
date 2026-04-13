import { fireEvent, render, screen } from '@testing-library/react';
import {
  createRef,
  forwardRef,
  useEffect,
  type ComponentPropsWithoutRef,
} from 'react';
import { describe, expect, it, vi } from 'vitest';
import { defineConfig, recipe, styled, type RootStyledViewProps } from '../src';

describe('styled()', () => {
  it('renders root recipes through the simple fast path', () => {
    const buttonRecipe = recipe({
      base: 'inline-flex items-center',
      variants: {
        tone: {
          primary: 'bg-blue text-white',
          ghost: 'bg-transparent text-slate-900',
        },
      },
    });
    const Button = styled('button', buttonRecipe);

    render(
      <Button tone="primary" type="button">
        Press
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Press' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button.className).toBe(
      'inline-flex items-center bg-blue text-white'
    );
  });

  it('supports root view components as the advanced path', () => {
    const badgeRecipe = recipe({
      base: 'inline-flex',
      variants: {
        tone: {
          info: 'bg-sky-100',
        },
      },
    });

    function BadgeView({
      host,
      variants,
    }: RootStyledViewProps<'span', typeof badgeRecipe, false>) {
      return host.render({
        'data-tone': variants.tone,
        children: host.children,
      });
    }

    const Badge = styled('span', badgeRecipe, {
      view: BadgeView,
    });

    render(<Badge tone="info">Info</Badge>);

    const badge = screen.getByText('Info');
    expect(badge).toHaveAttribute('data-tone', 'info');
    expect(badge.className).toBe('inline-flex bg-sky-100');
  });

  it('supports custom component bases', () => {
    const buttonRecipe = recipe({
      base: 'inline-flex items-center',
      variants: {
        tone: {
          primary: 'bg-blue text-white',
        },
      },
    });
    const BaseButton = forwardRef<
      HTMLButtonElement,
      ComponentPropsWithoutRef<'button'>
    >(function BaseButton(props, ref) {
      return <button {...props} ref={ref} data-base="yes" />;
    });
    const Button = styled(BaseButton, buttonRecipe);

    render(
      <Button tone="primary" type="button">
        Press
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Press' });
    expect(button).toHaveAttribute('data-base', 'yes');
    expect(button.className).toBe(
      'inline-flex items-center bg-blue text-white'
    );
  });

  it('rejects withRender for custom component bases', () => {
    const buttonRecipe = recipe({
      base: 'inline-flex',
      variants: {
        tone: {
          primary: 'bg-blue',
        },
      },
    });
    const BaseButton = forwardRef<
      HTMLButtonElement,
      ComponentPropsWithoutRef<'button'>
    >(function BaseButton(props, ref) {
      return <button {...props} ref={ref} />;
    });

    expect(() =>
      styled(BaseButton, buttonRecipe, { withRender: true } as never)
    ).toThrow(/intrinsic base elements/);
  });

  it('keeps render polymorphism opt-in and supports element/function render', () => {
    const linkRecipe = recipe({
      base: 'inline-flex',
      variants: {
        tone: {
          primary: 'text-blue-600',
        },
      },
    });
    const LinkButton = styled('button', linkRecipe, { withRender: true });
    const userClick = vi.fn();
    const renderClick = vi.fn(event => event.preventDefault());
    const innerRef = createRef<HTMLAnchorElement>();
    let outerNode: HTMLButtonElement | null = null;

    render(
      <LinkButton
        ref={node => {
          outerNode = node;
        }}
        tone="primary"
        className="w-full"
        onClick={userClick}
        render={
          <a
            ref={innerRef}
            href="/docs"
            className="underline"
            onClick={renderClick}
          />
        }
      >
        Docs
      </LinkButton>
    );

    const link = screen.getByRole('link', { name: 'Docs' });
    fireEvent.click(link);

    expect(link.className).toBe('inline-flex text-blue-600 w-full underline');
    expect(renderClick).toHaveBeenCalledTimes(1);
    expect(userClick).toHaveBeenCalledTimes(1);
    expect(outerNode).toBe(link);
    expect(innerRef.current).toBe(link);

    const FunctionLink = styled('button', linkRecipe, { withRender: true });
    const spy = vi.fn();

    render(
      <FunctionLink
        tone="primary"
        render={props => {
          spy(props);
          return <a {...props} href="/fn" />;
        }}
      >
        Fn
      </FunctionLink>
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'inline-flex text-blue-600',
      })
    );
    expect(screen.getByRole('link', { name: 'Fn' })).toHaveAttribute(
      'href',
      '/fn'
    );
  });

  it('calls render prop functions and elements once per React render', () => {
    const linkRecipe = recipe({
      base: 'inline-flex',
      variants: {
        tone: {
          primary: 'text-blue-600',
          secondary: 'text-slate-900',
        },
      },
    });
    const LinkButton = styled('button', linkRecipe, { withRender: true });
    const renderFn = vi.fn((props: Record<string, unknown>) => (
      <a {...props} href="/fn" />
    ));

    const functionResult = render(
      <LinkButton tone="primary" render={renderFn}>
        Fn
      </LinkButton>
    );

    expect(renderFn).toHaveBeenCalledTimes(1);

    functionResult.rerender(
      <LinkButton tone="primary" render={renderFn}>
        Fn
      </LinkButton>
    );
    expect(renderFn).toHaveBeenCalledTimes(2);

    functionResult.rerender(
      <LinkButton tone="secondary" render={renderFn}>
        Fn
      </LinkButton>
    );
    expect(renderFn).toHaveBeenCalledTimes(3);
    functionResult.unmount();

    const elementProbe = vi.fn((props: Record<string, unknown>) => (
      <a {...props} href="/element" />
    ));
    const ElementProbe = elementProbe;
    const elementResult = render(
      <LinkButton tone="primary" render={<ElementProbe />}>
        Element
      </LinkButton>
    );

    expect(elementProbe).toHaveBeenCalledTimes(1);

    elementResult.rerender(
      <LinkButton tone="secondary" render={<ElementProbe />}>
        Element
      </LinkButton>
    );
    expect(elementProbe).toHaveBeenCalledTimes(2);
  });

  it('rejects render when withRender is disabled', () => {
    const buttonRecipe = recipe({
      base: 'inline-flex',
      variants: {
        tone: {
          primary: 'bg-blue',
        },
      },
    });
    const Button = styled('button', buttonRecipe);
    const unsupportedRenderProp = { render: <a href="/docs" /> } as object;

    expect(() =>
      render(
        <Button tone="primary" {...unsupportedRenderProp}>
          Docs
        </Button>
      )
    ).toThrow(/withRender: true/);
  });

  it('supports propAliases and forwardProps', () => {
    const inputRecipe = recipe({
      base: 'block rounded-md',
      variants: {
        size: {
          sm: 'text-sm',
          md: 'text-base',
        },
        disabled: {
          true: 'opacity-50',
        },
      },
    });
    const Input = styled('input', inputRecipe, {
      forwardProps: ['disabled'],
      propAliases: {
        size: 'htmlSize',
      },
    });

    render(<Input size="sm" htmlSize={8} disabled value="Hello" readOnly />);

    const input = screen.getByDisplayValue('Hello');
    expect(input).toHaveAttribute('size', '8');
    expect(input).toBeDisabled();
    expect(input.className).toBe('block rounded-md text-sm opacity-50');
  });

  it('rejects reserved prop alias targets on the React surface', () => {
    const strict = defineConfig({ validate: 'always' });
    const inputRecipe = strict.recipe({
      variants: {
        size: {
          sm: 'text-sm',
        },
      },
    });

    expect(() =>
      strict.styled('input', inputRecipe, {
        propAliases: {
          className: 'htmlClass',
        },
      } as never)
    ).toThrow(/prop alias target "className" conflicts with a reserved/);
  });

  it('requires a view component for slotted recipes and routes className to the host slot', () => {
    const buttonRecipe = recipe({
      slots: {
        root: 'inline-flex items-center gap-2',
        label: 'transition-opacity',
        spinner: 'hidden size-4',
      },
      variants: {
        tone: {
          primary: {
            root: 'bg-blue text-white',
            spinner: 'text-blue-100',
          },
        },
        loading: {
          true: {
            label: 'opacity-0',
            spinner: 'inline-block animate-spin',
          },
        },
        disabled: {
          true: {
            root: 'opacity-50',
          },
        },
      },
      defaultVariants: {
        tone: 'primary',
        loading: false,
      },
    });

    expect(() => styled('button', buttonRecipe as never)).toThrow(
      /slotted recipes require a view component/
    );

    const Button = styled('button', buttonRecipe, {
      forwardProps: ['disabled'],
      view({ host, variants, classes }) {
        return host.render({
          'aria-busy': variants.loading || undefined,
          disabled: Boolean(host.props.disabled) || variants.loading,
          children: (
            <>
              {variants.loading ? (
                <span data-testid="spinner" className={classes.spinner()} />
              ) : null}
              <span data-testid="label" className={classes.label()}>
                {host.children}
              </span>
            </>
          ),
        });
      },
    });

    render(
      <Button loading disabled className="rounded-md">
        Save
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.className).toBe(
      'inline-flex items-center gap-2 bg-blue text-white opacity-50 rounded-md'
    );
    expect(screen.getByTestId('spinner').className).toBe(
      'hidden size-4 text-blue-100 inline-block animate-spin'
    );
    expect(screen.getByTestId('label').className).toBe(
      'transition-opacity opacity-0'
    );
  });

  it('supports slotted views without a root slot through hostSlot', () => {
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

    expect(() =>
      styled('label', fieldRecipe, {
        view() {
          return null;
        },
      } as never)
    ).toThrow(/require hostSlot/);

    const Field = styled('label', fieldRecipe, {
      hostSlot: 'label',
      view({ host, classes }) {
        return host.render({
          children: (
            <>
              <input aria-label="field" className={classes.input()} />
              {host.children}
            </>
          ),
        });
      },
    });

    render(
      <Field invalid className="font-medium">
        Email
      </Field>
    );

    expect(screen.getByText('Email').className).toBe(
      'block text-sm text-red-700 font-medium'
    );
    expect(screen.getByLabelText('field').className).toBe(
      'block rounded-md border-red-500'
    );
  });

  it('lets slotted view classes be safely destructured', () => {
    const buttonRecipe = recipe({
      slots: {
        root: 'inline-flex items-center gap-2',
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
            icon: 'text-slate-500',
          },
        },
      },
      defaultVariants: {
        tone: 'primary',
      },
    });

    const Button = styled('button', buttonRecipe, {
      view({ host, classes }) {
        const { icon, label } = classes;

        return host.render({
          children: (
            <>
              <span data-testid="icon" className={icon({ tone: 'ghost' })} />
              <span data-testid="label" className={label()}>
                {host.children}
              </span>
            </>
          ),
        });
      },
    });

    render(<Button tone="primary">Save</Button>);

    expect(screen.getByTestId('icon').className).toBe('size-4 text-slate-500');
    expect(screen.getByTestId('label').className).toBe('truncate');
  });

  it('normalizes className arrays passed to host.render overrides', () => {
    const buttonRecipe = recipe({
      base: 'inline-flex items-center',
      variants: {
        tone: {
          primary: 'bg-blue text-white',
        },
      },
    });

    const Button = styled('button', buttonRecipe, {
      view({ host }) {
        return host.render({
          className: ['rounded-md', 'px-4'],
          children: host.children,
        });
      },
    });

    render(<Button tone="primary">Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' }).className).toBe(
      'inline-flex items-center bg-blue text-white rounded-md px-4'
    );
  });

  it('keeps view-based components stable across rerenders', () => {
    const buttonRecipe = recipe({
      base: 'inline-flex items-center',
      variants: {
        tone: {
          primary: 'bg-blue text-white',
          ghost: 'bg-transparent text-slate-900',
        },
      },
    });
    let mounts = 0;
    let unmounts = 0;

    function Probe() {
      useEffect(() => {
        mounts += 1;
        return () => {
          unmounts += 1;
        };
      }, []);

      return <span data-testid="probe" />;
    }

    const Button = styled('button', buttonRecipe, {
      view({ host }) {
        return host.render({
          children: (
            <>
              <Probe />
              {host.children}
            </>
          ),
        });
      },
    });

    const view = render(<Button tone="primary">Save</Button>);
    const firstButton = screen.getByRole('button', { name: 'Save' });

    view.rerender(<Button tone="primary">Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBe(firstButton);

    view.rerender(<Button tone="ghost">Save</Button>);
    const rerenderedButton = screen.getByRole('button', { name: 'Save' });
    expect(rerenderedButton).toBe(firstButton);
    expect(rerenderedButton.className).toBe(
      'inline-flex items-center bg-transparent text-slate-900'
    );
    expect(mounts).toBe(1);
    expect(unmounts).toBe(0);

    view.unmount();
    expect(unmounts).toBe(1);
  });
});
