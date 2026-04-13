// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const order = [];

vi.mock('../../bench/overhead/bundles.mjs', () => ({
  bundleConsumers: vi.fn(async () => {
    order.push('bundles');
    return {};
  }),
}));

vi.mock('../../bench/overhead/memory.mjs', () => ({
  measureRetainedMemory: vi.fn(async () => {
    order.push('memory');
    return {};
  }),
}));

vi.mock('../../bench/overhead/runtime.mjs', () => ({
  measureRuntime: vi.fn(() => {
    order.push('runtime');
    return {};
  }),
  measureRuntimeForEnv: vi.fn(),
}));

vi.mock('../../bench/overhead/surface.mjs', () => ({
  collectImportGraph: vi.fn(() => ({})),
  detectSurface: vi.fn(async () => {
    order.push('detect');
    return {
      recipeAccess: {
        exportName: 'recipe',
        kind: 'direct',
        module: 'core',
      },
      styledAccess: {
        exportName: 'styled',
        kind: 'direct',
        module: 'react',
      },
    };
  }),
  getEntryLayout: vi.fn(() => {
    order.push('layout');
    return {
      coreRuntime: '/tmp/core.js',
      coreTypes: '/tmp/core.d.ts',
      distDir: '/tmp/dist',
      hasDedicatedCoreEntry: true,
      hasDedicatedReactEntry: false,
      reactRuntime: '/tmp/index.js',
      reactTypes: '/tmp/index.d.ts',
      rootRuntime: '/tmp/index.js',
      rootTypes: '/tmp/index.d.ts',
    };
  }),
}));

vi.mock('../../bench/overhead/target.mjs', () => ({
  buildTarget: vi.fn(() => {
    order.push('build');
  }),
  prepareTarget: vi.fn(),
}));

vi.mock('../../bench/overhead/typescript.mjs', () => ({
  measureTypeScriptProfiles: vi.fn(() => {
    order.push('typescript');
    return {};
  }),
}));

vi.mock('../../bench/shared/file-size.mjs', () => ({
  measureFile: vi.fn(() => ({})),
}));

describe('overhead measure flow', () => {
  beforeEach(() => {
    order.length = 0;
  });

  it('measures retained memory before generic surface detection', async () => {
    const { measureTarget } = await import('../../bench/overhead/measure.mjs');

    await measureTarget(
      {
        dir: '/tmp/workspace',
        kind: 'workspace',
        label: 'workspace',
      },
      {
        sizeOnly: false,
      }
    );

    expect(order).toContain('memory');
    expect(order).toContain('detect');
    expect(order.indexOf('memory')).toBeLessThan(order.indexOf('detect'));
  });
});
