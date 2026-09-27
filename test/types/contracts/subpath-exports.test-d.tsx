import type { ReactNode } from 'react';
import {
  expectAssignable,
  expectError,
  expectNotAssignable,
  expectType,
} from 'tsd';
import {
  defineConfig as defineRootConfig,
  recipe as rootRecipe,
  variantNames as rootVariantNames,
  variantOptions as rootVariantOptions,
  type AnyRootRecipe as RootAnyRootRecipe,
  type AnySlotRecipe as RootAnySlotRecipe,
  type RecipeConfigOf as RootRecipeConfigOf,
  type RecipeInput as RootRecipeInput,
  type RecipeResolved as RootRecipeResolved,
  type ResolvedVariantProps as RootResolvedVariantProps,
  type SlotNames as RootSlotNames,
  type VariantName as RootVariantName,
  type VariantProps as RootVariantProps,
} from '../../../dist';
import {
  defineConfig as defineCoreConfig,
  recipe as coreRecipe,
  variantNames as coreVariantNames,
  variantOptions as coreVariantOptions,
  type AnyRootRecipe as CoreAnyRootRecipe,
  type AnySlotRecipe as CoreAnySlotRecipe,
  type VariantProps,
} from '../../../dist/core';

// A styled component is a React 19 function component.
type StyledRender = ReactNode | Promise<ReactNode>;

const coreConfig = defineCoreConfig({
  merge: className => className,
});
const coreBadge = coreRecipe({
  base: 'inline-flex',
  variants: {
    tone: {
      info: 'text-sky-700',
    },
  },
});
const configuredCoreBadge = coreConfig.recipe({
  base: 'inline-flex',
  variants: {
    tone: {
      danger: 'text-rose-700',
    },
  },
});

expectType<string>(coreBadge({ tone: 'info' }));
expectType<string>(configuredCoreBadge({ tone: 'danger' }));
expectType<'tone'[]>(coreVariantNames(coreBadge));
expectType<'info'[]>(coreVariantOptions(coreBadge, 'tone'));
expectError(coreConfig.styled);

type CoreBadgeVariants = VariantProps<typeof coreBadge>;
const coreBadgeVariants: CoreBadgeVariants = { tone: 'info' };
void coreBadgeVariants;

// Recipes created through `/core` must work with the package-root type helpers
// (and vice versa): the two entries ship separate declaration files.
expectType<{ readonly tone: 'info' }>({} as RootVariantProps<typeof coreBadge>);
expectType<{ readonly tone: 'info' }>(
  {} as RootResolvedVariantProps<typeof coreBadge>
);
expectType<'tone'>({} as RootVariantName<typeof coreBadge>);
expectType<'tone'[]>(rootVariantNames(coreBadge));
expectType<'info'[]>(rootVariantOptions(coreBadge, 'tone'));
expectAssignable<RootRecipeInput<typeof coreBadge>>({
  tone: 'info',
  className: 'extra',
});
expectError<RootRecipeInput<typeof coreBadge>>({ tone: 'danger' });
expectType<{ readonly tone: { readonly info: 'text-sky-700' } } | undefined>(
  ({} as RootRecipeConfigOf<typeof coreBadge>).variants
);

const coreTabs = coreRecipe({
  slots: { root: 'flex', icon: 'size-4' },
});
expectType<'root' | 'icon'>({} as RootSlotNames<typeof coreTabs>);

// Boolean variants and slotted recipes must survive the cross-entry
// comparison too (separately declared result types used to expand into a
// string index signature that rejected boolean variant values).
const coreToggle = coreRecipe({
  base: 'inline-flex',
  variants: {
    tone: { info: 'text-sky-700' },
    disabled: { true: 'opacity-50' },
  },
  defaultVariants: { disabled: false },
});
const coreToggleTabs = coreRecipe({
  slots: { root: 'flex', icon: 'size-4' },
  variants: { active: { true: { root: 'font-bold' } } },
});

expectAssignable<RootAnyRootRecipe>(coreToggle);
expectNotAssignable<RootAnySlotRecipe>(coreToggle);
expectAssignable<RootAnySlotRecipe>(coreToggleTabs);
expectNotAssignable<RootAnyRootRecipe>(coreToggleTabs);
expectAssignable<RootRecipeInput<typeof coreToggle>>({
  tone: 'info',
  disabled: true,
});
expectAssignable<RootRecipeInput<typeof coreToggleTabs>>({
  active: true,
  slotClassNames: { icon: 'size-5' },
});
expectType<boolean>(
  ({} as RootRecipeResolved<typeof coreToggle>).variants.disabled
);
expectType<'root' | 'icon'>({} as RootSlotNames<typeof coreToggleTabs>);

// Package-root recipes with the `/core` type helpers.
const buttonRecipe = rootRecipe({
  base: 'inline-flex',
  variants: {
    tone: {
      info: 'text-sky-700',
    },
  },
});
const rootTabs = rootRecipe({ slots: { root: 'flex' } });

expectType<{ readonly tone: 'info' }>({} as VariantProps<typeof buttonRecipe>);
expectType<'tone'[]>(coreVariantNames(buttonRecipe));
expectAssignable<CoreAnyRootRecipe>(buttonRecipe);
expectNotAssignable<CoreAnySlotRecipe>(buttonRecipe);
expectAssignable<CoreAnySlotRecipe>(rootTabs);
expectNotAssignable<CoreAnyRootRecipe>(rootTabs);

const reactConfig = defineRootConfig();
const { styled } = defineRootConfig();
const Button = styled('button', buttonRecipe);
const ConfiguredButton = reactConfig.styled('button', buttonRecipe);

expectType<StyledRender>(
  Button({
    tone: 'info',
    type: 'button',
    children: 'Info',
  })
);
expectType<StyledRender>(
  ConfiguredButton({
    tone: 'info',
    type: 'button',
    children: 'Info',
  })
);
