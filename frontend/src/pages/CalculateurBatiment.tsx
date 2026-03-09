/**
 * CalculateurBatiment — Calculateur du Bâtiment
 *
 * Hub avec 4 catégories :
 *   - Gros œuvre (Parpaing, Dalle béton, Fondations, Chape)
 *   - Finitions (Carrelage, Peinture, Enduit/Crépissage)
 *   - Extérieur (Tôles couverture, Terrassement, Clôture)
 *   - Outils (Béton courant, Escalier)
 *
 * Fonctionnalités :
 *   - Sélecteur de territoire DOM-TOM
 *   - 13 calculateurs tous corps de métier
 *   - "Trouver en magasin" : comparatif prix par enseigne
 *   - Liste de courses exportable + WhatsApp
 *   - Accès freemium dégressive sur 7 jours
 */

import { useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  HardHat, Home, TreePine, Wrench, Lock, Unlock,
  ChevronLeft, AlertTriangle, Star, Clock, Calculator,
  RotateCcw, Info, ShoppingCart, MapPin, Phone, ExternalLink,
  ChevronDown, ChevronUp, Copy, Check, Navigation,
  Package, Tag, Clock3, CheckCircle2, XCircle,
} from 'lucide-react';
import {
  getBatimentTrialState,
  startBatimentTrial,
  consumeBatimentCalc,
  type BatimentTrialState,
} from '../services/batimentTrialService';
import {
  buildStoreQuotes,
  type TerritoryCode,
  type MaterialNeed,
  type StoreQuote,
} from '../data/batimentStoresData';

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryId = 'gros-oeuvre' | 'finitions' | 'exterieur' | 'outils';
type CalculatorId =
  | 'parpaing' | 'dalle-beton' | 'fondations' | 'chape'
  | 'carrelage' | 'peinture' | 'enduit'
  | 'toles' | 'terrassement' | 'cloture'
  | 'beton-courant' | 'escalier';

// ─── Constants ────────────────────────────────────────────────────────────────

const TERRITORY_OPTIONS: { code: TerritoryCode; label: string; flag: string }[] = [
  { code: 'GP', label: 'Guadeloupe',  flag: '🇬🇵' },
  { code: 'MQ', label: 'Martinique',  flag: '🇲🇶' },
  { code: 'RE', label: 'La Réunion',  flag: '🇷🇪' },
  { code: 'GF', label: 'Guyane',      flag: '🇬🇫' },
  { code: 'YT', label: 'Mayotte',     flag: '🇾🇹' },
];

const CATEGORIES = [
  {
    id: 'gros-oeuvre' as CategoryId,
    label: 'Gros œuvre',
    emoji: '🧱',
    bgFrom: 'from-stone-700',
    bgTo: 'to-amber-600',
    calcs: ['parpaing', 'dalle-beton', 'fondations', 'chape'] as CalculatorId[],
  },
  {
    id: 'finitions' as CategoryId,
    label: 'Finitions & Intérieur',
    emoji: '🎨',
    bgFrom: 'from-amber-700',
    bgTo: 'to-amber-500',
    calcs: ['carrelage', 'peinture', 'enduit'] as CalculatorId[],
  },
  {
    id: 'exterieur' as CategoryId,
    label: 'Extérieur & Couverture',
    emoji: '🏡',
    bgFrom: 'from-green-700',
    bgTo: 'to-green-500',
    calcs: ['toles', 'terrassement', 'cloture'] as CalculatorId[],
  },
  {
    id: 'outils' as CategoryId,
    label: 'Outils & Calculs divers',
    emoji: '🧰',
    bgFrom: 'from-blue-700',
    bgTo: 'to-blue-500',
    calcs: ['beton-courant', 'escalier', 'parpaing'] as CalculatorId[],
  },
];

const CALC_META: Record<CalculatorId, { label: string; emoji: string; description: string }> = {
  parpaing:        { label: 'Parpaing ou Bloc US',         emoji: '🧱', description: 'Blocs, mortier, ciment, sable' },
  'dalle-beton':   { label: 'Dalle béton',                  emoji: '🏗️', description: 'Volume, ciment, gravier, treillis' },
  fondations:      { label: 'Fondations (semelles filantes)',emoji: '⚓', description: 'Volume béton, acier HA, coffrage' },
  chape:           { label: 'Chape de sol',                 emoji: '🪵', description: 'Mortier chape, ciment, sable' },
  carrelage:       { label: 'Carrelage',                    emoji: '🟫', description: 'Carreaux, colle, joint de carrelage' },
  peinture:        { label: 'Calcul quantité de peinture',  emoji: '🎨', description: 'Litres, murs & plafond, ouvertures' },
  enduit:          { label: 'Enduit / Crépissage',          emoji: '🪣', description: 'Enduit façade, mortier, ciment' },
  toles:           { label: 'Tôles de couverture',          emoji: '🏠', description: 'Tôles ondulées, fixations, faîtière' },
  terrassement:    { label: 'Terrassement',                 emoji: '⛏️', description: 'Volume de déblai / remblai, camions' },
  cloture:         { label: 'Clôture',                      emoji: '🚧', description: 'Grillage, poteaux, béton de scellement' },
  'beton-courant': { label: 'Béton courant',                emoji: '🪣', description: 'Dosage ciment, sable, gravier pour béton' },
  escalier:        { label: 'Escalier',                     emoji: '🪜', description: 'Marches, hauteur, giron, longueur totale' },
};

const CIMENT_TYPES = [
  { label: 'Ciment 25 Kg', kg: 25, productId: 'ciment_25kg' },
  { label: 'Ciment 35 Kg', kg: 35, productId: 'ciment_35kg' },
];

const PARPAING_TYPES = [
  { label: 'Parpaing 7×20×50',       h: 0.20, l: 0.50, productId: 'parpaing_7' },
  { label: 'Parpaing 10×20×50',      h: 0.20, l: 0.50, productId: 'parpaing_15' },
  { label: 'Parpaing 15×20×50',      h: 0.20, l: 0.50, productId: 'parpaing_15' },
  { label: 'Parpaing 20×20×50',      h: 0.20, l: 0.50, productId: 'parpaing_20' },
  { label: 'Parpaing Mega 15×25×50', h: 0.25, l: 0.50, productId: 'parpaing_15' },
  { label: 'Parpaing Mega 20×25×50', h: 0.25, l: 0.50, productId: 'parpaing_20' },
  { label: 'Bloc US 9×19×39',        h: 0.19, l: 0.39, productId: 'parpaing_7' },
  { label: 'Bloc US 14×19×39',       h: 0.19, l: 0.39, productId: 'bloc_us_14' },
  { label: 'Bloc US 19×19×39',       h: 0.19, l: 0.39, productId: 'parpaing_20' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function NumInput({ label, value, onChange, placeholder = '0.00', unit }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; unit?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}{unit && <span className="text-slate-500 ml-1">({unit})</span>}</label>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white text-center text-lg focus:border-orange-500 focus:outline-none"
      />
    </div>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-orange-900/30 border border-orange-500/30' : 'bg-slate-800/60'}`}>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className={`font-bold text-sm ${highlight ? 'text-orange-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function WarnBanner({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-yellow-900/40 border border-yellow-600/40 px-4 py-2">
      <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
      <span className="text-xs text-yellow-200">{text}</span>
    </div>
  );
}

function BlockedBanner() {
  return (
    <div className="rounded-xl bg-red-900/30 border border-red-500/40 p-4 text-center">
      <Lock className="w-5 h-5 mx-auto mb-1 text-red-400" />
      <p className="text-sm text-red-300 font-medium">Quota journalier atteint</p>
      <a href="/pricing" className="text-xs text-indigo-400 underline hover:text-indigo-300">Passer en Premium pour continuer →</a>
    </div>
  );
}

// ─── Store Locator Panel ──────────────────────────────────────────────────────

function StoreLocatorPanel({ needs, territory }: { needs: MaterialNeed[]; territory: TerritoryCode | null }) {
  const [open, setOpen]         = useState(false);
  const [copied, setCopied]     = useState(false);
  const [expandedStore, setExpandedStore] = useState<string | null>(null);

  if (!territory || needs.length === 0) return null;

  const quotes = buildStoreQuotes(territory, needs);
  if (quotes.length === 0) return null;

  const cheapest = quotes[0];

  const copyShoppingList = () => {
    const lines = cheapest.lines.map(
      (l) => `${l.qty} × ${l.product.label} @ ${l.unitPrice.toFixed(2)} € = ${l.total.toFixed(2)} €`
    );
    const text = [
      `🏗️ Liste de matériaux — ${new Date().toLocaleDateString('fr-FR')}`,
      `Magasin conseillé : ${cheapest.store.name}`,
      `📍 ${cheapest.store.address}, ${cheapest.store.postalCode} ${cheapest.store.city}`,
      `📞 ${cheapest.store.phone}`,
      '',
      ...lines,
      '',
      `TOTAL ESTIMÉ : ${cheapest.grandTotal.toFixed(2)} €`,
      '',
      'Tous les prix sont à titre indicatif — A KI PRI SA YÉ',
    ].join('\n');
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 border border-orange-500/40 hover:border-orange-500/70 px-4 py-3 transition-all"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-orange-400" />
          <div className="text-left">
            <p className="font-semibold text-white text-sm">🏪 Où acheter ? Comparer les magasins</p>
            <p className="text-xs text-slate-400">{quotes.length} magasin{quotes.length > 1 ? 's' : ''} trouvé{quotes.length > 1 ? 's' : ''} en {TERRITORY_OPTIONS.find((t) => t.code === territory)?.label}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={copyShoppingList}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié !' : 'Copier la liste'}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Mes matériaux : ${cheapest.lines.map((l) => `${l.qty}×${l.product.label}`).join(', ')} — ${cheapest.store.name} — Total ~${cheapest.grandTotal.toFixed(0)}€`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-800/50 hover:bg-green-700/60 text-sm text-green-300 transition-colors"
            >
              💬 Partager WhatsApp
            </a>
          </div>

          {/* Store cards */}
          {quotes.map((quote, idx) => {
            const isExpanded = expandedStore === quote.store.id;
            const isBest = idx === 0;
            return (
              <StoreCard
                key={quote.store.id}
                quote={quote}
                isBest={isBest}
                isExpanded={isExpanded}
                onToggle={() => setExpandedStore(isExpanded ? null : quote.store.id)}
              />
            );
          })}

          <p className="text-xs text-center text-slate-600 pb-2">
            Prix relevés par la communauté A KI PRI SA YÉ • Mis à jour fév. 2026 • À titre indicatif
          </p>
        </div>
      )}
    </div>
  );
}

function StoreCard({ quote, isBest, isExpanded, onToggle }: {
  quote: StoreQuote;
  isBest: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { store, lines, grandTotal, missingCount } = quote;
  const savings = isBest ? null : null; // future: vs cheapest

  return (
    <div className={`rounded-2xl border overflow-hidden ${isBest ? 'border-orange-500/60 bg-orange-900/10' : 'border-slate-700 bg-slate-800/50'}`}>
      {/* Store header */}
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-10 h-10 rounded-xl ${store.brandColor} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow`}>
              {store.brand.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-white text-sm">{store.name}</p>
                {isBest && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-600 text-white text-xs font-bold shrink-0">
                    ⭐ Meilleur prix
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{store.city} • {store.type === 'negociant_pro' ? 'Négoce pro' : 'Grande surface'}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-orange-300">{grandTotal.toFixed(2)} €</p>
            {missingCount > 0 && <p className="text-xs text-yellow-500">{missingCount} produit{missingCount > 1 ? 's' : ''} manquant{missingCount > 1 ? 's' : ''}</p>}
          </div>
        </div>

        {/* Catalog promo if featured */}
        {store.featured && store.catalogLabel && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-slate-700/60 border border-slate-600/40 px-3 py-2">
            <Tag className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="text-xs text-orange-200 font-medium">{store.catalogLabel}</span>
            <a
              href={store.website}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1"
            >
              Voir <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Material preview (collapsed) */}
        {!isExpanded && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {lines.slice(0, 4).map((l) => (
              <span key={l.product.id} className="text-xs bg-slate-700 text-slate-300 rounded-full px-2 py-0.5">
                {l.product.label.split(' ').slice(0, 3).join(' ')} — {l.unitPrice.toFixed(2)} €
              </span>
            ))}
            {lines.length > 4 && <span className="text-xs text-slate-500">+{lines.length - 4} autres</span>}
          </div>
        )}

        {/* Expanded: full product table */}
        {isExpanded && (
          <div className="mb-3 space-y-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />Détail des matériaux
            </p>
            {lines.map((l) => (
              <div key={l.product.id} className="flex items-center justify-between gap-2 bg-slate-900/50 rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  {l.inStock
                    ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  }
                  <div className="min-w-0">
                    <p className="text-white truncate">{l.qty} × {l.product.label}</p>
                    <div className="flex gap-2 items-center flex-wrap">
                      <p className="text-xs text-slate-500">{l.product.unit} • {l.unitPrice.toFixed(2)} €/unité</p>
                      {l.promotion && <span className="text-xs bg-green-800/60 text-green-300 rounded-full px-2 py-0.5">{l.promotion}</span>}
                      {l.note && <span className="text-xs text-slate-500 italic">{l.note}</span>}
                      {!l.inStock && <span className="text-xs text-red-400">Sur commande</span>}
                    </div>
                  </div>
                </div>
                <p className="font-bold text-orange-300 shrink-0">{l.total.toFixed(2)} €</p>
              </div>
            ))}
            <div className="flex justify-between items-center px-3 py-2 bg-orange-900/20 rounded-lg border border-orange-500/20 mt-2">
              <span className="text-sm font-semibold text-slate-300">Total estimé</span>
              <span className="text-xl font-black text-orange-300">{grandTotal.toFixed(2)} €</span>
            </div>
          </div>
        )}

        {/* Store info */}
        {isExpanded && (
          <div className="space-y-1.5 mb-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{store.address}, {store.postalCode} {store.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <a href={`tel:${store.phone.replace(/\s/g, '')}`} className="text-blue-400 hover:text-blue-300">{store.phone}</a>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{store.openingHours}</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-slate-600 py-2 text-xs text-slate-300 hover:border-orange-500/50 hover:text-white transition-all"
          >
            {isExpanded ? <><ChevronUp className="w-3.5 h-3.5" />Réduire</> : <><ChevronDown className="w-3.5 h-3.5" />Voir le détail</>}
          </button>
          <a
            href={store.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-800/50 hover:bg-blue-700/60 text-xs text-blue-300 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />Itinéraire
          </a>
          <a
            href={`tel:${store.phone.replace(/\s/g, '')}`}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />Appeler
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Calculators ──────────────────────────────────────────────────────────────

function ParpaingCalc({ onCalc, territory }: { onCalc: () => boolean; territory: TerritoryCode | null }) {
  const [longueur, setLongueur] = useState('');
  const [hauteur, setHauteur]   = useState('');
  const [typeIdx, setTypeIdx]   = useState(2);
  const [cimentIdx, setCimentIdx] = useState(0);
  const [result, setResult]     = useState<{ surface: number; nbBlocs: number; mortierM3: number; nbSacsCiment: number; sableKg: number } | null>(null);
  const [blocked, setBlocked]   = useState(false);
  const [materials, setMaterials] = useState<MaterialNeed[]>([]);

  const calculate = () => {
    if (!onCalc()) { setBlocked(true); return; }
    const l = parseFloat(longueur.replace(',', '.'));
    const h = parseFloat(hauteur.replace(',', '.'));
    if (!l || !h || l <= 0 || h <= 0) return;

    const parpaing = PARPAING_TYPES[typeIdx];
    const surface  = l * h;
    const surfaceParBloc = (parpaing.l + 0.01) * (parpaing.h + 0.01);
    const nbBlocs = Math.ceil((surface / surfaceParBloc) * 1.05);
    const mortierM3 = Math.round(surface * 0.025 * 100) / 100;
    const ciment   = CIMENT_TYPES[cimentIdx];
    const cimentKg = mortierM3 * 350;
    const nbSacsCiment = Math.ceil(cimentKg / ciment.kg);
    const sableKg  = Math.round(cimentKg * 4.5);

    setResult({ surface: Math.round(surface * 100) / 100, nbBlocs, mortierM3, nbSacsCiment, sableKg });
    setBlocked(false);

    // Build material needs for store locator
    const sacsSable = Math.ceil(sableKg / 25);
    setMaterials([
      { productId: parpaing.productId, qty: nbBlocs },
      { productId: ciment.productId, qty: nbSacsCiment },
      { productId: 'sable_25kg', qty: sacsSable },
    ]);
  };

  const reset = () => { setLongueur(''); setHauteur(''); setResult(null); setBlocked(false); setMaterials([]); };

  return (
    <div className="space-y-4">
      <WarnBanner text="Dimensions en mètres — Ciment CPJ 32.5, mortier dosé à 350 kg/m³" />
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Longueur" value={longueur} onChange={setLongueur} unit="m" />
        <NumInput label="Hauteur" value={hauteur} onChange={setHauteur} unit="m" />
      </div>
      {longueur && hauteur && (
        <p className="text-sm text-center text-slate-400">Surface : <span className="text-white font-semibold">{(parseFloat(longueur.replace(',', '.')) * parseFloat(hauteur.replace(',', '.'))).toFixed(2)} m²</span></p>
      )}
      <div>
        <label className="block text-sm text-slate-400 mb-1">Type de bloc</label>
        <select value={typeIdx} onChange={(e) => setTypeIdx(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
          {PARPAING_TYPES.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1">Format sac ciment</label>
        <select value={cimentIdx} onChange={(e) => setCimentIdx(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
          {CIMENT_TYPES.map((c, i) => <option key={i} value={i}>{c.label}</option>)}
        </select>
      </div>
      <div className="flex gap-3">
        <button onClick={calculate} className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors">Calculer</button>
        <button onClick={reset} className="rounded-xl border border-slate-600 px-4 py-3 text-slate-300 hover:border-slate-400"><RotateCcw className="w-4 h-4" /></button>
      </div>
      {blocked && <BlockedBanner />}
      {result && !blocked && (
        <>
          <div className="rounded-2xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
            <h3 className="font-semibold text-orange-300 flex items-center gap-2"><Calculator className="w-4 h-4" />Résultats</h3>
            <div className="grid grid-cols-2 gap-2">
              <ResultRow label="Surface" value={`${result.surface} m²`} />
              <ResultRow label="Nombre de blocs" value={`${result.nbBlocs} blocs`} highlight />
              <ResultRow label="Quantité de mortier" value={`${result.mortierM3} m³`} highlight />
              <ResultRow label={`Sacs ${CIMENT_TYPES[cimentIdx].label}`} value={`${result.nbSacsCiment} sacs`} />
              <ResultRow label="Sable 0/5 (sacs 25 kg)" value={`${Math.ceil(result.sableKg / 25)} sacs`} />
              <ResultRow label="Sable total" value={`${result.sableKg} kg`} />
            </div>
            <p className="text-xs text-slate-500">Calculs pour ciment CPJ 32.5 • Mortier standard 350 kg/m³</p>
          </div>
          <StoreLocatorPanel needs={materials} territory={territory} />
        </>
      )}
    </div>
  );
}

function DalleBetonCalc({ onCalc, territory }: { onCalc: () => boolean; territory: TerritoryCode | null }) {
  const [longueur, setLongueur] = useState('');
  const [largeur, setLargeur]   = useState('');
  const [epaisseur, setEpaisseur] = useState(10);
  const [cimentIdx, setCimentIdx] = useState(0);
  const [result, setResult]     = useState<{ surface: number; volume: number; nbSacsCiment: number; sableKg: number; gravierKg: number; treillis: number } | null>(null);
  const [blocked, setBlocked]   = useState(false);
  const [materials, setMaterials] = useState<MaterialNeed[]>([]);

  const surface = longueur && largeur
    ? Math.round(parseFloat(longueur.replace(',', '.')) * parseFloat(largeur.replace(',', '.')) * 100) / 100 : 0;
  const volume  = surface > 0 ? Math.round(surface * (epaisseur / 100) * 1000) / 1000 : 0;

  const calculate = () => {
    if (!onCalc()) { setBlocked(true); return; }
    const l = parseFloat(longueur.replace(',', '.'));
    const w = parseFloat(largeur.replace(',', '.'));
    if (!l || !w) return;

    const ciment   = CIMENT_TYPES[cimentIdx];
    const cimentKg = volume * 350;
    const nbSacsCiment = Math.ceil(cimentKg / ciment.kg);
    const sableKg  = Math.round(cimentKg * 2.5);
    const gravierKg = Math.round(cimentKg * 4);
    const treillis = Math.ceil((l * w) / 2.88 * 1.15);

    setResult({ surface, volume, nbSacsCiment, sableKg, gravierKg, treillis });
    setBlocked(false);

    setMaterials([
      { productId: ciment.productId, qty: nbSacsCiment },
      { productId: 'sable_25kg',     qty: Math.ceil(sableKg / 25) },
      { productId: 'gravier_25kg',   qty: Math.ceil(gravierKg / 25) },
      { productId: 'treillis_1224',  qty: treillis },
    ]);
  };

  const reset = () => { setLongueur(''); setLargeur(''); setResult(null); setBlocked(false); setMaterials([]); };

  return (
    <div className="space-y-4">
      <WarnBanner text="Dimensions en mètres — Béton courant dosé à 350 kg/m³ (CPJ 32.5)" />
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Longueur" value={longueur} onChange={setLongueur} unit="m" />
        <NumInput label="Largeur" value={largeur} onChange={setLargeur} unit="m" />
      </div>

      <div className="rounded-xl bg-slate-700/30 px-4 py-2 text-sm flex items-center justify-between">
        <span className="text-slate-400">Surface :</span>
        <span className="font-semibold text-white">{surface} m²</span>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Épaisseur de la dalle : <span className="text-white font-bold">{epaisseur} cm</span></label>
        <div className="rounded-xl bg-green-700/40 border border-green-600/30 px-4 py-2 text-center text-green-200 font-semibold mb-2">
          Épaisseur de la dalle : {epaisseur} cm
        </div>
        <input type="range" min="7" max="20" step="1" value={epaisseur} onChange={(e) => setEpaisseur(Number(e.target.value))}
          className="w-full accent-orange-500" />
        <div className="flex justify-between text-xs text-slate-500 mt-0.5"><span>7 cm</span><span>20 cm</span></div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {[7, 10, 12, 15, 20].map((ep) => (
            <button key={ep} onClick={() => setEpaisseur(ep)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${epaisseur === ep ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {ep} cm
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-green-700/30 border border-green-600/30 px-4 py-3 text-center">
        <span className="text-green-200 font-semibold">Volume : {volume} m³</span>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Format sac ciment</label>
        <select value={cimentIdx} onChange={(e) => setCimentIdx(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
          {CIMENT_TYPES.map((c, i) => <option key={i} value={i}>{c.label}</option>)}
        </select>
      </div>

      <div className="flex gap-3">
        <button onClick={calculate} className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors">Calculer</button>
        <button onClick={reset} className="rounded-xl border border-slate-600 px-4 py-3 text-slate-300 hover:border-slate-400"><RotateCcw className="w-4 h-4" /></button>
      </div>
      {blocked && <BlockedBanner />}
      {result && !blocked && (
        <>
          <div className="rounded-2xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
            <h3 className="font-semibold text-orange-300 flex items-center gap-2"><Calculator className="w-4 h-4" />Résultats</h3>
            <div className="grid grid-cols-2 gap-2">
              <ResultRow label="Surface"          value={`${result.surface} m²`} />
              <ResultRow label="Volume béton"     value={`${result.volume} m³`} highlight />
              <ResultRow label={`Sacs ${CIMENT_TYPES[cimentIdx].label}`} value={`${result.nbSacsCiment} sacs`} highlight />
              <ResultRow label="Paveur 0/20 (sacs 25 kg)" value={`${Math.ceil(result.gravierKg / 25)} sacs`} />
              <ResultRow label="Sable 0/5 (sacs 25 kg)"   value={`${Math.ceil(result.sableKg / 25)} sacs`} />
              <ResultRow label="Treillis 1,2×2,4 m"        value={`${result.treillis} panneaux`} />
            </div>
            <p className="text-xs text-slate-500">Ciment CPJ 32.5 • Tous les calculs sont à titre indicatif</p>
          </div>
          <StoreLocatorPanel needs={materials} territory={territory} />
        </>
      )}
    </div>
  );
}

function PeintureCalc({ onCalc, territory }: { onCalc: () => boolean; territory: TerritoryCode | null }) {
  const [mode, setMode]                   = useState<'mur' | 'plafond'>('mur');
  const [largeur, setLargeur]             = useState('');
  const [hauteur, setHauteur]             = useState('');
  const [nbrOuvertures, setNbrOuvertures] = useState('0');
  const [nbrCouches, setNbrCouches]       = useState('2');
  const [rendement, setRendement]         = useState('10');
  const [showRendHelp, setShowRendHelp]   = useState(false);
  const [result, setResult]               = useState<{ surface: number; surfaceNette: number; litres: number } | null>(null);
  const [blocked, setBlocked]             = useState(false);
  const [materials, setMaterials]         = useState<MaterialNeed[]>([]);

  const calculate = () => {
    if (!onCalc()) { setBlocked(true); return; }
    const l  = parseFloat(largeur.replace(',', '.'));
    const h  = parseFloat(hauteur.replace(',', '.'));
    const nb = parseInt(nbrOuvertures) || 0;
    const nc = parseInt(nbrCouches)    || 1;
    const rd = parseFloat(rendement.replace(',', '.'));
    if (!l || !h || !rd) return;

    // Surface brute
    const surfaceBrute = l * h;
    // Ouvertures : porte ≈ 2m², fenêtre ≈ 1.5m² → on prend 1.75 m² moyen
    const surfaceNette = Math.max(0, surfaceBrute - nb * 1.75);
    const litres = Math.ceil((surfaceNette * nc) / rd);

    setResult({ surface: Math.round(surfaceBrute * 100) / 100, surfaceNette: Math.round(surfaceNette * 100) / 100, litres });
    setBlocked(false);

    // Suggest bidon 10L or 15L
    const bidons10 = Math.ceil(litres / 10);
    const bidons15 = Math.ceil(litres / 15);
    setMaterials([
      { productId: 'peinture_10L', qty: bidons10 },
    ]);
  };

  const reset = () => { setLargeur(''); setHauteur(''); setNbrOuvertures('0'); setResult(null); setBlocked(false); setMaterials([]); };

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-slate-600">
        {(['mur', 'plafond'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResult(null); setMaterials([]); }}
            className={`py-2.5 font-semibold text-sm transition-colors ${mode === m ? 'bg-green-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            {m === 'mur' ? '🧱 Mur' : '🏠 Plafond'}
          </button>
        ))}
      </div>

      <WarnBanner text={mode === 'mur' ? 'Largeur = longueur du mur • Hauteur du sol au plafond' : 'Entrez la longueur et la largeur du plafond'} />

      {/* Input grid */}
      <div className="grid grid-cols-2 gap-3">
        <NumInput label={mode === 'mur' ? 'Largeur du mur' : 'Longueur pièce'} value={largeur} onChange={setLargeur} unit="m" />
        <div>
          <label className="block text-sm text-slate-400 mb-1">Nbr d'ouverture</label>
          <input
            type="number"
            min="0"
            step="1"
            value={nbrOuvertures}
            onChange={(e) => setNbrOuvertures(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white text-center text-lg focus:border-orange-500 focus:outline-none"
          />
        </div>
        <NumInput label={mode === 'mur' ? 'Hauteur du mur' : 'Largeur pièce'} value={hauteur} onChange={setHauteur} unit="m" />
        <div>
          <label className="block text-sm text-slate-400 mb-1">Nbr de couche</label>
          <select value={nbrCouches} onChange={(e) => setNbrCouches(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <label className="block text-sm text-slate-400">Rendement de la peinture</label>
            <button onClick={() => setShowRendHelp((v) => !v)} className="w-6 h-6 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold">?</button>
          </div>
          {showRendHelp && (
            <div className="mb-2 rounded-xl bg-slate-700 border border-slate-600 px-3 py-2 text-xs text-slate-300">
              <p className="font-semibold text-white mb-1">Rendement selon le type de peinture :</p>
              <p>• Peinture standard : 8–10 m²/L</p>
              <p>• Peinture épaisse / mat : 6–8 m²/L</p>
              <p>• Lasure / vernis : 12–15 m²/L</p>
              <p className="text-slate-500 mt-1">Vérifiez l'étiquette du bidon.</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              step="0.5"
              value={rendement}
              onChange={(e) => setRendement(e.target.value)}
              placeholder="0"
              className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white text-center text-lg focus:border-orange-500 focus:outline-none"
            />
            <span className="text-slate-400 text-sm font-medium">M²/L</span>
          </div>
        </div>
      </div>

      {/* Live result strip */}
      <div className="rounded-xl bg-orange-800/30 border border-orange-600/30 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-slate-300">Nbr de litre de peinture</span>
        <span className="font-black text-xl text-orange-300">
          {largeur && hauteur && rendement ? `${Math.ceil((Math.max(0, parseFloat(largeur.replace(',', '.')) * parseFloat(hauteur.replace(',', '.')) - (parseInt(nbrOuvertures) || 0) * 1.75) * (parseInt(nbrCouches) || 1)) / parseFloat(rendement.replace(',', '.')))} L` : '—'}
        </span>
      </div>
      <div className="rounded-xl bg-green-700/30 border border-green-600/30 px-4 py-3 text-center">
        <span className="text-green-200 font-semibold text-sm">
          Surface à peindre : {largeur && hauteur ? `${Math.max(0, Math.round((parseFloat(largeur.replace(',', '.')) * parseFloat(hauteur.replace(',', '.')) - (parseInt(nbrOuvertures) || 0) * 1.75) * 100) / 100)} m²` : '—'}
        </span>
      </div>

      <div className="flex gap-3">
        <button onClick={calculate} className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors">Calculer</button>
        <button onClick={reset} className="rounded-xl border border-slate-600 px-4 py-3 text-slate-300 hover:border-slate-400"><RotateCcw className="w-4 h-4" /></button>
      </div>
      {blocked && <BlockedBanner />}
      {result && !blocked && (
        <>
          <div className="rounded-2xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
            <h3 className="font-semibold text-orange-300 flex items-center gap-2"><Calculator className="w-4 h-4" />Résultats {mode === 'mur' ? 'Mur' : 'Plafond'}</h3>
            <div className="grid grid-cols-2 gap-2">
              <ResultRow label="Surface brute"   value={`${result.surface} m²`} />
              <ResultRow label="Surface à peindre" value={`${result.surfaceNette} m²`} />
              <ResultRow label="Litres de peinture" value={`${result.litres} L`} highlight />
              <ResultRow label="Bidons 10 L" value={`${Math.ceil(result.litres / 10)} bidons`} highlight />
            </div>
            <p className="text-xs text-slate-500">Ouvertures déduites (≈1.75 m²/unité) • Tous les calculs sont à titre indicatif</p>
          </div>
          <StoreLocatorPanel needs={materials} territory={territory} />
        </>
      )}
    </div>
  );
}

function CarrelageCalc({ onCalc, territory }: { onCalc: () => boolean; territory: TerritoryCode | null }) {
  const [longueur, setLongueur] = useState('');
  const [largeur, setLargeur]   = useState('');
  const [tileL, setTileL]       = useState('60');
  const [tileW, setTileW]       = useState('60');
  const [result, setResult]     = useState<{ surface: number; nbCarreaux: number; colle: number; joint: number } | null>(null);
  const [blocked, setBlocked]   = useState(false);
  const [materials, setMaterials] = useState<MaterialNeed[]>([]);

  const calculate = () => {
    if (!onCalc()) { setBlocked(true); return; }
    const l  = parseFloat(longueur.replace(',', '.'));
    const w  = parseFloat(largeur.replace(',', '.'));
    const tl = parseFloat(tileL.replace(',', '.')) / 100;
    const tw = parseFloat(tileW.replace(',', '.')) / 100;
    if (!l || !w || !tl || !tw) return;

    const surface    = l * w;
    const nbCarreaux = Math.ceil((surface / (tl * tw)) * 1.1);
    const colleKg    = Math.ceil(surface * 3.5);
    const jointKg    = Math.ceil(surface * 0.4);

    setResult({ surface: Math.round(surface * 100) / 100, nbCarreaux, colle: colleKg, joint: jointKg });
    setBlocked(false);

    setMaterials([
      { productId: 'carrelage_60',  qty: Math.ceil(surface) },
      { productId: 'colle_25kg',    qty: Math.ceil(colleKg / 25) },
      { productId: 'joint_5kg',     qty: Math.ceil(jointKg / 5) },
    ]);
  };

  const reset = () => { setLongueur(''); setLargeur(''); setResult(null); setBlocked(false); setMaterials([]); };

  return (
    <div className="space-y-4">
      <WarnBanner text="Dimensions de la pièce en mètres, format des carreaux en cm" />
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Longueur pièce" value={longueur} onChange={setLongueur} unit="m" />
        <NumInput label="Largeur pièce" value={largeur} onChange={setLargeur} unit="m" />
        <NumInput label="Longueur carreau" value={tileL} onChange={setTileL} unit="cm" placeholder="60" />
        <NumInput label="Largeur carreau" value={tileW} onChange={setTileW} unit="cm" placeholder="60" />
      </div>
      <div className="flex gap-3">
        <button onClick={calculate} className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors">Calculer</button>
        <button onClick={reset} className="rounded-xl border border-slate-600 px-4 py-3 text-slate-300 hover:border-slate-400"><RotateCcw className="w-4 h-4" /></button>
      </div>
      {blocked && <BlockedBanner />}
      {result && !blocked && (
        <>
          <div className="rounded-2xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
            <h3 className="font-semibold text-orange-300 flex items-center gap-2"><Calculator className="w-4 h-4" />Résultats</h3>
            <div className="grid grid-cols-2 gap-2">
              <ResultRow label="Surface" value={`${result.surface} m²`} />
              <ResultRow label="Carreaux (+ 10% chute)" value={`${result.nbCarreaux} pcs`} highlight />
              <ResultRow label="Colle carrelage" value={`${result.colle} kg (${Math.ceil(result.colle / 25)} sac×25kg)`} />
              <ResultRow label="Mortier joint" value={`${result.joint} kg (${Math.ceil(result.joint / 5)} sac×5kg)`} />
            </div>
            <p className="text-xs text-slate-500">Tous les calculs sont à titre indicatif</p>
          </div>
          <StoreLocatorPanel needs={materials} territory={territory} />
        </>
      )}
    </div>
  );
}

function BetonCourantCalc({ onCalc, territory }: { onCalc: () => boolean; territory: TerritoryCode | null }) {
  const [volume, setVolume]     = useState('');
  const [cimentIdx, setCimentIdx] = useState(0);
  const [dosage, setDosage]     = useState('300');
  const [result, setResult]     = useState<{ nbSacsCiment: number; sableKg: number; gravierKg: number; eau: number } | null>(null);
  const [blocked, setBlocked]   = useState(false);
  const [materials, setMaterials] = useState<MaterialNeed[]>([]);

  const calculate = () => {
    if (!onCalc()) { setBlocked(true); return; }
    const v = parseFloat(volume.replace(',', '.'));
    const d = parseFloat(dosage);
    if (!v || !d) return;

    const ciment   = CIMENT_TYPES[cimentIdx];
    const cimentKg = v * d;
    const nbSacsCiment = Math.ceil(cimentKg / ciment.kg);
    const sableKg  = Math.round(cimentKg * 2.5);
    const gravierKg = Math.round(cimentKg * 4);
    const eau      = Math.round(v * 180);

    setResult({ nbSacsCiment, sableKg, gravierKg, eau });
    setBlocked(false);

    setMaterials([
      { productId: ciment.productId,  qty: nbSacsCiment },
      { productId: 'sable_25kg',      qty: Math.ceil(sableKg / 25) },
      { productId: 'gravier_25kg',    qty: Math.ceil(gravierKg / 25) },
    ]);
  };

  const reset = () => { setVolume(''); setResult(null); setBlocked(false); setMaterials([]); };

  return (
    <div className="space-y-4">
      <WarnBanner text="Volume de béton à préparer en m³" />
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Volume béton" value={volume} onChange={setVolume} unit="m³" />
        <div>
          <label className="block text-sm text-slate-400 mb-1">Dosage (kg/m³)</label>
          <select value={dosage} onChange={(e) => setDosage(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
            <option value="250">250 – béton maigre</option>
            <option value="300">300 – béton courant</option>
            <option value="350">350 – béton résistant</option>
            <option value="400">400 – béton armé</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-slate-400 mb-1">Format sac ciment</label>
          <select value={cimentIdx} onChange={(e) => setCimentIdx(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
            {CIMENT_TYPES.map((c, i) => <option key={i} value={i}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={calculate} className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors">Calculer</button>
        <button onClick={reset} className="rounded-xl border border-slate-600 px-4 py-3 text-slate-300 hover:border-slate-400"><RotateCcw className="w-4 h-4" /></button>
      </div>
      {blocked && <BlockedBanner />}
      {result && !blocked && (
        <>
          <div className="rounded-2xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
            <h3 className="font-semibold text-orange-300 flex items-center gap-2"><Calculator className="w-4 h-4" />Résultats</h3>
            <div className="grid grid-cols-2 gap-2">
              <ResultRow label={`Sacs ${CIMENT_TYPES[cimentIdx].label}`} value={`${result.nbSacsCiment} sacs`} highlight />
              <ResultRow label="Sable 0/5 (sacs 25 kg)" value={`${Math.ceil(result.sableKg / 25)} sacs`} />
              <ResultRow label="Gravier 0/20 (sacs 25 kg)" value={`${Math.ceil(result.gravierKg / 25)} sacs`} />
              <ResultRow label="Eau" value={`${result.eau} L`} />
            </div>
            <p className="text-xs text-slate-500">Ciment CPJ 32.5 • Tous les calculs sont à titre indicatif</p>
          </div>
          <StoreLocatorPanel needs={materials} territory={territory} />
        </>
      )}
    </div>
  );
}

// ─── Enduit / Crépissage Calculator ──────────────────────────────────────────

function EnduitCalc({ onCalc, territory }: { onCalc: () => boolean; territory: TerritoryCode | null }) {
  const [surface, setSurface]   = useState('');
  const [epaisseur, setEpaisseur] = useState('15'); // mm
  const [cimentIdx, setCimentIdx] = useState(0);
  const [result, setResult]     = useState<{ enduitKg: number; nbSacsEnduit: number; nbSacsCiment: number; sableKg: number } | null>(null);
  const [blocked, setBlocked]   = useState(false);
  const [materials, setMaterials] = useState<MaterialNeed[]>([]);

  const calculate = () => {
    if (!onCalc()) { setBlocked(true); return; }
    const s  = parseFloat(surface.replace(',', '.'));
    const ep = parseFloat(epaisseur) / 1000; // mm → m
    if (!s || !ep) return;

    // Consommation enduit : environ 1.6 kg/m²/mm d'épaisseur
    const enduitKg    = Math.round(s * parseFloat(epaisseur) * 1.6);
    const nbSacsEnduit = Math.ceil(enduitKg / 25);

    // Alternatively with ciment+sable
    const ciment = CIMENT_TYPES[cimentIdx];
    // Mortier maigre 1:5 → 250 kg ciment/m³ ; volume = surface × épaisseur
    const volumeM3     = s * ep;
    const cimentKg     = Math.round(volumeM3 * 250);
    const nbSacsCiment = Math.ceil(cimentKg / ciment.kg);
    const sableKg      = Math.round(cimentKg * 5);

    setResult({ enduitKg, nbSacsEnduit, nbSacsCiment, sableKg });
    setBlocked(false);

    setMaterials([
      { productId: 'enduit_25kg',  qty: nbSacsEnduit },
      { productId: 'ciment_25kg',  qty: Math.ceil(cimentKg / 25) },
      { productId: 'sable_25kg',   qty: Math.ceil(sableKg / 25) },
    ]);
  };

  const reset = () => { setSurface(''); setResult(null); setBlocked(false); setMaterials([]); };

  return (
    <div className="space-y-4">
      <WarnBanner text="Surface à enduire en m² • Épaisseur en mm (standard 10–20 mm)" />
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Surface" value={surface} onChange={setSurface} unit="m²" />
        <div>
          <label className="block text-sm text-slate-400 mb-1">Épaisseur <span className="text-slate-500">(mm)</span></label>
          <select value={epaisseur} onChange={(e) => setEpaisseur(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
            <option value="10">10 mm – fin (rebouche)</option>
            <option value="15">15 mm – standard</option>
            <option value="20">20 mm – épais (façade)</option>
            <option value="25">25 mm – très épais</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-slate-400 mb-1">Format sac ciment (pour mortier maison)</label>
          <select value={cimentIdx} onChange={(e) => setCimentIdx(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
            {CIMENT_TYPES.map((c, i) => <option key={i} value={i}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={calculate} className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors">Calculer</button>
        <button onClick={reset} className="rounded-xl border border-slate-600 px-4 py-3 text-slate-300"><RotateCcw className="w-4 h-4" /></button>
      </div>
      {blocked && <BlockedBanner />}
      {result && !blocked && (
        <>
          <div className="rounded-2xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
            <h3 className="font-semibold text-orange-300 flex items-center gap-2"><Calculator className="w-4 h-4" />Résultats</h3>
            <div className="grid grid-cols-2 gap-2">
              <ResultRow label="Enduit prêt à l'emploi" value={`${result.enduitKg} kg`} highlight />
              <ResultRow label="Sacs enduit 25 kg" value={`${result.nbSacsEnduit} sacs`} highlight />
              <ResultRow label={`Sacs ${CIMENT_TYPES[cimentIdx].label}`} value={`${result.nbSacsCiment} sacs`} />
              <ResultRow label="Sable 0/5 (sacs 25 kg)" value={`${Math.ceil(result.sableKg / 25)} sacs`} />
            </div>
            <p className="text-xs text-slate-500">Enduit façade ≈ 1.6 kg/m²/mm • Mortier 1:5 dosé 250 kg/m³</p>
          </div>
          <StoreLocatorPanel needs={materials} territory={territory} />
        </>
      )}
    </div>
  );
}

// ─── Fondations Calculator ────────────────────────────────────────────────────

function FondationsCalc({ onCalc, territory }: { onCalc: () => boolean; territory: TerritoryCode | null }) {
  const [longueur, setLongueur] = useState('');
  const [largeur, setLargeur]   = useState('30'); // cm
  const [profondeur, setProfondeur] = useState('50'); // cm
  const [cimentIdx, setCimentIdx] = useState(1); // 35kg default
  const [result, setResult]     = useState<{ volume: number; nbSacsCiment: number; sableKg: number; gravierKg: number; acierKg: number } | null>(null);
  const [blocked, setBlocked]   = useState(false);
  const [materials, setMaterials] = useState<MaterialNeed[]>([]);

  const calculate = () => {
    if (!onCalc()) { setBlocked(true); return; }
    const l = parseFloat(longueur.replace(',', '.'));
    const w = parseFloat(largeur.replace(',', '.')) / 100;
    const h = parseFloat(profondeur.replace(',', '.')) / 100;
    if (!l || !w || !h) return;

    const volume = l * w * h;
    const ciment = CIMENT_TYPES[cimentIdx];
    // Béton armé dosé à 350 kg/m³
    const cimentKg = volume * 350;
    const nbSacsCiment = Math.ceil(cimentKg / ciment.kg);
    const sableKg  = Math.round(cimentKg * 2.5);
    const gravierKg = Math.round(cimentKg * 4);
    // Acier HA12 : environ 80 kg/m³ béton de fondation
    const acierKg = Math.round(volume * 80);

    setResult({ volume: Math.round(volume * 1000) / 1000, nbSacsCiment, sableKg, gravierKg, acierKg });
    setBlocked(false);

    setMaterials([
      { productId: ciment.productId, qty: nbSacsCiment },
      { productId: 'sable_25kg',     qty: Math.ceil(sableKg / 25) },
      { productId: 'gravier_25kg',   qty: Math.ceil(gravierKg / 25) },
      { productId: 'acier_ha12_6m',  qty: Math.ceil(acierKg / 5.3) }, // barre 6m ≈ 5.3 kg
    ]);
  };

  const reset = () => { setLongueur(''); setResult(null); setBlocked(false); setMaterials([]); };

  return (
    <div className="space-y-4">
      <WarnBanner text="Longueur en m • Largeur et profondeur en cm (semelle filante)" />
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Longueur totale" value={longueur} onChange={setLongueur} unit="m" />
        <div>
          <label className="block text-sm text-slate-400 mb-1">Largeur de semelle</label>
          <select value={largeur} onChange={(e) => setLargeur(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
            <option value="25">25 cm</option>
            <option value="30">30 cm (standard)</option>
            <option value="40">40 cm</option>
            <option value="50">50 cm</option>
            <option value="60">60 cm</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Profondeur (hauteur)</label>
          <select value={profondeur} onChange={(e) => setProfondeur(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
            <option value="30">30 cm</option>
            <option value="40">40 cm</option>
            <option value="50">50 cm (standard)</option>
            <option value="60">60 cm</option>
            <option value="80">80 cm</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Format sac ciment</label>
          <select value={cimentIdx} onChange={(e) => setCimentIdx(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
            {CIMENT_TYPES.map((c, i) => <option key={i} value={i}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={calculate} className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors">Calculer</button>
        <button onClick={reset} className="rounded-xl border border-slate-600 px-4 py-3 text-slate-300"><RotateCcw className="w-4 h-4" /></button>
      </div>
      {blocked && <BlockedBanner />}
      {result && !blocked && (
        <>
          <div className="rounded-2xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
            <h3 className="font-semibold text-orange-300 flex items-center gap-2"><Calculator className="w-4 h-4" />Résultats</h3>
            <div className="grid grid-cols-2 gap-2">
              <ResultRow label="Volume béton" value={`${result.volume} m³`} highlight />
              <ResultRow label={`Sacs ${CIMENT_TYPES[cimentIdx].label}`} value={`${result.nbSacsCiment} sacs`} highlight />
              <ResultRow label="Sable 0/5 (sacs 25 kg)" value={`${Math.ceil(result.sableKg / 25)} sacs`} />
              <ResultRow label="Gravier 0/20 (sacs 25 kg)" value={`${Math.ceil(result.gravierKg / 25)} sacs`} />
              <ResultRow label="Acier HA12 (barres 6m)" value={`${Math.ceil(result.acierKg / 5.3)} barres (~${result.acierKg} kg)`} />
            </div>
            <p className="text-xs text-slate-500">Béton armé 350 kg/m³ • Ferraillage estimé 80 kg/m³</p>
          </div>
          <StoreLocatorPanel needs={materials} territory={territory} />
        </>
      )}
    </div>
  );
}

// ─── Chape Calculator ─────────────────────────────────────────────────────────

function ChapeCalc({ onCalc, territory }: { onCalc: () => boolean; territory: TerritoryCode | null }) {
  const [longueur, setLongueur] = useState('');
  const [largeur, setLargeur]   = useState('');
  const [epaisseur, setEpaisseur] = useState('5'); // cm
  const [cimentIdx, setCimentIdx] = useState(0);
  const [result, setResult]     = useState<{ surface: number; volume: number; nbSacsCiment: number; sableKg: number } | null>(null);
  const [blocked, setBlocked]   = useState(false);
  const [materials, setMaterials] = useState<MaterialNeed[]>([]);

  const calculate = () => {
    if (!onCalc()) { setBlocked(true); return; }
    const l = parseFloat(longueur.replace(',', '.'));
    const w = parseFloat(largeur.replace(',', '.'));
    const ep = parseFloat(epaisseur) / 100;
    if (!l || !w || !ep) return;

    const surface = l * w;
    const volume  = Math.round(surface * ep * 1000) / 1000;
    const ciment  = CIMENT_TYPES[cimentIdx];
    // Chape dosée à 300 kg ciment/m³, ratio C:S = 1:3
    const cimentKg = volume * 300;
    const nbSacsCiment = Math.ceil(cimentKg / ciment.kg);
    const sableKg = Math.round(cimentKg * 3);

    setResult({ surface: Math.round(surface * 100) / 100, volume, nbSacsCiment, sableKg });
    setBlocked(false);

    setMaterials([
      { productId: ciment.productId, qty: nbSacsCiment },
      { productId: 'sable_25kg',     qty: Math.ceil(sableKg / 25) },
    ]);
  };

  const reset = () => { setLongueur(''); setLargeur(''); setResult(null); setBlocked(false); setMaterials([]); };

  return (
    <div className="space-y-4">
      <WarnBanner text="Dimensions en mètres • Épaisseur standard 4–6 cm (min 3 cm)" />
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Longueur" value={longueur} onChange={setLongueur} unit="m" />
        <NumInput label="Largeur" value={largeur} onChange={setLargeur} unit="m" />
        <div className="col-span-2">
          <label className="block text-sm text-slate-400 mb-2">Épaisseur : <span className="text-white font-bold">{epaisseur} cm</span></label>
          <div className="flex gap-2">
            {[3, 4, 5, 6, 8].map((ep) => (
              <button key={ep} onClick={() => setEpaisseur(String(ep))}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${String(ep) === epaisseur ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                {ep} cm
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-slate-400 mb-1">Format sac ciment</label>
          <select value={cimentIdx} onChange={(e) => setCimentIdx(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
            {CIMENT_TYPES.map((c, i) => <option key={i} value={i}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={calculate} className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors">Calculer</button>
        <button onClick={reset} className="rounded-xl border border-slate-600 px-4 py-3 text-slate-300"><RotateCcw className="w-4 h-4" /></button>
      </div>
      {blocked && <BlockedBanner />}
      {result && !blocked && (
        <>
          <div className="rounded-2xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
            <h3 className="font-semibold text-orange-300 flex items-center gap-2"><Calculator className="w-4 h-4" />Résultats</h3>
            <div className="grid grid-cols-2 gap-2">
              <ResultRow label="Surface" value={`${result.surface} m²`} />
              <ResultRow label="Volume chape" value={`${result.volume} m³`} highlight />
              <ResultRow label={`Sacs ${CIMENT_TYPES[cimentIdx].label}`} value={`${result.nbSacsCiment} sacs`} highlight />
              <ResultRow label="Sable 0/5 (sacs 25 kg)" value={`${Math.ceil(result.sableKg / 25)} sacs`} />
            </div>
            <p className="text-xs text-slate-500">Dosage 300 kg ciment/m³ • Rapport 1:3 (ciment:sable)</p>
          </div>
          <StoreLocatorPanel needs={materials} territory={territory} />
        </>
      )}
    </div>
  );
}

// ─── Tôles de couverture Calculator ──────────────────────────────────────────

function TolesCalc({ onCalc, territory }: { onCalc: () => boolean; territory: TerritoryCode | null }) {
  const [longueur, setLongueur] = useState('');
  const [largeur, setLargeur]   = useState('');
  const [longTole, setLongTole] = useState('3'); // m
  const [result, setResult]     = useState<{ surface: number; nbToles: number; nbVis: number; lFaitage: number } | null>(null);
  const [blocked, setBlocked]   = useState(false);
  const [materials, setMaterials] = useState<MaterialNeed[]>([]);

  const calculate = () => {
    if (!onCalc()) { setBlocked(true); return; }
    const l = parseFloat(longueur.replace(',', '.'));
    const w = parseFloat(largeur.replace(',', '.'));
    if (!l || !w) return;

    const surface = l * w;
    // Largeur utile tôle ondulée 0.80m (0.95m total avec recouvrement)
    const largeurUtile = 0.80;
    const nbRangs  = Math.ceil(w / largeurUtile);
    const nbCols   = Math.ceil(l / parseFloat(longTole));
    const nbToles  = Math.ceil(nbRangs * nbCols * 1.05); // +5% chute
    // Vis auto-perceuses : environ 8 vis par tôle
    const nbVis    = nbToles * 8;
    // Faîtière : longueur de faîte ≈ largeur de la toiture
    const lFaitage = Math.ceil(w * 1.1);

    setResult({ surface: Math.round(surface * 100) / 100, nbToles, nbVis, lFaitage });
    setBlocked(false);

    setMaterials([
      { productId: longTole === '3' ? 'tole_3m' : 'tole_4m', qty: nbToles },
      { productId: 'vis_autoperceuse_100', qty: Math.ceil(nbVis / 100) },
    ]);
  };

  const reset = () => { setLongueur(''); setLargeur(''); setResult(null); setBlocked(false); setMaterials([]); };

  return (
    <div className="space-y-4">
      <WarnBanner text="Longueur et largeur du rampant (un seul pan) en mètres" />
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Longueur rampant" value={longueur} onChange={setLongueur} unit="m" />
        <NumInput label="Largeur rampant" value={largeur} onChange={setLargeur} unit="m" />
        <div className="col-span-2">
          <label className="block text-sm text-slate-400 mb-2">Longueur des tôles</label>
          <div className="grid grid-cols-3 gap-2">
            {['2', '3', '4'].map((l) => (
              <button key={l} onClick={() => setLongTole(l)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${longTole === l ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                {l} m
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={calculate} className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors">Calculer</button>
        <button onClick={reset} className="rounded-xl border border-slate-600 px-4 py-3 text-slate-300"><RotateCcw className="w-4 h-4" /></button>
      </div>
      {blocked && <BlockedBanner />}
      {result && !blocked && (
        <>
          <div className="rounded-2xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
            <h3 className="font-semibold text-orange-300 flex items-center gap-2"><Calculator className="w-4 h-4" />Résultats</h3>
            <div className="grid grid-cols-2 gap-2">
              <ResultRow label="Surface couverte" value={`${result.surface} m²`} />
              <ResultRow label={`Tôles ondulées ${longTole}m`} value={`${result.nbToles} tôles`} highlight />
              <ResultRow label="Vis auto-perceuses" value={`${result.nbVis} vis (~${Math.ceil(result.nbVis / 100)} bte 100)`} />
              <ResultRow label="Faîtière (longueur)" value={`${result.lFaitage} m`} />
            </div>
            <p className="text-xs text-slate-500">Largeur utile tôle 0.80m • +5% chute inclus</p>
          </div>
          <StoreLocatorPanel needs={materials} territory={territory} />
        </>
      )}
    </div>
  );
}

// ─── Terrassement Calculator ──────────────────────────────────────────────────

function TerrassementCalc({ onCalc, territory: _territory }: { onCalc: () => boolean; territory: TerritoryCode | null }) {
  const [longueur, setLongueur] = useState('');
  const [largeur, setLargeur]   = useState('');
  const [profondeur, setProfondeur] = useState('');
  const [compactage, setCompactage] = useState('1.25'); // coefficient foisonnement
  const [result, setResult]     = useState<{ volume: number; volumeFoisonne: number; nbCamions: number } | null>(null);
  const [blocked, setBlocked]   = useState(false);

  const calculate = () => {
    if (!onCalc()) { setBlocked(true); return; }
    const l  = parseFloat(longueur.replace(',', '.'));
    const w  = parseFloat(largeur.replace(',', '.'));
    const p  = parseFloat(profondeur.replace(',', '.'));
    const cf = parseFloat(compactage);
    if (!l || !w || !p) return;

    const volume         = Math.round(l * w * p * 100) / 100;
    const volumeFoisonne = Math.round(volume * cf * 100) / 100;
    // Camion 8×4 = 12 m³ environ
    const nbCamions = Math.ceil(volumeFoisonne / 12);

    setResult({ volume, volumeFoisonne, nbCamions });
    setBlocked(false);
  };

  const reset = () => { setLongueur(''); setLargeur(''); setProfondeur(''); setResult(null); setBlocked(false); };

  return (
    <div className="space-y-4">
      <WarnBanner text="Dimensions en mètres — Le coefficient de foisonnement varie selon le sol" />
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Longueur" value={longueur} onChange={setLongueur} unit="m" />
        <NumInput label="Largeur" value={largeur} onChange={setLargeur} unit="m" />
        <NumInput label="Profondeur / Hauteur" value={profondeur} onChange={setProfondeur} unit="m" />
        <div>
          <label className="block text-sm text-slate-400 mb-1">Type de sol</label>
          <select value={compactage} onChange={(e) => setCompactage(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
            <option value="1.10">Sable (×1.10)</option>
            <option value="1.20">Terre légère (×1.20)</option>
            <option value="1.25">Terre normale (×1.25)</option>
            <option value="1.35">Terre argileuse (×1.35)</option>
            <option value="1.50">Roche meuble (×1.50)</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={calculate} className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors">Calculer</button>
        <button onClick={reset} className="rounded-xl border border-slate-600 px-4 py-3 text-slate-300"><RotateCcw className="w-4 h-4" /></button>
      </div>
      {blocked && <BlockedBanner />}
      {result && !blocked && (
        <div className="rounded-2xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
          <h3 className="font-semibold text-orange-300 flex items-center gap-2"><Calculator className="w-4 h-4" />Résultats</h3>
          <div className="grid grid-cols-2 gap-2">
            <ResultRow label="Volume en place" value={`${result.volume} m³`} />
            <ResultRow label="Volume foisonné (à évacuer)" value={`${result.volumeFoisonne} m³`} highlight />
            <ResultRow label="Camions 8×4 (≈12 m³)" value={`${result.nbCamions} camion${result.nbCamions > 1 ? 's' : ''}`} highlight />
          </div>
          <p className="text-xs text-slate-500">Volume foisonné = volume en place × coefficient • Camion 8×4 ≈ 12 m³</p>
        </div>
      )}
    </div>
  );
}

// ─── Clôture Calculator ───────────────────────────────────────────────────────

function ClotureCalc({ onCalc, territory }: { onCalc: () => boolean; territory: TerritoryCode | null }) {
  const [longueur, setLongueur] = useState('');
  const [hauteur, setHauteur]   = useState('1.5');
  const [type, setType]         = useState<'grillage' | 'beton' | 'bois'>('grillage');
  const [result, setResult]     = useState<{ nbPoteaux: number; grillageM: number; betonL: number; nbSacsCiment: number } | null>(null);
  const [blocked, setBlocked]   = useState(false);
  const [materials, setMaterials] = useState<MaterialNeed[]>([]);

  const calculate = () => {
    if (!onCalc()) { setBlocked(true); return; }
    const l = parseFloat(longueur.replace(',', '.'));
    const h = parseFloat(hauteur.replace(',', '.'));
    if (!l || !h) return;

    // Poteaux tous les 2.5m
    const nbPoteaux   = Math.ceil(l / 2.5) + 1;
    const grillageM   = type === 'grillage' ? Math.ceil(l * 1.05) : 0;
    // Béton de scellement : 0.015 m³ par poteau
    const betonM3     = nbPoteaux * 0.015;
    // Ciment dosé 300 kg/m³
    const cimentKg    = betonM3 * 300;
    const nbSacsCiment = Math.ceil(cimentKg / 25);
    const betonL      = Math.round(betonM3 * 1000); // litres

    setResult({ nbPoteaux, grillageM, betonL, nbSacsCiment });
    setBlocked(false);

    setMaterials([
      { productId: 'ciment_25kg',  qty: nbSacsCiment },
      { productId: 'sable_25kg',   qty: Math.ceil((cimentKg * 3) / 25) },
    ]);
  };

  const reset = () => { setLongueur(''); setResult(null); setBlocked(false); setMaterials([]); };

  return (
    <div className="space-y-4">
      <WarnBanner text="Longueur de clôture en mètres • Poteaux espacés 2.5 m" />
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Longueur totale" value={longueur} onChange={setLongueur} unit="m" />
        <div>
          <label className="block text-sm text-slate-400 mb-1">Hauteur</label>
          <select value={hauteur} onChange={(e) => setHauteur(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
            <option value="1.0">1.0 m</option>
            <option value="1.2">1.2 m</option>
            <option value="1.5">1.5 m (standard)</option>
            <option value="1.8">1.8 m</option>
            <option value="2.0">2.0 m</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-slate-400 mb-2">Type de clôture</label>
          <div className="grid grid-cols-3 gap-2">
            {([['grillage', '🥅 Grillage'], ['beton', '🧱 Maçonnée'], ['bois', '🪵 Palissade']] as const).map(([t, label]) => (
              <button key={t} onClick={() => setType(t)}
                className={`py-2 rounded-xl text-xs font-semibold transition-colors ${type === t ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={calculate} className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors">Calculer</button>
        <button onClick={reset} className="rounded-xl border border-slate-600 px-4 py-3 text-slate-300"><RotateCcw className="w-4 h-4" /></button>
      </div>
      {blocked && <BlockedBanner />}
      {result && !blocked && (
        <>
          <div className="rounded-2xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
            <h3 className="font-semibold text-orange-300 flex items-center gap-2"><Calculator className="w-4 h-4" />Résultats</h3>
            <div className="grid grid-cols-2 gap-2">
              <ResultRow label="Poteaux (tous 2.5 m)" value={`${result.nbPoteaux} poteaux`} highlight />
              {type === 'grillage' && <ResultRow label="Grillage" value={`${result.grillageM} ml`} highlight />}
              <ResultRow label="Béton de scellement" value={`${result.betonL} L`} />
              <ResultRow label="Sacs ciment 25 kg" value={`${result.nbSacsCiment} sacs`} />
            </div>
            <p className="text-xs text-slate-500">Béton scellement 0.015 m³/poteau • Tous les calculs sont à titre indicatif</p>
          </div>
          <StoreLocatorPanel needs={materials} territory={territory} />
        </>
      )}
    </div>
  );
}

// ─── Escalier Calculator ──────────────────────────────────────────────────────

function EscalierCalc({ onCalc, territory: _territory }: { onCalc: () => boolean; territory: TerritoryCode | null }) {
  const [hauteurTotale, setHauteurTotale] = useState('');
  const [nbMarches, setNbMarches]         = useState('');
  const [result, setResult] = useState<{
    hauteurMarche: number; giron: number; longueurTotale: number; angleDeg: number; conformeNormes: boolean;
  } | null>(null);
  const [blocked, setBlocked] = useState(false);

  const calculate = () => {
    if (!onCalc()) { setBlocked(true); return; }
    const ht = parseFloat(hauteurTotale.replace(',', '.'));
    const nb = parseInt(nbMarches);
    if (!ht || !nb || nb < 2) return;

    const hauteurMarche = Math.round((ht / nb) * 100) / 100;
    // Formule de Blondel : 2h + g = 63 cm (±1 cm)
    // g = 63 - 2h
    const giron        = Math.round((0.63 - 2 * hauteurMarche) * 100);
    const longueurTotale = Math.round(nb * (giron / 100) * 100) / 100;
    const angleRad     = Math.atan(hauteurMarche / (giron / 100));
    const angleDeg     = Math.round((angleRad * 180) / Math.PI);
    // Normes : h ∈ [17, 20 cm], g ∈ [24, 32 cm]
    const conformeNormes = hauteurMarche >= 0.17 && hauteurMarche <= 0.20
      && giron >= 24 && giron <= 32;

    setResult({ hauteurMarche, giron, longueurTotale, angleDeg, conformeNormes });
    setBlocked(false);
  };

  const reset = () => { setHauteurTotale(''); setNbMarches(''); setResult(null); setBlocked(false); };

  return (
    <div className="space-y-4">
      <WarnBanner text="Hauteur totale à franchir en mètres • Formule de Blondel : 2h + g = 63 cm" />
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Hauteur totale à franchir" value={hauteurTotale} onChange={setHauteurTotale} unit="m" />
        <NumInput label="Nombre de marches" value={nbMarches} onChange={setNbMarches} placeholder="13" unit="marches" />
      </div>
      <div className="flex gap-3">
        <button onClick={calculate} className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors">Calculer</button>
        <button onClick={reset} className="rounded-xl border border-slate-600 px-4 py-3 text-slate-300"><RotateCcw className="w-4 h-4" /></button>
      </div>
      {blocked && <BlockedBanner />}
      {result && !blocked && (
        <div className="rounded-2xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
          <h3 className="font-semibold text-orange-300 flex items-center gap-2"><Calculator className="w-4 h-4" />Résultats</h3>
          <div className="grid grid-cols-2 gap-2">
            <ResultRow label="Hauteur de marche (h)" value={`${Math.round(result.hauteurMarche * 100)} cm`} highlight />
            <ResultRow label="Giron (g)" value={`${result.giron} cm`} highlight />
            <ResultRow label="Longueur totale limon" value={`${result.longueurTotale} m`} />
            <ResultRow label="Angle inclinaison" value={`${result.angleDeg}°`} />
          </div>
          <div className={`rounded-xl px-4 py-3 text-center text-sm font-semibold ${result.conformeNormes ? 'bg-green-900/40 text-green-300 border border-green-500/30' : 'bg-red-900/40 text-red-300 border border-red-500/30'}`}>
            {result.conformeNormes ? '✅ Conforme aux normes NF P01-013 (h: 17–20 cm, g: 24–32 cm)' : '⚠️ Hors normes NF P01-013 — Ajustez le nombre de marches'}
          </div>
          <p className="text-xs text-slate-500">Formule de Blondel : 2h + g = {Math.round(2 * result.hauteurMarche * 100 + result.giron)} cm (idéal 63 cm)</p>
        </div>
      )}
    </div>
  );
}

// ─── Paywall Modal ────────────────────────────────────────────────────────────

function PaywallModal({ onStartTrial, onClose, isExpired }: { onStartTrial: () => void; onClose: () => void; isExpired: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="max-w-sm w-full bg-slate-900 rounded-2xl border border-orange-500/40 p-6 shadow-2xl">
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-orange-900/40 border-2 border-orange-500/50 flex items-center justify-center mb-3">
            {isExpired ? <Lock className="w-8 h-8 text-orange-400" /> : <HardHat className="w-8 h-8 text-orange-400" />}
          </div>
          <h2 className="text-xl font-black text-white mb-1">
            {isExpired ? 'Période d\'essai terminée' : '🏗️ Calculateur du Bâtiment'}
          </h2>
          <p className="text-sm text-slate-400">
            {isExpired ? 'Abonnez-vous pour continuer à utiliser les calculateurs.' : 'Essayez gratuitement pendant 7 jours avec quota dégressive.'}
          </p>
        </div>

        {!isExpired && (
          <div className="mb-5 rounded-xl overflow-hidden border border-slate-700">
            {[
              { days: 'Jours 1–2', quota: '20 calculs/jour', color: 'text-green-400', dot: '🟢' },
              { days: 'Jours 3–4', quota: '15 calculs/jour', color: 'text-yellow-400', dot: '🟡' },
              { days: 'Jours 5–6', quota: '8 calculs/jour',  color: 'text-orange-400', dot: '🟠' },
              { days: 'Jour 7',    quota: '3 calculs/jour',  color: 'text-red-400',    dot: '🔴' },
            ].map((row, i) => (
              <div key={i} className={`flex justify-between items-center px-4 py-2.5 text-sm ${i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'}`}>
                <span className="text-slate-300">{row.dot} {row.days}</span>
                <span className={`font-semibold ${row.color}`}>{row.quota}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2.5">
          {!isExpired && (
            <button onClick={onStartTrial}
              className="w-full rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-bold text-white transition-colors flex items-center justify-center gap-2">
              <Unlock className="w-4 h-4" />Démarrer l'essai gratuit 7 jours
            </button>
          )}
          <button onClick={() => { window.location.href = '/pricing'; }}
            className="w-full rounded-xl bg-indigo-700 hover:bg-indigo-600 py-3 font-bold text-white transition-colors flex items-center justify-center gap-2">
            <Star className="w-4 h-4" />S'abonner — accès illimité
          </button>
          {!isExpired && (
            <button onClick={onClose} className="w-full rounded-xl border border-slate-700 py-2 text-sm text-slate-400 hover:text-slate-300 hover:border-slate-600 transition-colors">
              Continuer sans essai
            </button>
          )}
        </div>
        <p className="text-xs text-center text-slate-600 mt-3">Tous les calculs sont à titre indicatif</p>
      </div>
    </div>
  );
}

// ─── Trial Banner ─────────────────────────────────────────────────────────────

function TrialBanner({ state }: { state: BatimentTrialState }) {
  if (!state.startedAt) return null;
  const pct   = state.trialDay ? Math.max(0, Math.round(((8 - state.trialDay) / 7) * 100)) : 0;
  const color = pct > 60 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 p-3 mb-4">
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="flex items-center gap-1.5 text-slate-300">
          <Clock className="w-4 h-4 text-orange-400" />Essai gratuit — Jour {state.trialDay ?? '?'}/7
        </span>
        <span className="text-slate-400 text-xs">
          {state.remainingToday} calcul{state.remainingToday !== 1 ? 's' : ''} restant{state.remainingToday !== 1 ? 's' : ''}/jour
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {state.daysLeft <= 2 && (
        <p className="text-xs text-orange-400 mt-1.5 flex items-center gap-1">
          <Info className="w-3 h-3" />Plus que {state.daysLeft} jour{state.daysLeft !== 1 ? 's' : ''} d'essai —{' '}
          <a href="/pricing" className="underline hover:text-orange-300">S'abonner</a>
        </p>
      )}
    </div>
  );
}

// ─── Suggestions Panel ────────────────────────────────────────────────────────

function SuggestionsPanel() {
  return (
    <div className="mt-8 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-slate-800 border border-indigo-500/30 p-5">
      <h2 className="font-black text-white mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-indigo-400" />💡 Nos suggestions pour améliorer votre projet
      </h2>
      <div className="space-y-3 text-sm">
        {[
          { icon: '📋', title: 'Préparez votre liste avant d\'aller au magasin', text: 'Utilisez le bouton "Copier la liste" après chaque calcul pour ne rien oublier.' },
          { icon: '📞', title: 'Appelez le magasin avant de vous déplacer', text: 'Les stocks peuvent varier. Un appel rapide vous évitera un déplacement inutile.' },
          { icon: '🚚', title: 'Pensez à la livraison pour les gros chantiers', text: 'Point P et Leroy Merlin proposent la livraison sur chantier. Renseignez-vous au magasin.' },
          { icon: '💼', title: 'Compte pro pour les professionnels', text: 'Point P et Batimat OI offrent des tarifs professionnels réduits avec carte client pro.' },
          { icon: '📦', title: 'Achetez par palette pour économiser', text: 'Les parpaings et le ciment achetés en palette sont souvent moins chers. Vérifiez les offres vrac.' },
          { icon: '🌡️', title: 'Attention aux conditions climatiques', text: 'Évitez de couler du béton ou poser du carrelage par temps de pluie ou chaleur extrême (>35°C).' },
        ].map((item) => (
          <div key={item.title} className="flex gap-3 bg-slate-900/40 rounded-xl p-3">
            <span className="text-2xl shrink-0">{item.icon}</span>
            <div>
              <p className="font-semibold text-white">{item.title}</p>
              <p className="text-slate-400 text-xs mt-0.5">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TERRITORY_STORAGE_KEY = 'akp:batiment:territory';

export default function CalculateurBatiment() {
  const [trialState, setTrialState]         = useState<BatimentTrialState>(() => getBatimentTrialState());
  const [showPaywall, setShowPaywall]        = useState(false);
  const [territory, setTerritory]           = useState<TerritoryCode | null>(() => {
    try { return (localStorage.getItem(TERRITORY_STORAGE_KEY) as TerritoryCode) ?? null; } catch { return null; }
  });
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [selectedCalc, setSelectedCalc]     = useState<CalculatorId | null>(null);

  useEffect(() => {
    const state = getBatimentTrialState();
    setTrialState(state);
    if (!state.startedAt) setShowPaywall(true);
  }, []);

  useEffect(() => {
    try { if (territory) localStorage.setItem(TERRITORY_STORAGE_KEY, territory); } catch { /* */ }
  }, [territory]);

  const handleStartTrial = () => {
    setTrialState(startBatimentTrial());
    setShowPaywall(false);
  };

  const handleCalc = useCallback((): boolean => {
    const state = getBatimentTrialState();
    if (!state.startedAt || state.isExpired || state.remainingToday <= 0) {
      setShowPaywall(true);
      return false;
    }
    const { allowed, state: newState } = consumeBatimentCalc();
    setTrialState(newState);
    return allowed;
  }, []);

  const goBack = () => {
    if (selectedCalc) setSelectedCalc(null);
    else setSelectedCategory(null);
  };

  const category   = selectedCategory ? CATEGORIES.find((c) => c.id === selectedCategory) : null;
  const calcMeta   = selectedCalc ? CALC_META[selectedCalc] : null;

  return (
    <>
      <Helmet>
        <title>Calculateur du Bâtiment — A KI PRI SA YÉ</title>
        <meta name="description" content="Calculez parpaings, dalle béton, peinture, carrelage. Trouvez où acheter vos matériaux en DOM-TOM avec comparatif de prix par magasin." />
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-white">
        {showPaywall && (
          <PaywallModal
            onStartTrial={handleStartTrial}
            onClose={() => setShowPaywall(false)}
            isExpired={trialState.isExpired}
          />
        )}

        <div className="max-w-2xl mx-auto px-4 pb-16 pt-6">

          {/* ── Header ── */}
          <div className="flex items-center gap-3 mb-5">
            {(selectedCategory || selectedCalc) && (
              <button onClick={goBack} className="rounded-full p-2 bg-slate-800 hover:bg-slate-700 transition-colors shrink-0" aria-label="Retour">
                <ChevronLeft className="w-5 h-5 text-slate-300" />
              </button>
            )}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-700 to-orange-500 flex items-center justify-center shadow-lg shrink-0">
                <HardHat className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-black text-white leading-tight truncate">
                  {calcMeta ? calcMeta.label : category ? category.label : 'Calculs du bâtiment'}
                </h1>
                <p className="text-xs text-slate-400">Simple et Rapide</p>
              </div>
            </div>
          </div>

          {/* ── Territory Selector ── */}
          {!selectedCalc && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2">Votre territoire (pour les prix en magasin)</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {TERRITORY_OPTIONS.map((t) => (
                  <button
                    key={t.code}
                    onClick={() => setTerritory(t.code)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                      territory === t.code
                        ? 'border-orange-500 bg-orange-900/30 text-orange-200'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span>{t.flag}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Trial Banner ── */}
          {trialState.startedAt && !trialState.isExpired && <TrialBanner state={trialState} />}

          {/* ── Expired Banner ── */}
          {trialState.isExpired && (
            <div className="rounded-xl bg-red-900/20 border border-red-500/40 p-4 mb-4 text-center">
              <Lock className="w-5 h-5 mx-auto mb-1 text-red-400" />
              <p className="text-sm text-red-300 font-semibold">Période d'essai terminée</p>
              <a href="/pricing" className="text-xs text-indigo-400 underline hover:text-indigo-300">S'abonner pour continuer →</a>
            </div>
          )}

          {/* ── Level 0 : Category Hub ── */}
          {!selectedCategory && !selectedCalc && (
            <div className="space-y-4">
              {CATEGORIES.map((cat) => {
                const Icon = cat.id === 'gros-oeuvre' ? HardHat : cat.id === 'finitions' ? Home : cat.id === 'exterieur' ? TreePine : Wrench;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="w-full rounded-2xl overflow-hidden shadow-xl hover:scale-[1.02] transition-transform active:scale-[0.99]"
                  >
                    <div className={`bg-gradient-to-br ${cat.bgFrom} ${cat.bgTo} p-6 flex items-end gap-4 min-h-[120px] relative`}>
                      <div className="absolute top-4 right-4 flex gap-1 flex-wrap justify-end">
                        {cat.calcs.slice(0, 4).map((c) => (
                          <span key={c} className="text-xs bg-black/20 text-white/80 rounded-full px-2 py-0.5">{CALC_META[c].emoji}</span>
                        ))}
                      </div>
                      <Icon className="w-14 h-14 text-white/70 mb-1 shrink-0" />
                      <div>
                        <span className="text-xl font-black text-white drop-shadow-md">{cat.label}</span>
                        <p className="text-xs text-white/70 mt-0.5">{cat.calcs.length} calculateurs</p>
                      </div>
                    </div>
                  </button>
                );
              })}
              <SuggestionsPanel />
            </div>
          )}

          {/* ── Level 1 : Calculator List ── */}
          {selectedCategory && !selectedCalc && category && (
            <div className="space-y-3">
              {category.calcs.map((calcId) => {
                const meta = CALC_META[calcId];
                return (
                  <button key={calcId} onClick={() => setSelectedCalc(calcId)}
                    className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-orange-500/40 p-4 text-left transition-all flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-700 flex items-center justify-center text-3xl shrink-0">{meta.emoji}</div>
                    <div>
                      <p className="font-bold text-white">{meta.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{meta.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Level 2 : Active Calculator ── */}
          {selectedCalc && (
            <>
              <div className="bg-slate-900 rounded-2xl border border-slate-700 p-4">
                {selectedCalc === 'parpaing'        && <ParpaingCalc      onCalc={handleCalc} territory={territory} />}
                {selectedCalc === 'dalle-beton'     && <DalleBetonCalc    onCalc={handleCalc} territory={territory} />}
                {selectedCalc === 'fondations'      && <FondationsCalc    onCalc={handleCalc} territory={territory} />}
                {selectedCalc === 'chape'           && <ChapeCalc         onCalc={handleCalc} territory={territory} />}
                {selectedCalc === 'carrelage'       && <CarrelageCalc     onCalc={handleCalc} territory={territory} />}
                {selectedCalc === 'peinture'        && <PeintureCalc      onCalc={handleCalc} territory={territory} />}
                {selectedCalc === 'enduit'          && <EnduitCalc        onCalc={handleCalc} territory={territory} />}
                {selectedCalc === 'toles'           && <TolesCalc         onCalc={handleCalc} territory={territory} />}
                {selectedCalc === 'terrassement'    && <TerrassementCalc  onCalc={handleCalc} territory={territory} />}
                {selectedCalc === 'cloture'         && <ClotureCalc       onCalc={handleCalc} territory={territory} />}
                {selectedCalc === 'beton-courant'   && <BetonCourantCalc  onCalc={handleCalc} territory={territory} />}
                {selectedCalc === 'escalier'        && <EscalierCalc      onCalc={handleCalc} territory={territory} />}
              </div>
              {/* Disclaimer */}
              <p className="mt-3 text-center text-xs text-slate-600 bg-orange-900/15 border border-orange-900/30 rounded-xl px-4 py-2">
                Tous les calculs sont à titre indicatif
              </p>
              {/* Suggestions at bottom of calc */}
              {!selectedCategory && <SuggestionsPanel />}
            </>
          )}
        </div>
      </div>
    </>
  );
}
