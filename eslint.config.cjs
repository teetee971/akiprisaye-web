// eslint.config.cjs  (Flat config, supporting ES modules)

module.exports = [
  {
    ignores: [
      '**/node_modules/**', 
      '**/dist/**', 
      '**/build/**',
      '**/a-ki-pri-sa-ye-functional/**',
      '**/a-ki-pri-sa-ye-darkness-pro/**',
      '**/worker_api/**',
      '**/functions/**',
      'importFromExportedJson.js',
      'importFromExportedJson.mjs',
      'src/compare-live.js'
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2022,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        sourceType: 'module'
      }
    },
    rules: {
      'max-len': 'off',
      'object-curly-spacing': 'off',
      'comma-dangle': 'off',
      'no-unused-vars': 'warn',
      'no-undef': 'off'
    },
  },
];

