import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "https://akiprisaye.pages.dev/api";
const LIMIT_OPTIONS = [6, 12, 24];

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">🌍 A KI PRI SA YÉ</h1>
      <PricesByTerritory />
      <HealthCheck />
    </div>
  );
}

/* =============================
   Composant Comparateur de Prix
   ============================= */
function PricesByTerritory() {
  const [territories, setTerritories] = useState([]);
  const [territoriesLoading, setTerritoriesLoading] = useState(true);
  const [territoriesError, setTerritoriesError] = useState("");

  const [selected, setSelected] = useState("");
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState("");

  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(null);
  const abortRef = useRef(null);

  // Charger la liste des territoires
  useEffect(() => {
    let cancelled = false;
    setTerritoriesLoading(true);
    setTerritoriesError("");
    fetch(`${API_BASE}/territories`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const list = json?.territories || [];
        setTerritories(list);
        if (!selected && list.length) setSelected(list[0].code);
      })
      .catch((e) => setTerritoriesError(e?.message || "Erreur chargement territoires"))
      .finally(() => !cancelled && setTerritoriesLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selected]);

  // Charger les prix
  useEffect(() => {
    if (!selected) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setItemsLoading(true);
    setItemsError("");
    fetch(`${API_BASE}/prices?territory=${encodeURIComponent(selected)}&limit=${limit}&page=${page}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((json) => {
        setItems(json?.data || []);
        if (typeof json?.total === "number") {
          setTotal(json.total);
        } else if (typeof json?.count === "number") {
          setTotal(null);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") setItemsError(e?.message || "Erreur chargement prix");
      })
      .finally(() => setItemsLoading(false));

    return () => controller.abort();
  }, [selected, limit, page]);

  useEffect(() => {
    setPage(0);
  }, [selected, limit]);

  const canPrev = page > 0;
  const canNext = total != null ? (page + 1) * limit < total : items.length === limit;
  const skeletons = useMemo(
    () => Array.from({ length: limit }, (_, i) => <CardSkeleton key={i} />),
    [limit]
  );

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans bg-white rounded shadow">
      <h2 className="text-2xl font-bold tracking-tight mb-4">🛒 Comparateur de prix</h2>

      {/* Contrôles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-6">
        <div className="col-span-2">
          <label htmlFor="territory" className="block text-sm font-medium mb-2">
            Territoire
          </label>
          {territoriesLoading ? (
            <div className="h-10 rounded bg-gray-200 animate-pulse" />
          ) : territoriesError ? (
            <ErrorBox message={territoriesError} onRetry={() => setSelected("")} />
          ) : (
            <select
              id="territory"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full h-10 border rounded px-3"
            >
              {territories.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name} ({t.type})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor="limit" className="block text-sm font-medium mb-2">
            Résultats / page
          </label>
          <select
            id="limit"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full h-10 border rounded px-3"
          >
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Résultats */}
      {itemsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{skeletons}</div>
      ) : itemsError ? (
        <ErrorBox message={itemsError} onRetry={() => setPage((p) => p)} />
      ) : items.length === 0 ? (
        <EmptyState selected={selected} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                <h4 className="font-semibold text-lg mb-1">{item.title}</h4>
                <p className="text-gray-700 mb-1">
                  Prix :{" "}
                  <span className="font-bold">
                    {item.price} {item.currency || "EUR"}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  Territoire : {item.territory} • Source : {item.source}
                </p>
              </article>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              className="px-3 py-2 border rounded disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={!canPrev}
            >
              ← Précédent
            </button>
            <div className="text-sm text-gray-600">
              Page <span className="font-medium">{page + 1}</span>
            </div>
            <button
              className="px-3 py-2 border rounded disabled:opacity-40"
              onClick={() => setPage((p) => p + 1)}
              disabled={!canNext}
            >
              Suivant →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================
   Composant Vérification API
   ============================ */
function HealthCheck() {
  const [status, setStatus] = useState({
    territories: { ok: null, error: "" },
    prices: { ok: null, error: "" },
  });

  const runTests = async () => {
    setStatus({
      territories: { ok: null, error: "" },
      prices: { ok: null, error: "" },
    });

    try {
      const res = await fetch(`${API_BASE}/territories`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      setStatus((s) => ({ ...s, territories: { ok: true, error: "" } }));
    } catch (e) {
      setStatus((s) => ({ ...s, territories: { ok: false, error: e.message } }));
    }

    try {
      const res = await fetch(`${API_BASE}/prices?territory=guadeloupe&limit=1`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      setStatus((s) => ({ ...s, prices: { ok: true, error: "" } }));
    } catch (e) {
      setStatus((s) => ({ ...s, prices: { ok: false, error: e.message } }));
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="p-4 border rounded bg-white shadow mt-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🔍 Vérification API</h2>
      <ul className="space-y-2">
        <li>
          <span className="font-medium">/api/territories :</span>{" "}
          {status.territories.ok === null && "⏳ En cours..."}
          {status.territories.ok === true && <span className="text-green-600">✅ OK</span>}
          {status.territories.ok === false && (
            <span className="text-red-600">❌ {status.territories.error}</span>
          )}
        </li>
        <li>
          <span className="font-medium">/api/prices :</span>{" "}
          {status.prices.ok === null && "⏳ En cours..."}
          {status.prices.ok === true && <span className="text-green-600">✅ OK</span>}
          {status.prices.ok === false && (
            <span className="text-red-600">❌ {status.prices.error}</span>
          )}
        </li>
      </ul>
      <button
        onClick={runTests}
        className="mt-4 px-3 py-2 border rounded bg-gray-100 hover:bg-gray-200"
      >
        ↻ Rafraîchir
      </button>
    </div>
  );
}

/* ============== Utils ============== */
function CardSkeleton() {
  return (
    <div className="border rounded-lg p-4">
      <div className="h-5 w-3/4 bg-gray-200 animate-pulse rounded mb-3" />
      <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded mb-2" />
      <div className="h-3 w-1/3 bg-gray-200 animate-pulse rounded" />
    </div>
  );
}

function ErrorBox({ message, onRetry }) {
  return (
    <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded">
      <p className="mb-3">❌ {message}</p>
      <button className="px-3 py-2 border rounded" onClick={onRetry}>
        Réessayer
      </button>
    </div>
  );
}

function EmptyState({ selected }) {
  return (
    <div className="p-6 border rounded bg-gray-50 text-gray-700">
      <p className="font-medium">Aucun article trouvé</p>
      <p className="text-sm">
        Aucun résultat pour <span className="font-semibold">{selected}</span>. Essaie
        de changer la pagination ou le nombre de résultats par page.
      </p>
    </div>
  );
}
