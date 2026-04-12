export const competitorRuntimeScenarios = {
  complexExplicit: {
    color: 'danger',
    disabled: true,
    size: 'lg',
    variant: 'outline',
  },
  complexNoCompound: {
    color: 'primary',
    variant: 'solid',
  },
  complexWithCompound: {
    color: 'primary',
    variant: 'outline',
  },
  simpleDefaults: {},
  simpleExplicit: {
    color: 'secondary',
    size: 'lg',
  },
};

export const competitorLibraryLabelsByTrack = {
  plain: [
    'react-class-variants',
    'class-variance-authority',
    'classname-variants',
    'tailwind-variants/lite',
  ],
  tailwindAware: [
    'react-class-variants + twMerge',
    'class-variance-authority + twMerge',
    'classname-variants + twMerge',
    'tailwind-variants',
  ],
};

export const competitorCreationScenarios = [
  'freshComplexConfig',
  'reusedComplexConfig',
];

export const competitorMemoryScenarios = [
  'freshComplexConfig',
  'freshSimpleConfig',
];

export const competitorSimpleConfig = {
  base: 'btn px-4 py-2 rounded',
  variants: {
    color: { primary: 'bg-blue-500', secondary: 'bg-gray-500' },
    size: { sm: 'text-sm', md: 'text-base', lg: 'text-lg' },
  },
  defaultVariants: {
    color: 'primary',
    size: 'md',
  },
};

export const competitorComplexConfig = {
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
};

export const competitorSharedComplexVariants = {
  color: competitorComplexConfig.variants.color,
  disabled: competitorComplexConfig.variants.disabled,
  size: competitorComplexConfig.variants.size,
  variant: competitorComplexConfig.variants.variant,
};

export function makeCompetitorSimpleConfig() {
  return {
    base: competitorSimpleConfig.base,
    variants: {
      color: { ...competitorSimpleConfig.variants.color },
      size: { ...competitorSimpleConfig.variants.size },
    },
    defaultVariants: { ...competitorSimpleConfig.defaultVariants },
  };
}

export function makeCompetitorSharedComplexVariants() {
  return {
    color: { ...competitorComplexConfig.variants.color },
    disabled: { ...competitorComplexConfig.variants.disabled },
    size: { ...competitorComplexConfig.variants.size },
    variant: { ...competitorComplexConfig.variants.variant },
  };
}

export function makeCompetitorRcvComplexConfig() {
  return {
    base: competitorComplexConfig.base,
    variants: makeCompetitorSharedComplexVariants(),
    defaultVariants: { ...competitorComplexConfig.defaultVariants },
    compoundVariants: competitorComplexConfig.compoundVariants.map(
      compound => ({
        ...compound,
      })
    ),
  };
}

export function makeCompetitorCvaCompoundVariants() {
  return [
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
  ];
}

export function makeCompetitorCnCompoundVariants() {
  return [
    {
      className: 'border-blue-500 text-blue-500',
      variants: { color: 'primary', variant: 'outline' },
    },
    {
      className: 'border-gray-500 text-gray-500',
      variants: { color: 'secondary', variant: 'outline' },
    },
    {
      className: 'border-red-500 text-red-500',
      variants: { color: 'danger', variant: 'outline' },
    },
    {
      className: 'border-opacity-50',
      variants: { disabled: true, variant: 'outline' },
    },
  ];
}

export function createCompetitorBenchmarkFactories({
  cnVariants,
  cva,
  defineConfig,
  recipe,
  tvLite,
  tvMerged,
  twMerge,
}) {
  const { recipe: mergedRecipe } = defineConfig({ merge: twMerge });
  const cvaComplexCompoundVariants = makeCompetitorCvaCompoundVariants();
  const cnComplexCompoundVariants = makeCompetitorCnCompoundVariants();

  const plain = {
    'react-class-variants': {
      createComplexFresh: () => recipe(makeCompetitorRcvComplexConfig()),
      createComplexReused: () => recipe(competitorComplexConfig),
      createSimpleFresh: () => recipe(makeCompetitorSimpleConfig()),
      complex: recipe(competitorComplexConfig),
      simple: recipe(competitorSimpleConfig),
    },
    'class-variance-authority': {
      createComplexFresh: () =>
        cva(competitorComplexConfig.base, {
          compoundVariants: makeCompetitorCvaCompoundVariants(),
          defaultVariants: { ...competitorComplexConfig.defaultVariants },
          variants: makeCompetitorSharedComplexVariants(),
        }),
      createComplexReused: () =>
        cva(competitorComplexConfig.base, {
          compoundVariants: cvaComplexCompoundVariants,
          defaultVariants: competitorComplexConfig.defaultVariants,
          variants: competitorSharedComplexVariants,
        }),
      createSimpleFresh: () => {
        const config = makeCompetitorSimpleConfig();
        return cva(config.base, {
          defaultVariants: config.defaultVariants,
          variants: config.variants,
        });
      },
      complex: cva(competitorComplexConfig.base, {
        compoundVariants: cvaComplexCompoundVariants,
        defaultVariants: competitorComplexConfig.defaultVariants,
        variants: competitorSharedComplexVariants,
      }),
      simple: cva(competitorSimpleConfig.base, {
        defaultVariants: competitorSimpleConfig.defaultVariants,
        variants: competitorSimpleConfig.variants,
      }),
    },
    'classname-variants': {
      createComplexFresh: () =>
        cnVariants({
          base: competitorComplexConfig.base,
          compoundVariants: makeCompetitorCnCompoundVariants(),
          defaultVariants: { ...competitorComplexConfig.defaultVariants },
          variants: makeCompetitorSharedComplexVariants(),
        }),
      createComplexReused: () =>
        cnVariants({
          base: competitorComplexConfig.base,
          compoundVariants: cnComplexCompoundVariants,
          defaultVariants: competitorComplexConfig.defaultVariants,
          variants: competitorSharedComplexVariants,
        }),
      createSimpleFresh: () => cnVariants(makeCompetitorSimpleConfig()),
      complex: cnVariants({
        base: competitorComplexConfig.base,
        compoundVariants: cnComplexCompoundVariants,
        defaultVariants: competitorComplexConfig.defaultVariants,
        variants: competitorSharedComplexVariants,
      }),
      simple: cnVariants({
        base: competitorSimpleConfig.base,
        defaultVariants: competitorSimpleConfig.defaultVariants,
        variants: competitorSimpleConfig.variants,
      }),
    },
    'tailwind-variants/lite': {
      createComplexFresh: () =>
        tvLite({
          base: competitorComplexConfig.base,
          compoundVariants: makeCompetitorCvaCompoundVariants(),
          defaultVariants: { ...competitorComplexConfig.defaultVariants },
          variants: makeCompetitorSharedComplexVariants(),
        }),
      createComplexReused: () =>
        tvLite({
          base: competitorComplexConfig.base,
          compoundVariants: cvaComplexCompoundVariants,
          defaultVariants: competitorComplexConfig.defaultVariants,
          variants: competitorSharedComplexVariants,
        }),
      createSimpleFresh: () => tvLite(makeCompetitorSimpleConfig()),
      complex: tvLite({
        base: competitorComplexConfig.base,
        compoundVariants: cvaComplexCompoundVariants,
        defaultVariants: competitorComplexConfig.defaultVariants,
        variants: competitorSharedComplexVariants,
      }),
      simple: tvLite({
        base: competitorSimpleConfig.base,
        defaultVariants: competitorSimpleConfig.defaultVariants,
        variants: competitorSimpleConfig.variants,
      }),
    },
  };

  const tailwindAware = {
    'react-class-variants + twMerge': {
      createComplexFresh: () => mergedRecipe(makeCompetitorRcvComplexConfig()),
      createComplexReused: () => mergedRecipe(competitorComplexConfig),
      createSimpleFresh: () => mergedRecipe(makeCompetitorSimpleConfig()),
      complex: mergedRecipe(competitorComplexConfig),
      simple: mergedRecipe(competitorSimpleConfig),
    },
    'class-variance-authority + twMerge': {
      createComplexFresh: () => {
        const resolver = cva(competitorComplexConfig.base, {
          compoundVariants: makeCompetitorCvaCompoundVariants(),
          defaultVariants: { ...competitorComplexConfig.defaultVariants },
          variants: makeCompetitorSharedComplexVariants(),
        });
        return props => twMerge(resolver(props));
      },
      createComplexReused: () => {
        const resolver = cva(competitorComplexConfig.base, {
          compoundVariants: cvaComplexCompoundVariants,
          defaultVariants: competitorComplexConfig.defaultVariants,
          variants: competitorSharedComplexVariants,
        });
        return props => twMerge(resolver(props));
      },
      createSimpleFresh: () => {
        const config = makeCompetitorSimpleConfig();
        const resolver = cva(config.base, {
          defaultVariants: config.defaultVariants,
          variants: config.variants,
        });
        return props => twMerge(resolver(props));
      },
      complex: (() => {
        const resolver = cva(competitorComplexConfig.base, {
          compoundVariants: cvaComplexCompoundVariants,
          defaultVariants: competitorComplexConfig.defaultVariants,
          variants: competitorSharedComplexVariants,
        });
        return props => twMerge(resolver(props));
      })(),
      simple: (() => {
        const resolver = cva(competitorSimpleConfig.base, {
          defaultVariants: competitorSimpleConfig.defaultVariants,
          variants: competitorSimpleConfig.variants,
        });
        return props => twMerge(resolver(props));
      })(),
    },
    'classname-variants + twMerge': {
      createComplexFresh: () => {
        const resolver = cnVariants({
          base: competitorComplexConfig.base,
          compoundVariants: makeCompetitorCnCompoundVariants(),
          defaultVariants: { ...competitorComplexConfig.defaultVariants },
          variants: makeCompetitorSharedComplexVariants(),
        });
        return props => twMerge(resolver(props));
      },
      createComplexReused: () => {
        const resolver = cnVariants({
          base: competitorComplexConfig.base,
          compoundVariants: cnComplexCompoundVariants,
          defaultVariants: competitorComplexConfig.defaultVariants,
          variants: competitorSharedComplexVariants,
        });
        return props => twMerge(resolver(props));
      },
      createSimpleFresh: () => {
        const resolver = cnVariants(makeCompetitorSimpleConfig());
        return props => twMerge(resolver(props));
      },
      complex: (() => {
        const resolver = cnVariants({
          base: competitorComplexConfig.base,
          compoundVariants: cnComplexCompoundVariants,
          defaultVariants: competitorComplexConfig.defaultVariants,
          variants: competitorSharedComplexVariants,
        });
        return props => twMerge(resolver(props));
      })(),
      simple: (() => {
        const resolver = cnVariants({
          base: competitorSimpleConfig.base,
          defaultVariants: competitorSimpleConfig.defaultVariants,
          variants: competitorSimpleConfig.variants,
        });
        return props => twMerge(resolver(props));
      })(),
    },
    'tailwind-variants': {
      createComplexFresh: () =>
        tvMerged({
          base: competitorComplexConfig.base,
          compoundVariants: makeCompetitorCvaCompoundVariants(),
          defaultVariants: { ...competitorComplexConfig.defaultVariants },
          variants: makeCompetitorSharedComplexVariants(),
        }),
      createComplexReused: () =>
        tvMerged({
          base: competitorComplexConfig.base,
          compoundVariants: cvaComplexCompoundVariants,
          defaultVariants: competitorComplexConfig.defaultVariants,
          variants: competitorSharedComplexVariants,
        }),
      createSimpleFresh: () => tvMerged(makeCompetitorSimpleConfig()),
      complex: tvMerged({
        base: competitorComplexConfig.base,
        compoundVariants: cvaComplexCompoundVariants,
        defaultVariants: competitorComplexConfig.defaultVariants,
        variants: competitorSharedComplexVariants,
      }),
      simple: tvMerged({
        base: competitorSimpleConfig.base,
        defaultVariants: competitorSimpleConfig.defaultVariants,
        variants: competitorSimpleConfig.variants,
      }),
    },
  };

  return {
    plain,
    tailwindAware,
  };
}
