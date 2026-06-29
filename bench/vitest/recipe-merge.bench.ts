// @vitest-environment node
import { bench, describe } from 'vitest';
import { twMerge } from 'tailwind-merge';
import { defineConfig } from '../../src';
import {
  makeComplexRootConfig,
  rootScenarioInputs,
} from '../fixtures/root.mjs';
import {
  makeComplexSlotConfig,
  slotScenarioInputs,
} from '../fixtures/slots.mjs';

const cached = defineConfig({ merge: twMerge });
const uncached = defineConfig({ merge: twMerge, cache: false });

const cachedRoot = cached.recipe(makeComplexRootConfig());
const uncachedRoot = uncached.recipe(makeComplexRootConfig());

const cachedSlots = cached.recipe(makeComplexSlotConfig());
const uncachedSlots = uncached.recipe(makeComplexSlotConfig());

// A bounded set of distinct classNames — the realistic SSR shape where a finite
// pool of variant/className combinations recurs across many renders.
const rotatingClassNames = Array.from(
  { length: 64 },
  (_value, index) => `m-${index} p-${index} gap-${index}`
);
let rotationIndex = 0;
function nextRotatingInput() {
  rotationIndex = (rotationIndex + 1) % rotatingClassNames.length;
  return {
    ...rootScenarioInputs.complexWithCompound,
    className: rotatingClassNames[rotationIndex],
  };
}

describe('root resolve with twMerge', () => {
  bench('cached (repeated input → hit)', () => {
    cachedRoot(rootScenarioInputs.complexWithClassName);
  });

  bench('uncached (merge every call)', () => {
    uncachedRoot(rootScenarioInputs.complexWithClassName);
  });
});

describe('root resolve with bounded rotating className', () => {
  bench('cached (bounded rotation)', () => {
    cachedRoot(nextRotatingInput());
  });

  bench('uncached', () => {
    uncachedRoot(nextRotatingInput());
  });
});

describe('slot resolve with twMerge (4 slots)', () => {
  bench('cached (repeated input → hit)', () => {
    const slots = cachedSlots(slotScenarioInputs.complex);
    slots.root();
    slots.label();
    slots.icon();
    slots.badge();
  });

  bench('uncached (merge per slot)', () => {
    const slots = uncachedSlots(slotScenarioInputs.complex);
    slots.root();
    slots.label();
    slots.icon();
    slots.badge();
  });
});
