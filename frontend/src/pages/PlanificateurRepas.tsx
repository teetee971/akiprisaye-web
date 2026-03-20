/**
 * PlanificateurRepas — Planificateur de repas hebdomadaire avec liste automatique
 *
 * Fonctionnalité absente chez Kiprix, présente chez Kosto (concurrent direct).
 * Adapté aux DOM : recettes avec ingrédients locaux, prix estimés selon territoire,
 * génération automatique de la liste de courses.
 *
 * 100% frontend, pas d'API externe requise.
 * Données : recettes locales DOM, prix moyens issus de l'observatoire.
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES, RECIPE_IMAGES } from '../config/imageAssets';

import { SEOHead } from '../components/ui/SEOHead';
// ─── Types ──────────────────────────────────────────────────────────────────────

type Meal = 'petit-dejeuner' | 'dejeuner' | 'diner';
const MEALS: { id: Meal; label: string; emoji: string }[] = [
  { id: 'petit-dejeuner', label: 'Petit-déjeuner', emoji: '☀️' },
  { id: 'dejeuner',       label: 'Déjeuner',       emoji: '🍽️' },
  { id: 'diner',          label: 'Dîner',           emoji: '🌙' },
];
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

interface Ingredient {
  name: string;
  qty: string;    // "500g", "1 boîte", etc.
  prixEst: number; // € estimate for this quantity
  categorie: string;
}

interface Recipe {
  id: string;
  name: string;
  emoji: string;
  imgUrl?: string;
  type: Meal;
  duree: number;    // minutes
  personnes: number;
  prixPar: number;  // € par personne
  origine: string;  // "local DOM" | "créole" | "métro" | "universel"
  ingredients: Ingredient[];
  tags: string[];
}

// ─── Recipe database ─────────────────────────────────────────────────────────────

const RECIPES: Recipe[] = [
  // ── Petits-déjeuners ──
  {
    id: 'pain-beurre',
    name: 'Pain beurre & café',
    emoji: '🍞',
    imgUrl: RECIPE_IMAGES['pain-beurre'],
    type: 'petit-dejeuner',
    duree: 5,
    personnes: 2,
    prixPar: 0.80,
    origine: 'universel',
    ingredients: [
      { name: 'Pain de mie', qty: '6 tranches', prixEst: 0.60, categorie: 'Boulangerie' },
      { name: 'Beurre', qty: '30g', prixEst: 0.35, categorie: 'Crèmerie' },
      { name: 'Café moulu', qty: '15g', prixEst: 0.25, categorie: 'Épicerie' },
      { name: 'Lait', qty: '20cl', prixEst: 0.20, categorie: 'Crèmerie' },
    ],
    tags: ['rapide', 'économique'],
  },
  {
    id: 'fruits-yaourt',
    name: 'Fruits locaux & yaourt',
    emoji: '🍌',
    imgUrl: RECIPE_IMAGES['fruits-yaourt'],
    type: 'petit-dejeuner',
    duree: 5,
    personnes: 2,
    prixPar: 1.20,
    origine: 'local DOM',
    ingredients: [
      { name: 'Bananes (locales)', qty: '4', prixEst: 0.80, categorie: 'Fruits & Légumes' },
      { name: 'Yaourt nature', qty: '2', prixEst: 0.90, categorie: 'Crèmerie' },
      { name: 'Miel', qty: '2 c.à.s', prixEst: 0.30, categorie: 'Épicerie' },
    ],
    tags: ['local', 'sain'],
  },
  // ── Déjeuners ──
  {
    id: 'colombo-poulet',
    name: 'Colombo de poulet créole',
    emoji: '🍛',
    imgUrl: RECIPE_IMAGES['colombo-poulet'],
    type: 'dejeuner',
    duree: 45,
    personnes: 4,
    prixPar: 3.20,
    origine: 'créole',
    ingredients: [
      { name: 'Poulet entier', qty: '1,5 kg', prixEst: 7.50, categorie: 'Viandes & Poissons' },
      { name: 'Poudre colombo', qty: '2 c.à.s', prixEst: 0.80, categorie: 'Épices' },
      { name: 'Pommes de terre', qty: '500g', prixEst: 1.20, categorie: 'Fruits & Légumes' },
      { name: 'Courgettes', qty: '2', prixEst: 1.00, categorie: 'Fruits & Légumes' },
      { name: 'Riz blanc', qty: '400g', prixEst: 0.90, categorie: 'Épicerie' },
    ],
    tags: ['créole', 'familial', 'traditionnel'],
  },
  {
    id: 'acras-morue',
    name: 'Acras de morue & féroce',
    emoji: '🐟',
    imgUrl: RECIPE_IMAGES['acras-morue'],
    type: 'dejeuner',
    duree: 60,
    personnes: 4,
    prixPar: 4.10,
    origine: 'créole',
    ingredients: [
      { name: 'Morue salée', qty: '400g', prixEst: 6.50, categorie: 'Viandes & Poissons' },
      { name: 'Farine', qty: '200g', prixEst: 0.30, categorie: 'Épicerie' },
      { name: 'Avocat', qty: '2', prixEst: 1.80, categorie: 'Fruits & Légumes' },
      { name: 'Oignons', qty: '2', prixEst: 0.60, categorie: 'Fruits & Légumes' },
      { name: 'Piment antillais', qty: '1/2', prixEst: 0.30, categorie: 'Épices' },
      { name: 'Huile de friture', qty: '50cl', prixEst: 1.50, categorie: 'Épicerie' },
      { name: 'Farine de manioc', qty: '100g', prixEst: 0.80, categorie: 'Épicerie' },
    ],
    tags: ['créole', 'traditionnel', 'fête'],
  },
  {
    id: 'riz-haricots',
    name: 'Riz aux haricots rouges',
    emoji: '🫘',
    imgUrl: RECIPE_IMAGES['riz-haricots'],
    type: 'dejeuner',
    duree: 30,
    personnes: 4,
    prixPar: 1.60,
    origine: 'créole',
    ingredients: [
      { name: 'Riz blanc', qty: '400g', prixEst: 0.90, categorie: 'Épicerie' },
      { name: 'Haricots rouges (boîte)', qty: '2 boîtes', prixEst: 1.80, categorie: 'Épicerie' },
      { name: 'Lardons', qty: '150g', prixEst: 1.50, categorie: 'Viandes & Poissons' },
      { name: 'Oignons', qty: '1', prixEst: 0.30, categorie: 'Fruits & Légumes' },
      { name: 'Thym, laurier', qty: '1 bouquet', prixEst: 0.40, categorie: 'Herbes' },
    ],
    tags: ['économique', 'créole', 'familial'],
  },
  {
    id: 'poisson-grillé',
    name: 'Poisson grillé & légumes pays',
    emoji: '🐠',
    imgUrl: RECIPE_IMAGES['poisson-grillé'],
    type: 'dejeuner',
    duree: 35,
    personnes: 4,
    prixPar: 4.80,
    origine: 'local DOM',
    ingredients: [
      { name: 'Dorade / vivaneau', qty: '1,2 kg', prixEst: 11.00, categorie: 'Viandes & Poissons' },
      { name: 'Citron vert', qty: '3', prixEst: 0.60, categorie: 'Fruits & Légumes' },
      { name: 'Piment, ail', qty: 'quelques gousses', prixEst: 0.40, categorie: 'Épices' },
      { name: 'Patate douce', qty: '600g', prixEst: 1.80, categorie: 'Fruits & Légumes' },
      { name: 'Igname', qty: '500g', prixEst: 1.50, categorie: 'Fruits & Légumes' },
    ],
    tags: ['local', 'sain', 'pêche locale'],
  },
  {
    id: 'salade-lentilles',
    name: 'Salade de lentilles créole',
    emoji: '🥗',
    imgUrl: RECIPE_IMAGES['salade-lentilles'],
    type: 'dejeuner',
    duree: 25,
    personnes: 4,
    prixPar: 2.10,
    origine: 'créole',
    ingredients: [
      { name: 'Lentilles vertes', qty: '400g', prixEst: 1.60, categorie: 'Épicerie' },
      { name: 'Tomates', qty: '3', prixEst: 1.20, categorie: 'Fruits & Légumes' },
      { name: 'Concombre', qty: '1', prixEst: 0.80, categorie: 'Fruits & Légumes' },
      { name: 'Échalotes', qty: '3', prixEst: 0.50, categorie: 'Fruits & Légumes' },
      { name: 'Vinaigrette', qty: '4 c.à.s', prixEst: 0.40, categorie: 'Épicerie' },
    ],
    tags: ['végétarien', 'économique', 'rapide'],
  },
  // ── Dîners ──
  {
    id: 'gratin-légumes',
    name: 'Gratin de légumes pays',
    emoji: '🫕',
    imgUrl: RECIPE_IMAGES['gratin-légumes'],
    type: 'diner',
    duree: 50,
    personnes: 4,
    prixPar: 2.60,
    origine: 'local DOM',
    ingredients: [
      { name: 'Christophine', qty: '3', prixEst: 1.50, categorie: 'Fruits & Légumes' },
      { name: 'Fromage râpé', qty: '150g', prixEst: 2.00, categorie: 'Crèmerie' },
      { name: 'Crème fraîche', qty: '20cl', prixEst: 1.40, categorie: 'Crèmerie' },
      { name: 'Jambon cuit', qty: '150g', prixEst: 2.20, categorie: 'Viandes & Poissons' },
      { name: 'Béchamel (farine, beurre, lait)', qty: 'base', prixEst: 0.90, categorie: 'Épicerie' },
    ],
    tags: ['local', 'végétal', 'réconfortant'],
  },
  {
    id: 'soupe-legumes',
    name: 'Soupe pays au giraumon',
    emoji: '🎃',
    imgUrl: RECIPE_IMAGES['soupe-legumes'],
    type: 'diner',
    duree: 40,
    personnes: 6,
    prixPar: 1.30,
    origine: 'créole',
    ingredients: [
      { name: 'Giraumon (citrouille pays)', qty: '1 kg', prixEst: 1.50, categorie: 'Fruits & Légumes' },
      { name: 'Carottes', qty: '3', prixEst: 0.80, categorie: 'Fruits & Légumes' },
      { name: 'Poireaux', qty: '2', prixEst: 0.90, categorie: 'Fruits & Légumes' },
      { name: 'Bouillon cube', qty: '2', prixEst: 0.30, categorie: 'Épicerie' },
      { name: 'Crème de coco', qty: '20cl', prixEst: 1.20, categorie: 'Épicerie' },
    ],
    tags: ['économique', 'créole', 'végétarien', 'chaud'],
  },
  {
    id: 'blaff-poisson',
    name: 'Blaff de poisson',
    emoji: '🍲',
    imgUrl: RECIPE_IMAGES['blaff-poisson'],
    type: 'diner',
    duree: 30,
    personnes: 4,
    prixPar: 3.90,
    origine: 'créole',
    ingredients: [
      { name: 'Vivaneau / daurade', qty: '1 kg', prixEst: 9.00, categorie: 'Viandes & Poissons' },
      { name: 'Citron vert', qty: '4', prixEst: 0.80, categorie: 'Fruits & Légumes' },
      { name: 'Ail, oignons', qty: '2 gousses + 1', prixEst: 0.40, categorie: 'Épices' },
      { name: 'Piment boisé, thym', qty: 'quelques feuilles', prixEst: 0.20, categorie: 'Herbes' },
      { name: 'Riz blanc', qty: '400g', prixEst: 0.90, categorie: 'Épicerie' },
    ],
    tags: ['créole', 'traditionnel', 'poisson'],
  },
  {
    id: 'omelette-légumes',
    name: 'Omelette aux légumes du jardin',
    emoji: '🍳',
    imgUrl: RECIPE_IMAGES['omelette-légumes'],
    type: 'diner',
    duree: 20,
    personnes: 2,
    prixPar: 1.80,
    origine: 'universel',
    ingredients: [
      { name: 'Œufs', qty: '4', prixEst: 1.20, categorie: 'Crèmerie' },
      { name: 'Poivrons', qty: '2', prixEst: 1.00, categorie: 'Fruits & Légumes' },
      { name: 'Tomates cerises', qty: '100g', prixEst: 0.80, categorie: 'Fruits & Légumes' },
      { name: 'Fromage', qty: '50g', prixEst: 0.80, categorie: 'Crèmerie' },
    ],
    tags: ['rapide', 'économique', 'végétarien'],
  },
];

// ─── Types for planner ─────────────────────────────────────────────────────────

type PlanEntry = { recipeId: string | null };
type WeekPlan = Record<string, Record<Meal, PlanEntry>>; // day -> meal -> entry

function emptyWeek(): WeekPlan {
  const plan: WeekPlan = {};
  for (const day of DAYS) {
    plan[day] = {
      'petit-dejeuner': { recipeId: null },
      'dejeuner':        { recipeId: null },
      'diner':           { recipeId: null },
    };
  }
  return plan;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PlanificateurRepas() {
  const [plan, setPlan] = useState<WeekPlan>(emptyWeek);
  const [personnes, setPersonnes] = useState(4);
  const [territoire, setTerritoire] = useState('gp');
  const [filterType, setFilterType] = useState<Meal | 'tous'>('tous');
  const [pickingFor, setPickingFor] = useState<{ day: string; meal: Meal } | null>(null);

  // Surcoût alimentaire DOM par territoire
  const surcoûts: Record<string, number> = { gp: 1.13, mq: 1.11, gf: 1.17, re: 1.12, yt: 1.14, fr: 1.00 };
  const surcoeft = surcoûts[territoire] ?? 1.13;

  // Total cost
  const { totalWeek, totalPar, recipeMap } = useMemo(() => {
    const recipeMap: Record<string, Recipe> = Object.fromEntries(RECIPES.map(r => [r.id, r]));
    let total = 0;
    for (const day of DAYS) {
      for (const m of MEALS) {
        const entry = plan[day]?.[m.id];
        if (entry?.recipeId) {
          const r = recipeMap[entry.recipeId];
          if (r) total += r.prixPar * personnes * surcoeft;
        }
      }
    }
    return { totalWeek: total, totalPar: personnes > 0 ? total / personnes : 0, recipeMap };
  }, [plan, personnes, surcoeft]);

  // Shopping list
  const shoppingList = useMemo(() => {
    const map: Record<string, { qty: string; prixEst: number; categorie: string }> = {};
    for (const day of DAYS) {
      for (const m of MEALS) {
        const entry = plan[day]?.[m.id];
        if (!entry?.recipeId) continue;
        const r = recipeMap[entry.recipeId];
        if (!r) continue;
        for (const ing of r.ingredients) {
          if (map[ing.name]) {
            map[ing.name].prixEst += ing.prixEst * (personnes / r.personnes) * surcoeft;
          } else {
            map[ing.name] = { qty: ing.qty, prixEst: ing.prixEst * (personnes / r.personnes) * surcoeft, categorie: ing.categorie };
          }
        }
      }
    }
    return map;
  }, [plan, personnes, surcoeft, recipeMap]);

  const categories = [...new Set(Object.values(shoppingList).map(v => v.categorie))].sort();

  function setRecipe(day: string, meal: Meal, recipeId: string | null) {
    setPlan(p => ({ ...p, [day]: { ...p[day], [meal]: { recipeId } } }));
    setPickingFor(null);
  }

  const filteredRecipes = filterType === 'tous' ? RECIPES : RECIPES.filter(r => r.type === (pickingFor?.meal ?? filterType));
  const pickRecipes = pickingFor ? RECIPES.filter(r => r.type === pickingFor.meal) : filteredRecipes;

  const plannedCount = DAYS.flatMap(d => MEALS.map(m => plan[d][m.id].recipeId)).filter(Boolean).length;

  return (
    <>
      <SEOHead
        title="Planificateur de repas — Optimisez votre budget alimentaire"
        description="Planifiez vos repas de la semaine, optimisez votre budget alimentaire et réduisez le gaspillage dans les DOM-TOM."
        canonical="https://teetee971.github.io/akiprisaye-web/planificateur-repas"
      />
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '1.5rem 1rem 3rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ marginBottom: '1rem' }}>
          <Link to="/innovation-lab" style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}>← Innovation Lab</Link>
        </div>

        <HeroImage
          src={PAGE_HERO_IMAGES.planificateurRepas}
          alt="Planificateur de repas DOM"
          gradient="from-slate-950 to-green-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
            🍽️ Planificateur de repas DOM
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
            Planifiez vos repas créoles et locaux — liste de courses et budget générés automatiquement
          </p>
        </HeroImage>

        {/* Config bar */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label htmlFor="repas-territoire" style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>Territoire</label>
            <select id="repas-territoire" value={territoire} onChange={e => setTerritoire(e.target.value)}
              style={{ padding: '0.4rem 0.7rem', borderRadius: 8, background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(99,102,241,0.4)', color: '#f1f5f9', fontSize: '0.82rem' }}>
              {[['gp','🇬🇵 Guadeloupe'],['mq','🇲🇶 Martinique'],['gf','🇬🇫 Guyane'],['re','🇷🇪 La Réunion'],['yt','🇾🇹 Mayotte'],['fr','🇫🇷 Métropole']].map(([c,l]) => (
                <option key={c} value={c}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>Personnes</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button onClick={() => setPersonnes(Math.max(1, personnes - 1))} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', cursor: 'pointer' }}>−</button>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', minWidth: 20, textAlign: 'center' }}>{personnes}</span>
              <button onClick={() => setPersonnes(Math.min(8, personnes + 1))} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', cursor: 'pointer' }}>+</button>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{plannedCount}/21 repas planifiés</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>{totalWeek.toFixed(2)} €<span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 400 }}>/semaine</span></div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{totalPar.toFixed(2)} €/pers.</div>
          </div>
        </div>

        {/* Planner grid */}
        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <div style={{ minWidth: 640 }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '90px repeat(7, 1fr)', gap: '3px', marginBottom: '3px' }}>
              <div />
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', padding: '0.3rem 0' }}>{d.slice(0, 3)}</div>
              ))}
            </div>
            {/* Meal rows */}
            {MEALS.map(m => (
              <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '90px repeat(7, 1fr)', gap: '3px', marginBottom: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, padding: '0.3rem 0.4rem' }}>
                  <span>{m.emoji}</span><span style={{ display: 'none' }}>{m.label}</span>
                  <span style={{ display: 'block', fontSize: '0.6rem', lineHeight: 1.2 }}>{m.label.split('-').join('­')}</span>
                </div>
                {DAYS.map(day => {
                  const entry = plan[day][m.id];
                  const recipe = entry.recipeId ? recipeMap[entry.recipeId] : null;
                  return (
                    <button key={day} onClick={() => setPickingFor({ day, meal: m.id })}
                      style={{ minHeight: 52, padding: '0.3rem', borderRadius: 8, border: recipe ? '1px solid rgba(16,185,129,0.4)' : '1px dashed rgba(148,163,184,0.2)',
                        background: recipe ? 'rgba(16,185,129,0.08)' : 'rgba(15,23,42,0.5)', cursor: 'pointer', textAlign: 'left',
                        transition: 'border-color 0.15s' }}>
                      {recipe ? (
                        <div>
                          {recipe.imgUrl ? (
                            <img src={recipe.imgUrl} alt={recipe.name} width={28} height={28} style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, marginBottom: '0.1rem' }} loading="lazy" />
                          ) : (
                            <div style={{ fontSize: '0.75rem' }}>{recipe.emoji}</div>
                          )}
                          <div style={{ fontSize: '0.62rem', color: '#d1fae5', lineHeight: 1.3, marginTop: '0.1rem' }}>{recipe.name.slice(0, 22)}{recipe.name.length > 22 ? '…' : ''}</div>
                          <div style={{ fontSize: '0.58rem', color: '#6b7280', marginTop: '0.1rem' }}>{(recipe.prixPar * personnes * surcoeft).toFixed(2)} €</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.6rem', color: '#334155', textAlign: 'center', paddingTop: '0.25rem' }}>+ Ajouter</div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Recipe picker modal */}
        {pickingFor && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <button
              type="button"
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', cursor: 'default', border: 'none' }}
              onClick={() => setPickingFor(null)}
              tabIndex={-1}
              aria-label="Fermer"
            />
            <div style={{ position: 'relative', zIndex: 1, background: '#1e293b', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 520, maxHeight: '80vh', overflowY: 'auto', border: '1px solid rgba(148,163,184,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f1f5f9' }}>
                  {MEALS.find(m => m.id === pickingFor.meal)?.emoji} {MEALS.find(m => m.id === pickingFor.meal)?.label} — {pickingFor.day}
                </h2>
                <button onClick={() => setPickingFor(null)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>
              {plan[pickingFor.day][pickingFor.meal].recipeId && (
                <button onClick={() => setRecipe(pickingFor.day, pickingFor.meal, null)}
                  style={{ marginBottom: '0.75rem', padding: '0.4rem 0.9rem', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.78rem', cursor: 'pointer' }}>
                  🗑️ Supprimer ce repas
                </button>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pickRecipes.map(r => (
                  <button key={r.id} onClick={() => setRecipe(pickingFor.day, pickingFor.meal, r.id)}
                    style={{ padding: '0.7rem 0.9rem', borderRadius: 10, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.7)', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                    {r.imgUrl ? (
                      <img src={r.imgUrl} alt={r.name} width={56} height={56} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} loading="lazy" />
                    ) : (
                      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{r.emoji}</span>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.1rem' }}>{r.name}</div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>⏱️ {r.duree} min</span>
                        <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>{(r.prixPar * personnes * surcoeft).toFixed(2)} € ({personnes} pers.)</span>
                        <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 20, background: r.origine === 'créole' ? 'rgba(251,191,36,0.1)' : r.origine === 'local DOM' ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)', color: r.origine === 'créole' ? '#fbbf24' : r.origine === 'local DOM' ? '#34d399' : '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>{r.origine}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Shopping list */}
        {Object.keys(shoppingList).length > 0 && (
          <div style={{ padding: '1.25rem 1.4rem', borderRadius: 16, background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(148,163,184,0.12)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#e2e8f0' }}>🛒 Liste de courses générée</h2>
              <button onClick={() => {
                const text = categories.map(cat => `${cat}:\n${Object.entries(shoppingList).filter(([,v]) => v.categorie === cat).map(([name, v]) => `  - ${name} (${v.qty}) — ~${v.prixEst.toFixed(2)} €`).join('\n')}`).join('\n\n');
                navigator.clipboard.writeText(text).catch(() => {});
              }} style={{ padding: '0.35rem 0.9rem', borderRadius: 8, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399', fontSize: '0.75rem', cursor: 'pointer' }}>
                📋 Copier la liste
              </button>
            </div>
            {categories.map(cat => (
              <div key={cat} style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>{cat}</div>
                {Object.entries(shoppingList).filter(([, v]) => v.categorie === cat).map(([name, v]) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                    <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{name} <span style={{ color: '#64748b', fontSize: '0.7rem' }}>({v.qty})</span></span>
                    <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>~{v.prixEst.toFixed(2)} €</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(148,163,184,0.15)', paddingTop: '0.6rem', marginTop: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 700 }}>Estimation totale</span>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#10b981' }}>{totalWeek.toFixed(2)} €</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/mes-listes" style={{ padding: '0.55rem 1.2rem', borderRadius: 8, background: 'rgba(16,185,129,0.75)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}>
            🛒 Mes listes de courses
          </Link>
          <Link to="/calculateur-octroi" style={{ padding: '0.55rem 1.2rem', borderRadius: 8, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
            🧮 Calculateur octroi de mer
          </Link>
        </div>

      </div>
    </div>
    </>
  );
}
