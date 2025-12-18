import js from '@eslint/js';
import react from 'eslint-plugin-react';

export default [
  // Base ESLint recommended config
  js.configs.recommended,
  
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.firebase/**',
      '*.min.js',
      'public/assets/**',
      'Assets/**',  // Vite build artifacts
      '**/*.min.js',
      '**/*.bundle.js',
      '**/akiprisaye_web/**',
      '**/akiprisaye_web_final_full_*/**',
      '**/test_extract/**',
      '**/SentinelQuantumVanguardAIPro/**',
    ],
  },
  
  // Main configuration for all JavaScript files
  {
    files: ['**/*.js', '**/*.jsx'],
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
        FormData: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        location: 'readonly',
        history: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        DOMException: 'readonly',
        Element: 'readonly',
        HTMLElement: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        TouchEvent: 'readonly',
        PointerEvent: 'readonly',
        DragEvent: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        Image: 'readonly',
        // Node.js globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        // Firebase globals
        firebase: 'readonly',
        // Google Maps globals
        google: 'readonly',
        // Application specific globals
        sourcesMetadata: 'readonly',
        inseeIPC: 'readonly',
        revenusReference: 'readonly',
        opmrGuadeloupe: 'readonly',
      },
    },
    plugins: {
      react,
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
      'react/jsx-uses-react': 'off', // Not needed with new JSX transform
      'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
      'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  
  // Service Worker specific configuration
  {
    files: ['**/service-worker.js', '**/sw.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        caches: 'readonly',
        clients: 'readonly',
        registration: 'readonly',
        skipWaiting: 'readonly',
      },
    },
  },
  
  // Node.js scripts configuration (backend only)
  {
    files: [
      'scripts/validate-data.js',
      'scripts/extract-sirene.js',
      'scripts/convert-store-territories.js',
      'scripts/auto-import-stores.js',
      'scripts/check-assets.js',
      'scripts/**/generate-*.mjs',
      'scripts/**/sync-*.mjs',
      'scripts/**/verify-*.mjs',
      'scripts/**/purgecss-*.mjs',
      'scripts/**/auto-fix-*.mjs',
      'functions/**/*.js',
      'backend/**/*.js',
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
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        fetch: 'readonly',
        // Cloudflare Workers / Edge runtime globals
        Response: 'readonly',
        Request: 'readonly',
        URL: 'readonly',
        Headers: 'readonly',
        FormData: 'readonly',
      },
    },
  },
  
  // React components configuration
  {
    files: ['src/**/*.jsx', 'src/**/*.js'],
    languageOptions: {
      globals: {
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
  },
];
