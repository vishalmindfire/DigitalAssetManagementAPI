import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import perfectionist from 'eslint-plugin-perfectionist';
import pluginJest from 'eslint-plugin-jest';

export default tseslint.config(
  {
    ignores: ['**/*.js'],
  },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  tseslint.configs.recommendedTypeChecked,
  {
    rules: {
      'no-console': ['error'],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: './tsconfig.json',
      },
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    plugins: { jest: pluginJest },
  }
);
