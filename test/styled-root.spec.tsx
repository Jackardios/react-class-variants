import { render, screen } from '@testing-library/react';
import {
  cloneElement,
  createRef,
  forwardRef,
  lazy,
  memo,
  type ComponentPropsWithoutRef,
  type ComponentPropsWithRef,
  type ReactElement,
} from 'react';
import { describe, expect, it, vi } from 'vitest';
import { defineConfig, recipe } from '../src';

const { styled } = defineConfig();

describe('styled() root components', () => {
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

  it('throws a descriptive error when styled() receives a non-recipe function', () => {
    expect(() => styled('div', (() => 'x') as never)).toThrow(/styled\(\)/);
    expect(() => styled('div', null as never)).toThrow(/styled\(\)/);
    expect(() => styled('div', undefined as never)).toThrow(/styled\(\)/);
  });

  it('forwards refs on the direct intrinsic path', () => {
    const buttonRecipe = recipe({
      base: 'inline-flex',
      variants: { tone: { primary: 'bg-blue' } },
    });
    const Button = styled('button', buttonRecipe);
    const ref = createRef<HTMLButtonElement>();

    render(
      <Button ref={ref} tone="primary">
        Save
      </Button>
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.className).toBe('inline-flex bg-blue');
  });

  it('passes ref as a plain React 19 prop on every path', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const badgeRecipe = recipe({
      base: 'inline-flex',
      variants: { tone: { info: 'text-sky-700' } },
    });
    const cardRecipe = recipe({
      slots: { root: 'rounded', label: 'text-sm' },
      variants: { tone: { info: { root: 'bg-sky-50' } } },
    });
    // A React 19 base component that takes `ref` as a regular prop.
    function PlainBase(props: ComponentPropsWithRef<'span'>) {
      return <span data-testid="plain" {...props} />;
    }

    const Direct = styled('button', badgeRecipe);
    const Nested = styled(Direct, badgeRecipe);
    const Custom = styled(PlainBase, badgeRecipe);
    const RootView = styled('section', badgeRecipe, {
      view: ({ host }) => host.render(),
    });
    const SlotView = styled('article', cardRecipe, {
      view: ({ host }) => host.render(),
    });

    const refs = {
      direct: createRef<HTMLButtonElement>(),
      nested: createRef<HTMLButtonElement>(),
      custom: createRef<HTMLSpanElement>(),
      rootView: createRef<HTMLElement>(),
      slotView: createRef<HTMLElement>(),
    };

    render(
      <>
        <Direct ref={refs.direct} tone="info">
          Direct
        </Direct>
        <Nested ref={refs.nested} tone="info">
          Nested
        </Nested>
        <Custom ref={refs.custom} tone="info" />
        <RootView ref={refs.rootView} tone="info" />
        <SlotView ref={refs.slotView} tone="info" />
      </>
    );

    expect(refs.direct.current).toBe(
      screen.getByRole('button', { name: 'Direct' })
    );
    expect(refs.nested.current).toBe(
      screen.getByRole('button', { name: 'Nested' })
    );
    expect(refs.custom.current).toBe(screen.getByTestId('plain'));
    expect(refs.rootView.current?.tagName).toBe('SECTION');
    expect(refs.slotView.current?.tagName).toBe('ARTICLE');
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('builds plain function components rather than forwardRef objects', () => {
    const Button = styled('button', recipe({ base: 'inline-flex' }));

    expect(typeof Button).toBe('function');
    expect((Button as unknown as { $$typeof?: symbol }).$$typeof).toBe(
      undefined
    );
  });

  it('drops the render prop in lean mode when withRender is disabled', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const buttonRecipe = recipe({
      base: 'inline-flex',
      variants: { tone: { primary: 'bg-blue' } },
    });
    const Button = styled('button', buttonRecipe);

    try {
      render(
        <Button
          data-testid="button"
          tone="primary"
          {...({ render: <a href="/docs" /> } as object)}
        />
      );

      const button = screen.getByTestId('button');
      expect(button.tagName).toBe('BUTTON');
      expect(button.hasAttribute('render')).toBe(false);
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  describe.each([
    ['lean', defineConfig()],
    ['strict', defineConfig({ validate: 'always' })],
  ])('render on a component base in %s mode', (_mode, config) => {
    // Shaped like Base UI / Ark parts: the component owns the render prop.
    function Trigger({
      render: renderProp,
      ...props
    }: ComponentPropsWithRef<'button'> & { render?: ReactElement }) {
      return renderProp ? (
        cloneElement(renderProp, props)
      ) : (
        <button {...props} />
      );
    }
    const triggerRecipe = config.recipe({
      base: 'inline-flex',
      variants: { tone: { primary: 'bg-blue' } },
    });

    it('forwards render as an ordinary prop on the direct path', () => {
      const Button = config.styled(Trigger, triggerRecipe);

      render(
        <Button tone="primary" render={<a href="/docs" />}>
          Docs
        </Button>
      );

      const link = screen.getByRole('link', { name: 'Docs' });
      expect(link.className).toBe('inline-flex bg-blue');
      expect(link.getAttribute('href')).toBe('/docs');
    });

    it('keeps render in host.props and lets host.render() override it', () => {
      const seen: unknown[] = [];
      const Button = config.styled(Trigger, triggerRecipe, {
        view: ({ host }) => {
          seen.push(host.props.render);
          return host.props.render
            ? host.render()
            : host.render({ render: <a href="/fallback" /> });
        },
      });

      const view = render(
        <Button tone="primary" render={<a href="/docs" />}>
          Docs
        </Button>
      );
      expect(
        screen.getByRole('link', { name: 'Docs' }).getAttribute('href')
      ).toBe('/docs');
      expect(seen).toHaveLength(1);

      view.rerender(<Button tone="primary">Docs</Button>);
      expect(
        screen.getByRole('link', { name: 'Docs' }).getAttribute('href')
      ).toBe('/fallback');
      expect(seen[1]).toBeUndefined();
    });
  });

  it('derives displayName from the base component', () => {
    const baseRecipe = recipe({ base: 'inline-flex' });
    const tabsRecipe = recipe({ slots: { root: 'flex' } });

    function RouterLink(props: ComponentPropsWithoutRef<'a'>) {
      return <a {...props} />;
    }
    function Internal(props: ComponentPropsWithoutRef<'a'>) {
      return <a {...props} />;
    }
    Internal.displayName = 'PublicLink';
    const ForwardedLink = forwardRef<
      HTMLAnchorElement,
      ComponentPropsWithoutRef<'a'>
    >(function LinkRender(props, ref) {
      return <a ref={ref} {...props} />;
    });
    const MemoLink = memo(ForwardedLink);
    const anonymous = [
      (props: ComponentPropsWithoutRef<'a'>) => <a {...props} />,
    ][0];

    expect(styled('button', baseRecipe).displayName).toBe('Styled(button)');
    expect(styled(RouterLink, baseRecipe).displayName).toBe(
      'Styled(RouterLink)'
    );
    expect(styled(Internal, baseRecipe).displayName).toBe('Styled(PublicLink)');
    expect(styled(ForwardedLink, baseRecipe).displayName).toBe(
      'Styled(LinkRender)'
    );
    expect(styled(MemoLink, baseRecipe).displayName).toBe('Styled(LinkRender)');
    expect(styled(anonymous, baseRecipe).displayName).toBe('Styled(Component)');
    expect(
      styled(
        lazy(async () => ({ default: RouterLink })),
        baseRecipe
      ).displayName
    ).toBe('Styled(Component)');
    expect(styled(styled('button', baseRecipe), baseRecipe).displayName).toBe(
      'Styled(Styled(button))'
    );
    expect(
      styled('button', baseRecipe, { displayName: 'Button' }).displayName
    ).toBe('Button');
    const cyclic: { $$typeof: symbol; type?: unknown } = {
      $$typeof: Symbol.for('react.memo'),
    };
    cyclic.type = cyclic;
    expect(styled(cyclic as never, baseRecipe).displayName).toBe(
      'Styled(Component)'
    );
    expect(
      styled(RouterLink, tabsRecipe, {
        view: ({ host }) => host.render(),
      }).displayName
    ).toBe('Styled(RouterLink)');
  });
});
