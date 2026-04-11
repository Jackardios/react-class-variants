import type { ReactNode } from 'react';
import { expectError, expectType } from 'tsd';
import {
  defineConfig as defineCoreConfig,
  recipe as coreRecipe,
  type VariantProps,
} from '../../../dist/core';
import {
  defineConfig as defineReactConfig,
  recipe as reactRecipe,
  styled,
} from '../../../dist/react';

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

const reactConfig = defineReactConfig();
const buttonRecipe = reactRecipe({
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
