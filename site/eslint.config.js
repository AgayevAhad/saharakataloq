import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: [
      'src/**/*.{ts,tsx}',
      'tests/**/*.{ts,tsx,js,mjs}',
      'scripts/**/*.mjs',
      'server.mjs',
      'vite.config.ts',
      'playwright.config.ts',
      'eslint.config.js',
      'backend/**/*.{js,mjs}',
      '../backend/**/*.{js,mjs}',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        DOMException: 'readonly',
        AbortController: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        console: 'readonly',
        process: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLSpanElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLElement: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-console': 'off',
      'no-undef': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      'public/**',
      'data/**',
      '.ladle/**',
      'coverage/**',
      '*.sqlite*',
    ],
  },
];
