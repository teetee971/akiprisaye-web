/**
 * trialService.ts
 *
 * Gestion de l'essai gratuit 7 jours — stocké en localStorage.
 * Aucune donnée personnelle transmise côté serveur.
 *
 * Clés localStorage :
 *   akiprisaye-trial-plan    : PlanId en cours d'essai
 *   akiprisaye-trial-start   : timestamp ISO de début d'essai
 *   akiprisaye-trial-used    : boolean — true si essai déjà activé
 */

import type { PlanId } from '../billing/plans';

const KEY_PLAN = 'akiprisaye-trial-plan';
const KEY_START = 'akiprisaye-trial-start';
const KEY_USED = 'akiprisaye-trial-used';

const TRIAL_DAYS = 7;

export interface TrialStatus {
  active: boolean; // essai en cours
  used: boolean; // essai déjà utilisé (expiré ou actif)
  plan: PlanId | null; // plan de l'essai
  daysLeft: number; // jours restants (0 si expiré)
  startedAt: Date | null;
  expiresAt: Date | null;
}

/** Démarre un essai 7 jours pour un plan donné. Retourne false si essai déjà utilisé. */
export function startTrial(plan: PlanId): boolean {
  try {
    if (localStorage.getItem(KEY_USED) === 'true') return false;
    const now = new Date().toISOString();
    localStorage.setItem(KEY_PLAN, plan);
    localStorage.setItem(KEY_START, now);
    localStorage.setItem(KEY_USED, 'true');
    return true;
  } catch {
    return false;
  }
}

/** Retourne le statut courant de l'essai. */
export function getTrialStatus(): TrialStatus {
  try {
    const used = localStorage.getItem(KEY_USED) === 'true';
    const planRaw = localStorage.getItem(KEY_PLAN) as PlanId | null;
    const startRaw = localStorage.getItem(KEY_START);

    if (!used || !planRaw || !startRaw) {
      return {
        active: false,
        used: false,
        plan: null,
        daysLeft: 0,
        startedAt: null,
        expiresAt: null,
      };
    }

    const startedAt = new Date(startRaw);
    const expiresAt = new Date(startedAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const now = new Date();
    const msLeft = expiresAt.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    const active = daysLeft > 0;

    return { active, used: true, plan: planRaw, daysLeft, startedAt, expiresAt };
  } catch {
    return {
      active: false,
      used: false,
      plan: null,
      daysLeft: 0,
      startedAt: null,
      expiresAt: null,
    };
  }
}

/** Annule / réinitialise l'essai (admin/test uniquement). */
export function resetTrial(): void {
  try {
    localStorage.removeItem(KEY_PLAN);
    localStorage.removeItem(KEY_START);
    localStorage.removeItem(KEY_USED);
  } catch {
    /* noop */
  }
}

/** Vrai si l'utilisateur peut encore activer un essai (jamais utilisé). */
export function canStartTrial(): boolean {
  try {
    return localStorage.getItem(KEY_USED) !== 'true';
  } catch {
    return true;
  }
}
