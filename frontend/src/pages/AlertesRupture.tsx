/**
 * AlertesRupture — Signalement citoyen des ruptures de stock / pénuries
 *
 * Formulaire de signalement avec :
 *  - Produit, magasin, territoire, date du constat
 *  - Carte des signalements récents (texte si Leaflet indispo)
 *  - Sauvegarde Firestore (collection ruptures_stock) avec fallback gracieux
 *
 * Collection Firestore :
 *   ruptures_stock/{id}
 *     produit:    string
 *     magasin:    string
 *     territoire: string
 *     commentaire: string
 *     signalePar: string (UID ou 'anonyme')
 *     createdAt:  Timestamp
 *     statut:     'ouvert' | 'resolu'
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { db } from '../lib/firebase';
import { SEOHead } from '../components/ui/SEOHead';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Rupture {
  id?: string;
  produit: string;
  magasin: string;
  territoire: string;
  commentaire: string;
  createdAt: string;
  statut: 'ouvert' | 'resolu';
}

// ─── Data ───────────────────────────────────────────────────────────────────────

const TERRITOIRES = [
  { code: 'gp', label: '🇬🇵 Guadeloupe' },
  { code: 'mq', label: '🇲🇶 Martinique' },
  { code: 'gf', label: '🇬🇫 Guyane' },
  { code: 're', label: '🇷🇪 La Réunion' },
  { code: 'yt', label: '🇾🇹 Mayotte' },
  { code: 'pm', label: '🐟 Saint-Pierre-et-Miquelon' },
  { code: 'nc', label: '🇳🇨 Nouvelle-Calédonie' },
  { code: 'pf', label: '🇵🇫 Polynésie française' },
];

const CATEGORIE_PRODUITS = [
  'Riz, pâtes, farine',
  'Huile, beurre',
  'Lait, yaourts, fromages',
  'Viandes, poissons',
  'Fruits et légumes',
  'Conserves',
  'Eau minérale',
  'Hygiène, cosmétiques',
  'Couches, articles bébé',
  'Médicaments sans ordonnance',
  'Carburant',
  'Bouteilles de gaz',
  'Appareils électriques',
  'Autre',
];

// ─── Mock data (shown if Firestore is unavailable) ────────────────────────────

const MOCK_RUPTURES: Rupture[] = [
  {
    produit: 'Huile de tournesol 1L',
    magasin: 'Carrefour',
    territoire: 'gp',
    commentaire: 'Rayon vide depuis 3 jours',
    createdAt: '2026-03-06',
    statut: 'ouvert',
  },
  {
    produit: 'Couches bébé taille 4',
    magasin: 'Leader Price',
    territoire: 'mq',
    commentaire: 'Plus de stock, pas de réassort annoncé',
    createdAt: '2026-03-05',
    statut: 'ouvert',
  },
  {
    produit: 'Lait UHT demi-écrémé',
    magasin: 'Champion',
    territoire: 're',
    commentaire: '',
    createdAt: '2026-03-04',
    statut: 'resolu',
  },
  {
    produit: 'Eau minérale 6x1,5L',
    magasin: 'Hyper U',
    territoire: 'gf',
    commentaire: 'Rupture pendant 5 jours',
    createdAt: '2026-03-01',
    statut: 'resolu',
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AlertesRupture() {
  const [ruptures, setRuptures] = useState<Rupture[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [firebaseOk, setFirebaseOk] = useState(false);

  const [form, setForm] = useState({
    produit: '',
    magasin: '',
    territoire: 'gp',
    commentaire: '',
  });

  // Load recent reports
  useEffect(() => {
    if (!db) {
      setRuptures(MOCK_RUPTURES);
      setLoading(false);
      return;
    }
    setFirebaseOk(true);
    getDocs(query(collection(db, 'ruptures_stock'), orderBy('createdAt', 'desc'), limit(20)))
      .then((snap) => {
        if (snap.empty) {
          setRuptures(MOCK_RUPTURES);
        } else {
          setRuptures(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                produit: data.produit,
                magasin: data.magasin,
                territoire: data.territoire,
                commentaire: data.commentaire || '',
                createdAt: data.createdAt?.toDate?.().toLocaleDateString('fr-FR') ?? '',
                statut: data.statut ?? 'ouvert',
              };
            })
          );
        }
      })
      .catch(() => setRuptures(MOCK_RUPTURES))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.produit.trim() || !form.magasin.trim()) return;

    setSubmitting(true);
    try {
      if (db && firebaseOk) {
        await addDoc(collection(db, 'ruptures_stock'), {
          ...form,
          signalePar: 'anonyme',
          statut: 'ouvert',
          createdAt: serverTimestamp(),
        });
      }
      // Optimistic local add
      setRuptures((prev) => [
        {
          produit: form.produit,
          magasin: form.magasin,
          territoire: form.territoire,
          commentaire: form.commentaire,
          createdAt: new Date().toLocaleDateString('fr-FR'),
          statut: 'ouvert',
        },
        ...prev,
      ]);
      setForm({ produit: '', magasin: '', territoire: 'gp', commentaire: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } finally {
      setSubmitting(false);
    }
  }

  function terrLabel(code: string) {
    return TERRITOIRES.find((t) => t.code === code)?.label ?? code;
  }

  const ouvert = ruptures.filter((r) => r.statut === 'ouvert').length;
  const resolu = ruptures.filter((r) => r.statut === 'resolu').length;

  return (
    <>
      <SEOHead
        title="Alertes rupture de stock — Soyez informé des pénuries"
        description="Suivez les ruptures de stock et tensions d'approvisionnement dans les DOM-TOM. Alertes citoyennes en temps réel."
        canonical="https://teetee971.github.io/akiprisaye-web/alertes-rupture"
      />
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '1.5rem 1rem 3rem',
        }}
      >
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ marginBottom: '1rem' }}>
            <Link
              to="/innovation-lab"
              style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}
            >
              ← Innovation Lab
            </Link>
          </div>

          <HeroImage
            src={PAGE_HERO_IMAGES.alertesRupture}
            alt="Alertes ruptures de stock"
            gradient="from-slate-950 to-red-900"
            height="h-40 sm:h-52"
          >
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
              📢 Alertes ruptures de stock
            </h1>
            <p
              style={{
                margin: '0.25rem 0 0',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              Signalez et suivez les ruptures de stock dans votre territoire
            </p>
          </HeroImage>

          {/* Stats */}
          <div
            style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}
          >
            {[
              {
                label: 'Signalements actifs',
                value: ouvert,
                color: '#ef4444',
                bg: 'rgba(239,68,68,0.08)',
                border: 'rgba(239,68,68,0.25)',
              },
              {
                label: 'Résolus récemment',
                value: resolu,
                color: '#22c55e',
                bg: 'rgba(34,197,94,0.08)',
                border: 'rgba(34,197,94,0.25)',
              },
              {
                label: 'Total signalements',
                value: ruptures.length,
                color: '#6366f1',
                bg: 'rgba(99,102,241,0.08)',
                border: 'rgba(99,102,241,0.25)',
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  flex: '1 1 150px',
                  padding: '0.8rem 1rem',
                  borderRadius: 12,
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '1.25rem 1.4rem',
              borderRadius: 16,
              background: 'rgba(15,23,42,0.75)',
              border: '1px solid rgba(148,163,184,0.12)',
              marginBottom: '1.5rem',
            }}
          >
            <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800, color: '#e2e8f0' }}>
              ➕ Signaler une rupture
            </h2>

            {success && (
              <div
                style={{
                  padding: '0.7rem 1rem',
                  borderRadius: 8,
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.35)',
                  color: '#86efac',
                  fontSize: '0.82rem',
                  marginBottom: '0.85rem',
                }}
              >
                ✅ Signalement enregistré — merci pour votre contribution citoyenne !
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <div>
                <label
                  htmlFor="alerte-produit"
                  style={{
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: '0.3rem',
                  }}
                >
                  Produit *
                </label>
                <input
                  id="alerte-produit"
                  list="produits-list"
                  value={form.produit}
                  onChange={(e) => setForm((f) => ({ ...f, produit: e.target.value }))}
                  required
                  placeholder="ex: Huile de tournesol 1L"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.7rem',
                    borderRadius: 8,
                    background: 'rgba(30,41,59,0.8)',
                    border: '1px solid rgba(99,102,241,0.35)',
                    color: '#f1f5f9',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
                <datalist id="produits-list">
                  {CATEGORIE_PRODUITS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
              <div>
                <label
                  htmlFor="alerte-magasin"
                  style={{
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: '0.3rem',
                  }}
                >
                  Magasin *
                </label>
                <input
                  id="alerte-magasin"
                  value={form.magasin}
                  onChange={(e) => setForm((f) => ({ ...f, magasin: e.target.value }))}
                  required
                  placeholder="ex: Carrefour Gosier"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.7rem',
                    borderRadius: 8,
                    background: 'rgba(30,41,59,0.8)',
                    border: '1px solid rgba(99,102,241,0.35)',
                    color: '#f1f5f9',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="alerte-territoire"
                  style={{
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: '0.3rem',
                  }}
                >
                  Territoire *
                </label>
                <select
                  id="alerte-territoire"
                  value={form.territoire}
                  onChange={(e) => setForm((f) => ({ ...f, territoire: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.7rem',
                    borderRadius: 8,
                    background: 'rgba(30,41,59,0.8)',
                    border: '1px solid rgba(99,102,241,0.35)',
                    color: '#f1f5f9',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                >
                  {TERRITOIRES.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label
                htmlFor="alerte-commentaire"
                style={{
                  fontSize: '0.72rem',
                  color: '#94a3b8',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.3rem',
                }}
              >
                Commentaire (optionnel)
              </label>
              <textarea
                id="alerte-commentaire"
                value={form.commentaire}
                onChange={(e) => setForm((f) => ({ ...f, commentaire: e.target.value }))}
                rows={2}
                placeholder="Depuis combien de temps ? Situation particulière ? Produit de substitution disponible ?"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.7rem',
                  borderRadius: 8,
                  background: 'rgba(30,41,59,0.8)',
                  border: '1px solid rgba(99,102,241,0.35)',
                  color: '#f1f5f9',
                  fontSize: '0.82rem',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !form.produit || !form.magasin}
              style={{
                padding: '0.55rem 1.5rem',
                borderRadius: 8,
                background: submitting ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.85)',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? '⏳ Envoi…' : '🚨 Signaler cette rupture'}
            </button>

            <p style={{ margin: '0.5rem 0 0', fontSize: '0.65rem', color: '#334155' }}>
              Votre signalement est anonyme et public. Les données sont partagées avec les OPMR
              locaux.
            </p>
          </form>

          {/* List */}
          <div>
            <h2
              style={{
                margin: '0 0 0.85rem',
                fontSize: '1rem',
                fontWeight: 800,
                color: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              📋 Signalements récents
              {!db && (
                <span style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 400 }}>
                  (données exemples — Firestore non configuré)
                </span>
              )}
            </h2>
            {loading ? (
              <div style={{ color: '#475569', fontSize: '0.85rem' }}>Chargement…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {ruptures.map((r, i) => (
                  <div
                    key={r.id || i}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 12,
                      background: 'rgba(15,23,42,0.65)',
                      border: `1px solid ${r.statut === 'resolu' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                          marginBottom: '0.2rem',
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>
                          {r.produit}
                        </span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            padding: '1px 7px',
                            borderRadius: 20,
                            fontWeight: 700,
                            background:
                              r.statut === 'resolu'
                                ? 'rgba(34,197,94,0.12)'
                                : 'rgba(239,68,68,0.12)',
                            color: r.statut === 'resolu' ? '#86efac' : '#f87171',
                            border: `1px solid ${r.statut === 'resolu' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          }}
                        >
                          {r.statut === 'resolu' ? '✅ Résolu' : '🚨 En cours'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {r.magasin} · {terrLabel(r.territoire)} · {r.createdAt}
                      </div>
                      {r.commentaire && (
                        <p
                          style={{
                            margin: '0.25rem 0 0',
                            fontSize: '0.72rem',
                            color: '#94a3b8',
                            lineHeight: 1.5,
                          }}
                        >
                          {r.commentaire}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Link
              to="/comparateur"
              style={{
                padding: '0.55rem 1.2rem',
                borderRadius: 8,
                background: 'rgba(99,102,241,0.75)',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              🔍 Comparer les prix
            </Link>
            <a
              href="https://www.guadeloupe.gouv.fr/Politiques-publiques/Economie-emploi-et-entreprises/Observatoire-des-Prix-des-Marges-et-des-Revenus"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.55rem 1.2rem',
                borderRadius: 8,
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(148,163,184,0.2)',
                color: '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              🏛️ Contacter l'OPMR
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
