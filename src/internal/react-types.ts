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
  ClassNameValue,
  ResolvedVariantProps,
  Simplify,
  VariantProps,
} from './core-types';

export type AnyElementType = ElementType;
export type AnyIntrinsicElement = keyof JSX.IntrinsicElements;
declare const viewPropsShapeSymbol: unique symbol;

type ReservedReactPublicProps = 'children' | 'className' | 'ref' | 'render';
type BaseProps<Base extends AnyElementType> = ComponentPropsWithRef<Base>;
type ViewPropsShape = Record<string, unknown>;
type HasKeys<T> = [keyof T] extends [never] ? false : true;
type HasForwardedKeys<Forwarded extends string> = [Forwarded] extends [never]
  ? false
  : true;
type StructuralRecipeInput<TRecipe> = TRecipe extends (
  input?: infer Input
) => any
  ? Exclude<Input, undefined>
  : never;
type StructuralRecipeVariantProps<TRecipe> =
  StructuralRecipeInput<TRecipe> extends infer DefinedInput
    ? TRecipe extends { resolve: (...args: any[]) => { slots: unknown } }
      ? DefinedInput extends object
        ? Omit<DefinedInput, 'slotClassNames'>
        : DefinedInput
      : DefinedInput extends { className?: ClassNameValue }
      ? Omit<DefinedInput, 'className'>
      : DefinedInput
    : never;
type StructuralResolvedRecipeVariantProps<TRecipe> = TRecipe extends {
  resolve: (...args: any[]) => infer Result;
}
  ? Result extends { variants: infer Variants }
    ? Variants
    : never
  : never;
// The root entry and `/core` entry currently emit independent declaration
// graphs, so React helpers need a structural fallback when brand-based core
// helpers see a recipe from the sibling entrypoint.
type RecipeVariantMap<TRecipe> = [VariantProps<TRecipe>] extends [never]
  ? StructuralRecipeVariantProps<TRecipe>
  : VariantProps<TRecipe>;
type ResolvedRecipeVariantMap<TRecipe> = [
  ResolvedVariantProps<TRecipe>
] extends [never]
  ? StructuralResolvedRecipeVariantProps<TRecipe>
  : ResolvedVariantProps<TRecipe>;
type StructuralSlotRenderMap<TRecipe> = TRecipe extends (
  input?: any
) => infer RenderMap
  ? RenderMap extends Record<
      string,
      (input?: Record<string, unknown>) => string
    >
    ? RenderMap
    : never
  : never;
type RecipeSlotRenderMap<TRecipe> = StructuralSlotRenderMap<TRecipe>;
type RecipeSlotNames<TRecipe> = keyof RecipeSlotRenderMap<TRecipe> & string;
type StyledSlotClassNames<TRecipe> = Partial<{
  [Slot in keyof RecipeSlotRenderMap<TRecipe>]: ClassNameValue;
}>;
type ConsumedStyledPropKeys<TRecipe> =
  | 'className'
  | (TRecipe extends AnySlotRecipeLike ? 'slotClassNames' : never);
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

export type PropAliases<Base extends AnyElementType> = Partial<
  Record<
    Exclude<keyof BaseProps<Base> & string, ReservedReactPublicProps>,
    string
  >
>;

export type ViewPropsDescriptor<TViewProps extends ViewPropsShape = {}> = {
  readonly keys: readonly (keyof TViewProps & string)[];
  readonly [viewPropsShapeSymbol]?: TViewProps;
};

type AliasProps<
  Base extends AnyElementType,
  Aliases extends PropAliases<Base>
> = HasKeys<Aliases> extends true
  ? {
      [NativeKey in keyof Aliases &
        keyof BaseProps<Base> as Aliases[NativeKey] &
        string]?: BaseProps<Base>[NativeKey];
    }
  : {};

type VariantPropKeys<TRecipe> = [RecipeVariantMap<TRecipe>] extends [never]
  ? never
  : keyof RecipeVariantMap<TRecipe>;

type ForwardedRenderVariantProps<TRecipe, Forwarded extends string> = [
  HasForwardedKeys<Forwarded>
] extends [false]
  ? {}
  : [TRecipe] extends [never]
  ? {}
  : Pick<
      ResolvedRecipeVariantMap<TRecipe>,
      Extract<Forwarded, keyof ResolvedRecipeVariantMap<TRecipe> & string>
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

type BasePropKeys<Base extends AnyElementType> = keyof BaseProps<Base> & string;
type AliasPublicPropKeys<Aliases> = Aliases[keyof Aliases] & string;

type DisallowedAliasTargetKeys<Base extends AnyElementType, TRecipe> =
  | ReservedStyledAliasKeys<TRecipe>
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
> = HasKeys<Aliases> extends true
  ? {
      [NativeKey in keyof Aliases]: ValidatedAliasValue<
        Aliases[NativeKey],
        DisallowedAliasTargetKeys<Base, TRecipe>
      >;
    }
  : Aliases;

type DisallowedViewPropKeys<
  Base extends AnyElementType,
  TRecipe,
  Aliases extends PropAliases<Base>
> =
  | ReservedStyledAliasKeys<TRecipe>
  | BasePropKeys<Base>
  | Extract<VariantPropKeys<TRecipe>, string>
  | AliasPublicPropKeys<Aliases>;

type ValidatedViewProps<
  Base extends AnyElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  ViewProps extends ViewPropsShape
> = HasKeys<ViewProps> extends true
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
  Base extends AnyElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  ViewProps extends ViewPropsShape
> = ViewPropsDescriptor<ValidatedViewProps<Base, TRecipe, Aliases, ViewProps>>;

type ViewPropsOption<
  Base extends AnyElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  ViewProps extends ViewPropsShape
> = HasKeys<ViewProps> extends true
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

type ResolvedForwardedVariantProps<TRecipe, Forwarded extends string> = Pick<
  ResolvedRecipeVariantMap<TRecipe>,
  never
> &
  (HasForwardedKeys<Forwarded> extends true
    ? Pick<
        ResolvedRecipeVariantMap<TRecipe>,
        Extract<Forwarded, keyof ResolvedRecipeVariantMap<TRecipe> & string>
      >
    : {});

type ResolvedAliasTargetProps<
  Base extends AnyElementType,
  Aliases extends PropAliases<Base>
> = HasKeys<Aliases> extends true
  ? {
      [NativeKey in keyof Aliases]?: NativeKey extends keyof BaseProps<Base>
        ? BaseProps<Base>[NativeKey]
        : never;
    }
  : {};

type PublicBaseProps<
  Base extends AnyElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  ViewProps extends ViewPropsShape
> = Omit<
  BaseProps<Base>,
  | VariantPropKeys<TRecipe>
  | keyof Aliases
  | ConsumedStyledPropKeys<TRecipe>
  | keyof ViewProps
>;

type ResolvedBaseProps<
  Base extends AnyElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  Forwarded extends string,
  ViewProps extends ViewPropsShape
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
  Base extends AnyElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  Forwarded extends string,
  ViewProps extends ViewPropsShape
> = Simplify<
  Omit<
    ResolvedBaseProps<Base, TRecipe, Aliases, Forwarded, ViewProps>,
    'className' | 'children' | 'ref' | 'render'
  >
>;

type StyledComponent<
  Base extends AnyElementType,
  TRecipe,
  WithRender extends boolean,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {}
> = ForwardRefExoticComponent<
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
  Base extends AnyElementType,
  TRecipe,
  WithRender extends boolean,
  Aliases extends PropAliases<Base>,
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {}
> = Simplify<
  PublicBaseProps<Base, TRecipe, Aliases, ViewProps> &
    AliasProps<Base, Aliases> &
    RecipeVariantMap<TRecipe> &
    StyledRecipePublicProps<TRecipe> &
    ViewProps &
    (WithRender extends true ? { render?: RenderProp<TRecipe, Forwarded> } : {})
>;

export type HostRenderOverrides<
  Base extends AnyElementType,
  TRecipe,
  WithRender extends boolean,
  Forwarded extends string = never
> = Simplify<
  Partial<Omit<BaseProps<Base>, 'className'>> &
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
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {}
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
  Base extends AnyElementType,
  TRecipe extends AnyRootRecipeLike,
  WithRender extends boolean,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {}
> = {
  host: HostView<Base, TRecipe, WithRender, Aliases, Forwarded, ViewProps>;
  variants: ResolvedRecipeVariantMap<TRecipe>;
};

export type SlotStyledViewProps<
  Base extends AnyElementType,
  TRecipe extends AnySlotRecipeLike,
  WithRender extends boolean,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {}
> = {
  host: HostView<Base, TRecipe, WithRender, Aliases, Forwarded, ViewProps>;
  variants: ResolvedRecipeVariantMap<TRecipe>;
  classes: Readonly<RecipeSlotRenderMap<TRecipe>>;
};

export type StyledOptionsCommon<
  Base extends AnyElementType,
  TRecipe,
  Aliases extends PropAliases<Base>,
  Forwarded extends string
> = {
  displayName?: string;
  forwardProps?: readonly Forwarded[] &
    readonly (keyof RecipeVariantMap<TRecipe> & string)[];
  propAliases?: ValidatedPropAliases<Base, TRecipe, Aliases>;
};

export type RootStyledOptions<
  Base extends AnyElementType,
  TRecipe extends AnyRootRecipeLike,
  WithRender extends boolean = false,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {}
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
  Base extends AnyElementType,
  TRecipe extends AnySlotRecipeLike,
  WithRender extends boolean = false,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {}
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

export type StyledComponentType<
  Base extends AnyElementType,
  TRecipe,
  WithRender extends boolean,
  Aliases extends PropAliases<Base> = {},
  Forwarded extends string = never,
  ViewProps extends ViewPropsShape = {}
> = StyledComponent<Base, TRecipe, WithRender, Aliases, Forwarded, ViewProps>;

export interface StyledFn {
  <
    Base extends AnyIntrinsicElement,
    TRecipe extends AnyRootRecipeLike,
    const WithRender extends boolean = false,
    const Aliases extends PropAliases<Base> = {},
    const Forwarded extends string = never,
    const ViewProps extends ViewPropsShape = {}
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
  ): StyledComponentType<
    Base,
    TRecipe,
    WithRender,
    Aliases,
    Forwarded,
    ViewProps
  >;

  <
    Base extends Exclude<AnyElementType, AnyIntrinsicElement>,
    TRecipe extends AnyRootRecipeLike,
    const Aliases extends PropAliases<Base> = {},
    const Forwarded extends string = never,
    const ViewProps extends ViewPropsShape = {}
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
  ): StyledComponentType<Base, TRecipe, false, Aliases, Forwarded, ViewProps>;

  <
    Base extends AnyIntrinsicElement,
    TRecipe extends AnySlotRecipeLike,
    const WithRender extends boolean = false,
    const Aliases extends PropAliases<Base> = {},
    const Forwarded extends string = never,
    const ViewProps extends ViewPropsShape = {}
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
  ): StyledComponentType<
    Base,
    TRecipe,
    WithRender,
    Aliases,
    Forwarded,
    ViewProps
  >;

  <
    Base extends Exclude<AnyElementType, AnyIntrinsicElement>,
    TRecipe extends AnySlotRecipeLike,
    const Aliases extends PropAliases<Base> = {},
    const Forwarded extends string = never,
    const ViewProps extends ViewPropsShape = {}
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
  ): StyledComponentType<Base, TRecipe, false, Aliases, Forwarded, ViewProps>;
}
