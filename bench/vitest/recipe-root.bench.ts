// @vitest-environment node
import { describe, test } from 'vitest';
import { recipe } from '../../src';
import {
  makeComplexRootConfig,
  makeMultipleRootConfig,
  makeSimpleRootConfig,
  manyCompoundRootConfig,
  rootScenarioInputs,
} from '../fixtures/root.mjs';

const simpleRecipe = recipe(makeSimpleRootConfig());
const multipleRecipe = recipe(makeMultipleRootConfig());
const complexRecipe = recipe(makeComplexRootConfig());
const manyCompoundRecipe = recipe(manyCompoundRootConfig);

describe('recipe()', () => {
  test('simple variants', async ({ bench }) => {
    await bench.compare(
      bench('resolve with props', () => {
        simpleRecipe(rootScenarioInputs.simpleExplicit);
      }),
      bench('resolve with className', () => {
        simpleRecipe(rootScenarioInputs.simpleWithClassName);
      })
    );
  });

  test('multiple variants', async ({ bench }) => {
    await bench.compare(
      bench('resolve with defaults', () => {
        multipleRecipe(rootScenarioInputs.multipleDefaults);
      }),
      bench('resolve with all props', () => {
        multipleRecipe(rootScenarioInputs.multipleAllProps);
      }),
      bench('resolve with className', () => {
        multipleRecipe(rootScenarioInputs.multipleWithClassName);
      })
    );
  });

  test('compound variants', async ({ bench }) => {
    await bench.compare(
      bench('resolve matching compound', () => {
        complexRecipe(rootScenarioInputs.complexWithCompound);
      }),
      bench('resolve no matching compounds', () => {
        complexRecipe(rootScenarioInputs.complexNoCompound);
      }),
      bench('resolve with all props', () => {
        complexRecipe(rootScenarioInputs.complexAllProps);
      })
    );
  });

  test('many compound variants', async ({ bench }) => {
    await bench.compare(
      bench('resolve with array selectors matching', () => {
        manyCompoundRecipe(rootScenarioInputs.manyCompoundMatch);
      }),
      bench('resolve with no matching', () => {
        manyCompoundRecipe(rootScenarioInputs.manyCompoundNoMatch);
      })
    );
  });
});

test('recipe() creation', async ({ bench }) => {
  await bench.compare(
    bench('create simple variants', () => {
      recipe(makeSimpleRootConfig());
    }),
    bench('create multiple variants', () => {
      recipe(makeMultipleRootConfig());
    }),
    bench('create complex variants', () => {
      recipe(makeComplexRootConfig());
    })
  );
});
