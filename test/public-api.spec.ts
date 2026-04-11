import { describe, expect, it } from 'vitest';
import * as packageRoot from '../src';

describe('public api', () => {
  it('exports the canonical React-oriented surface from the package root', () => {
    expect(typeof packageRoot.recipe).toBe('function');
    expect(typeof packageRoot.styled).toBe('function');
    expect(typeof packageRoot.defineConfig).toBe('function');
    expect(typeof packageRoot.hasOwnProperty).toBe('function');
    expect(typeof packageRoot.mergeProps).toBe('function');
    expect(typeof packageRoot.mergeRefs).toBe('function');
    expect(typeof packageRoot.useMergeRefs).toBe('function');

    expect('defineReactConfig' in packageRoot).toBe(false);
    expect('createSystem' in packageRoot).toBe(false);
    expect('createRecipe' in packageRoot).toBe(false);
    expect('compose' in packageRoot).toBe(false);
    expect('variantComponent' in packageRoot).toBe(false);
    expect('variantPropsResolver' in packageRoot).toBe(false);
    expect('variants' in packageRoot).toBe(false);
  });
});
