/* eslint-disable @typescript-eslint/no-explicit-any -- public recipe types intentionally carry erased runtime metadata through a hidden symbol brand. */
export type ClassNameValue = string | null | readonly string[];
export type ClassValue = ClassNameValue;

export type ValidateMode = 'never' | 'always';

export interface SystemOptions {
  merge?: (className: string) => string;
  validate?: ValidateMode;
}

export type Simplify<T> = {
  [Key in keyof T]: T[Key];
} & {};

export type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T;

export type SlotClassNameMap<Slots extends string> = Partial<
  Record<Slots, ClassNameValue>
>;

export type RootVariantsSchema = Record<string, Record<string, ClassNameValue>>;

export type SlotVariantsSchema<Slots extends string> = Record<
  string,
  Record<string, SlotClassNameMap<Slots>>
>;

type AnyVariantsSchema = Record<string, Record<string, unknown>>;
type BooleanOptionKey = 'true' | 'false';

type IsMixedBooleanVariant<Options extends Record<string, unknown>> = Extract<
  keyof Options & string,
  BooleanOptionKey
> extends never
  ? false
  : Exclude<keyof Options & string, BooleanOptionKey> extends never
  ? false
  : true;

type RejectMixedBooleanVariants<Variants extends AnyVariantsSchema> = {
  [Key in keyof Variants]: Variants[Key] extends infer Options extends Record<
    string,
    unknown
  >
    ? IsMixedBooleanVariant<Options> extends true
      ? never
      : Options
    : Variants[Key];
};

export type VariantSelectionValues<Variants extends AnyVariantsSchema> = {
  [Key in keyof Variants]: Variants[Key] extends infer Options extends Record<
    string,
    unknown
  >
    ? StringToBoolean<keyof Options & string>
    : never;
};

type BooleanVariantKeys<Variants extends AnyVariantsSchema> = {
  [Key in keyof Variants]: Variants[Key] extends infer Options extends Record<
    string,
    unknown
  >
    ? 'true' extends keyof Options
      ? Key
      : 'false' extends keyof Options
      ? Key
      : never
    : never;
}[keyof Variants];

type OptionalVariantKeys<
  Variants extends AnyVariantsSchema,
  Defaults extends object
> = BooleanVariantKeys<Variants> | Extract<keyof Variants, keyof Defaults>;

export type VariantInput<
  Variants extends AnyVariantsSchema,
  Defaults extends object
> = keyof Variants extends never
  ? {}
  : Simplify<
      Required<
        Omit<
          VariantSelectionValues<Variants>,
          OptionalVariantKeys<Variants, Defaults>
        >
      > &
        Partial<
          Pick<
            VariantSelectionValues<Variants>,
            OptionalVariantKeys<Variants, Defaults>
          >
        >
    >;

export type ResolvedVariantInput<Variants extends AnyVariantsSchema> =
  keyof Variants extends never
    ? {}
    : Simplify<VariantSelectionValues<Variants>>;

type CompoundSelectorInput<Variants extends AnyVariantsSchema> = Partial<{
  [Key in keyof VariantSelectionValues<Variants>]:
    | VariantSelectionValues<Variants>[Key]
    | readonly VariantSelectionValues<Variants>[Key][];
}>;

export type RootCompoundVariant<Variants extends RootVariantsSchema> = Simplify<
  CompoundSelectorInput<Variants> & {
    className: ClassNameValue;
  }
>;

export type SlotCompoundVariant<
  Slots extends string,
  Variants extends SlotVariantsSchema<Slots>
> = Simplify<
  CompoundSelectorInput<Variants> & {
    className: SlotClassNameMap<Slots>;
  }
>;

export type RootRecipeConfig<
  Variants extends RootVariantsSchema = {},
  Defaults extends Partial<VariantSelectionValues<Variants>> = {}
> = {
  base?: ClassNameValue;
  slots?: never;
  variants?: RejectMixedBooleanVariants<Variants>;
  compoundVariants?: readonly RootCompoundVariant<Variants>[];
  defaultVariants?: Defaults;
};

export type SlotRecipeConfig<
  SlotDefs extends Record<string, ClassNameValue> = Record<
    string,
    ClassNameValue
  >,
  Variants extends SlotVariantsSchema<keyof SlotDefs & string> = {},
  Defaults extends Partial<VariantSelectionValues<Variants>> = {}
> = {
  base?: never;
  slots: SlotDefs;
  variants?: RejectMixedBooleanVariants<Variants>;
  compoundVariants?: readonly SlotCompoundVariant<
    keyof SlotDefs & string,
    Variants
  >[];
  defaultVariants?: Defaults;
};

export type AnyRootRecipeConfig = RootRecipeConfig<any, any>;
export type AnySlotRecipeConfig = SlotRecipeConfig<any, any, any>;
export type RecipeConfig = AnyRootRecipeConfig | AnySlotRecipeConfig;

export type ResolveOptions<
  VariantKeys extends string = string,
  PropAliases extends Record<string, string> = Record<string, string>
> = {
  forwardProps?: readonly VariantKeys[];
  propAliases?: PropAliases;
};

type ResolveInputProps<TInput> = TInput extends Record<string, unknown>
  ? TInput
  : {};

type ResolveInputPropAliases<TOptions> = TOptions extends {
  propAliases?: infer PropAliases;
}
  ? Exclude<PropAliases, undefined> extends infer DefinedPropAliases
    ? DefinedPropAliases extends Record<string, string>
      ? DefinedPropAliases
      : {}
    : {}
  : {};

type ResolveInputForwardProps<TOptions> = TOptions extends {
  forwardProps?: infer ForwardProps;
}
  ? Exclude<ForwardProps, undefined> extends infer DefinedForwardProps
    ? DefinedForwardProps extends readonly string[]
      ? DefinedForwardProps
      : undefined
    : undefined
  : undefined;

type NonVariantResolveInputProps<TRecipe, TInput> = Omit<
  ResolveInputProps<TInput>,
  keyof VariantProps<TRecipe>
>;

type HasSpecificResolvePropAliases<
  TPropAliases extends Record<string, string>
> = string extends keyof TPropAliases ? false : true;

type HasExactResolveForwardProps<TForwardProps extends readonly string[]> =
  number extends TForwardProps['length'] ? false : true;

type ResolveAliasedPropKeys<
  TProps,
  TPropAliases extends Record<string, string>
> =
  | Exclude<keyof TProps, TPropAliases[keyof TPropAliases] & string>
  | (keyof TPropAliases & string);

type ResolveAliasedPropValue<
  TProps,
  TPropAliases extends Record<string, string>,
  Key extends PropertyKey
> = Key extends keyof TPropAliases & string
  ? TPropAliases[Key] extends keyof TProps
    ? TProps[TPropAliases[Key]]
    : Key extends keyof TProps
    ? TProps[Key]
    : never
  : Key extends keyof TProps
  ? TProps[Key]
  : never;

type ApplyResolvePropAliases<
  TProps,
  TPropAliases extends Record<string, string>
> = HasSpecificResolvePropAliases<TPropAliases> extends true
  ? Simplify<{
      [Key in ResolveAliasedPropKeys<
        TProps,
        TPropAliases
      > as ResolveAliasedPropValue<TProps, TPropAliases, Key> extends never
        ? never
        : Key]: ResolveAliasedPropValue<TProps, TPropAliases, Key>;
    }>
  : TProps;

type ResolveForwardPropKeys<
  TRecipe,
  TForwardProps extends readonly string[]
> = Extract<
  TForwardProps[number],
  keyof ResolvedVariantProps<TRecipe> & string
>;

type ApplyResolveForwardProps<
  TRecipe,
  TProps,
  TForwardProps extends readonly string[] | undefined
> = TForwardProps extends readonly string[]
  ? HasExactResolveForwardProps<TForwardProps> extends true
    ? Simplify<
        Omit<
          TProps,
          Extract<ResolveForwardPropKeys<TRecipe, TForwardProps>, keyof TProps>
        > &
          Pick<
            ResolvedVariantProps<TRecipe>,
            ResolveForwardPropKeys<TRecipe, TForwardProps>
          >
      >
    : Simplify<
        TProps &
          Partial<
            Pick<
              ResolvedVariantProps<TRecipe>,
              ResolveForwardPropKeys<TRecipe, TForwardProps>
            >
          >
      >
  : TProps;

type ResolveInputPropsWithOptions<TRecipe, TInput, TOptions> =
  ApplyResolveForwardProps<
    TRecipe,
    ApplyResolvePropAliases<
      NonVariantResolveInputProps<TRecipe, TInput>,
      ResolveInputPropAliases<TOptions>
    >,
    ResolveInputForwardProps<TOptions>
  >;

type RootResolvedProps<TRecipe, TInput, TOptions> = Simplify<
  ResolveInputPropsWithOptions<TRecipe, TInput, TOptions> & {
    className: string;
  }
>;

type SlotResolvedProps<TRecipe, TInput, TOptions> =
  ResolveInputPropsWithOptions<TRecipe, TInput, TOptions>;

export type RootRecipeInput<TRecipe> = VariantProps<TRecipe> & {
  className?: ClassNameValue;
};

export type SlotRecipeInput<TRecipe> = VariantProps<TRecipe>;

export type SlotRenderInput<TRecipe> = Partial<VariantProps<TRecipe>> & {
  className?: ClassNameValue;
};

export type SlotRenderFunction<TRecipe> = (
  input?: SlotRenderInput<TRecipe>
) => string;

export type SlotDefinitions<TRecipe> =
  RecipeConfigOf<TRecipe> extends SlotRecipeConfig<infer SlotDefs, any, any>
    ? SlotDefs
    : Record<SlotNames<TRecipe>, ClassNameValue>;

export type SlotRenderMap<TRecipe> = {
  [Slot in keyof SlotDefinitions<TRecipe>]: SlotRenderFunction<TRecipe>;
};

export type RecipeTypeMetadata<
  Mode extends 'root' | 'slot',
  Slots extends string,
  Variants extends AnyVariantsSchema,
  Defaults extends object,
  Config = never
> = {
  mode: Mode;
  slots: Slots;
  variants: Variants;
  defaults: Defaults;
  config: Config;
};

declare const recipeTypeSymbol: unique symbol;

type RecipeBrand<
  Mode extends 'root' | 'slot',
  Slots extends string,
  Variants extends AnyVariantsSchema,
  Defaults extends object,
  Config
> = {
  readonly [recipeTypeSymbol]?: RecipeTypeMetadata<
    Mode,
    Slots,
    Variants,
    Defaults,
    Config
  >;
};

export type RootResolveResult<
  TRecipe,
  TInput extends Record<string, unknown> | undefined = undefined,
  TOptions extends ResolveOptions | undefined = undefined
> = {
  variants: ResolvedVariantProps<TRecipe>;
  resolvedProps: RootResolvedProps<TRecipe, TInput, TOptions>;
};

export type SlotResolveResult<
  TRecipe,
  TInput extends Record<string, unknown> | undefined = undefined,
  TOptions extends ResolveOptions | undefined = undefined
> = {
  variants: ResolvedVariantProps<TRecipe>;
  slots: SlotRenderMap<TRecipe>;
  resolvedProps: SlotResolvedProps<TRecipe, TInput, TOptions>;
};

export type RootRecipe<
  Variants extends RootVariantsSchema = {},
  Defaults extends object = {},
  Config = RootRecipeConfig<Variants, any>
> = RecipeBrand<'root', never, Variants, Defaults, Config> & {
  (input?: RootRecipeInput<RootRecipe<Variants, Defaults, Config>>): string;
  resolve<
    TInput extends Record<string, unknown> | undefined = undefined,
    const TOptions extends
      | ResolveOptions<Extract<keyof Variants, string>>
      | undefined = undefined
  >(
    input?: TInput,
    options?: TOptions
  ): RootResolveResult<
    RootRecipe<Variants, Defaults, Config>,
    TInput,
    TOptions
  >;
};

export type SlotRecipe<
  Slots extends string = string,
  Variants extends SlotVariantsSchema<Slots> = {},
  Defaults extends object = {},
  Config = SlotRecipeConfig<Record<Slots, ClassNameValue>, any, any>
> = RecipeBrand<'slot', Slots, Variants, Defaults, Config> & {
  (
    input?: SlotRecipeInput<SlotRecipe<Slots, Variants, Defaults, Config>>
  ): SlotRenderMap<SlotRecipe<Slots, Variants, Defaults, Config>>;
  resolve<
    TInput extends Record<string, unknown> | undefined = undefined,
    const TOptions extends
      | ResolveOptions<Extract<keyof Variants, string>>
      | undefined = undefined
  >(
    input?: TInput,
    options?: TOptions
  ): SlotResolveResult<
    SlotRecipe<Slots, Variants, Defaults, Config>,
    TInput,
    TOptions
  >;
};

export type AnyRootRecipe = RecipeBrand<'root', never, any, any, any> & {
  readonly resolve: (...args: any[]) => RootResolveResult<any, any, any>;
};

export type AnySlotRecipe = RecipeBrand<'slot', any, any, any, any> & {
  readonly resolve: (...args: any[]) => SlotResolveResult<any, any, any>;
};

export type AnyRecipe = AnyRootRecipe | AnySlotRecipe;
export type Recipe = AnyRecipe;

export type RecipeFactory = {
  <
    const SlotDefs extends Record<string, ClassNameValue>,
    const Variants extends SlotVariantsSchema<keyof SlotDefs & string> = {},
    const Defaults extends Partial<VariantSelectionValues<Variants>> = {}
  >(
    config: SlotRecipeConfig<SlotDefs, Variants, Defaults>
  ): SlotRecipe<
    keyof SlotDefs & string,
    Variants,
    Defaults,
    SlotRecipeConfig<SlotDefs, Variants, Defaults>
  >;

  <
    const Variants extends RootVariantsSchema = {},
    const Defaults extends Partial<VariantSelectionValues<Variants>> = {}
  >(
    config: RootRecipeConfig<Variants, Defaults>
  ): RootRecipe<Variants, Defaults, RootRecipeConfig<Variants, Defaults>>;
};

export type VariantProps<TRecipe> = TRecipe extends RecipeBrand<
  any,
  any,
  infer Variants extends AnyVariantsSchema,
  infer Defaults extends object,
  any
>
  ? VariantInput<Variants, Defaults>
  : never;

export type ResolvedVariantProps<TRecipe> = TRecipe extends RecipeBrand<
  any,
  any,
  infer Variants extends AnyVariantsSchema,
  any,
  any
>
  ? ResolvedVariantInput<Variants>
  : never;

export type SlotNames<TRecipe> = TRecipe extends RecipeBrand<
  any,
  infer Slots,
  any,
  any,
  any
>
  ? Slots & string
  : never;

export type RecipeConfigOf<TRecipe> = TRecipe extends RecipeBrand<
  any,
  any,
  any,
  any,
  infer Config
>
  ? Config
  : never;

export type RecipeInput<TRecipe> = TRecipe extends AnyRootRecipe
  ? RootRecipeInput<TRecipe>
  : TRecipe extends AnySlotRecipe
  ? SlotRecipeInput<TRecipe>
  : never;

export type RecipeResolved<TRecipe> = TRecipe extends AnyRootRecipe
  ? RootResolveResult<TRecipe>
  : TRecipe extends AnySlotRecipe
  ? SlotResolveResult<TRecipe>
  : never;
