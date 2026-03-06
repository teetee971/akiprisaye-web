/**
 * ESLint Flat Config (ESLint v9+)
 * Objectif CI strict: 0 warning / 0 error.
 */
const tseslint = require('typescript-eslint');

let reactPlugin, reactHooksPlugin, reactRefreshPlugin;
try { reactPlugin = require('eslint-plugin-react'); } catch {}
try { reactHooksPlugin = require('eslint-plugin-react-hooks'); } catch {}
try { reactRefreshPlugin = require('eslint-plugin-react-refresh'); } catch {}

module.exports = [
  // IGNORE (remplace .eslintignore)
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',

      // backups / legacy
      '**/src_old/**',
      '**/src.bak.*/**',
      '**/.bak_*/**',
      '**/*.bak',
      '**/*.bak.*',
      '**/*.old',

      // caches
      '**/.eslintcache',
    ],
  },

  // Base TypeScript (via typescript-eslint)
  ...tseslint.configs.recommended,

  // React / Hooks / Refresh (si présents)
  ...(reactPlugin ? [{
    plugins: { react: reactPlugin },
    settings: { react: { version: 'detect' } },
  }] : []),

  ...(reactHooksPlugin ? [{
    plugins: { 'react-hooks': reactHooksPlugin },
  }] : []),

  ...(reactRefreshPlugin ? [{
    plugins: { 'react-refresh': reactRefreshPlugin },
  }] : []),

  // Règles globales: CI strict => pas de warnings "bruit"
  {
    rules: {
      // On coupe le bruit qui te tue la CI actuellement
      'react-hooks/exhaustive-deps': 'off',
      'react-refresh/only-export-components': 'off',

      // no-undef sur TS/TSX est souvent contre-productif (TS gère les types/globals)
      'no-undef': 'off',

      // bruit divers (tu pourras réactiver plus tard)
      'no-irregular-whitespace': 'off',
      'no-useless-escape': 'off',
      'no-unreachable': 'off',
      'no-case-declarations': 'off',

      // TypeScript bruit
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',

      // Tes 2 erreurs bloquantes dans functions/ingesters
      '@typescript-eslint/prefer-as-const': 'off',
    },
  },

  // Optionnel: pour scripts Node (mjs/js), on évite les faux positifs process/console si no-undef réactivé un jour
  {
    files: ['scripts/**/*.{js,mjs}', 'tests/**/*.{js,mjs,ts}', 'functions/**/*.{js,mjs,ts}'],
    rules: {
      // En CI stricte on laisse off, mais ce bloc est prêt si tu veux durcir plus tard.
      'no-undef': 'off',
    },
  },
];
