/* eslint-disable @typescript-eslint/no-explicit-any -- public recipe types intentionally carry erased runtime metadata through a hidden symbol brand. */
export type ClassNameValue = string | null | readonly string[];

export type ValidateMode = 'never' | 'always';

// Optional properties of public input types also accept an explicit
// `undefined`, which the runtime treats as absent, so they stay assignable
// under `exactOptionalPropertyTypes`.
export interface SystemOptions {
  cache?: boolean | { maxSize?: number | undefined } | undefined;
  merge?: ((className: string) => string) | undefined;
  validate?: ValidateMode | undefined;
}

export type Simplify<T> = {
  [Key in keyof T]: T[Key];
} & {};

export type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T;

export type SlotClassNameMap<Slots extends string> = {
  [Slot in Slots]?: ClassNameValue | undefined;
};

export type RootVariantsSchema = Record<string, Record<string, ClassNameValue>>;

export type SlotVariantsSchema<Slots extends string> = Record<
  string,
  Record<string, SlotClassNameMap<Slots>>
>;

type AnyVariantsSchema = Record<string, Record<string, unknown>>;
type BooleanOptionKey = 'true' | 'false';

type IsMixedBooleanVariant<Options extends Record<string, unknown>> =
  Extract<keyof Options & string, BooleanOptionKey> extends never
    ? false
    : Exclude<keyof Options & string, BooleanOptionKey> extends never
      ? false
      : true;

// The members of Object.prototype. The runtime rejects variant keys named
// after them (`key in Object.prototype`): a prop bag without that prop would
// resolve the key to the inherited member instead of the default.
type ObjectPrototypeKey =
  | '__defineGetter__'
  | '__defineSetter__'
  | '__lookupGetter__'
  | '__lookupSetter__'
  | '__proto__'
  | 'constructor'
  | 'hasOwnProperty'
  | 'isPrototypeOf'
  | 'propertyIsEnumerable'
  | 'toLocaleString'
  | 'toString'
  | 'valueOf';

// Rejects variants that mix boolean and named options, and variant keys named
// after an Object.prototype member.
type RejectInvalidVariants<Variants extends AnyVariantsSchema> = {
  [Key in keyof Variants]: Key extends ObjectPrototypeKey
    ? never
    : Variants[Key] extends infer Options extends Record<string, unknown>
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

type DefaultVariantsShape<Variants extends AnyVariantsSchema> = Partial<
  VariantSelectionValues<Variants>
>;

type NoExtraProperties<Actual extends object, Allowed extends object> = Actual &
  Record<Exclude<keyof Actual, keyof Allowed>, never>;

type DefaultVariantsInput<
  Variants extends AnyVariantsSchema,
  Defaults extends DefaultVariantsShape<Variants>,
> = DefaultVariantsShape<NoInfer<Variants>> &
  NoExtraProperties<Defaults, DefaultVariantsShape<NoInfer<Variants>>>;

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

// Partial<T> that also accepts an explicit `undefined` for every key (see
// SystemOptions).
export type OptionalProps<T> = {
  [Key in keyof T]?: T[Key] | undefined;
};

type OptionalVariantKeys<
  Variants extends AnyVariantsSchema,
  Defaults extends object,
> = BooleanVariantKeys<Variants> | Extract<keyof Variants, keyof Defaults>;

export type VariantInput<
  Variants extends AnyVariantsSchema,
  Defaults extends object,
> = keyof Variants extends never
  ? {}
  : Simplify<
      Required<
        Omit<
          VariantSelectionValues<Variants>,
          OptionalVariantKeys<Variants, Defaults>
        >
      > &
        OptionalProps<
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

type CompoundSelectorInput<Variants extends AnyVariantsSchema> = {
  [Key in keyof VariantSelectionValues<Variants>]?:
    | VariantSelectionValues<Variants>[Key]
    | readonly VariantSelectionValues<Variants>[Key][]
    | undefined;
};

export type RootCompoundVariant<Variants extends RootVariantsSchema> = Simplify<
  CompoundSelectorInput<Variants> & {
    className: ClassNameValue;
  }
>;

export type SlotCompoundVariant<
  Slots extends string,
  Variants extends SlotVariantsSchema<Slots>,
> = Simplify<
  CompoundSelectorInput<Variants> & {
    className: SlotClassNameMap<Slots>;
  }
>;

export type RootRecipeConfig<
  Variants extends RootVariantsSchema = {},
  Defaults extends Partial<VariantSelectionValues<Variants>> = {},
> = {
  base?: ClassNameValue | undefined;
  slots?: never;
  variants?: RejectInvalidVariants<Variants> | undefined;
  compoundVariants?: readonly RootCompoundVariant<Variants>[] | undefined;
  defaultVariants?: Defaults | undefined;
};

export type RootRecipeConfigInput<
  Variants extends RootVariantsSchema = {},
  Defaults extends Partial<VariantSelectionValues<Variants>> = {},
> = {
  base?: ClassNameValue | undefined;
  slots?: never;
  variants?: RejectInvalidVariants<Variants> | undefined;
  // NoInfer: only `variants` may drive inference. TypeScript 7 otherwise also
  // infers from compound selectors, widening boolean and slot types.
  compoundVariants?:
    readonly RootCompoundVariant<NoInfer<Variants>>[] | undefined;
  defaultVariants?: DefaultVariantsInput<Variants, Defaults> | undefined;
};

export type SlotRecipeConfig<
  SlotDefs extends Record<string, ClassNameValue> = Record<
    string,
    ClassNameValue
  >,
  Variants extends SlotVariantsSchema<keyof SlotDefs & string> = {},
  Defaults extends Partial<VariantSelectionValues<Variants>> = {},
> = {
  base?: never;
  slots: SlotDefs;
  variants?: RejectInvalidVariants<Variants> | undefined;
  compoundVariants?:
    | readonly SlotCompoundVariant<keyof SlotDefs & string, Variants>[]
    | undefined;
  defaultVariants?: Defaults | undefined;
};

export type SlotRecipeConfigInput<
  SlotDefs extends Record<string, ClassNameValue> = Record<
    string,
    ClassNameValue
  >,
  Variants extends SlotVariantsSchema<keyof SlotDefs & string> = {},
  Defaults extends Partial<VariantSelectionValues<Variants>> = {},
> = {
  base?: never;
  slots: SlotDefs;
  variants?: RejectInvalidVariants<Variants> | undefined;
  // NoInfer: see RootRecipeConfigInput.
  compoundVariants?:
    | readonly SlotCompoundVariant<
        keyof NoInfer<SlotDefs> & string,
        NoInfer<Variants>
      >[]
    | undefined;
  defaultVariants?: DefaultVariantsInput<Variants, Defaults> | undefined;
};

export type AnyRootRecipeConfig = RootRecipeConfig<any, any>;
export type AnySlotRecipeConfig = SlotRecipeConfig<any, any, any>;
export type RecipeConfig = AnyRootRecipeConfig | AnySlotRecipeConfig;

export type ResolveOptions<
  VariantKeys extends string = string,
  PropAliases extends Record<string, string> = Record<string, string>,
> = {
  forwardProps?: readonly VariantKeys[] | undefined;
  propAliases?: PropAliases | undefined;
};

type ResolveInputProps<TInput> =
  TInput extends Record<string, unknown> ? TInput : {};

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
  TPropAliases extends Record<string, string>,
> = string extends keyof TPropAliases ? false : true;

type HasExactResolveForwardProps<TForwardProps extends readonly string[]> =
  number extends TForwardProps['length'] ? false : true;

type ResolveAliasedPropKeys<
  TProps,
  TPropAliases extends Record<string, string>,
> =
  | Exclude<keyof TProps, TPropAliases[keyof TPropAliases] & string>
  | (keyof TPropAliases & string);

type ResolveAliasedPropValue<
  TProps,
  TPropAliases extends Record<string, string>,
  Key extends PropertyKey,
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
  TPropAliases extends Record<string, string>,
> =
  HasSpecificResolvePropAliases<TPropAliases> extends true
    ? Simplify<{
        [
          Key in ResolveAliasedPropKeys<
            TProps,
            TPropAliases
          > as ResolveAliasedPropValue<TProps, TPropAliases, Key> extends never
            ? never
            : Key
        ]: ResolveAliasedPropValue<TProps, TPropAliases, Key>;
      }>
    : TProps;

type ResolveForwardPropKeys<
  TRecipe,
  TForwardProps extends readonly string[],
> = Extract<
  TForwardProps[number],
  keyof ResolvedVariantProps<TRecipe> & string
>;

type ApplyResolveForwardProps<
  TRecipe,
  TProps,
  TForwardProps extends readonly string[] | undefined,
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

type SlotResolvedProps<TRecipe, TInput, TOptions> = Simplify<
  Omit<
    ResolveInputPropsWithOptions<TRecipe, TInput, TOptions>,
    'slotClassNames'
  >
>;

export type RootRecipeInput<TRecipe> = VariantProps<TRecipe> & {
  className?: ClassNameValue | undefined;
};

type SlotClassNamesForShape<TShape extends object> = {
  [Slot in keyof TShape]?: ClassNameValue | undefined;
};

type SlotRecipeSlotClassNames<TRecipe> = SlotClassNamesForShape<
  SlotDefinitions<TRecipe>
>;

export type SlotRecipeInput<TRecipe> = VariantProps<TRecipe> & {
  slotClassNames?: SlotRecipeSlotClassNames<TRecipe> | undefined;
};

type SlotResolveInputContext<TRecipe> = OptionalProps<VariantProps<TRecipe>> & {
  slotClassNames?: SlotRecipeSlotClassNames<TRecipe> | undefined;
};

type ContextualResolveInput<TContext, TInput> =
  TInput extends Record<string, unknown> ? TContext & TInput : TInput;

export type SlotRenderInput<TRecipe> = OptionalProps<VariantProps<TRecipe>> & {
  className?: ClassNameValue | undefined;
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
  Config = never,
> = {
  mode: Mode;
  slots: Slots;
  variants: Variants;
  defaults: Defaults;
  config: Config;
};

// Type-only brand. The package root and `/core` ship self-contained declaration
// files, so a `unique symbol` key would be a different symbol in each and
// root-entry helpers (VariantProps, RecipeConfigOf, ...) would resolve to
// `never` for recipes created through `/core`. A string key keeps both
// declaration graphs structurally compatible. It never exists at runtime.
type RecipeBrand<
  Mode extends 'root' | 'slot',
  Slots extends string,
  Variants extends AnyVariantsSchema,
  Defaults extends object,
  Config,
> = {
  readonly '~rcv'?: RecipeTypeMetadata<Mode, Slots, Variants, Defaults, Config>;
};

export type RootResolveResult<
  TRecipe,
  TInput extends Record<string, unknown> | undefined = undefined,
  TOptions extends ResolveOptions | undefined = undefined,
> = {
  variants: ResolvedVariantProps<TRecipe>;
  resolvedProps: RootResolvedProps<TRecipe, TInput, TOptions>;
};

export type SlotResolveResult<
  TRecipe,
  TInput extends Record<string, unknown> | undefined = undefined,
  TOptions extends ResolveOptions | undefined = undefined,
> = {
  variants: ResolvedVariantProps<TRecipe>;
  slots: SlotRenderMap<TRecipe>;
  resolvedProps: SlotResolvedProps<TRecipe, TInput, TOptions>;
};

// Recipes stay type aliases: as interfaces, a recipe created inline in a
// styled() argument no longer resolves (TypeScript fixes the inner recipe()
// call while trying the first styled() overload).
export type RootRecipe<
  Variants extends RootVariantsSchema = {},
  Defaults extends object = {},
  Config = RootRecipeConfig<Variants, any>,
> = RecipeBrand<'root', never, Variants, Defaults, Config> & {
  (input?: RootRecipeInput<RootRecipe<Variants, Defaults, Config>>): string;
  resolve<
    TInput extends Record<string, unknown> | undefined = undefined,
    const TOptions extends
      ResolveOptions<Extract<keyof Variants, string>> | undefined = undefined,
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
  Config = SlotRecipeConfig<Record<Slots, ClassNameValue>, any, any>,
> = RecipeBrand<'slot', Slots, Variants, Defaults, Config> & {
  (
    input?: SlotRecipeInput<SlotRecipe<Slots, Variants, Defaults, Config>>
  ): SlotRenderMap<SlotRecipe<Slots, Variants, Defaults, Config>>;
  resolve<
    TInput extends Record<string, unknown> | undefined = undefined,
    const TOptions extends
      ResolveOptions<Extract<keyof Variants, string>> | undefined = undefined,
  >(
    input?: ContextualResolveInput<
      SlotResolveInputContext<SlotRecipe<Slots, Variants, Defaults, Config>>,
      TInput
    >,
    options?: TOptions
  ): SlotResolveResult<
    SlotRecipe<Slots, Variants, Defaults, Config>,
    TInput,
    TOptions
  >;
};

// The resolve results are deliberately loose: `RootResolveResult<any, ...>`
// expands `variants` to a string index signature once TypeScript compares
// two separately declared copies of these types (package root vs `/core`),
// which rejects recipes with boolean variants. The brand's mode already
// separates root recipes from slot recipes.
type AnyResolveResult = {
  readonly variants: Record<string, unknown>;
  readonly resolvedProps: Record<string, unknown>;
};

export type AnyRootRecipe = RecipeBrand<'root', never, any, any, any> & {
  readonly resolve: (...args: any[]) => AnyResolveResult;
};

export type AnySlotRecipe = RecipeBrand<'slot', any, any, any, any> & {
  readonly resolve: (...args: any[]) => AnyResolveResult & {
    readonly slots: Record<string, (...args: any[]) => string>;
  };
};

export type AnyRecipe = AnyRootRecipe | AnySlotRecipe;

export type RecipeFactory = {
  <
    const SlotDefs extends Record<string, ClassNameValue>,
    const Variants extends SlotVariantsSchema<keyof SlotDefs & string> = {},
    const Defaults extends Partial<VariantSelectionValues<Variants>> = {},
  >(
    config: SlotRecipeConfigInput<SlotDefs, Variants, Defaults>
  ): SlotRecipe<
    keyof SlotDefs & string,
    Variants,
    Defaults,
    SlotRecipeConfig<SlotDefs, Variants, Defaults>
  >;

  <
    const Variants extends RootVariantsSchema = {},
    const Defaults extends Partial<VariantSelectionValues<Variants>> = {},
  >(
    config: RootRecipeConfigInput<Variants, Defaults>
  ): RootRecipe<Variants, Defaults, RootRecipeConfig<Variants, Defaults>>;
};

export type VariantProps<TRecipe> =
  TRecipe extends RecipeBrand<
    any,
    any,
    infer Variants extends AnyVariantsSchema,
    infer Defaults extends object,
    any
  >
    ? VariantInput<Variants, Defaults>
    : never;

export type ResolvedVariantProps<TRecipe> =
  TRecipe extends RecipeBrand<
    any,
    any,
    infer Variants extends AnyVariantsSchema,
    any,
    any
  >
    ? ResolvedVariantInput<Variants>
    : never;

export type SlotNames<TRecipe> =
  TRecipe extends RecipeBrand<any, infer Slots, any, any, any>
    ? Slots & string
    : never;

export type RecipeConfigOf<TRecipe> =
  TRecipe extends RecipeBrand<any, any, any, any, infer Config>
    ? Config
    : never;

export type VariantSource = AnyRecipe | { variants?: AnyVariantsSchema };

type VariantSchemaOfSource<TSource> = TSource extends AnyRecipe
  ? RecipeConfigOf<TSource> extends { variants?: infer Variants }
    ? NonNullable<Variants>
    : {}
  : TSource extends { variants?: infer Variants }
    ? NonNullable<Variants>
    : {};

type VariantOptionKeys<TOptions> = Extract<keyof TOptions, string>;

export type VariantName<TSource> = Extract<
  keyof VariantSchemaOfSource<TSource>,
  string
>;

export type VariantOption<TSource, Name extends VariantName<TSource>> =
  Extract<
    VariantOptionKeys<VariantSchemaOfSource<TSource>[Name]>,
    BooleanOptionKey
  > extends never
    ? VariantOptionKeys<VariantSchemaOfSource<TSource>[Name]>
    : boolean;

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
