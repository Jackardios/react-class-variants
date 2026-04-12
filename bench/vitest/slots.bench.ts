// @vitest-environment node
import { bench, describe } from 'vitest';
import { recipe } from '../../src';
import {
  complexSlotConfig,
  simpleSlotConfig,
  slotScenarioInputs,
} from '../fixtures/slots.mjs';

const simpleSlotRecipe = recipe(simpleSlotConfig);
const complexSlotRecipe = recipe(complexSlotConfig);
const simplePreparedSlots = simpleSlotRecipe(slotScenarioInputs.simple);
const complexPreparedSlots = complexSlotRecipe(slotScenarioInputs.complex);

describe('slotted recipe()', () => {
  bench('create slot renderers with default props', () => {
    simpleSlotRecipe();
  });

  bench('create slot renderers with complex props', () => {
    complexSlotRecipe(slotScenarioInputs.complex);
  });

  bench('call prepared root slot with className override (simple)', () => {
    simplePreparedSlots.root(slotScenarioInputs.rootClassNameSimple);
  });

  bench('call prepared root slot with className override (complex)', () => {
    complexPreparedSlots.root(slotScenarioInputs.rootClassNameComplex);
  });

  bench('call prepared complex slot renderers', () => {
    complexPreparedSlots.root(slotScenarioInputs.rootClassNameComplex);
    complexPreparedSlots.label();
    complexPreparedSlots.icon();
    complexPreparedSlots.badge();
  });
});
