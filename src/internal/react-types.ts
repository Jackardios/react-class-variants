/* eslint-disable @typescript-eslint/no-explicit-any -- React polymorphism intentionally accepts broad element/function props. */
import type {
  ComponentPropsWithRef,
  ComponentRef,
  ComponentType,
  ElementType,
  ForwardRefExoticComponent,
  HTMLAttributes,
  JSX,
  PropsWithoutRef,
  ReactElement,
  ReactNode,
  Ref,
  RefAttributes,
} from 'react';
import type {
  AnyRootRecipe,
  AnySlotRecipe,
  ClassNameValue,
  ResolvedVariantProps,
  Simplify,
  SlotNames,
  SlotRenderMap,
  VariantProps,
} from './core-types';

export type AnyElementType = ElementType;
export type AnyIntrinsicElement = keyof JSX.IntrinsicElements;

type ReservedReactPublicProps = 'children' | 'className' | 'ref' | 'render';

export type PropAliases<Base extends AnyElementType> = Partial<
  Record<
    Exclude<
      keyof ComponentPropsWithRef<Base> & string,
      ReservedReactPublicProps
    >,
    string
  >
>;

type AliasProps<
  Base extends AnyElementType,
  Aliases extends PropAliases<Base>
> = {
  [NativeKey in keyof Aliases &
    keyof ComponentPropsWithRef<Base> as Aliases[NativeKey] &
    string]?: ComponentPropsWithRef<Base>[NativeKey];
};

type VariantPropKeys<TRecipe> = [TRecipe] extends [never]
  ? never
  : keyof VariantProps<TRecipe>;

type ForwardedRenderVariantProps<TRecipe, Forwarded extends string> = [
  TRecipe
] extends [never]
  ? {}
  : Pick<
      ResolvedVariantProps<TRecipe>,
      Extract<Forwarded, keyof ResolvedVariantProps<TRecipe> & string>
    >;

export type RenderFunctionProps<
  TRecipe = never,
  Forwarded extends string = never
> = Simplify<
  {
    className: string;
    children?: ReactNode;
    ref?: Ref<any>;
  } & ForwardedRenderVariantProps<TRecipe, Forwarded> &
    Omit<
      HTMLAttributes<any>,
      'className' | Extract<VariantPropKeys<TRecipe>, string>
    >
>;

export type RenderProp<TRecipe = never, Forwarded extends string = never> =
  | ReactElement
  | ((props: RenderFunctionProps<TRecipe, Forwarded>) => ReactNode);

type BasePropKeys<Base extends AnyElementType> =
  keyof ComponentPropsWithRef<Base> & string;

type DisallowedAliasTargetKeys<Base extends AnyElementType, TRecipe> =
  | ReservedReactPublicProps
  | BasePropKeys<Base>
  | Extract<VariantPropKeys<TRecipe>, string>;

type ValidatedAliasValue<
  AliasValue,
  Disallowed extends string
> = AliasValue extends string ? Exclude<AliasValue, Disallowed> : AliasValue;

type ValidatedPropAliases<
  Base extends AnyElementType,
  TRecipe,
  Aliases extends PropAliases<Base>
> = {
  [NativeKey in keyof Aliases]: ValidatedAliasValue<
    Aliases[NativeKey],
    DisallowedAliasTargetKeys<Base, TRecipe>
  >;
};

type ResolvedForwardedVariantProps<TRecipe, Forwarded extends string> = Pick<
  ResolvedVariantProps<TRecipe>,
  Extract<Forwarded, keyof ResolvedVariantProps<TRecipe> & string>
>;

type ResolvedAliasTargetProps<
  Base extends AnyElementType,
  Aliases extends PropAliases<Base>
> = {
  [NativeKey in keyof Aliases]?: NativeKey extends keyof ComponentPropsWithRef<Base>
    ? ComponentPropsWithRef<Base>[NativeKey]
    : never;
};

type PublicBaseProps<
  Base extends AnyElementType,
  TRecipe,
  Aliases extends PropAliases<Base>
> = Omit<
  ComponentPropsWithRef<Base>,
  VariantPropKeys<TRecipe> | keyof Aliases | 'className'
>;

type ResolvedBaseProps<
  Base extends AnyElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  Forwarded extends string
> = Simplify<
  Omit<ComponentPropsWithRef<Base>, VariantPropKeys<TRecipe> | 'className'> &
    ResolvedAliasTargetProps<Base, Aliases> &
    ResolvedForwardedVariantProps<TRecipe, Forwarded>
>;

type ResolvedHostProps<
  Base extends AnyElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  Forwarded extends string
> = Simplify<
  Omit<
    ResolvedBaseProps<Base, TRecipe, Aliases, Forwarded>,
    'className' | 'children' | 'ref' | 'render'
  >
>;

type StyledComponent<
  Base extends AnyElementType,
  TRecipe,
  WithRender extends boolean,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never
> = ForwardRefExoticComponent<
  PropsWithoutRef<
    StyledComponentProps<Base, TRecipe, WithRender, Aliases, Forwarded>
  > &
    RefAttributes<ComponentRef<Base>>
>;

export type StyledComponentProps<
  Base extends AnyElementType,
  TRecipe,
  WithRender extends boolean,
  Aliases extends PropAliases<Base>,
  Forwarded extends string = never
> = Simplify<
  PublicBaseProps<Base, TRecipe, Aliases> &
    AliasProps<Base, Aliases> &
    VariantProps<TRecipe> & {
      className?: ClassNameValue;
    } & (WithRender extends true
      ? { render?: RenderProp<TRecipe, Forwarded> }
      : {})
>;

export type HostRenderOverrides<
  Base extends AnyElementType,
  TRecipe,
  WithRender extends boolean,
  Forwarded extends string = never
> = Simplify<
  Partial<Omit<ComponentPropsWithRef<Base>, 'className'>> &
    Record<string, unknown> & {
      className?: ClassNameValue;
    } & (WithRender extends true
      ? { render?: RenderProp<TRecipe, Forwarded> }
      : {})
>;

export type HostView<
  Base extends AnyElementType,
  TRecipe,
  WithRender extends boolean,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never
> = {
  readonly props: Readonly<
    ResolvedHostProps<Base, TRecipe, Aliases, Forwarded>
  >;
  readonly className: string;
  readonly children?: ReactNode;
  render(
    overrides?: HostRenderOverrides<Base, TRecipe, WithRender, Forwarded>
  ): ReactNode;
};

export type RootStyledViewProps<
  Base extends AnyElementType,
  TRecipe extends AnyRootRecipe,
  WithRender extends boolean,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never
> = {
  host: HostView<Base, TRecipe, WithRender, Aliases, Forwarded>;
  variants: ResolvedVariantProps<TRecipe>;
};

export type SlotStyledViewProps<
  Base extends AnyElementType,
  TRecipe extends AnySlotRecipe,
  WithRender extends boolean,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never
> = {
  host: HostView<Base, TRecipe, WithRender, Aliases, Forwarded>;
  variants: ResolvedVariantProps<TRecipe>;
  classes: Readonly<SlotRenderMap<TRecipe>>;
};

export type StyledOptionsCommon<
  Base extends AnyElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  Forwarded extends string
> = {
  displayName?: string;
  forwardProps?: readonly Forwarded[] &
    readonly (keyof VariantProps<TRecipe> & string)[];
  propAliases?: ValidatedPropAliases<Base, TRecipe, Aliases>;
};

export type RootStyledOptions<
  Base extends AnyElementType,
  TRecipe extends AnyRootRecipe,
  WithRender extends boolean = false,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never
> = StyledOptionsCommon<Base, TRecipe, Aliases, Forwarded> & {
  withRender?: WithRender;
  view?: ComponentType<
    RootStyledViewProps<Base, TRecipe, WithRender, Aliases, Forwarded>
  >;
};

type HostSlotOption<TRecipe extends AnySlotRecipe> =
  'root' extends SlotNames<TRecipe>
    ? {
        hostSlot?: SlotNames<TRecipe>;
      }
    : {
        hostSlot: SlotNames<TRecipe>;
      };

export type SlotStyledOptions<
  Base extends AnyElementType,
  TRecipe extends AnySlotRecipe,
  WithRender extends boolean = false,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never
> = StyledOptionsCommon<Base, TRecipe, Aliases, Forwarded> & {
  withRender?: WithRender;
  view: ComponentType<
    SlotStyledViewProps<Base, TRecipe, WithRender, Aliases, Forwarded>
  >;
} & HostSlotOption<TRecipe>;

export type StyledComponentType<
  Base extends AnyElementType,
  TRecipe,
  WithRender extends boolean,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never
> = StyledComponent<Base, TRecipe, WithRender, Aliases, Forwarded>;

export interface StyledFn {
  <
    Base extends AnyIntrinsicElement,
    TRecipe extends AnyRootRecipe,
    const WithRender extends boolean = false,
    const Aliases extends PropAliases<Base> = {},
    const Forwarded extends string = never
  >(
    base: Base,
    inputRecipe: TRecipe,
    options?: RootStyledOptions<Base, TRecipe, WithRender, Aliases, Forwarded>
  ): StyledComponentType<Base, TRecipe, WithRender, Aliases, Forwarded>;

  <
    Base extends Exclude<AnyElementType, AnyIntrinsicElement>,
    TRecipe extends AnyRootRecipe,
    const Aliases extends PropAliases<Base> = {},
    const Forwarded extends string = never
  >(
    base: Base,
    inputRecipe: TRecipe,
    options?: RootStyledOptions<Base, TRecipe, false, Aliases, Forwarded>
  ): StyledComponentType<Base, TRecipe, false, Aliases, Forwarded>;

  <
    Base extends AnyIntrinsicElement,
    TRecipe extends AnySlotRecipe,
    const WithRender extends boolean = false,
    const Aliases extends PropAliases<Base> = {},
    const Forwarded extends string = never
  >(
    base: Base,
    inputRecipe: TRecipe,
    options: SlotStyledOptions<Base, TRecipe, WithRender, Aliases, Forwarded>
  ): StyledComponentType<Base, TRecipe, WithRender, Aliases, Forwarded>;

  <
    Base extends Exclude<AnyElementType, AnyIntrinsicElement>,
    TRecipe extends AnySlotRecipe,
    const Aliases extends PropAliases<Base> = {},
    const Forwarded extends string = never
  >(
    base: Base,
    inputRecipe: TRecipe,
    options: SlotStyledOptions<Base, TRecipe, false, Aliases, Forwarded>
  ): StyledComponentType<Base, TRecipe, false, Aliases, Forwarded>;
}
