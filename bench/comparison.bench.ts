import { bench, describe } from 'vitest';
import { defineConfig } from '../src';
import { cva } from 'class-variance-authority';
import { variants as cnVariants } from 'classname-variants';

const { variants: rcvVariants } = defineConfig();

// Simple variants - all libraries
const rcvSimple = rcvVariants({
  base: 'btn px-4 py-2 rounded',
  variants: {
    color: { primary: 'bg-blue-500', secondary: 'bg-gray-500' },
    size: { sm: 'text-sm', md: 'text-base', lg: 'text-lg' },
  },
  defaultVariants: {
    color: 'primary',
    size: 'md',
  },
});

const cvaSimple = cva('btn px-4 py-2 rounded', {
  variants: {
    color: { primary: 'bg-blue-500', secondary: 'bg-gray-500' },
    size: { sm: 'text-sm', md: 'text-base', lg: 'text-lg' },
  },
  defaultVariants: {
    color: 'primary',
    size: 'md',
  },
});

const cnSimple = cnVariants({
  base: 'btn px-4 py-2 rounded',
  variants: {
    color: { primary: 'bg-blue-500', secondary: 'bg-gray-500' },
    size: { sm: 'text-sm', md: 'text-base', lg: 'text-lg' },
  },
  defaultVariants: {
    color: 'primary',
    size: 'md',
  },
});

// Complex with compound variants
const rcvComplex = rcvVariants({
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
  },
  defaultVariants: {
    color: 'primary',
    size: 'md',
    variant: 'solid',
  },
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
  ],
});

const cvaComplex = cva('btn px-4 py-2 rounded font-medium', {
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
  },
  defaultVariants: {
    color: 'primary',
    size: 'md',
    variant: 'solid',
  },
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
  ],
});

const cnComplex = cnVariants({
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
  },
  defaultVariants: {
    color: 'primary',
    size: 'md',
    variant: 'solid',
  },
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
  ],
});

describe('Comparison: simple variants', () => {
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
  });
});

describe('Comparison: compound variants', () => {
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
  });

  describe('with all props', () => {
    bench('react-class-variants', () => {
      rcvComplex({ color: 'danger', size: 'lg', variant: 'ghost' });
    });

    bench('class-variance-authority (CVA)', () => {
      cvaComplex({ color: 'danger', size: 'lg', variant: 'ghost' });
    });

    bench('classname-variants', () => {
      cnComplex({ color: 'danger', size: 'lg', variant: 'ghost' });
    });
  });
});

describe('Comparison: variant creation', () => {
  bench('react-class-variants', () => {
    rcvVariants({
      base: 'btn px-4 py-2',
      variants: {
        color: { primary: 'bg-blue', secondary: 'bg-gray' },
        size: { sm: 'text-sm', lg: 'text-lg' },
      },
      defaultVariants: { color: 'primary', size: 'sm' },
    });
  });

  bench('class-variance-authority (CVA)', () => {
    cva('btn px-4 py-2', {
      variants: {
        color: { primary: 'bg-blue', secondary: 'bg-gray' },
        size: { sm: 'text-sm', lg: 'text-lg' },
      },
      defaultVariants: { color: 'primary', size: 'sm' },
    });
  });

  bench('classname-variants', () => {
    cnVariants({
      base: 'btn px-4 py-2',
      variants: {
        color: { primary: 'bg-blue', secondary: 'bg-gray' },
        size: { sm: 'text-sm', lg: 'text-lg' },
      },
      defaultVariants: { color: 'primary', size: 'sm' },
    });
  });
});
