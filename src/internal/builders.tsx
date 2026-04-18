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
import type {
  AnyElementType,
  AnyIntrinsicElement,
  AnyRootRecipeLike,
  AnySlotRecipeLike,
  PropAliases,
  RenderProp,
  RootStyledOptions,
  SlotStyledOptions,
  StyledComponentProps,
  StyledComponentType,
} from './react-types';
import {
  getCompiledRecipe,
  normalizeResolveOptions,
  resolveRootComponentProps,
  resolveRootViewState,
  resolveSlotClassNameForRender,
  resolveSlotViewState,
  type RootCompiledRecipe,
} from './recipe';
import type {
  CompiledSelectionValue,
  SlotCompiledRecipe,
} from './engine/shared';
import { flattenClassName } from './class-name';
import { getRefProperty, mergeTwoRefs } from './react-utils';
import { mergeProps } from '../utils';

const hostStateSymbol = Symbol('react-class-variants.host-state');
const slotCompiledSymbol = Symbol('react-class-variants.slot-compiled');
const slotClassNamesSymbol = Symbol('react-class-variants.slot-class-names');
const slotSelectionSymbol = Symbol('react-class-variants.slot-selection');

type HostRuntimeState = {
  base: AnyElementType;
  children: ReactNode;
  className: string;
  consumedPropKeys: readonly string[] | undefined;
  forwardedRef: ForwardedRef<unknown> | undefined;
  props: Record<string, unknown>;
  render: RenderProp | undefined;
  withRender: boolean;
};

type HostViewObject = {
  props: Record<string, unknown>;
  className: string;
  children?: ReactNode;
  render(overrides?: Record<string, unknown>): ReactNode;
  [hostStateSymbol]: HostRuntimeState;
};

type SlotClassesObject = Record<
  string,
  (input?: Record<string, unknown>) => string
> & {
  [slotCompiledSymbol]: SlotCompiledRecipe;
  [slotClassNamesSymbol]: readonly (string | undefined)[];
  [slotSelectionSymbol]: readonly CompiledSelectionValue[];
};

type SlotClassAccessor = readonly [
  slotName: string,
  getter: (
    this: SlotClassesObject
  ) => (input?: Record<string, unknown>) => string
];

function isIntrinsicBase(base: AnyElementType): base is AnyIntrinsicElement {
  return typeof base === 'string';
}

function omitConsumedProps(
  props: Record<string, unknown>,
  consumedPropKeys: readonly string[] | undefined
) {
  if (!consumedPropKeys || consumedPropKeys.length === 0) {
    return props;
  }

  let nextProps: Record<string, unknown> | undefined;

  for (const key of consumedPropKeys) {
    if (!(key in props)) continue;
    nextProps ??= { ...props };
    delete nextProps[key];
  }

  return nextProps ?? props;
}

function splitResolvedProps(props: Record<string, unknown>) {
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
    otherResolvedProps,
    render: render as RenderProp | undefined,
  };
}

function renderIntrinsic(
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

function renderBase(
  base: AnyElementType,
  props: Record<string, unknown>,
  forwardedRef: ForwardedRef<unknown> | undefined,
  render: RenderProp | undefined
) {
  if (isIntrinsicBase(base)) {
    return renderIntrinsic(base, props, forwardedRef, render);
  }

  const { ref: _ignoredRef, render: _ignoredRender, ...restProps } = props;
  return createElement(base as any, { ...restProps, ref: forwardedRef });
}

function renderHostView(
  this: HostViewObject,
  overrides?: Record<string, unknown>
): ReactNode {
  const state = this[hostStateSymbol];
  const overrideSource = { ...(overrides ?? {}) };
  if ('className' in overrideSource) {
    overrideSource.className = flattenClassName(
      overrideSource.className as ClassNameValue | undefined
    );
  }
  const {
    ref: localRef,
    render: overrideRender,
    ...overrideProps
  } = overrideSource;
  const mergedRef = mergeTwoRefs(
    state.forwardedRef,
    localRef as ForwardedRef<unknown> | undefined
  );

  const mergedProps = mergeProps(
    {
      ...state.props,
      children: state.children,
      className: state.className,
    },
    overrideProps
  ) as Record<string, unknown>;

  return renderBase(
    state.base,
    omitConsumedProps(mergedProps, state.consumedPropKeys),
    mergedRef,
    state.withRender
      ? (overrideRender as RenderProp | undefined) ?? state.render
      : undefined
  );
}

const hostViewPrototype: Pick<HostViewObject, 'render'> = {
  render: renderHostView,
};

function createHostView(
  base: AnyElementType,
  props: Record<string, unknown>,
  className: string,
  children: ReactNode,
  consumedPropKeys: readonly string[] | undefined,
  forwardedRef: ForwardedRef<unknown> | undefined,
  render: RenderProp | undefined,
  withRender: boolean
) {
  const host = Object.create(hostViewPrototype) as HostViewObject;
  host[hostStateSymbol] = {
    base,
    children,
    className,
    consumedPropKeys,
    forwardedRef,
    props,
    render,
    withRender,
  };
  host.props = props;
  host.className = className;
  host.children = children;
  return host;
}

function createSlotClassAccessors(
  slotNames: readonly string[]
): readonly SlotClassAccessor[] {
  const accessors = new Array<SlotClassAccessor>(slotNames.length);
  for (let slotIndex = 0; slotIndex < slotNames.length; slotIndex += 1) {
    const slotName = slotNames[slotIndex];
    accessors[slotIndex] = [
      slotName,
      function getSlotRenderer(this: SlotClassesObject) {
        const renderSlot = (input?: Record<string, unknown>) =>
          resolveSlotClassNameForRender(
            this[slotCompiledSymbol],
            slotIndex,
            this[slotSelectionSymbol],
            this[slotClassNamesSymbol],
            input
          );

        Object.defineProperty(this, slotName, {
          configurable: true,
          enumerable: true,
          value: renderSlot,
          writable: false,
        });

        return renderSlot;
      },
    ];
  }

  return accessors;
}

function createSlotClasses(
  accessors: readonly SlotClassAccessor[],
  compiled: SlotCompiledRecipe,
  selection: readonly CompiledSelectionValue[],
  slotClassNames: readonly (string | undefined)[]
) {
  const classes = Object.create(null) as SlotClassesObject;

  Object.defineProperty(classes, slotCompiledSymbol, {
    value: compiled,
  });
  Object.defineProperty(classes, slotClassNamesSymbol, {
    value: slotClassNames,
  });
  Object.defineProperty(classes, slotSelectionSymbol, {
    value: selection,
  });

  for (const [slotName, getter] of accessors) {
    Object.defineProperty(classes, slotName, {
      configurable: true,
      enumerable: true,
      get: getter,
    });
  }

  return classes;
}

function getHostSlotIndex(
  compiled: SlotCompiledRecipe,
  hostSlot: string | undefined
) {
  const resolvedHostSlot = hostSlot ?? 'root';
  const slotIndex = compiled.slotIndex[resolvedHostSlot];

  if (slotIndex !== undefined) {
    return slotIndex;
  }

  if (hostSlot) {
    throw new Error(
      `react-class-variants: hostSlot "${hostSlot}" is not declared in recipe.slots.`
    );
  }

  throw new Error(
    'react-class-variants: slotted recipes without a "root" slot require hostSlot.'
  );
}

function getConsumedViewPropKeys(
  compiled: RootCompiledRecipe | SlotCompiledRecipe,
  options:
    | {
        propAliases?: Partial<Record<string, string>> | undefined;
        viewProps?: { keys: readonly string[] } | undefined;
      }
    | undefined
) {
  const consumedPropKeys = options?.viewProps?.keys;

  if (!consumedPropKeys || consumedPropKeys.length === 0) {
    return undefined;
  }

  if (!compiled.validate) {
    return consumedPropKeys;
  }

  const aliasPublicKeys = new Set(
    Object.values(options?.propAliases ?? {}).filter((value): value is string =>
      Boolean(value)
    )
  );
  const variantKeys = new Set(
    compiled.variantTable.map(variant => variant.key)
  );

  for (const key of consumedPropKeys) {
    if (
      key === 'children' ||
      key === 'className' ||
      key === 'ref' ||
      key === 'render' ||
      (compiled.mode === 'slot' && key === 'slotClassNames')
    ) {
      throw new Error(
        `react-class-variants: viewProps key "${key}" conflicts with a reserved public prop.`
      );
    }

    if (variantKeys.has(key)) {
      throw new Error(
        `react-class-variants: viewProps key "${key}" conflicts with a declared variant key.`
      );
    }

    if (aliasPublicKeys.has(key)) {
      throw new Error(
        `react-class-variants: viewProps key "${key}" conflicts with a prop alias public key.`
      );
    }
  }

  return consumedPropKeys;
}

function ensureRenderSupported(
  validate: boolean,
  withRender: boolean,
  rawProps: Record<string, unknown>
) {
  if (validate && !withRender && 'render' in rawProps) {
    throw new Error(
      'react-class-variants: render prop requires withRender: true.'
    );
  }
}

function createIntrinsicRootFastStyled<
  Base extends AnyIntrinsicElement,
  TRecipe extends AnyRootRecipeLike,
  Aliases extends PropAliases<Base>,
  Forwarded extends string,
  ViewProps extends Record<string, unknown>
>(
  base: Base,
  compiled: RootCompiledRecipe,
  resolveOptions: ReturnType<typeof normalizeResolveOptions> | undefined,
  displayName: string
) {
  const Component = forwardRef<
    unknown,
    StyledComponentProps<Base, TRecipe, false, Aliases, Forwarded, ViewProps>
  >(function StyledIntrinsicRootComponent(rawProps, ref) {
    ensureRenderSupported(
      compiled.validate,
      false,
      rawProps as Record<string, unknown>
    );

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

    return createElement(base as any, { ...elementProps, ref });
  });

  Component.displayName = displayName;
  return Component;
}

function createRootRenderStyled<
  Base extends AnyElementType,
  TRecipe extends AnyRootRecipeLike,
  WithRender extends boolean,
  Aliases extends PropAliases<Base>,
  Forwarded extends string,
  ViewProps extends Record<string, unknown>
>(
  base: Base,
  compiled: RootCompiledRecipe,
  resolveOptions: ReturnType<typeof normalizeResolveOptions> | undefined,
  withRender: WithRender,
  displayName: string
) {
  const Component = forwardRef<
    unknown,
    StyledComponentProps<
      Base,
      TRecipe,
      WithRender,
      Aliases,
      Forwarded,
      ViewProps
    >
  >(function StyledRootRenderComponent(rawProps, ref) {
    ensureRenderSupported(
      compiled.validate,
      withRender === true,
      rawProps as Record<string, unknown>
    );

    const resolvedProps = resolveRootComponentProps(
      compiled,
      rawProps as Record<string, unknown>,
      resolveOptions
    );
    const { children, className, otherResolvedProps, render } =
      splitResolvedProps(resolvedProps);

    return renderBase(
      base,
      {
        ...otherResolvedProps,
        children,
        className,
      },
      ref,
      withRender ? render : undefined
    );
  });

  Component.displayName = displayName;
  return Component;
}

function createRootViewStyled<
  Base extends AnyElementType,
  TRecipe extends AnyRootRecipeLike,
  WithRender extends boolean,
  Aliases extends PropAliases<Base>,
  Forwarded extends string,
  ViewProps extends Record<string, unknown>
>(
  base: Base,
  compiled: RootCompiledRecipe,
  options: RootStyledOptions<
    Base,
    TRecipe,
    WithRender,
    Aliases,
    Forwarded,
    ViewProps
  >,
  resolveOptions: ReturnType<typeof normalizeResolveOptions> | undefined,
  withRender: WithRender,
  displayName: string
) {
  const View = options.view!;
  const consumedPropKeys = getConsumedViewPropKeys(compiled, options);

  const Component = forwardRef<
    unknown,
    StyledComponentProps<
      Base,
      TRecipe,
      WithRender,
      Aliases,
      Forwarded,
      ViewProps
    >
  >(function StyledRootViewComponent(rawProps, ref) {
    ensureRenderSupported(
      compiled.validate,
      withRender === true,
      rawProps as Record<string, unknown>
    );

    const resolved = resolveRootViewState(
      compiled,
      rawProps as Record<string, unknown>,
      resolveOptions
    );
    const { children, className, otherResolvedProps, render } =
      splitResolvedProps(resolved.resolvedProps);

    return createElement(View as any, {
      host: createHostView(
        base,
        otherResolvedProps,
        flattenClassName(className),
        children,
        consumedPropKeys,
        ref,
        render,
        withRender === true
      ),
      variants: resolved.variants,
    });
  });

  Component.displayName = displayName;
  return Component;
}

function createSlotViewStyled<
  Base extends AnyElementType,
  TRecipe extends AnySlotRecipeLike,
  WithRender extends boolean,
  Aliases extends PropAliases<Base>,
  Forwarded extends string,
  ViewProps extends Record<string, unknown>
>(
  base: Base,
  recipe: TRecipe,
  options: SlotStyledOptions<
    Base,
    TRecipe,
    WithRender,
    Aliases,
    Forwarded,
    ViewProps
  >,
  resolveOptions: ReturnType<typeof normalizeResolveOptions> | undefined,
  withRender: WithRender,
  displayName: string
) {
  const compiled = getCompiledRecipe(
    recipe as unknown as AnySlotRecipe
  ) as SlotCompiledRecipe;
  const View = options.view;
  const hostSlotIndex = getHostSlotIndex(compiled, options.hostSlot);
  const slotClassAccessors = createSlotClassAccessors(compiled.slotNames);
  const consumedPropKeys = getConsumedViewPropKeys(compiled, options);

  const Component = forwardRef<
    unknown,
    StyledComponentProps<
      Base,
      TRecipe,
      WithRender,
      Aliases,
      Forwarded,
      ViewProps
    >
  >(function StyledSlotViewComponent(rawProps, ref) {
    ensureRenderSupported(
      compiled.validate,
      withRender === true,
      rawProps as Record<string, unknown>
    );

    const resolved = resolveSlotViewState(
      compiled,
      rawProps as Record<string, unknown>,
      resolveOptions
    );
    const { children, className, otherResolvedProps, render } =
      splitResolvedProps(resolved.resolvedProps);

    return createElement(View as any, {
      classes: createSlotClasses(
        slotClassAccessors,
        compiled,
        resolved.selection,
        resolved.slotClassNames
      ),
      host: createHostView(
        base,
        otherResolvedProps,
        resolveSlotClassNameForRender(
          compiled,
          hostSlotIndex,
          resolved.selection,
          resolved.slotClassNames,
          className ? { className } : undefined
        ),
        children,
        consumedPropKeys,
        ref,
        render,
        withRender === true
      ),
      variants: resolved.variants,
    });
  });

  Component.displayName = displayName;
  return Component;
}

export function createRootStyled<
  Base extends AnyElementType,
  TRecipe extends AnyRootRecipeLike,
  WithRender extends boolean,
  Aliases extends PropAliases<Base>,
  Forwarded extends string,
  ViewProps extends Record<string, unknown>
>(
  base: Base,
  recipe: TRecipe,
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
> {
  const compiled = getCompiledRecipe(
    recipe as unknown as AnyRootRecipe
  ) as RootCompiledRecipe;
  const withRender = options?.withRender === true;
  const resolveOptions = normalizeResolveOptions(
    compiled,
    options as ResolveOptions | undefined
  );
  const displayName = options?.displayName ?? `Styled(${String(base)})`;

  if (!options?.view && isIntrinsicBase(base) && !withRender) {
    return createIntrinsicRootFastStyled(
      base,
      compiled,
      resolveOptions,
      displayName
    ) as StyledComponentType<
      Base,
      TRecipe,
      WithRender,
      Aliases,
      Forwarded,
      ViewProps
    >;
  }

  if (!options?.view) {
    return createRootRenderStyled<
      Base,
      TRecipe,
      WithRender,
      Aliases,
      Forwarded,
      ViewProps
    >(
      base,
      compiled,
      resolveOptions,
      withRender as WithRender,
      displayName
    ) as StyledComponentType<
      Base,
      TRecipe,
      WithRender,
      Aliases,
      Forwarded,
      ViewProps
    >;
  }

  return createRootViewStyled<
    Base,
    TRecipe,
    WithRender,
    Aliases,
    Forwarded,
    ViewProps
  >(
    base,
    compiled,
    options,
    resolveOptions,
    withRender as WithRender,
    displayName
  ) as StyledComponentType<
    Base,
    TRecipe,
    WithRender,
    Aliases,
    Forwarded,
    ViewProps
  >;
}

export function createSlotStyled<
  Base extends AnyElementType,
  TRecipe extends AnySlotRecipeLike,
  WithRender extends boolean,
  Aliases extends PropAliases<Base>,
  Forwarded extends string,
  ViewProps extends Record<string, unknown>
>(
  base: Base,
  recipe: TRecipe,
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
> {
  const compiled = getCompiledRecipe(
    recipe as unknown as AnySlotRecipe
  ) as SlotCompiledRecipe;
  const withRender = options.withRender === true;
  const resolveOptions = normalizeResolveOptions(
    compiled,
    options as ResolveOptions
  );
  const displayName = options.displayName ?? `Styled(${String(base)})`;

  return createSlotViewStyled<
    Base,
    TRecipe,
    WithRender,
    Aliases,
    Forwarded,
    ViewProps
  >(
    base,
    recipe,
    options,
    resolveOptions,
    withRender as WithRender,
    displayName
  ) as StyledComponentType<
    Base,
    TRecipe,
    WithRender,
    Aliases,
    Forwarded,
    ViewProps
  >;
}
