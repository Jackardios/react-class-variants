/* eslint-disable @typescript-eslint/no-explicit-any -- React polymorphism intentionally accepts broad element/function props. */
import type {
  ComponentPropsWithRef,
  ComponentRef,
  ComponentType,
  ElementType,
  FunctionComponent,
  HTMLAttributes,
  JSX,
  ReactElement,
  ReactNode,
  Ref,
  RefAttributes,
} from 'react';
import type {
  ClassNameValue,
  OptionalProps,
  ResolvedVariantProps,
  Simplify,
  SlotRenderMap,
  VariantProps,
} from './core-types';

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
type StyledSlotClassNames<TRecipe> = {
  [Slot in keyof SlotRenderMap<TRecipe>]?: ClassNameValue | undefined;
};
type ConsumedStyledPropKeys<TRecipe> =
  'className' | (TRecipe extends AnySlotRecipeLike ? 'slotClassNames' : never);
type ReservedStyledAliasKeys<TRecipe> =
  | ReservedReactPublicProps
  | (TRecipe extends AnySlotRecipeLike ? 'slotClassNames' : never);
type StyledRecipePublicProps<TRecipe> = {
  className?: ClassNameValue | undefined;
} & (TRecipe extends AnySlotRecipeLike
  ? {
      slotClassNames?: StyledSlotClassNames<TRecipe> | undefined;
    }
  : {});
// Root and slotted recipes, told apart by the mode in their type-only brand
// (RecipeBrand in core-types). Matching the brand is one property comparison;
// matching a recipe's call and `resolve()` signatures cost more than the rest
// of a styled() call. The call signature rejects objects, and a function
// without the brand shares no property with the brand, so TypeScript still
// rejects it.
export type AnyRootRecipeLike = {
  (...args: any[]): unknown;
  readonly resolve: (...args: any[]) => unknown;
  readonly '~rcv'?: { readonly mode: 'root' };
};
export type AnySlotRecipeLike = {
  (...args: any[]): unknown;
  readonly resolve: (...args: any[]) => unknown;
  readonly '~rcv'?: { readonly mode: 'slot' };
};

export type PropAliases<Base extends ElementType> = {
  [
    NativeKey in Exclude<
      keyof BaseProps<Base> & string,
      ReservedReactPublicProps
    >
  ]?: string | undefined;
};

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
    ref?: Ref<any> | undefined;
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

// A taken name maps to a message type, so the error explains the conflict
// instead of reporting "not assignable to never".
type ValidatedAliasValue<
  AliasValue,
  Disallowed extends string,
> = AliasValue extends string
  ? AliasValue extends Disallowed
    ? `${AliasValue} is already a variant, base, or reserved prop name`
    : AliasValue
  : AliasValue;

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
        /**
         * Props that only `view` reads, declared with `defineViewProps()`.
         * They reach `host.props` but never the rendered element.
         */
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
    // React never passes `key` as a prop. A component base keeps its own
    // `render` prop here; an intrinsic base has none.
    'className' | 'children' | 'ref' | 'key'
  > & {
    // Data attributes pass through like any other prop (see
    // HostRenderOverrides).
    [dataAttribute: `data-${string}`]: unknown;
  }
>;

// An interface rather than an alias, so editors and emitted declarations refer
// to a component by this name instead of expanding its whole props type.
export interface StyledComponent<
  Base extends ElementType,
  TRecipe,
  WithRender extends boolean = false,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {},
> extends FunctionComponent<
  StyledComponentOwnProps<
    Base,
    TRecipe,
    WithRender,
    Aliases,
    Forwarded,
    ViewProps
  > &
    RefAttributes<ComponentRef<Base>>
> {}

// StyledComponentProps without `ref`, dropped in the same Omit as the variant
// keys: `PropsWithoutRef<StyledComponentProps<...>>` walks every base prop a
// second time for each component.
type StyledComponentOwnProps<
  Base extends ElementType,
  TRecipe,
  WithRender extends boolean,
  Aliases extends PropAliases<Base>,
  Forwarded extends string,
  ViewProps extends ViewPropsShape,
> = Simplify<
  Omit<
    BaseProps<Base>,
    | VariantPropKeys<TRecipe>
    | keyof Aliases
    | ConsumedStyledPropKeys<TRecipe>
    | keyof ViewProps
    | 'ref'
  > &
    AliasProps<Base, Aliases> &
    VariantProps<TRecipe> &
    StyledRecipePublicProps<TRecipe> &
    ViewProps &
    RenderPropOption<TRecipe, WithRender, Forwarded>
>;

export type StyledComponentProps<
  Base extends ElementType,
  TRecipe,
  WithRender extends boolean = false,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {},
> = Simplify<
  PublicBaseProps<Base, TRecipe, Aliases, ViewProps> &
    AliasProps<Base, Aliases> &
    VariantProps<TRecipe> &
    StyledRecipePublicProps<TRecipe> &
    ViewProps &
    RenderPropOption<TRecipe, WithRender, Forwarded>
>;

type RenderPropOption<
  TRecipe,
  WithRender extends boolean,
  Forwarded extends string,
> = WithRender extends true
  ? { render?: RenderProp<TRecipe, Forwarded> | undefined }
  : {};

export type HostRenderOverrides<
  Base extends ElementType,
  TRecipe,
  WithRender extends boolean = false,
  Forwarded extends string = never,
> = Simplify<
  OptionalProps<Omit<BaseProps<Base>, 'className' | 'key'>> & {
    // Like JSX, overrides accept data attributes beyond the base props.
    [dataAttribute: `data-${string}`]: unknown;
    className?: ClassNameValue | undefined;
  } & (WithRender extends true
      ? { render?: RenderProp<TRecipe, Forwarded> | undefined }
      : {})
>;

export type HostView<
  Base extends ElementType,
  TRecipe,
  WithRender extends boolean = false,
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
  WithRender extends boolean = false,
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
  WithRender extends boolean = false,
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
  /** Component name in React DevTools; defaults to `Styled(<base>)`. */
  displayName?: string | undefined;
  /**
   * Variant names whose resolved values also reach the base as props, for
   * example `['disabled']` for a `disabled` variant on a `<button>`.
   */
  forwardProps?:
    | (readonly Forwarded[] & readonly (keyof VariantProps<TRecipe> & string)[])
    | undefined;
  // `& PropAliases<Base>` lets editors complete the base prop names while
  // `Aliases` is still being inferred.
  /**
   * Exposes a base prop under another name when a variant already uses its
   * name: `{ size: 'htmlSize' }` passes the `htmlSize` prop to the base as
   * `size`.
   */
  propAliases?:
    | (ValidatedPropAliases<Base, TRecipe, Aliases> & PropAliases<Base>)
    | undefined;
};

// `view` takes no part in inference (NoInfer): the type parameters come from
// the other options. Inferring from a view's parameter made TypeScript measure
// the variance of the view props types, and through them of React's
// ComponentPropsWithRef over every intrinsic element: about 120k type
// instantiations, once per program with a view.
export type RootStyledOptions<
  Base extends ElementType,
  TRecipe extends AnyRootRecipeLike,
  WithRender extends boolean = false,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {},
> = StyledOptionsCommon<Base, TRecipe, Aliases, Forwarded> & {
  /**
   * Adds a `render` prop, an element or a function of the props, that
   * replaces the rendered element. Intrinsic bases only.
   */
  withRender?: WithRender | undefined;
} & (
    | {
        view?: undefined;
        viewProps?: undefined;
      }
    | ({
        /**
         * Renders the component from the resolved `host` and `variants`,
         * usually by returning `host.render()`.
         */
        view: ComponentType<
          NoInfer<
            RootStyledViewProps<
              Base,
              TRecipe,
              WithRender,
              Aliases,
              Forwarded,
              ViewProps
            >
          >
        >;
      } & ViewPropsOption<Base, TRecipe, Aliases, ViewProps>)
  );

// Spelled out instead of `RecipeSlotNames<TRecipe>`, so hovers and errors
// list the slot names rather than the alias.
type HostSlotOption<TRecipe extends AnySlotRecipeLike> =
  'root' extends keyof SlotRenderMap<TRecipe>
    ? {
        /** Slot whose classes go on the host element; defaults to `root`. */
        hostSlot?: (keyof SlotRenderMap<TRecipe> & string) | undefined;
      }
    : {
        /** Slot whose classes go on the host element. */
        hostSlot: keyof SlotRenderMap<TRecipe> & string;
      };

export type SlotStyledOptions<
  Base extends ElementType,
  TRecipe extends AnySlotRecipeLike,
  WithRender extends boolean = false,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {},
> = StyledOptionsCommon<Base, TRecipe, Aliases, Forwarded> & {
  /**
   * Adds a `render` prop, an element or a function of the props, that
   * replaces the rendered element. Intrinsic bases only.
   */
  withRender?: WithRender | undefined;
  /**
   * Renders the component from the resolved `host`, `variants`, and one class
   * function per slot in `classes`.
   */
  view: ComponentType<
    NoInfer<
      SlotStyledViewProps<
        Base,
        TRecipe,
        WithRender,
        Aliases,
        Forwarded,
        ViewProps
      >
    >
  >;
} & ViewPropsOption<Base, TRecipe, Aliases, ViewProps> &
  HostSlotOption<TRecipe>;

/** `withRender` only applies to intrinsic bases; a component base gets `false`. */
type StyledWithRender<
  Base extends ElementType,
  WithRender extends boolean,
> = Base extends AnyIntrinsicElement ? WithRender : false;

/** The options that fit a recipe: slotted recipes take a `view`. */
type StyledOptionsFor<
  Base extends ElementType,
  TRecipe,
  WithRender extends boolean,
  Aliases extends PropAliases<Base>,
  Forwarded extends string,
  ViewProps extends ViewPropsShape,
> = TRecipe extends AnySlotRecipeLike
  ? SlotStyledOptions<
      Base,
      TRecipe,
      StyledWithRender<Base, WithRender>,
      Aliases,
      Forwarded,
      ViewProps
    >
  : TRecipe extends AnyRootRecipeLike
    ? | RootStyledOptions<
          Base,
          TRecipe,
          StyledWithRender<Base, WithRender>,
          Aliases,
          Forwarded,
          ViewProps
        >
      | undefined
    : never;

/**
 * Builds a React component that renders `base` with the recipe's classes.
 * Variant props become component props; everything else reaches `base`.
 * Slotted recipes need a `view`, and `withRender` adds a `render` prop to
 * intrinsic bases.
 */
export interface StyledFn {
  <Base extends ElementType, TRecipe extends AnyRootRecipeLike>(
    base: Base,
    inputRecipe: TRecipe
  ): StyledComponent<Base, TRecipe>;

  // One signature for every call with options, rather than one overload per
  // base and recipe kind: when every overload fails, TypeScript reports the
  // last one's error, which pointed at the wrong argument (for example
  // "string is not assignable to ComponentType" for a bad `forwardProps`).
  <
    Base extends ElementType,
    TRecipe extends AnyRootRecipeLike | AnySlotRecipeLike,
    const WithRender extends boolean = false,
    const Aliases extends PropAliases<Base> = {},
    // Constrained so that an unknown name is reported against the variant
    // names rather than as "not assignable to never".
    const Forwarded extends Extract<keyof VariantProps<TRecipe>, string> =
      never,
    const ViewProps extends ViewPropsShape = {},
  >(
    base: Base,
    inputRecipe: TRecipe,
    options: StyledOptionsFor<
      Base,
      TRecipe,
      WithRender,
      Aliases,
      Forwarded,
      ViewProps
    >
  ): StyledComponent<
    Base,
    TRecipe,
    StyledWithRender<Base, WithRender>,
    Aliases,
    Forwarded,
    ViewProps
  >;
}
