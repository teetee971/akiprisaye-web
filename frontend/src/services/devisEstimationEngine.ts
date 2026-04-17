/**
 * DevisEstimationEngine — Moteur d'estimation IA explicable
 *
 * ⚠️  L'IA n'engage pas juridiquement la plateforme.
 *     L'estimation est indicative et doit être validée par un humain
 *     avant tout envoi au client.
 *
 * Logique de calcul :
 *   - Tarif journalier de base selon le type de besoin
 *   - Multiplicateur de profondeur (léger → exhaustif)
 *   - Facteur territorial (complexité des données DROM-COM)
 *   - Facteur d'urgence (délai souhaité)
 *   - TVA DOM : 8,5 % (taux réduit applicable en Guadeloupe / Martinique / …)
 */

import type { TypeBesoin, DelaiSouhaite, NiveauProfondeur, DevisEstimation } from './devisService';
import { Timestamp } from 'firebase/firestore';

// ── Tarifs de base (€ HT / jour) ─────────────────────────────────────────────

const TARIF_BASE: Record<TypeBesoin, { jours: number; tarif: number; label: string }> = {
  analyse_prix: {
    jours: 2,
    tarif: 800,
    label: 'Analyse comparative des prix (2 j × 800 €)',
  },
  etude_territoriale: {
    jours: 5,
    tarif: 900,
    label: 'Étude territoriale complète (5 j × 900 €)',
  },
  audit_vie_chere: {
    jours: 4,
    tarif: 950,
    label: "Audit vie chère & pouvoir d'achat (4 j × 950 €)",
  },
  rapport_institutionnel: {
    jours: 3,
    tarif: 1000,
    label: 'Rapport institutionnel (3 j × 1 000 €)',
  },
  acces_donnees: {
    jours: 1,
    tarif: 600,
    label: 'Accès données brutes & API (1 j × 600 €)',
  },
};

// ── Multiplicateurs ───────────────────────────────────────────────────────────

const MULTIPLICATEUR_PROFONDEUR: Record<NiveauProfondeur, { factor: number; label: string }> = {
  leger: { factor: 0.6, label: 'Analyse légère (×0,6)' },
  standard: { factor: 1.0, label: 'Analyse standard (×1,0)' },
  approfondi: { factor: 1.5, label: 'Analyse approfondie (×1,5)' },
  exhaustif: { factor: 2.2, label: 'Analyse exhaustive (×2,2)' },
};

const FACTEUR_URGENCE: Record<DelaiSouhaite, { factor: number; label: string }> = {
  urgent: { factor: 1.5, label: 'Délai urgent <48 h (×1,5)' },
  '1_semaine': { factor: 1.25, label: 'Délai 1 semaine (×1,25)' },
  '2_semaines': { factor: 1.0, label: 'Délai 2 semaines (×1,0)' },
  '1_mois': { factor: 0.9, label: 'Délai 1 mois (×0,9)' },
  flexible: { factor: 0.85, label: 'Délai flexible (×0,85)' },
};

/** Facteur territorial — les territoires ultra-marins ont des données plus dispersées */
function facteurTerritorial(territoire: string): { factor: number; label: string } {
  const t = territoire.toLowerCase();
  if (
    t.includes('guadeloupe') ||
    t.includes('martinique') ||
    t.includes('réunion') ||
    t.includes('reunion') ||
    t.includes('mayotte') ||
    t.includes('guyane')
  ) {
    return { factor: 1.2, label: `Complexité DROM-COM (${territoire}) (×1,2)` };
  }
  if (t.includes('saint') || t.includes('calédonie') || t.includes('polynésie')) {
    return { factor: 1.3, label: `Complexité COM éloignée (${territoire}) (×1,3)` };
  }
  return { factor: 1.0, label: `Territoire métropolitain (×1,0)` };
}

// ── Calcul principal ──────────────────────────────────────────────────────────

export function computeEstimation(params: {
  typesBesoin: TypeBesoin[];
  niveauProfondeur: NiveauProfondeur;
  delai: DelaiSouhaite;
  territoire: string;
}): DevisEstimation {
  const { typesBesoin, niveauProfondeur, delai, territoire } = params;

  if (typesBesoin.length === 0) {
    throw new Error("Au moins un type de besoin est requis pour l'estimation");
  }

  const justification: string[] = [];
  let totalJours = 0;
  let totalHT = 0;

  // 1. Sum base costs for each need type
  for (const type of typesBesoin) {
    const base = TARIF_BASE[type];
    totalJours += base.jours;
    totalHT += base.jours * base.tarif;
    justification.push(`• ${base.label}`);
  }

  // 2. Depth multiplier
  const profondeur = MULTIPLICATEUR_PROFONDEUR[niveauProfondeur];
  totalHT = Math.round(totalHT * profondeur.factor);
  totalJours = Math.round(totalJours * profondeur.factor);
  justification.push(`• ${profondeur.label}`);

  // 3. Territory factor
  const territorial = facteurTerritorial(territoire);
  totalHT = Math.round(totalHT * territorial.factor);
  justification.push(`• ${territorial.label}`);

  // 4. Urgency factor
  const urgence = FACTEUR_URGENCE[delai];
  totalHT = Math.round(totalHT * urgence.factor);
  justification.push(`• ${urgence.label}`);

  // 5. TVA DOM 8.5%
  const tvaRate = 0.085;
  const prixTTC = Math.round(totalHT * (1 + tvaRate));

  // Derive a representative daily rate
  const tauxJournalier = totalJours > 0 ? Math.round(totalHT / totalJours) : 0;

  justification.push(`• Total HT : ${totalHT.toLocaleString('fr-FR')} €`);
  justification.push(
    `• TVA DOM 8,5 % : ${Math.round(totalHT * tvaRate).toLocaleString('fr-FR')} €`
  );
  justification.push(`• Total TTC : ${prixTTC.toLocaleString('fr-FR')} €`);

  return {
    joursCharge: totalJours,
    tauxJournalier,
    prixHT: totalHT,
    tvaRate,
    prixTTC,
    justification,
    generatedAt: Timestamp.now(),
    disclaimer:
      '⚠️ Cette estimation est générée automatiquement à titre indicatif. ' +
      "Elle n'engage pas juridiquement la plateforme A KI PRI SA YÉ. " +
      'Seul un devis signé par un responsable humain habilité a valeur contractuelle.',
  };
}

/** Labels lisibles pour l'UI */
export const TYPE_BESOIN_LABELS: Record<TypeBesoin, string> = {
  analyse_prix: 'Analyse des prix',
  etude_territoriale: 'Étude territoriale',
  audit_vie_chere: 'Audit vie chère',
  rapport_institutionnel: 'Rapport institutionnel',
  acces_donnees: 'Accès aux données',
};

export const DELAI_LABELS: Record<DelaiSouhaite, string> = {
  urgent: 'Urgent (< 48 h)',
  '1_semaine': '1 semaine',
  '2_semaines': '2 semaines',
  '1_mois': '1 mois',
  flexible: 'Flexible',
};

export const PROFONDEUR_LABELS: Record<NiveauProfondeur, string> = {
  leger: 'Légère',
  standard: 'Standard',
  approfondi: 'Approfondie',
  exhaustif: 'Exhaustive',
};

export const CLIENT_TYPE_LABELS: Record<string, string> = {
  collectivite: 'Collectivité locale',
  ministere: 'Ministère / Préfecture',
  association: 'Association',
  franchise: 'Groupe / Franchise',
  cabinet: "Cabinet d'étude",
  autre: 'Autre',
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'En attente de validation',
  VALIDATED: 'Validé',
  SENT: 'Envoyé au client',
  ACCEPTED: 'Accepté',
  PAID: 'Payé',
  CANCELLED: 'Annulé',
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  VALIDATED: 'bg-blue-100 text-blue-800',
  SENT: 'bg-indigo-100 text-indigo-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
};
