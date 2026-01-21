import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { safeLocalStorage } from '../utils/safeLocalStorage';

type ObservatoireData = {
  titre: string;
  territoire: string;
  periode: string;
  devise: string;
  source: {
    nom: string;
    url: string;
  };
  panier: { produit: string; prix_moyen: number }[];
  note?: string;
};

const DATA_URL = '/data/observatoire/prix-panier-base.json';

export default function Observatoire() {
  const [data, setData] = useState<ObservatoireData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isValidData = (value: unknown): value is ObservatoireData => {
    if (!value || typeof value !== 'object') return false;
    const data = value as Partial<ObservatoireData>;
    return (
      typeof data.titre === 'string' &&
      typeof data.territoire === 'string' &&
      typeof data.periode === 'string' &&
      typeof data.devise === 'string' &&
      typeof data.source?.nom === 'string' &&
      typeof data.source?.url === 'string' &&
      Array.isArray(data.panier) &&
      data.panier.every(
        (item) => item && typeof item.produit === 'string' && typeof item.prix_moyen === 'number'
      )
    );
  };

  useEffect(() => {
    let isMounted = true;
    fetch(DATA_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Impossible de charger la donnée observatoire');
        }
        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
          throw new Error('Format de donnée inattendu');
        }
        return response.json();
      })
      .then((json) => {
        if (isMounted) {
          if (!isValidData(json)) {
            throw new Error('Donnée observatoire invalide');
          }
          setData(json);
          setError(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(
            "Désolé, la donnée de l'observatoire est momentanément indisponible. Merci de réessayer dans quelques instants."
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const formattedPeriod = useMemo(() => {
    if (!data?.periode) return null;
    const [year, month] = data.periode.split('-').map(Number);
    if (!year || !month) return data.periode;
    const date = new Date(Date.UTC(year, month - 1, 1));
    return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'long' }).format(date);
  }, [data]);

  useEffect(() => {
    if (!data) return;
    try {
      const payload = {
        lastPage: '/observatoire',
        lastTerritory: data.territoire,
        updatedAt: new Date().toISOString(),
      };
      safeLocalStorage.setItem('akiprisaye:user:history', JSON.stringify(payload));
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('Impossible de sauvegarder l’historique local', e);
      }
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header className="space-y-3">
          <p className="text-sm text-blue-200 uppercase tracking-wide">Observatoire public</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">{data?.titre ?? 'Observatoire des prix'}</h1>
          <p className="text-slate-300 max-w-3xl">
            Première publication officielle de prix réels. Donnée statique, mise à jour mensuellement, disponible
            sans compte pour tous les citoyens.
          </p>
          <div className="inline-flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-slate-200 bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-2">
            <span className="font-semibold">Granularité : heure / jour / semaine / mois</span>
            <span className="text-slate-300">
              Les données horaires reflètent les dernières observations disponibles.
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/methodologie"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              Méthodologie
            </Link>
            <Link
              to="/transparence"
              className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-700 hover:border-blue-400 text-slate-200 text-sm font-semibold transition-colors"
            >
              Données & transparence
            </Link>
          </div>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="p-6 border-b border-slate-800 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm text-slate-400">Territoire</p>
              <p className="text-xl font-semibold text-white">{data?.territoire ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-400">Période</p>
              <p className="text-xl font-semibold text-white">{formattedPeriod ?? data?.periode ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-400">Devise</p>
              <p className="text-xl font-semibold text-white">{data?.devise ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-400">Source déclarée</p>
              {data?.source ? (
                <a
                  className="text-blue-400 hover:text-blue-300 font-semibold break-words"
                  href={data.source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {data.source.nom}
                </a>
              ) : (
                <span className="text-slate-300">—</span>
              )}
            </div>
          </div>

          <div className="p-6">
            {loading && (
              <div className="text-slate-300 text-sm">Chargement de la donnée observatoire en cours…</div>
            )}

            {error && (
              <div
                role="alert"
                className="bg-red-900/30 border border-red-500 text-red-100 px-4 py-3 rounded-xl text-sm"
              >
                {error}
              </div>
            )}

            {!loading && !error && data && (
              <div className="space-y-4">
                {data.panier.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left border border-slate-800 rounded-xl overflow-hidden">
                      <caption className="text-slate-300 text-sm px-3 py-2 bg-slate-800 border-b border-slate-800">
                        Prix moyens du panier alimentaire de base ({formattedPeriod ?? data.periode})
                      </caption>
                      <thead className="bg-slate-800 text-slate-200 text-sm uppercase tracking-wide">
                        <tr>
                          <th scope="col" className="px-4 py-3">
                            Produit
                          </th>
                          <th scope="col" className="px-4 py-3">
                            Prix moyen ({data.devise})
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.panier.map((item) => (
                          <tr key={item.produit} className="border-t border-slate-800">
                            <th scope="row" className="px-4 py-3 font-semibold text-white">
                              {item.produit}
                            </th>
                            <td className="px-4 py-3 text-slate-100">
                              {item.prix_moyen.toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                    Aucune donnée de panier n'est disponible pour la période affichée.
                  </div>
                )}

                {data.note && (
                  <p className="text-sm text-slate-300 bg-slate-800/70 border border-slate-800 rounded-xl px-4 py-3">
                    {data.note}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
