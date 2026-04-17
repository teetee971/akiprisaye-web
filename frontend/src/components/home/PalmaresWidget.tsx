/**
 * PalmaresWidget — Palmarès hebdomadaire des enseignes par territoire.
 *
 * Lit /data/palmares.json et affiche le top 3 enseignes selon 3 critères :
 *   🏷️  Prix les plus bas
 *   ⭐ Meilleur rapport qualité-prix
 *   🛒 Plus grand choix
 *
 * Le territoire affiché correspond au territoire actif de l'utilisateur
 * (localStorage), avec fallback sur la Guadeloupe.
 */

import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, ShoppingCart, Tag, Star } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface StoreEntry {
  name: string;
  score: number;
  change: 'up' | 'down' | 'stable';
  note: string;
}

interface TerritoryPalmares {
  territory: string;
  updatedAt: string;
  lowestPrices: StoreEntry[];
  bestValue: StoreEntry[];
  widestSelection: StoreEntry[];
}

interface PalmaresData {
  generatedAt: string;
  territories: TerritoryPalmares[];
}

// ─── Territory display map ─────────────────────────────────────────────────

const TERRITORY_LABELS: Record<string, { flag: string; name: string }> = {
  gp: { flag: '🇬🇵', name: 'Guadeloupe' },
  mq: { flag: '🇲🇶', name: 'Martinique' },
  gf: { flag: '🇬🇫', name: 'Guyane' },
  re: { flag: '🇷🇪', name: 'La Réunion' },
  yt: { flag: '🇾🇹', name: 'Mayotte' },
  fr: { flag: '🇫🇷', name: 'France métro.' },
};

const MEDAL = ['🥇', '🥈', '🥉'];

type TabKey = 'lowestPrices' | 'bestValue' | 'widestSelection';

const TABS: Array<{ key: TabKey; label: string; icon: React.ReactNode; emoji: string }> = [
  {
    key: 'lowestPrices',
    label: 'Prix bas',
    emoji: '🏷️',
    icon: <Tag size={13} />,
  },
  {
    key: 'bestValue',
    label: 'Rapport Q/P',
    emoji: '⭐',
    icon: <Star size={13} />,
  },
  {
    key: 'widestSelection',
    label: 'Grand choix',
    emoji: '🛒',
    icon: <ShoppingCart size={13} />,
  },
];

// ─── Change icon ─────────────────────────────────────────────────────────────

function ChangeIcon({ change }: { change: StoreEntry['change'] }) {
  if (change === 'up')
    return <TrendingUp size={12} className="text-emerald-400" aria-label="En hausse" />;
  if (change === 'down')
    return <TrendingDown size={12} className="text-red-400" aria-label="En baisse" />;
  return <Minus size={12} className="text-slate-400" aria-label="Stable" />;
}

// ─── Territory selector ───────────────────────────────────────────────────

function readStoredTerritory(): string {
  try {
    const raw = localStorage.getItem('akiprisaye-territory');
    return raw ? raw.toLowerCase() : 'gp';
  } catch {
    return 'gp';
  }
}

// ─── Main widget ─────────────────────────────────────────────────────────────

export default function PalmaresWidget() {
  const [data, setData] = useState<PalmaresData | null>(null);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('lowestPrices');
  const [territory, setTerritory] = useState<string>(readStoredTerritory);

  useEffect(() => {
    fetch('/data/palmares.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: PalmaresData) => setData(d))
      .catch(() => setError(true));
  }, []);

  if (error) return null;
  if (!data) return null;

  const currentData =
    data.territories.find((t) => t.territory === territory) ?? data.territories[0];

  if (!currentData) return null;

  const entries = currentData[activeTab];
  const label = TERRITORY_LABELS[territory] ?? { flag: '🌍', name: territory.toUpperCase() };
  const availableTerritories = data.territories.map((t) => t.territory);

  return (
    <section
      aria-label="Palmarès des enseignes"
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2d52 100%)',
        borderRadius: '1.25rem',
        padding: '1.25rem 1.25rem 1rem',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '0.5rem',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '0.85rem',
        }}
      >
        <div>
          <p
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#94a3b8',
              margin: 0,
              marginBottom: '0.2rem',
            }}
          >
            <Trophy size={11} style={{ color: '#fbbf24' }} />
            Palmarès des enseignes
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#f1f5f9',
              lineHeight: 1.3,
            }}
          >
            {label.flag} {label.name}
          </p>
          <p style={{ margin: 0, fontSize: '0.68rem', color: '#64748b', marginTop: '0.1rem' }}>
            Mis à jour le {currentData.updatedAt}
          </p>
        </div>

        {/* Territory selector */}
        <select
          aria-label="Choisir un territoire"
          value={territory}
          onChange={(e) => setTerritory(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '0.5rem',
            color: '#e2e8f0',
            fontSize: '0.72rem',
            padding: '0.3rem 0.6rem',
            cursor: 'pointer',
          }}
        >
          {availableTerritories.map((code) => (
            <option key={code} value={code} style={{ background: '#0f2d52' }}>
              {TERRITORY_LABELS[code]?.flag ?? ''} {TERRITORY_LABELS[code]?.name ?? code}
            </option>
          ))}
        </select>
      </div>

      {/* ── Tab bar ── */}
      <div
        role="tablist"
        aria-label="Critère du palmarès"
        style={{
          display: 'flex',
          gap: '0.35rem',
          marginBottom: '0.85rem',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.7rem',
                fontWeight: isActive ? 700 : 500,
                border: isActive
                  ? '1px solid rgba(99,179,237,0.5)'
                  : '1px solid rgba(255,255,255,0.1)',
                background: isActive ? 'rgba(99,179,237,0.15)' : 'rgba(255,255,255,0.05)',
                color: isActive ? '#90cdf4' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.18s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Entries ── */}
      <div
        role="tabpanel"
        aria-label={TABS.find((t) => t.key === activeTab)?.label}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
      >
        {entries.map((entry, idx) => (
          <div
            key={entry.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.6rem 0.75rem',
              borderRadius: '0.75rem',
              background: idx === 0 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.04)',
              border:
                idx === 0 ? '1px solid rgba(251,191,36,0.2)' : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <span style={{ fontSize: '1.05rem', lineHeight: 1, flexShrink: 0 }}>
              {MEDAL[idx] ?? `${idx + 1}.`}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#f1f5f9',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {entry.name}
              </p>
              <p style={{ margin: 0, fontSize: '0.66rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                {entry.note}
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0.15rem',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: idx === 0 ? '#fbbf24' : '#e2e8f0',
                }}
              >
                {entry.score}
                <span style={{ fontSize: '0.6rem', color: '#64748b', marginLeft: '1px' }}>
                  /100
                </span>
              </span>
              <ChangeIcon change={entry.change} />
            </div>
          </div>
        ))}
      </div>

      <p
        style={{
          textAlign: 'center',
          fontSize: '0.63rem',
          color: '#475569',
          marginTop: '0.75rem',
          marginBottom: 0,
        }}
      >
        Source : Observatoire citoyen A KI PRI SA YÉ · mis à jour le {data.generatedAt}
      </p>
    </section>
  );
}
