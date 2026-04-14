import {
  expectAssignable,
  expectError,
  expectNotAssignable,
  expectType,
} from 'tsd';
import {
  defineRecipeConfig,
  hasOwnProperty,
  recipe,
  type AnyRecipe,
  type ClassNameValue,
  type RecipeConfig,
  type RecipeConfigOf,
  type RecipeInput,
  type RecipeResolved,
  type ResolvedVariantProps,
  type SlotNames,
  type StyledFn,
  type VariantProps,
  defineConfig,
  mergeProps,
  mergeRefs,
  useMergeRefs,
  styled,
} from '../../../dist';

expectAssignable<ClassNameValue>('rounded');
expectAssignable<ClassNameValue>(null);
expectAssignable<ClassNameValue>(['rounded', 'px-4']);
expectNotAssignable<ClassNameValue>(false);
expectNotAssignable<ClassNameValue>(['rounded', null]);

expectAssignable<RecipeConfig>({
  base: 'inline-flex',
});

const linkConfig = defineRecipeConfig({
  base: 'inline-flex',
  variants: {
    tone: {
      primary: 'text-blue-600',
      secondary: 'text-slate-700',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

expectError(
  defineRecipeConfig({
    base: 'inline-flex',
    variants: {
      tone: {
        primary: 'text-blue-600',
        secondary: 'text-slate-700',
      },
    },
    defaultVariants: {
      tone: 'ghost',
    },
  })
);

expectError(
  defineRecipeConfig({
    base: 'inline-flex',
    variants: {
      tone: {
        primary: 'text-blue-600',
      },
    },
    defaultVariants: {
      missing: 'primary',
    },
  })
);

const link = recipe(linkConfig);
const resolvedLink = link.resolve(
  {
    tone: 'primary',
    className: 'external',
    id: 'docs',
  },
  {
    forwardProps: ['disabled'],
  }
);

const { recipe: configuredRecipe, styled: configuredStyled } = defineConfig({
  merge: className => className,
});
const { recipe: strictConfiguredRecipe, styled: strictConfiguredStyled } =
  defineConfig({ validate: 'always' });
const configuredLink = configuredRecipe({
  base: 'inline-flex',
  variants: {
    tone: {
      primary: 'text-blue-600',
      secondary: 'text-slate-700',
    },
  },
});
const strictConfiguredLink = strictConfiguredRecipe({
  base: 'inline-flex',
  variants: {
    tone: {
      primary: 'text-blue-600',
      secondary: 'text-slate-700',
    },
  },
});

type LinkConfig = RecipeConfigOf<typeof link>;
type LinkInput = RecipeInput<typeof link>;
type LinkResolved = RecipeResolved<typeof link>;
type LinkVariants = VariantProps<typeof link>;
type LinkResolvedVariants = ResolvedVariantProps<typeof link>;

expectAssignable<AnyRecipe>(link);
expectAssignable<StyledFn>(styled);
expectAssignable<LinkConfig>(linkConfig);
expectType<typeof linkConfig>(defineRecipeConfig(linkConfig));
expectAssignable<LinkConfig>({
  base: 'inline-flex',
  variants: {
    tone: {
      primary: 'text-blue-600',
      secondary: 'text-slate-700',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  defaultVariants: {
    disabled: false,
  },
});
expectAssignable<LinkInput>({ tone: 'primary' });
expectNotAssignable<LinkInput>({});
expectAssignable<LinkVariants>({ tone: 'secondary', disabled: true });
expectAssignable<LinkResolvedVariants>({
  tone: 'primary',
  disabled: false,
});
expectAssignable<LinkResolved>({
  variants: { tone: 'primary', disabled: false },
  resolvedProps: { className: 'inline-flex text-blue-600' },
});
expectType<string>(resolvedLink.resolvedProps.className);
expectType<string>(resolvedLink.resolvedProps.id);
expectType<boolean>(resolvedLink.resolvedProps.disabled);

const Link = styled('a', link);
const ConfiguredLink = configuredStyled('a', configuredLink);
const StrictConfiguredLink = strictConfiguredStyled('a', strictConfiguredLink);

expectType<string>(link({ tone: 'primary' }));
expectType<string>(configuredLink({ tone: 'secondary' }));
expectAssignable<ReturnType<typeof Link>>(ConfiguredLink({ tone: 'primary' }));
expectAssignable<ReturnType<typeof Link>>(
  StrictConfiguredLink({ tone: 'primary' })
);
expectError(defineConfig({ validate: 'dev' }));

expectType<boolean>(hasOwnProperty({ foo: 1 }, 'foo'));
expectType<string>(
  mergeProps({ className: 'a' }, { className: 'b' }).className as string
);
expectAssignable<ReturnType<typeof mergeRefs>>(undefined);
expectAssignable<ReturnType<typeof mergeRefs>>(
  useMergeRefs<HTMLButtonElement>(null, null)
);

expectError(link.extend({ base: 'px-4' }));
expectError(link({ tone: 'ghost' }));
expectError(link({ tone: 'primary', className: { root: 'px-4' } }));

type LinkSlots = SlotNames<typeof link>;
expectNotAssignable<LinkSlots>('root');
