import type { ReactNode } from 'react';
import { expectError, expectType } from 'tsd';
import {
  defineConfig as defineRootConfig,
  recipe as rootRecipe,
} from '../../../dist';
import {
  defineConfig as defineCoreConfig,
  recipe as coreRecipe,
  type VariantProps,
} from '../../../dist/core';

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
expectError(coreConfig.styled);

type CoreBadgeVariants = VariantProps<typeof coreBadge>;
const coreBadgeVariants: CoreBadgeVariants = { tone: 'info' };
void coreBadgeVariants;

const reactConfig = defineRootConfig();
const { styled } = defineRootConfig();
const buttonRecipe = rootRecipe({
  base: 'inline-flex',
  variants: {
    tone: {
      info: 'text-sky-700',
    },
  },
});
const Button = styled('button', buttonRecipe);
const ConfiguredButton = reactConfig.styled('button', buttonRecipe);

expectType<ReactNode>(
  Button({
    tone: 'info',
    type: 'button',
    children: 'Info',
  })
);
expectType<ReactNode>(
  ConfiguredButton({
    tone: 'info',
    type: 'button',
    children: 'Info',
  })
);
