// @vitest-environment node
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectImportGraph } from '../../bench/overhead/surface.mjs';
import { createTempDir, removeTempDir } from '../../bench/shared/fs.mjs';

describe('overhead surface import graph', () => {
  it('detects React subpath runtime imports across relative modules', () => {
    const tempDir = createTempDir('react-class-variants-surface-test-');

    try {
      const entryFile = join(tempDir, 'index.js');
      writeFileSync(
        entryFile,
        "import { jsx } from 'react/jsx-runtime';\nimport './nested.js';\nvoid jsx;\n"
      );
      writeFileSync(
        join(tempDir, 'nested.js'),
        "require('react/jsx-dev-runtime');\n"
      );

      const graph = collectImportGraph(entryFile);

      expect(graph.hasReactRuntime).toBe(true);
      expect(graph.files).toEqual(
        expect.arrayContaining(['index.js', 'nested.js'])
      );
    } finally {
      removeTempDir(tempDir);
    }
  });

  it('does not flag unrelated package imports as React runtime usage', () => {
    const tempDir = createTempDir('react-class-variants-surface-test-');

    try {
      const entryFile = join(tempDir, 'index.js');
      writeFileSync(
        entryFile,
        "import { jsx } from 'preact/jsx-runtime';\nvoid jsx;\n"
      );

      const graph = collectImportGraph(entryFile);

      expect(graph.hasReactRuntime).toBe(false);
      expect(graph.files).toEqual(['index.js']);
    } finally {
      removeTempDir(tempDir);
    }
  });
});
