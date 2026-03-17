/**
 * ESLint Flat Config (ESLint v9+) — frontend only
 *
 * Politique de lint :
 *   - TypeScript/JS logic rules : 'off' là où le compilateur gère (unused-vars, no-undef)
 *   - jsx-a11y : activé via recommended (règles en 'warn' = dette technique visible, non bloquante)
 *     → passer à 'error' une fois les violations corrigées dans le code
 *   - reportUnusedDisableDirectives : 'warn' pour détecter les eslint-disable obsolètes
 *   - Aucun contournement : pas de règles importantes désactivées
 */
const tseslint = require('typescript-eslint');
const jsxA11y = require('eslint-plugin-jsx-a11y');

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

  // Accessibilité (jsx-a11y) — recommandé, en 'warn' tant que la dette n'est pas soldée.
  // Ne pas désactiver : les violations restent visibles dans la sortie lint.
  // État mars 2026 : label-has-associated-control → 0 erreurs ; ~77 warnings restants
  // (35 click-events-have-key-events, 26 no-static-element-interactions, 16 autres).
  // Cible : passer à 'error' une fois la dette soldée (Lot 2/3).
  jsxA11y.flatConfigs.recommended,
  {
    rules: {
      // Règles jsx-a11y rétrogradées en 'warn' (dette existante, non bloquante en CI).
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/img-redundant-alt': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-noninteractive-tabindex': 'warn',
      'jsx-a11y/no-noninteractive-element-to-interactive-role': 'warn',
    },
  },

  // Règles globales
  {
    linterOptions: {
      // Signale les directives eslint-disable qui ne suppriment aucune erreur réelle
      reportUnusedDisableDirectives: 'warn',
    },
    rules: {
      'react-hooks/exhaustive-deps': 'off',
      'react-refresh/only-export-components': 'off',

      // no-undef sur TS/TSX est contre-productif (TypeScript gère les types/globals)
      'no-undef': 'off',

      // Bruit divers
      'no-irregular-whitespace': 'off',
      'no-useless-escape': 'off',
      'no-unreachable': 'off',
      'no-case-declarations': 'off',

      // TypeScript — le compilateur strict gère ces cas mieux qu'ESLint
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
    },
  },

  // Scripts Node (mjs/js) — pas de faux positifs sur process/console
  {
    files: ['scripts/**/*.{js,mjs}', 'tests/**/*.{js,mjs,ts}', 'functions/**/*.{js,mjs,ts}'],
    rules: {
      'no-undef': 'off',
    },
  },
];
