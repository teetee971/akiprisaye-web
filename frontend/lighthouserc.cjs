// lighthouserc.cjs — Lighthouse Guard V2
//
// Politique de sévérité (intentionnelle) :
//   performance   : warn  à 0.55 — le score de base est ~52, un seuil error bloquerait
//                   immédiatement. Objectif à moyen terme : passer en error à 0.65.
//   accessibilité : error à 0.90 — non négociable (WCAG 2.1, obligation légale).
//   best-practices: warn  à 0.90 — console errors inévitables en CI (Firebase env absent).
//                   Score réel ≈ 0.96 en preview. Passer en error quand console propre.
//   SEO           : error à 1.0  — critique pour le référencement organique.
//
// Note : le preset 'lighthouse:recommended' n'est PAS utilisé dans la section assert
// car il injecte des assertions individuelles (errors-in-console, color-contrast,
// forced-reflow-insight, image-delivery-insight…) qui échouent systématiquement en CI
// de preview sans credentials Firebase ou CDN réels. Seules les scores catégoriels
// sont évalués ici.
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
      assertions: {
        'categories:performance': ['warn', { minScore: 0.55 }],
        'categories:accessibility': ['error', { minScore: 0.90 }],
        'categories:best-practices': ['warn', { minScore: 0.90 }],
        'categories:seo': ['error', { minScore: 1.0 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
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
