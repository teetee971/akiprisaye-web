// eslint.config.cjs  (Flat config, supporting ES modules)

module.exports = [
  {
    ignores: [
      '**/node_modules/**', 
      '**/dist/**', 
      '**/build/**',
      '**/a-ki-pri-sa-ye-functional/**',
      '**/a-ki-pri-sa-ye-darkness-pro/**'
    ],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2022,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      'max-len': 'off',
      'object-curly-spacing': 'off',
      'comma-dangle': 'off',
    },
  },
];

