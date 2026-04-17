/**
 * useVisitorStats — Statistiques visiteurs temps réel par territoire et centres d'intérêt
 *
 * Utilise Firestore pour :
 *   - Enregistrer la présence (collection `presence/{sessionId}`)
 *   - Compter les visites par territoire (collection `visit_stats/{territory}`)
 *   - Compter les visites par section/intérêt (collection `page_stats/{categoryKey}`)
 *
 * Détection territoire : fuseau horaire IANA → code territoire
 * Détection intérêt   : pathname → catégorie sémantique
 */

import { useEffect, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { TERRITORIES } from '../constants/territories';

// ── Territory detection ───────────────────────────────────────────────────────

/** Map IANA timezone → territory code */
const TIMEZONE_TO_TERRITORY: Record<string, string> = Object.values(TERRITORIES).reduce(
  (acc, t) => {
    if (t.timezone) acc[t.timezone] = t.code;
    return acc;
  },
  {} as Record<string, string>
);

function detectTerritory(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_TO_TERRITORY[tz] ?? 'other';
  } catch {
    return 'other';
  }
}

// ── Interest / page category detection ───────────────────────────────────────

export interface PageCategory {
  key: string;
  name: string;
  emoji: string;
  description: string;
}

const INTEREST_KEY_ALIASES: Record<string, string> = {
  scan: 'scanner',
};

function normalizeInterestKey(key: string): string {
  return INTEREST_KEY_ALIASES[key] ?? key;
}

/**
 * Ordered list of page categories. The first matching prefix wins.
 * Keep more specific prefixes before generic ones.
 */
export const PAGE_CATEGORIES: PageCategory[] = [
  {
    key: 'comparateur',
    name: 'Comparateur de prix',
    emoji: '🛒',
    description: 'Comparer les prix entre enseignes',
  },
  {
    key: 'scanner',
    name: 'Scanner / Codes-barres',
    emoji: '📷',
    description: 'Scan EAN & OCR tickets',
  },
  {
    key: 'observatoire',
    name: 'Observatoire des prix',
    emoji: '📊',
    description: 'Données & tendances prix',
  },
  {
    key: 'actualites',
    name: 'Actualités',
    emoji: '📰',
    description: 'Info vie chère & territoires',
  },
  { key: 'carte', name: 'Carte & Magasins', emoji: '🗺️', description: 'Trouver un magasin' },
  { key: 'liste', name: 'Liste de courses', emoji: '📝', description: 'Gérer sa liste GPS' },
  {
    key: 'alertes',
    name: 'Alertes prix',
    emoji: '🔔',
    description: 'Notifications baisse de prix',
  },
  { key: 'assistant', name: 'Assistant IA', emoji: '🤖', description: 'Conseils IA personnalisés' },
  { key: 'contribuer', name: 'Contribuer', emoji: '✍️', description: 'Partager des prix citoyens' },
  {
    key: 'groupes-parole',
    name: 'Groupes de Parole',
    emoji: '💬',
    description: 'Échanges citoyens',
  },
  { key: 'messagerie', name: 'Messagerie', emoji: '✉️', description: 'Messages entre citoyens' },
  {
    key: 'solidarite',
    name: 'Solidarité & Entraide',
    emoji: '🤝',
    description: 'Ti Panié & entraide',
  },
  { key: 'ti-panie', name: 'Ti Panié Solidaire', emoji: '🧺', description: 'Paniers anti-gaspi' },
  { key: 'vie-chere', name: 'Lutte Vie Chère', emoji: '✊', description: 'Mobilisation & actions' },
  { key: 'devis', name: 'Devis IA', emoji: '📋', description: 'Estimations travaux & services' },
  {
    key: 'comparateurs',
    name: 'Hub Comparateurs',
    emoji: '🔍',
    description: 'Vols, carburants, télécoms…',
  },
  { key: 'territoire', name: 'Hub Territorial', emoji: '🏝️', description: 'Pages par territoire' },
  { key: 'espace-pro', name: 'Espace Pro', emoji: '🏪', description: 'Outils professionnels' },
  {
    key: 'marketplace',
    name: 'Marketplace Enseignes',
    emoji: '🏬',
    description: 'Partenaires & enseignes',
  },
  { key: 'budget', name: 'Budget & Finances', emoji: '💰', description: 'Budget familial & vital' },
  { key: 'inscription', name: 'Inscription', emoji: '👤', description: 'Créer un compte' },
  { key: 'connexion', name: 'Connexion', emoji: '🔑', description: 'Se connecter' },
  { key: 'faq', name: 'FAQ & Aide', emoji: '❓', description: 'Questions fréquentes' },
  { key: 'contact', name: 'Contact', emoji: '📨', description: 'Nous contacter' },
  { key: 'methodologie', name: 'Méthodologie', emoji: '📐', description: 'Comment on travaille' },
];

/** Returns the PageCategory for the given pathname, or null for home/unknown */
export function getPageCategory(pathname: string): PageCategory | null {
  // Strip leading slash and base URL segment, lowercase
  const cleaned = pathname
    .replace(/^\/akiprisaye-web\//, '/')
    .replace(/^\/+/, '')
    .toLowerCase();
  if (!cleaned || cleaned === '' || cleaned === 'home') return null; // home is not an "interest"

  if (cleaned === 'scan' || cleaned.startsWith('scan/') || cleaned.startsWith('scan-')) {
    const scannerCategory = PAGE_CATEGORIES.find((cat) => cat.key === 'scanner');
    if (scannerCategory) return scannerCategory;
  }

  for (const cat of PAGE_CATEGORIES) {
    if (
      cleaned === cat.key ||
      cleaned.startsWith(`${cat.key}/`) ||
      cleaned.startsWith(`${cat.key}-`)
    ) {
      return cat;
    }
  }
  return null;
}

// ── Session ID (stable per browser tab) ──────────────────────────────────────

function getSessionId(): string {
  const KEY = 'akp_sid';
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TerritoryStats {
  code: string;
  name: string;
  flag: string;
  online: number;
  totalVisits: number;
  /** Top interests currently active in this territory (real-time) */
  topInterests: Array<{ key: string; name: string; emoji: string; online: number }>;
}

export interface InterestStats {
  key: string;
  name: string;
  emoji: string;
  description: string;
  /** Users on this section right now */
  online: number;
  /** All-time page view count */
  totalViews: number;
}

/** Per-territory, per-interest persistent view count (from territory_interest_stats) */
export interface TerritoryInterestStat {
  territory: string;
  interest: string;
  name: string;
  emoji: string;
  totalViews: number;
}

export interface VisitorStats {
  /** Total users seen in the last 5 minutes */
  totalOnline: number;
  /** Ranked list of territories with online + total visit counts */
  byTerritory: TerritoryStats[];
  /** Ranked list of page/interest categories */
  byInterest: InterestStats[];
  /**
   * Historical per-territory interest counts, keyed by territory code.
   * Used by AdminAudience for the cross-reference matrix.
   */
  interestByTerritory: Record<string, TerritoryInterestStat[]>;
  loading: boolean;
  /** Territory detected for the current browser session */
  myTerritory: string;
  /** Current page category detected for this session */
  myInterest: PageCategory | null;
  /** Latest visitor presence heartbeat seen in Firestore */
  lastPresenceAt: Date | null;
  /** Latest territory visit counter update */
  lastVisitAt: Date | null;
  /** Latest page/interest view counter update */
  lastInterestViewAt: Date | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVisitorStats(): VisitorStats {
  const [totalOnline, setTotalOnline] = useState(0);
  const [onlineByTerritory, setOnlineByTerritory] = useState<Record<string, number>>({});
  const [visitsByTerritory, setVisitsByTerritory] = useState<Record<string, number>>({});
  const [onlineByInterest, setOnlineByInterest] = useState<Record<string, number>>({});
  const [viewsByInterest, setViewsByInterest] = useState<Record<string, number>>({});
  const [lastPresenceAt, setLastPresenceAt] = useState<Date | null>(null);
  const [lastVisitAt, setLastVisitAt] = useState<Date | null>(null);
  const [lastInterestViewAt, setLastInterestViewAt] = useState<Date | null>(null);
  /** real-time: territory → { interestKey → count } */
  const [onlineInterestByTerritory, setOnlineInterestByTerritory] = useState<
    Record<string, Record<string, number>>
  >({});
  /** historical: from territory_interest_stats collection */
  const [interestByTerritoryRaw, setInterestByTerritoryRaw] = useState<
    Record<string, TerritoryInterestStat[]>
  >({});
  const [loading, setLoading] = useState(true);

  const myTerritory = useRef(detectTerritory());
  const myInterest = useRef<PageCategory | null>(
    typeof window !== 'undefined' ? getPageCategory(window.location.pathname) : null
  );
  const sessionId = useRef(getSessionId());
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const territory = myTerritory.current;
    const interest = myInterest.current;
    const sid = sessionId.current;
    const presenceRef = doc(db, 'presence', sid);
    const visitStatsRef = doc(db, 'visit_stats', territory === 'other' ? '_other' : territory);

    // ── 1. Register/refresh presence ──────────────────────────────────────────
    const updatePresence = () => {
      const page = typeof window !== 'undefined' ? window.location.pathname : '/';
      // Re-detect interest on each refresh (user may have navigated)
      const currentInterest = getPageCategory(page);
      setDoc(
        presenceRef,
        {
          territory,
          page,
          interest: currentInterest?.key ?? '_home',
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
    };

    // ── 2. Count visit (once per session per territory) ───────────────────────
    const countVisit = () => {
      const visitKey = `akp_v_${territory}_${new Date().toDateString()}`;
      try {
        if (!sessionStorage.getItem(visitKey)) {
          sessionStorage.setItem(visitKey, '1');
          setDoc(
            visitStatsRef,
            { totalVisits: increment(1), lastVisit: serverTimestamp() },
            { merge: true }
          ).catch(() => {});
        }
      } catch {
        // localStorage unavailable — silently skip
      }
    };

    // ── 3. Count page view per interest (once per session per category) ───────
    const countPageView = () => {
      if (!interest) return;
      const viewKey = `akp_pv_${interest.key}_${new Date().toDateString()}`;
      try {
        if (!sessionStorage.getItem(viewKey)) {
          sessionStorage.setItem(viewKey, '1');
          // Global interest counter
          setDoc(
            doc(db!, 'page_stats', interest.key),
            {
              totalViews: increment(1),
              name: interest.name,
              emoji: interest.emoji,
              lastView: serverTimestamp(),
            },
            { merge: true }
          ).catch(() => {});
          // Per-territory interest counter (enables the territory × interest matrix)
          const tiKey = `${territory === 'other' ? '_other' : territory}_${interest.key}`;
          setDoc(
            doc(db!, 'territory_interest_stats', tiKey),
            {
              territory: territory === 'other' ? '_other' : territory,
              interest: interest.key,
              name: interest.name,
              emoji: interest.emoji,
              totalViews: increment(1),
              lastView: serverTimestamp(),
            },
            { merge: true }
          ).catch(() => {});
        }
      } catch {
        // silently skip
      }
    };

    updatePresence();
    countVisit();
    countPageView();

    // Refresh presence every 30 s so the session stays "online"
    refreshRef.current = setInterval(updatePresence, 30_000);

    // ── 4. Subscribe to presence collection ───────────────────────────────────
    const unsubPresence = onSnapshot(
      collection(db, 'presence'),
      (snap) => {
        const now = Date.now();
        const fiveMinAgo = now - 5 * 60 * 1000;
        const territCounts: Record<string, number> = {};
        const intCounts: Record<string, number> = {};
        const territInterest: Record<string, Record<string, number>> = {};
        let total = 0;
        let latestPresence: Date | null = null;

        snap.forEach((d) => {
          const data = d.data();
          const lastSeen = data.lastSeen as Timestamp | null;
          if (lastSeen && lastSeen.toMillis() > fiveMinAgo) {
            const t = (data.territory as string) || '_other';
            territCounts[t] = (territCounts[t] ?? 0) + 1;

            const iKey = normalizeInterestKey((data.interest as string) || '_home');
            if (iKey !== '_home') {
              intCounts[iKey] = (intCounts[iKey] ?? 0) + 1;
              // Cross-reference: territory × interest
              if (!territInterest[t]) territInterest[t] = {};
              territInterest[t][iKey] = (territInterest[t][iKey] ?? 0) + 1;
            }
            if (!latestPresence || lastSeen.toMillis() > latestPresence.getTime()) {
              latestPresence = lastSeen.toDate();
            }
            total++;
          }
        });

        setOnlineByTerritory(territCounts);
        setOnlineByInterest(intCounts);
        setOnlineInterestByTerritory(territInterest);
        setTotalOnline(total);
        setLastPresenceAt(latestPresence);
        setLoading(false);
      },
      () => setLoading(false)
    );

    // ── 5. Subscribe to visit_stats collection ────────────────────────────────
    const unsubVisits = onSnapshot(
      collection(db, 'visit_stats'),
      (snap) => {
        const visits: Record<string, number> = {};
        let latestVisit: Date | null = null;
        snap.forEach((d) => {
          visits[d.id] = (d.data().totalVisits as number) ?? 0;
          const lastVisit = d.data().lastVisit as Timestamp | null;
          if (lastVisit && (!latestVisit || lastVisit.toMillis() > latestVisit.getTime())) {
            latestVisit = lastVisit.toDate();
          }
        });
        setVisitsByTerritory(visits);
        setLastVisitAt(latestVisit);
      },
      () => {}
    );

    // ── 6. Subscribe to page_stats collection ─────────────────────────────────
    const unsubPageStats = onSnapshot(
      collection(db, 'page_stats'),
      (snap) => {
        const views: Record<string, number> = {};
        let latestView: Date | null = null;
        snap.forEach((d) => {
          const key = normalizeInterestKey(d.id);
          views[key] = (views[key] ?? 0) + ((d.data().totalViews as number) ?? 0);
          const lastView = d.data().lastView as Timestamp | null;
          if (lastView && (!latestView || lastView.toMillis() > latestView.getTime())) {
            latestView = lastView.toDate();
          }
        });
        setViewsByInterest(views);
        setLastInterestViewAt(latestView);
      },
      () => {}
    );

    // ── 7. Subscribe to territory_interest_stats collection ───────────────────
    const unsubTerritoryInterest = onSnapshot(
      collection(db, 'territory_interest_stats'),
      (snap) => {
        const byTerritory: Record<string, TerritoryInterestStat[]> = {};
        snap.forEach((d) => {
          const data = d.data();
          const t = data.territory as string;
          const interest = normalizeInterestKey((data.interest as string) || '');
          if (!byTerritory[t]) byTerritory[t] = [];

          const existing = byTerritory[t].find((entry) => entry.interest === interest);
          if (existing) {
            existing.totalViews += (data.totalViews as number) ?? 0;
          } else {
            const cat = PAGE_CATEGORIES.find((c) => c.key === interest);
            byTerritory[t].push({
              territory: t,
              interest,
              name: cat?.name || (data.name as string) || interest,
              emoji: cat?.emoji || (data.emoji as string) || '📄',
              totalViews: (data.totalViews as number) ?? 0,
            });
          }
        });
        // Sort each territory's interests by totalViews descending
        for (const t of Object.keys(byTerritory)) {
          byTerritory[t].sort((a, b) => b.totalViews - a.totalViews);
        }
        setInterestByTerritoryRaw(byTerritory);
      },
      () => {}
    );

    // ── Cleanup ───────────────────────────────────────────────────────────────
    const cleanup = () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
      unsubPresence();
      unsubVisits();
      unsubPageStats();
      unsubTerritoryInterest();
      deleteDoc(presenceRef).catch(() => {});
    };

    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, []);

  // ── Build sorted territory list ───────────────────────────────────────────
  const knownTerritories = Object.values(TERRITORIES).map((t) => {
    const rtInterests = onlineInterestByTerritory[t.code] ?? {};
    const topInterests = Object.entries(rtInterests)
      .map(([key, count]) => {
        const cat = PAGE_CATEGORIES.find((c) => c.key === key) ?? { key, name: key, emoji: '📄' };
        return { key, name: cat.name, emoji: cat.emoji, online: count };
      })
      .sort((a, b) => b.online - a.online)
      .slice(0, 5);
    return {
      code: t.code,
      name: t.name,
      flag: t.flag,
      online: onlineByTerritory[t.code] ?? 0,
      totalVisits: visitsByTerritory[t.code] ?? 0,
      topInterests,
    } satisfies TerritoryStats;
  });

  const otherOnline = onlineByTerritory['_other'] ?? 0;
  const otherVisits = visitsByTerritory['_other'] ?? 0;
  const otherRtInterests = onlineInterestByTerritory['_other'] ?? {};
  const otherTopInterests = Object.entries(otherRtInterests)
    .map(([key, count]) => {
      const cat = PAGE_CATEGORIES.find((c) => c.key === key) ?? { key, name: key, emoji: '📄' };
      return { key, name: cat.name, emoji: cat.emoji, online: count };
    })
    .sort((a, b) => b.online - a.online)
    .slice(0, 5);

  const otherEntry: TerritoryStats[] =
    otherOnline > 0 || otherVisits > 0
      ? [
          {
            code: '_other',
            name: 'Autre / Métropole',
            flag: '🌍',
            online: otherOnline,
            totalVisits: otherVisits,
            topInterests: otherTopInterests,
          },
        ]
      : [];

  const byTerritory: TerritoryStats[] = [...knownTerritories, ...otherEntry]
    .filter((t) => t.online > 0 || t.totalVisits > 0)
    .sort((a, b) => b.online - a.online || b.totalVisits - a.totalVisits);

  // ── Build sorted interest list ────────────────────────────────────────────
  // Merge known categories with any data from Firestore
  const allInterestKeys = new Set([
    ...PAGE_CATEGORIES.map((c) => c.key),
    ...Object.keys(onlineByInterest),
    ...Object.keys(viewsByInterest),
  ]);

  const byInterest: InterestStats[] = Array.from(allInterestKeys)
    .map((key) => {
      const cat = PAGE_CATEGORIES.find((c) => c.key === key) ?? {
        key,
        name: key,
        emoji: '📄',
        description: '',
      };
      return {
        key,
        name: cat.name,
        emoji: cat.emoji,
        description: cat.description,
        online: onlineByInterest[key] ?? 0,
        totalViews: viewsByInterest[key] ?? 0,
      };
    })
    .filter((i) => i.online > 0 || i.totalViews > 0)
    .sort((a, b) => b.online - a.online || b.totalViews - a.totalViews);

  // ── Merge real-time + historical interest data per territory ──────────────
  const interestByTerritory: Record<string, TerritoryInterestStat[]> = {};

  // Start from historical data
  for (const [t, stats] of Object.entries(interestByTerritoryRaw)) {
    interestByTerritory[t] = [...stats];
  }

  // Overlay real-time online counts (update or add entries)
  for (const [t, intMap] of Object.entries(onlineInterestByTerritory)) {
    if (!interestByTerritory[t]) interestByTerritory[t] = [];
    for (const [iKey, onlineCount] of Object.entries(intMap)) {
      const existing = interestByTerritory[t].find((s) => s.interest === iKey);
      if (existing) {
        // totalViews already set from Firestore — just keep it
      } else {
        const cat = PAGE_CATEGORIES.find((c) => c.key === iKey) ?? {
          key: iKey,
          name: iKey,
          emoji: '📄',
        };
        interestByTerritory[t].push({
          territory: t,
          interest: iKey,
          name: cat.name,
          emoji: cat.emoji,
          totalViews: onlineCount, // best-effort until Firestore catches up
        });
      }
    }
    interestByTerritory[t].sort((a, b) => b.totalViews - a.totalViews);
  }

  return {
    totalOnline,
    byTerritory,
    byInterest,
    interestByTerritory,
    loading,
    myTerritory: myTerritory.current,
    myInterest: myInterest.current,
    lastPresenceAt,
    lastVisitAt,
    lastInterestViewAt,
  };
}
