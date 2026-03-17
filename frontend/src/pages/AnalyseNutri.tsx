/**
 * AnalyseNutri — Analyse nutritionnelle via Open Food Facts
 *
 * Fonctionnalité présente chez UFC Que Choisir / QuelProduit, absente dans l'app.
 * Recherche un produit par code EAN ou nom, affiche :
 *  - Nutri-Score (A→E)
 *  - NOVA score (niveau de transformation)
 *  - Éco-Score (impact environnemental)
 *  - Valeurs nutritionnelles / 100g
 *  - Allergènes
 *  - Ingrédients complets
 *  - Lien vers la fiche Open Food Facts officielle
 *
 * API : Open Food Facts (open, gratuite, no key needed)
 *   https://world.openfoodfacts.org/api/v0/product/{barcode}.json
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

import { SEOHead } from '../components/ui/SEOHead';
// ─── Types ──────────────────────────────────────────────────────────────────────

interface OFFProduct {
  code: string;
  product: {
    product_name: string;
    product_name_fr?: string;
    brands?: string;
    image_url?: string;
    image_front_url?: string;
    nutriscore_grade?: string;      // a, b, c, d, e
    nova_group?: number;            // 1, 2, 3, 4
    ecoscore_grade?: string;        // a, b, c, d, e, unknown
    nutriments?: Record<string, number>;
    allergens_tags?: string[];
    ingredients_text_fr?: string;
    ingredients_text?: string;
    quantity?: string;
    categories_tags?: string[];
    labels_tags?: string[];
    nutrition_grade_fr?: string;
    serving_size?: string;
  };
  status: number;
  status_verbose: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

const NS_COLORS: Record<string, string> = {
  a: '#1a7a4a', b: '#87b529', c: '#f0c000', d: '#e77f00', e: '#dc3030',
};
const NS_LABELS: Record<string, string> = {
  a: 'A — Très bon', b: 'B — Bon', c: 'C — Moyen', d: 'D — Mauvais', e: 'E — À éviter',
};

const NOVA_LABELS: Record<number, { label: string; color: string; desc: string }> = {
  1: { label: 'NOVA 1', color: '#1a7a4a', desc: 'Aliment non transformé ou peu transformé' },
  2: { label: 'NOVA 2', color: '#87b529', desc: 'Ingrédient culinaire transformé' },
  3: { label: 'NOVA 3', color: '#e77f00', desc: 'Aliment transformé' },
  4: { label: 'NOVA 4', color: '#dc3030', desc: 'Aliment ultra-transformé (UPF)' },
};

const ECO_COLORS: Record<string, string> = {
  a: '#1a7a4a', 'a-plus': '#0e5c35', b: '#87b529', c: '#f0c000', d: '#e77f00', e: '#dc3030', unknown: '#64748b',
};

function cleanAllergen(tag: string): string {
  return tag.replace('en:', '').replace('fr:', '').replace(/-/g, ' ');
}

const NUTRIMENT_LABELS: Record<string, string> = {
  'energy-kcal_100g':     '🔥 Énergie (kcal)',
  'fat_100g':              '🧈 Matières grasses',
  'saturated-fat_100g':   '  dont saturées',
  'carbohydrates_100g':   '🍞 Glucides',
  'sugars_100g':           '  dont sucres',
  'fiber_100g':            '🌿 Fibres',
  'proteins_100g':         '💪 Protéines',
  'salt_100g':             '🧂 Sel',
  'sodium_100g':           '  sodium',
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AnalyseNutri() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<OFFProduct | null>(null);
  const [history, setHistory] = useState<{ code: string; name: string; ns: string }[]>([]);

  async function search(barcode: string) {
    if (!barcode.trim()) return;
    setLoading(true);
    setError(null);
    setProduct(null);

    try {
      const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode.trim())}?fields=product_name,product_name_fr,brands,image_front_url,nutriscore_grade,nova_group,ecoscore_grade,nutriments,allergens_tags,ingredients_text_fr,ingredients_text,quantity,categories_tags,labels_tags,nutrition_grade_fr,serving_size`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Produit introuvable');
      const data: OFFProduct = await res.json();
      if (data.status === 0) throw new Error('Produit non trouvé dans la base Open Food Facts');
      setProduct(data);
      const name = data.product.product_name_fr || data.product.product_name || barcode;
      const ns = data.product.nutriscore_grade || data.product.nutrition_grade_fr || '?';
      setHistory(h => [{ code: barcode, name, ns }, ...h.filter(i => i.code !== barcode)].slice(0, 5));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur réseau — vérifiez votre connexion');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    search(query);
  }

  const p = product?.product;
  const ns = p?.nutriscore_grade || p?.nutrition_grade_fr;
  const nova = p?.nova_group;
  const eco = p?.ecoscore_grade;
  const name = p?.product_name_fr || p?.product_name || 'Produit inconnu';

  return (
    <>
      <SEOHead
        title="Analyse nutritionnelle — Comparez la qualité des aliments"
        description="Analysez la qualité nutritionnelle des produits alimentaires dans les supermarchés des territoires ultramarins."
        canonical="https://teetee971.github.io/akiprisaye-web/analyse-nutri"
      />
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '1.5rem 1rem 3rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        <div style={{ marginBottom: '1rem' }}>
          <Link to="/innovation-lab" style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}>← Innovation Lab</Link>
        </div>

        <HeroImage
          src={PAGE_HERO_IMAGES.analyseNutri}
          alt="Analyseur nutrition produit"
          gradient="from-slate-950 to-sky-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
            🥗 Analyseur nutrition produit
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
            Nutri-Score, NOVA, Éco-Score — via Open Food Facts
          </p>
        </HeroImage>

        {/* Search */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Code EAN-13 (ex: 3017620422003 = Nutella) ou nom de produit"
            style={{ flex: 1, padding: '0.6rem 0.9rem', borderRadius: 10, background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(99,102,241,0.4)', color: '#f1f5f9', fontSize: '0.88rem', outline: 'none' }}
          />
          <button type="submit" disabled={loading || !query.trim()}
            style={{ padding: '0.6rem 1.3rem', borderRadius: 10, background: loading ? 'rgba(14,165,233,0.35)' : 'rgba(14,165,233,0.8)', color: '#fff', fontSize: '0.88rem', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
            {loading ? '⏳' : '🔍 Analyser'}
          </button>
        </form>

        {/* Quick examples */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.68rem', color: '#475569' }}>Exemples :</span>
          {[
            { label: 'Nutella', code: '3017620422003' },
            { label: 'Coca-Cola 33cl', code: '5449000000996' },
            { label: 'Danette chocolat', code: '3023290005255' },
            { label: 'Kiri 8 portions', code: '3045320094055' },
          ].map(ex => (
            <button key={ex.code} onClick={() => { setQuery(ex.code); search(ex.code); }}
              style={{ padding: '0.2rem 0.7rem', borderRadius: 20, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', fontSize: '0.68rem', cursor: 'pointer' }}>
              {ex.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '0.8rem 1rem', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.83rem', marginBottom: '1rem' }}>
            ⚠️ {error} — <a href="https://fr.openfoodfacts.org/cgi/search.pl" target="_blank" rel="noopener noreferrer" style={{ color: '#f87171' }}>Rechercher sur Open Food Facts</a>
          </div>
        )}

        {/* Result */}
        {p && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

            {/* Header */}
            <div style={{ padding: '1.1rem 1.2rem', borderRadius: 16, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.15)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {p.image_front_url && (
                <img src={p.image_front_url} alt={name} width={80} height={80} style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 8, background: 'white', flexShrink: 0 }} loading="lazy" />
              )}
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 900, color: '#f1f5f9' }}>{name}</h2>
                {p.brands && <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.25rem' }}>🏷️ {p.brands}</div>}
                {p.quantity && <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem' }}>📦 {p.quantity}</div>}
                <a href={`https://fr.openfoodfacts.org/produit/${product?.code}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.68rem', color: '#38bdf8', textDecoration: 'none', padding: '2px 8px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)' }}>
                  🔗 Voir la fiche complète sur Open Food Facts
                </a>
              </div>
            </div>

            {/* Scores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.65rem' }}>
              {/* Nutri-Score */}
              <div style={{ padding: '0.9rem', borderRadius: 12, background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(148,163,184,0.12)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase' }}>Nutri-Score</div>
                {ns ? (
                  <>
                    <div style={{ width: 50, height: 50, borderRadius: 10, background: NS_COLORS[ns] ?? '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 900, color: '#fff', margin: '0 auto 0.35rem' }}>
                      {ns.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{NS_LABELS[ns] ?? ns}</div>
                  </>
                ) : <div style={{ color: '#334155', fontSize: '0.78rem', paddingTop: '0.5rem' }}>Non disponible</div>}
                <a href="https://www.santepubliquefrance.fr/determinants-de-sante/nutrition-et-activite-physique/articles/nutri-score" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.58rem', color: '#475569' }}>🔗 Santé Publique France</a>
              </div>

              {/* NOVA */}
              <div style={{ padding: '0.9rem', borderRadius: 12, background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(148,163,184,0.12)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase' }}>Score NOVA</div>
                {nova ? (
                  <>
                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: NOVA_LABELS[nova]?.color ?? '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: '0 auto 0.35rem' }}>
                      {nova}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', lineHeight: 1.3 }}>{NOVA_LABELS[nova]?.desc}</div>
                  </>
                ) : <div style={{ color: '#334155', fontSize: '0.78rem', paddingTop: '0.5rem' }}>Non disponible</div>}
                <a href="https://fr.openfoodfacts.org/nova" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.58rem', color: '#475569' }}>🔗 Open Food Facts — NOVA</a>
              </div>

              {/* Éco-Score */}
              <div style={{ padding: '0.9rem', borderRadius: 12, background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(148,163,184,0.12)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase' }}>Éco-Score</div>
                {eco && eco !== 'unknown' ? (
                  <>
                    <div style={{ width: 50, height: 50, borderRadius: 10, background: ECO_COLORS[eco] ?? '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 900, color: '#fff', margin: '0 auto 0.35rem', transform: 'rotate(-5deg)' }}>
                      {eco.replace('a-plus', 'A+').toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Impact environnemental</div>
                  </>
                ) : <div style={{ color: '#334155', fontSize: '0.78rem', paddingTop: '0.5rem' }}>Non disponible</div>}
                <a href="https://docs.score-environnemental.com/" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.58rem', color: '#475569' }}>🔗 Score Environnemental</a>
              </div>
            </div>

            {/* Nutriments */}
            {p.nutriments && (
              <div style={{ padding: '1rem 1.2rem', borderRadius: 14, background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(148,163,184,0.12)' }}>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                  Valeurs nutritionnelles pour 100g {p.serving_size ? `(portion : ${p.serving_size})` : ''}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.4rem' }}>
                  {Object.entries(NUTRIMENT_LABELS).map(([key, label]) => {
                    const val = p.nutriments?.[key];
                    if (val === undefined) return null;
                    return (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0.4rem', borderRadius: 6, background: 'rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: '0.73rem', color: '#94a3b8' }}>{label}</span>
                        <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#e2e8f0' }}>
                          {key.includes('kcal') ? `${Math.round(val)} kcal` : `${typeof val === 'number' ? val.toFixed(1) : val}g`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Allergènes */}
            {p.allergens_tags && p.allergens_tags.length > 0 && (
              <div style={{ padding: '0.85rem 1rem', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p style={{ margin: '0 0 0.4rem', fontSize: '0.75rem', color: '#f87171', fontWeight: 700 }}>⚠️ Allergènes</p>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {p.allergens_tags.map(a => (
                    <span key={a} style={{ padding: '2px 8px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '0.72rem', fontWeight: 600 }}>
                      {cleanAllergen(a)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ingrédients */}
            {(p.ingredients_text_fr || p.ingredients_text) && (
              <div style={{ padding: '0.85rem 1rem', borderRadius: 12, background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(148,163,184,0.12)' }}>
                <p style={{ margin: '0 0 0.4rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>📋 Ingrédients</p>
                <p style={{ margin: 0, fontSize: '0.73rem', color: '#64748b', lineHeight: 1.6 }}>
                  {p.ingredients_text_fr || p.ingredients_text}
                </p>
              </div>
            )}

          </div>
        )}

        {/* History */}
        {history.length > 0 && !product && (
          <div style={{ marginTop: '1.5rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Récents :</p>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {history.map(h => (
                <button key={h.code} onClick={() => { setQuery(h.code); search(h.code); }}
                  style={{ padding: '0.3rem 0.8rem', borderRadius: 20, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: '0.72rem', cursor: 'pointer' }}>
                  {h.name.slice(0, 20)}{h.name.length > 20 ? '…' : ''} {h.ns !== '?' && <strong style={{ color: NS_COLORS[h.ns] }}>({h.ns.toUpperCase()})</strong>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', padding: '0.8rem 1rem', borderRadius: 10, background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.15)' }}>
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#38bdf8', lineHeight: 1.6 }}>
            🔗 Données fournies par <strong><a href="https://fr.openfoodfacts.org" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>Open Food Facts</a></strong> — base de données alimentaire libre, collaborative et mondiale (licence ODbL). Nutri-Score selon <a href="https://www.santepubliquefrance.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>Santé Publique France</a>.
          </p>
        </div>

      </div>
    </div>
    </>
  );
}
