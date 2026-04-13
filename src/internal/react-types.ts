/* eslint-disable @typescript-eslint/no-explicit-any -- React polymorphism intentionally accepts broad element/function props. */
import type {
  ComponentPropsWithRef,
  JSX,
  ReactElement,
  ReactNode,
  Ref,
} from 'react';
import type {
  AnyRootRecipe,
  AnySlotRecipe,
  ClassNameValue,
  ResolvedVariantProps,
  Simplify,
  SlotRenderMap,
  VariantProps,
} from './core-types';

export type AnyIntrinsicElement = keyof JSX.IntrinsicElements;

type ReservedReactPublicProps = 'children' | 'className' | 'ref' | 'render';

export type RenderFunctionProps = Simplify<
  {
    className: string;
    children?: ReactNode;
    ref?: Ref<any>;
  } & Record<string, unknown>
>;

export type RenderProp =
  | ReactElement
  | ((props: RenderFunctionProps) => ReactNode);

export type NativeAliases<Tag extends AnyIntrinsicElement> = Partial<
  Record<
    Exclude<
      keyof ComponentPropsWithRef<Tag> & string,
      ReservedReactPublicProps
    >,
    string
  >
>;

type AliasProps<
  Tag extends AnyIntrinsicElement,
  Aliases extends NativeAliases<Tag>
> = {
  [NativeKey in keyof Aliases as Aliases[NativeKey] &
    string]?: NativeKey extends keyof ComponentPropsWithRef<Tag>
    ? ComponentPropsWithRef<Tag>[NativeKey]
    : unknown;
};

type VariantPropKeys<TRecipe> = [TRecipe] extends [never]
  ? never
  : keyof VariantProps<TRecipe>;

type ResolvedForwardedVariantProps<TRecipe, Forwarded extends string> = Pick<
  ResolvedVariantProps<TRecipe>,
  Extract<Forwarded, keyof ResolvedVariantProps<TRecipe> & string>
>;

type ResolvedAliasTargetProps<
  Tag extends AnyIntrinsicElement,
  Aliases extends NativeAliases<Tag>
> = {
  [NativeKey in keyof Aliases]?: NativeKey extends keyof ComponentPropsWithRef<Tag>
    ? ComponentPropsWithRef<Tag>[NativeKey]
    : never;
};

type IntrinsicProps<
  Tag extends AnyIntrinsicElement,
  TRecipe,
  Aliases extends NativeAliases<Tag>
> = Omit<
  ComponentPropsWithRef<Tag>,
  VariantPropKeys<TRecipe> | keyof Aliases | 'className'
>;

type ResolvedIntrinsicProps<
  Tag extends AnyIntrinsicElement,
  TRecipe,
  Aliases extends NativeAliases<Tag>,
  Forwarded extends string
> = Simplify<
  Omit<ComponentPropsWithRef<Tag>, VariantPropKeys<TRecipe> | 'className'> &
    ResolvedAliasTargetProps<Tag, Aliases> &
    ResolvedForwardedVariantProps<TRecipe, Forwarded>
>;

export type StyledComponentProps<
  Tag extends AnyIntrinsicElement,
  TRecipe,
  WithRender extends boolean,
  Aliases extends NativeAliases<Tag>
> = Simplify<
  IntrinsicProps<Tag, TRecipe, Aliases> &
    AliasProps<Tag, Aliases> &
    VariantProps<TRecipe> & {
      className?: ClassNameValue;
    } & (WithRender extends true ? { render?: RenderProp } : {})
>;

export type RootHelperProps<
  Tag extends AnyIntrinsicElement,
  WithRender extends boolean,
  TRecipe extends AnyRootRecipe | AnySlotRecipe = never,
  Aliases extends NativeAliases<Tag> = {},
  Forwarded extends string = never
> = Simplify<
  ResolvedIntrinsicProps<Tag, TRecipe, Aliases, Forwarded> & {
    className?: ClassNameValue;
  } & (WithRender extends true ? { render?: RenderProp } : {})
>;

export type RootComposeContext<
  Tag extends AnyIntrinsicElement,
  TRecipe extends AnyRootRecipe,
  WithRender extends boolean,
  Aliases extends NativeAliases<Tag> = {},
  Forwarded extends string = never
> = {
  Root: (
    props: RootHelperProps<Tag, WithRender, TRecipe, Aliases, Forwarded>
  ) => ReactNode;
  variants: ResolvedVariantProps<TRecipe>;
};

export type SlotComposeContext<
  Tag extends AnyIntrinsicElement,
  TRecipe extends AnySlotRecipe,
  WithRender extends boolean,
  Aliases extends NativeAliases<Tag> = {},
  Forwarded extends string = never
> = {
  Root: (
    props: RootHelperProps<Tag, WithRender, TRecipe, Aliases, Forwarded>
  ) => ReactNode;
  variants: ResolvedVariantProps<TRecipe>;
  slots: SlotRenderMap<TRecipe>;
};

export type RootComposeInput<
  Tag extends AnyIntrinsicElement,
  WithRender extends boolean,
  TRecipe extends AnyRootRecipe = never,
  Aliases extends NativeAliases<Tag> = {},
  Forwarded extends string = never
> = Simplify<
  ResolvedIntrinsicProps<Tag, TRecipe, Aliases, Forwarded> & {
    className: string;
  } & (WithRender extends true ? { render?: RenderProp } : {})
>;

export type SlotComposeInput<
  Tag extends AnyIntrinsicElement,
  WithRender extends boolean,
  TRecipe extends AnySlotRecipe = never,
  Aliases extends NativeAliases<Tag> = {},
  Forwarded extends string = never
> = Simplify<
  ResolvedIntrinsicProps<Tag, TRecipe, Aliases, Forwarded> & {
    className?: ClassNameValue;
  } & (WithRender extends true ? { render?: RenderProp } : {})
>;

export type RootCompose<
  Tag extends AnyIntrinsicElement,
  TRecipe extends AnyRootRecipe,
  WithRender extends boolean,
  Aliases extends NativeAliases<Tag> = {},
  Forwarded extends string = never
> = (
  context: RootComposeContext<Tag, TRecipe, WithRender, Aliases, Forwarded>,
  input: RootComposeInput<Tag, WithRender, TRecipe, Aliases, Forwarded>
) => ReactNode;

export type SlotCompose<
  Tag extends AnyIntrinsicElement,
  TRecipe extends AnySlotRecipe,
  WithRender extends boolean,
  Aliases extends NativeAliases<Tag> = {},
  Forwarded extends string = never
> = (
  context: SlotComposeContext<Tag, TRecipe, WithRender, Aliases, Forwarded>,
  input: SlotComposeInput<Tag, WithRender, TRecipe, Aliases, Forwarded>
) => ReactNode;

export type RootComponentOptions<
  Tag extends AnyIntrinsicElement,
  TRecipe extends AnyRootRecipe,
  WithRender extends boolean = false,
  Aliases extends NativeAliases<Tag> = {},
  Forwarded extends string = never
> = {
  displayName?: string;
  withRender?: WithRender;
  forwardProps?: readonly Forwarded[] &
    readonly (keyof VariantProps<TRecipe> & string)[];
  nativeAliases?: Aliases;
  compose?: RootCompose<Tag, TRecipe, WithRender, Aliases, Forwarded>;
};

export type SlotComponentOptions<
  Tag extends AnyIntrinsicElement,
  TRecipe extends AnySlotRecipe,
  WithRender extends boolean = false,
  Aliases extends NativeAliases<Tag> = {},
  Forwarded extends string = never
> = {
  displayName?: string;
  withRender?: WithRender;
  forwardProps?: readonly Forwarded[] &
    readonly (keyof VariantProps<TRecipe> & string)[];
  nativeAliases?: Aliases;
  compose: SlotCompose<Tag, TRecipe, WithRender, Aliases, Forwarded>;
};
