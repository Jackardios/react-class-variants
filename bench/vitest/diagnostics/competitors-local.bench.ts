// @vitest-environment node
import { bench, describe } from 'vitest';
import { cva } from 'class-variance-authority';
import { variants as cnVariants } from 'classname-variants';
import { twMerge } from 'tailwind-merge';
import { tv as tvMerged } from 'tailwind-variants';
import { tv as tvLite } from 'tailwind-variants/lite';
import { defineConfig, recipe } from '../../../src';
import {
  competitorRuntimeScenarios,
  createCompetitorBenchmarkFactories,
} from '../../fixtures/competitors.mjs';

const factories = createCompetitorBenchmarkFactories({
  cnVariants,
  cva,
  defineConfig,
  recipe,
  tvLite,
  tvMerged,
  twMerge,
});

const scenarioGroups = {
  'complex explicit': competitorRuntimeScenarios.complexExplicit,
  'complex without compound': competitorRuntimeScenarios.complexNoCompound,
  'complex with compound': competitorRuntimeScenarios.complexWithCompound,
  'simple defaults': competitorRuntimeScenarios.simpleDefaults,
  'simple explicit': competitorRuntimeScenarios.simpleExplicit,
};

for (const [track, collection] of Object.entries(factories)) {
  const trackTitle =
    track === 'tailwindAware'
      ? 'tailwind-aware diagnostics'
      : 'resolver-only diagnostics';

  describe(`competitors local: ${trackTitle}`, () => {
    for (const [scenarioName, props] of Object.entries(scenarioGroups)) {
      describe(scenarioName, () => {
        for (const [library, implementation] of Object.entries(collection)) {
          const resolver =
            scenarioName.startsWith('simple') ||
            scenarioName === 'simple defaults'
              ? implementation.simple
              : implementation.complex;

          bench(library, () => {
            resolver(props);
          });
        }
      });
    }
  });
}
