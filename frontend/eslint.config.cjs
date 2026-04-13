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
const tseslint    = require('typescript-eslint');
const jsxA11y     = require('eslint-plugin-jsx-a11y');

// Optional plugins — still load if present, skip gracefully if absent
let reactPlugin, reactHooksPlugin, reactRefreshPlugin;
try { reactPlugin        = require('eslint-plugin-react'); }        catch { /* optional */ }
try { reactHooksPlugin   = require('eslint-plugin-react-hooks'); }  catch { /* optional */ }
try { reactRefreshPlugin = require('eslint-plugin-react-refresh'); } catch { /* optional */ }

module.exports = [
  /* ── 1. Global ignores (replaces .eslintignore) ───────────────────── */
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/src_old/**',
      '**/src.bak.*/**',
      '**/.bak_*/**',
      '**/*.bak',
      '**/*.bak.*',
      '**/*.old',
      '**/.eslintcache',
    ],
  },

  /* ── 2. TypeScript base (applies to all linted files) ────────────── */
  ...tseslint.configs.recommended,

  /* ── 3. React plugins (optional, loaded if installed) ────────────── */
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

  /* ── 4. jsx-a11y recommended (full recommended config applied globally) ── */
  // Accessibilité (jsx-a11y) — recommandé, en 'warn' tant que la dette n'est pas soldée.
  // Ne pas désactiver : les violations restent visibles dans la sortie lint.
  // État avril 2026 : 0 violations dans tout le codebase.
  // Règles sans violation → passées en 'error' ; autres restent en 'warn' jusqu'à correction.
  jsxA11y.flatConfigs.recommended,
  {
    rules: {
      // Règles jsx-a11y : 0 violations — passées en 'error' (bloquant en CI).
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/no-autofocus': 'error',
      'jsx-a11y/no-noninteractive-tabindex': 'error',
      // Règles jsx-a11y rétrogradées en 'warn' (dette résiduelle).
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/img-redundant-alt': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/no-noninteractive-element-to-interactive-role': 'warn',
    },
  },

  /* ── 5. Global rule overrides ─────────────────────────────────────── */
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

  /* ── 6. Scripts / tests — relax node-specific rules ──────────────── */
  {
    files: ['scripts/**/*.{js,mjs}', 'src/test/**/*.{js,mjs,ts}', 'functions/**/*.{js,mjs,ts}'],
    rules: {
      'no-undef': 'off',
    },
  },
];
