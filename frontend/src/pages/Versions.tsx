import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// Build-time metadata injected by Vite (Issue #0.2)
const BUILD_SHA: string = import.meta.env.VITE_BUILD_SHA ?? 'dev';
const BUILD_DATE: string = import.meta.env.VITE_BUILD_DATE ?? '';
const BUILD_ENV: string = import.meta.env.VITE_BUILD_ENV ?? 'development';

const APP_VERSIONS = [
  {
    version: 'v3.3.0',
    date: 'mars 2026',
    label: 'latest',
    description: 'Calculateur Bâtiment BTP complet — 6 catégories, 20 calculateurs couvrant tous les corps de métier (FFB/ONISEP) : maçonnerie, dalle, fondations, chape, carrelage, peinture, enduit, tôles, terrassement, clôture, électricité (NF C 15-100), plomberie, isolation thermique (RT2020), charpente bois, plâtrerie BA13, parquet, gouttières/zinguerie, menuiserie extérieure. Images Unsplash réalistes sur toutes les tuiles catégories et calculateurs.',
    changelog: null,
  },
  {
    version: 'v3.2.0',
    date: 'mars 2026',
    label: null,
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
              <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/versions" />
        <link rel="alternate" hrefLang="fr" href="https://teetee971.github.io/akiprisaye-web/versions" />
        <link rel="alternate" hrefLang="x-default" href="https://teetee971.github.io/akiprisaye-web/versions" />
      </Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <HeroImage
        src={PAGE_HERO_IMAGES.versions}
        alt="Versions & Changelog"
        gradient="from-slate-950 to-slate-800"
        height="h-40 sm:h-52"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
          📋 Versions & Changelog
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
          Historique des évolutions de la plateforme
        </p>
      </HeroImage>

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
