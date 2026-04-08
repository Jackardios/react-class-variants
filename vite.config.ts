/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    benchmark: {
      include: ['bench/**/*.bench.ts', 'bench/**/*.bench.tsx'],
    },
  },
});
