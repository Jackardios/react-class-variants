import { bench, describe } from 'vitest';
import { cva } from 'class-variance-authority';
import { variants as cnVariants } from 'classname-variants';
import { twMerge } from 'tailwind-merge';
import { tv as tvMerged } from 'tailwind-variants';
import { tv as tvLite } from 'tailwind-variants/lite';
import { defineConfig, recipe } from '../src';

const { recipe: mergedRecipe } = defineConfig({ merge: twMerge });

const simpleConfig = {
  base: 'btn px-4 py-2 rounded',
  variants: {
    color: { primary: 'bg-blue-500', secondary: 'bg-gray-500' },
    size: { sm: 'text-sm', md: 'text-base', lg: 'text-lg' },
  },
  defaultVariants: {
    color: 'primary',
    size: 'md',
  },
} as const;

const complexConfig = {
  base: 'btn px-4 py-2 rounded font-medium',
  variants: {
    color: {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-500',
      danger: 'bg-red-500',
    },
    size: { sm: 'text-sm h-8', md: 'text-base h-10', lg: 'text-lg h-12' },
    variant: {
      solid: '',
      outline: 'border-2 bg-transparent',
      ghost: 'bg-transparent',
    },
    disabled: { true: 'opacity-50 cursor-not-allowed', false: '' },
  },
  defaultVariants: {
    color: 'primary',
    size: 'md',
    variant: 'solid',
    disabled: false,
  },
  compoundVariants: [
    {
      color: 'primary',
      variant: 'outline',
      className: 'border-blue-500 text-blue-500',
    },
    {
      color: 'secondary',
      variant: 'outline',
      className: 'border-gray-500 text-gray-500',
    },
    {
      color: 'danger',
      variant: 'outline',
      className: 'border-red-500 text-red-500',
    },
    {
      disabled: true,
      variant: 'outline',
      className: 'border-opacity-50',
    },
  ],
} as const;

const creationConfig = {
  base: 'btn px-4 py-2',
  variants: {
    color: { primary: 'bg-blue', secondary: 'bg-gray' },
    size: { sm: 'text-sm', lg: 'text-lg' },
  },
  defaultVariants: { color: 'primary', size: 'sm' },
} as const;

const sharedComplexVariants = {
  color: complexConfig.variants.color,
  size: complexConfig.variants.size,
  variant: complexConfig.variants.variant,
  disabled: complexConfig.variants.disabled,
} as const;

const rcvSimple = recipe(simpleConfig);
const rcvSimpleMerged = mergedRecipe(simpleConfig);
const cvaSimple = cva(simpleConfig.base, {
  variants: simpleConfig.variants,
  defaultVariants: simpleConfig.defaultVariants,
});
const cnSimple = cnVariants({
  base: simpleConfig.base,
  variants: simpleConfig.variants,
  defaultVariants: simpleConfig.defaultVariants,
});
const tvSimpleLite = tvLite({
  base: simpleConfig.base,
  variants: simpleConfig.variants,
  defaultVariants: simpleConfig.defaultVariants,
});
const tvSimpleMerged = tvMerged({
  base: simpleConfig.base,
  variants: simpleConfig.variants,
  defaultVariants: simpleConfig.defaultVariants,
});

const rcvComplex = recipe(complexConfig);
const rcvComplexMerged = mergedRecipe(complexConfig);
const cvaComplex = cva(complexConfig.base, {
  variants: sharedComplexVariants,
  defaultVariants: complexConfig.defaultVariants,
  compoundVariants: [
    {
      color: 'primary',
      variant: 'outline',
      class: 'border-blue-500 text-blue-500',
    },
    {
      color: 'secondary',
      variant: 'outline',
      class: 'border-gray-500 text-gray-500',
    },
    {
      color: 'danger',
      variant: 'outline',
      class: 'border-red-500 text-red-500',
    },
    {
      disabled: true,
      variant: 'outline',
      class: 'border-opacity-50',
    },
  ],
});
const cnComplex = cnVariants({
  base: complexConfig.base,
  variants: sharedComplexVariants,
  defaultVariants: complexConfig.defaultVariants,
  compoundVariants: [
    {
      variants: { color: 'primary', variant: 'outline' },
      className: 'border-blue-500 text-blue-500',
    },
    {
      variants: { color: 'secondary', variant: 'outline' },
      className: 'border-gray-500 text-gray-500',
    },
    {
      variants: { color: 'danger', variant: 'outline' },
      className: 'border-red-500 text-red-500',
    },
    {
      variants: { disabled: true, variant: 'outline' },
      className: 'border-opacity-50',
    },
  ],
});
const tvComplexLite = tvLite({
  base: complexConfig.base,
  variants: sharedComplexVariants,
  defaultVariants: complexConfig.defaultVariants,
  compoundVariants: [
    {
      color: 'primary',
      variant: 'outline',
      class: 'border-blue-500 text-blue-500',
    },
    {
      color: 'secondary',
      variant: 'outline',
      class: 'border-gray-500 text-gray-500',
    },
    {
      color: 'danger',
      variant: 'outline',
      class: 'border-red-500 text-red-500',
    },
    {
      disabled: true,
      variant: 'outline',
      class: 'border-opacity-50',
    },
  ],
});
const tvComplexMerged = tvMerged({
  base: complexConfig.base,
  variants: sharedComplexVariants,
  defaultVariants: complexConfig.defaultVariants,
  compoundVariants: [
    {
      color: 'primary',
      variant: 'outline',
      class: 'border-blue-500 text-blue-500',
    },
    {
      color: 'secondary',
      variant: 'outline',
      class: 'border-gray-500 text-gray-500',
    },
    {
      color: 'danger',
      variant: 'outline',
      class: 'border-red-500 text-red-500',
    },
    {
      disabled: true,
      variant: 'outline',
      class: 'border-opacity-50',
    },
  ],
});

const cvaSimpleTwMerge = (props?: Parameters<typeof cvaSimple>[0]) =>
  twMerge(cvaSimple(props));
const cnSimpleTwMerge = (props?: Parameters<typeof cnSimple>[0]) =>
  twMerge(cnSimple(props));
const cvaComplexTwMerge = (props?: Parameters<typeof cvaComplex>[0]) =>
  twMerge(cvaComplex(props));
const cnComplexTwMerge = (props?: Parameters<typeof cnComplex>[0]) =>
  twMerge(cnComplex(props));

describe('Comparison: resolver-only', () => {
  describe('simple variants', () => {
    describe('with defaults', () => {
      bench('react-class-variants', () => {
        rcvSimple({});
      });

      bench('class-variance-authority (CVA)', () => {
        cvaSimple({});
      });

      bench('classname-variants', () => {
        cnSimple({});
      });

      bench('tailwind-variants/lite', () => {
        tvSimpleLite({});
      });
    });

    describe('with all props', () => {
      bench('react-class-variants', () => {
        rcvSimple({ color: 'secondary', size: 'lg' });
      });

      bench('class-variance-authority (CVA)', () => {
        cvaSimple({ color: 'secondary', size: 'lg' });
      });

      bench('classname-variants', () => {
        cnSimple({ color: 'secondary', size: 'lg' });
      });

      bench('tailwind-variants/lite', () => {
        tvSimpleLite({ color: 'secondary', size: 'lg' });
      });
    });
  });

  describe('compound variants', () => {
    describe('matching compound', () => {
      bench('react-class-variants', () => {
        rcvComplex({ color: 'primary', variant: 'outline' });
      });

      bench('class-variance-authority (CVA)', () => {
        cvaComplex({ color: 'primary', variant: 'outline' });
      });

      bench('classname-variants', () => {
        cnComplex({ color: 'primary', variant: 'outline' });
      });

      bench('tailwind-variants/lite', () => {
        tvComplexLite({ color: 'primary', variant: 'outline' });
      });
    });

    describe('no matching compound', () => {
      bench('react-class-variants', () => {
        rcvComplex({ color: 'primary', variant: 'solid' });
      });

      bench('class-variance-authority (CVA)', () => {
        cvaComplex({ color: 'primary', variant: 'solid' });
      });

      bench('classname-variants', () => {
        cnComplex({ color: 'primary', variant: 'solid' });
      });

      bench('tailwind-variants/lite', () => {
        tvComplexLite({ color: 'primary', variant: 'solid' });
      });
    });

    describe('with all props', () => {
      bench('react-class-variants', () => {
        rcvComplex({
          color: 'danger',
          size: 'lg',
          variant: 'outline',
          disabled: true,
        });
      });

      bench('class-variance-authority (CVA)', () => {
        cvaComplex({
          color: 'danger',
          size: 'lg',
          variant: 'outline',
          disabled: true,
        });
      });

      bench('classname-variants', () => {
        cnComplex({
          color: 'danger',
          size: 'lg',
          variant: 'outline',
          disabled: true,
        });
      });

      bench('tailwind-variants/lite', () => {
        tvComplexLite({
          color: 'danger',
          size: 'lg',
          variant: 'outline',
          disabled: true,
        });
      });
    });
  });
});

describe('Comparison: resolver+merge', () => {
  describe('simple variants', () => {
    describe('with defaults', () => {
      bench('react-class-variants + twMerge', () => {
        rcvSimpleMerged({});
      });

      bench('class-variance-authority (CVA) + twMerge', () => {
        cvaSimpleTwMerge({});
      });

      bench('classname-variants + twMerge', () => {
        cnSimpleTwMerge({});
      });

      bench('tailwind-variants', () => {
        tvSimpleMerged({});
      });
    });

    describe('with all props', () => {
      bench('react-class-variants + twMerge', () => {
        rcvSimpleMerged({ color: 'secondary', size: 'lg' });
      });

      bench('class-variance-authority (CVA) + twMerge', () => {
        cvaSimpleTwMerge({ color: 'secondary', size: 'lg' });
      });

      bench('classname-variants + twMerge', () => {
        cnSimpleTwMerge({ color: 'secondary', size: 'lg' });
      });

      bench('tailwind-variants', () => {
        tvSimpleMerged({ color: 'secondary', size: 'lg' });
      });
    });
  });

  describe('compound variants', () => {
    describe('matching compound', () => {
      bench('react-class-variants + twMerge', () => {
        rcvComplexMerged({ color: 'primary', variant: 'outline' });
      });

      bench('class-variance-authority (CVA) + twMerge', () => {
        cvaComplexTwMerge({ color: 'primary', variant: 'outline' });
      });

      bench('classname-variants + twMerge', () => {
        cnComplexTwMerge({ color: 'primary', variant: 'outline' });
      });

      bench('tailwind-variants', () => {
        tvComplexMerged({ color: 'primary', variant: 'outline' });
      });
    });

    describe('no matching compound', () => {
      bench('react-class-variants + twMerge', () => {
        rcvComplexMerged({ color: 'primary', variant: 'solid' });
      });

      bench('class-variance-authority (CVA) + twMerge', () => {
        cvaComplexTwMerge({ color: 'primary', variant: 'solid' });
      });

      bench('classname-variants + twMerge', () => {
        cnComplexTwMerge({ color: 'primary', variant: 'solid' });
      });

      bench('tailwind-variants', () => {
        tvComplexMerged({ color: 'primary', variant: 'solid' });
      });
    });

    describe('with all props', () => {
      bench('react-class-variants + twMerge', () => {
        rcvComplexMerged({
          color: 'danger',
          size: 'lg',
          variant: 'outline',
          disabled: true,
        });
      });

      bench('class-variance-authority (CVA) + twMerge', () => {
        cvaComplexTwMerge({
          color: 'danger',
          size: 'lg',
          variant: 'outline',
          disabled: true,
        });
      });

      bench('classname-variants + twMerge', () => {
        cnComplexTwMerge({
          color: 'danger',
          size: 'lg',
          variant: 'outline',
          disabled: true,
        });
      });

      bench('tailwind-variants', () => {
        tvComplexMerged({
          color: 'danger',
          size: 'lg',
          variant: 'outline',
          disabled: true,
        });
      });
    });
  });
});

describe('Comparison: variant creation', () => {
  bench('react-class-variants', () => {
    recipe(creationConfig);
  });

  bench('react-class-variants + twMerge', () => {
    mergedRecipe(creationConfig);
  });

  bench('class-variance-authority (CVA)', () => {
    cva(creationConfig.base, {
      variants: creationConfig.variants,
      defaultVariants: creationConfig.defaultVariants,
    });
  });

  bench('classname-variants', () => {
    cnVariants({
      base: creationConfig.base,
      variants: creationConfig.variants,
      defaultVariants: creationConfig.defaultVariants,
    });
  });

  bench('tailwind-variants/lite', () => {
    tvLite({
      base: creationConfig.base,
      variants: creationConfig.variants,
      defaultVariants: creationConfig.defaultVariants,
    });
  });

  bench('tailwind-variants', () => {
    tvMerged({
      base: creationConfig.base,
      variants: creationConfig.variants,
      defaultVariants: creationConfig.defaultVariants,
    });
  });
});
