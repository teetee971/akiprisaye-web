/**
 * DLCAntigaspi — Tracker de dates de péremption anti-gaspillage
 *
 * Fonctionnalité présente chez Circl (concurrent), absente dans l'app.
 * Particulièrement important dans les DOM où les prix sont élevés
 * et où gaspiller = perdre doublement de l'argent.
 *
 * 100% localStorage, pas de serveur requis.
 * Données stockées : { id, nom, categorie, dlc, quantite, lieu }
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface FridgeItem {
  id: string;
  nom: string;
  categorie: string;
  dlc: string;       // ISO date string
  quantite: string;
  lieu: 'frigo' | 'congelateur' | 'placard';
  ajouteLe: string;  // ISO date string
}

type Urgence = 'expire' | 'urgent' | 'proche' | 'ok';

// ─── Data ───────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Viandes & Poissons', 'Produits laitiers', 'Fruits & Légumes',
  'Plats cuisinés', 'Charcuterie', 'Boissons', 'Épicerie', 'Surgelés', 'Autre',
];

const LIEUX: { id: FridgeItem['lieu']; label: string; emoji: string }[] = [
  { id: 'frigo',       label: 'Réfrigérateur', emoji: '❄️' },
  { id: 'congelateur', label: 'Congélateur',   emoji: '🧊' },
  { id: 'placard',     label: 'Placard',        emoji: '🗄️' },
];

const STORAGE_KEY = 'akiprisaye_dlc_items';

// ─── Recette suggestions basées sur les produits urgents ─────────────────────────

const RECETTES_URGENTES: { ingredient: string; recette: string; emoji: string }[] = [
  { ingredient: 'poulet',    recette: 'Colombo de poulet',     emoji: '🍛' },
  { ingredient: 'poisson',   recette: 'Blaff ou poisson grillé', emoji: '🐟' },
  { ingredient: 'viande',    recette: 'Ragout ou pot-au-feu',  emoji: '🍲' },
  { ingredient: 'légumes',   recette: 'Soupe pays au giraumon', emoji: '🎃' },
  { ingredient: 'œufs',      recette: 'Omelette créole',       emoji: '🍳' },
  { ingredient: 'lait',      recette: 'Crêpes ou béchamel',    emoji: '🥞' },
  { ingredient: 'tomates',   recette: 'Sauce créole maison',   emoji: '🍅' },
  { ingredient: 'bananes',   recette: 'Bananes flambées',      emoji: '🍌' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function diffDays(dlc: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dlc);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function urgence(dlc: string): Urgence {
  const diff = diffDays(dlc);
  if (diff < 0)  return 'expire';
  if (diff <= 1) return 'urgent';
  if (diff <= 3) return 'proche';
  return 'ok';
}

const URGENCE_STYLES: Record<Urgence, { bg: string; border: string; label: string; color: string }> = {
  expire: { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',  label: 'Périmé',      color: '#f87171' },
  urgent: { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)',  label: '🚨 Demain !', color: '#fca5a5' },
  proche: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', label: '⚠️ Bientôt',  color: '#fcd34d' },
  ok:     { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', label: '✅ OK',        color: '#6ee7b7' },
};

function formatDiff(dlc: string): string {
  const diff = diffDays(dlc);
  if (diff < 0)  return `Périmé depuis ${Math.abs(diff)} jour${Math.abs(diff) > 1 ? 's' : ''}`;
  if (diff === 0) return 'Expire aujourd\'hui !';
  if (diff === 1) return 'Expire demain';
  return `Dans ${diff} jours`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function DLCAntigaspi() {
  const [items, setItems] = useState<FridgeItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [filterLieu, setFilterLieu] = useState<FridgeItem['lieu'] | 'tous'>('tous');
  const [sortBy, setSortBy] = useState<'dlc' | 'nom'>('dlc');
  const [form, setForm] = useState<Omit<FridgeItem, 'id' | 'ajouteLe'>>({
    nom: '', categorie: 'Viandes & Poissons', dlc: '', quantite: '1', lieu: 'frigo',
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem() {
    if (!form.nom.trim() || !form.dlc) return;
    const newItem: FridgeItem = { ...form, id: Date.now().toString(), ajouteLe: new Date().toISOString().split('T')[0] };
    setItems(prev => [...prev, newItem]);
    setForm({ nom: '', categorie: 'Viandes & Poissons', dlc: '', quantite: '1', lieu: 'frigo' });
    setShowForm(false);
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  // Stats
  const { expire, urgent, proche, ok } = useMemo(() => ({
    expire: items.filter(i => urgence(i.dlc) === 'expire').length,
    urgent: items.filter(i => urgence(i.dlc) === 'urgent').length,
    proche: items.filter(i => urgence(i.dlc) === 'proche').length,
    ok:     items.filter(i => urgence(i.dlc) === 'ok').length,
  }), [items]);

  // Filter + sort
  const displayed = useMemo(() => {
    let list = filterLieu === 'tous' ? [...items] : items.filter(i => i.lieu === filterLieu);
    if (sortBy === 'dlc') list.sort((a, b) => a.dlc.localeCompare(b.dlc));
    else list.sort((a, b) => a.nom.localeCompare(b.nom));
    return list;
  }, [items, filterLieu, sortBy]);

  // Recette suggestions
  const urgentItems = items.filter(i => ['expire', 'urgent', 'proche'].includes(urgence(i.dlc)));
  const suggestions = RECETTES_URGENTES.filter(r =>
    urgentItems.some(i => i.nom.toLowerCase().includes(r.ingredient))
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '1.5rem 1rem 3rem' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        <div style={{ marginBottom: '1rem' }}>
          <Link to="/innovation-lab" style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}>← Innovation Lab</Link>
        </div>

        <HeroImage
          src={PAGE_HERO_IMAGES.dlcAntigaspi}
          alt="Mon frigo anti-gaspi"
          gradient="from-slate-950 to-lime-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
            🌿 Mon frigo anti-gaspi
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
            Suivez les dates de péremption — dans les DOM, gaspiller = perdre doublement
          </p>
        </HeroImage>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
          {[
            { value: expire, ...URGENCE_STYLES.expire, label: 'Périmés'  },
            { value: urgent, ...URGENCE_STYLES.urgent, label: 'Urgents'  },
            { value: proche, ...URGENCE_STYLES.proche, label: 'Bientôt'  },
            { value: ok,     ...URGENCE_STYLES.ok,     label: 'En ordre' },
          ].map(s => (
            <div key={s.label} style={{ padding: '0.65rem 0.5rem', borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.1rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Suggestions recettes */}
        {suggestions.length > 0 && (
          <div style={{ padding: '0.9rem 1.1rem', borderRadius: 12, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', marginBottom: '1.25rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>
              💡 Recettes suggérées pour vos produits urgents
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {suggestions.map(s => (
                <Link key={s.recette} to="/planificateur-repas"
                  style={{ padding: '0.3rem 0.8rem', borderRadius: 20, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fcd34d', fontSize: '0.75rem', textDecoration: 'none' }}>
                  {s.emoji} {s.recette}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[{ id: 'tous', label: '🔄 Tous' }, ...LIEUX.map(l => ({ id: l.id, label: `${l.emoji} ${l.label}` }))].map(f => (
              <button key={f.id} onClick={() => setFilterLieu(f.id as FridgeItem['lieu'] | 'tous')}
                style={{ padding: '0.35rem 0.75rem', borderRadius: 20, border: `1px solid ${filterLieu === f.id ? 'rgba(99,102,241,0.5)' : 'rgba(148,163,184,0.2)'}`,
                  background: filterLieu === f.id ? 'rgba(99,102,241,0.15)' : 'transparent', color: filterLieu === f.id ? '#a5b4fc' : '#64748b', fontSize: '0.73rem', cursor: 'pointer' }}>
                {f.label}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'dlc' | 'nom')}
            style={{ padding: '0.35rem 0.6rem', borderRadius: 8, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#94a3b8', fontSize: '0.75rem' }}>
            <option value="dlc">Trier par date</option>
            <option value="nom">Trier par nom</option>
          </select>
          <button onClick={() => setShowForm(v => !v)}
            style={{ marginLeft: 'auto', padding: '0.45rem 1.1rem', borderRadius: 8, background: 'rgba(16,185,129,0.75)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            + Ajouter un produit
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div style={{ padding: '1rem 1.2rem', borderRadius: 14, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(16,185,129,0.25)', marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem', marginBottom: '0.65rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Produit *</label>
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Lait, poulet…"
                  style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: 7, background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(99,102,241,0.35)', color: '#f1f5f9', fontSize: '0.83rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>DLC / DLUO *</label>
                <input type="date" value={form.dlc} onChange={e => setForm(f => ({ ...f, dlc: e.target.value }))}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: 7, background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(99,102,241,0.35)', color: '#f1f5f9', fontSize: '0.83rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Catégorie</label>
                <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: 7, background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(99,102,241,0.35)', color: '#f1f5f9', fontSize: '0.83rem', boxSizing: 'border-box' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Lieu</label>
                <select value={form.lieu} onChange={e => setForm(f => ({ ...f, lieu: e.target.value as FridgeItem['lieu'] }))}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: 7, background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(99,102,241,0.35)', color: '#f1f5f9', fontSize: '0.83rem', boxSizing: 'border-box' }}>
                  {LIEUX.map(l => <option key={l.id} value={l.id}>{l.emoji} {l.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Quantité</label>
                <input value={form.quantite} onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))} placeholder="1, 500g, 2 boîtes…"
                  style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: 7, background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(99,102,241,0.35)', color: '#f1f5f9', fontSize: '0.83rem', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={addItem} disabled={!form.nom || !form.dlc}
                style={{ padding: '0.45rem 1.1rem', borderRadius: 8, background: !form.nom || !form.dlc ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.75)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, border: 'none', cursor: !form.nom || !form.dlc ? 'not-allowed' : 'pointer' }}>
                ✅ Enregistrer
              </button>
              <button onClick={() => setShowForm(false)} style={{ padding: '0.45rem 0.9rem', borderRadius: 8, background: 'transparent', border: '1px solid rgba(148,163,184,0.2)', color: '#64748b', fontSize: '0.82rem', cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Items list */}
        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#334155' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🥗</div>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>Votre liste est vide — ajoutez vos produits !</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {displayed.map(item => {
              const urg = urgence(item.dlc);
              const st = URGENCE_STYLES[urg];
              const lieu = LIEUX.find(l => l.id === item.lieu)!;
              return (
                <div key={item.id} style={{ padding: '0.8rem 1rem', borderRadius: 12, background: st.bg, border: `1px solid ${st.border}`, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0' }}>{item.nom}</span>
                      <span style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: 20, background: st.bg, border: `1px solid ${st.border}`, color: st.color, fontWeight: 700 }}>{st.label}</span>
                      <span style={{ fontSize: '0.65rem', color: '#475569' }}>{lieu.emoji} {lieu.label}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                      {item.categorie} · {item.quantite} · {formatDiff(item.dlc)} ({new Date(item.dlc).toLocaleDateString('fr-FR')})
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.id)}
                    style={{ padding: '0.3rem 0.7rem', borderRadius: 7, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '0.72rem', cursor: 'pointer' }}>
                    Consommé 🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: '1.5rem', padding: '0.8rem 1rem', borderRadius: 10, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#4ade80', lineHeight: 1.6 }}>
            💡 <strong>Astuce :</strong> Dans les DOM, un ménage gaspille en moyenne <strong>150 € d'aliments/an</strong> — soit 1,5× plus qu'en métropole en valeur relative au budget alimentaire (ADEME 2023). Chaque produit consommé avant péremption est une victoire contre la vie chère !
          </p>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/planificateur-repas" style={{ padding: '0.55rem 1.2rem', borderRadius: 8, background: 'rgba(16,185,129,0.75)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}>
            🍽️ Planifier mes repas
          </Link>
          <Link to="/simulateur-budget" style={{ padding: '0.55rem 1.2rem', borderRadius: 8, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
            🧮 Simulateur budget
          </Link>
        </div>

      </div>
    </div>
  );
}
