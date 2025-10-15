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
type Simplify<T> = { [KeyType in keyof T]: T[KeyType] };

// ----------------------------------------------------------------------

export type ClassNameValue = string | null | undefined | ClassNameValue[];

/**
 * Definition of the available variants and their options.
 * @example
 * {
 *   color: {
 *     white: "bg-white"
 *     green: "bg-green-500",
 *   },
 *   size: {
 *     small: "text-xs",
 *     large: "text-lg"
 *   }
 * }
 */
export type VariantsSchema = Record<string, Record<string, ClassNameValue>>;

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

type Variants<V extends VariantsSchema> = {
  [Variant in keyof V]: StringToBoolean<keyof V[Variant]>;
};

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

export type VariantOptions<
  C extends VariantsConfig<V>,
  V extends VariantsSchema = NonNullable<C['variants']>
> = keyof V extends never
  ? {}
  : Required<Omit<Variants<V>, OptionalVariantNames<C, V>>> &
      Partial<Pick<Variants<V>, OptionalVariantNames<C, V>>>;

/**
 * Render prop type.
 * @template P Props
 * @example
 * const children: RenderProp = (props) => <div {...props} />;
 */
export type RenderProp<P = HTMLAttributes<any> & { ref?: Ref<any> }> = (
  props: P
) => ReactNode;

// ----------------------------------------------------------------------

export interface VariantFactoryOptions {
  onClassesMerged?: (className: string) => string;
}

type VariantsResolverArgs<P> = PickRequiredKeys<P> extends never
  ? [props?: P]
  : [props: P];

export function defineConfig(options?: VariantFactoryOptions) {
  const { onClassesMerged } = options ?? {};

  function mergeClassNames(...classNames: ClassNameValue[]): string {
    // @ts-ignore
    const className = classNames.flat(Infinity).filter(Boolean).join(' ');

    return onClassesMerged ? onClassesMerged(className) : className;
  }

  function variants<
    C extends VariantsConfig<V>,
    V extends VariantsSchema = NonNullable<C['variants']>
  >(config: Simplify<C>) {
    const { base, variants, compoundVariants, defaultVariants } = config;

    if (!('variants' in config) || !config.variants) {
      return (props?: { className?: ClassNameValue }) =>
        mergeClassNames(base, props?.className);
    }

    function isBooleanVariant(name: keyof V) {
      const variant = (variants as V)?.[name];
      return variant && ('false' in variant || 'true' in variant);
    }

    type ResolveProps = VariantOptions<C, V> & {
      className?: ClassNameValue;
    };

    return function (...[props]: VariantsResolverArgs<ResolveProps>) {
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

  function variantPropsResolver<
    C extends VariantsConfig<V>,
    V extends VariantsSchema = NonNullable<C['variants']>
  >(config: Simplify<C>) {
    const variantsResolver = variants<C, V>(config);

    type Props = VariantOptions<C, V> & {
      className?: string;
    };

    return function <P extends Props>(props: P) {
      const result = { ...props } as { className: string } & Omit<P, keyof V>;
      const onlyVariantProps = { className: result.className } as Props;

      if (config.variants) {
        for (const variantKey in config.variants) {
          if (
            hasOwnProperty(config.variants, variantKey) &&
            hasOwnProperty(result, variantKey)
          ) {
            (onlyVariantProps as any)[variantKey] = result[variantKey];
            delete result[variantKey];
          }
        }
      }

      result.className = variantsResolver(onlyVariantProps);

      return result;
    };
  }

  function variantComponent<
    T extends ElementType,
    C extends VariantsConfig<V> & {
      withoutRenderProp?: boolean;
    },
    V extends VariantsSchema = NonNullable<C['variants']>
  >(type: T, config: Simplify<C>) {
    const { withoutRenderProp, ...variantsConfig } = config;
    type OnlyVariantsConfig = Omit<C, 'withoutRenderProp'>;
    type VariantOptionsOfConfig = VariantOptions<OnlyVariantsConfig, V>;
    type BaseProps = VariantOptionsOfConfig &
      Omit<ComponentPropsWithRef<T>, keyof VariantOptionsOfConfig>;

    const resolveProps = variantPropsResolver<OnlyVariantsConfig, V>(
      variantsConfig
    );

    if (typeof type !== 'string' || withoutRenderProp) {
      return (props: BaseProps) => {
        return createElement(type, resolveProps(props));
      };
    }

    const component = (
      props: Simplify<
        {
          /**
           * Allows the component to be rendered as a different HTML element or React
           * component. The value can be a React element or a function that takes in the
           * original component props and gives back a React element with the props
           * merged.
           */
          render?:
            | RenderProp<
                {
                  className: string;
                } & Omit<BaseProps, keyof VariantOptionsOfConfig>
              >
            | ReactElement<any>;
        } & Omit<BaseProps, 'render'>
      >
    ) => {
      const { render, ...rest } = props;
      const mergedRef = useMergeRefs((rest as any).ref, getRefProperty(render));
      const resolvedProps = resolveProps(rest as BaseProps);

      if (render) {
        if (isValidElement<any>(render)) {
          const renderProps = { ...render.props, ref: mergedRef };
          return cloneElement(render, mergeProps(resolvedProps, renderProps));
        } else {
          return render(resolvedProps) as ReactElement;
        }
      }

      return createElement(type, resolvedProps);
    };

    return component;
  }

  return {
    variants,
    variantPropsResolver,
    variantComponent,
  } as const;
}

/**
 * No-op function to mark template literals as tailwind strings.
 */
export const tw = String.raw;
