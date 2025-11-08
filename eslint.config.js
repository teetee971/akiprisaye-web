import js from '@eslint/js';
import react from 'eslint-plugin-react';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        // Node globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Possible Errors
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // Best Practices
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
      'prefer-arrow-callback': 'warn',

      // Security
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Code Style
      'semi': ['error', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'comma-dangle': ['warn', 'always-multiline'],
      'object-curly-spacing': ['warn', 'always'],
      'array-bracket-spacing': ['warn', 'never'],

      // React Specific
      'react/prop-types': 'warn',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
    },
  },
  {
    // Service Worker files
    files: ['**/service-worker.js', '**/sw.js', 'public/service-worker.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        caches: 'readonly',
        clients: 'readonly',
        skipWaiting: 'readonly',
        URL: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        fetch: 'readonly',
      },
    },
  },
  {
    // Cloudflare Workers/Pages Functions
    files: ['functions/**/*.js'],
    languageOptions: {
      globals: {
        Request: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Headers: 'readonly',
        fetch: 'readonly',
        addEventListener: 'readonly',
        caches: 'readonly',
      },
    },
  },
  {
    // Node.js scripts - allow console.log
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'writable',
        require: 'readonly',
        exports: 'writable',
        Buffer: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // Allow console in scripts
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '.firebase/',
      '*.min.js',
      'public/assets/',
      'importFromExportedJson.mjs', // Admin script with import assertions
    ],
  },
];
