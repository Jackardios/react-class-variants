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
});
