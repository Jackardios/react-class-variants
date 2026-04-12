import { describe, expect, it } from 'vitest';
import * as core from '../src/core';
import * as packageRoot from '../src';

describe('public api', () => {
  it('exports the canonical React-oriented surface from the package root', () => {
    expect(typeof packageRoot.recipe).toBe('function');
    expect(typeof packageRoot.styled).toBe('function');
    expect(typeof packageRoot.defineConfig).toBe('function');
    expect(typeof packageRoot.defineRecipeConfig).toBe('function');
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

  it('exposes the dedicated core subpath surface', () => {
    expect(typeof core.recipe).toBe('function');
    expect(typeof core.defineConfig).toBe('function');
    expect(typeof core.defineRecipeConfig).toBe('function');
    expect(typeof core.hasOwnProperty).toBe('function');
    expect('styled' in core).toBe(false);
    expect('mergeProps' in core).toBe(false);
  });
});
