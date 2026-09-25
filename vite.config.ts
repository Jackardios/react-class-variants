/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    coverage: {
      include: ['src/**'],
      // Type-only modules have no runtime statements to cover.
      exclude: ['src/**/*-types.ts'],
      // Enforced by `pnpm test:coverage` (part of `pnpm run verify`). Raise
      // these when coverage improves; never lower them to land a change.
      thresholds: {
        statements: 97,
        branches: 91,
        functions: 100,
        lines: 97,
      },
    },
    benchmark: {
      include: ['bench/vitest/*.bench.ts', 'bench/vitest/*.bench.tsx'],
    },
  },
});
