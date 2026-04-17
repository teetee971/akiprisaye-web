/**
 * FicheEntreprise — Territoires couverts + historique enseigne
 * Route : /fiche-entreprise/:id
 * Module 6 — Fiches entreprises
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Building2, MapPin, TrendingUp, Download, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { TERRITORIES } from '../constants/territories';
import type { TerritoryCode } from '../constants/territories';

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_COMPANIES: Record<
  string,
  {
    name: string;
    logo: string;
    description: string;
    territories: TerritoryCode[];
    priceHistory: number[];
  }
> = {
  gbh: {
    name: 'Groupe Bernard Hayot (GBH)',
    logo: '🏪',
    description: 'Premier groupe de distribution des Antilles-Guyane',
    territories: ['gp', 'mq', 'gf', 're', 'yt'],
    priceHistory: [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 110, 111],
  },
  carrefour: {
    name: 'Carrefour DOM',
    logo: '🛒',
    description: 'Enseigne de grande distribution présente dans les DOM',
    territories: ['gp', 'mq', 're'],
    priceHistory: [100, 101, 103, 102, 104, 106, 105, 107, 108, 109, 110, 112],
  },
  default: {
    name: 'Enseigne inconnue',
    logo: '🏬',
    description: 'Données non disponibles pour cette enseigne',
    territories: ['gp'],
    priceHistory: [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111],
  },
};

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const TYPE_COLORS: Record<string, string> = {
  DROM: 'bg-blue-100 text-blue-700 border-blue-200',
  COM: 'bg-green-100 text-green-700 border-green-200',
  Autres: 'bg-purple-100 text-purple-700 border-purple-200',
  Metro: 'bg-gray-100 text-gray-700 border-gray-200',
};

// ── Sparkline (CSS-only) ──────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100 / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * width;
    const y = 100 - ((v - min) / range) * 80 - 10;
    return `${x},${y}`;
  });

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-16">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#7c3aed"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      {data.map((v, i) => {
        const x = i * width;
        const y = 100 - ((v - min) / range) * 80 - 10;
        return (
          <circle key={i} cx={x} cy={y} r="2" fill="#7c3aed" vectorEffect="non-scaling-stroke" />
        );
      })}
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FicheEntreprise() {
  const { id = 'default' } = useParams<{ id: string }>();
  const company = MOCK_COMPANIES[id] ?? MOCK_COMPANIES['default'];
  const [showHistory, setShowHistory] = useState(true);

  const coveredTerritories = company.territories.map((code) => TERRITORIES[code]).filter(Boolean);

  function handleExportHistory() {
    const header = 'Mois,Indice prix\n';
    const rows = company.priceHistory.map((v, i) => `${MONTHS[i]},${v}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Historique exporté en CSV');
  }

  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  return (
    <>
      <Helmet>
        <title>{company.name} — Fiche enseigne — A KI PRI SA YÉ</title>
        <meta name="description" content={`Fiche publique de ${company.name}`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-6 pb-12 space-y-6">
          {/* ── Header ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-3xl">
                {company.logo}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{company.description}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    {coveredTerritories.length} territoire(s) couverts
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Territoires couverts ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-violet-600" />
              <h2 className="font-bold text-gray-900">Territoires couverts</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {coveredTerritories.map((t) => (
                <span
                  key={t.code}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${TYPE_COLORS[t.type] ?? TYPE_COLORS.Autres}`}
                >
                  <span>{t.flag}</span>
                  <span>{t.name}</span>
                  <span className="text-xs opacity-60">{t.type}</span>
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              {['DROM', 'COM', 'Autres', 'Metro'].map((type) => (
                <span key={type} className={`px-2 py-0.5 rounded border ${TYPE_COLORS[type]}`}>
                  {type}
                </span>
              ))}
              <span className="text-gray-400 self-center">= type de territoire</span>
            </div>
          </div>

          {/* ── Historique prix ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                <h2 className="font-bold text-gray-900">Historique public enseigne</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportHistory}
                  className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium border border-violet-200 rounded-lg px-3 py-1.5 hover:bg-violet-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                >
                  {showHistory ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {showHistory && (
              <>
                <p className="text-xs text-gray-400 mb-3">
                  Indice moyen des prix (base 100 = Jan {prevYear}) — données publiques
                  reconstituées
                </p>
                <Sparkline data={company.priceHistory} />
                <div className="flex justify-between mt-1">
                  {MONTHS.map((m, i) => (
                    <span key={i} className="text-[10px] text-gray-400">
                      {m}
                    </span>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="bg-violet-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-violet-700">{company.priceHistory[11]}</p>
                    <p className="text-xs text-gray-500">Indice Déc {prevYear}</p>
                  </div>
                  <div className="bg-violet-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-violet-700">
                      +{(company.priceHistory[11] - company.priceHistory[0]).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">Variation annuelle</p>
                  </div>
                  <div className="bg-violet-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-violet-700">
                      {(
                        ((company.priceHistory[11] - company.priceHistory[0]) /
                          company.priceHistory[0]) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                    <p className="text-xs text-gray-500">Inflation {prevYear}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
