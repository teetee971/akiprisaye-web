// functions/eslint.config.cjs  (Flat config, CommonJS)

module.exports = [
  {
    ignores: ['**/node_modules/**'],
    languageOptions: {
      sourceType: 'commonjs',
      ecmaVersion: 2021,
    },
    rules: {
      'max-len': 'off',
      'object-curly-spacing': 'off',
      'comma-dangle': 'off',
    },
  },
];

