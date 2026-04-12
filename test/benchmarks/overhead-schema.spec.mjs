// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  bundleProfileNames,
  createOverheadSnapshot,
  normalizeOverheadReport,
  typescriptProfileNames,
} from '../../bench/overhead/schema.mjs';

describe('overhead report schema', () => {
  it('normalizes bundle and TypeScript profiles to stable keys', () => {
    const normalized = normalizeOverheadReport({
      bundles: {
        component: { gzipBytes: 321 },
        recipeOnly: { gzipBytes: 123 },
      },
      dist: {
        indexMjs: { rawBytes: 100 },
      },
      typescript: {
        profiles: {
          bundlerRootOnlyMinimal: { totalTimeMs: 5 },
          bundlerRootOnly: { totalTimeMs: 10 },
          bundlerReactSurfaceMinimal: { totalTimeMs: 15 },
          bundlerSlottedRecipeMinimal: { totalTimeMs: 18 },
          nodeNextReactSurface: { totalTimeMs: 20 },
        },
      },
    });

    expect(Object.keys(normalized.bundles)).toEqual(bundleProfileNames);
    expect(normalized.bundles.component).toEqual({ gzipBytes: 321 });
    expect(normalized.bundles.componentWithRender).toBeNull();
    expect(normalized.bundles.slottedRecipe).toBeNull();
    expect(normalized.typescript.profiles.bundlerRootOnlyMinimal).toEqual({
      totalTimeMs: 5,
    });
    expect(normalized.typescript.profiles.bundlerRootOnly).toEqual({
      totalTimeMs: 10,
    });
    expect(normalized.typescript.profiles.bundlerReactSurfaceMinimal).toEqual({
      totalTimeMs: 15,
    });
    expect(normalized.typescript.profiles.bundlerSlottedRecipeMinimal).toEqual({
      totalTimeMs: 18,
    });
    expect(normalized.typescript.profiles.nodeNextReactSurface).toEqual({
      totalTimeMs: 20,
    });
    expect(Object.keys(normalized.typescript.profiles)).toEqual(
      typescriptProfileNames
    );
    expect(normalized.typescript.profiles.bundlerReactSurface).toBeNull();
    expect(
      normalized.typescript.profiles.nodeNextReactSurfaceMinimal
    ).toBeNull();
  });

  it('creates snapshots with a normalized report payload', () => {
    const snapshot = createOverheadSnapshot({
      generatedAt: '2026-04-11T12:00:00.000Z',
      report: {
        bundles: {
          recipeOnly: { gzipBytes: 123 },
        },
        dist: {
          indexMjs: { rawBytes: 100 },
        },
        typescript: null,
      },
    });

    expect(snapshot.generatedAt).toBe('2026-04-11T12:00:00.000Z');
    expect(snapshot.report.bundles.recipeOnly).toEqual({ gzipBytes: 123 });
    expect(snapshot.report.bundles.tailwindAwareRecipe).toBeNull();
    expect(snapshot.report.typescript).toBeNull();
  });
});
