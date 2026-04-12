// @vitest-environment node
import { bench, describe } from 'vitest';
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
  describe('simple variants', () => {
    bench('resolve with props', () => {
      simpleRecipe(rootScenarioInputs.simpleExplicit);
    });

    bench('resolve with className', () => {
      simpleRecipe(rootScenarioInputs.simpleWithClassName);
    });
  });

  describe('multiple variants', () => {
    bench('resolve with defaults', () => {
      multipleRecipe(rootScenarioInputs.multipleDefaults);
    });

    bench('resolve with all props', () => {
      multipleRecipe(rootScenarioInputs.multipleAllProps);
    });

    bench('resolve with className', () => {
      multipleRecipe(rootScenarioInputs.multipleWithClassName);
    });
  });

  describe('compound variants', () => {
    bench('resolve matching compound', () => {
      complexRecipe(rootScenarioInputs.complexWithCompound);
    });

    bench('resolve no matching compounds', () => {
      complexRecipe(rootScenarioInputs.complexNoCompound);
    });

    bench('resolve with all props', () => {
      complexRecipe(rootScenarioInputs.complexAllProps);
    });
  });

  describe('many compound variants', () => {
    bench('resolve with array selectors matching', () => {
      manyCompoundRecipe(rootScenarioInputs.manyCompoundMatch);
    });

    bench('resolve with no matching', () => {
      manyCompoundRecipe(rootScenarioInputs.manyCompoundNoMatch);
    });
  });
});

describe('recipe() creation', () => {
  bench('create simple variants', () => {
    recipe(makeSimpleRootConfig());
  });

  bench('create multiple variants', () => {
    recipe(makeMultipleRootConfig());
  });

  bench('create complex variants', () => {
    recipe(makeComplexRootConfig());
  });
});
