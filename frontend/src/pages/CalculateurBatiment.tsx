/**
 * CalculateurBatiment — Calculateur du Bâtiment
 *
 * Hub avec 3 catégories :
 *   - Aménagement intérieur
 *   - Aménagement extérieur
 *   - Outils
 *
 * Accès freemium dégressive sur 7 jours :
 *   J1-J2 : 20 calculs/jour
 *   J3-J4 : 15 calculs/jour
 *   J5-J6 : 8  calculs/jour
 *   J7    : 3  calculs/jour
 *   J8+   : 0  (abonnement requis)
 */

import { useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  HardHat, Home, TreePine, Wrench, Lock, Unlock,
  ChevronLeft, AlertTriangle, Star, Clock, Calculator,
  RotateCcw, Info
} from 'lucide-react';
import {
  getBatimentTrialState,
  startBatimentTrial,
  consumeBatimentCalc,
  type BatimentTrialState,
} from '../services/batimentTrialService';

// ─── Types ───────────────────────────────────────────────────────────────────

type CategoryId = 'interieur' | 'exterieur' | 'outils';
type CalculatorId =
  | 'parpaing'
  | 'dalle-beton'
  | 'carrelage'
  | 'peinture'
  | 'toiture'
  | 'terrassement'
  | 'beton-courant';

interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  bgFrom: string;
  bgTo: string;
  calculators: CalculatorId[];
}

interface CalculatorDef {
  id: CalculatorId;
  label: string;
  description: string;
  emoji: string;
  category: CategoryId;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  {
    id: 'interieur',
    label: 'Aménagement intérieur',
    emoji: '🛋️',
    bgFrom: 'from-amber-700',
    bgTo: 'to-amber-500',
    calculators: ['carrelage', 'peinture', 'parpaing'],
  },
  {
    id: 'exterieur',
    label: 'Aménagement extérieur',
    emoji: '🏡',
    bgFrom: 'from-green-700',
    bgTo: 'to-green-500',
    calculators: ['dalle-beton', 'toiture', 'terrassement'],
  },
  {
    id: 'outils',
    label: 'Outils',
    emoji: '🧰',
    bgFrom: 'from-blue-700',
    bgTo: 'to-blue-500',
    calculators: ['beton-courant', 'parpaing'],
  },
];

const CALCULATORS: Record<CalculatorId, CalculatorDef> = {
  'parpaing': {
    id: 'parpaing',
    label: 'Parpaing ou Bloc US',
    description: 'Calcul du nombre de blocs et quantité de mortier',
    emoji: '🧱',
    category: 'interieur',
  },
  'dalle-beton': {
    id: 'dalle-beton',
    label: 'Dalle béton',
    description: 'Volume de béton, ciment, sable et treillis',
    emoji: '🏗️',
    category: 'exterieur',
  },
  'carrelage': {
    id: 'carrelage',
    label: 'Carrelage',
    description: 'Surface et nombre de carreaux nécessaires',
    emoji: '🟫',
    category: 'interieur',
  },
  'peinture': {
    id: 'peinture',
    label: 'Peinture',
    description: 'Quantité de peinture pour murs et plafonds',
    emoji: '🎨',
    category: 'interieur',
  },
  'toiture': {
    id: 'toiture',
    label: 'Toiture / Couverture',
    description: 'Surface et matériaux de couverture',
    emoji: '🏠',
    category: 'exterieur',
  },
  'terrassement': {
    id: 'terrassement',
    label: 'Terrassement',
    description: 'Volume de terre à déblayer ou remblayer',
    emoji: '⛏️',
    category: 'exterieur',
  },
  'beton-courant': {
    id: 'beton-courant',
    label: 'Béton courant',
    description: 'Dosage ciment, sable et gravier',
    emoji: '🪣',
    category: 'outils',
  },
};

// ─── Parpaing Calculator ──────────────────────────────────────────────────────

const PARPAING_TYPES = [
  { label: 'Parpaing 7×20×50',       h: 0.20, l: 0.50, joints: 0.01 },
  { label: 'Parpaing 10×20×50',      h: 0.20, l: 0.50, joints: 0.01 },
  { label: 'Parpaing 15×20×50',      h: 0.20, l: 0.50, joints: 0.01 },
  { label: 'Parpaing 20×20×50',      h: 0.20, l: 0.50, joints: 0.01 },
  { label: 'Parpaing Mega 15×25×50', h: 0.25, l: 0.50, joints: 0.015 },
  { label: 'Parpaing Mega 20×25×50', h: 0.25, l: 0.50, joints: 0.015 },
  { label: 'Bloc US 9×19×39',        h: 0.19, l: 0.39, joints: 0.01 },
  { label: 'Bloc US 14×19×39',       h: 0.19, l: 0.39, joints: 0.01 },
  { label: 'Bloc US 19×19×39',       h: 0.19, l: 0.39, joints: 0.01 },
];

const CIMENT_TYPES = [
  { label: 'Ciment 20 Kg',  kg: 20 },
  { label: 'Ciment 25 Kg',  kg: 25 },
  { label: 'Ciment 35 Kg',  kg: 35 },
  { label: 'Ciment 50 Kg',  kg: 50 },
];

function ParpaingCalculator({ onCalc }: { onCalc: () => boolean }) {
  const [longueur, setLongueur] = useState('');
  const [hauteur, setHauteur]   = useState('');
  const [typeIdx, setTypeIdx]   = useState(2); // Parpaing 15×20×50
  const [cimentIdx, setCimentIdx] = useState(0);
  const [result, setResult]     = useState<{
    surface: number;
    nbBlocs: number;
    mortierM3: number;
    nbSacsCiment: number;
    sableKg: number;
  } | null>(null);
  const [blocked, setBlocked]   = useState(false);

  const calculate = () => {
    const allowed = onCalc();
    if (!allowed) { setBlocked(true); return; }

    const l = parseFloat(longueur.replace(',', '.'));
    const h = parseFloat(hauteur.replace(',', '.'));
    if (!l || !h || l <= 0 || h <= 0) return;

    const parpaing = PARPAING_TYPES[typeIdx];
    const surface  = l * h;
    // Surface par bloc incluant joint
    const surfaceParBloc = (parpaing.l + parpaing.joints) * (parpaing.h + parpaing.joints);
    const nbBlocs = Math.ceil(surface / surfaceParBloc * 1.05); // +5% perte

    // Mortier standard dosé à 350 kg/m³ de ciment CPJ 32.5
    // Volume mortier ≈ 0.025 m³/m² de maçonnerie (joints 1cm)
    const mortierM3 = Math.round(surface * 0.025 * 100) / 100;

    const ciment   = CIMENT_TYPES[cimentIdx];
    // 350 kg de ciment par m³ de mortier
    const cimentKgTotal = mortierM3 * 350;
    const nbSacsCiment  = Math.ceil(cimentKgTotal / ciment.kg);

    // Sable 0/5 : ratio 1:3 (ciment:sable en volume ≈ 1:4.5 en poids)
    const sableKg = Math.round(cimentKgTotal * 4.5);

    setResult({ surface: Math.round(surface * 100) / 100, nbBlocs, mortierM3, nbSacsCiment, sableKg });
    setBlocked(false);
  };

  const reset = () => {
    setLongueur(''); setHauteur(''); setResult(null); setBlocked(false);
  };

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      <div className="flex items-center gap-2 rounded-xl bg-yellow-900/40 border border-yellow-600/40 px-4 py-2">
        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
        <span className="text-xs text-yellow-200">Dimensions en mètres — Calculs à titre indicatif (ciment CPJ 32.5, mortier standard 350 kg/m³)</span>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Longueur (m)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={longueur}
            onChange={(e) => setLongueur(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white text-center text-lg focus:border-orange-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Hauteur (m)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={hauteur}
            onChange={(e) => setHauteur(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white text-center text-lg focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {longueur && hauteur && (
        <p className="text-sm text-center text-slate-400">
          Surface : <span className="text-white font-semibold">{(parseFloat(longueur.replace(',', '.')) * parseFloat(hauteur.replace(',', '.'))).toFixed(2)} m²</span>
        </p>
      )}

      {/* Type de bloc */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">Type de bloc</label>
        <select
          value={typeIdx}
          onChange={(e) => setTypeIdx(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
        >
          {PARPAING_TYPES.map((p, i) => (
            <option key={i} value={i}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Type de ciment */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">Format sac de ciment</label>
        <select
          value={cimentIdx}
          onChange={(e) => setCimentIdx(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
        >
          {CIMENT_TYPES.map((c, i) => (
            <option key={i} value={i}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors"
        >
          Calculer
        </button>
        <button
          onClick={reset}
          className="rounded-xl border border-slate-600 px-4 py-3 text-slate-300 hover:border-slate-400 transition-colors"
          title="Nouveau calcul"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Blocked */}
      {blocked && (
        <div className="rounded-xl bg-red-900/30 border border-red-500/40 p-4 text-center text-sm text-red-300">
          <Lock className="w-5 h-5 mx-auto mb-1 text-red-400" />
          Quota journalier atteint — passez à l'offre Premium pour continuer.
        </div>
      )}

      {/* Results */}
      {result && !blocked && (
        <div className="rounded-xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
          <h3 className="font-semibold text-orange-300 flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Résultats
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <ResultRow label="Surface" value={`${result.surface} m²`} />
            <ResultRow label="Nombre de blocs" value={`${result.nbBlocs} blocs`} highlight />
            <ResultRow label="Quantité de mortier" value={`${result.mortierM3} m³`} highlight />
            <ResultRow label={`Sacs ${CIMENT_TYPES[cimentIdx].label}`} value={`${result.nbSacsCiment} sacs`} />
            <ResultRow label="Sable 0/5" value={`${result.sableKg} kg`} />
          </div>
          <p className="text-xs text-slate-500 mt-2">Calculs effectués pour du ciment CPJ 32.5 • Pour un mortier standard dosé à 350 kg/m³</p>
        </div>
      )}
    </div>
  );
}

// ─── Dalle Béton Calculator ───────────────────────────────────────────────────

const EPAISSEUR_OPTIONS = [7, 10, 12, 15, 20];

function DalleBetonCalculator({ onCalc }: { onCalc: () => boolean }) {
  const [longueur, setLongueur] = useState('');
  const [largeur, setLargeur]   = useState('');
  const [epaisseur, setEpaisseur] = useState(10); // cm
  const [cimentIdx, setCimentIdx] = useState(0);
  const [result, setResult]     = useState<{
    surface: number;
    volume: number;
    nbSacsCiment: number;
    sableKg: number;
    gravierKg: number;
    treillis: number;
  } | null>(null);
  const [blocked, setBlocked]   = useState(false);

  const calculate = () => {
    const allowed = onCalc();
    if (!allowed) { setBlocked(true); return; }

    const l = parseFloat(longueur.replace(',', '.'));
    const w = parseFloat(largeur.replace(',', '.'));
    if (!l || !w || l <= 0 || w <= 0) return;

    const surface = l * w;
    const volume  = Math.round(surface * (epaisseur / 100) * 1000) / 1000;

    // Béton dosé à 350 kg de ciment/m³ (béton courant)
    const cimentKgTotal = volume * 350;
    const ciment        = CIMENT_TYPES[cimentIdx];
    const nbSacsCiment  = Math.ceil(cimentKgTotal / ciment.kg);

    // Ratio ciment:sable:gravier = 1:2:3 en volume
    // ≈ 1:2.5:4 en poids
    const sableKg   = Math.round(cimentKgTotal * 2.5);
    const gravierKg = Math.round(cimentKgTotal * 4);

    // Treillis soudé 1.2×2.4 m (surface utile 2.88 m²)
    const treillis = Math.ceil(surface / 2.88 * 1.15); // +15% chevauchement

    setResult({ surface: Math.round(surface * 100) / 100, volume, nbSacsCiment, sableKg, gravierKg, treillis });
    setBlocked(false);
  };

  const reset = () => {
    setLongueur(''); setLargeur(''); setResult(null); setBlocked(false);
  };

  const surface = longueur && largeur
    ? parseFloat(longueur.replace(',', '.')) * parseFloat(largeur.replace(',', '.'))
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl bg-yellow-900/40 border border-yellow-600/40 px-4 py-2">
        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
        <span className="text-xs text-yellow-200">Dimensions en mètres — Béton courant dosé à 350 kg/m³ (CPJ 32.5)</span>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Longueur (m)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={longueur}
            onChange={(e) => setLongueur(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white text-center text-lg focus:border-orange-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Largeur (m)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={largeur}
            onChange={(e) => setLargeur(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white text-center text-lg focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-400">Surface :</span>
        <span className="text-white font-semibold">{surface > 0 ? `${(Math.round(surface * 100) / 100)} M2` : '0 M2'}</span>
      </div>

      {/* Épaisseur slider */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">Épaisseur de la dalle</label>
        <div className="rounded-xl bg-green-700/50 border border-green-600/40 px-4 py-3 text-center font-semibold text-green-200">
          Épaisseur de la dalle : {epaisseur} cm
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500">7 cm</span>
          <input
            type="range"
            min="7"
            max="20"
            step="1"
            value={epaisseur}
            onChange={(e) => setEpaisseur(Number(e.target.value))}
            className="flex-1 accent-orange-500"
          />
          <span className="text-xs text-slate-500">20 cm</span>
        </div>
        <div className="mt-2 flex justify-center gap-2 flex-wrap">
          {EPAISSEUR_OPTIONS.map((ep) => (
            <button
              key={ep}
              onClick={() => setEpaisseur(ep)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                epaisseur === ep ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {ep} cm
            </button>
          ))}
        </div>
      </div>

      {/* Volume */}
      <div className="rounded-xl bg-green-700/30 border border-green-600/40 px-4 py-3 text-center">
        <span className="text-green-200 font-semibold">
          Volume : {surface > 0 ? `${Math.round(surface * (epaisseur / 100) * 1000) / 1000} m3` : '0 m3'}
        </span>
      </div>

      {/* Ciment */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">Format sac de ciment</label>
        <select
          value={cimentIdx}
          onChange={(e) => setCimentIdx(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
        >
          {CIMENT_TYPES.map((c, i) => (
            <option key={i} value={i}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <button
          onClick={calculate}
          className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors"
        >
          Calculer
        </button>
        <button
          onClick={reset}
          className="rounded-xl border border-slate-600 px-4 py-3 text-slate-300 hover:border-slate-400 transition-colors"
          title="Nouveau calcul"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {blocked && (
        <div className="rounded-xl bg-red-900/30 border border-red-500/40 p-4 text-center text-sm text-red-300">
          <Lock className="w-5 h-5 mx-auto mb-1 text-red-400" />
          Quota journalier atteint — passez à l'offre Premium pour continuer.
        </div>
      )}

      {result && !blocked && (
        <div className="rounded-xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
          <h3 className="font-semibold text-orange-300 flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Résultats
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <ResultRow label="Surface" value={`${result.surface} m²`} />
            <ResultRow label="Volume béton" value={`${result.volume} m³`} highlight />
            <ResultRow label={`Sacs ${CIMENT_TYPES[cimentIdx].label}`} value={`${result.nbSacsCiment} sacs`} highlight />
            <ResultRow label="Paveur 0/20" value={`${result.gravierKg} kg`} />
            <ResultRow label="Sable 0/5" value={`${result.sableKg} kg`} />
            <ResultRow label="Treillis 1,2×2,4" value={`${result.treillis} panneaux`} />
          </div>
          <p className="text-xs text-slate-500 mt-2">Calculs effectués pour du ciment CPJ 32.5 • Tous les calculs sont à titre indicatif</p>
        </div>
      )}
    </div>
  );
}

// ─── Carrelage Calculator ─────────────────────────────────────────────────────

function CarrelageCalculator({ onCalc }: { onCalc: () => boolean }) {
  const [longueur, setLongueur] = useState('');
  const [largeur, setLargeur]   = useState('');
  const [tileL, setTileL]       = useState('60');
  const [tileW, setTileW]       = useState('60');
  const [result, setResult]     = useState<{ surface: number; nbCarreaux: number; colle: number; joint: number } | null>(null);
  const [blocked, setBlocked]   = useState(false);

  const calculate = () => {
    const allowed = onCalc();
    if (!allowed) { setBlocked(true); return; }

    const l = parseFloat(longueur.replace(',', '.'));
    const w = parseFloat(largeur.replace(',', '.'));
    const tl = parseFloat(tileL.replace(',', '.')) / 100;
    const tw = parseFloat(tileW.replace(',', '.')) / 100;
    if (!l || !w || !tl || !tw) return;

    const surface    = l * w;
    const nbCarreaux = Math.ceil((surface / (tl * tw)) * 1.1); // +10% casse
    const colle      = Math.ceil(surface * 3.5);    // ≈ 3.5 kg/m²
    const joint      = Math.ceil(surface * 0.4);    // ≈ 0.4 kg/m²

    setResult({ surface: Math.round(surface * 100) / 100, nbCarreaux, colle, joint });
    setBlocked(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl bg-yellow-900/40 border border-yellow-600/40 px-4 py-2">
        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
        <span className="text-xs text-yellow-200">Dimensions de la pièce en mètres, format des carreaux en cm</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Longueur pièce (m)</label>
          <input type="number" min="0" step="0.01" value={longueur} onChange={(e) => setLongueur(e.target.value)}
            placeholder="0.00" className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white text-center text-lg focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Largeur pièce (m)</label>
          <input type="number" min="0" step="0.01" value={largeur} onChange={(e) => setLargeur(e.target.value)}
            placeholder="0.00" className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white text-center text-lg focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Longueur carreau (cm)</label>
          <input type="number" min="1" step="1" value={tileL} onChange={(e) => setTileL(e.target.value)}
            placeholder="60" className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white text-center text-lg focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Largeur carreau (cm)</label>
          <input type="number" min="1" step="1" value={tileW} onChange={(e) => setTileW(e.target.value)}
            placeholder="60" className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white text-center text-lg focus:border-orange-500 focus:outline-none" />
        </div>
      </div>

      <button onClick={calculate} className="w-full rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors">
        Calculer
      </button>

      {blocked && (
        <div className="rounded-xl bg-red-900/30 border border-red-500/40 p-4 text-center text-sm text-red-300">
          <Lock className="w-5 h-5 mx-auto mb-1 text-red-400" />
          Quota journalier atteint — passez à l'offre Premium pour continuer.
        </div>
      )}

      {result && !blocked && (
        <div className="rounded-xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
          <h3 className="font-semibold text-orange-300 flex items-center gap-2"><Calculator className="w-4 h-4" /> Résultats</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <ResultRow label="Surface" value={`${result.surface} m²`} />
            <ResultRow label="Nombre de carreaux" value={`${result.nbCarreaux} pcs`} highlight />
            <ResultRow label="Colle carrelage" value={`${result.colle} kg`} />
            <ResultRow label="Jointement" value={`${result.joint} kg`} />
          </div>
          <p className="text-xs text-slate-500">Inclut 10% de chute • Tous les calculs sont à titre indicatif</p>
        </div>
      )}
    </div>
  );
}

// ─── Peinture Calculator ──────────────────────────────────────────────────────

function PeintureCalculator({ onCalc }: { onCalc: () => boolean }) {
  const [longueur, setLongueur] = useState('');
  const [largeur, setLargeur]   = useState('');
  const [hauteurMur, setHauteurMur] = useState('2.5');
  const [nbCouches, setNbCouches]   = useState('2');
  const [rendement, setRendement]   = useState('10'); // m²/L
  const [result, setResult] = useState<{ surfaceMurs: number; surfacePlafond: number; litres: number } | null>(null);
  const [blocked, setBlocked] = useState(false);

  const calculate = () => {
    const allowed = onCalc();
    if (!allowed) { setBlocked(true); return; }

    const l  = parseFloat(longueur.replace(',', '.'));
    const w  = parseFloat(largeur.replace(',', '.'));
    const hm = parseFloat(hauteurMur.replace(',', '.'));
    const nc = parseInt(nbCouches);
    const rd = parseFloat(rendement.replace(',', '.'));
    if (!l || !w || !hm || !nc || !rd) return;

    const perimetre   = 2 * (l + w);
    const surfaceMurs = Math.round(perimetre * hm * 100) / 100;
    const surfacePlafond = Math.round(l * w * 100) / 100;
    const surfaceTotal = (surfaceMurs + surfacePlafond) * nc;
    const litres = Math.ceil(surfaceTotal / rd);

    setResult({ surfaceMurs, surfacePlafond, litres });
    setBlocked(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Longueur pièce (m)</label>
          <input type="number" min="0" step="0.01" value={longueur} onChange={(e) => setLongueur(e.target.value)}
            placeholder="0.00" className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white text-center focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Largeur pièce (m)</label>
          <input type="number" min="0" step="0.01" value={largeur} onChange={(e) => setLargeur(e.target.value)}
            placeholder="0.00" className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white text-center focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Hauteur murs (m)</label>
          <input type="number" min="0" step="0.01" value={hauteurMur} onChange={(e) => setHauteurMur(e.target.value)}
            placeholder="2.5" className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white text-center focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Nombre de couches</label>
          <select value={nbCouches} onChange={(e) => setNbCouches(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
            <option value="1">1 couche</option>
            <option value="2">2 couches</option>
            <option value="3">3 couches</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-slate-400 mb-1">Rendement peinture (m²/L)</label>
          <input type="number" min="1" step="0.5" value={rendement} onChange={(e) => setRendement(e.target.value)}
            placeholder="10" className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white text-center focus:border-orange-500 focus:outline-none" />
        </div>
      </div>

      <button onClick={calculate} className="w-full rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors">
        Calculer
      </button>

      {blocked && (
        <div className="rounded-xl bg-red-900/30 border border-red-500/40 p-4 text-center text-sm text-red-300">
          <Lock className="w-5 h-5 mx-auto mb-1 text-red-400" />
          Quota journalier atteint — passez à l'offre Premium pour continuer.
        </div>
      )}

      {result && !blocked && (
        <div className="rounded-xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
          <h3 className="font-semibold text-orange-300 flex items-center gap-2"><Calculator className="w-4 h-4" /> Résultats</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <ResultRow label="Surface murs" value={`${result.surfaceMurs} m²`} />
            <ResultRow label="Surface plafond" value={`${result.surfacePlafond} m²`} />
            <ResultRow label="Peinture nécessaire" value={`${result.litres} L`} highlight />
          </div>
          <p className="text-xs text-slate-500">Murs + plafond inclus • Tous les calculs sont à titre indicatif</p>
        </div>
      )}
    </div>
  );
}

// ─── Béton courant Calculator ─────────────────────────────────────────────────

function BetonCourantCalculator({ onCalc }: { onCalc: () => boolean }) {
  const [volume, setVolume] = useState('');
  const [cimentIdx, setCimentIdx] = useState(0);
  const [dosage, setDosage] = useState('300');
  const [result, setResult] = useState<{ nbSacsCiment: number; sableKg: number; gravierKg: number; eau: number } | null>(null);
  const [blocked, setBlocked] = useState(false);

  const calculate = () => {
    const allowed = onCalc();
    if (!allowed) { setBlocked(true); return; }

    const v  = parseFloat(volume.replace(',', '.'));
    const d  = parseFloat(dosage);
    if (!v || !d) return;

    const cimentKg = v * d;
    const ciment   = CIMENT_TYPES[cimentIdx];
    const nbSacsCiment = Math.ceil(cimentKg / ciment.kg);
    const sableKg  = Math.round(cimentKg * 2.5);
    const gravierKg = Math.round(cimentKg * 4);
    const eau      = Math.round(v * 180); // ≈ 180 L/m³

    setResult({ nbSacsCiment, sableKg, gravierKg, eau });
    setBlocked(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl bg-yellow-900/40 border border-yellow-600/40 px-4 py-2">
        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
        <span className="text-xs text-yellow-200">Calcul pour béton courant. Volume en m³.</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Volume béton (m³)</label>
          <input type="number" min="0" step="0.01" value={volume} onChange={(e) => setVolume(e.target.value)}
            placeholder="0.00" className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white text-center text-lg focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Dosage ciment (kg/m³)</label>
          <select value={dosage} onChange={(e) => setDosage(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
            <option value="250">250 kg/m³ (béton maigre)</option>
            <option value="300">300 kg/m³ (béton normal)</option>
            <option value="350">350 kg/m³ (béton résistant)</option>
            <option value="400">400 kg/m³ (béton armé)</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-slate-400 mb-1">Format sac de ciment</label>
          <select value={cimentIdx} onChange={(e) => setCimentIdx(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-orange-500 focus:outline-none">
            {CIMENT_TYPES.map((c, i) => <option key={i} value={i}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <button onClick={calculate} className="w-full rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors">
        Calculer
      </button>

      {blocked && (
        <div className="rounded-xl bg-red-900/30 border border-red-500/40 p-4 text-center text-sm text-red-300">
          <Lock className="w-5 h-5 mx-auto mb-1 text-red-400" />
          Quota journalier atteint — passez à l'offre Premium pour continuer.
        </div>
      )}

      {result && !blocked && (
        <div className="rounded-xl bg-slate-800 border border-orange-500/30 p-4 space-y-3">
          <h3 className="font-semibold text-orange-300 flex items-center gap-2"><Calculator className="w-4 h-4" /> Résultats</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <ResultRow label={`Sacs ${CIMENT_TYPES[cimentIdx].label}`} value={`${result.nbSacsCiment} sacs`} highlight />
            <ResultRow label="Sable 0/5" value={`${result.sableKg} kg`} />
            <ResultRow label="Gravier 0/20" value={`${result.gravierKg} kg`} />
            <ResultRow label="Eau" value={`${result.eau} L`} />
          </div>
          <p className="text-xs text-slate-500">Calculs effectués pour du ciment CPJ 32.5 • Tous les calculs sont à titre indicatif</p>
        </div>
      )}
    </div>
  );
}

// ─── Result Row ───────────────────────────────────────────────────────────────

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-2 ${highlight ? 'bg-orange-900/30 border border-orange-500/30' : 'bg-slate-900/50'}`}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`font-bold ${highlight ? 'text-orange-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}

// ─── Paywall Modal ────────────────────────────────────────────────────────────

function PaywallModal({ onStartTrial, onClose, isExpired }: {
  onStartTrial: () => void;
  onClose: () => void;
  isExpired: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="max-w-sm w-full bg-slate-900 rounded-2xl border border-orange-500/30 p-6 shadow-2xl">
        <div className="text-center mb-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-orange-900/40 border border-orange-500/40 flex items-center justify-center mb-3">
            {isExpired ? <Lock className="w-7 h-7 text-orange-400" /> : <HardHat className="w-7 h-7 text-orange-400" />}
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            {isExpired ? 'Période d\'essai terminée' : 'Calculateur du Bâtiment'}
          </h2>
          <p className="text-sm text-slate-400">
            {isExpired
              ? 'Votre essai gratuit de 7 jours est terminé. Abonnez-vous pour continuer.'
              : 'Accédez gratuitement pendant 7 jours avec un quota dégressive.'}
          </p>
        </div>

        {!isExpired && (
          <div className="mb-5 space-y-2 text-sm">
            <div className="flex justify-between text-slate-300 bg-slate-800 rounded-lg px-3 py-2">
              <span>🟢 Jours 1-2</span><span className="text-green-400 font-medium">20 calculs/jour</span>
            </div>
            <div className="flex justify-between text-slate-300 bg-slate-800 rounded-lg px-3 py-2">
              <span>🟡 Jours 3-4</span><span className="text-yellow-400 font-medium">15 calculs/jour</span>
            </div>
            <div className="flex justify-between text-slate-300 bg-slate-800 rounded-lg px-3 py-2">
              <span>🟠 Jours 5-6</span><span className="text-orange-400 font-medium">8 calculs/jour</span>
            </div>
            <div className="flex justify-between text-slate-300 bg-slate-800 rounded-lg px-3 py-2">
              <span>🔴 Jour 7</span><span className="text-red-400 font-medium">3 calculs/jour</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {!isExpired && (
            <button
              onClick={onStartTrial}
              className="w-full rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-semibold text-white transition-colors flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              Commencer l'essai gratuit 7 jours
            </button>
          )}
          <button
            onClick={() => { window.location.href = '/pricing'; }}
            className="w-full rounded-xl bg-indigo-700 hover:bg-indigo-600 py-3 font-semibold text-white transition-colors flex items-center justify-center gap-2"
          >
            <Star className="w-4 h-4" />
            S'abonner — accès illimité
          </button>
          {!isExpired && (
            <button onClick={onClose} className="w-full rounded-xl border border-slate-600 py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors">
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

  const pct = state.trialDay ? Math.round(((8 - state.trialDay) / 7) * 100) : 0;
  const color = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 p-3 mb-4">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="flex items-center gap-2 text-slate-300">
          <Clock className="w-4 h-4 text-orange-400" />
          Essai gratuit — Jour {state.trialDay ?? '?'}/7
        </span>
        <span className="text-slate-400">
          {state.remainingToday} calcul{state.remainingToday !== 1 ? 's' : ''} restant{state.remainingToday !== 1 ? 's' : ''} aujourd'hui
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {state.daysLeft <= 2 && (
        <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Il reste {state.daysLeft} jour{state.daysLeft !== 1 ? 's' : ''} — <a href="/pricing" className="underline hover:text-orange-300">S'abonner</a>
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CalculateurBatiment() {
  const [trialState, setTrialState]         = useState<BatimentTrialState>(() => getBatimentTrialState());
  const [showPaywall, setShowPaywall]        = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [selectedCalc, setSelectedCalc]     = useState<CalculatorId | null>(null);

  // Show paywall on mount if no trial started
  useEffect(() => {
    const state = getBatimentTrialState();
    setTrialState(state);
    if (!state.startedAt) {
      setShowPaywall(true);
    }
  }, []);

  const handleStartTrial = () => {
    const newState = startBatimentTrial();
    setTrialState(newState);
    setShowPaywall(false);
  };

  /** Called before each calculation. Returns true if allowed. */
  const handleCalc = useCallback((): boolean => {
    const state = getBatimentTrialState();
    if (!state.startedAt || state.isExpired) {
      setShowPaywall(true);
      return false;
    }
    if (state.remainingToday <= 0) {
      setShowPaywall(true);
      return false;
    }
    const { allowed, state: newState } = consumeBatimentCalc();
    setTrialState(newState);
    return allowed;
  }, []);

  const category = selectedCategory ? CATEGORIES.find((c) => c.id === selectedCategory) : null;
  const calculator = selectedCalc ? CALCULATORS[selectedCalc] : null;

  return (
    <>
      <Helmet>
        <title>Calculateur du Bâtiment — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Calculez les matériaux de construction : parpaings, dalle béton, carrelage, peinture. Freemium 7 jours gratuits."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-white">
        {/* Paywall */}
        {showPaywall && (
          <PaywallModal
            onStartTrial={handleStartTrial}
            onClose={() => setShowPaywall(false)}
            isExpired={trialState.isExpired}
          />
        )}

        <div className="max-w-2xl mx-auto px-4 pb-12 pt-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              {(selectedCategory || selectedCalc) && (
                <button
                  onClick={() => { if (selectedCalc) setSelectedCalc(null); else setSelectedCategory(null); }}
                  className="rounded-full p-2 bg-slate-800 hover:bg-slate-700 transition-colors"
                  aria-label="Retour"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-300" />
                </button>
              )}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-700 to-orange-500 flex items-center justify-center shadow-lg">
                <HardHat className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white mb-1">
              {calculator ? calculator.label : category ? category.label : 'Calculs du bâtiment'}
            </h1>
            <p className="text-sm text-slate-400">Simple et Rapide</p>
          </div>

          {/* Trial Banner */}
          {trialState.startedAt && !trialState.isExpired && (
            <TrialBanner state={trialState} />
          )}

          {/* Expired Banner */}
          {trialState.isExpired && (
            <div className="rounded-xl bg-red-900/20 border border-red-500/40 p-4 mb-4 text-center">
              <Lock className="w-5 h-5 mx-auto mb-1 text-red-400" />
              <p className="text-sm text-red-300 font-medium">Période d'essai terminée</p>
              <a href="/pricing" className="text-xs text-indigo-400 underline hover:text-indigo-300">S'abonner pour continuer →</a>
            </div>
          )}

          {/* ── Level 0: Categories ── */}
          {!selectedCategory && !selectedCalc && (
            <div className="space-y-4">
              {CATEGORIES.map((cat) => {
                const Icon = cat.id === 'interieur' ? Home : cat.id === 'exterieur' ? TreePine : Wrench;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full rounded-2xl overflow-hidden shadow-lg hover:scale-[1.02] transition-transform`}
                  >
                    <div className={`bg-gradient-to-br ${cat.bgFrom} ${cat.bgTo} p-6 flex items-end gap-4 min-h-[110px]`}>
                      <Icon className="w-12 h-12 text-white/80 mb-1" />
                      <span className="text-xl font-black text-white drop-shadow">{cat.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Level 1: Calculator List ── */}
          {selectedCategory && !selectedCalc && category && (
            <div className="space-y-3">
              {category.calculators.map((calcId) => {
                const calc = CALCULATORS[calcId];
                return (
                  <button
                    key={calcId}
                    onClick={() => setSelectedCalc(calcId)}
                    className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-orange-500/40 p-4 text-left transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-2xl shrink-0">
                      {calc.emoji}
                    </div>
                    <div>
                      <p className="font-bold text-white">{calc.label}</p>
                      <p className="text-xs text-slate-400">{calc.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Level 2: Calculator ── */}
          {selectedCalc && (
            <div className="bg-slate-900 rounded-2xl border border-slate-700 p-4">
              {selectedCalc === 'parpaing'      && <ParpaingCalculator onCalc={handleCalc} />}
              {selectedCalc === 'dalle-beton'   && <DalleBetonCalculator onCalc={handleCalc} />}
              {selectedCalc === 'carrelage'     && <CarrelageCalculator onCalc={handleCalc} />}
              {selectedCalc === 'peinture'      && <PeintureCalculator onCalc={handleCalc} />}
              {selectedCalc === 'beton-courant' && <BetonCourantCalculator onCalc={handleCalc} />}
              {(selectedCalc === 'toiture' || selectedCalc === 'terrassement') && (
                <div className="text-center py-10 text-slate-400">
                  <Wrench className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                  <p className="font-medium text-slate-300">Calculateur en cours de développement</p>
                  <p className="text-sm mt-1">Ce module sera disponible dans la prochaine mise à jour.</p>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer footer */}
          {selectedCalc && (
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-600 bg-orange-900/20 border border-orange-800/30 rounded-lg px-4 py-2">
                Tous les calculs sont à titre indicatif
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
