/**
 * LettreJourWidget — Bandeau d'accueil pour la Lettre Journalière IA
 *
 * Affiche un aperçu du briefing quotidien généré automatiquement chaque
 * matin par l'IA à partir des flux RSS des médias DOM/COM.
 *
 * Charge les données depuis Firestore (collection lettre_jour_ia).
 * Si Firebase n'est pas configuré ou qu'aucune lettre n'existe encore,
 * affiche un état vide invitant à revenir le lendemain.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLatestLettreJour, type LettreJour } from '../../services/lettreJourService';
import { PAGE_HERO_IMAGES } from '../../config/imageAssets';

// ─── Helper ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function LettreJourWidget() {
  const [lettre, setLettre] = useState<LettreJour | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLatestLettreJour().then((l) => {
      setLettre(l);
      setLoading(false);
    });
  }, []);

  return (
    <section
      className="price-chart-section section-reveal"
      aria-labelledby="lettre-jour-heading"
      style={{ paddingTop: '2rem' }}
    >
      {/* Hero banner */}
      <div
        style={{
          position: 'relative',
          borderRadius: 18,
          overflow: 'hidden',
          marginBottom: '1.25rem',
          height: 120,
        }}
      >
        <img
          src={PAGE_HERO_IMAGES.lettreJour}
          alt="Briefing quotidien IA"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 40%',
          }}
          loading="lazy"
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(15,23,42,0.82) 0%, rgba(234,88,12,0.45) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '1rem 1.5rem',
          }}
        >
          <h2
            className="section-title slide-up"
            id="lettre-jour-heading"
            style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 900 }}
          >
            ☀️ Briefing Journalier IA
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.82)' }}>
            Éditorial généré chaque matin — actualité du jour dans les DOM/COM
          </p>
        </div>
      </div>

      <div className="price-chart-wrap" style={{ maxWidth: 660 }}>
        {loading ? (
          /* Loading skeleton */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {[180, 120, 80].map((h, i) => (
              <div
                key={i}
                style={{
                  height: h,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : lettre ? (
          /* Letter preview */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: '#f97316',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '0.3rem',
                  }}
                >
                  ☀️ {lettre.date}
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#f1f5f9',
                    lineHeight: 1.3,
                  }}
                >
                  {lettre.titre}
                </h3>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '3px 9px',
                  borderRadius: 20,
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  color: '#86efac',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                ✅ Publié
              </div>
            </div>

            {/* Chapeau */}
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.7 }}>
              {lettre.chapeau}
            </p>

            {/* Indicateurs */}
            {lettre.indicateurs.length > 0 && (
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {lettre.indicateurs.slice(0, 3).map((ind) => (
                  <div
                    key={ind.label}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: 10,
                      background: 'rgba(249,115,22,0.08)',
                      border: '1px solid rgba(249,115,22,0.2)',
                      textAlign: 'center',
                      flex: '1 1 120px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 900,
                        color: '#fdba74',
                        lineHeight: 1,
                      }}
                    >
                      {ind.valeur}
                    </div>
                    <div
                      style={{
                        fontSize: '0.67rem',
                        color: '#64748b',
                        marginTop: '0.2rem',
                        lineHeight: 1.3,
                      }}
                    >
                      {ind.label}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: '0.15rem' }}>
                      {ind.territoire}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sections preview */}
            {lettre.sections.slice(0, 2).map((s) => (
              <div
                key={s.titre}
                style={{
                  padding: '0.8rem 1rem',
                  borderRadius: 10,
                  background: 'rgba(15,23,42,0.6)',
                  border: '1px solid rgba(148,163,184,0.1)',
                  borderLeft: '3px solid rgba(249,115,22,0.5)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.35rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0' }}>
                    {s.titre}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: '#f97316',
                      fontWeight: 600,
                      background: 'rgba(249,115,22,0.1)',
                      padding: '1px 7px',
                      borderRadius: 20,
                      border: '1px solid rgba(249,115,22,0.25)',
                    }}
                  >
                    {s.territoire}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  {s.contenu.slice(0, 180)}
                  {s.contenu.length > 180 ? '…' : ''}
                </p>
              </div>
            ))}

            {/* Tags */}
            {lettre.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {lettre.tags.slice(0, 8).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '0.65rem',
                      color: '#475569',
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(148,163,184,0.12)',
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.6rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid rgba(148,163,184,0.1)',
              }}
            >
              <div style={{ fontSize: '0.68rem', color: '#475569' }}>
                🤖 Généré par IA ({lettre.model}) · {formatDate(lettre.generatedAt)}
              </div>
              <Link
                to="/lettre-jour"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.9rem',
                  borderRadius: 7,
                  background: 'rgba(249,115,22,0.15)',
                  border: '1px solid rgba(249,115,22,0.35)',
                  color: '#fdba74',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                📖 Lire le briefing complet →
              </Link>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>☀️</div>
            <h3
              style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: '#e2e8f0', fontWeight: 700 }}
            >
              Premier briefing en cours de préparation
            </h3>
            <p
              style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}
            >
              L'IA génère automatiquement un briefing chaque matin à partir des actualités DOM/COM.
              Revenez demain pour lire le premier numéro !
            </p>
            <Link
              to="/lettre-jour"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 1rem',
                borderRadius: 7,
                background: 'rgba(249,115,22,0.12)',
                border: '1px solid rgba(249,115,22,0.3)',
                color: '#fdba74',
                fontSize: '0.78rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              📬 Voir la page dédiée
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
