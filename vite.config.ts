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
      // Statements are measured through the AST remapping Vitest adopted in
      // v4, which counts about 2.5 points lower than Vitest 3 did on the same
      // tests.
      thresholds: {
        statements: 98,
        branches: 95,
        functions: 100,
        lines: 99,
      },
    },
  },
});
