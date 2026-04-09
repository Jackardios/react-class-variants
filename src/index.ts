import {
  cloneElement,
  createElement,
  HTMLAttributes,
  isValidElement,
  ReactNode,
  Ref,
  type ComponentPropsWithRef,
  type ElementType,
  type ReactElement,
  type JSX,
} from 'react';
import {
  getRefProperty,
  hasOwnProperty,
  mergeProps,
  useMergeRefs,
} from './utils';

type PickRequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];
type OmitByValue<T, Value> = {
  [P in keyof T as T[P] extends Value ? never : P]: T[P];
};
type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- function-form render intentionally exposes broad DOM props for ergonomic cross-element composition.
type AnyRef = Ref<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- function-form render intentionally exposes broad DOM props for ergonomic cross-element composition.
type AnyHtmlAttributes = HTMLAttributes<any>;

/**
 * Simplifies a type by expanding intersections and mapped types for better IDE display.
 * The `& {}` forces TypeScript to eagerly evaluate the type.
 */
type Simplify<T> = {
  [K in keyof T]: T[K];
} & {};

type GenericReservedVariantKey = 'className';
type ComponentReservedVariantKey =
  | GenericReservedVariantKey
  | 'render'
  | 'ref'
  | 'children'
  | 'style'
  | 'dangerouslySetInnerHTML'
  | 'key'
  | 'suppressHydrationWarning'
  | 'suppressContentEditableWarning';

type ConfigSchema<C> = C extends { variants?: infer Schema }
  ? NonNullable<Schema> extends VariantsSchema
    ? NonNullable<Schema>
    : Record<string, never>
  : Record<string, never>;
type ReservedVariantKeysInConfig<C, ReservedKeys extends PropertyKey> = Extract<
  keyof ConfigSchema<C>,
  ReservedKeys
>;
type ValidateReservedVariantKeys<C, ReservedKeys extends PropertyKey> = [
  ReservedVariantKeysInConfig<C, ReservedKeys>
] extends [never]
  ? {}
  : never;

const componentRuntimeReservedKeys = new Set<string>([
  'className',
  'render',
  'ref',
  'children',
  'style',
  'dangerouslySetInnerHTML',
  'key',
  'suppressHydrationWarning',
  'suppressContentEditableWarning',
]);
const globalIntrinsicRuntimeDangerousKeys = new Set<string>(['id', 'role']);
const intrinsicRuntimeDangerousKeysByElement: Record<
  string,
  readonly string[]
> = {
  a: ['href', 'target'],
  area: ['alt', 'href', 'target'],
  base: ['href', 'target'],
  button: ['formAction', 'name', 'type', 'value'],
  form: ['action', 'method', 'name', 'target'],
  iframe: ['name', 'src'],
  img: ['alt', 'src'],
  input: [
    'alt',
    'checked',
    'defaultChecked',
    'defaultValue',
    'formAction',
    'name',
    'src',
    'type',
    'value',
  ],
  label: ['htmlFor'],
  link: ['href'],
  map: ['name'],
  meta: ['name'],
  object: ['name'],
  option: ['selected', 'value'],
  output: ['htmlFor', 'name'],
  script: ['src'],
  select: ['defaultValue', 'name', 'value'],
  source: ['src'],
  textarea: ['defaultValue', 'name', 'value'],
  track: ['src'],
  video: ['src'],
};

interface VariantConfigIssue {
  key: string;
  reason: string;
}

function getReservedVariantKeyIssueReason(
  key: string,
  reservedKeys: ReadonlySet<string>
): string | null {
  if (!reservedKeys.has(key)) {
    return null;
  }

  if (key === 'ref') {
    return 'conflicts with React ref handling.';
  }

  if (key === 'render') {
    return 'conflicts with the polymorphic render prop.';
  }

  if (key === 'className') {
    return 'conflicts with the className channel used for user classes.';
  }

  return 'is reserved by React or the component API.';
}

function getIntrinsicVariantKeyIssueReason(
  key: string,
  intrinsicElement?: string
): string | null {
  if (!intrinsicElement) {
    return null;
  }

  if (
    !globalIntrinsicRuntimeDangerousKeys.has(key) &&
    !intrinsicRuntimeDangerousKeysByElement[intrinsicElement]?.includes(key)
  ) {
    return null;
  }

  return `conflicts with the intrinsic prop name "${key}" on "${intrinsicElement}" elements.`;
}

function formatInvalidConfigError(
  apiContext: string,
  issues: VariantConfigIssue[]
): Error {
  const lines = [
    'react-class-variants: invalid variant config',
    '',
    `API: ${apiContext}`,
    '',
    'Problems:',
    ...issues.map(issue => `- variant key "${issue.key}" ${issue.reason}`),
    '',
    'How to fix:',
    '- Rename conflicting variant keys to non-reserved names such as "intent", "tone", or "appearance".',
    '- Keep React/internal/native props for their original purpose and choose a non-conflicting variant key.',
  ];

  return new Error(lines.join('\n'));
}

function collectVariantConfigIssues(
  variantsDef: VariantsSchema | undefined,
  reservedKeys: ReadonlySet<string>,
  intrinsicElement?: string
): VariantConfigIssue[] {
  if (!variantsDef) {
    return [];
  }

  const issues: VariantConfigIssue[] = [];

  for (const key of Object.keys(variantsDef)) {
    const reason =
      getReservedVariantKeyIssueReason(key, reservedKeys) ??
      getIntrinsicVariantKeyIssueReason(key, intrinsicElement);

    if (reason) {
      issues.push({ key, reason });
    }
  }

  return issues;
}

function assertValidVariantConfig(
  apiContext: string,
  variantsDef: VariantsSchema | undefined,
  reservedKeys: ReadonlySet<string>,
  intrinsicElement?: string
) {
  const issues = collectVariantConfigIssues(
    variantsDef,
    reservedKeys,
    intrinsicElement
  );

  if (issues.length > 0) {
    throw formatInvalidConfigError(apiContext, issues);
  }
}

/**
 * Ensures T exactly matches Shape with no extra properties.
 * Used to catch typos in config objects that would otherwise be silently ignored.
 *
 * @template T - The type to check
 * @template Shape - The expected shape
 * @returns T if it matches Shape exactly, never otherwise
 */
type Exact<T, Shape> = T extends Shape
  ? Exclude<keyof T, keyof Shape> extends never
    ? T
    : never
  : never;

// ----------------------------------------------------------------------

/**
 * Represents a className value that can be a string, null, undefined, or an array of ClassNameValues.
 * Nested arrays are flattened when resolved.
 *
 * @example
 * // All valid ClassNameValue examples:
 * const a: ClassNameValue = 'px-4 py-2';
 * const b: ClassNameValue = ['px-4', 'py-2'];
 * const c: ClassNameValue = [['px-4'], ['py-2', null]];
 * const d: ClassNameValue = null;
 */
export type ClassNameValue =
  | string
  | null
  | undefined
  | readonly ClassNameValue[];

/**
 * Definition of the available variants and their options.
 * Each key is a variant name, and each value is an object mapping variant values to class names.
 *
 * @example
 * {
 *   color: {
 *     white: "bg-white",
 *     green: "bg-green-500",
 *   },
 *   size: {
 *     small: "text-xs",
 *     large: "text-lg"
 *   }
 * }
 */
export type VariantsSchema = Record<string, Record<string, ClassNameValue>>;

/**
 * Configuration object for defining variants.
 *
 * @template V - The variants schema type
 *
 * @property base - Base class names applied to all variants
 * @property variants - Object defining available variants and their class names
 * @property defaultVariants - Default values for optional variants
 * @property compoundVariants - Rules for class names applied when multiple variants match
 *
 * @example
 * const config: VariantsConfig<{ color: { primary: string } }> = {
 *   base: 'btn',
 *   variants: {
 *     color: { primary: 'bg-blue-500' }
 *   },
 *   defaultVariants: { color: 'primary' }
 * };
 */
export type VariantsConfig<V extends VariantsSchema> = {
  base?: ClassNameValue;
  variants?: V;
  defaultVariants?: keyof V extends never
    ? Record<string, never>
    : Partial<Variants<V>>;
  compoundVariants?: keyof V extends never
    ? readonly never[]
    : readonly CompoundVariant<V>[];
};

/**
 * Rules for class names that are applied for certain variant combinations.
 */
interface CompoundVariant<V extends VariantsSchema> {
  variants: Partial<VariantsMulti<V>>;
  className: ClassNameValue;
}

/**
 * Maps variant names to their possible values (with boolean string conversion).
 */
type Variants<V extends VariantsSchema> = {
  [Variant in keyof V]: StringToBoolean<keyof V[Variant]>;
};

/**
 * Like Variants but allows arrays of values for compound variant matching.
 */
type VariantsMulti<V extends VariantsSchema> = {
  [Variant in keyof V]:
    | StringToBoolean<keyof V[Variant]>
    | readonly StringToBoolean<keyof V[Variant]>[];
};

/**
 * Only the boolean variants, i.e. ones that have "true" or "false" as options.
 */
type BooleanVariants<
  C extends VariantsConfig<V>,
  V extends VariantsSchema = NonNullable<C['variants']>
> = {
  [Variant in keyof V as V[Variant] extends
    | { true: unknown }
    | { false: unknown }
    ? Variant
    : never]: V[Variant];
};

/**
 * Only the variants for which a default options is set.
 */
type DefaultVariants<
  C extends VariantsConfig<V>,
  V extends VariantsSchema = NonNullable<C['variants']>
> = {
  [Variant in keyof V as Variant extends keyof OmitByValue<
    C['defaultVariants'],
    undefined
  >
    ? Variant
    : never]: V[Variant];
};

/**
 * Names of all optional variants, i.e. booleans or ones with default options.
 */
type OptionalVariantNames<
  C extends VariantsConfig<V>,
  V extends VariantsSchema = NonNullable<C['variants']>
> = keyof BooleanVariants<C, V> | keyof DefaultVariants<C, V>;

/**
 * Extracts the variant props type from a configuration.
 * Required variants become required props, optional variants (boolean or with defaults) become optional props.
 *
 * @template C - The variants configuration type
 * @template V - The variants schema type
 *
 * @example
 * type Config = {
 *   variants: {
 *     color: { primary: string; secondary: string };
 *     disabled: { true: string; false: string };
 *   };
 *   defaultVariants: { color: 'primary' };
 * };
 * type Options = VariantOptions<Config>;
 * // { color?: 'primary' | 'secondary'; disabled?: boolean }
 */
export type VariantOptions<
  C extends VariantsConfig<V>,
  V extends VariantsSchema = NonNullable<C['variants']>
> = keyof V extends never
  ? {}
  : Required<Omit<Variants<V>, OptionalVariantNames<C, V>>> &
      Partial<Pick<Variants<V>, OptionalVariantNames<C, V>>>;

// ----------------------------------------------------------------------

/**
 * Options for configuring the variant factory via defineConfig.
 */
export interface VariantFactoryOptions {
  /**
   * Optional function to process/merge the final class name string.
   * Useful for integrating with utilities like tailwind-merge.
   *
   * @example
   * import { twMerge } from 'tailwind-merge';
   * const { variants } = defineConfig({ onClassesMerged: twMerge });
   */
  onClassesMerged?: (className: string) => string;
}

type VariantsResolverArgs<P> = PickRequiredKeys<P> extends never
  ? [props?: P]
  : [props: P];

/**
 * Type for the variants resolver function with config metadata.
 */
type VariantsResolverFn<
  C extends VariantsConfig<V>,
  V extends VariantsSchema
> = ((
  ...args: VariantsResolverArgs<
    {
      className?: ClassNameValue;
    } & Omit<VariantOptions<C, V>, 'className'>
  >
) => string) & {
  /**
   * @internal
   * Type-only property to store configuration for type extraction.
   * This property does not exist at runtime.
   */
  __config?: C;
};

/**
 * Type for the variant props resolver function with config metadata.
 */
type VariantPropsResolverFn<
  C extends VariantComponentConfig<V>,
  V extends VariantsSchema
> = (<
  P extends Omit<VariantOptions<C, V>, 'className'> & {
    className?: ClassNameValue;
  }
>(
  props: P
) => {
  className: string;
} & Omit<
  P,
  | 'className'
  | '__config'
  | (C['forwardProps'] extends readonly (keyof V)[]
      ? Exclude<keyof V, C['forwardProps'][number]>
      : keyof V)
>) & {
  /**
   * @internal
   * Type-only property to store configuration for type extraction.
   * This property does not exist at runtime.
   */
  __config?: C;
};

// ----------------------------------------------------------------------
// Variant Component Types
// ----------------------------------------------------------------------

/**
 * Configuration for variant component with optional render prop control.
 *
 * @template V - The variants schema type
 *
 * @property displayName - Custom display name for the component (used in React DevTools)
 * @property withoutRenderProp - When true, disables the polymorphic `render` prop pattern
 * @property forwardProps - Array of variant prop names to keep in the resolved props object
 * and expose to `render` functions or custom targets. Native DOM reflection still depends on
 * the rendered target accepting that prop.
 *
 * @example
 * const config: VariantComponentConfig<{ size: { sm: string } }> = {
 *   variants: { size: { sm: 'text-sm' } },
 *   forwardProps: ['size'],
 *   withoutRenderProp: true,
 *   displayName: 'Button'
 * };
 */
export type VariantComponentConfig<V extends VariantsSchema> =
  VariantsConfig<V> & {
    displayName?: string;
    withoutRenderProp?: boolean;
    forwardProps?: readonly (keyof V)[];
  };

/**
 * Base props for a variant component, combining variant options with component props.
 * Variant props take precedence over native element props when there are naming conflicts.
 *
 * @template T - The element type (HTML tag or component)
 * @template C - The variant component configuration type
 * @template V - The variants schema type
 */
export type BaseVariantComponentProps<
  T extends ElementType,
  C extends VariantComponentConfig<V>,
  V extends VariantsSchema
> = VariantOptions<C, V> &
  Omit<ComponentPropsWithRef<T>, keyof VariantOptions<C, V>>;

/**
 * Extracts the full configuration from a variant function, resolver, or component.
 * @template T - The variant function, resolver, or component type
 * @returns The VariantsConfig or VariantComponentConfig type
 *
 * @example
 * // Works with variants()
 * const buttonVariants = variants({
 *   base: 'btn',
 *   variants: { color: { primary: 'bg-blue' } }
 * });
 * type Config1 = ExtractVariantConfig<typeof buttonVariants>;
 *
 * // Works with variantPropsResolver()
 * const resolveProps = variantPropsResolver({ ... });
 * type Config2 = ExtractVariantConfig<typeof resolveProps>;
 *
 * // Works with variantComponent()
 * const Button = variantComponent('button', { ... });
 * type Config3 = ExtractVariantConfig<typeof Button>;
 */
export type ExtractVariantConfig<T> = T extends {
  __config?: infer Config;
}
  ? Config extends VariantsConfig<VariantsSchema>
    ? Simplify<Config>
    : never
  : never;

/**
 * Extracts variant options type from a variant function, resolver, or component.
 * @template T - The variant function, resolver, or component type
 * @returns The VariantOptions type
 *
 * @example
 * // Works with variants()
 * const buttonVariants = variants({
 *   variants: { color: { primary: 'bg-blue', secondary: 'bg-gray' } }
 * });
 * type Options1 = ExtractVariantOptions<typeof buttonVariants>;
 * // { color: 'primary' | 'secondary' }
 *
 * // Works with variantPropsResolver()
 * const resolveProps = variantPropsResolver({
 *   variants: { size: { small: 'text-sm', large: 'text-lg' } },
 *   defaultVariants: { size: 'small' }
 * });
 * type Options2 = ExtractVariantOptions<typeof resolveProps>;
 * // { size?: 'small' | 'large' }
 *
 * // Works with variantComponent()
 * const Button = variantComponent('button', {
 *   variants: { color: { primary: 'bg-blue' } }
 * });
 * type Options3 = ExtractVariantOptions<typeof Button>;
 * // { color: 'primary' }
 */
export type ExtractVariantOptions<T> = T extends {
  __config?: infer Config;
}
  ? Config extends VariantsConfig<infer Schema>
    ? Simplify<VariantOptions<Config, Schema>>
    : never
  : never;

/**
 * Render prop type.
 * @template P Props
 * @example
 * const children: RenderPropFn<{ className: string }> = props => <div {...props} />;
 */
type RenderPropFn<P> = (props: P) => ReactNode;

type ForwardedVariantProps<
  C extends VariantComponentConfig<V>,
  V extends VariantsSchema
> = C['forwardProps'] extends readonly (keyof VariantOptions<C, V>)[]
  ? Pick<VariantOptions<C, V>, C['forwardProps'][number]>
  : {};

type RenderResolvedProps<
  C extends VariantComponentConfig<V>,
  V extends VariantsSchema
> = Simplify<
  {
    className: string;
    ref?: AnyRef;
  } & ForwardedVariantProps<C, V> &
    Omit<AnyHtmlAttributes, 'render' | 'className' | keyof VariantOptions<C, V>>
>;

/**
 * Type for the render prop, which can be either a function or a React element.
 * When using a function, it intentionally receives a broad, spread-safe prop bag:
 * `className`, `ref`, generic `HTMLAttributes<any>`, and any variant props listed in
 * `forwardProps`. Base-element-specific props such as `type`, `disabled`, `form`,
 * `href`, and `target` are not part of this typed/stable contract, even if a runtime
 * implementation happens to pass them through incidentally.
 * When using an element, it will be cloned with merged props.
 *
 * @template C - The variant component configuration type
 * @template V - The variants schema type
 *
 * @example
 * // As a React element
 * <Button render={<a href="/" />}>Link styled as button</Button>
 *
 * // As a function
 * <Button render={(props) => <a {...props} href="/" />}>Link</Button>
 */
export type RenderPropType<
  C extends VariantComponentConfig<V>,
  V extends VariantsSchema
> = RenderPropFn<RenderResolvedProps<C, V>> | ReactElement;

/**
 * Component props with optional render prop.
 */
export type VariantComponentPropsWithRender<
  P,
  C extends VariantComponentConfig<V>,
  V extends VariantsSchema
> = Simplify<{ render?: RenderPropType<C, V> } & P>;

export type VariantComponentType<
  T extends ElementType,
  C extends VariantComponentConfig<V>,
  V extends VariantsSchema = NonNullable<C['variants']>
> = (T extends keyof JSX.IntrinsicElements
  ? C extends { withoutRenderProp: true }
    ? (props: BaseVariantComponentProps<T, C, V>) => ReactElement
    : (
        props: VariantComponentPropsWithRender<
          BaseVariantComponentProps<T, C, V>,
          C,
          V
        >
      ) => ReactNode
  : (props: BaseVariantComponentProps<T, C, V>) => ReactElement) & {
  /**
   * @internal
   * Type-only property to store component configuration for type extraction.
   * This property does not exist at runtime.
   */
  __config?: C;
};

/**
 * Captures a reusable variants config with deep literal inference.
 * Useful when hoisting a config into a shared constant before reusing it
 * across `variants()` and `variantComponent()`.
 */
export function defineVariantConfig<
  const C extends VariantsConfig<V>,
  V extends VariantsSchema = NonNullable<C['variants']>
>(
  config: Exact<Simplify<C>, VariantsConfig<V>> &
    ValidateReservedVariantKeys<C, GenericReservedVariantKey>
): C {
  return config;
}

export function defineConfig(options?: VariantFactoryOptions) {
  const { onClassesMerged } = options ?? {};

  function isClassNameArray(
    value: ClassNameValue
  ): value is readonly ClassNameValue[] {
    return Array.isArray(value);
  }

  function toClassNameString(value: ClassNameValue): string {
    return isClassNameArray(value) ? flattenClasses(value) : value || '';
  }

  function flattenClasses(classes: readonly ClassNameValue[]): string {
    const flattened: string[] = [];
    const stack = [...classes].reverse();

    while (stack.length > 0) {
      const value = stack.pop();

      if (isClassNameArray(value)) {
        for (let i = value.length - 1; i >= 0; i -= 1) {
          stack.push(value[i]);
        }
        continue;
      }

      if (typeof value === 'string' && value) {
        flattened.push(value);
      }
    }

    return flattened.join(' ');
  }

  function applyPostProcess(className: string): string {
    return onClassesMerged ? onClassesMerged(className) : className;
  }

  function getSelectedVariantValue(
    key: string,
    variantProps: Record<string, unknown> | undefined,
    defaultVariantValues: Record<string, unknown> | undefined,
    isBooleanVariant: Record<string, true>
  ): unknown {
    if (variantProps && hasOwnProperty(variantProps, key)) {
      const explicitValue = variantProps[key];
      if (explicitValue !== undefined) {
        return explicitValue;
      }
    }

    if (defaultVariantValues && hasOwnProperty(defaultVariantValues, key)) {
      const defaultValue = defaultVariantValues[key];
      if (defaultValue !== undefined) {
        return defaultValue;
      }
    }

    return isBooleanVariant[key] ? false : undefined;
  }

  function concatClasses(base: string, addition: string): string {
    return base ? `${base} ${addition}` : addition;
  }

  /**
   * Creates a className resolver function from a variants configuration.
   *
   * @template C - Variants configuration type
   * @template V - Variants schema type
   * @param config - The variants configuration object
   * @returns A function that resolves className based on variant props
   *
   * @example
   * const button = variants({
   *   base: 'px-4 py-2',
   *   variants: {
   *     color: {
   *       primary: 'bg-blue-500',
   *       secondary: 'bg-gray-500'
   *     }
   *   }
   * });
   *
   * button({ color: 'primary' }); // 'px-4 py-2 bg-blue-500'
   */
  function createVariantsResolver<V extends VariantsSchema>(
    config: VariantsConfig<V>
  ) {
    const {
      base,
      variants: variantsDef,
      compoundVariants,
      defaultVariants,
    } = config;

    // Simple case: no variants defined
    if (!variantsDef) {
      const baseClassName = toClassNameString(base);
      return (props?: { className?: ClassNameValue }) => {
        if (!props?.className) return applyPostProcess(baseClassName);
        const extra = toClassNameString(props.className);
        if (!extra) return applyPostProcess(baseClassName);
        return applyPostProcess(
          baseClassName ? concatClasses(baseClassName, extra) : extra
        );
      };
    }

    // Analyze variant definitions
    const variantKeys = Object.keys(variantsDef);
    const defaultVariantValues = defaultVariants as
      | Record<string, unknown>
      | undefined;
    const isBooleanVariant: Record<string, true> = {};
    let hasArrayClassNames = Array.isArray(base);

    for (const key of variantKeys) {
      const variantOptions = variantsDef[key];
      if (!variantOptions) continue;

      if ('true' in variantOptions || 'false' in variantOptions) {
        isBooleanVariant[key] = true;
      }

      if (!hasArrayClassNames) {
        for (const optionKey in variantOptions) {
          if (Array.isArray(variantOptions[optionKey])) {
            hasArrayClassNames = true;
            break;
          }
        }
      }
    }

    // Pre-process compound variants
    type MatchCondition =
      | { key: string; value: unknown }
      | { key: string; values: Set<unknown> };

    interface ProcessedCompound {
      conditions: MatchCondition[];
      className: ClassNameValue;
    }

    const compounds: ProcessedCompound[] = [];

    if (compoundVariants) {
      for (const compound of compoundVariants) {
        if (!hasArrayClassNames && Array.isArray(compound.className)) {
          hasArrayClassNames = true;
        }

        const conditions: MatchCondition[] = [];
        for (const key in compound.variants) {
          const selector = compound.variants[key];
          conditions.push(
            Array.isArray(selector)
              ? { key, values: new Set(selector) }
              : { key, value: selector }
          );
        }

        compounds.push({ conditions, className: compound.className });
      }
    }

    // Fast path: string concatenation (when config has no array class names)
    if (!hasArrayClassNames) {
      const baseClassName = (base as string) || '';

      return function resolveVariants(
        props?: Record<string, unknown> & { className?: ClassNameValue }
      ) {
        let result = baseClassName;
        const variantProps = props as Record<string, unknown> | undefined;

        // Resolve each variant
        for (const key of variantKeys) {
          const selected = getSelectedVariantValue(
            key,
            variantProps,
            defaultVariantValues,
            isBooleanVariant
          );

          if (selected !== undefined) {
            const className = variantsDef[key]?.[selected as string] as
              | string
              | undefined;
            if (className) result = concatClasses(result, className);
          }
        }

        // Check compound variants
        for (const compound of compounds) {
          let matches = true;
          for (const condition of compound.conditions) {
            const selected = getSelectedVariantValue(
              condition.key,
              variantProps,
              defaultVariantValues,
              isBooleanVariant
            );

            const isMatch =
              'values' in condition
                ? condition.values.has(selected)
                : selected === condition.value;

            if (!isMatch) {
              matches = false;
              break;
            }
          }

          if (matches && compound.className) {
            result = concatClasses(result, compound.className as string);
          }
        }

        // Append extra className from props
        if (props?.className) {
          const extra = toClassNameString(props.className);
          if (extra) result = concatClasses(result, extra);
        }

        return applyPostProcess(result);
      };
    }

    // Slow path: array accumulation + flatten (when config has array class names)
    return function resolveVariants(
      props?: Record<string, unknown> & { className?: ClassNameValue }
    ) {
      const classes: ClassNameValue[] = [base];
      const variantProps = props as Record<string, unknown> | undefined;

      for (const key of variantKeys) {
        const selected = getSelectedVariantValue(
          key,
          variantProps,
          defaultVariantValues,
          isBooleanVariant
        );

        if (selected !== undefined) {
          classes.push(variantsDef[key]?.[selected as string]);
        }
      }

      for (const compound of compounds) {
        let matches = true;
        for (const condition of compound.conditions) {
          const selected = getSelectedVariantValue(
            condition.key,
            variantProps,
            defaultVariantValues,
            isBooleanVariant
          );

          const isMatch =
            'values' in condition
              ? condition.values.has(selected)
              : selected === condition.value;

          if (!isMatch) {
            matches = false;
            break;
          }
        }

        if (matches) classes.push(compound.className);
      }

      if (props?.className) classes.push(props.className);

      return applyPostProcess(flattenClasses(classes));
    };
  }

  function variants<
    C extends VariantsConfig<V>,
    V extends VariantsSchema = NonNullable<C['variants']>
  >(
    config: Exact<Simplify<C>, VariantsConfig<V>> &
      ValidateReservedVariantKeys<C, GenericReservedVariantKey>
  ): VariantsResolverFn<C, V> {
    return createVariantsResolver(
      config as VariantsConfig<V>
    ) as VariantsResolverFn<C, V>;
  }

  /**
   * Creates a props resolver that separates variant props from other props
   * and resolves the className.
   *
   * @template C - Variants configuration type
   * @template V - Variants schema type
   * @param config - The variants configuration object
   * @returns A function that takes props and returns non-variant props with resolved className
   *
   * @example
   * const resolveButtonProps = variantPropsResolver({
   *   variants: {
   *     color: { primary: 'bg-blue-500' }
   *   }
   * });
   *
   * resolveButtonProps({ color: 'primary', onClick: () => {} })
   * // { className: 'bg-blue-500', onClick: () => {} }
   */
  function variantPropsResolver<
    C extends VariantComponentConfig<V>,
    V extends VariantsSchema = NonNullable<C['variants']>
  >(
    config: Exact<Simplify<C>, VariantComponentConfig<V>> &
      ValidateReservedVariantKeys<C, GenericReservedVariantKey>
  ) {
    const {
      forwardProps,
      withoutRenderProp: _withoutRenderProp,
      displayName: _displayName,
      ...variantsConfig
    } = config;

    const resolveClassName = createVariantsResolver(
      variantsConfig as VariantsConfig<V>
    );
    const variantKeys = config.variants ? Object.keys(config.variants) : [];

    type VariantPropsWithClassName = (keyof V extends never
      ? {}
      : VariantOptions<typeof config, V>) & {
      className?: ClassNameValue;
    };

    type ForwardPropKeys = NonNullable<C['forwardProps']>;
    type ResultType<P> = { className: string } & Omit<
      P,
      ForwardPropKeys extends readonly unknown[]
        ? Exclude<keyof V, ForwardPropKeys[number]>
        : keyof V
    >;

    return function resolve<P extends VariantPropsWithClassName>(props: P) {
      const result = { ...props } as ResultType<P>;

      for (const key of variantKeys) {
        if (
          hasOwnProperty(result as Record<string, unknown>, key) &&
          (!forwardProps || !forwardProps.includes(key))
        ) {
          delete (result as Record<string, unknown>)[key];
        }
      }

      const resolveVariantClassName = resolveClassName as (
        props: VariantPropsWithClassName
      ) => string;
      result.className = resolveVariantClassName(props);
      return result;
    } as VariantPropsResolverFn<C, V>;
  }

  /**
   * Creates a React component with variants support.
   *
   * @template T - The element type (HTML tag or component)
   * @template C - Variants configuration type
   * @template V - Variants schema type
   * @param elementType - The base element type to render
   * @param config - The variants configuration object with optional withoutRenderProp flag
   * @returns A React component with variant props
   *
   * @remarks
   * When using the `render` prop pattern, props are merged in this order:
   * 1. Resolved variant props (base + variant classes)
   * 2. Render element's own props (take precedence over resolved props)
   *
   * This allows the render element to customize or override variant styles when needed.
   * Event handlers are composed (both are called), classNames are concatenated.
   * The typed/stable contract for function-form `render` is intentionally broad and
   * cross-element-friendly: `className`, `ref`, generic `HTMLAttributes<any>`, and any
   * `forwardProps`. Base-element-specific props such as `type`, `disabled`, `form`,
   * `href`, and `target` are not guaranteed there.
   *
   * @example
   * const Button = variantComponent('button', {
   *   base: 'px-4 py-2',
   *   variants: {
   *     color: {
   *       primary: 'bg-blue-500',
   *       secondary: 'bg-gray-500'
   *     }
   *   }
   * });
   *
   * <Button color="primary">Click me</Button>
   * <Button color="primary" render={<a href="/" />}>Link as button</Button>
   */
  function variantComponent<
    T extends ElementType,
    C extends VariantComponentConfig<V>,
    V extends VariantsSchema = NonNullable<C['variants']>
  >(
    elementType: T,
    config: Exact<Simplify<C>, VariantComponentConfig<V>> &
      ValidateReservedVariantKeys<C, ComponentReservedVariantKey>
  ): VariantComponentType<T, C, V> {
    assertValidVariantConfig(
      typeof elementType === 'string'
        ? `variantComponent('${elementType}')`
        : 'variantComponent(custom)',
      config.variants,
      componentRuntimeReservedKeys,
      typeof elementType === 'string' ? elementType : undefined
    );
    const { withoutRenderProp, displayName: customDisplayName } = config;
    const resolveProps = variantPropsResolver<C, V>(
      config as Exact<Simplify<C>, VariantComponentConfig<V>> &
        ValidateReservedVariantKeys<C, GenericReservedVariantKey>
    );

    type BaseProps = BaseVariantComponentProps<T, C, V>;
    type PropsWithRender = VariantComponentPropsWithRender<BaseProps, C, V>;

    const displayName =
      customDisplayName ||
      (typeof elementType === 'string'
        ? elementType
        : (elementType as { displayName?: string }).displayName ||
          (elementType as { name?: string }).name ||
          'Component');
    type ResolvedPropsInput = VariantOptions<C, V> & {
      className?: ClassNameValue;
    };
    const resolveRuntimeProps = resolveProps as (
      props: ResolvedPropsInput & Record<string, unknown>
    ) => Record<string, unknown> & {
      className: string;
    };

    // Simple component without render prop support
    if (typeof elementType !== 'string' || withoutRenderProp) {
      const Component = (props: BaseProps) =>
        createElement(
          elementType,
          resolveRuntimeProps(
            props as unknown as ResolvedPropsInput & Record<string, unknown>
          )
        );

      (
        Component as { displayName?: string }
      ).displayName = `Variant(${displayName})`;
      return Component as VariantComponentType<T, C, V>;
    }

    // Component with render prop support for polymorphism
    const Component = (props: PropsWithRender) => {
      const runtimeProps = props as unknown as Record<string, unknown> & {
        ref?: Ref<unknown>;
        render?: RenderPropType<C, V>;
      };
      const { render, ...rest } = runtimeProps;
      const resolvedProps = resolveRuntimeProps(
        rest as unknown as ResolvedPropsInput & Record<string, unknown>
      );
      const mergedRef = useMergeRefs(runtimeProps.ref, getRefProperty(render));

      if (render) {
        if (isValidElement(render)) {
          const renderElement = render as ReactElement<Record<string, unknown>>;
          return cloneElement(
            renderElement,
            mergeProps(resolvedProps, {
              ...renderElement.props,
              ref: mergedRef,
            })
          );
        }
        return (render as RenderPropFn<RenderResolvedProps<C, V>>)({
          ...(resolvedProps as unknown as RenderResolvedProps<C, V>),
          ref: mergedRef,
        }) as ReactElement;
      }

      return createElement(elementType, { ...resolvedProps, ref: mergedRef });
    };

    (
      Component as { displayName?: string }
    ).displayName = `Variant(${displayName})`;
    return Component as VariantComponentType<T, C, V>;
  }

  return {
    variants,
    variantPropsResolver,
    variantComponent,
  } as const;
}

export { mergeProps, mergeRefs, useMergeRefs, hasOwnProperty } from './utils';
