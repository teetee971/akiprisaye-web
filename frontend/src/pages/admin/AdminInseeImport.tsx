import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Building2,
  Download,
  RefreshCw,
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  Database,
  Filter,
  Info,
  ExternalLink,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FbUser } from 'firebase/auth';
import {
  searchInseeProsBatiment,
  importInseeEtablissements,
  getExistingSirets,
  type InseeEtablissement,
  type InseeSearchResult,
  type ImportResult,
} from '@/services/inseeProService';

// ── Constants ─────────────────────────────────────────────────────────────────

const TERRITORY_OPTIONS = [
  { code: 'GP', label: '🇬🇵 Guadeloupe (971)' },
  { code: 'MQ', label: '🇲🇶 Martinique (972)' },
  { code: 'GF', label: '🇬🇫 Guyane (973)' },
  { code: 'RE', label: '🇷🇪 La Réunion (974)' },
  { code: 'YT', label: '🇾🇹 Mayotte (976)' },
];

const NAF_OPTIONS = [
  { code: '', label: 'Tous les corps de métiers bâtiment' },
  { code: '43.99C', label: '43.99C — Maçonnerie & Gros œuvre' },
  { code: '43.21A,43.21B', label: '43.21 — Électricité' },
  { code: '43.22A,43.22B', label: '43.22 — Plomberie & Thermique' },
  { code: '43.33Z', label: '43.33Z — Carrelage & Revêtements' },
  { code: '43.34Z', label: '43.34Z — Peinture & Vitrerie' },
  { code: '43.31Z', label: '43.31Z — Plâtrerie' },
  { code: '43.32A', label: '43.32A — Menuiserie bois/PVC' },
  { code: '43.32B', label: '43.32B — Serrurerie métallique' },
  { code: '43.91A,43.91B', label: '43.91 — Charpente & Couverture' },
  { code: '43.99A', label: '43.99A — Étanchéité' },
  { code: '43.99B', label: '43.99B — Structures métalliques' },
  { code: '43.12A,43.12B', label: '43.12 — Terrassement' },
  { code: '43.29A,43.29B', label: '43.29 — Isolation' },
  { code: '81.30Z', label: '81.30Z — Paysagisme' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminInseeImport() {
  const [user, setUser] = useState<FbUser | null>(null);
  const [territory, setTerritory] = useState('GP');
  const [nafFilter, setNafFilter] = useState('');
  const [perPage, setPerPage] = useState(20);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchResult, setSearchResult] = useState<InseeSearchResult | null>(null);
  const [existingSirets, setExistingSirets] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  async function handleSearch(newPage = 1) {
    setLoading(true);
    setError(null);
    setImportResults(null);
    setSelected(new Set());
    try {
      const result = await searchInseeProsBatiment({
        territory,
        naf: nafFilter,
        page: newPage,
        perPage,
      });
      const sirets = result.results.map((e: InseeEtablissement) => e.siret);
      const existing = await getExistingSirets();
      setExistingSirets(existing);
      setSearchResult(result);
      setPage(newPage);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la recherche INSEE');
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!searchResult || selected.size === 0) return;
    setImporting(true);
    setError(null);
    try {
      const toImport = searchResult.results.filter((e: InseeEtablissement) =>
        selected.has(e.siret)
      );
      const results = await importInseeEtablissements(toImport);
      setImportResults(results);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'import");
    } finally {
      setImporting(false);
    }
  }

  function toggleAll() {
    if (!searchResult) return;
    const selectable = searchResult.results
      .filter((e: InseeEtablissement) => !existingSirets.has(e.siret))
      .map((e: InseeEtablissement) => e.siret);
    if (selectable.every((s: string) => selected.has(s))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectable));
    }
  }

  function toggleOne(siret: string) {
    const next = new Set(selected);
    if (next.has(siret)) next.delete(siret);
    else next.add(siret);
    setSelected(next);
  }

  function handleRowKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
    siret: string,
    exists: boolean
  ) {
    if (exists) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleOne(siret);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-white font-semibold text-lg">Connexion requise</p>
          <p className="text-slate-400 text-sm mt-1">
            Vous devez être connecté pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = searchResult ? Math.ceil(searchResult.total / perPage) : 0;
  const newCount = searchResult
    ? searchResult.results.filter((e: InseeEtablissement) => !existingSirets.has(e.siret)).length
    : 0;

  const importedCount = importResults?.filter((r) => r.status === 'imported').length ?? 0;
  const alreadyCount = importResults?.filter((r) => r.status === 'already_exists').length ?? 0;
  const errorCount = importResults?.filter((r) => r.status === 'error').length ?? 0;

  return (
    <>
      <Helmet>
        <title>Import INSEE Sirene — Admin AkiPrisaye</title>
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-white px-4 py-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Building2 className="w-7 h-7 text-orange-400" />
            <h1 className="text-2xl font-black tracking-tight">Import INSEE Sirene</h1>
          </div>
          <p className="text-slate-400 text-sm ml-10">
            Récupérez les professionnels du bâtiment actifs enregistrés au registre officiel INSEE
          </p>
        </div>

        {/* Info banner */}
        <div className="rounded-xl bg-blue-900/20 border border-blue-500/30 p-4 mb-6 flex gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200 space-y-1">
            <p className="font-semibold text-blue-300">À propos des données INSEE</p>
            <p>
              Les données Sirene sont publiques (Licence Ouverte v2.0). Elles contiennent la raison
              sociale, le SIRET, le code NAF et la commune.
            </p>
            <p className="text-blue-300/70">
              ⚠️ Les coordonnées (téléphone, email) ne sont <strong>pas</strong> incluses. Les
              professionnels devront compléter leur profil après import.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-900/20 border border-red-500/30 p-4 mb-6 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* ── Step 3: Import results ── */}
        {importResults && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-green-400" />
                Résultats de l'import
              </h2>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-lg bg-green-900/20 border border-green-500/30 p-3 text-center">
                  <p className="text-2xl font-black text-green-400">{importedCount}</p>
                  <p className="text-xs text-slate-400">importés</p>
                </div>
                <div className="rounded-lg bg-blue-900/20 border border-blue-500/30 p-3 text-center">
                  <p className="text-2xl font-black text-blue-400">{alreadyCount}</p>
                  <p className="text-xs text-slate-400">déjà existants</p>
                </div>
                <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-3 text-center">
                  <p className="text-2xl font-black text-red-400">{errorCount}</p>
                  <p className="text-xs text-slate-400">erreurs</p>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {importResults.map((r) => (
                  <div
                    key={r.siret}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                      r.status === 'imported'
                        ? 'bg-green-900/10 border border-green-700/30'
                        : r.status === 'already_exists'
                          ? 'bg-blue-900/10 border border-blue-700/30'
                          : 'bg-red-900/10 border border-red-700/30'
                    }`}
                  >
                    {r.status === 'imported' && (
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    )}
                    {r.status === 'already_exists' && (
                      <Info className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    {r.status === 'error' && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    <span className="font-mono text-xs text-slate-400">{r.siret}</span>
                    <span className="text-slate-300 truncate">{r.raisonSociale}</span>
                    {r.errorMsg && (
                      <span className="text-red-400 text-xs ml-auto shrink-0">{r.errorMsg}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setImportResults(null);
                  setSearchResult(null);
                  setSelected(new Set());
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Nouvelle recherche
              </button>
              <Link
                to="/admin/pros-batiment"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-sm font-semibold transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Voir dans AdminProsBatiment
              </Link>
            </div>
          </div>
        )}

        {/* ── Step 1: Search filters ── */}
        {!loading && !searchResult && !importResults && (
          <div className="rounded-xl bg-slate-800 border border-slate-700 p-5 space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Filter className="w-4 h-4 text-orange-400" />
              Filtres de recherche
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="insee-territoire"
                  className="block text-xs text-slate-400 mb-1 flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" /> Territoire
                </label>
                <select
                  id="insee-territoire"
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  {TERRITORY_OPTIONS.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="insee-naf"
                  className="block text-xs text-slate-400 mb-1 flex items-center gap-1"
                >
                  <Building2 className="w-3.5 h-3.5" /> Code NAF
                </label>
                <select
                  id="insee-naf"
                  value={nafFilter}
                  onChange={(e) => setNafFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  {NAF_OPTIONS.map((n) => (
                    <option key={n.code} value={n.code}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="insee-per-page" className="block text-xs text-slate-400 mb-1">
                  Résultats par page
                </label>
                <select
                  id="insee-per-page"
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  {[20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n} résultats
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => handleSearch(1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 font-semibold text-sm transition-colors"
            >
              <Search className="w-4 h-4" />
              Rechercher sur INSEE
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
            <p className="text-slate-400 text-sm">Interrogation de l'API INSEE Sirene…</p>
          </div>
        )}

        {/* ── Step 2: Results table ── */}
        {!loading && searchResult && !importResults && (
          <div className="space-y-4">
            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-slate-300">
                <span className="font-bold text-white">{searchResult.total}</span> entreprises
                trouvées
              </span>
              <span className="text-slate-500">—</span>
              <span className="text-slate-300">
                Page <span className="font-bold text-white">{page}</span> / {totalPages}
              </span>
              <span className="text-slate-500">—</span>
              <span className="text-blue-300">
                <span className="font-bold">{existingSirets.size}</span> déjà dans la base
              </span>
              <span className="text-slate-500">—</span>
              <span className="text-green-300">
                <span className="font-bold">{newCount}</span> nouveaux
              </span>
            </div>

            {/* Table */}
            <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
              {/* Select all */}
              <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-3">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
                >
                  {searchResult.results
                    .filter((e: InseeEtablissement) => !existingSirets.has(e.siret))
                    .every((e: InseeEtablissement) => selected.has(e.siret)) && newCount > 0 ? (
                    <CheckSquare className="w-4 h-4 text-orange-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {selected.size > 0 ? `Désélectionner (${selected.size})` : 'Tout sélectionner'}
                </button>
              </div>

              <div className="divide-y divide-slate-700/50">
                {searchResult.results.map((e: InseeEtablissement) => {
                  const exists = existingSirets.has(e.siret);
                  const isSelected = selected.has(e.siret);
                  return (
                    <div
                      key={e.siret}
                      onClick={() => !exists && toggleOne(e.siret)}
                      onKeyDown={(event) => handleRowKeyDown(event, e.siret, exists)}
                      role={exists ? undefined : 'button'}
                      tabIndex={exists ? -1 : 0}
                      className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        exists
                          ? 'opacity-40 cursor-not-allowed'
                          : 'cursor-pointer hover:bg-slate-700/40'
                      } ${isSelected ? 'bg-orange-900/10' : ''}`}
                    >
                      <div className="shrink-0">
                        {exists ? (
                          <Square className="w-4 h-4 text-slate-600" />
                        ) : isSelected ? (
                          <CheckSquare className="w-4 h-4 text-orange-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{e.raisonSociale}</p>
                        <p className="text-xs text-slate-400 font-mono">{e.siret}</p>
                      </div>

                      <div className="hidden sm:block text-xs text-slate-400 w-32 shrink-0">
                        <p className="font-mono text-orange-300">{e.nafCode}</p>
                        <p className="truncate">{e.nafLibelle}</p>
                      </div>

                      <div className="hidden md:flex items-center gap-1 text-xs text-slate-400 w-28 shrink-0">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{e.ville}</span>
                      </div>

                      {exists && (
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300 border border-blue-700/30">
                          déjà importé
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination + Import */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSearch(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors"
                >
                  ← Précédent
                </button>
                <span className="text-xs text-slate-400">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => handleSearch(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors"
                >
                  Suivant →
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSearchResult(null);
                    setSelected(new Set());
                    setError(null);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Nouvelle recherche
                </button>
                <button
                  onClick={handleImport}
                  disabled={selected.size === 0 || importing}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-sm transition-colors"
                >
                  {importing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Importer les {selected.size} sélectionnés
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
