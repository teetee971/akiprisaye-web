import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint. config(
  { 
    ignores: [
      'dist',
      'node_modules',
      '**/*.config.js',
      'vite.config.*',
      
      // Fichiers legacy/tools
      'scanner.js',
      'scripts/**', // Ignorer TOUT le dossier scripts
      'src/components/ErrorBoundary.jsx',
      'src/components/Header.jsx',
      'src/main. jsx',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*. {ts,tsx,js,jsx}'],
    languageOptions:  {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules:  {
      ...reactHooks. configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    // TODO(CI-TECH-DEBT-ESLINT-001): Réduire la liste de fichiers legacy après correction des hooks.
    // Assouplissement ciblé pour warnings connus (react-hooks/exhaustive-deps) en V1.
    files: [
      'src/components/BarcodeScanner.tsx',
      'src/pages/ScanEAN.tsx',
      'src/pages/ScanOCR.tsx',
    ],
    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },
)
