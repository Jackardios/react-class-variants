/* eslint-disable @typescript-eslint/no-explicit-any -- React adapters need runtime casts while preserving public inference. */
import {
  cloneElement,
  createElement,
  forwardRef,
  isValidElement,
  type ForwardedRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import type {
  AnyRootRecipe,
  AnySlotRecipe,
  ClassNameValue,
  ResolveOptions,
} from './core-types';
import {
  type AnyIntrinsicElement,
  type NativeAliases,
  type RenderProp,
  type RootComponentOptions,
  type RootHelperProps,
  type SlotComponentOptions,
  type StyledComponentProps,
} from './react-types';
import {
  getCompiledRecipe,
  normalizeResolveOptions,
  type RootCompiledRecipe,
  resolveRootComponentProps,
} from './recipe';
import { getRefProperty, mergeTwoRefs } from './react-utils';
import { flattenClassName } from './class-name';
import { mergeProps } from '../utils';

function splitReactProps(props: Record<string, unknown>) {
  const {
    className,
    children,
    render,
    ref: _ignoredRef,
    ...otherResolvedProps
  } = props;

  return {
    className: className as ClassNameValue | undefined,
    children: children as ReactNode,
    render: render as RenderProp | undefined,
    otherResolvedProps,
  };
}

function renderPolymorphic(
  tag: AnyIntrinsicElement,
  props: Record<string, unknown>,
  forwardedRef: ForwardedRef<unknown> | undefined,
  render: RenderProp | undefined
) {
  const { ref: _ignoredRef, ...restProps } = props;
  const normalizedProps = {
    ...restProps,
    className: flattenClassName(props.className as ClassNameValue | undefined),
  };

  if (!render) {
    return createElement(tag as any, { ...normalizedProps, ref: forwardedRef });
  }

  const mergedRef = mergeTwoRefs(forwardedRef, getRefProperty(render));

  if (isValidElement(render)) {
    const renderElement = render as ReactElement<Record<string, unknown>>;
    return cloneElement(
      renderElement as ReactElement<any>,
      mergeProps(normalizedProps, {
        ...renderElement.props,
        ref: mergedRef,
      }) as any
    );
  }

  return (render as (props: Record<string, unknown>) => ReactNode)({
    ...normalizedProps,
    ref: mergedRef,
  });
}

function createRootHelper<Tag extends AnyIntrinsicElement>(
  tag: Tag,
  ref: ForwardedRef<unknown>,
  withRender: boolean
) {
  return function Root(props: RootHelperProps<Tag, boolean>) {
    const {
      render,
      ref: localRef,
      ...restProps
    } = props as RootHelperProps<Tag, true>;
    const mergedRef = mergeTwoRefs(ref, localRef);

    return renderPolymorphic(
      tag,
      restProps as Record<string, unknown>,
      mergedRef,
      withRender ? render : undefined
    );
  };
}

export function createRootStyled<
  Tag extends AnyIntrinsicElement,
  TRecipe extends AnyRootRecipe,
  WithRender extends boolean,
  Aliases extends NativeAliases<Tag>
>(
  tag: Tag,
  recipe: TRecipe,
  options?: RootComponentOptions<Tag, TRecipe, WithRender, Aliases>
): (
  props: StyledComponentProps<Tag, TRecipe, WithRender, Aliases>
) => ReactNode {
  const compiled = getCompiledRecipe(recipe) as RootCompiledRecipe;
  const withRender = options?.withRender === true;
  const resolveOptions = normalizeResolveOptions(
    compiled,
    options as ResolveOptions | undefined
  );

  if (!options?.compose && !withRender) {
    const Component = forwardRef<
      unknown,
      StyledComponentProps<Tag, TRecipe, WithRender, Aliases>
    >(function StyledRootComponent(rawProps, ref) {
      if (compiled.validate && 'render' in rawProps) {
        throw new Error(
          'react-class-variants: render prop requires withRender: true.'
        );
      }

      const resolvedProps = resolveRootComponentProps(
        compiled,
        rawProps as Record<string, unknown>,
        resolveOptions
      ) as Record<string, unknown> & {
        className: string;
        ref?: unknown;
        render?: RenderProp;
      };
      const {
        ref: _ignoredResolvedRef,
        render: _ignoredRender,
        ...elementProps
      } = resolvedProps;

      return createElement(tag as any, { ...elementProps, ref });
    });

    Component.displayName = options?.displayName ?? `Styled(${String(tag)})`;
    return Component as unknown as (
      props: StyledComponentProps<Tag, TRecipe, WithRender, Aliases>
    ) => ReactNode;
  }

  if (!options?.compose) {
    const Component = forwardRef<
      unknown,
      StyledComponentProps<Tag, TRecipe, WithRender, Aliases>
    >(function StyledRootComponent(rawProps, ref) {
      const resolvedProps = resolveRootComponentProps(
        compiled,
        rawProps as Record<string, unknown>,
        resolveOptions
      );
      const { children, render, otherResolvedProps } =
        splitReactProps(resolvedProps);

      return renderPolymorphic(
        tag,
        {
          ...otherResolvedProps,
          className: resolvedProps.className,
          children,
        },
        ref,
        render
      );
    });

    Component.displayName = options?.displayName ?? `Styled(${String(tag)})`;
    return Component as unknown as (
      props: StyledComponentProps<Tag, TRecipe, WithRender, Aliases>
    ) => ReactNode;
  }

  const compose = options.compose;

  const Component = forwardRef<
    unknown,
    StyledComponentProps<Tag, TRecipe, WithRender, Aliases>
  >(function StyledRootComponent(rawProps, ref) {
    if (compiled.validate && !withRender && 'render' in rawProps) {
      throw new Error(
        'react-class-variants: render prop requires withRender: true.'
      );
    }

    const resolved = recipe.resolve(
      rawProps as Record<string, unknown>,
      resolveOptions
    );
    const { children, render, otherResolvedProps } = splitReactProps(
      resolved.resolvedProps
    );
    const Root = createRootHelper(tag, ref, withRender);

    return compose(
      {
        Root: Root as any,
        variants: resolved.variants as any,
      },
      {
        ...otherResolvedProps,
        className: resolved.resolvedProps.className,
        children,
        ref,
        ...(withRender ? { render } : {}),
      } as any
    );
  });

  Component.displayName = options?.displayName ?? `Styled(${String(tag)})`;
  return Component as unknown as (
    props: StyledComponentProps<Tag, TRecipe, WithRender, Aliases>
  ) => ReactNode;
}

export function createSlotStyled<
  Tag extends AnyIntrinsicElement,
  TRecipe extends AnySlotRecipe,
  WithRender extends boolean,
  Aliases extends NativeAliases<Tag>
>(
  tag: Tag,
  recipe: TRecipe,
  options: SlotComponentOptions<Tag, TRecipe, WithRender, Aliases>
): (
  props: StyledComponentProps<Tag, TRecipe, WithRender, Aliases>
) => ReactNode {
  const compiled = getCompiledRecipe(recipe);
  const withRender = options.withRender === true;
  const resolveOptions = normalizeResolveOptions(
    compiled,
    options as ResolveOptions
  );

  const Component = forwardRef<
    unknown,
    StyledComponentProps<Tag, TRecipe, WithRender, Aliases>
  >(function StyledSlotComponent(rawProps, ref) {
    if (compiled.validate && !withRender && 'render' in rawProps) {
      throw new Error(
        'react-class-variants: render prop requires withRender: true.'
      );
    }

    const resolved = recipe.resolve(
      rawProps as Record<string, unknown>,
      resolveOptions
    );
    const { className, children, render, otherResolvedProps } = splitReactProps(
      resolved.resolvedProps
    );
    const Root = createRootHelper(tag, ref, withRender);

    return options.compose(
      {
        Root: Root as any,
        variants: resolved.variants as any,
        slots: resolved.slots as any,
      },
      {
        ...otherResolvedProps,
        className,
        children,
        ref,
        ...(withRender ? { render } : {}),
      } as any
    );
  });

  Component.displayName = options.displayName ?? `Styled(${String(tag)})`;
  return Component as unknown as (
    props: StyledComponentProps<Tag, TRecipe, WithRender, Aliases>
  ) => ReactNode;
}
