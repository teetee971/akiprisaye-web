/**
 * LettreJourIA — Page archive de la Lettre Journalière IA
 *
 * Affiche le briefing du jour et l'archive des éditions précédentes.
 * Les briefings sont générés chaque matin par GitHub Actions (script Node.js)
 * et stockés dans Firestore (collection lettre_jour_ia).
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import {
  getLatestLettreJour,
  getRecentLettresJour,
  getLettreJourByDay,
  type LettreJour,
} from '../services/lettreJourService';

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

function formatDayId(dayId: string): string {
  try {
    const [y, m, d] = dayId.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dayId;
  }
}

// ─── Source article link ────────────────────────────────────────────────────────

function SourceLink({ title, url }: { title: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        color: '#fb923c',
        fontSize: '0.72rem',
        textDecoration: 'none',
        wordBreak: 'break-word',
        lineHeight: 1.4,
      }}
    >
      🔗 {title || url}
    </a>
  );
}

// ─── Full letter view ───────────────────────────────────────────────────────────

function LettreJourView({ lettre }: { lettre: LettreJour }) {
  const [showSources, setShowSources] = useState(false);

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div
        style={{
          padding: '1.5rem 1.5rem 1.2rem',
          background: 'rgba(249,115,22,0.07)',
          border: '1px solid rgba(249,115,22,0.25)',
          borderRadius: 16,
        }}
      >
        <div
          style={{
            fontSize: '0.7rem',
            color: '#f97316',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.5rem',
          }}
        >
          ☀️ {lettre.date} · {lettre.dayId}
        </div>
        <h1
          style={{
            margin: '0 0 0.75rem',
            fontSize: '1.4rem',
            fontWeight: 900,
            color: '#f1f5f9',
            lineHeight: 1.25,
          }}
        >
          {lettre.titre}
        </h1>
        <p
          style={{
            margin: '0 0 1rem',
            fontSize: '0.95rem',
            color: '#cbd5e1',
            lineHeight: 1.75,
            fontStyle: 'italic',
          }}
        >
          {lettre.chapeau}
        </p>

        {/* Indicateurs */}
        {lettre.indicateurs.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(249,115,22,0.2)',
            }}
          >
            {lettre.indicateurs.map((ind, i) => (
              <div
                key={i}
                style={{
                  padding: '0.6rem 0.9rem',
                  borderRadius: 10,
                  background: 'rgba(15,23,42,0.6)',
                  border: '1px solid rgba(249,115,22,0.2)',
                  flex: '1 1 130px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fdba74', lineHeight: 1 }}
                >
                  {ind.valeur}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#94a3b8',
                    marginTop: '0.2rem',
                    lineHeight: 1.35,
                  }}
                >
                  {ind.label}
                </div>
                <div
                  style={{
                    fontSize: '0.62rem',
                    color: '#f97316',
                    marginTop: '0.1rem',
                    fontWeight: 600,
                  }}
                >
                  {ind.territoire}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sections */}
      {lettre.sections.map((s, i) => (
        <div
          key={i}
          style={{
            padding: '1.2rem 1.4rem',
            background: 'rgba(15,23,42,0.75)',
            border: '1px solid rgba(148,163,184,0.1)',
            borderLeft: '3px solid rgba(249,115,22,0.5)',
            borderRadius: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '0.6rem',
              flexWrap: 'wrap',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#e2e8f0' }}>
              {s.titre}
            </h2>
            <span
              style={{
                fontSize: '0.67rem',
                color: '#f97316',
                fontWeight: 700,
                background: 'rgba(249,115,22,0.1)',
                padding: '2px 9px',
                borderRadius: 20,
                border: '1px solid rgba(249,115,22,0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              {s.territoire}
            </span>
          </div>
          <p
            style={{
              margin: '0 0 0.6rem',
              fontSize: '0.88rem',
              color: '#94a3b8',
              lineHeight: 1.75,
              whiteSpace: 'pre-line',
            }}
          >
            {s.contenu}
          </p>
          {s.sources.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid rgba(148,163,184,0.08)',
              }}
            >
              {s.sources.map((src, si) => {
                const isUrl = src.startsWith('http');
                return isUrl ? (
                  <SourceLink key={si} title={src} url={src} />
                ) : (
                  <span key={si} style={{ fontSize: '0.72rem', color: '#475569' }}>
                    📎 {src}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Tags */}
      {lettre.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {lettre.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.68rem',
                color: '#64748b',
                padding: '3px 9px',
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

      {/* Sources articles (collapsible) */}
      {lettre.sourcesArticles.length > 0 && (
        <div
          style={{
            padding: '0.9rem 1.1rem',
            borderRadius: 12,
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(148,163,184,0.08)',
          }}
        >
          <button
            onClick={() => setShowSources((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            📰 {lettre.sourcesArticles.length} articles sources consultés {showSources ? '▲' : '▼'}
          </button>
          {showSources && (
            <div
              style={{
                marginTop: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              {lettre.sourcesArticles.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: '#475569',
                      minWidth: 90,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    [{a.source}]
                  </span>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.72rem',
                      color: '#fb923c',
                      textDecoration: 'none',
                      lineHeight: 1.45,
                    }}
                  >
                    {a.title}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.75rem 0',
          borderTop: '1px solid rgba(148,163,184,0.1)',
          fontSize: '0.68rem',
          color: '#475569',
        }}
      >
        <span>
          🤖 Généré par IA ({lettre.model}) ·{' '}
          {lettre.tokensUsed ? `~${lettre.tokensUsed} tokens · ` : ''}
          {formatDate(lettre.generatedAt)}
        </span>
        <span style={{ color: '#334155' }}>A KI PRI SA YÉ — Observatoire citoyen des prix</span>
      </div>
    </article>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>☀️</div>
      <h2 style={{ margin: '0 0 0.6rem', fontSize: '1.2rem', color: '#e2e8f0', fontWeight: 800 }}>
        Premier briefing en préparation
      </h2>
      <p
        style={{
          margin: '0 0 1.5rem',
          fontSize: '0.88rem',
          color: '#64748b',
          lineHeight: 1.7,
          maxWidth: 420,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        L'intelligence artificielle génère automatiquement un briefing chaque{' '}
        <strong style={{ color: '#e2e8f0' }}>matin à 7h UTC</strong> à partir des actualités des
        territoires ultramarins (La1ère, Outremers360°, etc.). Revenez demain matin pour lire le
        premier numéro !
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          alignItems: 'center',
          fontSize: '0.82rem',
          color: '#475569',
        }}
      >
        {[
          '📡 Collecte automatique des actualités DOM/COM',
          '🧠 Analyse et rédaction par GPT-4o-mini',
          '💾 Publication dans Firestore chaque matin à 7h UTC',
          "📱 Accessible sur cette page et sur l'accueil",
        ].map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function LettreJourIA() {
  const [current, setCurrent] = useState<LettreJour | null>(null);
  const [archive, setArchive] = useState<LettreJour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [loadingArchive, setLoadingArchive] = useState(false);

  useEffect(() => {
    Promise.all([getLatestLettreJour(), getRecentLettresJour(30)]).then(([latest, all]) => {
      setCurrent(latest);
      setArchive(all);
      setLoading(false);
    });
  }, []);

  async function selectDay(dayId: string) {
    if (current?.dayId === dayId) return;
    setLoadingArchive(true);
    const lettre = await getLettreJourByDay(dayId);
    if (lettre) setCurrent(lettre);
    setSelectedDayId(dayId);
    setLoadingArchive(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1c1007 100%)',
        padding: '1.5rem 1rem 3rem',
      }}
    >
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        {/* Back */}
        <div style={{ marginBottom: '1rem' }}>
          <Link
            to="/"
            style={{
              fontSize: '0.8rem',
              color: '#64748b',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            ← Retour à l'accueil
          </Link>
        </div>

        {/* Page title */}
        <HeroImage
          src={PAGE_HERO_IMAGES.lettreJour}
          alt="Briefing journalier IA"
          gradient="from-slate-950 to-orange-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
            ☀️ Briefing journalier IA
          </h1>
          <p
            style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}
          >
            L'actualité des prix dans les DOM, générée chaque matin par l'IA
          </p>
        </HeroImage>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: archive.length > 1 ? '1fr 200px' : '1fr',
            gap: '1.5rem',
            alignItems: 'start',
          }}
        >
          {/* Main content */}
          <div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[200, 150, 250, 180].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: h, borderRadius: 14, background: 'rgba(255,255,255,0.04)' }}
                  />
                ))}
              </div>
            ) : loadingArchive ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
                Chargement…
              </div>
            ) : current ? (
              <LettreJourView lettre={current} />
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Archive sidebar */}
          {archive.length > 1 && (
            <aside
              style={{
                position: 'sticky',
                top: '1rem',
                background: 'rgba(15,23,42,0.75)',
                border: '1px solid rgba(148,163,184,0.1)',
                borderRadius: 14,
                padding: '1rem',
              }}
            >
              <p
                style={{
                  margin: '0 0 0.7rem',
                  fontSize: '0.72rem',
                  color: '#64748b',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                📚 Archive
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  maxHeight: '60vh',
                  overflowY: 'auto',
                }}
              >
                {archive.map((l) => (
                  <button
                    key={l.dayId}
                    onClick={() => selectDay(l.dayId)}
                    style={{
                      background:
                        current?.dayId === l.dayId || selectedDayId === l.dayId
                          ? 'rgba(249,115,22,0.15)'
                          : 'transparent',
                      border: `1px solid ${current?.dayId === l.dayId || selectedDayId === l.dayId ? 'rgba(249,115,22,0.4)' : 'rgba(148,163,184,0.1)'}`,
                      borderRadius: 8,
                      padding: '0.5rem 0.6rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: '0.65rem', color: '#f97316', fontWeight: 700 }}>
                      {formatDayId(l.dayId)}
                    </div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: current?.dayId === l.dayId ? '#e2e8f0' : '#94a3b8',
                        lineHeight: 1.3,
                        marginTop: '0.15rem',
                      }}
                    >
                      {l.titre.slice(0, 55)}
                      {l.titre.length > 55 ? '…' : ''}
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
