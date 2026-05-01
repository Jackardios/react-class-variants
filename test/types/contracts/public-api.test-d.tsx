import {
  expectAssignable,
  expectError,
  expectNotAssignable,
  expectType,
} from 'tsd';
import * as packageRoot from '../../../dist';
import {
  defineRecipeConfig,
  defineViewProps,
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
  type VariantName,
  type VariantOption,
  type VariantProps,
  defineConfig,
  mergeProps,
  mergeRefs,
  useMergeRefs,
  variantNames,
  variantOptions,
} from '../../../dist';
import { recipe as coreRecipe } from '../../../dist/core';

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
const { styled } = defineConfig();
const configuredLink = configuredRecipe({
  base: 'inline-flex',
  variants: {
    tone: {
      primary: 'text-blue-600',
      secondary: 'text-slate-700',
    },
  },
});
const crossEntryRootRecipe = coreRecipe({
  base: 'inline-flex',
  variants: {
    slotClassNames: {
      compact: 'gap-1',
      spacious: 'gap-3',
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
type LinkVariantName = VariantName<typeof link>;
type LinkToneOption = VariantOption<typeof link, 'tone'>;
type LinkDisabledOption = VariantOption<typeof link, 'disabled'>;

expectAssignable<AnyRecipe>(link);
expectAssignable<StyledFn>(configuredStyled);
expectAssignable<LinkConfig>(linkConfig);
defineViewProps<{ icon?: string }>('icon');
expectType<typeof linkConfig>(defineRecipeConfig(linkConfig));
expectError(packageRoot.styled);
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
expectAssignable<LinkVariantName>('tone');
expectNotAssignable<LinkVariantName>('size');
expectAssignable<LinkToneOption>('primary');
expectNotAssignable<LinkToneOption>('ghost');
expectAssignable<LinkDisabledOption>(true);
expectNotAssignable<LinkDisabledOption>('true');
expectAssignable<LinkResolved>({
  variants: { tone: 'primary', disabled: false },
  resolvedProps: { className: 'inline-flex text-blue-600' },
});
expectType<string>(resolvedLink.resolvedProps.className);
expectType<string>(resolvedLink.resolvedProps.id);
expectType<boolean>(resolvedLink.resolvedProps.disabled);
expectType<('tone' | 'disabled')[]>(variantNames(linkConfig));
expectType<('tone' | 'disabled')[]>(variantNames(link));
expectType<('primary' | 'secondary')[]>(variantOptions(linkConfig, 'tone'));
expectType<('primary' | 'secondary')[]>(variantOptions(link, 'tone'));
expectType<boolean[]>(variantOptions(linkConfig, 'disabled'));
expectType<boolean[]>(variantOptions(link, 'disabled'));
expectError(variantOptions(link, 'size'));

const Link = styled('a', link);
const ConfiguredLink = configuredStyled('a', configuredLink);
const CrossEntryRoot = styled('button', crossEntryRootRecipe);
const StrictConfiguredLink = strictConfiguredStyled('a', strictConfiguredLink);

expectType<string>(link({ tone: 'primary' }));
expectType<string>(configuredLink({ tone: 'secondary' }));
expectAssignable<ReturnType<typeof CrossEntryRoot>>(
  CrossEntryRoot({ slotClassNames: 'compact' })
);
expectAssignable<ReturnType<typeof Link>>(ConfiguredLink({ tone: 'primary' }));
expectAssignable<ReturnType<typeof Link>>(
  StrictConfiguredLink({ tone: 'primary' })
);
expectError(
  Link({
    tone: 'primary',
    slotClassNames: {
      root: 'px-4',
    },
  })
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
