import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      // Legacy / tooling scripts (non frontend)
      'scanner.js',
      'scripts/**',

      // Build / cache
      'dist/**',
      'node_modules/**',

      // Reports & audits
      'audit-reports/**',
    ],
  },

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsparser,
      globals: {
        // Browser APIs
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        crypto: 'readonly',
        ImageData: 'readonly',
        ImageBitmap: 'readonly',
        ImageBitmapOptions: 'readonly',
        createImageBitmap: 'readonly',
        HTMLImageElement: 'readonly',
        TextEncoder: 'readonly',
        AbortController: 'readonly',
        Response: 'readonly',
        URLSearchParams: 'readonly',
        alert: 'readonly',
        Storage: 'readonly',

        // Test globals
        global: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        jest: 'readonly',

        // Node globals
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // React / JSX
      'react/react-in-jsx-scope': 'off',

      // Safety - downgraded to warnings
      'no-unused-vars': 'off', // Disabled in favor of TypeScript version
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-useless-escape': 'warn',

      // TypeScript rules - downgraded to warnings
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',

      // General sanity
      'no-undef': 'error',
    },
  },
];