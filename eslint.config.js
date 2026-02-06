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
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      // React / JSX
      'react/react-in-jsx-scope': 'off',

      // Safety
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',

      // General sanity
      'no-undef': 'error',
    },
  },
];