import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  HardHat,
  AlertCircle,
  Info,
  TrendingUp,
  Download,
  Filter,
  BarChart3,
  Search,
} from 'lucide-react';
import PriceChart from '../components/comparateur/LazyPriceChart';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

interface MaterialPrice {
  territory: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  supplier: string;
  observationDate: string;
  source: string;
  confidence: 'élevée' | 'moyenne' | 'faible';
}

interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  reference: string;
  usage: string;
  prices: MaterialPrice[];
}

interface BuildingData {
  metadata: {
    source: string;
    methodology: string;
    disclaimer: string;
    lastUpdate: string;
  };
  territories: { code: string; name: string; surcoûtMoyen: string }[];
  materials: Material[];
}

const TERRITORY_NAMES: Record<string, string> = {
  GP: 'Guadeloupe',
  MQ: 'Martinique',
  GF: 'Guyane',
  RE: 'La Réunion',
  YT: 'Mayotte',
  PM: 'Saint-Pierre-et-Miquelon',
  FR: 'Hexagone',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  élevée: 'text-green-400',
  moyenne: 'text-yellow-400',
  faible: 'text-orange-400',
};

const CATEGORIES = [
  'Toutes catégories',
  'Gros œuvre',
  'Charpente / Couverture',
  'Isolation',
  'Menuiserie',
  'Plomberie / Sanitaire',
  'Électricité',
  'Peinture / Revêtement',
];

const BuildingMaterialsComparator: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BuildingData | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<string>('GP');
  const [compareWith, setCompareWith] = useState<string>('FR');
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes catégories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/building-materials-prices.json`)
      .then((r) => {
        if (!r.ok) throw new Error('Données non disponibles');
        return r.json();
      })
      .then((d: BuildingData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError('Impossible de charger les données matériaux');
        setLoading(false);
      });
  }, []);

  const filteredMaterials = useMemo(() => {
    if (!data) return [];
    return data.materials.filter((m) => {
      if (selectedCategory !== 'Toutes catégories' && m.category !== selectedCategory) return false;
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      const hasTerr = m.prices.some((p) => p.territory === selectedTerritory);
      return hasTerr;
    });
  }, [data, selectedCategory, searchQuery, selectedTerritory]);

  const getPriceForTerritory = (material: Material, territory: string) =>
    material.prices.find((p) => p.territory === territory);

  const getDiffPercent = (domPrice: number, refPrice: number) => {
    if (!refPrice) return null;
    return Math.round(((domPrice - refPrice) / refPrice) * 100);
  };

  const getDiffColor = (pct: number | null) => {
    if (pct === null) return 'text-gray-400';
    if (pct > 50) return 'text-red-400';
    if (pct > 25) return 'text-orange-400';
    if (pct > 0) return 'text-yellow-400';
    return 'text-green-400';
  };

  const chartData = useMemo(() => {
    if (!selectedMaterial) return null;
    const territories = data?.territories ?? [];
    const prices = territories
      .map((t) => ({
        label: t.name,
        price: getPriceForTerritory(selectedMaterial, t.code)?.avgPrice ?? null,
      }))
      .filter((p): p is { label: string; price: number } => p.price !== null);
    return {
      labels: prices.map((p) => p.label),
      datasets: [
        {
          label: `Prix moyen (€ / ${selectedMaterial.unit})`,
          data: prices.map((p) => p.price),
          backgroundColor: prices.map((p) =>
            p.label === 'Hexagone (référence)' ? 'rgba(59,130,246,0.8)' : 'rgba(249,115,22,0.7)'
          ),
        },
      ],
    };
  }, [selectedMaterial, data]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      [
        'Matériau',
        'Catégorie',
        'Unité',
        'Territoire',
        'Prix moy.',
        'Prix min.',
        'Prix max.',
        'Fournisseur',
        'Date',
      ],
      ...filteredMaterials.flatMap((m) =>
        m.prices
          .filter((p) => p.territory === selectedTerritory || p.territory === compareWith)
          .map((p) => [
            m.name,
            m.category,
            m.unit,
            TERRITORY_NAMES[p.territory] ?? p.territory,
            p.avgPrice,
            p.minPrice,
            p.maxPrice,
            p.supplier,
            p.observationDate.slice(0, 10),
          ])
      ),
    ];
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `materiaux-${selectedTerritory}-vs-${compareWith}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Helmet>
        <title>Comparateur Matériaux de Construction – A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Comparez les prix des matériaux de construction (ciment, fer, tôles, bois…) entre les territoires ultramarins et la métropole."
        />
        <link
          rel="canonical"
          href="https://teetee971.github.io/akiprisaye-web/comparateur-materiaux-batiment"
        />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/comparateur-materiaux-batiment"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/comparateur-materiaux-batiment"
        />
      </Helmet>
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 pb-12 pt-6">
          {/* Hero Banner */}
          <div className="mb-6">
            <HeroImage
              src={PAGE_HERO_IMAGES.comparateurMateriauxBTP}
              alt="Comparateur matériaux construction DOM-TOM — chantier et béton"
              gradient="from-orange-900 to-slate-900"
              height="h-36 sm:h-48"
            >
              <div className="flex items-center gap-3 mb-2">
                <HardHat className="w-7 h-7 text-orange-300 drop-shadow" />
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">
                  🏗️ Comparateur Matériaux BTP
                </h1>
              </div>
              <p className="text-orange-100 text-sm drop-shadow">
                Ciment, fer à béton, tôles, PVC — Prix en Outre-mer vs Hexagone
              </p>
            </HeroImage>
          </div>

          {/* Source notice */}
          {data && (
            <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6 text-sm text-orange-200">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p>
                  <strong>Sources :</strong> {data.metadata.source}
                </p>
                <p className="mt-1 text-xs text-orange-300/70">{data.metadata.disclaimer}</p>
              </div>
            </div>
          )}

          {/* Surcoût moyen par territoire */}
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {data.territories
                .filter((t) => t.code !== 'FR')
                .map((t) => (
                  <button
                    key={t.code}
                    onClick={() => setSelectedTerritory(t.code)}
                    className={`rounded-xl border p-3 text-left transition-all ${selectedTerritory === t.code ? 'border-orange-500 bg-orange-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}
                  >
                    <p className="font-semibold text-sm text-white">{t.name}</p>
                    <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Surcoût moyen {t.surcoûtMoyen}
                    </p>
                  </button>
                ))}
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="bmc-comparer-avec" className="block text-sm text-gray-400 mb-1">
                Comparer avec
              </label>
              <select
                id="bmc-comparer-avec"
                value={compareWith}
                onChange={(e) => setCompareWith(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
              >
                {data?.territories.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="bmc-categorie" className="block text-sm text-gray-400 mb-1">
                <Filter className="w-3 h-3 inline mr-1" />
                Catégorie
              </label>
              <select
                id="bmc-categorie"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="bmc-recherche" className="block text-sm text-gray-400 mb-1">
                <Search className="w-3 h-3 inline mr-1" />
                Rechercher un matériau
              </label>
              <input
                id="bmc-recherche"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ciment, parpaing, tôle..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-400 py-10 justify-center">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Export */}
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-400">
                  {filteredMaterials.length} matériaux affichés
                </p>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
                >
                  <Download className="w-4 h-4" />
                  Exporter CSV
                </button>
              </div>

              {/* Materials table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800 text-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left">Matériau</th>
                      <th className="px-4 py-3 text-left">Catégorie</th>
                      <th className="px-4 py-3 text-right">
                        {TERRITORY_NAMES[selectedTerritory] ?? selectedTerritory}
                      </th>
                      <th className="px-4 py-3 text-right">
                        {TERRITORY_NAMES[compareWith] ?? compareWith}
                      </th>
                      <th className="px-4 py-3 text-center">Écart</th>
                      <th className="px-4 py-3 text-center">Fiabilité</th>
                      <th className="px-4 py-3 text-center">Détail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterials.map((material) => {
                      const domP = getPriceForTerritory(material, selectedTerritory);
                      const refP = getPriceForTerritory(material, compareWith);
                      const diff =
                        domP && refP ? getDiffPercent(domP.avgPrice, refP.avgPrice) : null;
                      const fmt = (n?: number) => (n != null ? `${n.toFixed(2)} €` : '—');
                      return (
                        <tr
                          key={material.id}
                          className={`border-t border-slate-800 hover:bg-slate-800/50 cursor-pointer ${selectedMaterial?.id === material.id ? 'bg-orange-500/10' : ''}`}
                          onClick={() =>
                            setSelectedMaterial(
                              selectedMaterial?.id === material.id ? null : material
                            )
                          }
                        >
                          <td className="px-4 py-3">
                            <p className="text-white font-medium">{material.name}</p>
                            <p className="text-xs text-gray-500">{material.usage}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{material.category}</td>
                          <td className="px-4 py-3 text-right text-white font-semibold">
                            {fmt(domP?.avgPrice)}
                            {domP && <p className="text-xs text-gray-500">{domP.supplier}</p>}
                          </td>
                          <td className="px-4 py-3 text-right text-blue-300">
                            {fmt(refP?.avgPrice)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {diff !== null ? (
                              <span className={`font-bold text-sm ${getDiffColor(diff)}`}>
                                {diff > 0 ? `+${diff}%` : `${diff}%`}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {domP && (
                              <span
                                className={`text-xs ${CONFIDENCE_COLORS[domP.confidence] ?? 'text-gray-400'}`}
                              >
                                {domP.confidence}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-blue-400">
                            {selectedMaterial?.id === material.id ? '▲ Fermer' : '▼ Voir'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Detail panel */}
              {selectedMaterial && chartData && (
                <div className="bg-slate-900 border border-orange-500/30 rounded-xl p-5 mb-6">
                  <h2 className="text-lg font-semibold text-white mb-1">{selectedMaterial.name}</h2>
                  <p className="text-xs text-gray-400 mb-4">
                    {selectedMaterial.reference} · {selectedMaterial.usage}
                  </p>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-orange-400" />
                      Comparaison tous territoires (prix moyen €/{selectedMaterial.unit})
                    </h3>
                    <PriceChart data={chartData} type="bar" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                    {selectedMaterial.prices.map((p) => (
                      <div key={p.territory} className="bg-slate-800 rounded-lg p-3 text-sm">
                        <p className="font-semibold text-white">
                          {TERRITORY_NAMES[p.territory] ?? p.territory}
                        </p>
                        <p className="text-lg font-bold text-orange-400 mt-1">
                          {p.avgPrice.toFixed(2)} €
                        </p>
                        <p className="text-xs text-gray-500">
                          min {p.minPrice.toFixed(2)} – max {p.maxPrice.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{p.supplier}</p>
                        <p
                          className={`text-xs mt-1 ${CONFIDENCE_COLORS[p.confidence] ?? 'text-gray-400'}`}
                        >
                          Fiabilité : {p.confidence}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredMaterials.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                  <HardHat className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p>Aucun matériau ne correspond à votre recherche.</p>
                </div>
              )}

              {/* Source footer */}
              <div className="text-xs text-gray-600 mt-6">
                <p>Sources : {data.metadata.source}</p>
                <p className="mt-1">Méthode : {data.metadata.methodology}</p>
                <p className="mt-1">
                  Dernière mise à jour :{' '}
                  {new Date(data.metadata.lastUpdate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default BuildingMaterialsComparator;
