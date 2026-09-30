// Type-checking cost gate. Compiles one in-memory probe per public construct
// against the built declarations and compares TypeScript's instantiation count
// with the committed budget in test/types/type-cost-budget.json. The count is
// deterministic for a TypeScript version, unlike check time, and it tracks
// check time closely: a type change that made every styled() call compare the
// recipe's whole signature went unnoticed until it was measured by hand.
//
// Usage:
//   node scripts/check-type-cost.mjs           # fail above budget + 10%
//   node scripts/check-type-cost.mjs --update  # rewrite the budget
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const budgetFile = resolve(repoRoot, 'test/types/type-cost-budget.json');
const allowedGrowth = 0.1;
const copies = 20;

const compilerOptions = {
  strict: true,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  skipLibCheck: true,
  noEmit: true,
  types: ['react'],
};

const rootConfig = index => `{
  base: 'inline-flex ${index}',
  variants: {
    tone: { primary: 'bg-blue-600', secondary: 'bg-slate-200', ghost: 'bg-transparent' },
    size: { sm: 'h-8 px-3', md: 'h-10 px-4', lg: 'h-12 px-6' },
    disabled: { true: 'opacity-50', false: '' },
  },
  compoundVariants: [{ tone: 'ghost', disabled: true, className: 'ring-1' }],
  defaultVariants: { size: 'md', disabled: false },
}`;

const slotConfig = index => `{
  slots: { root: 'rounded ${index}', header: 'p-4', body: 'p-4' },
  variants: {
    elevated: { true: { root: 'shadow' } },
    size: { sm: { header: 'p-2' }, md: { header: 'p-4' } },
  },
  defaultVariants: { size: 'md' },
}`;

// Each scenario repeats one construct, so a regression points at it.
const scenarios = {
  recipe: index =>
    `export const root${index} = recipe(${rootConfig(index)});
export const slot${index} = recipe(${slotConfig(index)});
export const className${index} = root${index}({ tone: 'primary' });`,
  resolve: index =>
    `const root${index} = recipe(${rootConfig(index)});
export const resolved${index} = root${index}.resolve(
  { tone: 'secondary', id: 'a' },
  { forwardProps: ['disabled'] }
);`,
  styled: index =>
    `export const Plain${index} = styled('button', recipe(${rootConfig(index)}));
export const WithOptions${index} = styled('button', recipe(${rootConfig(index)}), {
  withRender: true,
  forwardProps: ['disabled'],
});`,
  view: index =>
    `export const Root${index} = styled('button', recipe(${rootConfig(index)}), {
  view: ({ host, variants }) => host.render({ 'data-tone': variants.tone }),
});
export const Slot${index} = styled('section', recipe(${slotConfig(index)}), {
  view: ({ host, classes }) =>
    host.render({ children: [classes.header(), classes.body()] }),
});`,
  jsx: index =>
    `const Button${index} = styled('button', recipe(${rootConfig(index)}));
export const element${index} = (
  <Button${index} tone="ghost" disabled type="button" onClick={() => {}} />
);`,
};

function probeSource(scenario) {
  let source = `import { defineConfig } from 'react-class-variants';

const { recipe, styled } = defineConfig();
void styled;
`;
  for (let index = 0; index < copies; index += 1) {
    source += `\n${scenario(index)}\n`;
  }
  return source;
}

// The probe lives in memory at the repository root, so `react-class-variants`
// resolves to the built package through the package's self-reference.
function measure(source) {
  const probeFile = resolve(repoRoot, '__type_cost_probe__.tsx');
  const host = ts.createCompilerHost(compilerOptions);
  const getSourceFile = host.getSourceFile;
  host.getSourceFile = (fileName, languageVersion, ...rest) =>
    fileName === probeFile
      ? ts.createSourceFile(fileName, source, languageVersion, true)
      : getSourceFile.call(host, fileName, languageVersion, ...rest);
  const fileExists = host.fileExists;
  host.fileExists = fileName =>
    fileName === probeFile || fileExists.call(host, fileName);
  const program = ts.createProgram([probeFile], compilerOptions, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);

  if (diagnostics.length > 0) {
    throw new Error(
      ts.formatDiagnostics(diagnostics, {
        getCanonicalFileName: fileName => fileName,
        getCurrentDirectory: () => repoRoot,
        getNewLine: () => '\n',
      })
    );
  }

  return program.getInstantiationCount();
}

const counts = Object.fromEntries(
  Object.entries(scenarios).map(([name, scenario]) => [
    name,
    measure(probeSource(scenario)),
  ])
);

if (process.argv.includes('--update')) {
  writeFileSync(
    budgetFile,
    `${JSON.stringify({ typescript: ts.version, instantiations: counts }, null, 2)}\n`
  );
  console.log(`Wrote type-cost budget for TypeScript ${ts.version}.`);
  console.table(counts);
} else {
  const budget = JSON.parse(readFileSync(budgetFile, 'utf8'));
  const rows = [];
  const failures = [];

  for (const [name, count] of Object.entries(counts)) {
    const baseline = budget.instantiations[name];
    const allowed = Math.round(baseline * (1 + allowedGrowth));
    rows.push({ scenario: name, instantiations: count, baseline, allowed });
    if (count > allowed) {
      failures.push(`${name}: ${count} instantiations, allowed ${allowed}`);
    }
  }

  console.table(rows);

  if (failures.length > 0) {
    console.error(
      `Type-checking cost regressed (TypeScript ${ts.version}, budget from ${budget.typescript}):\n  ${failures.join(
        '\n  '
      )}\nIf the growth is intended, or TypeScript itself changed, run pnpm test:types:cost:update.`
    );
    process.exit(1);
  }

  console.log('Type-checking cost is within budget.');
}
