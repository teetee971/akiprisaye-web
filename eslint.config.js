import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    ignores: [
      'node_modules/**',
      'dist/**',
      'scripts/**',  // Allow console.log in scripts
      'functions/**', // Allow console in cloud functions
      '**/*.test.js', // Allow console in tests
      'vite.config.js',
    ],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        // Node globals
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        vi: 'readonly', // Vitest
      },
    },
    rules: {
      'no-console': ['error', { allow: ['error', 'warn'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['scripts/**/*.js', 'functions/**/*.js', '**/*.test.js'],
    rules: {
      'no-console': 'off', // Allow console in scripts, functions, and tests
    },
  },
];
