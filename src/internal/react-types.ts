/* eslint-disable @typescript-eslint/no-explicit-any -- React polymorphism intentionally accepts broad element/function props. */
import type {
  ComponentPropsWithRef,
  ComponentRef,
  ComponentType,
  ElementType,
  FunctionComponent,
  HTMLAttributes,
  JSX,
  PropsWithoutRef,
  ReactElement,
  ReactNode,
  Ref,
  RefAttributes,
} from 'react';
import type {
  ClassNameValue,
  ResolvedVariantProps,
  Simplify,
  SlotRenderMap,
  VariantProps,
} from './core-types';

/** @deprecated Use React's `ElementType`. */
export type AnyElementType = ElementType;
export type AnyIntrinsicElement = keyof JSX.IntrinsicElements;
declare const viewPropsShapeSymbol: unique symbol;

// Mirrors the runtime set in engine/shared.ts (isReservedPublicProp).
type ReservedReactPublicProps = 'children' | 'className' | 'ref' | 'render';
type BaseProps<Base extends ElementType> = ComponentPropsWithRef<Base>;
type ViewPropsShape = Record<string, unknown>;
type HasKeys<T> = [keyof T] extends [never] ? false : true;
type HasForwardedKeys<Forwarded extends string> = [Forwarded] extends [never]
  ? false
  : true;
type RecipeSlotNames<TRecipe> = keyof SlotRenderMap<TRecipe> & string;
type StyledSlotClassNames<TRecipe> = Partial<{
  [Slot in keyof SlotRenderMap<TRecipe>]: ClassNameValue;
}>;
type ConsumedStyledPropKeys<TRecipe> =
  'className' | (TRecipe extends AnySlotRecipeLike ? 'slotClassNames' : never);
type ReservedStyledAliasKeys<TRecipe> =
  | ReservedReactPublicProps
  | (TRecipe extends AnySlotRecipeLike ? 'slotClassNames' : never);
type StyledRecipePublicProps<TRecipe> = {
  className?: ClassNameValue;
} & (TRecipe extends AnySlotRecipeLike
  ? {
      slotClassNames?: StyledSlotClassNames<TRecipe>;
    }
  : {});
export type AnyRootRecipeLike = {
  (input?: any): string;
  readonly resolve: (...args: any[]) => {
    variants: Record<string, unknown>;
    resolvedProps: Record<string, unknown>;
  };
};
export type AnySlotRecipeLike = {
  (input?: any): Record<string, (input?: Record<string, unknown>) => string>;
  readonly resolve: (...args: any[]) => {
    variants: Record<string, unknown>;
    slots: Record<string, (input?: Record<string, unknown>) => string>;
    resolvedProps: Record<string, unknown>;
  };
};

export type PropAliases<Base extends ElementType> = Partial<
  Record<
    Exclude<keyof BaseProps<Base> & string, ReservedReactPublicProps>,
    string
  >
>;

export type ViewPropsDescriptor<TViewProps extends ViewPropsShape = {}> = {
  readonly keys: readonly (keyof TViewProps & string)[];
  readonly [viewPropsShapeSymbol]?: TViewProps;
};

type AliasProps<Base extends ElementType, Aliases extends PropAliases<Base>> =
  HasKeys<Aliases> extends true
    ? {
        [
          NativeKey in keyof Aliases &
            keyof BaseProps<Base> as Aliases[NativeKey] & string
        ]?: BaseProps<Base>[NativeKey];
      }
    : {};

type VariantPropKeys<TRecipe> = [VariantProps<TRecipe>] extends [never]
  ? never
  : keyof VariantProps<TRecipe>;

type ForwardedRenderVariantProps<TRecipe, Forwarded extends string> = [
  HasForwardedKeys<Forwarded>,
] extends [false]
  ? {}
  : [TRecipe] extends [never]
    ? {}
    : Pick<
        ResolvedVariantProps<TRecipe>,
        Extract<Forwarded, keyof ResolvedVariantProps<TRecipe> & string>
      >;

export type RenderFunctionProps<
  TRecipe = never,
  Forwarded extends string = never,
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

type BasePropKeys<Base extends ElementType> = keyof BaseProps<Base> & string;
type AliasPublicPropKeys<Aliases> = Aliases[keyof Aliases] & string;

type DisallowedAliasTargetKeys<Base extends ElementType, TRecipe> =
  | ReservedStyledAliasKeys<TRecipe>
  | BasePropKeys<Base>
  | Extract<VariantPropKeys<TRecipe>, string>;

type ValidatedAliasValue<
  AliasValue,
  Disallowed extends string,
> = AliasValue extends string ? Exclude<AliasValue, Disallowed> : AliasValue;

type ValidatedPropAliases<
  Base extends ElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
> =
  HasKeys<Aliases> extends true
    ? {
        [NativeKey in keyof Aliases]: ValidatedAliasValue<
          Aliases[NativeKey],
          DisallowedAliasTargetKeys<Base, TRecipe>
        >;
      }
    : Aliases;

type DisallowedViewPropKeys<
  Base extends ElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
> =
  | ReservedStyledAliasKeys<TRecipe>
  | BasePropKeys<Base>
  | Extract<VariantPropKeys<TRecipe>, string>
  | AliasPublicPropKeys<Aliases>;

type ValidatedViewProps<
  Base extends ElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  ViewProps extends ViewPropsShape,
> =
  HasKeys<ViewProps> extends true
    ? {
        [Key in keyof ViewProps]: Key extends DisallowedViewPropKeys<
          Base,
          TRecipe,
          Aliases
        >
          ? never
          : ViewProps[Key];
      }
    : ViewProps;

type ValidatedViewPropsDescriptor<
  Base extends ElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  ViewProps extends ViewPropsShape,
> = ViewPropsDescriptor<ValidatedViewProps<Base, TRecipe, Aliases, ViewProps>>;

type ViewPropsOption<
  Base extends ElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  ViewProps extends ViewPropsShape,
> =
  HasKeys<ViewProps> extends true
    ? {
        viewProps: ValidatedViewPropsDescriptor<
          Base,
          TRecipe,
          Aliases,
          ViewProps
        >;
      }
    : {
        viewProps?: undefined;
      };

type ResolvedForwardedVariantProps<TRecipe, Forwarded extends string> =
  HasForwardedKeys<Forwarded> extends true
    ? Pick<
        ResolvedVariantProps<TRecipe>,
        Extract<Forwarded, keyof ResolvedVariantProps<TRecipe> & string>
      >
    : {};

type ResolvedAliasTargetProps<
  Base extends ElementType,
  Aliases extends PropAliases<Base>,
> =
  HasKeys<Aliases> extends true
    ? {
        [NativeKey in keyof Aliases]?: NativeKey extends keyof BaseProps<Base>
          ? BaseProps<Base>[NativeKey]
          : never;
      }
    : {};

type PublicBaseProps<
  Base extends ElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  ViewProps extends ViewPropsShape,
> = Omit<
  BaseProps<Base>,
  | VariantPropKeys<TRecipe>
  | keyof Aliases
  | ConsumedStyledPropKeys<TRecipe>
  | keyof ViewProps
>;

type ResolvedBaseProps<
  Base extends ElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  Forwarded extends string,
  ViewProps extends ViewPropsShape,
> = Simplify<
  Omit<
    BaseProps<Base>,
    VariantPropKeys<TRecipe> | ConsumedStyledPropKeys<TRecipe> | keyof ViewProps
  > &
    ResolvedAliasTargetProps<Base, Aliases> &
    ResolvedForwardedVariantProps<TRecipe, Forwarded> &
    ViewProps
>;

type ResolvedHostProps<
  Base extends ElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  Forwarded extends string,
  ViewProps extends ViewPropsShape,
> = Simplify<
  Omit<
    ResolvedBaseProps<Base, TRecipe, Aliases, Forwarded, ViewProps>,
    'className' | 'children' | 'ref' | 'render'
  >
>;

type StyledComponent<
  Base extends ElementType,
  TRecipe,
  WithRender extends boolean,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {},
> = FunctionComponent<
  PropsWithoutRef<
    StyledComponentProps<
      Base,
      TRecipe,
      WithRender,
      Aliases,
      Forwarded,
      ViewProps
    >
  > &
    RefAttributes<ComponentRef<Base>>
>;

export type StyledComponentProps<
  Base extends ElementType,
  TRecipe,
  WithRender extends boolean,
  Aliases extends PropAliases<Base>,
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {},
> = Simplify<
  PublicBaseProps<Base, TRecipe, Aliases, ViewProps> &
    AliasProps<Base, Aliases> &
    VariantProps<TRecipe> &
    StyledRecipePublicProps<TRecipe> &
    ViewProps &
    (WithRender extends true ? { render?: RenderProp<TRecipe, Forwarded> } : {})
>;

export type HostRenderOverrides<
  Base extends ElementType,
  TRecipe,
  WithRender extends boolean,
  Forwarded extends string = never,
> = Simplify<
  Partial<Omit<BaseProps<Base>, 'className'>> &
    Record<string, unknown> & {
      className?: ClassNameValue;
    } & (WithRender extends true
      ? { render?: RenderProp<TRecipe, Forwarded> }
      : {})
>;

export type HostView<
  Base extends ElementType,
  TRecipe,
  WithRender extends boolean,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {},
> = {
  readonly props: Readonly<
    ResolvedHostProps<Base, TRecipe, Aliases, Forwarded, ViewProps>
  >;
  readonly className: string;
  readonly children?: ReactNode;
  render(
    overrides?: HostRenderOverrides<Base, TRecipe, WithRender, Forwarded>
  ): ReactNode;
};

export type RootStyledViewProps<
  Base extends ElementType,
  TRecipe extends AnyRootRecipeLike,
  WithRender extends boolean,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {},
> = {
  host: HostView<Base, TRecipe, WithRender, Aliases, Forwarded, ViewProps>;
  variants: ResolvedVariantProps<TRecipe>;
};

export type SlotStyledViewProps<
  Base extends ElementType,
  TRecipe extends AnySlotRecipeLike,
  WithRender extends boolean,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {},
> = {
  host: HostView<Base, TRecipe, WithRender, Aliases, Forwarded, ViewProps>;
  variants: ResolvedVariantProps<TRecipe>;
  classes: Readonly<SlotRenderMap<TRecipe>>;
};

export type StyledOptionsCommon<
  Base extends ElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  Forwarded extends string,
> = {
  displayName?: string;
  forwardProps?: readonly Forwarded[] &
    readonly (keyof VariantProps<TRecipe> & string)[];
  propAliases?: ValidatedPropAliases<Base, TRecipe, Aliases>;
};

export type RootStyledOptions<
  Base extends ElementType,
  TRecipe extends AnyRootRecipeLike,
  WithRender extends boolean = false,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {},
> = StyledOptionsCommon<Base, TRecipe, Aliases, Forwarded> & {
  withRender?: WithRender;
} & (
    | {
        view?: undefined;
        viewProps?: undefined;
      }
    | ({
        view: ComponentType<
          RootStyledViewProps<
            Base,
            TRecipe,
            WithRender,
            Aliases,
            Forwarded,
            NoInfer<ViewProps>
          >
        >;
      } & ViewPropsOption<Base, TRecipe, Aliases, ViewProps>)
  );

type HostSlotOption<TRecipe extends AnySlotRecipeLike> =
  'root' extends RecipeSlotNames<TRecipe>
    ? {
        hostSlot?: RecipeSlotNames<TRecipe>;
      }
    : {
        hostSlot: RecipeSlotNames<TRecipe>;
      };

export type SlotStyledOptions<
  Base extends ElementType,
  TRecipe extends AnySlotRecipeLike,
  WithRender extends boolean = false,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {},
> = StyledOptionsCommon<Base, TRecipe, Aliases, Forwarded> & {
  withRender?: WithRender;
  view: ComponentType<
    SlotStyledViewProps<
      Base,
      TRecipe,
      WithRender,
      Aliases,
      Forwarded,
      NoInfer<ViewProps>
    >
  >;
} & ViewPropsOption<Base, TRecipe, Aliases, ViewProps> &
  HostSlotOption<TRecipe>;

export interface StyledFn {
  <
    Base extends AnyIntrinsicElement,
    TRecipe extends AnyRootRecipeLike,
    const WithRender extends boolean = false,
    const Aliases extends PropAliases<Base> = {},
    const Forwarded extends string = never,
    const ViewProps extends ViewPropsShape = {},
  >(
    base: Base,
    inputRecipe: TRecipe,
    options?: RootStyledOptions<
      Base,
      TRecipe,
      WithRender,
      Aliases,
      Forwarded,
      ViewProps
    >
  ): StyledComponent<Base, TRecipe, WithRender, Aliases, Forwarded, ViewProps>;

  <
    Base extends Exclude<ElementType, AnyIntrinsicElement>,
    TRecipe extends AnyRootRecipeLike,
    const Aliases extends PropAliases<Base> = {},
    const Forwarded extends string = never,
    const ViewProps extends ViewPropsShape = {},
  >(
    base: Base,
    inputRecipe: TRecipe,
    options?: RootStyledOptions<
      Base,
      TRecipe,
      false,
      Aliases,
      Forwarded,
      ViewProps
    >
  ): StyledComponent<Base, TRecipe, false, Aliases, Forwarded, ViewProps>;

  <
    Base extends AnyIntrinsicElement,
    TRecipe extends AnySlotRecipeLike,
    const WithRender extends boolean = false,
    const Aliases extends PropAliases<Base> = {},
    const Forwarded extends string = never,
    const ViewProps extends ViewPropsShape = {},
  >(
    base: Base,
    inputRecipe: TRecipe,
    options: SlotStyledOptions<
      Base,
      TRecipe,
      WithRender,
      Aliases,
      Forwarded,
      ViewProps
    >
  ): StyledComponent<Base, TRecipe, WithRender, Aliases, Forwarded, ViewProps>;

  <
    Base extends Exclude<ElementType, AnyIntrinsicElement>,
    TRecipe extends AnySlotRecipeLike,
    const Aliases extends PropAliases<Base> = {},
    const Forwarded extends string = never,
    const ViewProps extends ViewPropsShape = {},
  >(
    base: Base,
    inputRecipe: TRecipe,
    options: SlotStyledOptions<
      Base,
      TRecipe,
      false,
      Aliases,
      Forwarded,
      ViewProps
    >
  ): StyledComponent<Base, TRecipe, false, Aliases, Forwarded, ViewProps>;
}
