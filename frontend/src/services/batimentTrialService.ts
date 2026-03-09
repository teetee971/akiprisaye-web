/**
 * batimentTrialService.ts
 *
 * Gestion du freemium dégressive sur 7 jours pour le Calculateur du Bâtiment.
 *
 * Modèle dégressive :
 *   Jours 1-2  : quota illimité (20 calculs/jour)
 *   Jours 3-4  : 15 calculs/jour
 *   Jours 5-6  : 8 calculs/jour
 *   Jour  7    : 3 calculs/jour
 *   Jour  8+   : 0 (paywall — abonnement requis)
 *
 * Stockage : localStorage uniquement (pas de Firebase requis).
 */

const TRIAL_KEY = 'akp:batiment:trial';
const QUOTA_KEY = 'akp:batiment:quota';

export interface BatimentTrialState {
  /** Timestamp de début du trial (ms depuis epoch), ou null si pas encore commencé */
  startedAt: number | null;
  /** Jour du trial actuel (1–7), ou null si non commencé */
  trialDay: number | null;
  /** Quota journalier autorisé selon le jour */
  dailyQuota: number;
  /** Nombre de calculs utilisés aujourd'hui */
  usedToday: number;
  /** Calculs restants aujourd'hui */
  remainingToday: number;
  /** Trial actif (dans les 7 jours et quota > 0) */
  isActive: boolean;
  /** Trial expiré (> 7 jours) */
  isExpired: boolean;
  /** Nombre de jours restants dans le trial */
  daysLeft: number;
}

interface StoredTrial {
  startedAt: number;
}

interface StoredQuota {
  date: string; // ISO date 'YYYY-MM-DD'
  used: number;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Quota par jour de trial (index 0 = jour 1) */
const DAILY_QUOTAS = [20, 20, 15, 15, 8, 8, 3];

function getDailyQuota(trialDay: number): number {
  if (trialDay < 1 || trialDay > 7) return 0;
  return DAILY_QUOTAS[trialDay - 1] ?? 0;
}

export function getBatimentTrialState(): BatimentTrialState {
  try {
    const rawTrial = localStorage.getItem(TRIAL_KEY);
    const rawQuota = localStorage.getItem(QUOTA_KEY);

    const storedTrial: StoredTrial | null = rawTrial ? (JSON.parse(rawTrial) as StoredTrial) : null;

    if (!storedTrial) {
      return {
        startedAt: null,
        trialDay: null,
        dailyQuota: 0,
        usedToday: 0,
        remainingToday: 0,
        isActive: false,
        isExpired: false,
        daysLeft: 7,
      };
    }

    const daysDiff = Math.floor((Date.now() - storedTrial.startedAt) / (24 * 60 * 60 * 1000));
    const trialDay = daysDiff + 1; // day 1 = same day as start
    const isExpired = trialDay > 7;
    const dailyQuota = getDailyQuota(trialDay);
    const daysLeft = Math.max(0, 7 - daysDiff);

    const storedQuota: StoredQuota | null = rawQuota ? (JSON.parse(rawQuota) as StoredQuota) : null;
    const today = todayIso();
    const usedToday = storedQuota?.date === today ? storedQuota.used : 0;
    const remainingToday = Math.max(0, dailyQuota - usedToday);

    return {
      startedAt: storedTrial.startedAt,
      trialDay,
      dailyQuota,
      usedToday,
      remainingToday,
      isActive: !isExpired && remainingToday > 0,
      isExpired,
      daysLeft,
    };
  } catch {
    return {
      startedAt: null,
      trialDay: null,
      dailyQuota: 0,
      usedToday: 0,
      remainingToday: 0,
      isActive: false,
      isExpired: false,
      daysLeft: 7,
    };
  }
}

/**
 * Démarre le trial si ce n'est pas déjà fait.
 * Retourne le nouvel état.
 */
export function startBatimentTrial(): BatimentTrialState {
  try {
    const existing = localStorage.getItem(TRIAL_KEY);
    if (!existing) {
      const trial: StoredTrial = { startedAt: Date.now() };
      localStorage.setItem(TRIAL_KEY, JSON.stringify(trial));
    }
  } catch {
    // ignore
  }
  return getBatimentTrialState();
}

/**
 * Consomme 1 calcul du quota journalier.
 * Retourne le nouvel état et si le calcul est autorisé.
 */
export function consumeBatimentCalc(): { allowed: boolean; state: BatimentTrialState } {
  try {
    const state = getBatimentTrialState();
    if (!state.startedAt || state.isExpired || state.remainingToday <= 0) {
      return { allowed: false, state };
    }

    const today = todayIso();
    const newUsed = state.usedToday + 1;
    const quota: StoredQuota = { date: today, used: newUsed };
    localStorage.setItem(QUOTA_KEY, JSON.stringify(quota));

    const newState: BatimentTrialState = {
      ...state,
      usedToday: newUsed,
      remainingToday: Math.max(0, state.dailyQuota - newUsed),
      isActive: state.daysLeft > 0 && state.dailyQuota - newUsed > 0,
    };
    return { allowed: true, state: newState };
  } catch {
    return { allowed: false, state: getBatimentTrialState() };
  }
}

/** Réinitialise le trial (utile pour les tests) */
export function __test_resetBatimentTrial() {
  localStorage.removeItem(TRIAL_KEY);
  localStorage.removeItem(QUOTA_KEY);
}
