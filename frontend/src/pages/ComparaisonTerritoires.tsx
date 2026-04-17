/**
 * ComparaisonTerritoires
 *
 * Vue macro des territoires ultramarins : indicateurs économiques réels
 * (IEDOM / INSEE / CEROM) croisés avec les prix alimentaires issus des
 * snapshots Observatoire.  Aucune donnée simulée — tout provient de sources
 * officielles citées dans economic-indicators.json et dans les fichiers
 * observatoire/*.json.
 */

import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Users,
  TrendingUp,
  Briefcase,
  ShoppingCart,
  Ship,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { loadObservatoireData } from '../services/observatoireDataLoader';
import { buildMonthlyAggregates } from '../services/temporalAggregationService';
import { TERRITORIES } from '../services/territoryNormalizationService';
import { HeroImage } from '../components/ui/HeroImage';

// ─── Hero (Unsplash free licence) ────────────────────────────────────────────
const HERO_SRC =
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1600&q=80';

// ─── Territories to display ───────────────────────────────────────────────────
const DOM_TERRITORIES = TERRITORIES.filter((t) =>
  ['gp', 'mq', 'gf', 're', 'yt', 'pm', 'bl', 'mf', 'fr'].includes(t.code)
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface EconomicIndicator {
  code: string;
  label: string;
  flag: string;
  population: number;
  population_year: number;
  pib_par_habitant_eur: number;
  pib_year: number;
  taux_chomage_pct: number;
  chomage_year: number;
  taux_pauvrete_pct: number;
  surcout_alimentaire_pct: number;
  octroi_de_mer_taux_moyen_pct: number;
  distance_metropole_km: number;
  transport_maritime_duree_jours: number;
  salaire_median_mensuel_net_eur: number;
  smic_mensuel_net_eur: number;
  sursalaire_fonctionnaire_pct: number;
  source_note: string;
}

interface EconomicFile {
  _meta: { description: string; updated: string; sources: string[] };
  territories: EconomicIndicator[];
}

interface CategoryAvg {
  category: string;
  avgPrice: number;
  hexAvg: number | null;
  surplusPct: number | null;
}

interface TerritoryData {
  code: string;
  label: string;
  flag: string;
  eco: EconomicIndicator | null;
  categoryAvgs: CategoryAvg[];
  basketAvg: number | null; // average price across all tracked food categories
  hexBasketAvg: number | null;
  affordabilityIndex: number | null; // basket / (salaire_median / 100)  — lower = more affordable
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0) {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: decimals });
}

function pct(n: number) {
  return `${n > 0 ? '+' : ''}${n.toFixed(1)} %`;
}

function colorForSurplus(v: number | null): string {
  if (v == null) return 'text-slate-400';
  if (v <= 5) return 'text-green-600 dark:text-green-400';
  if (v <= 15) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function colorForChomage(v: number): string {
  if (v <= 8) return 'text-green-600 dark:text-green-400';
  if (v <= 20) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function barWidth(value: number, max: number): string {
  return `${Math.min(100, Math.round((value / max) * 100))}%`;
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ComparaisonTerritoires() {
  const [ecoData, setEcoData] = useState<EconomicIndicator[]>([]);
  const [ecoSources, setEcoSources] = useState<string[]>([]);
  const [ecoLoading, setEcoLoading] = useState(true);

  const [allMonthly, setAllMonthly] = useState<ReturnType<typeof buildMonthlyAggregates>>([]);
  const [priceLoading, setPriceLoading] = useState(true);

  const [expandedTerritory, setExpandedTerritory] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);

  // ── Load economic indicators ──────────────────────────────────────────────
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/economic-indicators.json`)
      .then((r) => r.json())
      .then((json: EconomicFile) => {
        setEcoData(json.territories ?? []);
        setEcoSources(json._meta?.sources ?? []);
      })
      .catch(() => {
        /* silently ignore – indicators degrade gracefully */
      })
      .finally(() => setEcoLoading(false));
  }, []);

  // ── Load observatoire price snapshots ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setPriceLoading(true);
    const domTerr = DOM_TERRITORIES.filter(
      (t) => t.code !== 'bl' && t.code !== 'pm' && t.code !== 'mf'
    );
    Promise.all(
      domTerr.map((t) =>
        loadObservatoireData(t.dataFileStem, ['2026-03', '2026-02', '2026-01']).catch(() => [])
      )
    )
      .then((all) => {
        if (cancelled) return;
        setAllMonthly(buildMonthlyAggregates(all.flat()));
      })
      .catch(() => {
        /* ignore */
      })
      .finally(() => {
        if (!cancelled) setPriceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Build territory rows ──────────────────────────────────────────────────
  const territoryRows = useMemo<TerritoryData[]>(() => {
    const LATEST = ['2026-03', '2026-02', '2026-01'];
    const FOOD_CATS = ['Épicerie', 'Produits laitiers', 'Fruits et légumes', 'Boissons'];

    return DOM_TERRITORIES.map((t) => {
      const eco = ecoData.find((e) => e.code === t.code) ?? null;

      // Find most recent monthly averages per category for this territory
      const categoryAvgs: CategoryAvg[] = FOOD_CATS.map((cat) => {
        let entry = null;
        for (const month of LATEST) {
          entry = allMonthly.find(
            (m) =>
              m.category === cat &&
              m.territory.toLowerCase().replace(/[-_\s]/g, '') ===
                t.labelFull.toLowerCase().replace(/[-_\s]/g, '') &&
              m.month === month
          );
          if (entry) break;
        }

        let hexEntry = null;
        for (const month of LATEST) {
          hexEntry = allMonthly.find(
            (m) => m.category === cat && m.territory === 'Hexagone' && m.month === month
          );
          if (hexEntry) break;
        }

        const surplusPct =
          entry && hexEntry && hexEntry.avgPrice > 0
            ? ((entry.avgPrice - hexEntry.avgPrice) / hexEntry.avgPrice) * 100
            : null;

        return {
          category: cat,
          avgPrice: entry?.avgPrice ?? 0,
          hexAvg: hexEntry?.avgPrice ?? null,
          surplusPct: surplusPct != null ? Math.round(surplusPct * 10) / 10 : null,
        };
      });

      const validCats = categoryAvgs.filter((c) => c.avgPrice > 0);
      const basketAvg =
        validCats.length > 0
          ? Math.round((validCats.reduce((s, c) => s + c.avgPrice, 0) / validCats.length) * 100) /
            100
          : null;

      const hexCats = categoryAvgs.filter((c) => c.hexAvg != null && c.hexAvg > 0);
      const hexBasketAvg =
        hexCats.length > 0
          ? Math.round((hexCats.reduce((s, c) => s + c.hexAvg!, 0) / hexCats.length) * 100) / 100
          : null;

      // Affordability: % of monthly median wage needed for a standard 50-item basket
      // Proxy: basket item avg × 50 / salaire_median
      const affordabilityIndex =
        basketAvg != null && eco != null && eco.salaire_median_mensuel_net_eur > 0
          ? Math.round(((basketAvg * 50) / eco.salaire_median_mensuel_net_eur) * 100) / 100
          : null;

      return {
        code: t.code,
        label: t.label,
        flag: t.flag,
        eco,
        categoryAvgs,
        basketAvg,
        hexBasketAvg,
        affordabilityIndex,
      };
    });
  }, [ecoData, allMonthly]);

  const loading = ecoLoading || priceLoading;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Helmet>
        <title>Comparaison des territoires — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Tableau de bord macro : indicateurs économiques réels (IEDOM/INSEE) croisés avec les prix alimentaires constatés dans les DROM-COM."
        />
        <link
          rel="canonical"
          href="https://teetee971.github.io/akiprisaye-web/comparaison-territoires"
        />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/comparaison-territoires"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/comparaison-territoires"
        />
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Hero */}
          <HeroImage
            src={HERO_SRC}
            alt="Marchés et produits des territoires ultramarins"
            gradient="from-indigo-900 to-slate-950"
            height="h-48 sm:h-64"
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
              Comparaison des territoires
            </h1>
            <p className="text-indigo-100 text-sm mt-1 drop-shadow">
              Indicateurs économiques réels · Prix alimentaires · Pouvoir d'achat
            </p>
            <p className="text-indigo-200 text-xs mt-1 drop-shadow opacity-80">
              Sources : IEDOM · INSEE · CEROM · Observatoire citoyens
            </p>
          </HeroImage>

          {/* Info banner */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p>
                  Cette page croise des <strong>données économiques officielles</strong> (IEDOM,
                  INSEE, CEROM) avec les <strong>prix alimentaires relevés citoyens</strong>{' '}
                  (Observatoire A KI PRI SA YÉ). L'indice d'accessibilité estime la part du salaire
                  médian consacrée à un panier de 50 articles de référence.
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
            </div>
          )}

          {!loading && (
            <>
              {/* Summary table */}
              <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    Vue d'ensemble — indicateurs clés
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    PIB/habitant et salaire médian net mensuel en EUR · Taux de chômage au sens du
                    BIT
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={{ minWidth: '520px' }}>
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        <th className="text-left px-3 py-3 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 min-w-[120px]">
                          Territoire
                        </th>
                        <th className="text-right px-3 py-3 hidden sm:table-cell">Population</th>
                        <th className="text-right px-3 py-3 hidden sm:table-cell">PIB/hab.</th>
                        <th className="text-right px-3 py-3">Chômage</th>
                        <th className="text-right px-3 py-3 hidden xs:table-cell">Pauvreté</th>
                        <th className="text-right px-3 py-3">Surcoût alim.</th>
                        <th className="text-right px-3 py-3 pr-4">Accessibilité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {territoryRows.map((row) => (
                        <tr
                          key={row.code}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer ${
                            row.code === 'fr' ? 'bg-slate-50/60 dark:bg-slate-700/20' : ''
                          }`}
                          onClick={() =>
                            setExpandedTerritory(expandedTerritory === row.code ? null : row.code)
                          }
                        >
                          <td className="px-3 py-3 sticky left-0 bg-white dark:bg-slate-800 z-10">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base leading-none">{row.flag}</span>
                              <span className="font-medium text-slate-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">
                                {row.label}
                              </span>
                              {expandedTerritory === row.code ? (
                                <ChevronUp className="w-3 h-3 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronDown className="w-3 h-3 text-slate-400 opacity-50 shrink-0" />
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300 hidden sm:table-cell">
                            {row.eco ? fmt(row.eco.population) : '—'}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-900 dark:text-white hidden sm:table-cell">
                            {row.eco ? `${fmt(row.eco.pib_par_habitant_eur)} €` : '—'}
                          </td>
                          <td
                            className={`px-3 py-3 text-right font-semibold ${row.eco ? colorForChomage(row.eco.taux_chomage_pct) : 'text-slate-400'}`}
                          >
                            {row.eco ? `${row.eco.taux_chomage_pct} %` : '—'}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-400 hidden xs:table-cell">
                            {row.eco ? `${row.eco.taux_pauvrete_pct} %` : '—'}
                          </td>
                          <td
                            className={`px-3 py-3 text-right font-semibold ${row.eco ? colorForSurplus(row.eco.surcout_alimentaire_pct) : 'text-slate-400'}`}
                          >
                            {row.eco != null
                              ? row.eco.surcout_alimentaire_pct === 0
                                ? 'réf.'
                                : pct(row.eco.surcout_alimentaire_pct)
                              : '—'}
                          </td>
                          <td
                            className={`px-3 py-3 text-right pr-4 font-semibold ${row.affordabilityIndex != null ? colorForSurplus((row.affordabilityIndex - 1) * 100) : 'text-slate-400'}`}
                          >
                            {row.affordabilityIndex != null
                              ? `× ${row.affordabilityIndex.toFixed(2)}`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-slate-400 px-4 py-2 border-t border-slate-100 dark:border-slate-700">
                  <strong>Accessibilité</strong> = coût d'un panier de 50 articles / salaire médian
                  net mensuel. Plus l'indice est élevé, plus le panier pèse sur le budget. Cliquez
                  sur un territoire pour détailler ses prix par catégorie.
                </p>
              </div>

              {/* Expanded territory detail */}
              {expandedTerritory &&
                (() => {
                  const row = territoryRows.find((r) => r.code === expandedTerritory);
                  if (!row) return null;
                  return (
                    <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-indigo-200 dark:border-indigo-700 p-5">
                      <div className="flex items-center gap-3 mb-5">
                        <span className="text-3xl">{row.flag}</span>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {row.label}
                          </h3>
                          {row.eco && (
                            <p className="text-xs text-slate-500">{row.eco.source_note}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        {row.eco && (
                          <>
                            <StatCard
                              icon={<Users className="w-4 h-4 text-indigo-500" />}
                              label="Population"
                              value={`${fmt(row.eco.population)} hab.`}
                              sub={`recensement ${row.eco.population_year}`}
                            />
                            <StatCard
                              icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
                              label="PIB / habitant"
                              value={`${fmt(row.eco.pib_par_habitant_eur)} €`}
                              sub={`source CEROM ${row.eco.pib_year}`}
                            />
                            <StatCard
                              icon={<Briefcase className="w-4 h-4 text-amber-500" />}
                              label="Chômage"
                              value={`${row.eco.taux_chomage_pct} %`}
                              sub={`BIT ${row.eco.chomage_year}`}
                              valueClass={colorForChomage(row.eco.taux_chomage_pct)}
                            />
                            <StatCard
                              icon={<Ship className="w-4 h-4 text-blue-500" />}
                              label="Distance France"
                              value={
                                row.eco.distance_metropole_km === 0
                                  ? 'référence'
                                  : `${fmt(row.eco.distance_metropole_km)} km`
                              }
                              sub={
                                row.eco.transport_maritime_duree_jours > 0
                                  ? `≈ ${row.eco.transport_maritime_duree_jours} j. bateau`
                                  : 'territoire de référence'
                              }
                            />
                          </>
                        )}
                      </div>

                      {/* Salaire vs Hexagone */}
                      {row.eco && (
                        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                            Salaire médian net mensuel
                          </h4>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-500">{row.label}</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {fmt(row.eco.salaire_median_mensuel_net_eur)} €
                                </span>
                              </div>
                              <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{
                                    width: barWidth(row.eco.salaire_median_mensuel_net_eur, 2400),
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          {row.eco.code !== 'fr' && (
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-slate-500">
                                    France métropolitaine (réf.)
                                  </span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    1 940 €
                                  </span>
                                </div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-slate-400 rounded-full"
                                    style={{ width: barWidth(1940, 2400) }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          {row.eco.sursalaire_fonctionnaire_pct > 0 && (
                            <p className="text-xs text-slate-500 mt-2">
                              ℹ️ Le sursalaire de la fonction publique (+
                              {row.eco.sursalaire_fonctionnaire_pct} %) compense partiellement le
                              surcoût de la vie. Il ne bénéficie pas aux salariés du privé.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Category price comparison */}
                      {row.categoryAvgs.some((c) => c.avgPrice > 0) && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-emerald-500" />
                            Prix moyens constatés vs Hexagone — données Observatoire
                          </h4>
                          <div className="space-y-2">
                            {row.categoryAvgs
                              .filter((c) => c.avgPrice > 0)
                              .map((cat) => (
                                <div key={cat.category} className="flex items-center gap-3 text-sm">
                                  <span className="w-36 text-slate-600 dark:text-slate-400 text-xs truncate">
                                    {cat.category}
                                  </span>
                                  <span className="w-16 text-right font-semibold text-slate-900 dark:text-white text-xs">
                                    {cat.avgPrice.toFixed(2)} €
                                  </span>
                                  {cat.hexAvg != null && (
                                    <span className="text-xs text-slate-400">
                                      (Hex : {cat.hexAvg.toFixed(2)} €)
                                    </span>
                                  )}
                                  {cat.surplusPct != null && (
                                    <span
                                      className={`ml-auto text-xs font-semibold ${colorForSurplus(cat.surplusPct)}`}
                                    >
                                      {cat.surplusPct === 0 ? 'parité' : pct(cat.surplusPct)}
                                    </span>
                                  )}
                                </div>
                              ))}
                          </div>
                          <p className="text-xs text-slate-400 mt-3">
                            Prix issus des relevés citoyens — dernière période disponible (mars 2026
                            ou plus récent).
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* Octroi de mer explanation */}
              <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  🏷️ L'octroi de mer : une taxe spécifique aux outre-mer
                </h2>
                <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <div>
                    <p className="mb-2">
                      L'
                      <strong className="text-slate-800 dark:text-slate-200">
                        octroi de mer
                      </strong>{' '}
                      est une taxe douanière perçue par les collectivités des DROM sur les
                      marchandises importées et les productions locales (taux différenciés). Elle
                      finance jusqu'à <strong>40 %</strong> des budgets des collectivités.
                    </p>
                    <p>
                      Instaurée depuis le XVIIe siècle, elle a été modernisée en 2004 et prorogée
                      jusqu'en 2030. Son taux varie selon le type de produit (0 % à 30 %) et la
                      collectivité.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {territoryRows
                      .filter((r) => r.eco && r.eco.octroi_de_mer_taux_moyen_pct > 0)
                      .sort(
                        (a, b) =>
                          (b.eco?.octroi_de_mer_taux_moyen_pct ?? 0) -
                          (a.eco?.octroi_de_mer_taux_moyen_pct ?? 0)
                      )
                      .map((row) => (
                        <div key={row.code} className="flex items-center gap-2">
                          <span className="text-base">{row.flag}</span>
                          <span className="text-xs text-slate-600 dark:text-slate-400 w-36 truncate">
                            {row.label}
                          </span>
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-400 rounded-full"
                              style={{ width: barWidth(row.eco!.octroi_de_mer_taux_moyen_pct, 12) }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 w-10 text-right">
                            {row.eco!.octroi_de_mer_taux_moyen_pct} %
                          </span>
                        </div>
                      ))}
                    <p className="text-xs text-slate-400 mt-1">
                      Taux moyen toutes catégories — source DGDDI 2023
                    </p>
                  </div>
                </div>
              </div>

              {/* Sources */}
              <div className="bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-4">
                <button
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 w-full"
                  onClick={() => setShowSources(!showSources)}
                >
                  <ExternalLink className="w-4 h-4" />
                  Sources officielles ({ecoSources.length})
                  {showSources ? (
                    <ChevronUp className="w-4 h-4 ml-auto" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  )}
                </button>
                {showSources && (
                  <ul className="mt-3 space-y-1">
                    {ecoSources.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5"
                      >
                        <span className="mt-0.5 text-slate-400">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  valueClass = 'text-slate-900 dark:text-white',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className={`text-base font-bold ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
