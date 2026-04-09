import { expectAssignable, expectError, expectType } from 'tsd';
import { defineConfig } from '../../../';

const { variants, variantPropsResolver } = defineConfig();

// =============================================================================
// variants()
// =============================================================================

const requiredVariant = variants({
  variants: {
    color: {
      primary: 'bg-blue',
      secondary: 'bg-gray',
    },
  },
});

expectError(requiredVariant());
expectError(requiredVariant({}));
expectType<string>(requiredVariant({ color: 'primary' }));
expectType<string>(requiredVariant({ color: 'secondary' }));

const optionalWithDefault = variants({
  variants: {
    color: {
      primary: 'bg-blue',
      secondary: 'bg-gray',
    },
  },
  defaultVariants: {
    color: 'primary',
  },
});

expectType<string>(optionalWithDefault());
expectType<string>(optionalWithDefault({}));
expectType<string>(optionalWithDefault({ color: 'secondary' }));

const booleanVariant = variants({
  variants: {
    disabled: {
      true: 'opacity-50',
      false: 'opacity-100',
    },
  },
});

expectType<string>(booleanVariant());
expectType<string>(booleanVariant({}));
expectType<string>(booleanVariant({ disabled: true }));
expectType<string>(booleanVariant({ disabled: false }));

const mixedVariants = variants({
  variants: {
    color: {
      primary: 'bg-blue',
      secondary: 'bg-gray',
    },
    size: {
      small: 'text-sm',
      large: 'text-lg',
    },
    disabled: {
      true: 'opacity-50',
      false: 'opacity-100',
    },
  },
  defaultVariants: {
    size: 'small',
  },
});

expectError(mixedVariants());
expectError(mixedVariants({}));
expectError(mixedVariants({ size: 'large' }));
expectType<string>(mixedVariants({ color: 'primary' }));
expectType<string>(mixedVariants({ color: 'primary', size: 'large' }));
expectType<string>(mixedVariants({ color: 'primary', disabled: true }));
expectType<string>(
  mixedVariants({ color: 'primary', size: 'large', disabled: true })
);

const noVariants = variants({
  base: 'btn',
});
expectType<string>(noVariants());
expectType<string>(noVariants({}));
expectType<string>(noVariants({ className: 'extra' }));

const withClassName = variants({
  base: 'btn',
  variants: {
    color: {
      primary: 'bg-blue',
    },
  },
});

expectType<string>(withClassName({ color: 'primary', className: 'extra' }));
expectType<string>(withClassName({ color: 'primary', className: ['a', 'b'] }));
expectType<string>(
  withClassName({ color: 'primary', className: [['nested']] })
);

const withCompound = variants({
  variants: {
    color: {
      primary: 'bg-blue',
    },
    size: {
      large: 'text-lg',
    },
  },
  compoundVariants: [
    {
      variants: { color: 'primary', size: 'large' },
      className: 'font-bold',
    },
  ],
});

expectType<string>(withCompound({ color: 'primary', size: 'large' }));

const compoundArrayVariants = variants({
  variants: {
    color: {
      primary: 'bg-blue',
      secondary: 'bg-gray',
      danger: 'bg-red',
    },
    size: {
      sm: 'text-sm',
      lg: 'text-lg',
    },
  },
  compoundVariants: [
    {
      variants: {
        color: ['primary', 'secondary'],
        size: 'lg',
      },
      className: 'font-bold',
    },
  ],
});

expectType<string>(compoundArrayVariants({ color: 'primary', size: 'lg' }));
expectType<string>(compoundArrayVariants({ color: 'danger', size: 'sm' }));
expectError(compoundArrayVariants());
expectError(compoundArrayVariants({ color: 'primary' }));

const arrayClassVariants = variants({
  base: ['base', 'class'],
  variants: {
    color: {
      primary: ['bg-blue', 'text-white'],
      secondary: ['bg-gray', null, 'text-black'],
    },
  },
  compoundVariants: [
    {
      variants: { color: 'primary' },
      className: ['compound', ['nested']],
    },
  ],
});

expectType<string>(arrayClassVariants({ color: 'primary' }));

const nullableClassVariants = variants({
  base: [null, 'base', undefined],
  variants: {
    size: {
      sm: [null, 'sm', undefined],
    },
  },
});

expectType<string>(nullableClassVariants({ size: 'sm' }));

const emptyVariants = variants({});
expectType<string>(emptyVariants());
expectType<string>(emptyVariants({ className: 'test' }));

const noVariantsWithDefaults = variants({
  base: 'btn',
  defaultVariants: {},
});
expectType<string>(noVariantsWithDefaults());

const singleValue = variants({
  variants: {
    color: {
      primary: 'bg-blue',
    },
  },
});
expectType<string>(singleValue({ color: 'primary' }));
expectError(singleValue({ color: 'secondary' }));

const onlyTrue = variants({
  variants: {
    active: {
      true: 'active',
    },
  },
});
expectType<string>(onlyTrue());
expectType<string>(onlyTrue({ active: true }));
expectType<string>(onlyTrue({ active: false }));

const onlyFalse = variants({
  variants: {
    inactive: {
      false: 'inactive',
    },
  },
});
expectType<string>(onlyFalse());
expectType<string>(onlyFalse({ inactive: true }));
expectType<string>(onlyFalse({ inactive: false }));

const undefinedVariantValue = variants({
  base: 'btn',
  variants: {
    color: {
      primary: 'bg-blue',
      none: undefined,
    },
  },
});

expectType<string>(undefinedVariantValue({ color: 'primary' }));
expectType<string>(undefinedVariantValue({ color: 'none' }));

const nullVariantValue = variants({
  base: 'btn',
  variants: {
    color: {
      primary: 'bg-blue',
      none: null,
    },
  },
});

expectType<string>(nullVariantValue({ color: 'primary' }));
expectType<string>(nullVariantValue({ color: 'none' }));

const manyVariants = variants({
  variants: {
    a: { x: 'a' },
    b: { x: 'b' },
    c: { x: 'c' },
    d: { x: 'd' },
    e: { x: 'e' },
    f: { true: 'f-true', false: 'f-false' },
    g: { true: 'g-true', false: 'g-false' },
  },
  defaultVariants: {
    a: 'x',
    b: 'x',
  },
});

expectError(manyVariants());
expectType<string>(manyVariants({ c: 'x', d: 'x', e: 'x' }));
expectType<string>(manyVariants({ a: 'x', c: 'x', d: 'x', e: 'x', f: true }));

const emptyVariantsObject = variants({
  variants: {},
});
expectType<string>(emptyVariantsObject());
expectType<string>(emptyVariantsObject({ className: 'test' }));

const undefinedVariantsConfig = variants({
  base: 'btn',
  variants: undefined,
});
expectType<string>(undefinedVariantsConfig());

// =============================================================================
// variantPropsResolver()
// =============================================================================

const resolveProps = variantPropsResolver({
  base: 'btn',
  variants: {
    color: {
      primary: 'bg-blue',
      secondary: 'bg-gray',
    },
  },
});

const resolved = resolveProps({
  color: 'primary',
  onClick: () => {},
  'data-testid': 'button',
});

expectType<string>(resolved.className);
expectAssignable<Function>(resolved.onClick);
expectType<string>(resolved['data-testid']);
expectError(resolved.color);

const resolvedWithNestedClassName = resolveProps({
  color: 'primary',
  className: ['inline-flex', ['gap-2', null], undefined],
});

expectType<string>(resolvedWithNestedClassName.className);

const resolvedWithNullableClassName = resolveProps({
  color: 'primary',
  className: null,
});

expectType<string>(resolvedWithNullableClassName.className);

const resolvedWithUndefinedClassName = resolveProps({
  color: 'primary',
  className: undefined,
});

expectType<string>(resolvedWithUndefinedClassName.className);

const resolveWithForward = variantPropsResolver({
  variants: {
    color: { primary: 'bg-blue' },
    size: { large: 'text-lg' },
  },
  forwardProps: ['size'],
});

const resolvedWithForward = resolveWithForward({
  color: 'primary',
  size: 'large',
  onClick: () => {},
});

expectType<string>(resolvedWithForward.className);
expectAssignable<string>(resolvedWithForward.size);
expectAssignable<Function>(resolvedWithForward.onClick);
expectError(resolvedWithForward.color);

// =============================================================================
// Exactness and negative DX cases
// =============================================================================

expectError(
  variants({
    variantz: {
      color: {
        primary: 'bg-blue',
      },
    },
  })
);

expectError(
  variants({
    variants: {
      color: {
        primary: 'bg-blue',
      },
    },
    defaultVariants: {
      colour: 'primary',
    },
  })
);

expectError(
  variants({
    variants: {
      color: {
        primary: 'bg-blue',
      },
    },
    defaultVariants: {
      color: 'ghost',
    },
  })
);

expectError(
  variants({
    variants: {
      color: {
        primary: 'bg-blue',
        secondary: 'bg-gray',
      },
    },
    compoundVariants: [
      {
        variants: {
          colour: 'primary',
        },
        className: 'font-bold',
      },
    ],
  })
);

expectError(
  variants({
    variants: {
      color: {
        primary: 'bg-blue',
        secondary: 'bg-gray',
      },
    },
    compoundVariants: [
      {
        variants: {
          color: ['primary', 'ghost'],
        },
        className: 'font-bold',
      },
    ],
  })
);

expectType<string>(
  variants({
    variants: {
      ref: {
        primary: 'ring-2',
      },
    },
  })({ ref: 'primary' })
);

expectError(
  variantPropsResolver({
    variants: {
      size: {
        sm: 'text-sm',
      },
    },
    forwardProps: ['sizze'],
  })
);

expectError(
  variantPropsResolver({
    variants: {
      color: {
        primary: 'bg-blue',
      },
    },
    defaultVariants: {
      color: 'ghost',
    },
  })
);

const genericRenderResolver = variantPropsResolver({
  variants: {
    render: {
      primary: 'bg-blue',
    },
  },
});

expectType<string>(genericRenderResolver({ render: 'primary' }).className);
