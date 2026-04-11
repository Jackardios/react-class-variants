import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { defineConfig, recipe, styled } from '../src';

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

  it('supports root custom compose as an advanced path', () => {
    const badgeRecipe = recipe({
      base: 'inline-flex',
      variants: {
        tone: {
          info: 'bg-sky-100',
        },
      },
    });
    const Badge = styled('span', badgeRecipe, {
      compose: ({ Root, variants }, { children, ...props }) => (
        <Root {...props} data-tone={variants.tone}>
          {children}
        </Root>
      ),
    });

    render(<Badge tone="info">Info</Badge>);

    const badge = screen.getByText('Info');
    expect(badge).toHaveAttribute('data-tone', 'info');
    expect(badge.className).toBe('inline-flex bg-sky-100');
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

  it('supports nativeAliases and forwardProps', () => {
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
      nativeAliases: {
        size: 'htmlSize',
      },
    });

    render(<Input size="sm" htmlSize={8} disabled value="Hello" readOnly />);

    const input = screen.getByDisplayValue('Hello');
    expect(input).toHaveAttribute('size', '8');
    expect(input).toBeDisabled();
    expect(input.className).toBe('block rounded-md text-sm opacity-50');
  });

  it('rejects reserved native alias targets on the React surface', () => {
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
        nativeAliases: {
          className: 'htmlClass',
        },
      } as never)
    ).toThrow(/native alias target "className" conflicts with a reserved/);
  });

  it('requires compose for slotted recipes and lets compose own className routing', () => {
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
      /slotted recipes require a compose callback/
    );

    const Button = styled('button', buttonRecipe, {
      forwardProps: ['disabled'],
      compose: (
        { Root, variants, slots },
        { className, children, ...resolvedProps }
      ) => (
        <Root
          {...resolvedProps}
          className={slots.root({ className })}
          aria-busy={variants.loading || undefined}
          disabled={variants.disabled || variants.loading}
        >
          {variants.loading ? (
            <span data-testid="spinner" className={slots.spinner()} />
          ) : null}
          <span data-testid="label" className={slots.label()}>
            {children}
          </span>
        </Root>
      ),
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

  it('supports slotted compose without a root slot', () => {
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
    const Field = styled('label', fieldRecipe, {
      compose: ({ Root, slots }, { className, children, ...props }) => (
        <Root {...props} className={slots.label({ className })}>
          <input aria-label="field" className={slots.input()} />
          {children}
        </Root>
      ),
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
});
