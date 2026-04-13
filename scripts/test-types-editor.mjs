import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');

const compilerOptions = {
  strict: true,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  skipLibCheck: true,
  esModuleInterop: true,
  types: ['react'],
};

const exactProbeFile = resolve(repoRoot, '__editor_probe_exact__.tsx');
const exactProbeSource = `
import { recipe, styled } from 'react-class-variants';

const badge = recipe({
  base: 'inline-flex rounded-full',
  variants: {
    tone: {
      info: 'bg-sky-100',
      danger: 'bg-rose-100',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

const buttonRecipe = recipe({
  slots: {
    root: 'inline-flex items-center',
    icon: 'size-4',
    label: 'truncate',
  },
  variants: {
    tone: {
      primary: {
        root: 'bg-blue text-white',
        icon: 'text-blue-100',
      },
      ghost: {
        root: 'bg-transparent text-slate-900',
      },
    },
    loading: {
      true: {
        label: 'opacity-0',
      },
    },
  },
  defaultVariants: {
    tone: 'primary',
    loading: false,
  },
});

const resolvedButton = buttonRecipe.resolve({ tone: 'primary' });
const slotFns = buttonRecipe({ tone: 'primary' });

const ComposedInput = styled(
  'input',
  badge,
  {
    withRender: true,
    forwardProps: ['disabled'],
    nativeAliases: {
      size: 'htmlSize',
    },
    compose: ({ Root }, props) => {
      props.type;
      props.size;
      props.disabled;
      return <Root {...props} />;
    },
  }
);

const SlottedButton = styled('button', buttonRecipe, {
  withRender: true,
  forwardProps: ['loading'],
  compose: ({ Root, slots, variants }, props) => {
    variants.tone;
    slots.icon({ tone: 'ghost' });
    resolvedButton.slots.icon();
    slotFns.icon();
    return <Root {...props} className={slots.root({ className: props.className })} />;
  },
});

badge({ tone: 'info' });
ComposedInput({ tone: 'danger', htmlSize: 12, disabled: true, type: 'number' });
SlottedButton({ tone: 'primary', render: <a href="/" /> });
`;

const completionProbeFile = resolve(
  repoRoot,
  '__editor_probe_completion__.tsx'
);
const completionProbeSource = `
import { recipe, styled } from 'react-class-variants';

const badge = recipe({
  base: 'inline-flex rounded-full',
  variants: {
    tone: {
      info: 'bg-sky-100',
      danger: 'bg-rose-100',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

const buttonRecipe = recipe({
  slots: {
    root: 'inline-flex items-center',
    icon: 'size-4',
    label: 'truncate',
  },
  variants: {
    tone: {
      primary: {
        root: 'bg-blue text-white',
        icon: 'text-blue-100',
      },
      ghost: {
        root: 'bg-transparent text-slate-900',
      },
    },
    loading: {
      true: {
        label: 'opacity-0',
      },
    },
  },
  defaultVariants: {
    tone: 'primary',
    loading: false,
  },
});

styled('button', buttonRecipe, {
  withRender: true,
  forwardProps: ['loading'],
  compose: ({ slots, variants }) => {
    slots.
    variants.
    return null;
  },
});

badge({ tone:  });
buttonRecipe({ tone:  }).icon({ tone:  });
`;

function createLanguageService(fileEntries) {
  const files = new Map(fileEntries);

  const host = {
    getScriptFileNames: () => Array.from(files.keys()),
    getScriptVersion: () => '0',
    getScriptSnapshot(fileName) {
      if (files.has(fileName)) {
        return ts.ScriptSnapshot.fromString(files.get(fileName));
      }

      const text = ts.sys.readFile(fileName);
      return text ? ts.ScriptSnapshot.fromString(text) : undefined;
    },
    getCurrentDirectory: () => repoRoot,
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    fileExists: fileName => files.has(fileName) || ts.sys.fileExists(fileName),
    readFile(fileName) {
      if (files.has(fileName)) return files.get(fileName);
      return ts.sys.readFile(fileName);
    },
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    getNewLine: () => ts.sys.newLine,
    realpath: ts.sys.realpath,
    resolveModuleNames(moduleNames, containingFile) {
      return moduleNames.map(name => {
        const result = ts.resolveModuleName(
          name,
          containingFile,
          compilerOptions,
          {
            fileExists: fileName =>
              files.has(fileName) || ts.sys.fileExists(fileName),
            readFile: fileName =>
              files.has(fileName)
                ? files.get(fileName)
                : ts.sys.readFile(fileName),
            realpath: ts.sys.realpath,
            directoryExists: ts.sys.directoryExists,
            getDirectories: ts.sys.getDirectories,
          }
        );

        return result.resolvedModule;
      });
    },
  };

  return ts.createLanguageService(host, ts.createDocumentRegistry());
}

function flattenDiagnostics(diagnostics) {
  return diagnostics.map(d =>
    ts.flattenDiagnosticMessageText(d.messageText, '\n')
  );
}

function position(source, snippet, token = snippet) {
  const snippetIndex = source.indexOf(snippet);
  assert.notEqual(snippetIndex, -1, `Snippet not found: ${snippet}`);

  const tokenIndex = snippet.indexOf(token);
  assert.notEqual(tokenIndex, -1, `Token not found in snippet: ${token}`);

  return snippetIndex + tokenIndex;
}

function quickInfoText(
  languageService,
  fileName,
  source,
  snippet,
  token = snippet
) {
  const info = languageService.getQuickInfoAtPosition(
    fileName,
    position(source, snippet, token)
  );

  return info ? ts.displayPartsToString(info.displayParts) : '';
}

function completionNames(languageService, fileName, source, snippet) {
  const entries =
    languageService.getCompletionsAtPosition(
      fileName,
      position(source, snippet) + snippet.length,
      {}
    )?.entries ?? [];

  return entries.map(entry => entry.name);
}

function definitionSpans(
  languageService,
  fileName,
  source,
  snippet,
  token = snippet
) {
  const definitions =
    languageService.getDefinitionAtPosition(
      fileName,
      position(source, snippet, token)
    ) ?? [];

  return definitions.map(definition => ({
    fileName: definition.fileName,
    text: (definition.fileName === exactProbeFile
      ? exactProbeSource
      : completionProbeSource
    ).slice(
      definition.textSpan.start,
      definition.textSpan.start + definition.textSpan.length
    ),
  }));
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const exactLanguageService = createLanguageService(
  new Map([[exactProbeFile, exactProbeSource]])
);
const exactDiagnostics = flattenDiagnostics([
  ...exactLanguageService.getCompilerOptionsDiagnostics(),
  ...exactLanguageService.getSyntacticDiagnostics(exactProbeFile),
  ...exactLanguageService.getSemanticDiagnostics(exactProbeFile),
]);

assert.deepEqual(
  exactDiagnostics,
  [],
  'Editor exact probe should type-check cleanly.'
);

const completionLanguageService = createLanguageService(
  new Map([[completionProbeFile, completionProbeSource]])
);

const composeTypeQuickInfo = quickInfoText(
  exactLanguageService,
  exactProbeFile,
  exactProbeSource,
  'props.type;\n      props.size;',
  'type'
);
const composeSizeQuickInfo = quickInfoText(
  exactLanguageService,
  exactProbeFile,
  exactProbeSource,
  'props.size;\n      props.disabled;',
  'size'
);
const composeDisabledQuickInfo = quickInfoText(
  exactLanguageService,
  exactProbeFile,
  exactProbeSource,
  'props.disabled;\n      return <Root',
  'disabled'
);

assert.match(
  composeTypeQuickInfo,
  /HTMLInputTypeAttribute/,
  'compose props.type should keep the intrinsic input type union.'
);
assert.equal(
  composeSizeQuickInfo,
  '(property) size?: number | undefined',
  'compose props.size should resolve to the native input size prop.'
);
assert.equal(
  composeDisabledQuickInfo,
  '(property) disabled: boolean',
  'compose props.disabled should reflect the forwarded resolved variant.'
);

for (const [label, snippet, token, expectedText] of [
  ['styled variant prop', `ComposedInput({ tone: 'danger'`, 'tone', 'tone'],
  ['compose variant', 'variants.tone', 'tone', 'tone'],
  ['compose slot', 'slots.icon', 'icon', 'icon'],
  ['resolved slot', 'resolvedButton.slots.icon', 'icon', 'icon'],
  ['recipe call slot', 'slotFns.icon', 'icon', 'icon'],
]) {
  const spans = definitionSpans(
    exactLanguageService,
    exactProbeFile,
    exactProbeSource,
    snippet,
    token
  );

  assert.ok(
    spans.some(
      span => span.fileName === exactProbeFile && span.text === expectedText
    ),
    `${label} should resolve to the local recipe declaration.`
  );
}

for (const [label, snippet, expected] of [
  ['root variant values', 'badge({ tone: ', [`'danger'`, `'info'`]],
  ['slot variant values', 'buttonRecipe({ tone: ', [`'ghost'`, `'primary'`]],
  ['slot override values', `.icon({ tone: `, [`'ghost'`, `'primary'`]],
  ['forwardProps values', `forwardProps: ['`, ['loading']],
  ['compose slot keys', 'slots.', ['icon', 'label', 'root']],
]) {
  const names = completionNames(
    completionLanguageService,
    completionProbeFile,
    completionProbeSource,
    snippet
  );

  for (const expectedName of expected) {
    assert.ok(
      names.includes(expectedName),
      `${label} should include ${expectedName} in completions.`
    );
  }
}

const timings = [];
const timedQueries = [
  () =>
    completionNames(
      completionLanguageService,
      completionProbeFile,
      completionProbeSource,
      'badge({ tone: '
    ),
  () =>
    completionNames(
      completionLanguageService,
      completionProbeFile,
      completionProbeSource,
      'buttonRecipe({ tone: '
    ),
  () =>
    completionNames(
      completionLanguageService,
      completionProbeFile,
      completionProbeSource,
      'slots.'
    ),
  () =>
    definitionSpans(
      exactLanguageService,
      exactProbeFile,
      exactProbeSource,
      'slots.icon',
      'icon'
    ),
];

for (const query of timedQueries) {
  query();
}

for (let index = 0; index < 20; index += 1) {
  for (const query of timedQueries) {
    const started = performance.now();
    query();
    timings.push(performance.now() - started);
  }
}

console.log(
  `Editor language-service checks passed. Warm avg query time: ${average(
    timings
  ).toFixed(3)}ms`
);
