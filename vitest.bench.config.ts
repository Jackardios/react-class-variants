import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import builtConfig from './vitest.built.config.ts';

// Benchmarks run against dist/, loaded by Node as native ESM like the
// competitor packages in node_modules. Through Vite's module runner every
// cross-module call in src/ goes through an export getter, which skews
// microbenchmarks. Run `pnpm build` first; the built config fails on any
// src/ import.
export function createBenchConfig(dir: string) {
  return mergeConfig(
    builtConfig,
    defineConfig({
      resolve: {
        alias: [
          {
            find: /^(\.\.\/)+src$/,
            replacement: fileURLToPath(
              new URL('./dist/index.js', import.meta.url)
            ),
          },
        ],
      },
      test: {
        server: { deps: { external: [/\/dist\//, /\/bench\/fixtures\//] } },
        benchmark: {
          include: [`${dir}/*.bench.ts`, `${dir}/*.bench.tsx`],
        },
      },
    })
  );
}

export default createBenchConfig('bench/vitest');
