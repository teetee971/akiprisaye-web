import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

// Build-time metadata injected by Vite (Issue #0.2)
const BUILD_SHA: string = import.meta.env.VITE_BUILD_SHA ?? 'dev';
const BUILD_DATE: string = import.meta.env.VITE_BUILD_DATE ?? '';
const BUILD_ENV: string = import.meta.env.VITE_BUILD_ENV ?? 'development';

const APP_VERSIONS = [
  {
    version: 'v3.2.0',
    date: 'mars 2026',
    label: 'latest',
    description: 'Groupes de Parole Citoyens (Issue #7) : groupes de discussion par territoire, messagerie temps réel Firestore, partage de photos, modération IA automatique par filtre de mots-clés, signalement manuel. Affichage de la version, de l\'environnement et du hash Git dans le pied de page (Issue #0.2).',
    changelog: null,
  },
  {
    version: 'v3.1.1',
    date: 'mars 2026',
    label: null,
    description: 'ComparateursHub exhaustif (34+ liens), nouvelle section Ressources & Comprendre. Alignement de toutes les versions package.json du monorepo (root, frontend, backend, functions, price-api). Sitemap étendu à 60+ URLs. Footer multi-colonnes. manifest.webmanifest PWA corrigé.',
    changelog: '/CHANGELOG.md',
  },
  {
    version: 'v3.1.0',
    date: 'mars 2026',
    label: null,
    description: 'Messagerie interne Firebase (Firestore + onSnapshot). Indice Panier Vital (minutes de SMIC pour panier de 6 produits essentiels). Comparaison internationale Eurostat 2024 / OECD PPP 2024 / INSEE DOM 2023. Gamification (points, badges, classement). 32 snapshots Observatoire (nov. 2025 → mars 2026, 11 territoires). Validation EAN GS1. France métropolitaine ajoutée comme territoire de référence.',
    changelog: '/CHANGELOG.md',
  },
  {
    version: 'v3.0.1',
    date: 'février 2026',
    label: null,
    description: 'Correction timeout readiness Vite preview. Stabilisation pipeline CI/CD avec validation post-déploiement bloquante.',
    changelog: null,
  },
  {
    version: 'v2.1.0',
    date: 'janvier 2026',
    label: null,
    description: 'Product Insight System (OCR + analyse ingrédients). Product Dossier longitudinal. Ingredient Evolution. Export Open Data CSV/JSON. Cost of Living IEVR pour DOM-COM. Feature flags pour toutes les nouvelles fonctionnalités.',
    changelog: null,
  },
  {
    version: 'v2.0.0',
    date: 'décembre 2025',
    label: null,
    description: 'Comparateurs spécialisés (vols, bateaux, fret, carburants, assurances, formations, location voiture, matériaux BTP, télécoms, cosmétiques). Carte interactive multi-territoire. Assistant IA local. Gamification v1. Observatoire temps réel.',
    changelog: null,
  },
  {
    version: 'v1.9.0',
    date: 'novembre 2025',
    label: null,
    description: "Snapshots observatoire novembre 2025 : Guadeloupe, Martinique, Guyane, La Réunion, Mayotte, Polynésie, Nouvelle-Calédonie. Comparaison inter-territoires. Tableau de bord inflation multi-territoires.",
    changelog: null,
  },
  {
    version: 'v1.5.0',
    date: 'septembre 2025',
    label: null,
    description: 'Alertes prix automatiques. Liste de courses intelligente avec GPS. Comparateur citoyen participatif. Historique des prix avec courbes.',
    changelog: null,
  },
  {
    version: 'v1.2.0',
    date: 'mai 2025',
    label: null,
    description: 'Système de scan EAN-13/EAN-8 (Tesseract.js local). OCR tickets de caisse. Détection shrinkflation. Extension Martinique et Guyane.',
    changelog: null,
  },
  {
    version: 'v1.1',
    date: 'février 2025',
    label: null,
    description: 'Ajustement des libellés et clarification des sources publiques. Aucune extension territoriale.',
    changelog: null,
  },
  {
    version: 'v1.0',
    date: 'janvier 2025',
    label: null,
    description: 'Première mise en ligne du panier alimentaire citoyen. Données terrain Guadeloupe. Fichier statique vérifié manuellement.',
    changelog: null,
  },
];

export default function Versions() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet>
        <title>Versions — A KI PRI SA YÉ</title>
        <meta name="description" content="Historique complet des versions de l'application A KI PRI SA YÉ. Traçabilité des données et des fonctionnalités publiées." />
      </Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="space-y-2">
          <p className="text-sm text-blue-200 uppercase tracking-wide">Application citoyenne</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Historique &amp; versions</h1>
          <p className="text-slate-300 max-w-3xl">
            Traçabilité complète de l'application et de l'observatoire citoyen. Chaque version documente les fonctionnalités ajoutées, les données publiées et les corrections apportées.
          </p>
          <p className="text-sm text-slate-400">
            Version actuelle : <span className="font-semibold text-white">v3.2.0</span> — mars 2026 —{' '}
            <Link to="/comparateurs" className="text-blue-400 hover:text-blue-300 underline">Voir tous les comparateurs</Link>
          </p>
          {/* Build metadata (Issue #0.2) */}
          <p className="text-xs text-slate-600 font-mono">
            build: {BUILD_SHA || 'dev'}{BUILD_DATE ? ` · ${BUILD_DATE}` : ''} · env: {BUILD_ENV}
          </p>
        </header>

        <section className="space-y-4">
          {APP_VERSIONS.map((item) => (
            <div
              key={item.version}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start gap-4"
            >
              <div className="flex-shrink-0 flex flex-col items-start gap-1">
                <span className="font-bold text-white text-lg font-mono">{item.version}</span>
                <span className="text-xs text-slate-400">{item.date}</span>
                {item.label === 'latest' && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
                    Actuelle
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-slate-200 text-sm leading-relaxed">{item.description}</p>
                {item.changelog && (
                  <a
                    href={item.changelog}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Voir le changelog complet →
                  </a>
                )}
              </div>
            </div>
          ))}
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Notes de traçabilité</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>Pas d&apos;historique caché : seules les versions listées ici sont publiées.</li>
            <li>Les données de l&apos;observatoire sont accessibles dans <code className="font-mono">/public/data/observatoire/</code>.</li>
            <li>Aucune recommandation médicale ni conseil nutritionnel — données factuelles uniquement.</li>
            <li>Code source ouvert sur <a href="https://github.com/teetee971/akiprisaye-web" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noreferrer">GitHub</a>.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
