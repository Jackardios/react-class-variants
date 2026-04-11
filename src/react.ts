/* eslint-disable @typescript-eslint/no-explicit-any -- public styled overloads intentionally erase recipe generics in the implementation signature. */
import type { ReactNode } from 'react';
import { createRootStyled, createSlotStyled } from './internal/builders';
import { createRecipeFactory, getCompiledRecipe } from './internal/recipe';
import type {
  AnyRootRecipe,
  AnySlotRecipe,
  SystemOptions,
} from './internal/core-types';
import type {
  AnyIntrinsicElement,
  NativeAliases,
  RootComponentOptions,
  SlotComponentOptions,
  StyledComponentProps,
} from './internal/react-types';

export type {
  AnyIntrinsicElement,
  NativeAliases,
  RenderFunctionProps,
  RenderProp,
  RootComponentOptions,
  RootCompose,
  RootComposeContext,
  RootComposeInput,
  RootHelperProps,
  SlotComponentOptions,
  SlotCompose,
  SlotComposeContext,
  SlotComposeInput,
  StyledComponentProps,
} from './internal/react-types';

function createStyledBuilder() {
  function styled<
    Tag extends AnyIntrinsicElement,
    TRecipe extends AnyRootRecipe,
    const WithRender extends boolean = false,
    const Aliases extends NativeAliases<Tag> = {}
  >(
    tag: Tag,
    inputRecipe: TRecipe,
    options?: RootComponentOptions<Tag, TRecipe, WithRender, Aliases>
  ): (
    props: StyledComponentProps<Tag, TRecipe, WithRender, Aliases>
  ) => ReactNode;

  function styled<
    Tag extends AnyIntrinsicElement,
    TRecipe extends AnySlotRecipe,
    const WithRender extends boolean = false,
    const Aliases extends NativeAliases<Tag> = {}
  >(
    tag: Tag,
    inputRecipe: TRecipe,
    options: SlotComponentOptions<Tag, TRecipe, WithRender, Aliases>
  ): (
    props: StyledComponentProps<Tag, TRecipe, WithRender, Aliases>
  ) => ReactNode;

  function styled(
    tag: AnyIntrinsicElement,
    inputRecipe: AnyRootRecipe | AnySlotRecipe,
    options?:
      | RootComponentOptions<any, any, any, any>
      | SlotComponentOptions<any, any, any, any>
  ) {
    const isSlotRecipe =
      getCompiledRecipe(inputRecipe as AnyRootRecipe).mode === 'slot';

    if ('compose' in (options ?? {}) && options?.compose) {
      if (isSlotRecipe) {
        return createSlotStyled(
          tag,
          inputRecipe as AnySlotRecipe,
          options as SlotComponentOptions<any, any, any, any>
        );
      }

      return createRootStyled(
        tag,
        inputRecipe as AnyRootRecipe,
        options as RootComponentOptions<any, any, any, any>
      );
    }

    if (isSlotRecipe) {
      throw new Error(
        'react-class-variants: slotted recipes require a compose callback.'
      );
    }

    return createRootStyled(
      tag,
      inputRecipe as AnyRootRecipe,
      options as RootComponentOptions<any, any, any, any> | undefined
    );
  }

  return styled;
}

export const styled = /* @__PURE__ */ createStyledBuilder();

export function defineConfig(options: SystemOptions = {}) {
  return {
    recipe: createRecipeFactory(options),
    styled,
  } as const;
}

export { mergeProps, mergeRefs, useMergeRefs } from './utils';
