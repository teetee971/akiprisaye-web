/**
 * PaniersTypes — Paniers curatés DOM vs France métropolitaine
 *
 * Compare le coût de quatre paniers types entre les DOM et la métropole :
 *   - Panier alimentaire quotidien (~20 produits courants)
 *   - Panier hygiène / entretien
 *   - Panier bébé
 *   - Panier rentrée scolaire
 *
 * Les données proviennent des fichiers observatoire/*.json déjà générés
 * (territoire DOM + hexagone), croisées avec catalogue-prices.json quand
 * disponible.  Aucune source tierce nommée dans l'interface.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ShoppingCart,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  Share2,
  Download,
} from 'lucide-react';
import { EcartHexagone } from '../components/EcartHexagone';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { loadObservatoireData } from '../services/observatoireDataLoader';
import { TERRITORIES } from '../services/territoryNormalizationService';

// ─── Paniers curatés ──────────────────────────────────────────────────────────

interface PanierItem {
  produit: string;
  unite: string;
  categorie: string;
}

interface PanierType {
  id: string;
  label: string;
  emoji: string;
  description: string;
  items: PanierItem[];
}

const PANIERS: PanierType[] = [
  {
    id: 'alimentaire',
    label: 'Alimentaire quotidien',
    emoji: '🛒',
    description: 'Panier de 20 produits alimentaires courants pour une semaine.',
    items: [
      { produit: 'Lait demi-écrémé UHT 1L', unite: '1L', categorie: 'Produits laitiers' },
      { produit: 'Riz long blanc 1kg', unite: '1kg', categorie: 'Épicerie' },
      { produit: 'Sucre blanc 1kg', unite: '1kg', categorie: 'Épicerie' },
      { produit: 'Farine de blé T55 1kg', unite: '1kg', categorie: 'Épicerie' },
      { produit: 'Huile de tournesol 1L', unite: '1L', categorie: 'Épicerie' },
      { produit: 'Eau minérale 1,5L', unite: '1,5L', categorie: 'Boissons' },
      { produit: 'Café moulu 250g', unite: '250g', categorie: 'Épicerie' },
      { produit: 'Pâtes sèches 500g', unite: '500g', categorie: 'Épicerie' },
      { produit: 'Beurre doux 250g', unite: '250g', categorie: 'Produits laitiers' },
      { produit: 'Fromage râpé 200g', unite: '200g', categorie: 'Produits laitiers' },
      { produit: 'Yaourt nature 4×125g', unite: '4×125g', categorie: 'Produits laitiers' },
      { produit: 'Œufs calibre M (boîte 12)', unite: '12', categorie: 'Œufs' },
      { produit: 'Poulet entier 1kg', unite: '1kg', categorie: 'Viandes' },
      { produit: 'Conserve thon 185g', unite: '185g', categorie: 'Conserves' },
      { produit: 'Jambon blanc (4 tranches)', unite: '4 tr.', categorie: 'Charcuterie' },
      { produit: 'Tomates 1kg', unite: '1kg', categorie: 'Fruits & Légumes' },
      { produit: 'Bananes 1kg', unite: '1kg', categorie: 'Fruits & Légumes' },
      { produit: 'Lentilles 500g', unite: '500g', categorie: 'Épicerie' },
      { produit: "Jus d'orange 1L", unite: '1L', categorie: 'Boissons' },
      { produit: 'Pain de mie 500g', unite: '500g', categorie: 'Boulangerie' },
    ],
  },
  {
    id: 'hygiene',
    label: 'Hygiène & entretien',
    emoji: '🧴',
    description: "Produits d'hygiène personnelle et d'entretien ménager essentiels.",
    items: [
      { produit: 'Shampooing 400ml', unite: '400ml', categorie: 'Hygiène' },
      { produit: 'Gel douche 400ml', unite: '400ml', categorie: 'Hygiène' },
      { produit: 'Dentifrice 75ml', unite: '75ml', categorie: 'Hygiène' },
      { produit: 'Papier toilette 6 rouleaux', unite: '6 rl.', categorie: 'Hygiène' },
      { produit: 'Lessive liquide 1,5L', unite: '1,5L', categorie: 'Entretien' },
      { produit: 'Liquide vaisselle 750ml', unite: '750ml', categorie: 'Entretien' },
      { produit: 'Déodorant spray 150ml', unite: '150ml', categorie: 'Hygiène' },
      { produit: 'Essuie-tout 4 rouleaux', unite: '4 rl.', categorie: 'Entretien' },
    ],
  },
  {
    id: 'bebe',
    label: 'Panier bébé',
    emoji: '👶',
    description: 'Produits essentiels pour bébé (0–18 mois) — poste budgétaire important en DOM.',
    items: [
      { produit: 'Couches bébé taille 3 (44)', unite: '44 u.', categorie: 'Bébé' },
      { produit: 'Lait infantile 1er âge 900g', unite: '900g', categorie: 'Bébé' },
      { produit: 'Petits pots légumes 200g', unite: '200g', categorie: 'Bébé' },
      { produit: 'Lingettes bébé 72 unités', unite: '72 u.', categorie: 'Bébé' },
      { produit: 'Crème change bébé 75ml', unite: '75ml', categorie: 'Bébé' },
    ],
  },
  {
    id: 'scolaire',
    label: 'Rentrée scolaire',
    emoji: '🎒',
    description: 'Fournitures de base pour une rentrée en primaire.',
    items: [
      { produit: 'Cahier grand format 96 pages', unite: '1', categorie: 'Fournitures' },
      { produit: 'Stylos bille (lot 10)', unite: 'lot 10', categorie: 'Fournitures' },
      { produit: 'Crayons de couleur (12)', unite: '12', categorie: 'Fournitures' },
      { produit: 'Colle en stick 40g', unite: '40g', categorie: 'Fournitures' },
      { produit: 'Règle 30cm', unite: '1', categorie: 'Fournitures' },
      { produit: 'Cartable enfant', unite: '1', categorie: 'Fournitures' },
    ],
  },
];

// ─── Territoire options ───────────────────────────────────────────────────────

const DOM_TERRITORIES = TERRITORIES.filter((t) => ['gp', 'mq', 'gf', 're', 'yt'].includes(t.code));

/** Pseudo-territoire "Métropole seule" — affiche les prix hexagone sans comparaison */
const METRO_TERRITORY = {
  code: 'fr',
  label: 'Métropole',
  labelFull: 'Hexagone',
  flag: '🇫🇷',
} as const;

// ─── Types internes ───────────────────────────────────────────────────────────

interface ProduitPrix {
  produit: string;
  unite: string;
  categorie: string;
  prixDOM?: number;
  prixHex?: number;
  ecartPercent?: number;
}

interface PanierResult {
  items: ProduitPrix[];
  totalDOM: number;
  totalHex: number;
  ecartTotal: number;
  ecartPercent: number;
}

// ─── Data loading ─────────────────────────────────────────────────────────────

const DEFAULT_MONTHS = ['2026-03', '2026-02', '2026-01', '2025-12', '2025-11'];

async function loadPrix(territory: string, months: string[]) {
  const snaps = await loadObservatoireData(territory, months);
  // Flatten donnees
  const all: { produit: string; prix: number; unite: string; categorie: string }[] = [];
  for (const snap of snaps) {
    for (const d of snap.donnees) {
      all.push({ produit: d.produit, prix: d.prix, unite: d.unite, categorie: d.categorie });
    }
  }
  // Average by produit
  const byProduit = new Map<
    string,
    { sum: number; count: number; unite: string; categorie: string }
  >();
  for (const e of all) {
    const k = e.produit.toLowerCase();
    const cur = byProduit.get(k) ?? { sum: 0, count: 0, unite: e.unite, categorie: e.categorie };
    byProduit.set(k, {
      sum: cur.sum + e.prix,
      count: cur.count + 1,
      unite: e.unite,
      categorie: e.categorie,
    });
  }
  const result = new Map<string, { avg: number; unite: string; categorie: string }>();
  for (const [k, v] of byProduit.entries()) {
    result.set(k, {
      avg: Math.round((v.sum / v.count) * 100) / 100,
      unite: v.unite,
      categorie: v.categorie,
    });
  }
  return result;
}

function matchPrix(
  produit: string,
  priceMap: Map<string, { avg: number; unite: string; categorie: string }>
): number | undefined {
  const needle = produit.toLowerCase();
  // exact
  if (priceMap.has(needle)) return priceMap.get(needle)!.avg;
  // substring
  for (const [k, v] of priceMap.entries()) {
    if (needle.includes(k.slice(0, 8)) || k.includes(needle.slice(0, 8))) return v.avg;
  }
  return undefined;
}

function computePanier(
  panier: PanierType,
  domMap: Map<string, { avg: number; unite: string; categorie: string }>,
  hexMap: Map<string, { avg: number; unite: string; categorie: string }>
): PanierResult {
  const items: ProduitPrix[] = panier.items.map((item) => {
    const prixDOM = matchPrix(item.produit, domMap);
    const prixHex = matchPrix(item.produit, hexMap);
    const ecartPercent =
      prixDOM !== undefined && prixHex !== undefined && prixHex > 0
        ? Math.round(((prixDOM - prixHex) / prixHex) * 1000) / 10
        : undefined;
    return { ...item, prixDOM, prixHex, ecartPercent };
  });

  const withDOM = items.filter((i) => i.prixDOM !== undefined);
  const withBoth = items.filter((i) => i.prixDOM !== undefined && i.prixHex !== undefined);

  const totalDOM = Math.round(withDOM.reduce((s, i) => s + (i.prixDOM ?? 0), 0) * 100) / 100;
  const totalHex = Math.round(withBoth.reduce((s, i) => s + (i.prixHex ?? 0), 0) * 100) / 100;
  const ecartTotal = Math.round((totalDOM - totalHex) * 100) / 100;
  const ecartPercent = totalHex > 0 ? Math.round((ecartTotal / totalHex) * 1000) / 10 : 0;

  return { items, totalDOM, totalHex, ecartTotal, ecartPercent };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaniersTypes() {
  const [selectedTerritory, setSelectedTerritory] = useState('Guadeloupe');
  const [selectedPanier, setSelectedPanier] = useState<string>('alimentaire');
  const [domPrices, setDomPrices] = useState<
    Map<string, { avg: number; unite: string; categorie: string }>
  >(new Map());
  const [hexPrices, setHexPrices] = useState<
    Map<string, { avg: number; unite: string; categorie: string }>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState(false);

  /** true when the "Métropole" pseudo-territory is selected */
  const isMetroSelected = selectedTerritory === METRO_TERRITORY.labelFull;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      loadPrix(selectedTerritory, DEFAULT_MONTHS),
      loadPrix('Hexagone', DEFAULT_MONTHS),
    ]).then(([dom, hex]) => {
      if (!cancelled) {
        setDomPrices(dom);
        setHexPrices(hex);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedTerritory]);

  const panier = useMemo(
    () => PANIERS.find((p) => p.id === selectedPanier) ?? PANIERS[0],
    [selectedPanier]
  );

  const result = useMemo(
    () => computePanier(panier, domPrices, hexPrices),
    [panier, domPrices, hexPrices]
  );

  const hasData = result.totalDOM > 0;

  /** Share button — Web Share API with WhatsApp/X fallback */
  const handleShare = useCallback(() => {
    const territory = isMetroSelected ? 'France métropolitaine' : selectedTerritory;
    const ecartText =
      !isMetroSelected && result.ecartPercent !== 0
        ? ` Ce panier coûte ${result.ecartPercent > 0 ? '+' : ''}${result.ecartPercent.toFixed(1)}\u202f% ${result.ecartPercent > 0 ? 'de plus' : 'de moins'} en ${territory} qu'en métropole.`
        : '';
    const text = `🛒 Panier "${panier.label}" — ${territory} : ${result.totalDOM.toFixed(2)}\u202f€.${ecartText} Données ouvertes A KI PRI SA YÉ.`;
    const url =
      typeof window !== 'undefined' ? window.location.href : 'https://akiprisaye.fr/paniers-types';
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      navigator.share({ title: 'Paniers types DOM / Métropole', text, url }).catch(() => {
        /* user cancelled */
      });
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${url}`)}`;
      window.open(waUrl, '_blank', 'noopener');
    }
  }, [panier, result, selectedTerritory, isMetroSelected]);

  /** CSV export — client-side, journalist-ready */
  const handleExportCSV = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const territory = isMetroSelected
      ? 'metropole'
      : selectedTerritory.toLowerCase().replace(/\s+/g, '_');
    const rows: string[] = [
      'produit,unite,prix_dom_eur,prix_metro_eur,ecart_pct',
      ...result.items
        .filter((i) => i.prixDOM !== undefined)
        .map((i) =>
          [
            `"${i.produit.replace(/"/g, '""')}"`,
            `"${i.unite}"`,
            i.prixDOM !== undefined ? i.prixDOM.toFixed(2) : '',
            i.prixHex !== undefined ? i.prixHex.toFixed(2) : '',
            i.ecartPercent !== undefined ? i.ecartPercent.toFixed(1) : '',
          ].join(',')
        ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `panier_${panier.id}_${territory}_vs_metro_${today}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [panier, result, selectedTerritory, isMetroSelected]);

  // Build dynamic OG description based on computed ecart
  const ogDescription =
    !isMetroSelected && result.ecartPercent !== 0
      ? `Panier ${panier.label} : ${result.ecartPercent > 0 ? '+' : ''}${result.ecartPercent.toFixed(0)}\u202f% ${result.ecartPercent > 0 ? 'plus cher' : 'moins cher'} en ${selectedTerritory} qu'en métropole. Données A KI PRI SA YÉ.`
      : 'Comparez le coût de paniers types (alimentaire, hygiène, bébé, scolaire) entre les DOM et la France métropolitaine.';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet>
        <title>Paniers types DOM vs Métropole — A KI PRI SA YÉ</title>
        <meta name="description" content={ogDescription} />
        <meta property="og:title" content={`Paniers types DOM / Métropole — ${panier.label}`} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:type" content="website" />
      </Helmet>

      <HeroImage
        src={PAGE_HERO_IMAGES.tiPanie ?? PAGE_HERO_IMAGES.lutteVieChere}
        alt="Paniers types DOM vs Métropole"
        gradient="from-slate-950 to-indigo-900"
        height="h-40 sm:h-52"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
          🛒 Paniers types DOM / Métropole
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
          Alimentaire · Hygiène · Bébé · Scolaire — coût réel comparé
        </p>
      </HeroImage>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div>
              <label
                htmlFor="paniers-territory-select"
                className="block text-xs text-slate-400 mb-1"
              >
                Territoire
              </label>
              <select
                id="paniers-territory-select"
                value={selectedTerritory}
                onChange={(e) => setSelectedTerritory(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded px-2 py-1.5"
              >
                {DOM_TERRITORIES.map((t) => (
                  <option key={t.code} value={t.labelFull}>
                    {t.flag} {t.label}
                  </option>
                ))}
                <option value={METRO_TERRITORY.labelFull}>
                  {METRO_TERRITORY.flag} {METRO_TERRITORY.label} (seule)
                </option>
              </select>
            </div>
            <div role="group" aria-labelledby="panier-group-label">
              <span id="panier-group-label" className="block text-xs text-slate-400 mb-1">
                Panier
              </span>
              <div className="flex flex-wrap gap-2">
                {PANIERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPanier(p.id)}
                    className={[
                      'text-sm px-3 py-1.5 rounded-full border transition-colors',
                      selectedPanier === p.id
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700',
                    ].join(' ')}
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons: Share & Export CSV */}
          <div className="flex gap-2 self-end">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-sm rounded-lg transition-colors"
              aria-label="Partager ce comparatif"
            >
              <Share2 className="w-4 h-4" />
              Partager
            </button>
            {hasData && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-sm rounded-lg transition-colors"
                aria-label="Télécharger le comparatif en CSV"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            )}
          </div>
        </div>

        {/* Summary card */}
        {loading && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-center text-slate-400">
            Chargement des données de prix…
          </div>
        )}

        {!loading && hasData && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {panier.emoji} {panier.label}
                </h2>
                <p className="text-sm text-slate-400">{panier.description}</p>
              </div>
              {result.ecartPercent !== 0 && result.totalHex > 0 && (
                <EcartHexagone ecartPercent={result.ecartPercent} size="md" showTooltip={false} />
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{result.totalDOM.toFixed(2)} €</div>
                <div className="text-xs text-slate-400 mt-0.5">{selectedTerritory}</div>
              </div>
              {result.totalHex > 0 && (
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-slate-300">
                    {result.totalHex.toFixed(2)} €
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">France métropolitaine</div>
                </div>
              )}
              {result.ecartTotal !== 0 && result.totalHex > 0 && (
                <div
                  className={[
                    'rounded-lg p-3 text-center',
                    result.ecartTotal > 0 ? 'bg-red-900/30' : 'bg-emerald-900/30',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'text-2xl font-bold',
                      result.ecartTotal > 0 ? 'text-red-300' : 'text-emerald-300',
                    ].join(' ')}
                  >
                    {result.ecartTotal > 0 ? '+' : ''}
                    {result.ecartTotal.toFixed(2)} €
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Surcoût DOM</div>
                </div>
              )}
            </div>

            {/* Product list */}
            <div>
              <button
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-2"
                onClick={() => setExpandedItems((v) => !v)}
              >
                {expandedItems ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                {expandedItems ? 'Masquer le détail' : 'Voir le détail produit'}
              </button>

              {expandedItems && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-xs text-slate-400 border-b border-slate-800">
                        <th className="text-left pb-2 pr-4">Produit</th>
                        <th className="text-right pb-2 pr-4">{selectedTerritory}</th>
                        <th className="text-right pb-2 pr-4">Métropole</th>
                        <th className="text-right pb-2">Écart</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-800/50">
                          <td className="py-1.5 pr-4">
                            <span className="text-slate-200">{item.produit}</span>
                            <span className="text-xs text-slate-500 ml-1">{item.unite}</span>
                          </td>
                          <td className="py-1.5 pr-4 text-right text-slate-200">
                            {item.prixDOM !== undefined ? (
                              `${item.prixDOM.toFixed(2)} €`
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-4 text-right text-slate-400">
                            {item.prixHex !== undefined ? (
                              `${item.prixHex.toFixed(2)} €`
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-1.5 text-right">
                            <EcartHexagone ecartPercent={item.ecartPercent} size="xs" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && !hasData && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-center space-y-2">
            <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400">Données non disponibles pour {selectedTerritory}.</p>
            <p className="text-sm text-slate-500">
              Les relevés citoyens de ce territoire ne couvrent pas encore ce panier.
            </p>
          </div>
        )}

        {/* Info banner */}
        <div className="flex gap-2 text-xs text-slate-500 bg-slate-900/50 border border-slate-800 rounded-lg p-3">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Les prix affichés sont des moyennes calculées à partir de relevés de terrain vérifiés.
            L'écart DOM / Métropole est indicatif — il peut varier selon l'enseigne, la commune et
            la saisonnalité.
          </span>
        </div>
      </div>
    </div>
  );
}
