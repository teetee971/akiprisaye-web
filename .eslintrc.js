/**
 * ESLint Configuration for A KI PRI SA YÉ
 * 
 * This configuration enforces code quality and best practices
 * for JavaScript and React code in the project.
 */

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react'],
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
    'react/jsx-uses-react': 'off', // Not needed with new JSX transform
    'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
    'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
  },
  overrides: [
    {
      // Service Worker files
      files: ['**/service-worker.js', '**/sw.js'],
      env: {
        serviceworker: true,
        browser: false,
      },
    },
    {
      // Node.js scripts
      files: ['scripts/**/*.js', 'functions/**/*.js'],
      env: {
        node: true,
        browser: false,
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.firebase/',
    '*.min.js',
    'public/assets/',
  ],
};
