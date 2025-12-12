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
type Simplify<T> = { [K in keyof T]: T[K] };
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
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
export type ClassNameValue = string | null | undefined | ClassNameValue[];

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
  compoundVariants?: keyof V extends never ? never[] : CompoundVariant<V>[];
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
    | StringToBoolean<keyof V[Variant]>[];
};

/**
 * Only the boolean variants, i.e. ones that have "true" or "false" as options.
 */
type BooleanVariants<
  C extends VariantsConfig<V>,
  V extends VariantsSchema = NonNullable<C['variants']>
> = {
  [Variant in keyof V as V[Variant] extends { true: any } | { false: any }
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
  P extends Omit<VariantOptions<C, V>, 'className'> & { className?: string }
>(
  props: P
) => {
  className: string;
} & Omit<
  P,
  | 'className'
  | '__config'
  | (C['forwardProps'] extends (keyof V)[]
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
 * @property withoutRenderProp - When true, disables the polymorphic `render` prop pattern
 * @property forwardProps - Array of variant prop names to forward to the rendered element
 *
 * @example
 * const config: VariantComponentConfig<{ size: { sm: string } }> = {
 *   variants: { size: { sm: 'text-sm' } },
 *   forwardProps: ['size'],
 *   withoutRenderProp: true
 * };
 */
export type VariantComponentConfig<V extends VariantsSchema> =
  VariantsConfig<V> & {
    withoutRenderProp?: boolean;
    forwardProps?: (keyof V)[];
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
  ? Config extends VariantsConfig<any>
    ? Prettify<Config>
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
    ? Prettify<VariantOptions<Config, Schema>>
    : never
  : never;

/**
 * Render prop type.
 * @template P Props
 * @example
 * const children: RenderPropFn = (props) => <div {...props} />;
 */
type RenderPropFn<P = HTMLAttributes<any> & { ref?: Ref<any> }> = (
  props: P
) => ReactNode;

type RenderPropType<
  C extends VariantComponentConfig<V>,
  V extends VariantsSchema
> =
  | RenderPropFn<
      Prettify<
        {
          className: string;
          ref?: Ref<any>;
        } & (C['forwardProps'] extends (keyof VariantOptions<C, V>)[]
          ? Pick<VariantOptions<C, V>, C['forwardProps'][number]>
          : {}) &
          Omit<
            HTMLAttributes<any>,
            'render' | 'className' | keyof VariantOptions<C, V>
          >
      >
    >
  | ReactElement;

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

export function defineConfig(options?: VariantFactoryOptions) {
  const { onClassesMerged } = options ?? {};

  function mergeClassNames(...classNames: ClassNameValue[]): string {
    const flattened = (classNames as string[]).flat(Infinity) as (
      | string
      | null
      | undefined
    )[];
    const filtered = flattened.filter((cls): cls is string => Boolean(cls));
    const joined = filtered.join(' ');

    return onClassesMerged ? onClassesMerged(joined) : joined;
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
  function variants<
    C extends VariantsConfig<V>,
    V extends VariantsSchema = NonNullable<C['variants']>
  >(config: Exact<Simplify<C>, VariantsConfig<V>>): VariantsResolverFn<C, V> {
    const { base, variants, compoundVariants, defaultVariants } = config;

    if (!('variants' in config) || !config.variants) {
      return (props?: { className?: ClassNameValue }) =>
        mergeClassNames(base, props?.className);
    }

    function isBooleanVariant(name: keyof V) {
      const variant = (variants as V)?.[name];
      return variant && ('false' in variant || 'true' in variant);
    }

    return function (...[props]) {
      const result = [base];

      const getSelectedVariant = (name: keyof V) =>
        (props as any)?.[name] ??
        defaultVariants?.[name] ??
        (isBooleanVariant(name) ? false : undefined);

      for (let name in variants) {
        const selected = getSelectedVariant(name);
        if (selected !== undefined) result.push(variants[name]?.[selected]);
      }

      for (let { variants, className } of compoundVariants ?? []) {
        function isSelectedVariant(name: string) {
          const selected = getSelectedVariant(name);
          const cvSelector = variants[name];

          return Array.isArray(cvSelector)
            ? cvSelector.includes(selected)
            : selected === cvSelector;
        }

        if (Object.keys(variants).every(isSelectedVariant)) {
          result.push(className);
        }
      }

      if (props?.className) {
        result.push(props.className);
      }

      return mergeClassNames(result);
    };
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
  >(config: Exact<Simplify<C>, VariantComponentConfig<V>>) {
    const { forwardProps, withoutRenderProp, ...variantsConfig } = config;
    const variantsResolver = variants(variantsConfig);

    type OnlyVariantProps = (keyof V extends never
      ? {}
      : VariantOptions<typeof config, V>) & {
      className?: string;
    };

    type ForwardPropKey = NonNullable<C['forwardProps']>;

    return function <P extends OnlyVariantProps>(props: P) {
      const result = { ...props } as { className: string } & Omit<
        P,
        ForwardPropKey extends any[]
          ? Exclude<keyof V, ForwardPropKey[number]>
          : keyof V
      >;

      const onlyVariantProps = {
        className: result.className,
      } as OnlyVariantProps;

      if (config.variants) {
        for (const variantKey in config.variants) {
          if (
            hasOwnProperty(config.variants, variantKey) &&
            hasOwnProperty(result, variantKey)
          ) {
            onlyVariantProps[variantKey] = result[variantKey];

            if (!forwardProps || !forwardProps.includes(variantKey)) {
              delete result[variantKey];
            }
          }
        }
      }

      result.className = variantsResolver(onlyVariantProps as any);

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
    config: Exact<Simplify<C>, VariantComponentConfig<V>>
  ): VariantComponentType<T, C, V> {
    const { withoutRenderProp } = config;
    type BaseProps = BaseVariantComponentProps<T, C, V>;

    const resolveProps = variantPropsResolver<C, V>(config);

    if (typeof elementType !== 'string' || withoutRenderProp) {
      return ((props: BaseProps) => {
        return createElement(elementType, resolveProps(props as any));
      }) as VariantComponentType<T, C, V>;
    }

    type ComponentProps = VariantComponentPropsWithRender<BaseProps, C, V>;

    const component = ((props: ComponentProps) => {
      const { render, ...rest } = props;
      const mergedRef = useMergeRefs(
        (rest as { ref?: Ref<unknown> }).ref,
        getRefProperty(render)
      );
      const resolvedProps = resolveProps(rest as any);

      if (render) {
        if (isValidElement(render)) {
          const renderProps = { ...render.props, ref: mergedRef };
          return cloneElement(render, mergeProps(resolvedProps, renderProps));
        } else {
          return render(resolvedProps as any) as ReactElement;
        }
      }

      return createElement(elementType, { ...resolvedProps, ref: mergedRef });
    }) as VariantComponentType<T, C, V>;

    return component;
  }

  return {
    variants,
    variantPropsResolver,
    variantComponent,
  } as const;
}
