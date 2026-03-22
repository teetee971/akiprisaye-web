// lighthouserc.cjs — Lighthouse Guard V2
//
// Politique de sévérité (intentionnelle) :
//   performance  : warn  à 0.55 — le score de base est ~52, un seuil error bloquerait
//                  immédiatement. La performance remonte progressivement via les
//                  optimisations frontend (lazy-loading, compression images, etc.).
//                  Objectif à moyen terme : passer en error à 0.65 une fois 70+ stable.
//   accessibilité: error à 0.95 — non négociable (WCAG 2.1, obligation légale).
//   best-practices: error à 1.0 — garantit la qualité technique (HTTPS, console errors…).
//   SEO          : error à 1.0 — critique pour le référencement organique.
//
// Ce fichier est utilisé par le job lighthouse de .github/workflows/ci.yml (V2).
// Le serveur preview est démarré séparément (npm run preview -- --port 4173)
// avant l'invocation de lhci autorun.
module.exports = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:4173/'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['warn', { minScore: 0.55 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'interactive': ['warn', { maxNumericValue: 5000 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-results',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
  },
};
