import { render, screen } from '@testing-library/react';
import { createRef, useEffect, type RefCallback } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  defineConfig,
  defineViewProps,
  recipe,
  type RootStyledViewProps,
} from '../src';

const { styled } = defineConfig();

describe('styled() view components', () => {
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

  it('supports viewProps on intrinsic bases without leaking consumed props to the DOM', () => {
    const buttonRecipe = recipe({
      slots: {
        root: 'inline-flex items-center gap-2',
        icon: 'size-4',
        label: 'truncate',
        shortcut: 'text-xs opacity-70',
      },
      variants: {
        tone: {
          primary: {
            root: 'bg-blue text-white',
            icon: 'text-blue-100',
          },
        },
      },
      defaultVariants: {
        tone: 'primary',
      },
    });

    function StartIcon({ className }: { className?: string }) {
      return <svg data-testid="start-icon" className={className} />;
    }

    const Button = styled('button', buttonRecipe, {
      viewProps: defineViewProps<{
        icon?: typeof StartIcon;
        shortcut?: { key: string };
      }>('icon', 'shortcut'),
      view({ host, classes }) {
        const { icon: Icon, shortcut } = host.props;

        return host.render({
          'data-shortcut': shortcut?.key,
          children: (
            <>
              {Icon ? <Icon className={classes.icon()} /> : null}
              <span className={classes.label()}>{host.children}</span>
              {shortcut ? (
                <kbd className={classes.shortcut()}>{shortcut.key}</kbd>
              ) : null}
            </>
          ),
        });
      },
    });

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      render(
        <Button icon={StartIcon} shortcut={{ key: 'K' }}>
          Save
        </Button>
      );

      const button = screen.getByRole('button', { name: /Save/ });
      expect(button).toHaveAttribute('data-shortcut', 'K');
      expect(button).not.toHaveAttribute('icon');
      expect(button).not.toHaveAttribute('shortcut');
      expect(screen.getByTestId('start-icon')).toHaveAttribute(
        'class',
        'size-4 text-blue-100'
      );
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('keeps viewProps out of render targets when withRender is enabled', () => {
    const buttonRecipe = recipe({
      base: 'inline-flex items-center',
      variants: {
        loading: {
          true: 'opacity-50',
          false: null,
        },
      },
      defaultVariants: {
        loading: false,
      },
    });

    const renderSpy = vi.fn((props: Record<string, unknown>) => (
      <a className={String(props.className)} href="/docs">
        {props.children as string}
      </a>
    ));

    const Button = styled('button', buttonRecipe, {
      withRender: true,
      forwardProps: ['loading'],
      viewProps: defineViewProps<{
        shortcut?: string;
      }>('shortcut'),
      view({ host, variants }) {
        expect(host.props.shortcut).toBe('K');
        expect(host.props.loading).toBe(true);

        return host.render({
          'data-shortcut': host.props.shortcut,
          'aria-busy': variants.loading || undefined,
        });
      },
    });

    render(
      <Button loading shortcut="K" render={renderSpy}>
        Docs
      </Button>
    );

    expect(renderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'inline-flex items-center opacity-50',
        'aria-busy': true,
        'data-shortcut': 'K',
        loading: true,
      })
    );
    expect(renderSpy.mock.calls[0]?.[0]).not.toHaveProperty('shortcut');
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute(
      'href',
      '/docs'
    );
  });

  it('rejects viewProps keys that conflict with declared variants in strict mode', () => {
    const strict = defineConfig({ validate: 'always' });
    const buttonRecipe = strict.recipe({
      variants: {
        icon: {
          true: 'opacity-50',
        },
      },
    });

    expect(() =>
      strict.styled('button', buttonRecipe, {
        viewProps: defineViewProps<{ icon?: () => null }>('icon'),
        view() {
          return null;
        },
      } as never)
    ).toThrow(/viewProps key "icon" conflicts with a declared variant key/);
  });

  it('requires a view component when viewProps are declared', () => {
    const buttonRecipe = recipe({
      base: 'inline-flex items-center',
    });

    expect(() =>
      styled('button', buttonRecipe, {
        viewProps: defineViewProps<{ icon?: () => null }>('icon'),
      } as never)
    ).toThrow(/viewProps require a view component/);
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

  it('keeps host.render override refs identity-stable across re-renders', () => {
    const badgeRecipe = recipe({
      base: 'inline-flex',
      variants: {
        tone: {
          info: 'bg-sky-100',
          warn: 'bg-amber-100',
        },
      },
    });
    const localRef = vi.fn<RefCallback<HTMLSpanElement>>();

    function BadgeView({
      host,
    }: RootStyledViewProps<'span', typeof badgeRecipe, false>) {
      return host.render({ ref: localRef, children: host.children } as never);
    }

    const Badge = styled('span', badgeRecipe, { view: BadgeView });
    const outerRef = vi.fn<RefCallback<HTMLSpanElement>>();

    const view = render(
      <Badge ref={outerRef} tone="info">
        Info
      </Badge>
    );
    view.rerender(
      <Badge ref={outerRef} tone="warn">
        Info
      </Badge>
    );

    expect(localRef).toHaveBeenCalledTimes(1);
    expect(localRef).not.toHaveBeenCalledWith(null);
    expect(outerRef).toHaveBeenCalledTimes(1);
    expect(outerRef).not.toHaveBeenCalledWith(null);
  });

  it('keeps ref, render, children, and className out of host.props', () => {
    const badgeRecipe = recipe({
      base: 'inline-flex',
      variants: { tone: { info: 'text-sky-700' } },
    });
    let hostPropKeys: string[] = [];
    const Badge = styled('span', badgeRecipe, {
      withRender: true,
      view({ host }) {
        hostPropKeys = Object.keys(host.props);
        return host.render();
      },
    });
    const ref = createRef<HTMLElement>();

    render(
      <Badge
        ref={ref}
        render={<strong />}
        tone="info"
        className="mt-2"
        id="badge"
      >
        Info
      </Badge>
    );

    expect(hostPropKeys).toEqual(['id']);
    expect(ref.current?.tagName).toBe('STRONG');
    expect(ref.current?.className).toBe('inline-flex text-sky-700 mt-2');
    expect(ref.current?.textContent).toBe('Info');
  });

  it('rejects viewProps keys that conflict with reserved props or prop aliases in strict mode', () => {
    const strict = defineConfig({ validate: 'always' });
    const buttonRecipe = strict.recipe({
      base: 'inline-flex',
      variants: { tone: { primary: 'bg-blue' } },
    });
    const tabsRecipe = strict.recipe({ slots: { root: 'flex' } });
    const view = () => null;

    for (const key of ['children', 'className', 'ref', 'render']) {
      expect(() =>
        strict.styled('button', buttonRecipe, {
          viewProps: defineViewProps<Record<string, unknown>>(key),
          view,
        } as never)
      ).toThrow(
        `react-class-variants: viewProps key "${key}" conflicts with a reserved public prop.`
      );
    }
    expect(() =>
      strict.styled('div', tabsRecipe, {
        viewProps: defineViewProps<Record<string, unknown>>('slotClassNames'),
        view,
      } as never)
    ).toThrow(
      'react-class-variants: viewProps key "slotClassNames" conflicts with a reserved public prop.'
    );
    expect(() =>
      strict.styled('input', buttonRecipe, {
        propAliases: { size: 'htmlSize' },
        viewProps: defineViewProps<{ htmlSize?: number }>('htmlSize'),
        view,
      } as never)
    ).toThrow(
      'react-class-variants: viewProps key "htmlSize" conflicts with a prop alias public key.'
    );
  });
});
