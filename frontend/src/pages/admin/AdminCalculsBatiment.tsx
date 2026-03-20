/**
 * AdminCalculsBatiment — Interface admin pour les calculs du bâtiment
 *
 * Accès restreint aux administrateurs authentifiés.
 * Onglets :
 *  1. Calculs — tous les calculs enregistrés dans Firestore (collection calculs_batiment)
 *  2. Suggestions — toutes les suggestions utilisateurs (collection suggestions_batiment)
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  HardHat,
  BarChart2,
  MapPin,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Search,
  Package,
  MessageSquarePlus,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FbUser } from 'firebase/auth';
import {
  getAllBatimentCalculations,
  CALC_TYPE_LABELS,
  TERRITORY_LABELS,
  type BatimentCalcRecord,
} from '@/services/batimentCalculService';
import {
  getAllBatimentSuggestions,
  updateSuggestionStatus,
  SUGGESTION_CATEGORY_LABELS,
  SUGGESTION_STATUS_LABELS,
  SUGGESTION_STATUS_COLORS,
  type BatimentSuggestion,
  type SuggestionStatus,
} from '@/services/batimentSuggestionsService';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(rec: BatimentCalcRecord | BatimentSuggestion): string {
  if (!rec.createdAt) return '—';
  try {
    const ms = rec.createdAt.seconds * 1000;
    return new Date(ms).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

function calcLabel(type: string) {
  return CALC_TYPE_LABELS[type] ?? type;
}

function territoryLabel(code: string | null) {
  if (!code) return '—';
  return TERRITORY_LABELS[code] ?? code;
}

// ── Summary Stats ─────────────────────────────────────────────────────────────

function SummaryCards({ records }: { records: BatimentCalcRecord[] }) {
  const byType = records.reduce<Record<string, number>>((acc, r) => {
    acc[r.calcType] = (acc[r.calcType] ?? 0) + 1;
    return acc;
  }, {});
  const byTerritory = records.reduce<Record<string, number>>((acc, r) => {
    const key = r.territory ?? 'inconnu';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const anonymousCount = records.filter((r) => r.userId === 'anonymous').length;

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {/* Total */}
      <div className="col-span-2 rounded-xl bg-orange-900/20 border border-orange-500/30 p-4 flex items-center gap-3">
        <BarChart2 className="w-8 h-8 text-orange-400 shrink-0" />
        <div>
          <p className="text-2xl font-black text-white">{records.length}</p>
          <p className="text-xs text-slate-400">calculs enregistrés au total</p>
        </div>
      </div>

      {/* By territory */}
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-3">
        <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />Par territoire</p>
        {Object.entries(byTerritory).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, n]) => (
          <div key={t} className="flex justify-between text-xs py-0.5">
            <span className="text-slate-300">{territoryLabel(t)}</span>
            <span className="text-white font-semibold">{n}</span>
          </div>
        ))}
      </div>

      {/* By type */}
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-3">
        <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><HardHat className="w-3.5 h-3.5" />Par calculateur</p>
        {Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, n]) => (
          <div key={t} className="flex justify-between text-xs py-0.5">
            <span className="text-slate-300 truncate mr-1">{calcLabel(t)}</span>
            <span className="text-white font-semibold shrink-0">{n}</span>
          </div>
        ))}
      </div>

      {/* Anonymous vs auth */}
      <div className="col-span-2 rounded-xl bg-slate-800 border border-slate-700 p-3 flex items-center gap-4">
        <User className="w-5 h-5 text-slate-400 shrink-0" />
        <div className="text-xs">
          <span className="text-white font-semibold">{anonymousCount}</span>
          <span className="text-slate-400 ml-1">calculs anonymes</span>
          <span className="text-white font-semibold ml-3">{records.length - anonymousCount}</span>
          <span className="text-slate-400 ml-1">calculs utilisateurs identifiés</span>
        </div>
      </div>
    </div>
  );
}

// ── Record Row ────────────────────────────────────────────────────────────────

function RecordRow({ rec }: { rec: BatimentCalcRecord }) {
  const [open, setOpen] = useState(false);

  const inputs  = rec.inputs  as Record<string, unknown>;
  const results = rec.results as Record<string, unknown>;

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden mb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-slate-800/60 transition-colors"
      >
        <span className="text-lg shrink-0">🏗️</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{calcLabel(rec.calcType)}</p>
          <p className="text-xs text-slate-400">
            {territoryLabel(rec.territory)} · Jour {rec.trialDay ?? '?'} · {formatDate(rec)}
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50 pt-3">
          {/* Metadata */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded-lg flex items-center gap-1">
              <User className="w-3 h-3" />{rec.userId === 'anonymous' ? 'Anonyme' : rec.userId.slice(0, 8) + '…'}
            </span>
            <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded-lg flex items-center gap-1">
              <Calendar className="w-3 h-3" />{formatDate(rec)}
            </span>
            {rec.territory && (
              <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded-lg">
                {territoryLabel(rec.territory)}
              </span>
            )}
          </div>

          {/* Inputs */}
          {inputs && Object.keys(inputs).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">📐 Données saisies</p>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(inputs).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-slate-900/60 px-2 py-1 text-xs">
                    <span className="text-slate-500">{k} : </span>
                    <span className="text-slate-200 font-medium">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {results && Object.keys(results).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">📊 Résultats calculés</p>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(results).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-orange-900/20 border border-orange-500/20 px-2 py-1 text-xs">
                    <span className="text-slate-400">{k} : </span>
                    <span className="text-orange-200 font-semibold">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materials */}
          {rec.materials && rec.materials.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />Matériaux ({rec.materials.length} produits)
              </p>
              <div className="flex flex-wrap gap-1">
                {rec.materials.map((m) => (
                  <span key={m.productId} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-lg">
                    {m.qty} × {m.productId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Best store estimate */}
          {rec.totalEstimate != null && (
            <div className="rounded-xl bg-green-900/20 border border-green-500/30 px-3 py-2 flex items-center gap-2 text-sm">
              <span className="text-green-400">💰</span>
              <span className="text-green-200 font-semibold">Estimation : {rec.totalEstimate.toFixed(2)} €</span>
              {rec.bestStoreName && <span className="text-slate-400 text-xs">— {rec.bestStoreName}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminCalculsBatiment() {
  const [user, setUser]           = useState<FbUser | null>(null);
  const [records, setRecords]     = useState<BatimentCalcRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filterType, setFilterType]           = useState<string>('ALL');
  const [filterTerritory, setFilterTerritory] = useState<string>('ALL');
  const [search, setSearch]       = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth!, (u) => setUser(u));
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllBatimentCalculations();
      setRecords(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) void loadRecords();
  }, [user]);

  // Export CSV
  const exportCsv = () => {
    const headers = ['Date', 'Type', 'Territoire', 'Jour essai', 'Utilisateur', 'Matériaux (nb)', 'Estimation (€)'];
    const rows = filtered.map((r) => [
      formatDate(r),
      calcLabel(r.calcType),
      r.territory ?? '',
      String(r.trialDay ?? ''),
      r.userId === 'anonymous' ? 'Anonyme' : r.userId,
      String(r.materials?.length ?? 0),
      r.totalEstimate != null ? r.totalEstimate.toFixed(2) : '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calculs-batiment-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter
  const allTypes = Array.from(new Set(records.map((r) => r.calcType))).sort();
  const allTerritories = Array.from(new Set(records.map((r) => r.territory ?? 'inconnu'))).sort();

  const filtered = records.filter((r) => {
    if (filterType !== 'ALL' && r.calcType !== filterType) return false;
    if (filterTerritory !== 'ALL' && (r.territory ?? 'inconnu') !== filterTerritory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!calcLabel(r.calcType).toLowerCase().includes(q) && !(r.userId ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <HardHat className="w-12 h-12 mx-auto text-orange-400 mb-3" />
          <p className="font-bold text-white text-lg mb-1">Connexion requise</p>
          <p className="text-sm text-slate-400">Accès réservé aux administrateurs connectés.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin — Calculs Bâtiment · A KI PRI SA YÉ</title>
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-white">
        <div className="max-w-3xl mx-auto px-4 pb-16 pt-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-700 to-orange-500 flex items-center justify-center shadow-lg shrink-0">
              <HardHat className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Calculs du Bâtiment</h1>
              <p className="text-xs text-slate-400">Historique Firestore des calculs utilisateurs</p>
            </div>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => void loadRecords()}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              <button
                onClick={exportCsv}
                disabled={filtered.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-800 hover:bg-green-700 text-sm text-white transition-colors disabled:opacity-40"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-900/30 border border-red-500/40 px-4 py-3 text-sm text-red-300 mb-4">
              Erreur de chargement : {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-12 text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
              Chargement des calculs…
            </div>
          )}

          {!loading && (
            <>
              {/* Summary */}
              <SummaryCards records={records} />

              {/* Filters */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher…"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <select
                  value={filterTerritory}
                  onChange={(e) => setFilterTerritory(e.target.value)}
                  className="rounded-xl bg-slate-800 border border-slate-700 text-sm text-white px-3 py-2 focus:border-orange-500 focus:outline-none"
                >
                  <option value="ALL">Tous les territoires</option>
                  {allTerritories.map((t) => (
                    <option key={t} value={t}>{territoryLabel(t)}</option>
                  ))}
                </select>
                <div className="col-span-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 text-sm text-white px-3 py-2 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="ALL">Tous les calculateurs ({records.length})</option>
                    {allTypes.map((t) => (
                      <option key={t} value={t}>{calcLabel(t)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Result count */}
              <p className="text-xs text-slate-500 mb-3">
                {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
              </p>

              {/* Records list */}
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  <HardHat className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Aucun calcul trouvé
                </div>
              ) : (
                <div>
                  {filtered.map((rec) => (
                    <RecordRow key={rec.id} rec={rec} />
                  ))}
                </div>
              )}
            </>
          )}

          <p className="mt-6 text-center text-xs text-slate-600">
            Données à titre indicatif — Usage interne admin uniquement
          </p>
        </div>
      </div>
    </>
  );
}
