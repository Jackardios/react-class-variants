import { createElement } from 'react';
import {
  complexComponentProps,
  simpleComponentProps,
} from '../fixtures/react.mjs';
import {
  makeComplexRootConfig,
  makeSimpleRootConfig,
} from '../fixtures/root.mjs';
import {
  makeComplexSlotConfig,
  makeSimpleSlotConfig,
  slotScenarioInputs,
} from '../fixtures/slots.mjs';
import { measureRetainedBytes } from '../shared/memory.mjs';
import {
  getEntryLayout,
  getPublicSurface,
  importModule,
  resolveAccess,
} from './surface.mjs';
import { createRuntimeBenchFixtures } from './runtime.mjs';

export async function measureRetainedMemory(
  targetDir,
  scriptLabel = 'measure-overhead.mjs'
) {
  process.env.NODE_ENV = 'production';

  const layout = getEntryLayout(targetDir);
  const coreModule = await importModule(layout.coreRuntime);
  const reactModule = await importModule(layout.reactRuntime);
  const surface = getPublicSurface(coreModule, reactModule);
  const recipe = resolveAccess(coreModule, reactModule, surface.recipeAccess);
  const styled = resolveAccess(coreModule, reactModule, surface.styledAccess);
  const fixtures = createRuntimeBenchFixtures({
    createElement,
    recipe,
    styled,
  });

  return {
    componentComplex: measureRetainedBytes(
      () => styled('button', fixtures.complexRecipe),
      15000,
      { label: 'componentComplex', scriptLabel }
    ),
    componentSimple: measureRetainedBytes(
      () => styled('button', fixtures.simpleRecipe),
      20000,
      { label: 'componentSimple', scriptLabel }
    ),
    componentWithRenderComplex: measureRetainedBytes(
      () => styled('button', fixtures.complexRecipe, { withRender: true }),
      15000,
      { label: 'componentWithRenderComplex', scriptLabel }
    ),
    componentWithRenderSimple: measureRetainedBytes(
      () => styled('button', fixtures.simpleRecipe, { withRender: true }),
      20000,
      { label: 'componentWithRenderSimple', scriptLabel }
    ),
    elementComplex: measureRetainedBytes(
      () =>
        createElement(fixtures.complexComponent, {
          ...complexComponentProps,
          children: 'Save',
        }),
      25000,
      { label: 'elementComplex', scriptLabel }
    ),
    elementRenderPropElementComplex: measureRetainedBytes(
      () =>
        createElement(fixtures.complexRenderComponent, {
          ...complexComponentProps,
          children: 'Docs',
          render: fixtures.renderElement,
        }),
      25000,
      { label: 'elementRenderPropElementComplex', scriptLabel }
    ),
    elementRenderPropElementSimple: measureRetainedBytes(
      () =>
        createElement(fixtures.simpleRenderComponent, {
          ...simpleComponentProps,
          children: 'Docs',
          render: fixtures.renderElement,
        }),
      30000,
      { label: 'elementRenderPropElementSimple', scriptLabel }
    ),
    elementRenderPropFunctionComplex: measureRetainedBytes(
      () =>
        createElement(fixtures.complexRenderComponent, {
          ...complexComponentProps,
          children: 'Docs',
          render: fixtures.renderFunction,
        }),
      25000,
      { label: 'elementRenderPropFunctionComplex', scriptLabel }
    ),
    elementRenderPropFunctionSimple: measureRetainedBytes(
      () =>
        createElement(fixtures.simpleRenderComponent, {
          ...simpleComponentProps,
          children: 'Docs',
          render: fixtures.renderFunction,
        }),
      30000,
      { label: 'elementRenderPropFunctionSimple', scriptLabel }
    ),
    elementSimple: measureRetainedBytes(
      () =>
        createElement(fixtures.simpleComponent, {
          ...simpleComponentProps,
          children: 'Save',
        }),
      30000,
      { label: 'elementSimple', scriptLabel }
    ),
    recipeComplex: measureRetainedBytes(
      () => recipe(makeComplexRootConfig()),
      20000,
      {
        label: 'recipeComplex',
        scriptLabel,
      }
    ),
    recipeSimple: measureRetainedBytes(
      () => recipe(makeSimpleRootConfig()),
      25000,
      {
        label: 'recipeSimple',
        scriptLabel,
      }
    ),
    recipeSlotComplex: measureRetainedBytes(
      () => recipe(makeComplexSlotConfig()),
      12000,
      { label: 'recipeSlotComplex', scriptLabel }
    ),
    recipeSlotSimple: measureRetainedBytes(
      () => recipe(makeSimpleSlotConfig()),
      15000,
      { label: 'recipeSlotSimple', scriptLabel }
    ),
    slotRenderersComplex: measureRetainedBytes(
      () => fixtures.complexSlotRecipe(slotScenarioInputs.complex),
      18000,
      { label: 'slotRenderersComplex', scriptLabel }
    ),
    slotRenderersSimple: measureRetainedBytes(
      () => fixtures.simpleSlotRecipe(slotScenarioInputs.simple),
      22000,
      { label: 'slotRenderersSimple', scriptLabel }
    ),
  };
}
