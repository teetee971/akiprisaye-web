// eslint.config.cjs - Configuration pour le projet React
module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**', 
      '**/build/**',
      '**/*.min.js',
      'functions/**'
    ],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2022,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly'
      }
    },
    rules: {
      'max-len': 'off',
      'object-curly-spacing': 'off',
      'comma-dangle': 'off',
      'no-unused-vars': 'warn',
      'no-console': 'off'
    },
  },
];

