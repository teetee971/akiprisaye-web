import js from '@eslint/js';
import react from 'eslint-plugin-react';

export default [
  // ======================================================
  // Base ESLint recommended
  // ======================================================
  js.configs.recommended,

  // ======================================================
  // Global ignores
  // ======================================================
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.firebase/**',
      '*.min.js',
      'public/assets/**',
      'Assets/**',
      'akiprisaye_web/**',
      'akiprisaye_web_final_full_*/**',
      'test_extract/**',
      'SentinelQuantumVanguardAIPro/**',
    ],
  },

  // ======================================================
  // Main browser / React code
  // ======================================================
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        location: 'readonly',
        history: 'readonly',
        Event: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',

        // Third-party
        google: 'readonly',

        // Firebase
        firebase: 'readonly',
      },
    },
    plugins: { react },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
      'prefer-arrow-callback': 'warn',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'semi': ['error', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'comma-dangle': ['warn', 'always-multiline'],
      'object-curly-spacing': ['warn', 'always'],
      'array-bracket-spacing': ['warn', 'never'],
      'react/prop-types': 'warn',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // ======================================================
  // Scan module — Web Worker / Service Worker / OCR
  // ======================================================
  {
    files: ['public/scan/**/*.js'],
    languageOptions: {
      globals: {
        // Web Worker
        self: 'readonly',
        importScripts: 'readonly',
        Worker: 'readonly',

        // OCR
        Tesseract: 'readonly',

        // Service Worker / PWA
        caches: 'readonly',
        clients: 'readonly',

        // Browser fallback
        window: 'readonly',
        document: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
      'no-restricted-globals': 'off',
    },
  },

  // ======================================================
  // Service workers (generic)
  // ======================================================
  {
    files: ['**/service-worker.js', '**/sw.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        caches: 'readonly',
        clients: 'readonly',
        skipWaiting: 'readonly',
        registration: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },

  // ======================================================
  // Node / scripts / backend
  // ======================================================
  {
    files: [
      'scripts/**/*.js',
      'scripts/**/*.mjs',
      'functions/**/*.js',
      'backend/**/*.js',
      '**/*.mjs',
    ],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',

        // Edge / Workers
        Response: 'readonly',
        Request: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
  },
];
