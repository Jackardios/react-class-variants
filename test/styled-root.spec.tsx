import { render, screen } from '@testing-library/react';
import {
  createRef,
  forwardRef,
  lazy,
  memo,
  type ComponentPropsWithoutRef,
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
