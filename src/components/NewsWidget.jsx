import { useEffect, useState } from 'react';

export default function NewsWidget() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔒 Données statiques sûres (frontend-only, Cloudflare Pages compatible)
  const STATIC_NEWS = [
    {
      id: '1',
      title: 'Renforcement du bouclier qualité-prix en Guadeloupe',
      summary:
        'La préfecture annonce un renforcement des contrôles et des dispositifs de régulation des prix afin de lutter contre la vie chère.',
      publishedAt: '2025-11-07',
      category: 'ALERTE',
      territory: 'Guadeloupe',
      source: {
        name: 'Préfecture de Guadeloupe',
        url: 'https://www.guadeloupe.gouv.fr',
        logo: null,
      },
    },
    {
      id: '2',
      title: 'Extension du bouclier qualité-prix à 1000 produits',
      summary:
        'Le dispositif anti-vie-chère est étendu à de nouveaux produits essentiels dans les DROM-COM, selon un décret du ministère des Outre-mer.',
      publishedAt: '2025-11-06',
      category: 'POLITIQUE',
      territory: 'DROM-COM',
      source: {
        name: 'Ministère des Outre-mer',
        url: 'https://www.outre-mer.gouv.fr',
        logo: null,
      },
    },
    {
      id: '3',
      title: 'Contrôles renforcés de la DGCCRF sur les prix',
      summary:
        'La DGCCRF intensifie ses contrôles dans les grandes surfaces afin de détecter les pratiques abusives.',
      publishedAt: '2025-11-05',
      category: 'ALERTE',
      territory: 'Martinique',
      source: {
        name: 'DGCCRF',
        url: 'https://www.economie.gouv.fr/dgccrf',
        logo: null,
      },
    },
    {
      id: '4',
      title: "Publication des données INSEE sur l'inflation",
      summary:
        "L'INSEE publie les derniers chiffres de l'inflation pour les territoires d'Outre-mer, montrant une légère baisse.",
      publishedAt: '2025-11-04',
      category: 'PRIX',
      territory: 'La Réunion',
      source: {
        name: 'INSEE',
        url: 'https://www.insee.fr',
        logo: null,
      },
    },
    {
      id: '5',
      title: "Nouveau dispositif d'observatoire des prix",
      summary:
        "Mise en place d'un observatoire participatif permettant aux citoyens de signaler les écarts de prix constatés.",
      publishedAt: '2025-11-03',
      category: 'INNOVATION',
      territory: 'Tous territoires',
      source: {
        name: 'data.gouv.fr',
        url: 'https://www.data.gouv.fr',
        logo: null,
      },
    },
  ];

  useEffect(() => {
    // 🔐 En production : PAS d’appel backend
    setNews(STATIC_NEWS);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="animate-pulse space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/[0.05] backdrop-blur-[14px] border border-white/[0.12] rounded-xl p-6"
            >
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-3" />
              <div className="h-4 bg-gray-700 rounded w-5/6" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {news.map((item) => (
        <article
          key={item.id}
          className="bg-white/[0.04] backdrop-blur-[14px] border border-white/[0.12] rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-400">
              {item.category} • {item.territory}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(item.publishedAt).toLocaleDateString('fr-FR')}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-white mb-2">
            {item.title}
          </h3>

          <p className="text-sm text-gray-300 mb-3">{item.summary}</p>

          <a
            href={item.source.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-400 hover:underline"
          >
            Source : {item.source.name}
          </a>
        </article>
      ))}
    </section>
  );
}
