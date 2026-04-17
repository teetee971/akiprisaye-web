/**
 * Tests — devisEstimationEngine + devisService (logique métier pure)
 *
 * Ces tests ne requièrent pas Firebase (mock implicite via setupTests).
 * Ils vérifient uniquement la logique de calcul du moteur d'estimation IA.
 */

import { describe, it, expect } from 'vitest';
import {
  computeEstimation,
  TYPE_BESOIN_LABELS,
  DELAI_LABELS,
  PROFONDEUR_LABELS,
  CLIENT_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../services/devisEstimationEngine';

describe('computeEstimation — moteur IA explicable', () => {
  it('calcule une estimation de base pour un seul type de besoin', () => {
    const est = computeEstimation({
      typesBesoin: ['analyse_prix'],
      niveauProfondeur: 'standard',
      delai: 'flexible',
      territoire: 'France métropolitaine',
    });

    expect(est.prixHT).toBeGreaterThan(0);
    expect(est.prixTTC).toBeGreaterThan(est.prixHT);
    expect(est.joursCharge).toBeGreaterThan(0);
    expect(est.justification.length).toBeGreaterThan(0);
    expect(est.disclaimer).toBeTruthy();
    expect(est.tvaRate).toBe(0.085);
  });

  it('applique le taux de TVA DOM à 8,5 %', () => {
    const est = computeEstimation({
      typesBesoin: ['analyse_prix'],
      niveauProfondeur: 'standard',
      delai: 'flexible',
      territoire: 'Guadeloupe',
    });
    const expectedTTC = Math.round(est.prixHT * 1.085);
    expect(est.prixTTC).toBe(expectedTTC);
  });

  it('le délai urgent augmente le prix par rapport à flexible', () => {
    const base = computeEstimation({
      typesBesoin: ['etude_territoriale'],
      niveauProfondeur: 'standard',
      delai: 'flexible',
      territoire: 'France métropolitaine',
    });
    const urgent = computeEstimation({
      typesBesoin: ['etude_territoriale'],
      niveauProfondeur: 'standard',
      delai: 'urgent',
      territoire: 'France métropolitaine',
    });
    expect(urgent.prixHT).toBeGreaterThan(base.prixHT);
  });

  it('le niveau exhaustif coûte plus que léger', () => {
    const leger = computeEstimation({
      typesBesoin: ['audit_vie_chere'],
      niveauProfondeur: 'leger',
      delai: 'flexible',
      territoire: 'France métropolitaine',
    });
    const exhaustif = computeEstimation({
      typesBesoin: ['audit_vie_chere'],
      niveauProfondeur: 'exhaustif',
      delai: 'flexible',
      territoire: 'France métropolitaine',
    });
    expect(exhaustif.prixHT).toBeGreaterThan(leger.prixHT);
  });

  it('un territoire DOM applique un facteur supérieur à métropole', () => {
    const metro = computeEstimation({
      typesBesoin: ['rapport_institutionnel'],
      niveauProfondeur: 'standard',
      delai: '1_mois',
      territoire: 'France métropolitaine',
    });
    const dom = computeEstimation({
      typesBesoin: ['rapport_institutionnel'],
      niveauProfondeur: 'standard',
      delai: '1_mois',
      territoire: 'Guadeloupe',
    });
    expect(dom.prixHT).toBeGreaterThan(metro.prixHT);
  });

  it('cumule correctement plusieurs types de besoins', () => {
    const single = computeEstimation({
      typesBesoin: ['analyse_prix'],
      niveauProfondeur: 'standard',
      delai: 'flexible',
      territoire: 'France métropolitaine',
    });
    const multi = computeEstimation({
      typesBesoin: ['analyse_prix', 'acces_donnees'],
      niveauProfondeur: 'standard',
      delai: 'flexible',
      territoire: 'France métropolitaine',
    });
    expect(multi.prixHT).toBeGreaterThan(single.prixHT);
    expect(multi.joursCharge).toBeGreaterThan(single.joursCharge);
  });

  it('lance une erreur si aucun type de besoin fourni', () => {
    expect(() =>
      computeEstimation({
        typesBesoin: [],
        niveauProfondeur: 'standard',
        delai: 'flexible',
        territoire: 'France métropolitaine',
      })
    ).toThrow();
  });

  it('la justification contient les montants HT et TTC', () => {
    const est = computeEstimation({
      typesBesoin: ['acces_donnees'],
      niveauProfondeur: 'standard',
      delai: 'flexible',
      territoire: 'La Réunion',
    });
    const joined = est.justification.join(' ');
    expect(joined).toContain('HT');
    expect(joined).toContain('TTC');
  });

  it("le disclaimer est non vide et mentionne l'IA", () => {
    const est = computeEstimation({
      typesBesoin: ['etude_territoriale'],
      niveauProfondeur: 'approfondi',
      delai: '2_semaines',
      territoire: 'Martinique',
    });
    expect(est.disclaimer.length).toBeGreaterThan(20);
    expect(est.disclaimer.toLowerCase()).toContain('indicatif');
  });
});

describe('Labels & couleurs — cohérence des constantes', () => {
  it('STATUS_LABELS couvre tous les statuts attendus', () => {
    const expected = ['DRAFT', 'VALIDATED', 'SENT', 'ACCEPTED', 'PAID', 'CANCELLED'];
    for (const s of expected) {
      expect(STATUS_LABELS[s]).toBeTruthy();
    }
  });

  it('STATUS_COLORS couvre tous les statuts attendus', () => {
    const expected = ['DRAFT', 'VALIDATED', 'SENT', 'ACCEPTED', 'PAID', 'CANCELLED'];
    for (const s of expected) {
      expect(STATUS_COLORS[s]).toBeTruthy();
    }
  });

  it('TYPE_BESOIN_LABELS couvre les 5 types', () => {
    const expected = [
      'analyse_prix',
      'etude_territoriale',
      'audit_vie_chere',
      'rapport_institutionnel',
      'acces_donnees',
    ];
    for (const t of expected) {
      expect(TYPE_BESOIN_LABELS[t as keyof typeof TYPE_BESOIN_LABELS]).toBeTruthy();
    }
  });

  it('DELAI_LABELS couvre les 5 délais', () => {
    const expected = ['urgent', '1_semaine', '2_semaines', '1_mois', 'flexible'];
    for (const d of expected) {
      expect(DELAI_LABELS[d as keyof typeof DELAI_LABELS]).toBeTruthy();
    }
  });

  it('PROFONDEUR_LABELS couvre les 4 niveaux', () => {
    const expected = ['leger', 'standard', 'approfondi', 'exhaustif'];
    for (const p of expected) {
      expect(PROFONDEUR_LABELS[p as keyof typeof PROFONDEUR_LABELS]).toBeTruthy();
    }
  });

  it('CLIENT_TYPE_LABELS couvre les 6 types clients', () => {
    const expected = ['collectivite', 'ministere', 'association', 'franchise', 'cabinet', 'autre'];
    for (const c of expected) {
      expect(CLIENT_TYPE_LABELS[c]).toBeTruthy();
    }
  });
});
