// Type-checks the documentation examples. Every ts/tsx code block in README.md
// and docs/*.md that imports a value from 'react-class-variants' is a
// standalone example and must compile on its own under `strict`. Other blocks
// are fragments or signatures that continue an earlier example (a fragment may
// still `import type` what it annotates) and are skipped.
// A block whose first line is a file-name comment (`// badge.recipe.ts`) is
// checked under that name, so later blocks of the same document can import it
// (`./badge.recipe`). The package entry points resolve to src/, so no build is
// needed.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const markdownFiles = [
  'README.md',
  ...readdirSync(join(repoRoot, 'docs'))
    .filter(name => name.endsWith('.md'))
    .sort()
    .map(name => `docs/${name}`),
];

const fencePattern = /^```(ts|tsx|typescript)\n([\s\S]*?)^```$/gm;
const packageImportPattern =
  /^import (?!type )[^;]*from 'react-class-variants(?:\/core)?';/m;
const fileNameCommentPattern = /^\/\/ ([\w.-]+\.tsx?)\n/;

// Virtual example files live under the repository root so that `react`,
// `tailwind-merge`, and the other imports resolve from its node_modules.
const examplesRoot = join(repoRoot, '__docs_examples__');
const examples = new Map();

for (const markdownFile of markdownFiles) {
  const markdown = readFileSync(join(repoRoot, markdownFile), 'utf8');

  for (const match of markdown.matchAll(fencePattern)) {
    const [, language, code] = match;
    if (!packageImportPattern.test(code)) continue;

    // The line after the opening fence.
    const line = markdown.slice(0, match.index).split('\n').length + 1;
    const extension = language === 'tsx' ? 'tsx' : 'ts';
    const fileName = join(
      examplesRoot,
      markdownFile.replaceAll('/', '__'),
      fileNameCommentPattern.exec(code)?.[1] ?? `L${line}.${extension}`
    );
    // `export {}` keeps each example a module with its own scope.
    examples.set(fileName, {
      line,
      markdownFile,
      source: `${code}\nexport {};\n`,
    });
  }
}

const compilerOptions = {
  strict: true,
  noEmit: true,
  target: ts.ScriptTarget.ES2022,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  skipLibCheck: true,
  types: [],
  baseUrl: repoRoot,
  paths: {
    'react-class-variants': ['src/index.ts'],
    'react-class-variants/core': ['src/core.ts'],
  },
};

const host = ts.createCompilerHost(compilerOptions);
const { directoryExists, fileExists, getSourceFile, readFile } = host;
const exampleDirectories = new Set(
  [...examples.keys()].map(fileName => dirname(fileName))
);
host.directoryExists = directoryName =>
  exampleDirectories.has(directoryName) ||
  (directoryExists?.(directoryName) ?? true);
host.fileExists = fileName => examples.has(fileName) || fileExists(fileName);
host.readFile = fileName =>
  examples.get(fileName)?.source ?? readFile(fileName);
host.getSourceFile = (fileName, languageVersion, ...rest) => {
  const example = examples.get(fileName);
  return example
    ? ts.createSourceFile(fileName, example.source, languageVersion, true)
    : getSourceFile(fileName, languageVersion, ...rest);
};

const program = ts.createProgram([...examples.keys()], compilerOptions, host);
const diagnostics = ts
  .getPreEmitDiagnostics(program)
  .filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error);

for (const diagnostic of diagnostics) {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  const example = diagnostic.file && examples.get(diagnostic.file.fileName);

  if (!example) {
    const location = diagnostic.file
      ? relative(repoRoot, diagnostic.file.fileName)
      : 'program';
    console.error(`${location}: TS${diagnostic.code}: ${message}`);
    continue;
  }

  const position = diagnostic.file.getLineAndCharacterOfPosition(
    diagnostic.start ?? 0
  );
  console.error(
    `${example.markdownFile}:${example.line + position.line}:${
      position.character + 1
    }: TS${diagnostic.code}: ${message}`
  );
}

if (diagnostics.length > 0) {
  console.error(
    `\n${diagnostics.length} type error(s) in documentation examples.`
  );
  process.exit(1);
}

console.log(`Type-checked ${examples.size} standalone documentation examples.`);
