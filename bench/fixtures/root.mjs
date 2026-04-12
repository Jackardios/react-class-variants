export const simpleRootConfig = {
  base: 'inline-flex items-center rounded-md font-medium transition-colors',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-slate-200 text-slate-950',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-5 text-lg',
    },
  },
  defaultVariants: {
    tone: 'primary',
    size: 'md',
  },
};

export const multipleRootConfig = {
  base: 'inline-flex items-center rounded-md font-medium transition-colors',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-slate-200 text-slate-950',
      danger: 'bg-rose-600 text-white',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-5 text-lg',
    },
    disabled: {
      true: 'opacity-50 pointer-events-none',
      false: '',
    },
  },
  defaultVariants: {
    tone: 'primary',
    size: 'md',
    disabled: false,
  },
};

export const complexRootConfig = {
  base: 'inline-flex items-center justify-center rounded-md font-medium transition',
  variants: {
    tone: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-slate-200 text-slate-950',
      danger: 'bg-rose-600 text-white',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-5 text-lg',
    },
    variant: {
      solid: '',
      outline: 'border bg-transparent',
      ghost: 'bg-transparent',
    },
    disabled: {
      true: 'opacity-50 pointer-events-none',
      false: '',
    },
  },
  defaultVariants: {
    tone: 'primary',
    size: 'md',
    variant: 'solid',
    disabled: false,
  },
  compoundVariants: [
    {
      tone: 'primary',
      variant: 'outline',
      className: 'border-blue-600 text-blue-600',
    },
    {
      tone: 'secondary',
      variant: 'outline',
      className: 'border-slate-300 text-slate-900',
    },
    {
      tone: 'danger',
      variant: 'outline',
      className: 'border-rose-600 text-rose-600',
    },
  ],
};

export const complexRootNoCompoundsConfig = {
  base: complexRootConfig.base,
  variants: complexRootConfig.variants,
  defaultVariants: complexRootConfig.defaultVariants,
};

export const manyCompoundRootConfig = {
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
};

export function makeSimpleRootConfig() {
  return {
    base: simpleRootConfig.base,
    variants: {
      tone: { ...simpleRootConfig.variants.tone },
      size: { ...simpleRootConfig.variants.size },
    },
    defaultVariants: {
      ...simpleRootConfig.defaultVariants,
    },
  };
}

export function makeMultipleRootConfig() {
  return {
    base: multipleRootConfig.base,
    variants: {
      tone: { ...multipleRootConfig.variants.tone },
      size: { ...multipleRootConfig.variants.size },
      disabled: { ...multipleRootConfig.variants.disabled },
    },
    defaultVariants: {
      ...multipleRootConfig.defaultVariants,
    },
  };
}

export function makeComplexRootConfig() {
  return {
    base: complexRootConfig.base,
    variants: {
      tone: { ...complexRootConfig.variants.tone },
      size: { ...complexRootConfig.variants.size },
      variant: { ...complexRootConfig.variants.variant },
      disabled: { ...complexRootConfig.variants.disabled },
    },
    defaultVariants: {
      ...complexRootConfig.defaultVariants,
    },
    compoundVariants: complexRootConfig.compoundVariants.map(compound => ({
      ...compound,
    })),
  };
}

export function makeComplexRootNoCompoundsConfig() {
  return {
    base: complexRootNoCompoundsConfig.base,
    variants: {
      tone: { ...complexRootNoCompoundsConfig.variants.tone },
      size: { ...complexRootNoCompoundsConfig.variants.size },
      variant: { ...complexRootNoCompoundsConfig.variants.variant },
      disabled: { ...complexRootNoCompoundsConfig.variants.disabled },
    },
    defaultVariants: {
      ...complexRootNoCompoundsConfig.defaultVariants,
    },
  };
}

export const rootScenarioInputs = {
  complexAllProps: {
    disabled: true,
    size: 'lg',
    tone: 'danger',
    variant: 'ghost',
  },
  complexExplicit: {
    disabled: true,
    size: 'lg',
    tone: 'danger',
    variant: 'outline',
  },
  complexNoCompound: {
    tone: 'primary',
    variant: 'solid',
  },
  complexWithClassName: {
    className: 'shadow-lg',
    disabled: true,
    size: 'lg',
    tone: 'danger',
    variant: 'outline',
  },
  complexWithCompound: {
    tone: 'primary',
    variant: 'outline',
  },
  manyCompoundMatch: {
    a: 'a1',
    b: 'b1',
    c: 'c1',
    d: 'd1',
  },
  manyCompoundNoMatch: {
    a: 'a1',
    b: 'b2',
    c: 'c3',
    d: 'd1',
  },
  multipleAllProps: {
    disabled: true,
    size: 'lg',
    tone: 'secondary',
  },
  multipleDefaults: {},
  multipleWithClassName: {
    className: 'custom-class',
    size: 'sm',
    tone: 'danger',
  },
  simpleExplicit: {
    size: 'lg',
    tone: 'secondary',
  },
  simpleWithClassName: {
    className: 'extra-class',
    size: 'lg',
    tone: 'secondary',
  },
};
