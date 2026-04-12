import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  complexRootConfig,
  makeComplexRootConfig,
  makeComplexRootNoCompoundsConfig,
  makeSimpleRootConfig,
  rootScenarioInputs,
  simpleRootConfig,
} from '../fixtures/root.mjs';
import { createRenderFixtures } from '../fixtures/react.mjs';
import {
  complexSlotConfig,
  makeComplexSlotConfig,
  makeSimpleSlotConfig,
  simpleSlotConfig,
  slotScenarioInputs,
} from '../fixtures/slots.mjs';
import { benchmarkOps } from '../shared/stats.mjs';
import { runExecFile } from '../shared/process.mjs';
import {
  getEntryLayout,
  getPublicSurface,
  importModule,
  resolveAccess,
} from './surface.mjs';

export function createRuntimeBenchFixtures({ createElement, recipe, styled }) {
  const simpleRecipe = recipe(simpleRootConfig);
  const complexRecipe = recipe(complexRootConfig);
  const simpleSlotRecipe = recipe(simpleSlotConfig);
  const complexSlotRecipe = recipe(complexSlotConfig);
  const simpleComponent = styled('button', simpleRecipe);
  const complexComponent = styled('button', complexRecipe);
  const simpleRenderComponent = styled('button', simpleRecipe, {
    withRender: true,
  });
  const complexRenderComponent = styled('button', complexRecipe, {
    withRender: true,
  });
  const { renderElement, renderFunction } = createRenderFixtures(
    createElement,
    '/docs'
  );

  return {
    complexComponent,
    complexRecipe,
    complexRenderComponent,
    complexSlotRecipe,
    complexSlots: complexSlotRecipe(slotScenarioInputs.complex),
    renderElement,
    renderFunction,
    simpleComponent,
    simpleRecipe,
    simpleRenderComponent,
    simpleSlotRecipe,
    simpleSlots: simpleSlotRecipe(slotScenarioInputs.simple),
    styled,
  };
}

export async function measureRuntimeForEnv(targetDir, nodeEnv) {
  process.env.NODE_ENV = nodeEnv;

  const layout = getEntryLayout(targetDir);
  const coreModule = await importModule(layout.coreRuntime);
  const reactModule = await importModule(layout.reactRuntime);
  const surface = getPublicSurface(coreModule, reactModule);
  const recipe = resolveAccess(coreModule, reactModule, surface.recipeAccess);
  const styled = resolveAccess(coreModule, reactModule, surface.styledAccess);
  const scenario = createRuntimeBenchFixtures({
    createElement,
    recipe,
    styled,
  });
  const fastCreationBenchmark = {
    batchSize: 250,
    durationMs: 500,
    samples: 7,
    warmupMs: 100,
  };

  return {
    componentCreationComplex: benchmarkOps(
      () => scenario.styled('button', scenario.complexRecipe),
      fastCreationBenchmark
    ),
    componentCreationSimple: benchmarkOps(
      () => scenario.styled('button', scenario.simpleRecipe),
      fastCreationBenchmark
    ),
    componentRenderComplex: benchmarkOps(
      () =>
        renderToStaticMarkup(
          createElement(scenario.complexComponent, {
            children: 'Save',
            ...rootScenarioInputs.complexExplicit,
          })
        ),
      {
        batchSize: 10,
        durationMs: 250,
      }
    ),
    componentRenderPropElementComplex: benchmarkOps(
      () =>
        renderToStaticMarkup(
          createElement(scenario.complexRenderComponent, {
            children: 'Docs',
            render: scenario.renderElement,
            ...rootScenarioInputs.complexExplicit,
          })
        ),
      {
        batchSize: 10,
        durationMs: 250,
      }
    ),
    componentRenderPropElementSimple: benchmarkOps(
      () =>
        renderToStaticMarkup(
          createElement(scenario.simpleRenderComponent, {
            children: 'Docs',
            render: scenario.renderElement,
            ...rootScenarioInputs.simpleExplicit,
          })
        ),
      {
        batchSize: 25,
        durationMs: 250,
      }
    ),
    componentRenderPropFunctionComplex: benchmarkOps(
      () =>
        renderToStaticMarkup(
          createElement(scenario.complexRenderComponent, {
            children: 'Docs',
            render: scenario.renderFunction,
            ...rootScenarioInputs.complexExplicit,
          })
        ),
      {
        batchSize: 10,
        durationMs: 250,
      }
    ),
    componentRenderPropFunctionSimple: benchmarkOps(
      () =>
        renderToStaticMarkup(
          createElement(scenario.simpleRenderComponent, {
            children: 'Docs',
            render: scenario.renderFunction,
            ...rootScenarioInputs.simpleExplicit,
          })
        ),
      {
        batchSize: 25,
        durationMs: 250,
      }
    ),
    componentRenderSimple: benchmarkOps(
      () =>
        renderToStaticMarkup(
          createElement(scenario.simpleComponent, {
            children: 'Save',
            ...rootScenarioInputs.simpleExplicit,
          })
        ),
      {
        batchSize: 25,
        durationMs: 250,
      }
    ),
    recipeCreationComplex: benchmarkOps(() => recipe(makeComplexRootConfig()), {
      batchSize: 50,
      durationMs: 250,
    }),
    recipeCreationComplexNoCompounds: benchmarkOps(
      () => recipe(makeComplexRootNoCompoundsConfig()),
      {
        batchSize: 50,
        durationMs: 250,
      }
    ),
    recipeCreationSimple: benchmarkOps(() => recipe(makeSimpleRootConfig()), {
      batchSize: 100,
      durationMs: 250,
    }),
    recipeCreationSlotComplex: benchmarkOps(
      () => recipe(makeComplexSlotConfig()),
      {
        batchSize: 25,
        durationMs: 250,
      }
    ),
    recipeCreationSlotSimple: benchmarkOps(
      () => recipe(makeSimpleSlotConfig()),
      {
        batchSize: 50,
        durationMs: 250,
      }
    ),
    resolveComplex: benchmarkOps(
      () => scenario.complexRecipe(rootScenarioInputs.complexWithClassName),
      {
        batchSize: 100,
        durationMs: 250,
      }
    ),
    resolveSimple: benchmarkOps(
      () => scenario.simpleRecipe(rootScenarioInputs.simpleWithClassName),
      {
        batchSize: 250,
        durationMs: 250,
      }
    ),
    resolveSlotComplex: benchmarkOps(
      () => scenario.complexSlotRecipe(slotScenarioInputs.complex),
      {
        batchSize: 100,
        durationMs: 250,
      }
    ),
    resolveSlotSimple: benchmarkOps(
      () => scenario.simpleSlotRecipe(slotScenarioInputs.simple),
      {
        batchSize: 200,
        durationMs: 250,
      }
    ),
    slotClassNameAllComplex: benchmarkOps(
      () => {
        scenario.complexSlots.root(slotScenarioInputs.rootClassNameComplex);
        scenario.complexSlots.label();
        scenario.complexSlots.icon();
        scenario.complexSlots.badge();
      },
      {
        batchSize: 100,
        durationMs: 250,
      }
    ),
    slotClassNameRootComplex: benchmarkOps(
      () => scenario.complexSlots.root(slotScenarioInputs.rootClassNameComplex),
      {
        batchSize: 150,
        durationMs: 250,
      }
    ),
    slotClassNameRootSimple: benchmarkOps(
      () => scenario.simpleSlots.root(slotScenarioInputs.rootClassNameSimple),
      {
        batchSize: 250,
        durationMs: 250,
      }
    ),
  };
}

export function measureRuntime({ repoRoot, scriptPath, targetDir }) {
  const production = runExecFile(
    process.execPath,
    [
      '--expose-gc',
      scriptPath,
      '--runtime-worker',
      '--target-dir',
      targetDir,
      '--node-env',
      'production',
    ],
    { cwd: repoRoot }
  );
  const development = runExecFile(
    process.execPath,
    [
      '--expose-gc',
      scriptPath,
      '--runtime-worker',
      '--target-dir',
      targetDir,
      '--node-env',
      'development',
    ],
    { cwd: repoRoot }
  );

  return {
    development: JSON.parse(development),
    production: JSON.parse(production),
  };
}
