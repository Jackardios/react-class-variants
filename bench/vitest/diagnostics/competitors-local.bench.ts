// @vitest-environment node
import { describe, test } from 'vitest';
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
      test(scenarioName, async ({ bench }) => {
        await bench.compare(
          ...Object.entries(collection).map(([library, implementation]) => {
            const resolver = scenarioName.startsWith('simple')
              ? implementation.simple
              : implementation.complex;

            return bench(library, () => {
              resolver(props);
            });
          })
        );
      });
    }
  });
}
