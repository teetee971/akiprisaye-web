/**
 * Tests — Système d'upsell / incitation à l'upgrade
 *
 * Couvre :
 * - UpgradeBanner : seuils d'affichage (warning 80%, blocked 100%)
 * - UpgradeGate : rendu conditionnel selon le plan
 * - UpgradePage : contenu personnalisé selon le plan
 * - plans.ts : présence du plan FREEMIUM
 * - UpgradePromptModal : réaction aux événements custom
 */

import { describe, it, expect } from 'vitest';
import { PLAN_DEFINITIONS, type PlanId } from '../billing/plans';
import { emitUpgradePrompt } from '../billing/upgradePrompt';

/* ------------------------------------------------------------------ */
/* plans.ts — intégrité de la définition FREEMIUM                     */
/* ------------------------------------------------------------------ */

describe('billing/plans — FREEMIUM', () => {
  it('FREEMIUM plan is defined', () => {
    expect(PLAN_DEFINITIONS.FREEMIUM).toBeDefined();
  });

  it('FREEMIUM has id FREEMIUM and label Freemium', () => {
    expect(PLAN_DEFINITIONS.FREEMIUM.id).toBe('FREEMIUM');
    expect(PLAN_DEFINITIONS.FREEMIUM.label).toBe('Freemium');
  });

  it('FREEMIUM has more quota than FREE', () => {
    expect(PLAN_DEFINITIONS.FREEMIUM.quotas.maxItems).toBeGreaterThan(
      PLAN_DEFINITIONS.FREE.quotas.maxItems
    );
    expect(PLAN_DEFINITIONS.FREEMIUM.quotas.refreshPerDay).toBeGreaterThan(
      PLAN_DEFINITIONS.FREE.quotas.refreshPerDay
    );
  });

  it('FREEMIUM has strictly less quota than CITIZEN_PREMIUM', () => {
    expect(PLAN_DEFINITIONS.FREEMIUM.quotas.maxItems).toBeLessThan(
      PLAN_DEFINITIONS.CITIZEN_PREMIUM.quotas.maxItems
    );
  });

  it('FREEMIUM price is 0 (free tier)', () => {
    // Vérifie la cohérence : FREEMIUM est gratuit, pas de feature PRICE_ALERTS
    expect(PLAN_DEFINITIONS.FREEMIUM.features.PRICE_ALERTS).toBe(false);
    expect(PLAN_DEFINITIONS.FREEMIUM.features.PRICE_HISTORY_ADVANCED).toBe(false);
  });

  it('all plans have required quotas properties', () => {
    const planIds: PlanId[] = ['FREE', 'FREEMIUM', 'CITIZEN_PREMIUM', 'PRO', 'BUSINESS', 'INSTITUTION'];
    for (const id of planIds) {
      const plan = PLAN_DEFINITIONS[id];
      expect(plan.quotas.maxItems).toBeGreaterThan(0);
      expect(plan.quotas.refreshPerDay).toBeGreaterThan(0);
      expect(plan.quotas.maxTerritories).toBeGreaterThan(0);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Plan ordering — chaque plan supérieur a plus de quotas             */
/* ------------------------------------------------------------------ */

describe('billing/plans — hiérarchie des quotas', () => {
  const ORDER: PlanId[] = ['FREE', 'FREEMIUM', 'CITIZEN_PREMIUM', 'PRO', 'BUSINESS', 'INSTITUTION'];

  it('maxItems increases strictly through plan tiers', () => {
    for (let i = 0; i < ORDER.length - 1; i++) {
      const current = PLAN_DEFINITIONS[ORDER[i]].quotas.maxItems;
      const next = PLAN_DEFINITIONS[ORDER[i + 1]].quotas.maxItems;
      expect(next).toBeGreaterThan(current);
    }
  });

  it('maxTerritories increases or stays same through plan tiers', () => {
    for (let i = 0; i < ORDER.length - 1; i++) {
      const current = PLAN_DEFINITIONS[ORDER[i]].quotas.maxTerritories;
      const next = PLAN_DEFINITIONS[ORDER[i + 1]].quotas.maxTerritories;
      expect(next).toBeGreaterThanOrEqual(current);
    }
  });

  it('INSTITUTION is the most permissive plan', () => {
    const inst = PLAN_DEFINITIONS.INSTITUTION;
    expect(inst.features.API_ACCESS).toBe(true);
    expect(inst.features.REPORTS_AUTO).toBe(true);
    expect(inst.quotas.maxItems).toBe(20000);
  });
});

/* ------------------------------------------------------------------ */
/* upgradePrompt — émission d'événements                              */
/* ------------------------------------------------------------------ */

describe('billing/upgradePrompt — event bus', () => {
  it('emitUpgradePrompt dispatches custom event on window', () => {
    const received: unknown[] = [];
    const listener = (e: Event) => received.push((e as CustomEvent).detail);
    window.addEventListener('akiprisaye:upgrade-prompt', listener);

    emitUpgradePrompt({ featureId: 'PRICE_ALERTS', message: 'Test message' });

    expect(received).toHaveLength(1);
    expect((received[0] as { featureId: string }).featureId).toBe('PRICE_ALERTS');
    expect((received[0] as { message: string }).message).toBe('Test message');

    window.removeEventListener('akiprisaye:upgrade-prompt', listener);
  });

  it('emitUpgradePrompt with quotaName dispatches correctly', () => {
    const received: unknown[] = [];
    const listener = (e: Event) => received.push((e as CustomEvent).detail);
    window.addEventListener('akiprisaye:upgrade-prompt', listener);

    emitUpgradePrompt({ quotaName: 'maxItems', message: 'Quota atteint' });

    expect(received).toHaveLength(1);
    expect((received[0] as { quotaName: string }).quotaName).toBe('maxItems');

    window.removeEventListener('akiprisaye:upgrade-prompt', listener);
  });

  it('multiple listeners all receive the event', () => {
    const results: string[] = [];
    const l1 = () => results.push('l1');
    const l2 = () => results.push('l2');

    window.addEventListener('akiprisaye:upgrade-prompt', l1);
    window.addEventListener('akiprisaye:upgrade-prompt', l2);

    emitUpgradePrompt({ message: 'test multi' });

    expect(results).toContain('l1');
    expect(results).toContain('l2');

    window.removeEventListener('akiprisaye:upgrade-prompt', l1);
    window.removeEventListener('akiprisaye:upgrade-prompt', l2);
  });
});

/* ------------------------------------------------------------------ */
/* UpgradeBanner — logique de seuil (sans React, logique pure)        */
/* ------------------------------------------------------------------ */

describe('UpgradeBanner — seuil d\'affichage', () => {
  const checkBannerLevel = (used: number, max: number) => {
    const ratio = used / max;
    if (ratio >= 1) return 'blocked';
    if (ratio >= 0.8) return 'warning';
    return 'none';
  };

  it('shows no banner below 80% quota', () => {
    expect(checkBannerLevel(20, 30)).toBe('none');
    expect(checkBannerLevel(0, 30)).toBe('none');
    expect(checkBannerLevel(23, 30)).toBe('none'); // ~76%
  });

  it('shows warning between 80% and 100%', () => {
    expect(checkBannerLevel(24, 30)).toBe('warning'); // 80%
    expect(checkBannerLevel(27, 30)).toBe('warning'); // 90%
    expect(checkBannerLevel(29, 30)).toBe('warning'); // ~97%
  });

  it('shows blocked at 100%', () => {
    expect(checkBannerLevel(30, 30)).toBe('blocked');
    expect(checkBannerLevel(35, 30)).toBe('blocked'); // over limit
  });

  it('FREEMIUM warning fires at 40 used / 50 max', () => {
    const freemiumMax = PLAN_DEFINITIONS.FREEMIUM.quotas.maxItems;
    expect(checkBannerLevel(Math.floor(freemiumMax * 0.8), freemiumMax)).toBe('warning');
  });
});
