import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import safeLocalStorage from "../utils/safeLocalStorage";

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

const DATA_URL = "/data/observatoire/prix-panier-base.json";

export default function Observatoire() {
  const [data, setData] = useState<ObservatoireData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Chargement impossible");
        const ct = res.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) {
          throw new Error("Format invalide");
        }
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
            "La donnée de l’observatoire est momentanément indisponible. Merci de réessayer ultérieurement."
          );
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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
    safeLocalStorage.set(
      "akiprisaye:observatoire:last",
      JSON.stringify({
        territoire: data.territoire,
        periode: data.periode,
        viewedAt: new Date().toISOString(),
      })
    );
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="space-y-4">
          <p className="text-slate-400 uppercase tracking-wide text-sm">
            Observatoire public
          </p>
          <h1 className="text-3xl md:text-4xl font-bold">
            Observatoire des prix
          </h1>
          <p className="text-slate-300 max-w-3xl">
            Série officielle de prix réels, mise à jour régulièrement, destinée
            à l’information des citoyens.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/methodologie"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition text-sm font-semibold"
            >
              Méthodologie
            </Link>
            <Link
              to="/transparence"
              className="px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-500 transition text-sm"
            >
              Transparence
            </Link>
          </div>
        </header>

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
          <div className="rounded-lg border border-red-600 bg-red-900/30 px-4 py-3 text-red-200">
            {error}
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
  );
}
