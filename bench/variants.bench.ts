import { bench, describe } from 'vitest';
import { recipe } from '../src';

const simpleVariants = recipe({
  base: 'btn',
  variants: {
    color: { primary: 'bg-blue-500', secondary: 'bg-gray-500' },
  },
});

const multipleVariants = recipe({
  base: 'btn px-4 py-2 rounded',
  variants: {
    color: {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-500',
      danger: 'bg-red-500',
    },
    size: { sm: 'text-sm', md: 'text-base', lg: 'text-lg' },
    disabled: { true: 'opacity-50 cursor-not-allowed', false: '' },
  },
  defaultVariants: {
    color: 'primary',
    size: 'md',
    disabled: false,
  },
});

const complexVariants = recipe({
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
      color: 'primary',
      variant: 'ghost',
      className: 'text-blue-500 hover:bg-blue-50',
    },
    {
      color: 'secondary',
      variant: 'ghost',
      className: 'text-gray-500 hover:bg-gray-50',
    },
    {
      color: 'danger',
      variant: 'ghost',
      className: 'text-red-500 hover:bg-red-50',
    },
    {
      disabled: true,
      variant: 'outline',
      className: 'border-opacity-50',
    },
  ],
});

const manyCompoundVariants = recipe({
  base: 'component',
  variants: {
    a: { a1: 'a1', a2: 'a2', a3: 'a3' },
    b: { b1: 'b1', b2: 'b2', b3: 'b3' },
    c: { c1: 'c1', c2: 'c2', c3: 'c3' },
    d: { d1: 'd1', d2: 'd2', d3: 'd3' },
  },
  compoundVariants: [
    { a: 'a1', b: 'b1', className: 'cv-1' },
    { a: 'a2', b: 'b2', className: 'cv-2' },
    { a: 'a3', b: 'b3', className: 'cv-3' },
    { b: 'b1', c: 'c1', className: 'cv-4' },
    { b: 'b2', c: 'c2', className: 'cv-5' },
    { b: 'b3', c: 'c3', className: 'cv-6' },
    { c: 'c1', d: 'd1', className: 'cv-7' },
    { c: 'c2', d: 'd2', className: 'cv-8' },
    { c: 'c3', d: 'd3', className: 'cv-9' },
    { a: 'a1', d: 'd1', className: 'cv-10' },
    { a: 'a2', d: 'd2', className: 'cv-11' },
    { a: 'a3', d: 'd3', className: 'cv-12' },
    { a: ['a1', 'a2'], b: ['b1', 'b2'], className: 'cv-array-1' },
    { c: ['c1', 'c2'], d: ['d1', 'd2'], className: 'cv-array-2' },
  ],
});

describe('recipe()', () => {
  describe('simple variants', () => {
    bench('resolve with props', () => {
      simpleVariants({ color: 'primary' });
    });

    bench('resolve with className', () => {
      simpleVariants({ color: 'secondary', className: 'extra-class' });
    });
  });

  describe('multiple variants', () => {
    bench('resolve with defaults', () => {
      multipleVariants({});
    });

    bench('resolve with all props', () => {
      multipleVariants({ color: 'secondary', size: 'lg', disabled: true });
    });

    bench('resolve with className', () => {
      multipleVariants({
        color: 'danger',
        size: 'sm',
        className: 'custom-class',
      });
    });
  });

  describe('compound variants', () => {
    bench('resolve matching compound', () => {
      complexVariants({ color: 'primary', variant: 'outline' });
    });

    bench('resolve multiple matching compounds', () => {
      complexVariants({ color: 'primary', variant: 'outline', disabled: true });
    });

    bench('resolve no matching compounds', () => {
      complexVariants({ color: 'primary', variant: 'solid' });
    });

    bench('resolve with all props', () => {
      complexVariants({
        color: 'danger',
        size: 'lg',
        variant: 'ghost',
        disabled: false,
      });
    });
  });

  describe('many compound variants', () => {
    bench('resolve with array selectors matching', () => {
      manyCompoundVariants({ a: 'a1', b: 'b1', c: 'c1', d: 'd1' });
    });

    bench('resolve with no matching', () => {
      manyCompoundVariants({ a: 'a1', b: 'b2', c: 'c3', d: 'd1' });
    });
  });
});

describe('recipe() creation', () => {
  bench('create simple variants', () => {
    recipe({
      base: 'btn',
      variants: {
        color: { primary: 'bg-blue', secondary: 'bg-gray' },
      },
    });
  });

  bench('create complex variants', () => {
    recipe({
      base: 'btn px-4 py-2',
      variants: {
        color: { primary: 'bg-blue', secondary: 'bg-gray', danger: 'bg-red' },
        size: { sm: 'text-sm', md: 'text-md', lg: 'text-lg' },
        variant: { solid: '', outline: 'border', ghost: 'bg-transparent' },
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
          className: 'border-blue',
        },
        {
          color: 'secondary',
          variant: 'outline',
          className: 'border-gray',
        },
      ],
    });
  });
});
