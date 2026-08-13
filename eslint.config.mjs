import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest }
    }
  },
  {
    files: ['tools/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node
    }
  },
  {
    rules: {
      'no-console': 'off',
      // `data.field && (payload.field = data.field)` is the established style for
      // building the optional gateway fields; it is deliberate, not a stray expression.
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true }]
    }
  },
  // Keep last: turns off every rule that would fight Prettier.
  prettier
);
