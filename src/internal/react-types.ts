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
  SlotNames,
  SlotRenderFunction,
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

type IntrinsicProps<
  Tag extends AnyIntrinsicElement,
  TRecipe,
  Aliases extends NativeAliases<Tag>
> = Omit<
  ComponentPropsWithRef<Tag>,
  keyof VariantProps<TRecipe> | keyof Aliases | 'className'
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
  WithRender extends boolean
> = Simplify<
  Omit<ComponentPropsWithRef<Tag>, 'className'> & {
    className?: ClassNameValue;
  } & (WithRender extends true ? { render?: RenderProp } : {})
>;

export type RootComposeContext<
  Tag extends AnyIntrinsicElement,
  TRecipe extends AnyRootRecipe,
  WithRender extends boolean
> = {
  Root: (props: RootHelperProps<Tag, WithRender>) => ReactNode;
  variants: ResolvedVariantProps<TRecipe>;
};

export type SlotComposeContext<
  Tag extends AnyIntrinsicElement,
  TRecipe extends AnySlotRecipe,
  WithRender extends boolean
> = {
  Root: (props: RootHelperProps<Tag, WithRender>) => ReactNode;
  variants: ResolvedVariantProps<TRecipe>;
  slots: {
    [Slot in SlotNames<TRecipe>]: SlotRenderFunction<TRecipe>;
  };
};

export type RootComposeInput<
  Tag extends AnyIntrinsicElement,
  WithRender extends boolean
> = Simplify<
  {
    className: string;
    children?: ReactNode;
    ref?: ComponentPropsWithRef<Tag>['ref'];
  } & Record<string, unknown> &
    (WithRender extends true ? { render?: RenderProp } : {})
>;

export type SlotComposeInput<
  Tag extends AnyIntrinsicElement,
  WithRender extends boolean
> = Simplify<
  {
    className?: ClassNameValue;
    children?: ReactNode;
    ref?: ComponentPropsWithRef<Tag>['ref'];
  } & Record<string, unknown> &
    (WithRender extends true ? { render?: RenderProp } : {})
>;

export type RootCompose<
  Tag extends AnyIntrinsicElement,
  TRecipe extends AnyRootRecipe,
  WithRender extends boolean
> = (
  context: RootComposeContext<Tag, TRecipe, WithRender>,
  input: RootComposeInput<Tag, WithRender>
) => ReactNode;

export type SlotCompose<
  Tag extends AnyIntrinsicElement,
  TRecipe extends AnySlotRecipe,
  WithRender extends boolean
> = (
  context: SlotComposeContext<Tag, TRecipe, WithRender>,
  input: SlotComposeInput<Tag, WithRender>
) => ReactNode;

export type RootComponentOptions<
  Tag extends AnyIntrinsicElement,
  TRecipe extends AnyRootRecipe,
  WithRender extends boolean = false,
  Aliases extends NativeAliases<Tag> = {}
> = {
  displayName?: string;
  withRender?: WithRender;
  forwardProps?: readonly (keyof VariantProps<TRecipe> & string)[];
  nativeAliases?: Aliases;
  compose?: RootCompose<Tag, TRecipe, WithRender>;
};

export type SlotComponentOptions<
  Tag extends AnyIntrinsicElement,
  TRecipe extends AnySlotRecipe,
  WithRender extends boolean = false,
  Aliases extends NativeAliases<Tag> = {}
> = {
  displayName?: string;
  withRender?: WithRender;
  forwardProps?: readonly (keyof VariantProps<TRecipe> & string)[];
  nativeAliases?: Aliases;
  compose: SlotCompose<Tag, TRecipe, WithRender>;
};
