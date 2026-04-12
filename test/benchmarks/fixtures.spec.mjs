// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  complexRootConfig,
  makeComplexRootConfig,
} from '../../bench/fixtures/root.mjs';
import {
  complexSlotConfig,
  makeComplexSlotConfig,
} from '../../bench/fixtures/slots.mjs';

describe('benchmark fixtures', () => {
  it('clones complex root configs for fresh-creation scenarios', () => {
    const copy = makeComplexRootConfig();

    expect(copy).not.toBe(complexRootConfig);
    expect(copy.variants).not.toBe(complexRootConfig.variants);
    expect(copy.variants.tone).not.toBe(complexRootConfig.variants.tone);
    expect(copy.compoundVariants).not.toBe(complexRootConfig.compoundVariants);

    copy.variants.tone.primary = 'changed';
    copy.compoundVariants[0].className = 'changed';

    expect(complexRootConfig.variants.tone.primary).not.toBe('changed');
    expect(complexRootConfig.compoundVariants[0].className).not.toBe('changed');
  });

  it('clones complex slot configs for fresh-creation scenarios', () => {
    const copy = makeComplexSlotConfig();

    expect(copy).not.toBe(complexSlotConfig);
    expect(copy.slots).not.toBe(complexSlotConfig.slots);
    expect(copy.variants).not.toBe(complexSlotConfig.variants);
    expect(copy.variants.tone.primary).not.toBe(
      complexSlotConfig.variants.tone.primary
    );

    copy.variants.tone.primary.label[0] = 'changed';
    copy.variants.emphasis.quiet.badge[0] = 'changed';

    expect(complexSlotConfig.variants.tone.primary.label[0]).not.toBe(
      'changed'
    );
    expect(complexSlotConfig.variants.emphasis.quiet.badge[0]).not.toBe(
      'changed'
    );
  });
});
