import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

const scriptGlobals = {
  URL: 'readonly',
  console: 'readonly',
  fetch: 'readonly',
  module: 'readonly',
  performance: 'readonly',
  process: 'readonly',
  require: 'readonly',
  setTimeout: 'readonly',
};

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'bench/**'],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Allow {} type for type-level programming
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    files: ['test/**/*.ts', 'test/**/*.tsx', 'test/**/*.mts', 'test/**/*.cts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs', 'scripts/**/*.cjs'],
    languageOptions: {
      globals: scriptGlobals,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  }
);
