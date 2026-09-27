/* eslint-disable @typescript-eslint/no-explicit-any -- React adapters need runtime casts; react.ts restores the public types. */
import {
  cloneElement,
  createElement,
  isValidElement,
  type ComponentType,
  type FunctionComponent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import type { ClassNameValue, ResolveOptions } from './core-types';
import type {
  AnyElementType,
  RenderProp,
  RootStyledOptions,
  SlotStyledOptions,
} from './react-types';
import {
  createSkipKeys,
  normalizeResolveOptions,
  type NormalizedResolveOptions,
  type SkipKeys,
} from './engine/props';
import { resolveRootComponentProps, resolveRootViewState } from './engine/root';
import {
  ensureVariantIndex,
  hasOwnKey,
  isReservedPublicProp,
  type CompiledRecipe,
  type RootCompiledRecipe,
  type SlotCompiledRecipe,
} from './engine/shared';
import {
  createSlotRenderers,
  resolveSlotClassName,
  resolveSlotViewState,
} from './engine/slot';
import { appendClassName, flattenClassName } from './class-name';
import {
  getComponentDisplayName,
  getRefProperty,
  mergeTwoRefs,
} from './react-utils';
import { assignMergedProps } from '../utils';

type AnyStyledOptions =
  | RootStyledOptions<any, any, any, any, any, any>
  | SlotStyledOptions<any, any, any, any, any, any>;

type RenderFunction = (props: Record<string, unknown>) => ReactNode;

// The direct path reads `render` from the raw props, so it never reaches the
// element props; `ref` is an ordinary React 19 prop and flows through.
const directSkipKeys = ['render'];
// View paths expose these through the host view, outside host.props.
const viewSkipKeys = ['children', 'className', 'ref', 'render'];

const hostStateSymbol = Symbol('react-class-variants.host-state');

// Per-component host settings, built once in styled().
type HostSetup = {
  base: AnyElementType;
  // viewProps keys: visible in host.props, never rendered.
  consumed: SkipKeys | undefined;
  // host.render() override keys assignMergedProps skips: className, ref, and
  // render are merged separately, viewProps keys are dropped.
  overrideSkip: SkipKeys;
  withRender: boolean;
};

type HostState = {
  children: ReactNode;
  className: string;
  ref: Ref<unknown> | undefined;
  props: Record<string, unknown>;
  render: RenderProp | undefined;
  setup: HostSetup;
};

type HostViewObject = {
  props: Record<string, unknown>;
  className: string;
  children?: ReactNode;
  render(overrides?: Record<string, unknown>): ReactNode;
  [hostStateSymbol]: HostState;
};

// Renders `base` from a props object this module owns (never React's frozen
// props), so it may be mutated in place. `props.ref` is the outer ref.
function renderElement(
  base: AnyElementType,
  props: Record<string, unknown>,
  render: RenderProp | undefined
): ReactNode {
  if (!render) {
    return createElement(base as any, props);
  }

  const mergedRef = mergeTwoRefs(
    props.ref as Ref<unknown> | undefined,
    getRefProperty(render)
  );

  if (isValidElement(render)) {
    const element = render as ReactElement<Record<string, unknown>>;
    assignMergedProps(props, element.props);
    props.ref = mergedRef;
    return cloneElement(element, props);
  }

  props.ref = mergedRef;
  return (render as RenderFunction)(props);
}

function copyHostProps(
  source: Record<string, unknown>,
  consumed: SkipKeys | undefined
) {
  if (!consumed) return { ...source };

  const props: Record<string, unknown> = {};
  for (const key in source) {
    if (!hasOwnKey(source, key) || consumed[key] === true) continue;
    props[key] = source[key];
  }
  return props;
}

function renderHostView(
  this: HostViewObject,
  overrides?: Record<string, unknown>
): ReactNode {
  const state = this[hostStateSymbol];
  const { setup } = state;
  const props = copyHostProps(state.props, setup.consumed);
  props.children = state.children;
  props.className = state.className;

  let ref = state.ref;
  let render = state.render;

  if (overrides) {
    assignMergedProps(props, overrides, setup.overrideSkip);
    props.className = appendClassName(
      state.className,
      flattenClassName(overrides.className as ClassNameValue | undefined)
    );
    ref = mergeTwoRefs(ref, overrides.ref as Ref<unknown> | undefined);
    if (setup.withRender) {
      render = (overrides.render as RenderProp | undefined) ?? render;
    }
  }

  if (ref) props.ref = ref;
  return renderElement(setup.base, props, render);
}

const hostViewPrototype: Pick<HostViewObject, 'render'> = {
  render: renderHostView,
};

function createHostView(state: HostState) {
  const host = Object.create(hostViewPrototype) as HostViewObject;
  host[hostStateSymbol] = state;
  host.props = state.props;
  host.className = state.className;
  host.children = state.children;
  return host;
}

function getHostSlotIndex(
  compiled: SlotCompiledRecipe,
  hostSlot: string | undefined
) {
  const slotIndex = compiled.slotIndex[hostSlot ?? 'root'];

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

function createHostSetup(
  base: AnyElementType,
  compiled: CompiledRecipe,
  options: AnyStyledOptions,
  aliasKeys: SkipKeys | undefined,
  withRender: boolean
): HostSetup {
  const consumedKeys = options.viewProps?.keys ?? [];

  if (compiled.validate && consumedKeys.length > 0) {
    const variantIndex = ensureVariantIndex(compiled);

    for (const key of consumedKeys) {
      if (isReservedPublicProp(compiled.mode, key)) {
        throw new Error(
          `react-class-variants: viewProps key "${key}" conflicts with a reserved public prop.`
        );
      }

      if (variantIndex[key] !== undefined) {
        throw new Error(
          `react-class-variants: viewProps key "${key}" conflicts with a declared variant key.`
        );
      }

      if (aliasKeys?.[key] === true) {
        throw new Error(
          `react-class-variants: viewProps key "${key}" conflicts with a prop alias public key.`
        );
      }
    }
  }

  return {
    base,
    consumed:
      consumedKeys.length > 0 ? createSkipKeys(consumedKeys) : undefined,
    overrideSkip: createSkipKeys([
      'className',
      'ref',
      'render',
      ...consumedKeys,
    ]),
    withRender,
  };
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

function createDirectComponent(
  base: AnyElementType,
  compiled: RootCompiledRecipe,
  resolveOptions: NormalizedResolveOptions | undefined,
  skip: SkipKeys,
  withRender: boolean
) {
  return function StyledComponent(rawProps: Record<string, unknown>) {
    ensureRenderSupported(compiled.validate, withRender, rawProps);

    return renderElement(
      base,
      resolveRootComponentProps(compiled, rawProps, resolveOptions, skip),
      withRender ? (rawProps.render as RenderProp | undefined) : undefined
    );
  };
}

function createRootViewComponent(
  compiled: RootCompiledRecipe,
  resolveOptions: NormalizedResolveOptions | undefined,
  skip: SkipKeys,
  setup: HostSetup,
  View: ComponentType<any>
) {
  return function StyledViewComponent(rawProps: Record<string, unknown>) {
    ensureRenderSupported(compiled.validate, setup.withRender, rawProps);

    const resolved = resolveRootViewState(
      compiled,
      rawProps,
      resolveOptions,
      skip
    );

    return createElement(View, {
      host: createHostView({
        children: rawProps.children as ReactNode,
        className: resolved.className,
        ref: rawProps.ref as Ref<unknown> | undefined,
        props: resolved.props,
        render: setup.withRender
          ? (rawProps.render as RenderProp | undefined)
          : undefined,
        setup,
      }),
      variants: resolved.variants,
    });
  };
}

function createSlotViewComponent(
  compiled: SlotCompiledRecipe,
  resolveOptions: NormalizedResolveOptions | undefined,
  skip: SkipKeys,
  setup: HostSetup,
  View: ComponentType<any>,
  hostSlotIndex: number
) {
  return function StyledSlotViewComponent(rawProps: Record<string, unknown>) {
    ensureRenderSupported(compiled.validate, setup.withRender, rawProps);

    const resolved = resolveSlotViewState(
      compiled,
      rawProps,
      resolveOptions,
      skip
    );

    return createElement(View, {
      classes: createSlotRenderers(
        compiled,
        resolved.selection,
        resolved.slotClassNames
      ),
      host: createHostView({
        children: rawProps.children as ReactNode,
        className: resolveSlotClassName(
          compiled,
          hostSlotIndex,
          resolved.selection,
          resolved.slotClassNames,
          rawProps.className as ClassNameValue | undefined
        ),
        ref: rawProps.ref as Ref<unknown> | undefined,
        props: resolved.props,
        render: setup.withRender
          ? (rawProps.render as RenderProp | undefined)
          : undefined,
        setup,
      }),
      variants: resolved.variants,
    });
  };
}

// react.ts has already validated the base/options combination.
export function createStyled(
  base: AnyElementType,
  compiled: CompiledRecipe,
  options: AnyStyledOptions | undefined
) {
  const withRender = options?.withRender === true;
  const resolveOptions = normalizeResolveOptions(
    compiled,
    options as ResolveOptions | undefined
  );
  // Slotted recipes always have a view (checked in react.ts).
  const skip = createSkipKeys(
    options?.view ? viewSkipKeys : directSkipKeys,
    resolveOptions?.aliasKeys
  );
  let Component: FunctionComponent<Record<string, unknown>>;

  if (compiled.mode === 'slot') {
    const slotOptions = options as SlotStyledOptions<
      any,
      any,
      any,
      any,
      any,
      any
    >;
    const hostSlotIndex = getHostSlotIndex(compiled, slotOptions.hostSlot);
    Component = createSlotViewComponent(
      compiled,
      resolveOptions,
      skip,
      createHostSetup(
        base,
        compiled,
        slotOptions,
        resolveOptions?.aliasKeys,
        withRender
      ),
      slotOptions.view,
      hostSlotIndex
    );
  } else if (options?.view) {
    Component = createRootViewComponent(
      compiled,
      resolveOptions,
      skip,
      createHostSetup(
        base,
        compiled,
        options,
        resolveOptions?.aliasKeys,
        withRender
      ),
      options.view
    );
  } else {
    Component = createDirectComponent(
      base,
      compiled,
      resolveOptions,
      skip,
      withRender
    );
  }

  Component.displayName =
    options?.displayName ?? `Styled(${getComponentDisplayName(base)})`;
  return Component;
}
