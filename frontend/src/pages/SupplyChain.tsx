/**
 * SupplyChain — Sources douanes & fret publics
 * Route : /chaine-approvisionnement
 * Module 19 — Chaîne d'approvisionnement
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Ship, Package, Globe, Download, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CustomsSource {
  name: string;
  agency: string;
  url: string;
  lastUpdate: string;
  description: string;
}

interface FreightRate {
  route: string;
  territory: string;
  flag: string;
  ratePerContainer: number;
  transitDays: number;
  impactPct: number; // % de surcoût estimé sur prix final
}

interface ImportVolume {
  category: string;
  territory: string;
  volumeTons: number;
  valueM: number; // millions EUR
}

interface QuarterlyImport {
  quarter: string;
  cost: number; // index 100 = Q1 2023
}

// ── Data ─────────────────────────────────────────────────────────────────────

const CUSTOMS_SOURCES: CustomsSource[] = [
  {
    name: 'Douanes françaises – DGDDI',
    agency: 'Direction générale des douanes et droits indirects',
    url: 'https://www.douane.gouv.fr',
    lastUpdate: '2024-12-01',
    description: 'Statistiques officielles du commerce extérieur France',
  },
  {
    name: 'Eurostat Trade Data',
    agency: 'Office statistique de l\'Union européenne',
    url: 'https://ec.europa.eu/eurostat',
    lastUpdate: '2024-11-15',
    description: 'Données commerce intra et extra-européen',
  },
  {
    name: 'INSEE – Données DOM',
    agency: 'Institut national de la statistique et des études économiques',
    url: 'https://www.insee.fr',
    lastUpdate: '2024-10-30',
    description: 'Statistiques économiques des départements d\'outre-mer',
  },
  {
    name: 'IEDOM / IEOM',
    agency: 'Institut d\'émission des départements/territoires d\'outre-mer',
    url: 'https://www.iedom.fr',
    lastUpdate: '2024-09-01',
    description: 'Rapports économiques annuels par territoire',
  },
];

const FREIGHT_RATES: FreightRate[] = [
  { route: 'Le Havre → Pointe-à-Pitre', territory: 'Guadeloupe', flag: '🇬🇵', ratePerContainer: 1850, transitDays: 14, impactPct: 8.2 },
  { route: 'Le Havre → Fort-de-France', territory: 'Martinique', flag: '🇲🇶', ratePerContainer: 1900, transitDays: 14, impactPct: 8.5 },
  { route: 'Le Havre → Cayenne', territory: 'Guyane', flag: '🇬🇫', ratePerContainer: 2100, transitDays: 18, impactPct: 10.1 },
  { route: 'Marseille → Saint-Denis', territory: 'La Réunion', flag: '🇷🇪', ratePerContainer: 2400, transitDays: 22, impactPct: 11.3 },
];

const IMPORT_VOLUMES: ImportVolume[] = [
  { category: 'Produits alimentaires', territory: 'GP', volumeTons: 320000, valueM: 620 },
  { category: 'Produits alimentaires', territory: 'MQ', volumeTons: 290000, valueM: 570 },
  { category: 'Produits alimentaires', territory: 'RE', volumeTons: 410000, valueM: 790 },
  { category: 'Carburants', territory: 'GP', volumeTons: 180000, valueM: 380 },
  { category: 'Matériaux construction', territory: 'GF', volumeTons: 95000, valueM: 210 },
  { category: 'Médicaments / Santé', territory: 'RE', volumeTons: 12000, valueM: 480 },
];

const QUARTERLY_COSTS: QuarterlyImport[] = [
  { quarter: 'T1 2023', cost: 100 },
  { quarter: 'T2 2023', cost: 104 },
  { quarter: 'T3 2023', cost: 107 },
  { quarter: 'T4 2023', cost: 109 },
  { quarter: 'T1 2024', cost: 112 },
  { quarter: 'T2 2024', cost: 115 },
  { quarter: 'T3 2024', cost: 118 },
  { quarter: 'T4 2024', cost: 121 },
];

// ── CSV export ────────────────────────────────────────────────────────────────

function exportCSV() {
  const freightRows = FREIGHT_RATES.map(
    (r) => `"${r.route}","${r.territory}",${r.ratePerContainer},${r.transitDays},${r.impactPct}%`,
  ).join('\n');
  const content =
    'Route,Territoire,Tarif container (€),Transit (jours),Impact prix\n' + freightRows;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fret-douanes-dom.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SupplyChain() {
  const [activeTab, setActiveTab] = useState<'douanes' | 'fret' | 'volumes' | 'timeline'>('douanes');

  const maxCost = Math.max(...QUARTERLY_COSTS.map((q) => q.cost));

  return (
    <>
      <Helmet>
        <title>Chaîne d'approvisionnement — A KI PRI SA YÉ</title>
        <meta
          name='description'
          content="Sources douanes, données fret et coûts d'importation DOM — A KI PRI SA YÉ"
        />
      </Helmet>

      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-4xl mx-auto px-4 py-6 pb-12 space-y-6'>

          {/* ── Header ── */}
          <div className='bg-gradient-to-r from-sky-700 to-blue-900 rounded-2xl p-6 text-white'>
            <div className='flex items-center gap-3 mb-2'>
              <Ship className='w-7 h-7 text-sky-300' />
              <h1 className='text-2xl font-black'>⛵ Chaîne d'approvisionnement</h1>
            </div>
            <p className='text-sky-200 text-sm'>
              Sources douanes publiques, données fret maritime et impact sur les prix
            </p>
          </div>

          {/* ── Tabs ── */}
          <div className='flex flex-wrap gap-2'>
            {([
              ['douanes', '🏛️ Sources douanes', Globe],
              ['fret', '🚢 Données fret', Ship],
              ['volumes', '📦 Volumes import', Package],
              ['timeline', '📈 Évolution coûts', TrendingUp],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Douanes ── */}
          {activeTab === 'douanes' && (
            <div className='space-y-3'>
              {CUSTOMS_SOURCES.map((src) => (
                <div key={src.name} className='bg-white border border-gray-200 rounded-xl p-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <p className='font-semibold text-gray-900 text-sm'>{src.name}</p>
                      <p className='text-xs text-blue-600 font-medium mt-0.5'>{src.agency}</p>
                      <p className='text-xs text-gray-500 mt-1'>{src.description}</p>
                    </div>
                    <div className='text-right flex-shrink-0'>
                      <span className='text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full'>
                        Màj: {new Date(src.lastUpdate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <p className='text-xs text-gray-400 text-center'>
                Données officielles — usage informatif uniquement
              </p>
            </div>
          )}

          {/* ── Fret ── */}
          {activeTab === 'fret' && (
            <div>
              <div className='flex justify-end mb-3'>
                <button
                  onClick={() => { exportCSV(); toast.success('Export CSV téléchargé'); }}
                  className='flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors'
                >
                  <Download className='w-4 h-4' />
                  Exporter CSV
                </button>
              </div>
              <div className='overflow-x-auto'>
                <table className='w-full bg-white border border-gray-200 rounded-xl overflow-hidden text-sm'>
                  <thead className='bg-blue-50'>
                    <tr>
                      <th className='px-4 py-3 text-left text-xs font-semibold text-blue-800'>Route</th>
                      <th className='px-4 py-3 text-left text-xs font-semibold text-blue-800'>Territoire</th>
                      <th className='px-4 py-3 text-right text-xs font-semibold text-blue-800'>Tarif 20ft (€)</th>
                      <th className='px-4 py-3 text-right text-xs font-semibold text-blue-800'>Transit</th>
                      <th className='px-4 py-3 text-right text-xs font-semibold text-blue-800'>Impact prix</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {FREIGHT_RATES.map((r) => (
                      <tr key={r.route} className='hover:bg-gray-50'>
                        <td className='px-4 py-3 text-gray-700'>{r.route}</td>
                        <td className='px-4 py-3'>
                          <span className='flex items-center gap-1.5'>
                            <span>{r.flag}</span>
                            <span className='text-gray-700'>{r.territory}</span>
                          </span>
                        </td>
                        <td className='px-4 py-3 text-right font-semibold text-gray-900'>
                          {r.ratePerContainer.toLocaleString('fr-FR')} €
                        </td>
                        <td className='px-4 py-3 text-right text-gray-600'>{r.transitDays}j</td>
                        <td className='px-4 py-3 text-right'>
                          <span className={`font-semibold ${r.impactPct > 10 ? 'text-red-600' : 'text-orange-500'}`}>
                            +{r.impactPct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className='text-xs text-gray-400 mt-2'>
                * Tarifs moyens conteneur 20 pieds — Référence 2024
              </p>
            </div>
          )}

          {/* ── Volumes ── */}
          {activeTab === 'volumes' && (
            <div className='bg-white border border-gray-200 rounded-xl overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600'>Catégorie</th>
                    <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600'>Territoire</th>
                    <th className='px-4 py-3 text-right text-xs font-semibold text-gray-600'>Volume (t)</th>
                    <th className='px-4 py-3 text-right text-xs font-semibold text-gray-600'>Valeur (M€)</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {IMPORT_VOLUMES.map((v, i) => (
                    <tr key={i} className='hover:bg-gray-50'>
                      <td className='px-4 py-3 text-gray-700'>{v.category}</td>
                      <td className='px-4 py-3 text-gray-600'>{v.territory}</td>
                      <td className='px-4 py-3 text-right font-medium text-gray-900'>
                        {v.volumeTons.toLocaleString('fr-FR')}
                      </td>
                      <td className='px-4 py-3 text-right font-medium text-blue-700'>
                        {v.valueM} M€
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Timeline ── */}
          {activeTab === 'timeline' && (
            <div className='bg-white border border-gray-200 rounded-xl p-5'>
              <h2 className='font-bold text-gray-900 mb-1'>
                Évolution trimestrielle des coûts d'importation
              </h2>
              <p className='text-xs text-gray-400 mb-4'>Indice base 100 = T1 2023</p>
              <div className='flex items-end gap-3 h-32'>
                {QUARTERLY_COSTS.map((q) => {
                  const height = Math.round((q.cost / maxCost) * 100);
                  return (
                    <div key={q.quarter} className='flex-1 flex flex-col items-center gap-1'>
                      <span className='text-xs font-semibold text-blue-700'>{q.cost}</span>
                      <div
                        className='w-full bg-blue-500 rounded-t-sm'
                        style={{ height: `${height}%` }}
                        title={`${q.quarter}: ${q.cost}`}
                      />
                      <span className='text-[10px] text-gray-400 rotate-45 origin-left mt-1 whitespace-nowrap'>
                        {q.quarter}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className='text-xs text-gray-400 mt-6 text-center'>
                Source : DGDDI / Eurostat — données reconstituées à titre indicatif
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
