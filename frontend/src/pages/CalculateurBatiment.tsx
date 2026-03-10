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
import { Link } from 'react-router-dom';
import {
  HardHat, Home, TreePine, Wrench, Lock, Unlock,
  ChevronLeft, AlertTriangle, Star, Clock, Calculator,
  RotateCcw, Info, ShoppingCart, MapPin, Phone, ExternalLink,
  ChevronDown, ChevronUp, Copy, Check, Navigation,
  Package, Tag, Clock3, CheckCircle2, XCircle,
  BookOpen, ChevronRight, Shield, Hammer, Layers, Zap,
  MessageSquarePlus, Send, Lightbulb,
} from 'lucide-react';
import {
  getBatimentTrialState,
  startBatimentTrial,
  consumeBatimentCalc,
  type BatimentTrialState,
} from '../services/batimentTrialService';
import { saveBatimentCalculation, type BatimentSaveData } from '../services/batimentCalculService';
import {
  submitBatimentSuggestion,
  SUGGESTION_CATEGORY_LABELS,
  type SuggestionCategory,
} from '../services/batimentSuggestionsService';
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

/** Shared props for all calculator sub-components. */
type CalcProps = {
  onCalc: () => boolean;
  territory: TerritoryCode | null;
  onSave: (d: BatimentSaveData) => void;
};

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
      <Link to="/pricing" className="text-xs text-indigo-400 underline hover:text-indigo-300">Passer en Premium pour continuer →</Link>
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

function ParpaingCalc({ onCalc, territory, onSave }: CalcProps) {
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

    const res = { surface: Math.round(surface * 100) / 100, nbBlocs, mortierM3, nbSacsCiment, sableKg };
    setResult(res);
    setBlocked(false);

    // Build material needs for store locator
    const sacsSable = Math.ceil(sableKg / 25);
    const mats: MaterialNeed[] = [
      { productId: parpaing.productId, qty: nbBlocs },
      { productId: ciment.productId, qty: nbSacsCiment },
      { productId: 'sable_25kg', qty: sacsSable },
    ];
    setMaterials(mats);
    onSave({ calcType: 'parpaing', inputs: { longueur, hauteur, typeBloc: PARPAING_TYPES[typeIdx].label, formatCiment: CIMENT_TYPES[cimentIdx].label }, results: res, materials: mats });
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

function DalleBetonCalc({ onCalc, territory, onSave }: CalcProps) {
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

    const res = { surface, volume, nbSacsCiment, sableKg, gravierKg, treillis };
    setResult(res);
    setBlocked(false);

    const mats: MaterialNeed[] = [
      { productId: ciment.productId, qty: nbSacsCiment },
      { productId: 'sable_25kg',     qty: Math.ceil(sableKg / 25) },
      { productId: 'gravier_25kg',   qty: Math.ceil(gravierKg / 25) },
      { productId: 'treillis_1224',  qty: treillis },
    ];
    setMaterials(mats);
    onSave({ calcType: 'dalle-beton', inputs: { longueur, largeur, epaisseurCm: epaisseur, formatCiment: CIMENT_TYPES[cimentIdx].label }, results: res, materials: mats });
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

function PeintureCalc({ onCalc, territory, onSave }: CalcProps) {
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

    // Suggest bidon 10L
    const bidons10 = Math.ceil(litres / 10);
    const res = { surface: Math.round(surfaceBrute * 100) / 100, surfaceNette: Math.round(surfaceNette * 100) / 100, litres };
    setResult(res);
    setBlocked(false);

    const mats: MaterialNeed[] = [
      { productId: 'peinture_10L', qty: bidons10 },
    ];
    setMaterials(mats);
    onSave({ calcType: 'peinture', inputs: { mode, largeur, hauteur, nbrOuvertures, nbrCouches, rendementM2L: rendement }, results: res, materials: mats });
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

function CarrelageCalc({ onCalc, territory, onSave }: CalcProps) {
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

    const res = { surface: Math.round(surface * 100) / 100, nbCarreaux, colle: colleKg, joint: jointKg };
    setResult(res);
    setBlocked(false);

    const mats: MaterialNeed[] = [
      { productId: 'carrelage_60',  qty: Math.ceil(surface) },
      { productId: 'colle_25kg',    qty: Math.ceil(colleKg / 25) },
      { productId: 'joint_5kg',     qty: Math.ceil(jointKg / 5) },
    ];
    setMaterials(mats);
    onSave({ calcType: 'carrelage', inputs: { longueur, largeur, formatCarreauLcm: tileL, formatCarreauWcm: tileW }, results: res, materials: mats });
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

function BetonCourantCalc({ onCalc, territory, onSave }: CalcProps) {
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

    const res = { nbSacsCiment, sableKg, gravierKg, eau };
    setResult(res);
    setBlocked(false);

    const mats: MaterialNeed[] = [
      { productId: ciment.productId,  qty: nbSacsCiment },
      { productId: 'sable_25kg',      qty: Math.ceil(sableKg / 25) },
      { productId: 'gravier_25kg',    qty: Math.ceil(gravierKg / 25) },
    ];
    setMaterials(mats);
    onSave({ calcType: 'beton-courant', inputs: { volumeM3: volume, dosageKgM3: dosage, formatCiment: CIMENT_TYPES[cimentIdx].label }, results: res, materials: mats });
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

function EnduitCalc({ onCalc, territory, onSave }: CalcProps) {
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

    const res = { enduitKg, nbSacsEnduit, nbSacsCiment, sableKg };
    setResult(res);
    setBlocked(false);

    const mats: MaterialNeed[] = [
      { productId: 'enduit_25kg',  qty: nbSacsEnduit },
      { productId: 'ciment_25kg',  qty: Math.ceil(cimentKg / 25) },
      { productId: 'sable_25kg',   qty: Math.ceil(sableKg / 25) },
    ];
    setMaterials(mats);
    onSave({ calcType: 'enduit', inputs: { surfaceM2: surface, epaisseurMm: epaisseur, formatCiment: CIMENT_TYPES[cimentIdx].label }, results: res, materials: mats });
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

function FondationsCalc({ onCalc, territory, onSave }: CalcProps) {
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

    const res = { volume: Math.round(volume * 1000) / 1000, nbSacsCiment, sableKg, gravierKg, acierKg };
    setResult(res);
    setBlocked(false);

    const mats: MaterialNeed[] = [
      { productId: ciment.productId, qty: nbSacsCiment },
      { productId: 'sable_25kg',     qty: Math.ceil(sableKg / 25) },
      { productId: 'gravier_25kg',   qty: Math.ceil(gravierKg / 25) },
      { productId: 'acier_ha12_6m',  qty: Math.ceil(acierKg / 5.3) }, // barre 6m ≈ 5.3 kg
    ];
    setMaterials(mats);
    onSave({ calcType: 'fondations', inputs: { longueurM: longueur, largeurCm: largeur, profondeurCm: profondeur, formatCiment: CIMENT_TYPES[cimentIdx].label }, results: res, materials: mats });
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

function ChapeCalc({ onCalc, territory, onSave }: CalcProps) {
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

    const res = { surface: Math.round(surface * 100) / 100, volume, nbSacsCiment, sableKg };
    setResult(res);
    setBlocked(false);

    const mats: MaterialNeed[] = [
      { productId: ciment.productId, qty: nbSacsCiment },
      { productId: 'sable_25kg',     qty: Math.ceil(sableKg / 25) },
    ];
    setMaterials(mats);
    onSave({ calcType: 'chape', inputs: { longueur, largeur, epaisseurCm: epaisseur, formatCiment: CIMENT_TYPES[cimentIdx].label }, results: res, materials: mats });
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

function TolesCalc({ onCalc, territory, onSave }: CalcProps) {
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

    const res = { surface: Math.round(surface * 100) / 100, nbToles, nbVis, lFaitage };
    setResult(res);
    setBlocked(false);

    const mats: MaterialNeed[] = [
      { productId: longTole === '3' ? 'tole_3m' : 'tole_4m', qty: nbToles },
      { productId: 'vis_autoperceuse_100', qty: Math.ceil(nbVis / 100) },
    ];
    setMaterials(mats);
    onSave({ calcType: 'toles', inputs: { longueurRampant: longueur, largeurRampant: largeur, longueurToleM: longTole }, results: res, materials: mats });
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

function TerrassementCalc({ onCalc, territory: _territory, onSave }: CalcProps) {
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

    const res = { volume, volumeFoisonne, nbCamions };
    setResult(res);
    setBlocked(false);
    onSave({ calcType: 'terrassement', inputs: { longueur, largeur, profondeur, typeSol: compactage }, results: res, materials: [] });
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

function ClotureCalc({ onCalc, territory, onSave }: CalcProps) {
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

    const res = { nbPoteaux, grillageM, betonL, nbSacsCiment };
    setResult(res);
    setBlocked(false);

    const mats: MaterialNeed[] = [
      { productId: 'ciment_25kg',  qty: nbSacsCiment },
      { productId: 'sable_25kg',   qty: Math.ceil((cimentKg * 3) / 25) },
    ];
    setMaterials(mats);
    onSave({ calcType: 'cloture', inputs: { longueurM: longueur, hauteurM: hauteur, typeCloture: type }, results: res, materials: mats });
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

function EscalierCalc({ onCalc, territory: _territory, onSave }: CalcProps) {
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

    const res = { hauteurMarche, giron, longueurTotale, angleDeg, conformeNormes };
    setResult(res);
    setBlocked(false);
    onSave({ calcType: 'escalier', inputs: { hauteurTotaleM: hauteurTotale, nbMarches }, results: res, materials: [] });
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
          <Link to="/pricing" className="underline hover:text-orange-300">S'abonner</Link>
        </p>
      )}
    </div>
  );
}

// ─── Tutorial Data ────────────────────────────────────────────────────────────

interface TutoStep {
  num: number;
  icons: string;
  title: string;
  desc: string;
  tip?: string;
  warning?: string;
}

interface Tutorial {
  id: string;
  calcId: CalculatorId;
  title: string;
  subtitle: string;
  emoji: string;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Expert';
  duree: string;
  materiel: string[];
  epi: string[];   // équipements de protection
  steps: TutoStep[];
  bgFrom: string;
  bgTo: string;
  coverArt: string; // emoji art for the cover illustration
}

const TUTORIALS: Tutorial[] = [
  {
    id: 'tuto-parpaing',
    calcId: 'parpaing',
    title: 'Monter un mur en parpaings',
    subtitle: 'Technique de pose et dosage du mortier',
    emoji: '🧱',
    difficulty: 'Débutant',
    duree: '2–4 h pour 10 m²',
    coverArt: '🧱🧱🧱\n🪣🏗️🧤\n👷‍♂️🛠️📐',
    bgFrom: 'from-stone-700',
    bgTo: 'to-amber-600',
    materiel: ['Parpaings', 'Ciment CPJ 32.5', 'Sable 0/5', 'Eau', 'Bétonnière ou auge', 'Truelle', 'Fil à plomb', 'Niveau à bulle', 'Règle de maçon', 'Maillet en caoutchouc'],
    epi: ['🦺 Gilet de sécurité', '🥽 Lunettes de protection', '🧤 Gants anti-coupure', '👷 Casque (si hauteur > 1 m)', '👟 Chaussures de sécurité'],
    steps: [
      { num: 1, icons: '📐🧵', title: 'Tracer et préparer la fondation', desc: 'Vérifiez que la fondation est propre, plane et sèche. Tracez le tracé du mur au cordeau. La surface doit être débarrassée de toute poussière ou gravats.', tip: 'Utilisez un niveau laser ou un niveau à eau pour garantir une surface de pose parfaitement horizontale.' },
      { num: 2, icons: '🪣🧱', title: 'Préparer le mortier de pose', desc: 'Mélangez 1 volume de ciment pour 4 volumes de sable sec (mortier standard). Ajoutez progressivement l\'eau jusqu\'à obtenir une consistance crémeuse qui tient sur la truelle sans couler.', tip: 'Un mortier trop liquide fera couler les blocs. Un mortier trop sec sera difficile à étaler. Visez la texture d\'une purée ferme.', warning: 'Ne préparez pas plus de mortier que vous ne pouvez utiliser en 1h30. Le mortier "prend" et durcit rapidement.' },
      { num: 3, icons: '🔤🧱', title: 'Poser le premier rang (chaîne)', desc: 'Le premier rang est le plus important. Étalez une couche de mortier d\'environ 2 cm. Posez les parpaings en commençant par les angles. Vérifiez l\'horizontalité à chaque bloc avec le niveau.', tip: 'Le premier rang doit être rigoureusement horizontal. Une erreur ici se répercutera sur tout le mur.' },
      { num: 4, icons: '⬆️🧱🔄', title: 'Monter les rangs supérieurs', desc: 'Les joints verticaux doivent être décalés d\'une demi-longueur de bloc (technique du quinconce). Étalez le mortier sur le rang précédent et sur les faces verticales des blocs. L\'épaisseur de joint doit être de 1 à 1,5 cm.', tip: 'Vérifiez l\'aplomb (verticalité) régulièrement avec le fil à plomb ou le niveau.' },
      { num: 5, icons: '📏✅', title: 'Contrôler l\'aplomb et le niveau', desc: 'Tous les 3 rangs, vérifiez l\'aplomb (verticalité) et le niveau (horizontalité). Corrigez immédiatement : le mortier est encore frais pendant 30–45 minutes.', warning: 'Un mur non aplombé est dangereux. Au-delà de 3 mm de dévers par mètre, c\'est à reprendre.' },
      { num: 6, icons: '🌊🧹', title: 'Finitions et nettoyage des joints', desc: 'Avant que le mortier soit complètement sec (environ 30 min après pose), ragréez les joints avec la truelle. Nettoyez les excès de mortier sur les parpaings avec une éponge humide.', tip: 'Pour un aspect propre, creusez légèrement les joints (jointoiement en creux) avec une tige métallique arrondie.' },
      { num: 7, icons: '🌡️⏳', title: 'Cure et séchage', desc: 'Protégez le mur du soleil direct et du vent pendant 24h. En climat chaud (>30°C), humidifiez légèrement le mur 2 fois par jour pendant 3 jours pour éviter les fissures de retrait.', warning: 'Ne construisez pas par temps de pluie battante ou temperature < 5°C. Le gel détruit le mortier frais.' },
    ],
  },
  {
    id: 'tuto-dalle',
    calcId: 'dalle-beton',
    title: 'Couler une dalle béton',
    subtitle: 'De la préparation au décoffrage',
    emoji: '🏗️',
    difficulty: 'Intermédiaire',
    duree: '1 journée + 28 jours de séchage',
    coverArt: '🏗️🪣🧱\n⛏️📐🔩\n👷‍♀️🌊✅',
    bgFrom: 'from-slate-700',
    bgTo: 'to-slate-500',
    materiel: ['Ciment CPJ 32.5', 'Sable 0/5', 'Gravier 0/20', 'Treillis soudé', 'Coffrage bois', 'Règle de tirage', 'Lisseuse ou platoir', 'Bétonnière', 'Brouettes', 'Cales plastiques (3–4 cm)'],
    epi: ['🥽 Lunettes', '🧤 Gants', '👟 Bottes de chantier', '💪 Protège-genoux pour finitions'],
    steps: [
      { num: 1, icons: '⛏️🏜️', title: 'Préparer le sol (terrassement)', desc: 'Décaissez sur la profondeur totale souhaitée (dalle + forme). Compactez le fond avec un dame ou plaque vibrante. Le sol doit être stable, sans matières organiques.', tip: 'Pour une dalle extérieure, prévoyez une pente de 1–2% pour l\'écoulement des eaux.' },
      { num: 2, icons: '🪨📦', title: 'Poser la forme granulaire', desc: 'Étalez une couche de grave 0/20 ou de cailloux propres sur 10–15 cm. Compactez en passes de 10 cm. Cette couche assure le drainage et réduit les remontées d\'humidité.', warning: 'Ne jamais couler du béton directement sur de la terre végétale.' },
      { num: 3, icons: '🪵📐', title: 'Installer le coffrage', desc: 'Montez des planches de coffrage clouées sur des piquets ou des étais. Vérifiez l\'horizontalité et les dimensions. Huilez légèrement les planches pour faciliter le décoffrage.', tip: 'Prévoyez des joints de dilatation tous les 4–5 m pour les grandes surfaces.' },
      { num: 4, icons: '🔩🦿', title: 'Placer le treillis soudé', desc: 'Posez les panneaux de treillis sur des cales plastiques (3–4 cm de dessous). Les panneaux se chevauchent d\'au moins 2 mailles. Le treillis doit être dans le tiers inférieur de la dalle.', warning: 'Ne jamais poser le treillis à plat sur le sol. Il doit être surélevé pour être noyé dans le béton.' },
      { num: 5, icons: '🪣🌊', title: 'Couler le béton', desc: 'Dosage standard : 1 ciment / 2 sable / 3 gravier (350 kg ciment/m³). Remplissez par parties en damant avec une barre ou vibreur pour chasser les bulles d\'air. Étalez avec une règle de tirage.', tip: 'Par temps chaud, coulez tôt le matin. Le béton prend en 30–60 min par 30°C.' },
      { num: 6, icons: '📏✨', title: 'Tirer et lisser la surface', desc: 'Tirez le béton avec la règle en va-et-vient horizontal. Une fois semi-pris (environ 2h), lissez avec un platoir ou une lisseuse pour obtenir une surface plane.', tip: 'Pour un sol poli, lisser plusieurs fois à intervalles réguliers de 30 min.' },
      { num: 7, icons: '💧⏳', title: 'Cure humide pendant 7 jours', desc: 'Recouvrez d\'une bâche plastique ou arrosez légèrement 2x/jour pendant 7 jours. Résistance complète à 28 jours. Mettez en charge (meubles lourds) après 7 jours minimum.', warning: 'Ne jamais marcher sur une dalle avant 24h. Ne pas mettre en charge complète avant 7 jours.' },
    ],
  },
  {
    id: 'tuto-fondations',
    calcId: 'fondations',
    title: 'Réaliser une semelle filante',
    subtitle: 'Fondation de mur ou extension',
    emoji: '⚓',
    difficulty: 'Expert',
    duree: '2–3 jours (fouille + coffrage + coulage)',
    coverArt: '⚓🏗️📐\n⛏️🔩🪣\n👷‍♂️📏🌱',
    bgFrom: 'from-yellow-800',
    bgTo: 'to-yellow-600',
    materiel: ['Ciment CPJ 32.5 ou 42.5', 'Sable 0/5', 'Gravier 0/20', 'Aciers HA12 ou HA14', 'Fil de ligature', 'Coffrages bois', 'Étriers HA8', 'Béton de propreté', 'Règle de maçon'],
    epi: ['👷 Casque obligatoire', '🥽 Lunettes', '🧤 Gants', '👟 Bottes de sécurité', '🦺 Gilet fluo'],
    steps: [
      { num: 1, icons: '📐⛏️', title: 'Implantation et traçage', desc: 'Implantez les axes du mur au cordeau. Vérifiez les angles à 90° avec le théorème de Pythagore (3-4-5). Matérialisez les limites de fouille au spray ou à la chaux.', tip: 'Avant tout terrassement, contactez les services de détection de réseaux (gaz, eau, électricité). C\'est obligatoire.' },
      { num: 2, icons: '⛏️🏜️', title: 'Fouille et terrassement', desc: 'Creusez à la profondeur hors-gel locale (60–80 cm en DOM-TOM tropical, variable selon le sol). Largeur minimum = largeur du mur + 10 cm de chaque côté. Fond de fouille bien nivelé.', warning: 'En terrain en pente, réalisez des fouilles en gradins. Ne jamais laisser une fouille ouverte sans sécurisation.' },
      { num: 3, icons: '🪨🌊', title: 'Béton de propreté', desc: 'Coulez 5–10 cm de béton maigre (dosé à 150 kg/m³) sur le fond de fouille. Laissez sécher 24h. Ce béton évite la contamination du béton d\'armature par la terre.', tip: 'Ne jamais armer directement sur la terre.' },
      { num: 4, icons: '🔩🦿', title: 'Ferraillage de la semelle', desc: 'Posez les barres longitudinales HA12 sur des cales de 3–4 cm. Liez avec les étriers HA8 espacés de 25–30 cm. Minimum 3 barres longitudinales. Couvrez les fers à 4 cm minimum.', warning: 'Le ferraillage doit être validé par un BE structure pour les fondations portantes d\'un bâtiment habitable.' },
      { num: 5, icons: '🪵📐', title: 'Coffrage si sol instable', desc: 'Si les parois de fouille s\'éboulent, installez des coffrages bois. Sinon, le sol stable peut servir de coffrage naturel (coffrage perdu).', tip: 'En terrain stable et cohérent, pas besoin de coffrage. Gagnez du temps et de l\'argent.' },
      { num: 6, icons: '🪣🏗️', title: 'Coulage du béton armé', desc: 'Béton dosé à 350 kg/m³ (C25/30). Coulez en une seule fois si possible. Vibrez soigneusement pour éliminer les vides. La surface doit être plane ± 5 mm/2 m.', warning: 'Ne jamais interrompre le coulage. Si vous manquez de béton, reprenez immédiatement avant la prise.' },
      { num: 7, icons: '🌊⏳', title: 'Décoffrage et cure', desc: 'Décoffrez après 3–5 jours. Cure humide 7 jours. Attendez 28 jours pour charger la fondation. Remblayez latéralement prudemment, par couches compactées.', tip: 'Notez les positions des attentes de ferraillage (barres dépassant la fondation) pour l\'ancrage du mur.' },
    ],
  },
  {
    id: 'tuto-carrelage',
    calcId: 'carrelage',
    title: 'Poser du carrelage sol',
    subtitle: 'Préparation, collage et jointoiement',
    emoji: '🟫',
    difficulty: 'Intermédiaire',
    duree: '4–8 h pour 20 m²',
    coverArt: '🟫🟫🟫\n🪣📐✂️\n🧹✨🏠',
    bgFrom: 'from-amber-700',
    bgTo: 'to-amber-500',
    materiel: ['Carrelage', 'Colle à carrelage C1 (25 kg)', 'Jointement sac 5 kg', 'Croisillons 3 mm', 'Spatule crantée', 'Carrelette ou meuleuse', 'Niveau laser', 'Rouleau de bâche', 'Seau + éponge'],
    epi: ['💪 Protège-genoux', '🥽 Lunettes (découpe)', '🧤 Gants', '🎭 Masque poussière (découpe)'],
    steps: [
      { num: 1, icons: '📐🔍', title: 'Vérifier et préparer le support', desc: 'Le support doit être plan (± 3 mm/2 m), sec, propre et résistant. Combler les trous avec du mortier de ragréage. Poncez les aspérités. Appliquez un primaire d\'accrochage si nécessaire.', warning: 'Ne jamais coller sur un support humide, friable, ou sur de l\'ancienne peinture non fixée.' },
      { num: 2, icons: '📐🎯', title: 'Tracer le plan de pose', desc: 'Trouvez le centre de la pièce en traçant les diagonales. Simulez la pose à sec pour équilibrer les coupes sur les 4 bords. Commencez toujours par le fond de la pièce et avancez vers la porte.', tip: 'Des carreaux coupés de moins de 5 cm sont inesthétiques. Décalez le départ si nécessaire.' },
      { num: 3, icons: '🪣📏', title: 'Préparer et étaler la colle', desc: 'Mélangez la colle (rapport eau/poudre sur l\'emballage). Étalez avec la spatule crantée à 45° en lignes parallèles. Couvrez 1 m² à la fois. Passez la spatule lisse sur le carrelage également (double encollage pour grand format).', tip: 'Attention au "sens de peignage" : toujours dans la même direction pour éviter les poches d\'air.' },
      { num: 4, icons: '🟫📐✅', title: 'Poser les carreaux', desc: 'Posez en tournant légèrement, appuyez ferme. Insérez les croisillons (3 mm standard). Vérifiez le niveau à chaque rang. Tapotez avec un maillet et une cale pour ajuster.', warning: 'Vérifiez la planéité en permanence. Une fois la colle prise, une correction est impossible sans tout casser.' },
      { num: 5, icons: '✂️🔧', title: 'Découper les carreaux de rive', desc: 'Utilisez une carrelette à roulette pour les coupes droites. Pour les formes complexes (contournement de tuyau), utilisez une meuleuse avec disque diamant ou une pince coupante.', warning: 'Portez IMPÉRATIVEMENT lunettes et masque lors des découpes. La poussière de carrelage est nocive.' },
      { num: 6, icons: '⏳🌊', title: 'Séchage et jointoiement', desc: 'Laissez sécher 24h à 48h avant de marcher dessus. Enlevez les croisillons. Préparez le joint (consistance ferme). Appliquez en diagonale avec la raclette caoutchouc. Nettoyez immédiatement avec éponge humide.', tip: 'Le joint sec en surface mais pas nettoyé = traces blanches difficiles à enlever. Nettoyez en passant.' },
      { num: 7, icons: '✨🏠', title: 'Protection et entretien', desc: 'Les carreaux poreux (pierre naturelle, grès) nécessitent un hydrofuge. Attendez 7 jours avant la mise en service complète (douche, cuisine).', tip: 'Pour les salles de bain, utilisez un joint souple (mastic silicone) dans les angles mur/sol.' },
    ],
  },
  {
    id: 'tuto-peinture',
    calcId: 'peinture',
    title: 'Peindre un mur intérieur',
    subtitle: 'Préparation, impression, peinture finition',
    emoji: '🎨',
    difficulty: 'Débutant',
    duree: '2–4 h par pièce (hors séchage)',
    coverArt: '🎨🖌️🪣\n🧹📝✅\n🛋️✨🏠',
    bgFrom: 'from-sky-700',
    bgTo: 'to-sky-500',
    materiel: ['Peinture intérieure', 'Peinture impression (si mur poreux)', 'Rouleau 22 cm (poil 10 mm)', 'Pinceau queue de morue', 'Bâche de protection', 'Ruban de masquage', 'Enduit de rebouchage', 'Toile abrasive (grain 120)', 'Seau + grille d\'essorage'],
    epi: ['🎭 Masque si ancienne peinture (plomb possible)', '🥽 Lunettes lors du ponçage', '🧤 Gants'],
    steps: [
      { num: 1, icons: '🧹🔍', title: 'Préparer la pièce', desc: 'Videz la pièce ou repoussez les meubles au centre. Couvrez le sol et les meubles avec des bâches. Masquez les plinthes, vitres, interrupteurs et prises avec du ruban de masquage.', tip: 'Investissez dans du bon ruban de masquage (3M ou Tesa). Il se retire proprement sans arracher la peinture.' },
      { num: 2, icons: '🔨🧱', title: 'Préparer les surfaces', desc: 'Rebouchez les trous et fissures avec de l\'enduit de rebouchage. Attendez le séchage (1–2h), poncez avec grain 120. Dépoussiérez avec un chiffon humide. Les murs doivent être propres, secs et dépoussiérés.', warning: 'Ne jamais peindre sur une fissure non traitée. Elle réapparaîtra dans les 6 mois.' },
      { num: 3, icons: '🟫🪣', title: 'Appliquer l\'impression', desc: 'Sur un mur neuf, poreux ou coloré foncé : appliquez une couche de sous-couche/impression. Diluez à 10% pour une pénétration maximale. Séchage 2–4h. L\'impression fixe la surface et améliore l\'adhérence.', tip: 'Sur un mur blanc propre récemment repeint, l\'impression n\'est pas nécessaire.' },
      { num: 4, icons: '🖌️📐', title: 'Peindre les angles et bords (pinceau)', desc: 'Commencez par les angles, bords de plafond, plinthes et contours des ouvertures avec un pinceau. Travaillez en bandes de 5–8 cm. Cette étape s\'appelle "couper au pinceau".', tip: 'Travaillez vite au pinceau : la peinture séchant, un raccord avec le rouleau sur peinture sèche laisse une trace.' },
      { num: 5, icons: '🪣🔄', title: 'Peindre au rouleau (1ère couche)', desc: 'Chargez le rouleau uniformément (sans excès). Appliquez en "W" ou en "M" sur 50×50 cm, puis croisez sans appuyer pour égaliser. Travaillez du haut vers le bas. Première couche diluée à 5–10%.', tip: 'Ne surchargez pas le rouleau : les projections tachent et créent des coulures.' },
      { num: 6, icons: '⏳🌬️', title: 'Séchage inter-couche', desc: 'Attendez le séchage "toucher" (1–2h selon la marque et le climat) avant la 2ème couche. En Guadeloupe/Martinique (humidité élevée), allongez à 3–4h. Aérez la pièce.', warning: 'Dans les DOM-TOM, l\'humidité tropicale allonge les temps de séchage de 50%. Prévoyez en conséquence.' },
      { num: 7, icons: '✨🏠', title: '2ème couche et finitions', desc: 'Appliquez la 2ème couche non diluée dans le sens inverse de la 1ère. Retirez le ruban de masquage quand la peinture est encore légèrement humide (non sèche). Finitions des angles à la touche finale.', tip: 'Pour un blanc parfait sur un fond coloré foncé, 3 couches peuvent être nécessaires.' },
    ],
  },
  {
    id: 'tuto-enduit',
    calcId: 'enduit',
    title: 'Réaliser un enduit façade',
    subtitle: 'Crépissage et finition extérieure',
    emoji: '🪣',
    difficulty: 'Intermédiaire',
    duree: '1 journée pour 20 m²',
    coverArt: '🏠🪣🧱\n⚒️📐🌧️\n👷‍♀️✨🎨',
    bgFrom: 'from-orange-700',
    bgTo: 'to-orange-500',
    materiel: ['Enduit façade (sac 25 kg)', 'Ciment CPJ 32.5', 'Sable fin 0/2', 'Taloche', 'Règle de 2 m', 'Filet de renfort (façade neuve)', 'Primaire d\'accrochage', 'Bétonnière ou perceuse-malaxeur'],
    epi: ['🥽 Lunettes (projections)', '🧤 Gants résistants', '👷 Casque si hauteur', '🦺 Harnais si échafaudage > 3 m'],
    steps: [
      { num: 1, icons: '🔍🧹', title: 'Préparer le support', desc: 'Dépoussiérez et brossez la façade. Humidifiez légèrement (support absorbant). Traitez les fissures et les joints creux. Dépoussiérez les fenêtres et portes avec le ruban de masquage.', warning: 'Ne jamais enduire par temps de pluie, vent fort, gel ou chaleur extrême (>35°C).' },
      { num: 2, icons: '🟡🔥', title: 'Appliquer le primaire gobetis', desc: 'Première couche très fine (5 mm) projetée ou talochée grossièrement. Cette couche "accroche" la façade. Laissez sécher 24h avant la couche de corps.', tip: 'Pour les façades très lisses (béton banché), appliquez un primaire d\'accrochage avant le gobetis.' },
      { num: 3, icons: '📏🏠', title: 'Pose des repères (phares)', desc: 'Utilisez des règles aluminium ou des butées en enduit dur pour créer des repères de planéité. Vérifiez à la règle de 2 m. Espacés de 1,5 m maximum.', tip: 'Des repères bien posés garantissent un résultat plan. Ne sautez pas cette étape.' },
      { num: 4, icons: '🪣⚒️', title: 'Corps d\'enduit (couche principale)', desc: 'Épaisseur 1–1,5 cm. Appliquez de bas en haut avec la taloche. Serrez contre les phares. Tirez la règle en mouvement de sciage horizontal. L\'enduit doit combler tous les creux.', warning: 'N\'appliquez jamais plus de 15 mm en une seule passe. Deux passes fines valent mieux qu\'une épaisse.' },
      { num: 5, icons: '🕸️🔩', title: 'Filet de renfort (façade neuve)', desc: 'Sur les façades neuves ou les jonctions de matériaux différents, intégrez un filet de renfort dans la couche fraîche. Noyez-le dans l\'enduit et ragréez.', tip: 'Le filet de renfort évite les fissures de retrait aux angles de fenêtres et jonctions maçonnerie/béton.' },
      { num: 6, icons: '✨🔄', title: 'Finition taloché ou grattée', desc: 'Après prise partielle (1–2h selon la chaleur), lissez avec la taloche humide en mouvements circulaires (finition taloché lisse) ou avec la taloche garnie de mousse (taloché fin). Pour un effet grené : gratter avec une brosse métallique.', tip: 'L\'humidité tropicale de la Guadeloupe et Martinique accélère la prise. Travaillez tôt le matin.' },
      { num: 7, icons: '💧☀️', title: 'Protection et cure', desc: 'Protégez du soleil direct 48h (bâche non adhérente). Humidifiez légèrement le lendemain matin. Attendez 7 jours avant de peindre. Le séchage complet prend 28 jours.', tip: 'Vous pouvez appliquer une peinture hydrofuge ou anti-moisissure pour protéger la façade en milieu tropical humide.' },
    ],
  },
  {
    id: 'tuto-toles',
    calcId: 'toles',
    title: 'Poser des tôles ondulées',
    subtitle: 'Couverture légère maison ou appentis',
    emoji: '🏠',
    difficulty: 'Intermédiaire',
    duree: '1–2 jours pour 50 m²',
    coverArt: '🏠⛅🌴\n🔩🪜🛠️\n👷‍♂️🏗️✅',
    bgFrom: 'from-zinc-700',
    bgTo: 'to-zinc-500',
    materiel: ['Tôles ondulées acier galvanisé', 'Vis auto-perceuses 5,5×38 avec rondelle EPDM', 'Faîtières', 'Closoir (mousse ondulée)', 'Liteaux 40×60 mm', 'Bande de butée d\'égout', 'Perceuse-visseuse', 'Cisaille à tôle', 'Corde de sécurité'],
    epi: ['👷 Casque OBLIGATOIRE en hauteur', '🦺 Harnais de sécurité si pente > 30°', '🧤 Gants anti-coupure (bords de tôles = danger)', '👟 Chaussures antidérapantes', '🥽 Lunettes'],
    steps: [
      { num: 1, icons: '📐🪵', title: 'Préparer la charpente et les liteaux', desc: 'Vérifiez l\'état de la charpente. Posez les liteaux (40×60 mm) perpendiculairement aux chevrons, espacés selon la longueur des tôles : pour tôle 3m → liteux tous les 85 cm. Les liteaux doivent être sains et bien fixés.', warning: 'Ne montez jamais sur une charpente sans avoir vérifié sa solidité. Minimum 2 fixations par croisement.' },
      { num: 2, icons: '🔢📏', title: 'Calculer le recouvrement', desc: 'Recouvrement latéral : 1,5 à 2 ondulations (selon l\'exposition au vent). Recouvrement longitudinal : 20 cm minimum (30 cm si pente < 15°). Commencez par le bas et le côté opposé au vent dominant.', tip: 'En DOM-TOM avec vents cycloniques, privilégiez un recouvrement de 2 ondulations et vissez tous les liteaux.' },
      { num: 3, icons: '📏🔩', title: 'Poser la première tôle (bas-côté)', desc: 'Commencez par le bas (égout). Placez la tôle en alignant son bord inférieur avec la rive d\'égout. Vissez provisoirement pour ajuster. La première tôle donne le fil directeur de tout le rang.', warning: 'La première tôle mal posée faussera tout. Prenez le temps de la caler et vérifier perpendiculaire.' },
      { num: 4, icons: '🔩✅', title: 'Fixer les tôles (vissage)', desc: 'Vis toutes les 2 ondulations sur chaque liteau (4 vis min par tôle par liteau). Vissez DANS le creux des ondulations (pas sur la crête). Serrez sans écraser la rondelle EPDM (1 mm d\'écrasement max).', warning: 'Trop serrer les vis : la rondelle EPDM écrasée ne sera plus étanche. Trop peu : infiltrations garanties.' },
      { num: 5, icons: '🏠🔁', title: 'Progresser rang par rang', desc: 'Remontez vers le faîtage. Chaque rang recouvre le précédent d\'au moins 20 cm. Posez les tôles de recouvrement côté vent dominant par-dessus.', tip: 'Avant de monter avec une tôle, prépercez les trous de vis sur le sol. Plus sécurisé en hauteur.' },
      { num: 6, icons: '🏔️🔩', title: 'Poser la faîtière', desc: 'Posez le closoir (mousse) contre les ondulations avant la faîtière. La faîtière chevauche au moins 20 cm de chaque côté du faîte. Vissez tous les 30 cm. La faîtière est étanche au vent.', tip: 'Le closoir (mousse) est essentiel pour éviter les entrées d\'insectes et de poussière sous la faîtière.' },
      { num: 7, icons: '🌧️✅', title: 'Contrôle d\'étanchéité', desc: 'Testez avec un tuyau d\'arrosage simulant la pluie. Vérifiez l\'absence de fuites aux raccords, vis, faîtière et rives. En cas de doute sur une vis, ajoutez une rondelle EPDM supplémentaire.', warning: 'En zone cyclonique (DOM-TOM), faites valider l\'installation par un professionnel. Des normes de résistance aux vents s\'appliquent.' },
    ],
  },
  {
    id: 'tuto-cloture',
    calcId: 'cloture',
    title: 'Poser une clôture grillage',
    subtitle: 'Poteaux, grillage et portail',
    emoji: '🚧',
    difficulty: 'Débutant',
    duree: '1 journée pour 30 ml',
    coverArt: '🚧🌳🏡\n⛏️🔩🪣\n👷‍♀️📐✅',
    bgFrom: 'from-green-800',
    bgTo: 'to-green-600',
    materiel: ['Poteaux acier galvanisé (Ø 60 mm)', 'Grillage soudé galvanisé', 'Béton de scellement', 'Fil de ligature', 'Tendeur/câble de tension', 'Masse de terrassement', 'Foreuse ou tarière', 'Fil à plomb', 'Niveau'],
    epi: ['🧤 Gants anti-coupure', '🥽 Lunettes', '👟 Chaussures de sécurité'],
    steps: [
      { num: 1, icons: '📐🧵', title: 'Tracer et marquer les poteaux', desc: 'Tendez un cordeau pour aligner les poteaux. Marquez les emplacements au sol à l\'espacement choisi (2–2,5 m). Commencez par les angles et points extrêmes.', tip: 'L\'espacement standard de 2,5 m est un bon compromis solidité/économie. Réduisez à 2 m en terrain en pente.' },
      { num: 2, icons: '⛏️🕳️', title: 'Forer les trous de scellement', desc: 'Profondeur minimum : 1/3 de la hauteur du poteau (ex: 50 cm de profondeur pour poteau 1,5 m). Diamètre : 2× le diamètre du poteau. Utilisez une tarière manuelle ou motorisée.', warning: 'En sol rocheux ou très dur, louez une tarière thermique. Ne risquez pas une blessure au dos.' },
      { num: 3, icons: '📏✅', title: 'Sceller et aligner les poteaux', desc: 'Versez 5 cm de béton dans le trou. Introduisez le poteau. Vérifiez l\'aplomb à 90° avec le niveau et le fil à plomb dans 2 directions. Coulez le béton de scellement autour. Maintenez en place 48h.', tip: 'Formez une légère calotte en dôme au sommet du béton pour évacuer l\'eau de pluie autour du poteau.' },
      { num: 4, icons: '🕸️📏', title: 'Fixer le grillage', desc: 'Déroulez le grillage en maintenant la tension. Agrafez ou ligaturez au premier poteau. Tendez manuellement en progressant et ligaturez tous les 30 cm. Utilisez un tendeur sur le fil terminal.', tip: 'Travaillez à 2 : l\'un tient le grillage tendu, l\'autre fixe. Seul, la tâche est presque impossible.' },
      { num: 5, icons: '✂️🔧', title: 'Couper et ajuster', desc: 'Coupez le grillage avec une pince coupante ou cisaille. Pour les angles, faisez un coude progressif et fixez des deux côtés de l\'angle.', warning: 'Les bords de grillage coupé sont tranchants. Ne jamais toucher sans gants. Retourner les fils coupés vers l\'intérieur.' },
      { num: 6, icons: '🚪🔩', title: 'Installer le portail (si prévu)', desc: 'Scellement des poteaux de portail à 70 cm de profondeur minimum. Respectez le jeu de 5 mm entre la porte et le poteau. Réglez les gonds pour une ouverture sans forcer.', tip: 'Un portail bien réglé au départ vous évitera des années de bricolage. Prenez le temps d\'ajuster.' },
      { num: 7, icons: '🌿✅', title: 'Finitions et végétalisation', desc: 'Plantez une haie végétale (laurier, bougainvillier, hibiscus) en bas de clôture pour un aspect naturel. Vérifiez chaque poteau à 6 mois pour resserrer si nécessaire.', tip: 'Dans les zones tropicales, préférez des poteaux en acier galvanisé à chaud plutôt que simple galvanisé pour une durabilité accrue face à l\'humidité.' },
    ],
  },
  {
    id: 'tuto-chape',
    calcId: 'chape',
    title: 'Réaliser une chape de sol',
    subtitle: 'Mortier de chape pour parquet ou carrelage',
    emoji: '🪵',
    difficulty: 'Intermédiaire',
    duree: '1 journée pour 40 m² + 7 jours séchage',
    coverArt: '🪵📐🏠\n🪣⚒️📏\n👷‍♀️✨🏠',
    bgFrom: 'from-amber-800',
    bgTo: 'to-yellow-600',
    materiel: ['Ciment CPJ 32.5', 'Sable de chape 0/5', 'Eau', 'Bétonnière ou malaxeur', 'Règle de tirage (alu 3 m)', 'Phares métalliques ou bois', 'Lisseuse', 'Bande acoustique (mur/sol)', 'Film polyane'],
    epi: ['💪 Protège-genoux', '🧤 Gants', '🥽 Lunettes', '👟 Bottes de chantier'],
    steps: [
      { num: 1, icons: '🔍📐', title: 'Préparer le support', desc: 'Nettoyez le support (dalle béton ou plancher). Aspirez ou brossez toute poussière. Le support doit être plan ± 5 mm/2 m. Humidifiez légèrement (dalle trop sèche = décollement).', warning: 'Toute fissure dans le support doit être traitée avant la chape. Sinon, les fissures remontent dans la chape.' },
      { num: 2, icons: '🎵🧱', title: 'Poser la bande acoustique', desc: 'Fixez la bande résiliente tout autour du pourtour de la pièce (10 cm de hauteur). Elle isole du bruit et absorbe la dilatation thermique de la chape.', tip: 'La bande acoustique est OBLIGATOIRE pour les chapes flottantes (sur isolant) et recommandée pour toutes les chapes.' },
      { num: 3, icons: '📏🎯', title: 'Réglage des phares (niveaux)', desc: 'Utilisez un niveau laser ou un niveau à eau pour poser des phares en bois ou profilé alu à l\'épaisseur souhaitée (4–6 cm). Espacés de 1,5 m max. Ces repères guident le tirage de la règle.', tip: 'Prenez le temps de bien régler les phares. Une chape plane à ± 2 mm/2 m est un gage de qualité.' },
      { num: 4, icons: '🪣🔄', title: 'Préparer le mortier de chape', desc: 'Dosage : 300–350 kg de ciment/m³. Rapport C:S = 1:3. Le mortier doit être semi-sec (on peut l\'agglomérer dans la main sans qu\'il coule). Préparez par petites quantités (30–40 kg).', tip: 'Test de la prise en main : serrez une poignée de mortier. Elle doit tenir sa forme sans égoutter. Si ça coule, trop d\'eau.' },
      { num: 5, icons: '⚒️📏', title: 'Couler et tirer la chape', desc: 'Commencez par le fond de la pièce. Étalez le mortier en le tassant légèrement. Tirez la règle de 2 m en mouvement de sciage, en vous appuyant sur les phares. Remplissez les creux, repassez la règle.', warning: 'Progressez toujours depuis le fond vers la sortie. Si vous marchez dans la chape fraîche, vous la déformez.' },
      { num: 6, icons: '✨🔄', title: 'Lisser la surface', desc: '30–60 min après le tirage, quand la chape a pris partiellement, lissez avec la lisseuse en mouvements circulaires. Surface finale lisse pour carrelage, légèrement rugueuse pour parquet flottant.', tip: 'Ne pas lisser trop tôt (eau encore en surface) ni trop tard (trop dur). Testez par pression : ça s\'imprime légèrement = bon moment.' },
      { num: 7, icons: '💧⏳', title: 'Cure et séchage (28 jours)', desc: 'Recouvrez d\'une bâche 48h. Humidifiez légèrement le lendemain. Attendez 7 jours pour circulation piétonne légère. Carrelage possible à 28 jours. Parquet massif : 28 jours + test d\'humidité < 2,5%.', warning: 'En DOM-TOM, l\'humidité tropicale ralentit le séchage. Prévoyez toujours un test d\'humidité avant le revêtement de sol.' },
    ],
  },
  {
    id: 'tuto-escalier',
    calcId: 'escalier',
    title: 'Concevoir et tracer un escalier',
    subtitle: 'Formule de Blondel et normes NF',
    emoji: '🪜',
    difficulty: 'Expert',
    duree: 'Conception : 2–3 h | Construction : 3–5 jours',
    coverArt: '🪜📐🏗️\n📏✏️🔢\n👷‍♂️✅🏠',
    bgFrom: 'from-indigo-800',
    bgTo: 'to-indigo-600',
    materiel: ['Béton C25 ou bois massif', 'Ferraillage HA10 treillis', 'Coffrages bois', 'Équerre de menuisier', 'Règle de 2 m', 'Crayon charpentier', 'Fil à plomb', 'Niveau de précision'],
    epi: ['👷 Casque', '🥽 Lunettes', '🧤 Gants', '👟 Chaussures de sécurité'],
    steps: [
      { num: 1, icons: '📏🔢', title: 'Mesurer la hauteur totale (H)', desc: 'Mesurez la hauteur exacte entre les deux niveaux finis (sol du bas au sol du haut, revêtements inclus). Cette mesure doit être précise au millimètre. C\'est la base de tout le calcul.', warning: 'Intégrez l\'épaisseur des revêtements de sol (carrelage, parquet) aux deux niveaux dans votre mesure.' },
      { num: 2, icons: '🔢✏️', title: 'Déterminer le nombre de marches', desc: 'Divisez H par 17–20 cm (hauteur idéale de marche). Arrondissez pour obtenir un nombre entier n. Recalculez : h = H/n. Exemple : H=270 cm ÷ 15 marches = h=18 cm (conforme NF).', tip: 'Essayez différents nombres de marches pour trouver le meilleur compromis entre h (17–20 cm) et g (24–32 cm).' },
      { num: 3, icons: '📐📏', title: 'Calculer le giron (formule de Blondel)', desc: 'Formule : 2h + g = 63 cm (±1 cm). g = 63 – (2 × h). Exemple : h=18 cm → g = 63 – 36 = 27 cm. Vérifiez : 2×18 + 27 = 63 ✅. Le giron doit être entre 24 et 32 cm (NF P01-013).', tip: 'La formule de Blondel assure un escalier confortable qui respecte la "foulée" humaine naturelle de 63 cm.' },
      { num: 4, icons: '📏🏗️', title: 'Calculer la longueur et l\'angle', desc: 'Longueur horizontale = n × g. Angle = arctan(h/g). Exemple : 15 marches × 27 cm = 405 cm. Angle = arctan(18/27) = 33,7° (idéal : 25–35°). Vérifiez que vous avez la place !', warning: 'Un angle > 45° est un escalier "d\'échelle", dangereux et hors normes. Réduisez le nombre de marches.' },
      { num: 5, icons: '🪵📐', title: 'Tracer le limon sur le coffrage', desc: 'Tracez les marches sur le limon avec l\'équerre. Vérifiez que toutes les contremarches sont identiques (tolérance ± 5 mm max entre deux marches consécutives selon NF). Incision au cutter avant découpe.', warning: 'La moindre irrégularité entre 2 marches provoque des trébuchements. La régularité est une exigence de sécurité.' },
      { num: 6, icons: '🔩🏗️', title: 'Construction et coffrage béton', desc: 'Coffrez le dessous (paillasse). Ferraillez avec un treillis HA10 + barres longitudinales. Coulez le béton C25 par l\'arrière en le vibrochantant. Coffrages des contremarches par planches de 2 cm.', tip: 'Un escalier béton bien fait dure 80 ans. Soignez le ferraillage et le vibrage pour éviter les bulles d\'air.' },
      { num: 7, icons: '⏳✅', title: 'Décoffrage et finitions', desc: 'Décoffrez après 5–7 jours. Rhabillage au mortier si nécessaire. Cure 14 jours. Pose du revêtement de marche (carrelage antidérapant R11 minimum) à 28 jours. Garde-corps obligatoire > 4 marches.', warning: 'Le garde-corps est OBLIGATOIRE dès 4 marches selon NF P01-012. Hauteur min 90 cm, espacements < 11 cm.' },
    ],
  },
];

// ─── Tutorial Components ───────────────────────────────────────────────────────

const DIFFICULTY_COLORS = {
  'Débutant':     { bg: 'bg-green-500/20',  text: 'text-green-300',  border: 'border-green-500/30' },
  'Intermédiaire':{ bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30' },
  'Expert':       { bg: 'bg-red-500/20',    text: 'text-red-300',    border: 'border-red-500/30' },
};

function TutoCard({ tuto, onOpen }: { tuto: Tutorial; onOpen: (id: string) => void }) {
  const diff = DIFFICULTY_COLORS[tuto.difficulty];
  return (
    <button
      onClick={() => onOpen(tuto.id)}
      className="w-full text-left rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 hover:border-orange-500/40 hover:scale-[1.02] transition-all active:scale-[0.99] shadow-lg"
    >
      {/* Cover Art */}
      <div className={`bg-gradient-to-br ${tuto.bgFrom} ${tuto.bgTo} p-4 flex flex-col items-center justify-center min-h-[90px] relative`}>
        <div className="text-3xl leading-tight text-center whitespace-pre font-mono tracking-wide opacity-90">
          {tuto.coverArt}
        </div>
      </div>
      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-bold text-white text-sm leading-tight">{tuto.title}</p>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        </div>
        <p className="text-xs text-slate-400 mb-3 leading-relaxed">{tuto.subtitle}</p>
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${diff.bg} ${diff.text} ${diff.border}`}>
            {tuto.difficulty}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />{tuto.duree}
          </span>
        </div>
      </div>
    </button>
  );
}

function TutoDetail({ tuto, onBack, onCalc }: { tuto: Tutorial; onBack: () => void; onCalc: (id: CalculatorId) => void }) {
  const [openStep, setOpenStep] = useState<number | null>(null);
  const diff = DIFFICULTY_COLORS[tuto.difficulty];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`rounded-2xl overflow-hidden bg-gradient-to-br ${tuto.bgFrom} ${tuto.bgTo}`}>
        <div className="p-4 flex flex-col items-center text-center">
          <p className="text-4xl mb-2 font-mono leading-tight whitespace-pre">{tuto.coverArt}</p>
          <h2 className="text-xl font-black text-white drop-shadow-md">{tuto.title}</h2>
          <p className="text-sm text-white/80 mt-1">{tuto.subtitle}</p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${diff.bg} ${diff.text} ${diff.border} bg-opacity-80 backdrop-blur`}>
              {tuto.difficulty}
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-black/30 text-white/90 flex items-center gap-1">
              <Clock className="w-3 h-3" />{tuto.duree}
            </span>
          </div>
        </div>
      </div>

      {/* Matériel */}
      <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4">
        <h3 className="font-bold text-white flex items-center gap-2 mb-3">
          <Hammer className="w-4 h-4 text-orange-400" /> Matériel & fournitures
        </h3>
        <div className="flex flex-wrap gap-2">
          {tuto.materiel.map((m) => (
            <span key={m} className="text-xs bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-600">{m}</span>
          ))}
        </div>
      </div>

      {/* EPI */}
      <div className="rounded-2xl bg-red-900/20 border border-red-500/30 p-4">
        <h3 className="font-bold text-red-300 flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-red-400" /> Équipements de protection individuelle (EPI)
        </h3>
        <div className="flex flex-wrap gap-2">
          {tuto.epi.map((e) => (
            <span key={e} className="text-xs bg-red-900/30 text-red-200 px-3 py-1.5 rounded-xl border border-red-500/20">{e}</span>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-white">Étapes pas à pas ({tuto.steps.length} étapes)</h3>
        </div>
        <div className="divide-y divide-slate-700/50">
          {tuto.steps.map((step) => (
            <div key={step.num}>
              <button
                onClick={() => setOpenStep(openStep === step.num ? null : step.num)}
                className="w-full p-4 text-left flex items-start gap-3 hover:bg-slate-700/30 transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-sm font-black text-white shrink-0 mt-0.5">
                  {step.num}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{step.icons}</span>
                    <p className="font-semibold text-white text-sm">{step.title}</p>
                  </div>
                </div>
                <span className="text-slate-400 shrink-0">
                  {openStep === step.num ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>
              {openStep === step.num && (
                <div className="px-4 pb-4 ml-11 space-y-2">
                  <p className="text-sm text-slate-300 leading-relaxed">{step.desc}</p>
                  {step.tip && (
                    <div className="flex gap-2 bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-3">
                      <Zap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-indigo-200 leading-relaxed"><span className="font-semibold">Astuce : </span>{step.tip}</p>
                    </div>
                  )}
                  {step.warning && (
                    <div className="flex gap-2 bg-red-900/30 border border-red-500/30 rounded-xl p-3">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-200 leading-relaxed"><span className="font-semibold">Attention : </span>{step.warning}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA → Calculer */}
      <button
        onClick={() => onCalc(tuto.calcId)}
        className="w-full rounded-2xl bg-orange-600 hover:bg-orange-500 py-4 font-bold text-white flex items-center justify-center gap-3 transition-colors text-sm shadow-lg"
      >
        <Calculator className="w-5 h-5" />
        Calculer les matériaux pour ce tuto
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Disclaimer */}
      <p className="text-center text-xs text-slate-500">Tutoriel à titre informatif. Consultez un professionnel pour tous travaux structurels ou réglementés.</p>
    </div>
  );
}

function TutorielsSection({ onGoCalc }: { onGoCalc: (calcId: CalculatorId) => void }) {
  const [openTutoId, setOpenTutoId] = useState<string | null>(null);

  const openTuto = TUTORIALS.find((t) => t.id === openTutoId);

  if (openTuto) {
    return (
      <div className="mt-6 space-y-4">
        <button onClick={() => setOpenTutoId(null)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Retour aux tutoriels
        </button>
        <TutoDetail
          tuto={openTuto}
          onBack={() => setOpenTutoId(null)}
          onCalc={(calcId) => { setOpenTutoId(null); onGoCalc(calcId); }}
        />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-black text-white">Tutoriels illustrés</h2>
        <span className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">{TUTORIALS.length} guides</span>
      </div>
      <p className="text-xs text-slate-400 mb-4">Guides pas à pas, illustrés, avec matériaux et conseils de sécurité.</p>
      <div className="grid grid-cols-2 gap-3">
        {TUTORIALS.map((tuto) => (
          <TutoCard key={tuto.id} tuto={tuto} onOpen={setOpenTutoId} />
        ))}
      </div>
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

// ─── User Suggestion Form ─────────────────────────────────────────────────────

function UserSuggestionForm({ territory, currentCalc }: { territory: TerritoryCode | null; currentCalc: CalculatorId | null }) {
  const [open, setOpen]         = useState(false);
  const [category, setCategory] = useState<SuggestionCategory>('nouveau_calculateur');
  const [message, setMessage]   = useState('');
  const [status, setStatus]     = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // session id (stable per tab)
  const sessionId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `sess-${Date.now()}`;

  const canSubmit = message.trim().length >= 10 && status !== 'sending';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStatus('sending');
    const result = await submitBatimentSuggestion({
      message: message.trim(),
      category,
      calcType: currentCalc ?? null,
      territory: territory ?? null,
      sessionId,
    });
    if (result.success) {
      setStatus('success');
      setMessage('');
      setTimeout(() => { setStatus('idle'); setOpen(false); }, 3000);
    } else {
      setStatus('error');
      setErrorMsg(result.error ?? 'Erreur inconnue');
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-indigo-500/40 bg-indigo-900/10 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-900/20 transition-colors text-left"
      >
        <MessageSquarePlus className="w-5 h-5 text-indigo-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">💡 Proposer une suggestion</p>
          <p className="text-xs text-slate-400 mt-0.5">Nouveau calculateur, matériau, magasin, amélioration…</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-indigo-500/20 pt-3">

          {/* Category selector */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Catégorie de suggestion</p>
            <div className="grid grid-cols-1 gap-1.5">
              {(Object.entries(SUGGESTION_CATEGORY_LABELS) as [SuggestionCategory, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${
                    category === key
                      ? 'bg-indigo-700/40 border-indigo-500/60 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Message textarea */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Votre suggestion <span className="text-slate-500">({message.trim().length}/500 caractères, min 10)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              rows={4}
              placeholder={
                category === 'nouveau_calculateur'
                  ? 'Ex : Calculateur de toiture en bardeau, ou calculateur pour piscine…'
                  : category === 'materiau'
                  ? 'Ex : Ajouter le parpaing 25×20×50 avec prix chez Point P Martinique…'
                  : category === 'magasin'
                  ? 'Ex : Ajouter Brico Maho à Guadeloupe, tél. 0590 XX XX XX…'
                  : 'Décrivez votre suggestion en détail (minimum 10 caractères)…'
              }
              className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Context info (readonly) */}
          {(territory || currentCalc) && (
            <div className="rounded-xl bg-slate-800/60 border border-slate-700 px-3 py-2 text-xs text-slate-400 flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>
                Contexte envoyé automatiquement :
                {territory && <span className="text-slate-300 ml-1">territoire {territory}</span>}
                {currentCalc && <span className="text-slate-300 ml-1">· calculateur {currentCalc}</span>}
              </span>
            </div>
          )}

          {/* Status messages */}
          {status === 'success' && (
            <div className="rounded-xl bg-green-900/30 border border-green-500/40 px-3 py-2 text-sm text-green-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Merci ! Votre suggestion a été envoyée. L'équipe l'examinera prochainement.
            </div>
          )}
          {status === 'error' && (
            <div className="rounded-xl bg-red-900/30 border border-red-500/40 px-3 py-2 text-sm text-red-300 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              Erreur : {errorMsg}
            </div>
          )}

          {/* Submit button */}
          {status !== 'success' && (
            <button
              onClick={() => void handleSubmit()}
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed py-3 font-semibold text-white text-sm transition-colors"
            >
              <Send className="w-4 h-4" />
              {status === 'sending' ? 'Envoi en cours…' : 'Envoyer ma suggestion'}
            </button>
          )}

          <p className="text-xs text-center text-slate-600">
            Vos suggestions nous aident à améliorer l'outil. Merci de votre participation !
          </p>
        </div>
      )}
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
  const [showTutos, setShowTutos]           = useState(false);

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

  const handleSave = useCallback((data: BatimentSaveData): void => {
    const state = getBatimentTrialState();
    void saveBatimentCalculation({
      ...data,
      territory: territory ?? null,
      trialDay: state.trialDay ?? null,
    });
  }, [territory]);

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
              <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/calculateur-batiment" />
        <link rel="alternate" hrefLang="fr" href="https://teetee971.github.io/akiprisaye-web/calculateur-batiment" />
        <link rel="alternate" hrefLang="x-default" href="https://teetee971.github.io/akiprisaye-web/calculateur-batiment" />
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
              <Link to="/pricing" className="text-xs text-indigo-400 underline hover:text-indigo-300">S'abonner pour continuer →</Link>
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
              <UserSuggestionForm territory={territory} currentCalc={selectedCalc} />

              {/* ── Tutoriels toggle button ── */}
              <button
                onClick={() => setShowTutos((v) => !v)}
                className="w-full mt-2 rounded-2xl border border-indigo-500/40 bg-indigo-900/20 hover:bg-indigo-900/40 p-4 flex items-center gap-3 transition-all"
              >
                <BookOpen className="w-6 h-6 text-indigo-400 shrink-0" />
                <div className="flex-1 text-left">
                  <p className="font-bold text-white text-sm">📚 Tutoriels illustrés</p>
                  <p className="text-xs text-slate-400 mt-0.5">{TUTORIALS.length} guides pas à pas — matériaux, EPI, astuces</p>
                </div>
                {showTutos ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
              </button>

              {/* ── Tutoriels section ── */}
              {showTutos && (
                <TutorielsSection
                  onGoCalc={(calcId) => {
                    // Find which category contains this calcId
                    const cat = CATEGORIES.find((c) => c.calcs.includes(calcId));
                    if (cat) { setSelectedCategory(cat.id); setSelectedCalc(calcId); }
                    setShowTutos(false);
                  }}
                />
              )}
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
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white">{meta.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{meta.description}</p>
                    </div>
                    {TUTORIALS.some((t) => t.calcId === calcId) && (
                      <span className="shrink-0 text-xs bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />tuto
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Level 2 : Active Calculator ── */}
          {selectedCalc && (
            <>
              <div className="bg-slate-900 rounded-2xl border border-slate-700 p-4">
                {selectedCalc === 'parpaing'        && <ParpaingCalc      onCalc={handleCalc} territory={territory} onSave={handleSave} />}
                {selectedCalc === 'dalle-beton'     && <DalleBetonCalc    onCalc={handleCalc} territory={territory} onSave={handleSave} />}
                {selectedCalc === 'fondations'      && <FondationsCalc    onCalc={handleCalc} territory={territory} onSave={handleSave} />}
                {selectedCalc === 'chape'           && <ChapeCalc         onCalc={handleCalc} territory={territory} onSave={handleSave} />}
                {selectedCalc === 'carrelage'       && <CarrelageCalc     onCalc={handleCalc} territory={territory} onSave={handleSave} />}
                {selectedCalc === 'peinture'        && <PeintureCalc      onCalc={handleCalc} territory={territory} onSave={handleSave} />}
                {selectedCalc === 'enduit'          && <EnduitCalc        onCalc={handleCalc} territory={territory} onSave={handleSave} />}
                {selectedCalc === 'toles'           && <TolesCalc         onCalc={handleCalc} territory={territory} onSave={handleSave} />}
                {selectedCalc === 'terrassement'    && <TerrassementCalc  onCalc={handleCalc} territory={territory} onSave={handleSave} />}
                {selectedCalc === 'cloture'         && <ClotureCalc       onCalc={handleCalc} territory={territory} onSave={handleSave} />}
                {selectedCalc === 'beton-courant'   && <BetonCourantCalc  onCalc={handleCalc} territory={territory} onSave={handleSave} />}
                {selectedCalc === 'escalier'        && <EscalierCalc      onCalc={handleCalc} territory={territory} onSave={handleSave} />}
              </div>
              {/* Disclaimer */}
              <p className="mt-3 text-center text-xs text-slate-600 bg-orange-900/15 border border-orange-900/30 rounded-xl px-4 py-2">
                Tous les calculs sont à titre indicatif
              </p>
              {/* Tuto shortcut for current calc */}
              {selectedCalc && TUTORIALS.find((t) => t.calcId === selectedCalc) && (
                <button
                  onClick={() => { setSelectedCalc(null); setSelectedCategory(null); setShowTutos(true); }}
                  className="mt-2 w-full rounded-xl border border-indigo-500/30 bg-indigo-900/10 hover:bg-indigo-900/20 px-4 py-3 flex items-center gap-2 text-sm text-indigo-300 transition-colors"
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  Voir le tutoriel illustré pour {CALC_META[selectedCalc].label}
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              )}
              {/* User suggestion form (contextual to current calculator) */}
              <UserSuggestionForm territory={territory} currentCalc={selectedCalc} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
