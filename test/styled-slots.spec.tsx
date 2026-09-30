import { render, screen } from '@testing-library/react';

import { describe, expect, it } from 'vitest';
import { defineConfig, recipe } from '../src';

const { styled } = defineConfig();

describe('styled() slotted recipes', () => {
  it('exposes slotted view classes as an enumerable slot map', () => {
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
        },
      },
      defaultVariants: {
        tone: 'primary',
      },
    });
    let slotKeys: string[] = [];
    let slotEntryTypes: Array<[string, string]> = [];
    let spreadKeys: string[] = [];
    let spreadValueTypes: string[] = [];
    let spreadSymbols: symbol[] = [];
    let stableIconReference = false;

    const Button = styled('button', buttonRecipe, {
      view({ host, classes }) {
        slotKeys = Object.keys(classes);
        slotEntryTypes = Object.entries(classes).map(([key, value]) => [
          key,
          typeof value,
        ]);

        const spreadClasses = { ...classes };
        spreadKeys = Object.keys(spreadClasses);
        spreadValueTypes = Object.values(spreadClasses).map(
          value => typeof value
        );
        spreadSymbols = Object.getOwnPropertySymbols(spreadClasses);

        const firstIcon = classes.icon;
        const secondIcon = classes.icon;
        stableIconReference = firstIcon === secondIcon;

        return host.render({
          children: (
            <>
              <span data-testid="icon" className={firstIcon()} />
              <span className={classes.label()}>{host.children}</span>
            </>
          ),
        });
      },
    });

    render(<Button tone="primary">Save</Button>);

    expect(slotKeys).toEqual(['root', 'icon', 'label']);
    expect(slotEntryTypes).toEqual([
      ['root', 'function'],
      ['icon', 'function'],
      ['label', 'function'],
    ]);
    expect(spreadKeys).toEqual(['root', 'icon', 'label']);
    expect(spreadValueTypes).toEqual(['function', 'function', 'function']);
    expect(spreadSymbols).toEqual([]);
    expect(stableIconReference).toBe(true);
    expect(screen.getByTestId('icon').className).toBe('size-4 text-blue-100');
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
      <Button
        loading
        disabled
        className="rounded-md"
        slotClassNames={{
          label: 'uppercase',
          spinner: 'animate-pulse',
        }}
      >
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
      'hidden size-4 text-blue-100 inline-block animate-spin animate-pulse'
    );
    expect(screen.getByTestId('label').className).toBe(
      'transition-opacity opacity-0 uppercase'
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
      <Field
        invalid
        className="font-medium"
        slotClassNames={{
          input: 'w-full',
        }}
      >
        Email
      </Field>
    );

    expect(screen.getByText('Email').className).toBe(
      'block text-sm text-red-700 font-medium'
    );
    expect(screen.getByLabelText('field').className).toBe(
      'block rounded-md border-red-500 w-full'
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

  it('renders slotted views safely while Object.prototype is polluted', () => {
    // A polluted string would leak into class output if the compiled lookup
    // tables were left with Object.prototype reachable. The first render below
    // is also the recipe's first resolution, so it exercises the lazy seal.
    // Non-enumerable so React's own for..in prop walks stay quiet; direct
    // reads through an unsealed table would still see it.
    Object.defineProperty(Object.prototype, '__rcvPolluted', {
      configurable: true,
      value: 'evil',
    });
    try {
      const tabsRecipe = recipe({
        slots: {
          root: 'flex',
          icon: 'size-4',
        },
        variants: {
          tone: {
            red: {
              root: 'text-red',
              icon: 'fill-red',
            },
          },
        },
        defaultVariants: {
          tone: 'red',
        },
      });
      const Tabs = styled('div', tabsRecipe, {
        view({ host, classes }) {
          return host.render({
            children: (
              <span data-testid="tabs-icon" className={classes.icon()} />
            ),
          });
        },
      });

      render(<Tabs data-testid="tabs" tone={'__rcvPolluted' as never} />);

      expect(screen.getByTestId('tabs').className).toBe('flex');
      expect(screen.getByTestId('tabs-icon').className).toBe('size-4');
    } finally {
      delete (Object.prototype as Record<string, unknown>).__rcvPolluted;
    }
  });

  it('rejects a hostSlot that is not declared in recipe.slots', () => {
    const tabsRecipe = recipe({ slots: { root: 'flex' } });

    expect(() =>
      styled('div', tabsRecipe, {
        hostSlot: 'missing',
        view: () => null,
      } as never)
    ).toThrow(
      'react-class-variants: hostSlot "missing" is not declared in recipe.slots.'
    );
  });

  it('names an empty hostSlot in the error', () => {
    const tabsRecipe = recipe({ slots: { label: 'block' } });

    expect(() =>
      styled('div', tabsRecipe, { hostSlot: '', view: () => null } as never)
    ).toThrow(
      'react-class-variants: hostSlot "" is not declared in recipe.slots.'
    );
  });

  it('renders view components identically in lean and strict runtimes', () => {
    const rootConfig = {
      base: 'inline-flex',
      variants: { tone: { info: 'text-sky-700', danger: 'text-rose-700' } },
    } as const;
    const slotConfig = {
      slots: { root: 'flex', icon: 'size-4' },
      variants: {
        size: {
          sm: { root: 'text-sm', icon: 'size-3' },
          lg: { root: 'text-lg', icon: 'size-5' },
        },
      },
      defaultVariants: { size: 'sm' },
    } as const;

    for (const validate of ['never', 'always'] as const) {
      const config = defineConfig({ validate });
      const Badge = config.styled('span', config.recipe(rootConfig), {
        view: ({ host, variants }) =>
          host.render({ 'data-tone': variants.tone }),
      });
      const Tabs = config.styled('div', config.recipe(slotConfig), {
        view: ({ host, classes }) =>
          host.render({
            children: (
              <span
                data-testid={`icon-${validate}`}
                className={classes.icon({ size: 'lg', className: 'p-1' })}
              />
            ),
          }),
      });

      render(
        <>
          <Badge data-testid={`badge-${validate}`} tone="danger" />
          <Tabs data-testid={`tabs-${validate}`} className="mt-2" />
        </>
      );

      const badge = screen.getByTestId(`badge-${validate}`);
      expect(badge.className).toBe('inline-flex text-rose-700');
      expect(badge.dataset.tone).toBe('danger');
      expect(screen.getByTestId(`tabs-${validate}`).className).toBe(
        'flex text-sm mt-2'
      );
      expect(screen.getByTestId(`icon-${validate}`).className).toBe(
        'size-4 size-5 p-1'
      );
    }
  });

  it('validates a slotted className like a root className in strict mode', () => {
    const strict = defineConfig({ validate: 'always' });
    const Card = strict.styled(
      'article',
      strict.recipe({ slots: { root: 'r' } }),
      { view: ({ host }) => host.render() }
    );

    expect(() => render(<Card className={false as never} />)).toThrow(
      /invalid slot input\.className/
    );
  });
});
