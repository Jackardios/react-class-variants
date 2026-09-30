import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, type RefCallback } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { defineConfig, recipe } from '../src';

const { styled } = defineConfig();

describe('styled() render prop', () => {
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
    const strict = defineConfig({ validate: 'always' });
    const buttonRecipe = strict.recipe({
      base: 'inline-flex',
      variants: {
        tone: {
          primary: 'bg-blue',
        },
      },
    });
    const Button = strict.styled('button', buttonRecipe);
    const unsupportedRenderProp = { render: <a href="/docs" /> } as object;

    expect(() =>
      render(
        <Button tone="primary" {...unsupportedRenderProp}>
          Docs
        </Button>
      )
    ).toThrow(/withRender: true/);
  });

  it('accepts render={undefined} without withRender in strict mode', () => {
    const strict = defineConfig({ validate: 'always' });
    const Button = strict.styled(
      'button',
      strict.recipe({ base: 'inline-flex' })
    );
    // A wrapper that forwards its own optional render prop.
    const forwarded = { render: undefined } as object;

    render(<Button {...forwarded}>Docs</Button>);

    expect(screen.getByRole('button', { name: 'Docs' }).className).toBe(
      'inline-flex'
    );
  });

  describe('merge', () => {
    // A tailwind-merge stand-in: the last class of each prefix wins.
    const lastWins = (className: string) => {
      const byPrefix = new Map<string, string>();
      for (const token of className.split(' ').filter(Boolean)) {
        const prefix = token.split('-')[0];
        byPrefix.delete(prefix);
        byPrefix.set(prefix, token);
      }
      return [...byPrefix.values()].join(' ');
    };
    const merged = defineConfig({ merge: lastWins });
    const rootRecipe = merged.recipe({ base: 'px-2 bg-red' });
    const slotRecipe = merged.recipe({
      slots: { root: 'px-2 bg-red', icon: 'size-4' },
    });

    it('runs over the className of a render element', () => {
      const Link = merged.styled('button', rootRecipe, { withRender: true });

      render(<Link render={<a className="px-4" href="/docs" />}>Docs</Link>);

      expect(screen.getByRole('link', { name: 'Docs' }).className).toBe(
        'bg-red px-4'
      );
    });

    it('runs over a className added by host.render()', () => {
      const RootView = merged.styled('div', rootRecipe, {
        view: ({ host }) => host.render({ className: 'px-4' }),
      });
      const SlotView = merged.styled('div', slotRecipe, {
        view: ({ host }) => host.render({ className: ['px-6', 'bg-blue'] }),
      });

      render(
        <>
          <RootView data-testid="root" />
          <SlotView data-testid="slot" />
        </>
      );

      expect(screen.getByTestId('root').className).toBe('bg-red px-4');
      expect(screen.getByTestId('slot').className).toBe('px-6 bg-blue');
    });

    it('is not called again when nothing adds classes', () => {
      const merge = vi.fn(lastWins);
      const counted = defineConfig({ merge, cache: false });
      const View = counted.styled('div', counted.recipe({ base: 'px-2' }), {
        view: ({ host }) => host.render({ className: '' }),
      });

      render(<View data-testid="view" />);

      expect(screen.getByTestId('view').className).toBe('px-2');
      expect(merge).toHaveBeenCalledTimes(1);
    });
  });

  it('keeps merged render-prop refs identity-stable across re-renders', () => {
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
    const innerRef = vi.fn<RefCallback<HTMLAnchorElement>>();
    const outerRef = vi.fn<RefCallback<HTMLButtonElement>>();

    const view = render(
      <LinkButton
        ref={outerRef}
        tone="primary"
        render={<a ref={innerRef} href="/docs" />}
      >
        Docs
      </LinkButton>
    );

    expect(innerRef).toHaveBeenCalledTimes(1);
    expect(outerRef).toHaveBeenCalledTimes(1);

    view.rerender(
      <LinkButton
        ref={outerRef}
        tone="secondary"
        render={<a ref={innerRef} href="/docs" />}
      >
        Docs
      </LinkButton>
    );

    expect(innerRef).toHaveBeenCalledTimes(1);
    expect(innerRef).not.toHaveBeenCalledWith(null);
    expect(outerRef).toHaveBeenCalledTimes(1);
    expect(outerRef).not.toHaveBeenCalledWith(null);
  });

  it('runs React 19 ref cleanups for merged refs on unmount', () => {
    const linkRecipe = recipe({
      base: 'inline-flex',
      variants: {
        tone: {
          primary: 'text-blue-600',
        },
      },
    });
    const LinkButton = styled('button', linkRecipe, { withRender: true });
    const cleanup = vi.fn();
    const attach = vi.fn(() => cleanup);
    const outerRef = createRef<HTMLAnchorElement>();

    const view = render(
      <LinkButton
        ref={outerRef as never}
        tone="primary"
        render={<a ref={attach} href="/docs" />}
      >
        Docs
      </LinkButton>
    );

    expect(attach).toHaveBeenCalledTimes(1);
    expect(outerRef.current).toBe(screen.getByRole('link', { name: 'Docs' }));

    view.unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(attach).toHaveBeenCalledTimes(1);
    expect(outerRef.current).toBeNull();
  });

  it('passes render through a slotted host view', () => {
    const linkRecipe = recipe({
      slots: { root: 'inline-flex', icon: 'size-4' },
      variants: { tone: { primary: { root: 'text-blue-600' } } },
    });
    const LinkButton = styled('button', linkRecipe, {
      withRender: true,
      view: ({ host, classes }) =>
        host.render({
          children: (
            <>
              <span data-testid="icon" className={classes.icon()} />
              {host.children}
            </>
          ),
        }),
    });

    render(
      <LinkButton tone="primary" render={<a href="/docs" />}>
        Docs
      </LinkButton>
    );

    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link.className).toBe('inline-flex text-blue-600');
    expect(link.getAttribute('href')).toBe('/docs');
    expect(screen.getByTestId('icon').className).toBe('size-4');
  });
});
