import { build } from 'esbuild';

export async function bundleWithEsbuild({
  absWorkingDir,
  define,
  entryFile,
  external = [],
  outFile,
  platform = 'browser',
}) {
  try {
    await build({
      absWorkingDir,
      bundle: true,
      define: {
        'import.meta.env.MODE': '"production"',
        'process.env.NODE_ENV': '"production"',
        ...define,
      },
      entryPoints: [entryFile],
      external,
      format: 'esm',
      logLevel: 'silent',
      minify: true,
      outfile: outFile,
      platform,
      target: 'es2018',
      treeShaking: true,
      write: true,
    });
  } catch (error) {
    const details = error.errors
      ?.map(entry => entry.text)
      .filter(Boolean)
      .join('\n');

    throw new Error(
      details
        ? `esbuild failed for ${entryFile}:\n${details}`
        : `esbuild failed for ${entryFile}.`
    );
  }

  return outFile;
}
