export function buildSourcePrelude({
  coreImport,
  includeMergeProps = true,
  includeRecipeTypeImports = true,
  includeStyled = true,
  reactImport,
  surface,
}) {
  const coreImports = new Set();
  const reactImports = new Set();
  const setupLines = [];

  const registerAccess = (access, localName) => {
    const imports = access.module === 'react' ? reactImports : coreImports;
    const sourceName = access.exportName;
    imports.add(
      access.kind === 'direct' && access.exportName !== localName
        ? `${sourceName} as ${localName}`
        : sourceName
    );

    if (access.kind === 'factory') {
      setupLines.push(
        `const { ${access.property}: ${localName} } = ${access.exportName}();`
      );
    }
  };

  registerAccess(surface.recipeAccess, 'recipe');
  if (includeStyled) {
    registerAccess(surface.styledAccess, 'styled');
  }
  if (includeMergeProps && surface.mergePropsAccess) {
    const imports =
      surface.mergePropsAccess.module === 'react' ? reactImports : coreImports;
    imports.add('mergeProps');
  }

  const importLines = [];
  const recipeTypeImports = includeRecipeTypeImports
    ? ', type RecipeConfigOf, type RecipeInput, type RecipeResolved'
    : '';
  if (coreImports.size > 0) {
    importLines.push(
      `import { ${[...coreImports].join(
        ', '
      )}${recipeTypeImports} } from ${JSON.stringify(coreImport)};`
    );
  }
  if (reactImports.size > 0) {
    importLines.push(
      `import { ${[...reactImports].join(', ')} } from ${JSON.stringify(
        reactImport
      )};`
    );
  }

  return {
    importLines,
    setupLines,
  };
}

export function createMinimalRootOnlyTypeSource({
  coreImport,
  reactImport,
  surface,
}) {
  const { importLines, setupLines } = buildSourcePrelude({
    coreImport,
    includeMergeProps: false,
    includeRecipeTypeImports: false,
    includeStyled: false,
    reactImport,
    surface,
  });

  return [
    ...importLines,
    ...setupLines,
    `
const button = recipe({
  base: 'inline-flex items-center rounded-md',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-slate-200 text-slate-950',
    },
  },
  defaultVariants: {
    tone: 'primary',
  },
});

const className = button({ tone: 'secondary' });
const resolved = button.resolve({
  className: 'rounded-md',
  tone: 'primary',
});

void className;
void resolved.resolvedProps.className;
`,
  ].join('\n');
}

export function createRootOnlyTypeSource({ coreImport, reactImport, surface }) {
  const { importLines, setupLines } = buildSourcePrelude({
    coreImport,
    includeMergeProps: false,
    includeStyled: false,
    reactImport,
    surface,
  });
  const blocks = [];

  for (let index = 0; index < 80; index += 1) {
    blocks.push(`
const recipe${index} = recipe({
  base: 'inline-flex items-center rounded-md',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-slate-200 text-slate-950',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
    },
  },
  defaultVariants: {
    tone: 'primary',
    size: 'md',
  },
});

type Config${index} = RecipeConfigOf<typeof recipe${index}>;
type Input${index} = RecipeInput<typeof recipe${index}>;
type Resolved${index} = RecipeResolved<typeof recipe${index}>;

const input${index}: Input${index} = {
  tone: ${index % 2 === 0 ? "'primary'" : "'secondary'"},
  size: 'md',
};

const resolved${index}: Resolved${index} = recipe${index}.resolve(input${index});
const className${index} = recipe${index}(input${index});
void className${index};
void resolved${index};
`);
  }

  return [...importLines, ...setupLines, ...blocks].join('\n');
}

export function createMinimalReactSurfaceTypeSource({
  coreImport,
  reactImport,
  surface,
}) {
  const { importLines, setupLines } = buildSourcePrelude({
    coreImport,
    includeRecipeTypeImports: false,
    reactImport,
    surface,
  });

  return [
    "import type { ReactNode } from 'react';",
    ...importLines,
    ...setupLines,
    `
const buttonRecipe = recipe({
  base: 'inline-flex items-center rounded-md',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-slate-200 text-slate-950',
    },
  },
  defaultVariants: {
    tone: 'primary',
  },
});

const Button = styled('button', buttonRecipe, { withRender: true });
const node = Button({
  children: 'Save',
  render: props => null,
  tone: 'secondary',
});
const merged = mergeProps(
  { className: buttonRecipe() },
  { className: buttonRecipe({ tone: 'primary' }) }
);
const outputs: ReactNode[] = [node];

void merged;
outputs.length;
`,
  ].join('\n');
}

export function createReactSurfaceTypeSource({
  coreImport,
  reactImport,
  surface,
}) {
  const { importLines, setupLines } = buildSourcePrelude({
    coreImport,
    reactImport,
    surface,
  });
  const blocks = [];

  for (let index = 0; index < 60; index += 1) {
    blocks.push(`
const recipe${index} = recipe({
  base: 'inline-flex items-center rounded-md',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-slate-200 text-slate-950',
    },
  },
});

type Config${index} = RecipeConfigOf<typeof recipe${index}>;
type Input${index} = RecipeInput<typeof recipe${index}>;
type Resolved${index} = RecipeResolved<typeof recipe${index}>;

const input${index}: Input${index} = {
  tone: ${index % 2 === 0 ? "'primary'" : "'secondary'"},
};

const resolved${index}: Resolved${index} = recipe${index}.resolve(input${index});
const Button${index} = styled('button', recipe${index}, { withRender: true });
const node${index} = Button${index}({
  children: resolved${index}.resolvedProps.className,
  render: props => null,
  tone: input${index}.tone,
});
const merge${index} = mergeProps(
  { className: resolved${index}.resolvedProps.className },
  { className: recipe${index}({ tone: 'primary' }) }
);
void node${index};
void merge${index};
`);
  }

  return [
    "import type { ReactNode } from 'react';",
    ...importLines,
    ...setupLines,
    'const outputs: ReactNode[] = [];',
    ...blocks,
    'outputs.length;',
  ].join('\n');
}

export function createMinimalSlottedTypeSource({
  coreImport,
  reactImport,
  surface,
}) {
  const { importLines, setupLines } = buildSourcePrelude({
    coreImport,
    includeMergeProps: false,
    includeRecipeTypeImports: false,
    includeStyled: false,
    reactImport,
    surface,
  });

  return [
    ...importLines,
    ...setupLines,
    `
const recipeWithSlots = recipe({
  slots: {
    root: 'inline-flex items-center gap-2',
    label: 'transition-opacity',
    spinner: 'hidden size-4',
  },
  variants: {
    tone: {
      primary: {
        root: 'bg-blue text-white',
        spinner: 'text-blue-100',
      },
      ghost: {
        root: 'bg-transparent text-slate-900',
        spinner: 'text-slate-500',
      },
    },
    loading: {
      true: {
        label: 'opacity-0',
        spinner: 'inline-block animate-spin',
      },
      false: {
        label: '',
        spinner: '',
      },
    },
  },
  defaultVariants: {
    tone: 'primary',
    loading: false,
  },
});

const slots = recipeWithSlots({ loading: true, tone: 'ghost' });
const resolved = recipeWithSlots.resolve({
  className: 'rounded-md',
  loading: false,
  tone: 'primary',
});
const root = slots.root({ className: 'shadow-sm' });
const label = resolved.slots.label();

void root;
void label;
`,
  ].join('\n');
}

export function createSlottedTypeSource({ coreImport, reactImport, surface }) {
  const { importLines, setupLines } = buildSourcePrelude({
    coreImport,
    includeMergeProps: false,
    includeStyled: false,
    reactImport,
    surface,
  });
  const blocks = [];

  for (let index = 0; index < 60; index += 1) {
    blocks.push(`
const recipe${index} = recipe({
  slots: {
    root: 'inline-flex items-center gap-2',
    label: 'transition-opacity',
    spinner: 'hidden size-4',
  },
  variants: {
    tone: {
      primary: {
        root: 'bg-blue text-white',
        spinner: 'text-blue-100',
      },
      ghost: {
        root: 'bg-transparent text-slate-900',
        spinner: 'text-slate-500',
      },
    },
    loading: {
      true: {
        label: 'opacity-0',
        spinner: 'inline-block animate-spin',
      },
      false: {
        label: '',
        spinner: '',
      },
    },
  },
  defaultVariants: {
    tone: 'primary',
    loading: false,
  },
});

type Config${index} = RecipeConfigOf<typeof recipe${index}>;
type Input${index} = RecipeInput<typeof recipe${index}>;
type Resolved${index} = RecipeResolved<typeof recipe${index}>;

const input${index}: Input${index} = {
  loading: ${index % 2 === 0 ? 'true' : 'false'},
  tone: ${index % 2 === 0 ? "'primary'" : "'ghost'"},
};

const slots${index} = recipe${index}(input${index});
const resolved${index}: Resolved${index} = recipe${index}.resolve({
  ...input${index},
  className: 'rounded-md',
});
const root${index} = slots${index}.root({ className: 'shadow-sm' });
const label${index} = slots${index}.label();
const spinner${index} = resolved${index}.slots.spinner();
void root${index};
void label${index};
void spinner${index};
`);
  }

  return [...importLines, ...setupLines, ...blocks].join('\n');
}

export function parseExtendedDiagnostics(output) {
  const metrics = {
    checkTimeMs: null,
    instantiations: null,
    memoryUsedKb: null,
    symbols: null,
    totalTimeMs: null,
    types: null,
  };

  const patterns = {
    checkTimeMs: /Check time:\s+([\d.]+)s/,
    instantiations: /Instantiations:\s+([\d,]+)/,
    memoryUsedKb: /Memory used:\s+([\d,]+)K/,
    symbols: /Symbols:\s+([\d,]+)/,
    totalTimeMs: /Total time:\s+([\d.]+)s/,
    types: /Types:\s+([\d,]+)/,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = output.match(pattern);
    if (!match) {
      continue;
    }

    const numeric = Number(match[1].replace(/,/g, ''));
    metrics[key] = key.endsWith('Ms') ? numeric * 1000 : numeric;
  }

  return metrics;
}
