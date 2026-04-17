import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

const BASE_URL = import.meta.env.BASE_URL;

const dataFiles = [
  {
    name: 'prix-panier-base.json',
    path: `${BASE_URL}data/observatoire/prix-panier-base.json`,
    description: 'Panier de référence observatoire (prix moyens par produit).',
    territory: 'Outre-mer – panier type',
    period: 'Mise à jour mensuelle (2026)',
    source: 'Relevés citoyens et publications officielles',
  },
  // Guadeloupe
  {
    name: 'guadeloupe_2026-03.json',
    path: `${BASE_URL}data/observatoire/guadeloupe_2026-03.json`,
    description: 'Observation mensuelle Guadeloupe – relevés agrégés.',
    territory: 'Guadeloupe',
    period: 'Mars 2026',
    source: 'Open-data locale + collectes terrain',
  },
  {
    name: 'guadeloupe_2026-02.json',
    path: `${BASE_URL}data/observatoire/guadeloupe_2026-02.json`,
    description: 'Observation mensuelle Guadeloupe – relevés agrégés.',
    territory: 'Guadeloupe',
    period: 'Février 2026',
    source: 'Open-data locale + collectes terrain',
  },
  {
    name: 'guadeloupe_2026-01.json',
    path: `${BASE_URL}data/observatoire/guadeloupe_2026-01.json`,
    description: 'Observation mensuelle Guadeloupe – relevés agrégés.',
    territory: 'Guadeloupe',
    period: 'Janvier 2026',
    source: 'Open-data locale + collectes terrain',
  },
  // Martinique
  {
    name: 'martinique_2026-03.json',
    path: `${BASE_URL}data/observatoire/martinique_2026-03.json`,
    description: 'Observation mensuelle Martinique – relevés agrégés.',
    territory: 'Martinique',
    period: 'Mars 2026',
    source: 'Open-data locale + collectes terrain',
  },
  {
    name: 'martinique_2026-02.json',
    path: `${BASE_URL}data/observatoire/martinique_2026-02.json`,
    description: 'Observation mensuelle Martinique – relevés agrégés.',
    territory: 'Martinique',
    period: 'Février 2026',
    source: 'Open-data locale + collectes terrain',
  },
  {
    name: 'martinique_2026-01.json',
    path: `${BASE_URL}data/observatoire/martinique_2026-01.json`,
    description: 'Observation mensuelle Martinique – relevés agrégés.',
    territory: 'Martinique',
    period: 'Janvier 2026',
    source: 'Open-data locale + collectes terrain',
  },
  // Guyane
  {
    name: 'guyane_2026-03.json',
    path: `${BASE_URL}data/observatoire/guyane_2026-03.json`,
    description: 'Observation mensuelle Guyane française – relevés agrégés.',
    territory: 'Guyane française',
    period: 'Mars 2026',
    source: 'Open-data locale + collectes terrain',
  },
  {
    name: 'guyane_2026-02.json',
    path: `${BASE_URL}data/observatoire/guyane_2026-02.json`,
    description: 'Observation mensuelle Guyane française – relevés agrégés.',
    territory: 'Guyane française',
    period: 'Février 2026',
    source: 'Open-data locale + collectes terrain',
  },
  {
    name: 'guyane_2026-01.json',
    path: `${BASE_URL}data/observatoire/guyane_2026-01.json`,
    description: 'Observation mensuelle Guyane française – relevés agrégés.',
    territory: 'Guyane française',
    period: 'Janvier 2026',
    source: 'Open-data locale + collectes terrain',
  },
  // La Réunion
  {
    name: 'la_réunion_2026-03.json',
    path: `${BASE_URL}data/observatoire/la_r%C3%A9union_2026-03.json`,
    description: 'Observation mensuelle La Réunion – relevés agrégés.',
    territory: 'La Réunion',
    period: 'Mars 2026',
    source: 'Open-data locale + collectes terrain',
  },
  {
    name: 'la_réunion_2026-02.json',
    path: `${BASE_URL}data/observatoire/la_r%C3%A9union_2026-02.json`,
    description: 'Observation mensuelle La Réunion – relevés agrégés.',
    territory: 'La Réunion',
    period: 'Février 2026',
    source: 'Open-data locale + collectes terrain',
  },
  {
    name: 'la_réunion_2026-01.json',
    path: `${BASE_URL}data/observatoire/la_r%C3%A9union_2026-01.json`,
    description: 'Observation mensuelle La Réunion – relevés agrégés.',
    territory: 'La Réunion',
    period: 'Janvier 2026',
    source: 'Open-data locale + collectes terrain',
  },
  // Mayotte
  {
    name: 'mayotte_2026-03.json',
    path: `${BASE_URL}data/observatoire/mayotte_2026-03.json`,
    description: 'Observation mensuelle Mayotte – relevés agrégés.',
    territory: 'Mayotte',
    period: 'Mars 2026',
    source: 'Open-data locale + collectes terrain',
  },
  {
    name: 'mayotte_2026-02.json',
    path: `${BASE_URL}data/observatoire/mayotte_2026-02.json`,
    description: 'Observation mensuelle Mayotte – relevés agrégés.',
    territory: 'Mayotte',
    period: 'Février 2026',
    source: 'Open-data locale + collectes terrain',
  },
  {
    name: 'mayotte_2026-01.json',
    path: `${BASE_URL}data/observatoire/mayotte_2026-01.json`,
    description: 'Observation mensuelle Mayotte – relevés agrégés.',
    territory: 'Mayotte',
    period: 'Janvier 2026',
    source: 'Open-data locale + collectes terrain',
  },
  // France métropolitaine
  {
    name: 'hexagone_2026-03.json',
    path: `${BASE_URL}data/observatoire/hexagone_2026-03.json`,
    description: 'Observation mensuelle France métropolitaine – référence comparaison.',
    territory: 'France métropolitaine',
    period: 'Mars 2026',
    source: 'Open-data locale + collectes terrain',
  },
  {
    name: 'hexagone_2026-02.json',
    path: `${BASE_URL}data/observatoire/hexagone_2026-02.json`,
    description: 'Observation mensuelle France métropolitaine – référence comparaison.',
    territory: 'France métropolitaine',
    period: 'Février 2026',
    source: 'Open-data locale + collectes terrain',
  },
  {
    name: 'hexagone_2026-01.json',
    path: `${BASE_URL}data/observatoire/hexagone_2026-01.json`,
    description: 'Observation mensuelle France métropolitaine – référence comparaison.',
    territory: 'France métropolitaine',
    period: 'Janvier 2026',
    source: 'Open-data locale + collectes terrain',
  },
  // Saint-Martin
  {
    name: 'saint_martin_2026-03.json',
    path: `${BASE_URL}data/observatoire/saint_martin_2026-03.json`,
    description: 'Observation mensuelle Saint-Martin – relevés agrégés.',
    territory: 'Saint-Martin',
    period: 'Mars 2026',
    source: 'Relevés citoyens terrain',
  },
  {
    name: 'saint_martin_2026-02.json',
    path: `${BASE_URL}data/observatoire/saint_martin_2026-02.json`,
    description: 'Observation mensuelle Saint-Martin – relevés agrégés.',
    territory: 'Saint-Martin',
    period: 'Février 2026',
    source: 'Relevés citoyens terrain',
  },
  {
    name: 'saint_martin_2026-01.json',
    path: `${BASE_URL}data/observatoire/saint_martin_2026-01.json`,
    description: 'Observation mensuelle Saint-Martin – relevés agrégés.',
    territory: 'Saint-Martin',
    period: 'Janvier 2026',
    source: 'Relevés citoyens terrain',
  },
  // Saint-Barthélemy
  {
    name: 'saint_barthelemy_2026-03.json',
    path: `${BASE_URL}data/observatoire/saint_barthelemy_2026-03.json`,
    description: 'Observation mensuelle Saint-Barthélemy – relevés agrégés.',
    territory: 'Saint-Barthélemy',
    period: 'Mars 2026',
    source: 'Relevés citoyens terrain',
  },
  {
    name: 'saint_barthelemy_2026-02.json',
    path: `${BASE_URL}data/observatoire/saint_barthelemy_2026-02.json`,
    description: 'Observation mensuelle Saint-Barthélemy – relevés agrégés.',
    territory: 'Saint-Barthélemy',
    period: 'Février 2026',
    source: 'Relevés citoyens terrain',
  },
  {
    name: 'saint_barthelemy_2026-01.json',
    path: `${BASE_URL}data/observatoire/saint_barthelemy_2026-01.json`,
    description: 'Observation mensuelle Saint-Barthélemy – relevés agrégés.',
    territory: 'Saint-Barthélemy',
    period: 'Janvier 2026',
    source: 'Relevés citoyens terrain',
  },
  // Saint-Pierre-et-Miquelon
  {
    name: 'saint_pierre_et_miquelon_2026-03.json',
    path: `${BASE_URL}data/observatoire/saint_pierre_et_miquelon_2026-03.json`,
    description: 'Observation mensuelle Saint-Pierre-et-Miquelon – relevés agrégés.',
    territory: 'Saint-Pierre-et-Miquelon',
    period: 'Mars 2026',
    source: 'Relevés citoyens terrain',
  },
  {
    name: 'saint_pierre_et_miquelon_2026-02.json',
    path: `${BASE_URL}data/observatoire/saint_pierre_et_miquelon_2026-02.json`,
    description: 'Observation mensuelle Saint-Pierre-et-Miquelon – relevés agrégés.',
    territory: 'Saint-Pierre-et-Miquelon',
    period: 'Février 2026',
    source: 'Relevés citoyens terrain',
  },
  {
    name: 'saint_pierre_et_miquelon_2026-01.json',
    path: `${BASE_URL}data/observatoire/saint_pierre_et_miquelon_2026-01.json`,
    description: 'Observation mensuelle Saint-Pierre-et-Miquelon – relevés agrégés.',
    territory: 'Saint-Pierre-et-Miquelon',
    period: 'Janvier 2026',
    source: 'Relevés citoyens terrain',
  },
];

export default function DonneesPubliques() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <HeroImage
          src={PAGE_HERO_IMAGES.donneesPubliques}
          alt="Données Publiques"
          gradient="from-slate-950 to-green-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
            📂 Données Publiques
          </h1>
          <p
            style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}
          >
            Accédez aux jeux de données ouverts de la plateforme
          </p>
        </HeroImage>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-blue-100">Confiance et sobriété</p>
              <p className="text-slate-200 font-semibold">
                Les données sont stockées localement dans le navigateur après chargement.
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-2 rounded-full bg-blue-900/40 text-blue-100 text-xs font-medium">
              Données publiques — stockage local — aucun suivi
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Formats JSON lisibles par tous · Pas de cookie · Pas de tracker · Pas d’identifiants
            requis.
          </p>
        </div>

        <section className="space-y-4">
          {dataFiles.map((file) => (
            <article
              key={file.name}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-white">{file.name}</h2>
                <code className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-200">
                  {file.path}
                </code>
              </div>
              <p className="text-slate-300">{file.description}</p>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-200">
                <div>
                  <dt className="text-slate-400">Territoire</dt>
                  <dd className="font-medium">{file.territory}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Période</dt>
                  <dd className="font-medium">{file.period}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Source</dt>
                  <dd className="font-medium">{file.source}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>

        {/* Autres suggestions pour aller plus loin */}
        <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-bold text-gray-100 mb-4">
            Autres suggestions pour aller plus loin
          </h2>
          <div className="space-y-3">
            <a
              href="https://www.data.gouv.fr/fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-blue-950/30 rounded-lg hover:bg-blue-900/40 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">🇫🇷</span>
                <div>
                  <h3 className="font-semibold text-blue-200 text-sm">data.gouv.fr</h3>
                  <p className="text-xs text-blue-400">
                    Portail officiel des données ouvertes françaises — Licence Ouverte Etalab
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-400 flex-shrink-0" />
            </a>

            <a
              href="https://prix-carburants.gouv.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-blue-950/30 rounded-lg hover:bg-blue-900/40 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">⛽</span>
                <div>
                  <h3 className="font-semibold text-blue-200 text-sm">prix-carburants.gouv.fr</h3>
                  <p className="text-xs text-blue-400">
                    Prix des carburants en temps réel — Open Data gouvernemental (XML)
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-400 flex-shrink-0" />
            </a>

            <a
              href="https://world.openfoodfacts.org/data"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-blue-950/30 rounded-lg hover:bg-blue-900/40 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">🥫</span>
                <div>
                  <h3 className="font-semibold text-blue-200 text-sm">Open Food Facts</h3>
                  <p className="text-xs text-blue-400">
                    Base mondiale de produits alimentaires — Licence ODbL
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-400 flex-shrink-0" />
            </a>

            <a
              href="https://openprices.net/en/api"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-blue-950/30 rounded-lg hover:bg-blue-900/40 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">🏷️</span>
                <div>
                  <h3 className="font-semibold text-blue-200 text-sm">Open Prices API</h3>
                  <p className="text-xs text-blue-400">
                    Prix contributifs géolocalisés — ODbL — API REST gratuite
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-400 flex-shrink-0" />
            </a>

            <Link
              to="/contribuer"
              className="flex items-center justify-between p-4 bg-emerald-950/30 rounded-lg hover:bg-emerald-900/40 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">✍️</span>
                <div>
                  <h3 className="font-semibold text-emerald-200 text-sm">Contribuer aux données</h3>
                  <p className="text-xs text-emerald-400">
                    Partagez vos relevés de prix pour enrichir l'observatoire
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            </Link>

            <Link
              to="/transparence"
              className="flex items-center justify-between p-4 bg-emerald-950/30 rounded-lg hover:bg-emerald-900/40 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">🔒</span>
                <div>
                  <h3 className="font-semibold text-emerald-200 text-sm">
                    Politique de transparence
                  </h3>
                  <p className="text-xs text-emerald-400">
                    Notre engagement pour des données fiables et ouvertes
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            </Link>

            <Link
              to="/licence-institution"
              className="flex items-center justify-between p-4 bg-emerald-950/30 rounded-lg hover:bg-emerald-900/40 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📜</span>
                <div>
                  <h3 className="font-semibold text-emerald-200 text-sm">
                    Licences &amp; sources institutionnelles
                  </h3>
                  <p className="text-xs text-emerald-400">
                    Cadre légal et sources officielles (INSEE, OPMR, DGCCRF…)
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
