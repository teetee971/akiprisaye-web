/**
 * Funding Service
 * Simulates training financing options
 */

import type {
  TrainingProgram,
  UserProfile,
  FundingSimulation,
  FundingSource,
} from '../types/trainingComparison';

/**
 * Simulate funding options for a training
 */
export async function simulateFunding(
  training: TrainingProgram,
  profile: UserProfile
): Promise<FundingSimulation> {
  const catalogPrice = training.pricing.catalogPrice;
  let cpfAmount = 0;
  let poleEmploiAmount = 0;
  let regionAmount = 0;
  const otherAmount = 0;

  // CPF calculation
  if (training.pricing.cpfEligible && profile.cpfBalance) {
    cpfAmount = Math.min(profile.cpfBalance, catalogPrice);
  }

  // Pôle Emploi calculation
  if (training.pricing.poleEmploiEligible && profile.currentStatus === 'unemployed') {
    const maxAIF = 3000; // AIF max estimate
    const remaining = catalogPrice - cpfAmount;
    poleEmploiAmount = Math.min(maxAIF, remaining);
  }

  // Region aid calculation
  if (training.pricing.regionAidAvailable) {
    const maxRegion = 2000; // Regional aid estimate
    const remaining = catalogPrice - cpfAmount - poleEmploiAmount;
    regionAmount = Math.min(maxRegion, remaining * 0.5);
  }

  const remainingCost = Math.max(
    0,
    catalogPrice - cpfAmount - poleEmploiAmount - regionAmount - otherAmount
  );

  const eligibility = getEligibility(training, profile);
  const steps = getFundingSteps(training, profile, eligibility);

  return {
    training,
    userProfile: profile,
    breakdown: {
      catalogPrice,
      cpf: cpfAmount,
      poleEmploi: poleEmploiAmount,
      region: regionAmount,
      other: otherAmount,
      remainingCost,
    },
    eligibility,
    steps,
  };
}

/**
 * Get CPF balance (mock - would connect to real API)
 */
export async function getCPFBalance(userId: string): Promise<number> {
  // In production, this would call the CPF API
  // For now, return a mock value
  return 1500; // Default CPF balance estimate
}

/**
 * Get eligible funding sources for user profile
 */
export function getEligibleFunding(profile: UserProfile): FundingSource[] {
  const sources: FundingSource[] = [];

  // CPF available for employed and unemployed
  if (profile.currentStatus === 'employed' || profile.currentStatus === 'unemployed') {
    sources.push('CPF');
  }

  // Pôle Emploi for unemployed
  if (profile.currentStatus === 'unemployed') {
    sources.push('pole_emploi');
  }

  // Region aids available for all
  sources.push('region');

  // OPCO for employed
  if (profile.currentStatus === 'employed') {
    sources.push('OPCO');
  }

  // Self-funding always available
  sources.push('autofinancement');

  return sources;
}

/**
 * Check eligibility for different funding sources
 */
function getEligibility(training: TrainingProgram, profile: UserProfile) {
  const details: string[] = [];

  const cpfEligible = training.pricing.cpfEligible;
  if (cpfEligible) {
    details.push('✓ Formation éligible au CPF');
    if (profile.cpfBalance) {
      details.push(`✓ Solde CPF disponible: ${profile.cpfBalance}€`);
    }
  } else {
    details.push('✗ Formation non éligible au CPF');
  }

  const poleEmploiEligible =
    training.pricing.poleEmploiEligible && profile.currentStatus === 'unemployed';
  if (poleEmploiEligible) {
    details.push('✓ Éligible aux aides Pôle Emploi (AIF, AFPR, POE)');
  } else if (profile.currentStatus !== 'unemployed') {
    details.push("✗ Aides Pôle Emploi réservées aux demandeurs d'emploi");
  }

  const regionEligible = training.pricing.regionAidAvailable;
  if (regionEligible) {
    details.push('✓ Aides régionales disponibles');
  } else {
    details.push("✗ Pas d'aide régionale identifiée pour cette formation");
  }

  return {
    cpf: cpfEligible,
    poleEmploi: poleEmploiEligible,
    region: regionEligible,
    details,
  };
}

/**
 * Get step-by-step funding procedure
 */
function getFundingSteps(
  training: TrainingProgram,
  profile: UserProfile,
  eligibility: { cpf: boolean; poleEmploi: boolean; region: boolean }
) {
  const steps: Array<{
    step: string;
    description: string;
    documents: string[];
    link?: string;
  }> = [];

  // Step 1: CPF
  if (eligibility.cpf) {
    steps.push({
      step: 'Étape 1 : Mobiliser votre CPF',
      description:
        'Connectez-vous à votre compte CPF pour vérifier vos droits et créer votre dossier de formation.',
      documents: ["Identité (carte d'identité ou passeport)", 'Numéro de sécurité sociale'],
      link: 'https://www.moncompteformation.gouv.fr/',
    });
  }

  // Step 2: Pôle Emploi
  if (eligibility.poleEmploi) {
    steps.push({
      step: "Étape 2 : Demander l'aide Pôle Emploi",
      description:
        'Contactez votre conseiller Pôle Emploi pour constituer votre dossier AIF (Aide Individuelle à la Formation).',
      documents: ['Devis de formation', 'Programme détaillé', 'CV à jour', 'Projet professionnel'],
      link: 'https://www.pole-emploi.fr/',
    });
  }

  // Step 3: Region
  if (eligibility.region) {
    steps.push({
      step: 'Étape 3 : Solliciter les aides régionales',
      description:
        "Renseignez-vous auprès de votre conseil régional sur les dispositifs d'aide à la formation (chèque formation, bourses).",
      documents: [
        'Justificatif de domicile',
        "Avis d'imposition",
        'Devis de formation',
        'Attestation Pôle Emploi (si applicable)',
      ],
    });
  }

  // Step 4: Inscription
  steps.push({
    step: `Étape ${steps.length + 1} : Finaliser l'inscription`,
    description:
      "Une fois les financements validés, inscrivez-vous définitivement auprès de l'organisme de formation.",
    documents: [
      "Dossier d'inscription complet",
      'Accords de financement',
      'Règlement du reste à charge',
    ],
  });

  return steps;
}

/**
 * Calculate total available funding for a user
 */
export async function calculateTotalAvailableFunding(profile: UserProfile): Promise<number> {
  let total = 0;

  // CPF
  if (profile.cpfBalance) {
    total += profile.cpfBalance;
  }

  // Pôle Emploi (estimate)
  if (profile.currentStatus === 'unemployed') {
    total += 3000; // AIF estimate
  }

  // Region (estimate)
  total += 2000;

  // OPCO (if employed, estimate)
  if (profile.currentStatus === 'employed') {
    total += 1500;
  }

  return total;
}
