import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";
import safeLocalStorage from "../utils/safeLocalStorage";

import { SEOHead } from '../components/ui/SEOHead';
import { HeroImage } from '../components/ui/HeroImage';
import ShareButton from '../components/comparateur/ShareButton';
type PanierItem = {
  produit: string;
  prix_moyen: number;
};

type ObservatoireData = {
  titre: string;
  territoire: string;
  periode: string;
  devise: string;
  source: {
    nom: string;
    url: string;
  };
  panier: PanierItem[];
  note?: string;
};

const DATA_URL = `${import.meta.env.BASE_URL}data/observatoire/prix-panier-base.json`;

export default function Observatoire() {
  const [data, setData] = useState<ObservatoireData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isValidData = (value: unknown): value is ObservatoireData => {
    if (!value || typeof value !== "object") return false;
    const v = value as ObservatoireData;

    return (
      typeof v.titre === "string" &&
      typeof v.territoire === "string" &&
      typeof v.periode === "string" &&
      typeof v.devise === "string" &&
      Array.isArray(v.panier) &&
      v.panier.every(
        (i) =>
          typeof i.produit === "string" &&
          typeof i.prix_moyen === "number"
      )
    );
  };

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);

    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Chargement impossible");
        return res.json();
      })
      .then((json) => {
        if (!mounted) return;
        if (!isValidData(json)) {
          throw new Error("Données observatoire invalides");
        }
        setData(json);
        setError(null);
      })
      .catch(() => {
        if (mounted) {
          setError(
            "La donnée de l'observatoire est momentanément indisponible. Merci de réessayer ultérieurement."
          );
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [retryCount]);

  const formattedPeriod = useMemo(() => {
    if (!data?.periode) return "—";
    const [year, month] = data.periode.split("-");
    if (!year || !month) return data.periode;
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
    }).format(date);
  }, [data?.periode]);

  useEffect(() => {
    if (!data) return;
    safeLocalStorage.setItem(
      "akiprisaye:observatoire:last",
      JSON.stringify({
        territoire: data.territoire,
        periode: data.periode,
        viewedAt: new Date().toISOString(),
      })
    );
  }, [data]);

  return (
    <>
      <SEOHead
        title="Observatoire des prix — Données citoyennes Outre-mer"
        description="Consultez les données de l'observatoire citoyen des prix dans les territoires ultramarins français. Statistiques, tendances et analyses."
        canonical="https://teetee971.github.io/akiprisaye-web/observatoire"
      />
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Hero banner */}
        <HeroImage
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fm=webp&fit=crop&w=1200&q=80"
          alt="Observatoire des prix — tableau de données citoyennes"
          gradient="from-slate-900 to-emerald-950"
          height="h-36 sm:h-48"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow">
            🔬 Observatoire des prix
          </h1>
          <p className="text-slate-200 text-sm sm:text-base mt-1 max-w-xl drop-shadow">
            Données citoyennes · Prix réels · Mis à jour régulièrement
          </p>
        </HeroImage>
        {/* Header compact — title shown in hero above */}
        <div className="flex flex-wrap items-center gap-3">
          <a href="/methodologie" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition text-sm font-semibold">Méthodologie</a>
          <a href="/transparence" className="px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-500 transition text-sm">Transparence</a>
          <div className="ml-auto">
            <ShareButton
              title="Observatoire des prix — A KI PRI SA YÉ"
              description={`Données citoyennes · ${data?.territoire ?? 'Outre-mer'} · ${data?.periode ?? ''}`}
              variant="compact"
            />
          </div>
        </div>
        {/* Meta */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-slate-400 text-sm">Territoire</p>
            <p className="font-semibold">{data?.territoire ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Période</p>
            <p className="font-semibold">{formattedPeriod}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Devise</p>
            <p className="font-semibold">{data?.devise ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Source</p>
            {data?.source?.url ? (
              <a
                href={data.source.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline break-words"
              >
                {data.source.nom}
              </a>
            ) : (
              <span className="text-slate-500">—</span>
            )}
          </div>
        </section>

        {/* States */}
        {loading && (
          <p className="text-slate-400">Chargement des données…</p>
        )}

        {error && !loading && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-xl border border-orange-500/40 bg-orange-950/30 px-6 py-8 text-center space-y-4"
          >
            <AlertCircle className="w-10 h-10 text-orange-400 mx-auto" aria-hidden="true" />
            <div>
              <p className="text-lg font-semibold text-orange-200">
                Données momentanément indisponibles
              </p>
              <p className="mt-1 text-sm text-orange-300/80">
                {error}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRetryCount((c) => c + 1)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Réessayer
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && data?.panier?.length ? (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-slate-300 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Produit</th>
                  <th className="px-4 py-3 text-right">
                    Prix moyen ({data.devise})
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.panier.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-slate-800 hover:bg-slate-900"
                  >
                    <td className="px-4 py-3 font-medium">
                      {item.produit}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.prix_moyen.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && !error && !data?.panier?.length && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-300">
            Aucune donnée de panier disponible pour cette période.
          </div>
        )}

        {data?.note && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3 text-slate-300">
            {data.note}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
