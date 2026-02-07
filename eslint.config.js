import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'scanner.js',
      'scripts/**',
      'backend/**',
      'functions/**',
      'extension/**',

      // Build / cache
      'dist/**',
      'node_modules/**',
      'Assets/**',

      // Reports & audits
      'audit-reports/**',
      
      // Generated/library files
      'frontend/public/tesseract-core-simd.wasm.js',
      'frontend/public/tesseract-core.wasm.js',
      
      // Service worker files (use different globals)
      '**/service-worker.js',
      'frontend/public/service-worker.js',
      
      // TypeScript declaration files
      '**/*.d.ts',
      
      // Legacy scripts with non-standard syntax
      'frontend/src/scripts/**',
      'src/scripts/**',
      
      // Old/backup directories
      '**/src_old/**',
      'frontend/src_old/**',
    ],
  },

  // Configuration for TypeScript files - no-undef disabled as TypeScript handles this
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser APIs
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        crypto: 'readonly',
        ImageData: 'readonly',
        ImageBitmap: 'readonly',
        ImageBitmapOptions: 'readonly',
        createImageBitmap: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLLabelElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLDivElement: 'readonly',
        Image: 'readonly',
        TextEncoder: 'readonly',
        AbortController: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        URLSearchParams: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        Storage: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        StorageEvent: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        navigator: 'readonly',
        Element: 'readonly',
        MouseEvent: 'readonly',
        Event: 'readonly',
        MediaStream: 'readonly',
        MediaStreamConstraints: 'readonly',
        PermissionName: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        FileReader: 'readonly',
        WebAssembly: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        regeneratorRuntime: 'readonly',
        MessageChannel: 'readonly',
        indexedDB: 'readonly',
        postMessage: 'readonly',
        performance: 'readonly',

        // Additional DOM types needed for TypeScript
        File: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLElement: 'readonly',
        KeyboardEvent: 'readonly',
        GeolocationPosition: 'readonly',
        GeolocationPositionError: 'readonly',
        AbortSignal: 'readonly',
        PermissionState: 'readonly',
        IDBDatabase: 'readonly',
        IDBOpenDBRequest: 'readonly',
        IDBRequest: 'readonly',

        // Service Worker APIs
        self: 'readonly',
        caches: 'readonly',

        // Chrome Extension APIs
        chrome: 'readonly',

        // Test globals
        global: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        jest: 'readonly',

        // Node globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        Buffer: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // React / JSX
      'react/react-in-jsx-scope': 'off',

      // Safety - downgraded to warnings
      'no-unused-vars': 'off', // Disabled in favor of TypeScript version
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-useless-escape': 'warn',

      // TypeScript rules - downgraded to warnings
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',

      // Disable no-undef for TypeScript - TypeScript compiler handles this better
      'no-undef': 'off',
    },
  },

  // Configuration for JavaScript/JSX files only - keep no-undef enabled
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser APIs
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        crypto: 'readonly',
        ImageData: 'readonly',
        ImageBitmap: 'readonly',
        ImageBitmapOptions: 'readonly',
        createImageBitmap: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLLabelElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLDivElement: 'readonly',
        Image: 'readonly',
        TextEncoder: 'readonly',
        AbortController: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        URLSearchParams: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        Storage: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        StorageEvent: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        navigator: 'readonly',
        Element: 'readonly',
        MouseEvent: 'readonly',
        Event: 'readonly',
        MediaStream: 'readonly',
        MediaStreamConstraints: 'readonly',
        PermissionName: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        FileReader: 'readonly',
        WebAssembly: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        regeneratorRuntime: 'readonly',
        MessageChannel: 'readonly',
        indexedDB: 'readonly',
        postMessage: 'readonly',
        performance: 'readonly',

        // Service Worker APIs
        self: 'readonly',
        caches: 'readonly',

        // Chrome Extension APIs
        chrome: 'readonly',

        // Test globals
        global: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        jest: 'readonly',

        // Node globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        Buffer: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',

      // Safety - downgraded to warnings
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-useless-escape': 'warn',

      // Keep no-undef strict for JavaScript files
      'no-undef': 'error',
      'no-useless-escape': 'error',
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        global: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        test: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        vi: 'readonly',
        vitest: 'readonly',
      },
    },
  },
];