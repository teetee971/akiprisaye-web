// eslint.config.cjs  (Flat config, supporting ES modules)

module.exports = [
  {
    ignores: [
      '**/node_modules/**', 
      '**/dist/**', 
      '**/build/**',
      '**/a-ki-pri-sa-ye-functional/**',
      '**/a-ki-pri-sa-ye-darkness-pro/**'
    ]
  },
  {
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2022,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly'
      }
    },
    rules: {
      'max-len': 'off',
      'object-curly-spacing': 'off',
      'comma-dangle': 'off',
    }
  }
];

