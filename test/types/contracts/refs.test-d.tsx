import {
  createRef,
  type ComponentProps,
  type ComponentPropsWithRef,
  type ComponentRef,
  type ComponentType,
  type FunctionComponent,
  type Ref,
} from 'react';
import { expectAssignable, expectError, expectType } from 'tsd';
import { defineConfig, recipe } from '../../../dist';

const { styled } = defineConfig();

const badgeRecipe = recipe({
  base: 'inline-flex',
  variants: { tone: { info: 'text-sky-700', warn: 'text-amber-700' } },
});
const cardRecipe = recipe({
  slots: { root: 'rounded', label: 'text-sm' },
  variants: { tone: { info: { root: 'bg-sky-50' } } },
});

// A React 19 base that takes `ref` as a regular prop.
function PlainLink(props: ComponentPropsWithRef<'a'>) {
  return <a {...props} />;
}

const Button = styled('button', badgeRecipe);
const Nested = styled(Button, badgeRecipe);
const Link = styled(PlainLink, badgeRecipe);
const Card = styled('article', cardRecipe, {
  view: ({ host }) => host.render(),
});

// styled() returns a plain function component with ref as a prop.
expectAssignable<FunctionComponent<ComponentProps<typeof Button>>>(Button);
expectType<HTMLButtonElement>({} as ComponentRef<typeof Button>);
expectType<HTMLButtonElement>({} as ComponentRef<typeof Nested>);
expectType<HTMLAnchorElement>({} as ComponentRef<typeof Link>);
expectType<HTMLElement>({} as ComponentRef<typeof Card>);
expectAssignable<ComponentProps<typeof Button>['ref']>(
  {} as Ref<HTMLButtonElement>
);
expectAssignable<ComponentType<{ tone: 'info' | 'warn' }>>(Button);

<Button ref={createRef<HTMLButtonElement>()} tone="info" />;
<Nested ref={createRef<HTMLButtonElement>()} tone="warn" />;
<Link ref={createRef<HTMLAnchorElement>()} tone="info" href="/" />;
<Card ref={createRef<HTMLElement>()} tone="info" />;
expectError(<Button ref={createRef<HTMLAnchorElement>()} tone="info" />);

// displayName stays assignable.
Button.displayName = 'Button';
expectType<string | undefined>({} as (typeof Button)['displayName']);
