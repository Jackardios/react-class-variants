// @vitest-environment node
import { describe, test } from 'vitest';
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
  test('create slot renderers', async ({ bench }) => {
    await bench.compare(
      bench('with default props', () => {
        simpleSlotRecipe();
      }),
      bench('with complex props', () => {
        complexSlotRecipe(slotScenarioInputs.complex);
      })
    );
  });

  test('call prepared slots', async ({ bench }) => {
    await bench.compare(
      bench('root slot with className override (simple)', () => {
        simplePreparedSlots.root(slotScenarioInputs.rootClassNameSimple);
      }),
      bench('root slot with className override (complex)', () => {
        complexPreparedSlots.root(slotScenarioInputs.rootClassNameComplex);
      }),
      bench('all complex slot renderers', () => {
        complexPreparedSlots.root(slotScenarioInputs.rootClassNameComplex);
        complexPreparedSlots.label();
        complexPreparedSlots.icon();
        complexPreparedSlots.badge();
      })
    );
  });
});
