import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');

const bundlerCompilerOptions = {
  strict: true,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  skipLibCheck: true,
  esModuleInterop: true,
  types: ['react'],
};

const nodeNextCompilerOptions = {
  ...bundlerCompilerOptions,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
};

const exactProbeFile = resolve(repoRoot, '__editor_probe_exact__.tsx');
const exactProbeSource = `
import { defineConfig, recipe, type VariantProps } from 'react-class-variants';
import { recipe as coreRecipe } from 'react-class-variants/core';

const { styled } = defineConfig();

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
const slotFnsWithOverrides = buttonRecipe({
  slotClassNames: {
    icon: 'text-red-500',
    label: 'uppercase',
  },
});
const resolvedButtonWithOverrides = buttonRecipe.resolve({
  slotClassNames: {
    icon: 'text-pink-500',
    label: 'lowercase',
  },
  id: 'save',
});
const coreOnlyBadge = coreRecipe({
  base: 'inline-flex rounded-full',
});
coreOnlyBadge();

const inputRecipe = recipe({
  variants: {
    tone: {
      info: 'text-sky-700',
      danger: 'text-rose-700',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  defaultVariants: {
    size: 'sm',
    disabled: false,
  },
});

const resolvedInput = inputRecipe.resolve(
  {
    tone: 'danger',
    htmlSize: 12,
    id: 'field',
  },
  {
    forwardProps: ['disabled'],
    propAliases: {
      size: 'htmlSize',
    },
  }
);
resolvedInput.resolvedProps.size;
resolvedInput.resolvedProps.disabled;
resolvedInput.resolvedProps.className;

type InputVariants = VariantProps<typeof inputRecipe>;
const inputVariants: InputVariants = {
  tone: 'info',
};
inputVariants.tone;

const ViewedInput = styled(
  'input',
  inputRecipe,
  {
    withRender: true,
    forwardProps: ['disabled'],
    propAliases: {
      size: 'htmlSize',
    },
    view: ({ host }) => {
      host.props.type;
      host.props.size;
      host.props.disabled;
      return host.render();
    },
  }
);

const SlottedButton = styled('button', buttonRecipe, {
  withRender: true,
  forwardProps: ['loading'],
  view: ({ host, classes, variants }) => {
    variants.tone;
    classes.icon({ tone: 'ghost' });
    resolvedButton.slots.icon();
    slotFns.icon();
    return host.render({ children: <span className={classes.icon()} /> });
  },
});

badge({ tone: 'info' });
ViewedInput({
  tone: 'danger',
  htmlSize: 12,
  disabled: true,
  type: 'number',
  render: props => {
    props.className;
    props.disabled;
    return <a {...props} href="/" />;
  },
});
SlottedButton({ tone: 'primary', render: <a href="/" /> });
SlottedButton({
  tone: 'primary',
  slotClassNames: {
    icon: 'animate-pulse',
    label: 'italic',
  },
  render: <a href="/" />,
});
`;

const completionProbeFile = resolve(
  repoRoot,
  '__editor_probe_completion__.tsx'
);
const completionProbeSource = `
import { defineConfig, defineRecipeConfig, recipe } from 'react-class-variants';

const { styled } = defineConfig();

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

const storedBadgeKeyConfig = defineRecipeConfig({
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
    /*defaultVariants keys*/
  },
});

const storedBadgeValueConfig = defineRecipeConfig({
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
    tone: /*defaultVariants tone*/
  },
});

styled('button', buttonRecipe, {
  withRender: true,
  forwardProps: ['loading'],
  view: ({ classes, variants }) => {
    classes.
    variants.
    return null;
  },
});

badge({ tone:  });
buttonRecipe({ tone:  }).icon({ tone:  });
storedBadgeKeyConfig;
storedBadgeValueConfig;
`;

function createLanguageService(fileEntries, options = bundlerCompilerOptions) {
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
    getCompilationSettings: () => options,
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
        const result = ts.resolveModuleName(name, containingFile, options, {
          fileExists: fileName =>
            files.has(fileName) || ts.sys.fileExists(fileName),
          readFile: fileName =>
            files.has(fileName)
              ? files.get(fileName)
              : ts.sys.readFile(fileName),
          realpath: ts.sys.realpath,
          directoryExists: ts.sys.directoryExists,
          getDirectories: ts.sys.getDirectories,
        });

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
    start: definition.textSpan.start,
    text: (definition.fileName === exactProbeFile
      ? exactProbeSource
      : definition.fileName === completionProbeFile
      ? completionProbeSource
      : ts.sys.readFile(definition.fileName) ?? ''
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
const nodeNextExactLanguageService = createLanguageService(
  new Map([[exactProbeFile, exactProbeSource]]),
  nodeNextCompilerOptions
);
const exactDiagnostics = flattenDiagnostics([
  ...exactLanguageService.getCompilerOptionsDiagnostics(),
  ...exactLanguageService.getSyntacticDiagnostics(exactProbeFile),
  ...exactLanguageService.getSemanticDiagnostics(exactProbeFile),
]);
const nodeNextExactDiagnostics = flattenDiagnostics([
  ...nodeNextExactLanguageService.getCompilerOptionsDiagnostics(),
  ...nodeNextExactLanguageService.getSyntacticDiagnostics(exactProbeFile),
  ...nodeNextExactLanguageService.getSemanticDiagnostics(exactProbeFile),
]);

assert.deepEqual(
  exactDiagnostics,
  [],
  'Editor exact probe should type-check cleanly.'
);
assert.deepEqual(
  nodeNextExactDiagnostics,
  [],
  'Editor exact probe should type-check cleanly in NodeNext mode.'
);

const completionLanguageService = createLanguageService(
  new Map([[completionProbeFile, completionProbeSource]])
);

const viewTypeQuickInfo = quickInfoText(
  exactLanguageService,
  exactProbeFile,
  exactProbeSource,
  'host.props.type;\n      host.props.size;',
  'type'
);
const viewSizeQuickInfo = quickInfoText(
  exactLanguageService,
  exactProbeFile,
  exactProbeSource,
  'host.props.size;\n      host.props.disabled;',
  'size'
);
const viewDisabledQuickInfo = quickInfoText(
  exactLanguageService,
  exactProbeFile,
  exactProbeSource,
  'host.props.disabled;\n      return host.render',
  'disabled'
);
const renderDisabledQuickInfo = quickInfoText(
  exactLanguageService,
  exactProbeFile,
  exactProbeSource,
  'props.disabled;\n    return <a {...props} href="/" />;',
  'disabled'
);
const resolvedInputSizeQuickInfo = quickInfoText(
  exactLanguageService,
  exactProbeFile,
  exactProbeSource,
  'resolvedInput.resolvedProps.size;\nresolvedInput.resolvedProps.disabled;',
  'size'
);
const resolvedInputDisabledQuickInfo = quickInfoText(
  exactLanguageService,
  exactProbeFile,
  exactProbeSource,
  'resolvedInput.resolvedProps.disabled;\nresolvedInput.resolvedProps.className;',
  'disabled'
);
const resolvedInputClassNameQuickInfo = quickInfoText(
  exactLanguageService,
  exactProbeFile,
  exactProbeSource,
  'resolvedInput.resolvedProps.className;\n\ntype InputVariants',
  'className'
);
const defineConfigImportDefinitions = definitionSpans(
  exactLanguageService,
  exactProbeFile,
  exactProbeSource,
  "import { defineConfig, recipe, type VariantProps } from 'react-class-variants';",
  'defineConfig'
);
const recipeImportDefinitions = definitionSpans(
  exactLanguageService,
  exactProbeFile,
  exactProbeSource,
  "import { defineConfig, recipe, type VariantProps } from 'react-class-variants';",
  'recipe'
);
const variantPropsImportDefinitions = definitionSpans(
  exactLanguageService,
  exactProbeFile,
  exactProbeSource,
  "import { defineConfig, recipe, type VariantProps } from 'react-class-variants';",
  'VariantProps'
);
const coreRecipeImportDefinitions = definitionSpans(
  exactLanguageService,
  exactProbeFile,
  exactProbeSource,
  "import { recipe as coreRecipe } from 'react-class-variants/core';",
  'coreRecipe'
);
const nodeNextDefineConfigImportDefinitions = definitionSpans(
  nodeNextExactLanguageService,
  exactProbeFile,
  exactProbeSource,
  "import { defineConfig, recipe, type VariantProps } from 'react-class-variants';",
  'defineConfig'
);
const nodeNextCoreRecipeImportDefinitions = definitionSpans(
  nodeNextExactLanguageService,
  exactProbeFile,
  exactProbeSource,
  "import { recipe as coreRecipe } from 'react-class-variants/core';",
  'coreRecipe'
);

assert.match(
  viewTypeQuickInfo,
  /HTMLInputTypeAttribute/,
  'view host.props.type should keep the intrinsic input type union.'
);
assert.equal(
  viewSizeQuickInfo,
  '(property) size?: number | undefined',
  'view host.props.size should resolve to the native input size prop.'
);
assert.equal(
  viewDisabledQuickInfo,
  '(property) disabled: boolean',
  'view host.props.disabled should reflect the forwarded resolved variant.'
);
assert.equal(
  renderDisabledQuickInfo,
  '(property) disabled: boolean',
  'render callback props should expose forwarded resolved variant props through a broad spread-safe bag.'
);
assert.equal(
  resolvedInputSizeQuickInfo,
  '(property) size: number',
  'recipe.resolve should apply propAliases to resolvedProps.'
);
assert.equal(
  resolvedInputDisabledQuickInfo,
  '(property) disabled: boolean',
  'recipe.resolve should expose forwarded variants as resolved values.'
);
assert.equal(
  resolvedInputClassNameQuickInfo,
  '(property) className: string',
  'root recipe.resolve should always include a string className on resolvedProps.'
);
assert.equal(
  defineConfigImportDefinitions.length,
  1,
  'defineConfig should resolve to a single exported definition target.'
);
assert.match(
  defineConfigImportDefinitions[0].fileName.replace(/\\/g, '/'),
  /\/dist\/index\.d\.ts$/,
  'defineConfig should navigate to the root declaration surface.'
);
assert.equal(
  defineConfigImportDefinitions[0].text,
  'defineConfig',
  'defineConfig should point to the root declaration export.'
);
assert.equal(
  recipeImportDefinitions.length,
  1,
  'recipe should resolve to a single exported definition target.'
);
assert.match(
  recipeImportDefinitions[0].fileName.replace(/\\/g, '/'),
  /\/dist\/index\.d\.ts$/,
  'recipe should navigate to the root declaration surface.'
);
assert.equal(
  recipeImportDefinitions[0].text,
  'recipe',
  'recipe should point to the root declaration export instead of a hashed shared chunk.'
);
assert.equal(
  variantPropsImportDefinitions.length,
  1,
  'VariantProps should resolve to a single exported definition target.'
);
assert.match(
  variantPropsImportDefinitions[0].fileName.replace(/\\/g, '/'),
  /\/dist\/index\.d\.ts$/,
  'VariantProps should navigate to the root declaration surface.'
);
assert.equal(
  variantPropsImportDefinitions[0].text,
  'VariantProps',
  'VariantProps should point to the root declaration export instead of a hashed shared chunk.'
);
assert.equal(
  coreRecipeImportDefinitions.length,
  1,
  'core recipe should resolve to a single subpath definition target.'
);
assert.match(
  coreRecipeImportDefinitions[0].fileName.replace(/\\/g, '/'),
  /\/dist\/core\.d\.ts$/,
  'core recipe should navigate to the core declaration surface.'
);
assert.equal(
  coreRecipeImportDefinitions[0].text,
  'recipe',
  'core recipe should point to the subpath declaration export.'
);
assert.equal(
  nodeNextDefineConfigImportDefinitions.length,
  1,
  'defineConfig should resolve to a single exported definition target in NodeNext mode.'
);
assert.match(
  nodeNextDefineConfigImportDefinitions[0].fileName.replace(/\\/g, '/'),
  /\/dist\/index\.d\.ts$/,
  'defineConfig should navigate to the root declaration surface in NodeNext mode.'
);
assert.equal(
  nodeNextCoreRecipeImportDefinitions.length,
  1,
  'core recipe should resolve to a single subpath definition target in NodeNext mode.'
);
assert.match(
  nodeNextCoreRecipeImportDefinitions[0].fileName.replace(/\\/g, '/'),
  /\/dist\/core\.d\.ts$/,
  'core recipe should navigate to the core declaration surface in NodeNext mode.'
);

const slotIconDefinitionStart = position(
  exactProbeSource,
  "icon: 'size-4'",
  'icon'
);
const slotLabelDefinitionStart = position(
  exactProbeSource,
  "label: 'truncate'",
  'label'
);

for (const [label, snippet, token, expectedText] of [
  ['styled variant prop', `ViewedInput({\n  tone: 'danger'`, 'tone', 'tone'],
  ['view variant', 'variants.tone', 'tone', 'tone'],
  ['view slot', 'classes.icon', 'icon', 'icon'],
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

for (const [label, snippet, token, expectedStart] of [
  [
    'direct slotClassNames icon',
    "icon: 'text-red-500'",
    'icon',
    slotIconDefinitionStart,
  ],
  [
    'direct slotClassNames label',
    "label: 'uppercase'",
    'label',
    slotLabelDefinitionStart,
  ],
  [
    'resolve slotClassNames icon',
    "icon: 'text-pink-500'",
    'icon',
    slotIconDefinitionStart,
  ],
  [
    'styled slotClassNames icon',
    "icon: 'animate-pulse'",
    'icon',
    slotIconDefinitionStart,
  ],
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
      span => span.fileName === exactProbeFile && span.start === expectedStart
    ),
    `${label} should resolve to the original slot declaration.`
  );
}

for (const [label, snippet, expected] of [
  ['root variant values', 'badge({ tone: ', [`'danger'`, `'info'`]],
  ['slot variant values', 'buttonRecipe({ tone: ', [`'ghost'`, `'primary'`]],
  ['slot override values', `.icon({ tone: `, [`'ghost'`, `'primary'`]],
  ['defaultVariants keys', '/*defaultVariants keys*/', ['disabled', 'tone']],
  [
    'defaultVariants values',
    'tone: /*defaultVariants tone*/',
    [`'danger'`, `'info'`],
  ],
  ['forwardProps values', `forwardProps: ['`, ['loading']],
  ['view slot keys', 'classes.', ['icon', 'label', 'root']],
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
      'classes.'
    ),
  () =>
    definitionSpans(
      exactLanguageService,
      exactProbeFile,
      exactProbeSource,
      'classes.icon',
      'icon'
    ),
  () =>
    definitionSpans(
      exactLanguageService,
      exactProbeFile,
      exactProbeSource,
      "icon: 'animate-pulse'",
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
