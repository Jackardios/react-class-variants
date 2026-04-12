/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    benchmark: {
      include: [
        'bench/vitest/diagnostics/*.bench.ts',
        'bench/vitest/diagnostics/*.bench.tsx',
      ],
    },
  },
});
