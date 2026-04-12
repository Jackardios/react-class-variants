export function createCompetitorBundleScenarios() {
  const recipeConfig = `{
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
}`;

  const cvaConfig = `{
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
}`;

  return {
    plainRecipe: {
      'class-variance-authority': `import { cva } from 'class-variance-authority';
const button = cva('inline-flex items-center rounded-md', ${cvaConfig});
console.log(button({ tone: 'secondary' }));`,
      'classname-variants': `import { variants } from 'classname-variants';
const button = variants(${recipeConfig});
console.log(button({ tone: 'secondary' }));`,
      'react-class-variants': `import { recipe } from 'react-class-variants';
const button = recipe(${recipeConfig});
console.log(button({ tone: 'secondary' }));`,
      'react-class-variants/core': `import { recipe } from 'react-class-variants/core';
const button = recipe(${recipeConfig});
console.log(button({ tone: 'secondary' }));`,
      'tailwind-variants/lite': `import { tv } from 'tailwind-variants/lite';
const button = tv(${recipeConfig});
console.log(button({ tone: 'secondary' }));`,
    },
    reactStyled: {
      'classname-variants/react': `import { styled } from 'classname-variants/react';
const Button = styled('button', ${recipeConfig});
console.log(Button);`,
      'react-class-variants': `import { recipe, styled } from 'react-class-variants';
const button = recipe(${recipeConfig});
const Button = styled('button', button);
console.log(Button);`,
    },
    tailwindAwareRecipe: {
      'class-variance-authority + twMerge': `import { cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
const button = cva('inline-flex items-center rounded-md', ${cvaConfig});
console.log(twMerge(button({ tone: 'secondary' })));`,
      'classname-variants + twMerge': `import { variants } from 'classname-variants';
import { twMerge } from 'tailwind-merge';
const button = variants(${recipeConfig});
console.log(twMerge(button({ tone: 'secondary' })));`,
      'react-class-variants/core + twMerge': `import { defineConfig } from 'react-class-variants/core';
import { twMerge } from 'tailwind-merge';
const { recipe } = defineConfig({ merge: twMerge });
const button = recipe(${recipeConfig});
console.log(button({ tone: 'secondary' }));`,
      'tailwind-variants': `import { tv } from 'tailwind-variants';
const button = tv(${recipeConfig});
console.log(button({ tone: 'secondary' }));`,
    },
  };
}

export function createOverheadBundleSources({
  coreImport,
  preludeComponent,
  preludeRecipe,
}) {
  return {
    component: preludeComponent.importLines
      .concat(preludeComponent.setupLines, [
        'const button = recipe({',
        "  base: 'inline-flex items-center rounded-md',",
        '  variants: {',
        '    tone: {',
        "      primary: 'bg-blue-600 text-white',",
        "      secondary: 'bg-slate-200 text-slate-950',",
        '    },',
        '  },',
        '});',
        "const Button = styled('button', button);",
        'console.log(Button);',
      ])
      .join('\n'),
    componentWithRender: preludeComponent.importLines
      .concat(preludeComponent.setupLines, [
        'const button = recipe({',
        "  base: 'inline-flex items-center rounded-md',",
        '  variants: {',
        '    tone: {',
        "      primary: 'bg-blue-600 text-white',",
        "      secondary: 'bg-slate-200 text-slate-950',",
        '    },',
        '  },',
        '});',
        "const Button = styled('button', button, { withRender: true });",
        'console.log(Button);',
      ])
      .join('\n'),
    recipeOnly: preludeRecipe.importLines
      .concat(preludeRecipe.setupLines, [
        'const button = recipe({',
        "  base: 'inline-flex items-center rounded-md',",
        '  variants: {',
        '    tone: {',
        "      primary: 'bg-blue-600 text-white',",
        "      secondary: 'bg-slate-200 text-slate-950',",
        '    },',
        '  },',
        '});',
        "console.log(button({ tone: 'primary' }));",
      ])
      .join('\n'),
    slottedRecipe: preludeRecipe.importLines
      .concat(preludeRecipe.setupLines, [
        'const button = recipe({',
        '  slots: {',
        "    root: 'inline-flex items-center gap-2',",
        "    label: 'font-medium',",
        "    spinner: 'hidden size-4',",
        '  },',
        '  variants: {',
        '    tone: {',
        '      primary: {',
        "        root: 'bg-blue-600 text-white',",
        "        spinner: 'text-blue-100',",
        '      },',
        '    },',
        '  },',
        '});',
        "const slots = button({ tone: 'primary' });",
        'console.log(slots.root());',
      ])
      .join('\n'),
    tailwindAwareRecipe: [
      `import { defineConfig } from ${JSON.stringify(coreImport)};`,
      "import { twMerge } from 'tailwind-merge';",
      'const { recipe } = defineConfig({ merge: twMerge });',
      'const button = recipe({',
      "  base: 'inline-flex items-center rounded-md',",
      '  variants: {',
      '    tone: {',
      "      primary: 'bg-blue-600 text-white',",
      "      secondary: 'bg-slate-200 text-slate-950',",
      '    },',
      '  },',
      '});',
      "console.log(button({ tone: 'primary' }));",
    ].join('\n'),
  };
}
