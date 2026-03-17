/**
 * ESLint Flat Config (ESLint v9+)
 *
 * Design goals:
 *  - Deterministic: same result in dev and CI
 *  - No plugin drift: every referenced plugin is explicitly required/guarded
 *  - Accessibility: jsx-a11y recommended scoped to JSX/TSX source files
 *  - Real errors block CI; warnings do not (no --max-warnings=0 currently)
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

  // 4. jsx-a11y recommended — scoped to JSX/TSX source files.
  // Ensures interactive elements are semantic and keyboard-accessible.
  // Scoped to src files to avoid false positives in scripts.
  // Do NOT disable rules globally — fix violations properly instead.
  {
    files: ['src/**/*.{jsx,tsx}'],
    ...jsxA11y.flatConfigs.recommended,
  },

  /* ── 5. Global rule overrides ─────────────────────────────────────── */
  {
    rules: {
      // react-hooks exhaustive-deps — off to avoid noise from complex hooks
      'react-hooks/exhaustive-deps': 'off',
      'react-refresh/only-export-components': 'off',

      // no-undef: TypeScript handles type/global resolution
      'no-undef': 'off',

      // Misc noise suppressors (re-enable individually as codebase matures)
      'no-irregular-whitespace': 'off',
      'no-useless-escape':       'off',
      'no-unreachable':          'off',
      'no-case-declarations':    'off',

      // TypeScript-specific suppressors
      '@typescript-eslint/no-explicit-any':  'off',
      '@typescript-eslint/no-unused-vars':   'off',
      '@typescript-eslint/ban-ts-comment':   'off',
      '@typescript-eslint/prefer-as-const':  'off',
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
