import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vite.config';

const srcDir = fileURLToPath(new URL('./src/', import.meta.url));
const distEntry = (file: string) =>
  fileURLToPath(new URL(`./dist/${file}`, import.meta.url));

// Runs the runtime specs against the built package: public-entry imports are
// redirected to dist/, and loading any source module fails the run so the
// suite cannot silently fall back to testing src/.
export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      {
        name: 'forbid-src-modules',
        load(id) {
          if (id.startsWith(srcDir)) {
            throw new Error(`Built tests must not load source module ${id}`);
          }
        },
      },
    ],
    resolve: {
      alias: [
        { find: /^\.\.\/src\/core$/, replacement: distEntry('core.js') },
        { find: /^\.\.\/src$/, replacement: distEntry('index.js') },
      ],
    },
    test: {
      include: ['test/*.spec.{ts,tsx}'],
    },
  })
);
