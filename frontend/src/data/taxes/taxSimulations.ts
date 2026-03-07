 
// src/data/taxes/taxSimulations.ts
/**
 * Pedagogical tax simulations (READ-ONLY, EDUCATIONAL PURPOSE)
 * These simulations are INFORMATIONAL ONLY and make NO PROMISES
 * They help understand tax mechanisms but cannot predict actual policy changes
 */

import {
  calculateCumulativeTaxes,
  calculateTerritoryDifferential,
} from './taxRatesByTerritory'

/**
 * DISCLAIMER: All simulations are for educational purposes only
 * They do not constitute financial advice or policy recommendations
 * Actual tax changes require legislative action
 */

export interface SimulationScenario {
  id: string
  name: string
  description: string
  disclaimer: string
  educationalPurpose: string
}

/**
 * Available simulation scenarios (all pedagogical)
 */
export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: 'align_tva_metropole',
    name: 'Alignement TVA DOM sur Métropole',
    description:
      'Simulation pédagogique : Quel serait l\'impact si les taux de TVA DOM étaient alignés sur ceux de la métropole',
    disclaimer:
      'Cette simulation est purement informative. Elle ne prédit ni ne recommande aucun changement de politique fiscale.',
    educationalPurpose:
      'Comprendre l\'écart de taxation actuel et son impact sur le prix final des produits',
  },
  {
    id: 'remove_octroi',
    name: 'Suppression théorique de l\'Octroi de Mer',
    description:
      'Simulation pédagogique : Impact théorique d\'une suppression de l\'octroi de mer sur les prix',
    disclaimer:
      'L\'octroi de mer finance les collectivités locales et protège la production locale. Sa suppression nécessiterait des mesures compensatoires. Cette simulation est INFORMATIVE UNIQUEMENT.',
    educationalPurpose:
      'Comprendre le rôle et l\'impact de l\'octroi de mer dans la structure fiscale des DOM',
  },
  {
    id: 'reduce_cumul',
    name: 'Réduction du cumul des taxes',
    description:
      'Simulation pédagogique : Impact d\'une réduction de l\'empilement fiscal (TVA sur TVA)',
    disclaimer:
      'Cette simulation illustre l\'effet d\'empilement des taxes. Elle ne constitue pas une recommandation de politique publique.',
    educationalPurpose:
      'Comprendre comment les taxes s\'additionnent et se multiplient (effet cascade)',
  },
]

/**
 * Simulate price with different TVA rate (EDUCATIONAL ONLY)
 */
export function simulateTVAChange(
  priceHT: number,
  currentTVA: number,
  newTVA: number,
  octroiRate: number = 0,
  omrRate: number = 0
): {
  scenario: string
  currentPrice: number
  newPrice: number
  difference: number
  differencePercent: number
  disclaimer: string
} {
  const current = calculateCumulativeTaxes(priceHT, currentTVA, octroiRate, omrRate)
  const simulated = calculateCumulativeTaxes(priceHT, newTVA, octroiRate, omrRate)

  return {
    scenario: `Simulation : TVA ${currentTVA}% → ${newTVA}%`,
    currentPrice: current.priceTTC,
    newPrice: simulated.priceTTC,
    difference: simulated.priceTTC - current.priceTTC,
    differencePercent: ((simulated.priceTTC - current.priceTTC) / current.priceTTC) * 100,
    disclaimer:
      'SIMULATION PÉDAGOGIQUE UNIQUEMENT. Ne constitue ni une prédiction ni une recommandation.',
  }
}

/**
 * Simulate price without octroi de mer (EDUCATIONAL ONLY)
 */
export function simulateWithoutOctroi(
  priceHT: number,
  tvaRate: number,
  octroiRate: number,
  omrRate: number = 0
): {
  scenario: string
  currentPrice: number
  simulatedPrice: number
  saving: number
  savingPercent: number
  warning: string
  disclaimer: string
} {
  const withOctroi = calculateCumulativeTaxes(priceHT, tvaRate, octroiRate, omrRate)
  const withoutOctroi = calculateCumulativeTaxes(priceHT, tvaRate, 0, 0)

  return {
    scenario: 'Simulation : Suppression octroi de mer',
    currentPrice: withOctroi.priceTTC,
    simulatedPrice: withoutOctroi.priceTTC,
    saving: withOctroi.priceTTC - withoutOctroi.priceTTC,
    savingPercent: ((withOctroi.priceTTC - withoutOctroi.priceTTC) / withOctroi.priceTTC) * 100,
    warning:
      'L\'octroi de mer finance les collectivités et protège la production locale. Sa suppression nécessiterait des financements alternatifs.',
    disclaimer:
      'SIMULATION INFORMATIVE UNIQUEMENT. Ne prédit aucun changement de politique fiscale.',
  }
}

/**
 * Simulate tax cascade effect reduction (EDUCATIONAL)
 */
export function simulateTaxCascadeReduction(
  priceHT: number,
  tvaRate: number,
  octroiRate: number,
  omrRate: number
): {
  scenario: string
  currentMethod: string
  currentPrice: number
  alternativeMethod: string
  alternativePrice: number
  difference: number
  educationalNote: string
  disclaimer: string
} {
  // Current: Octroi+OMR on HT, then TVA on (HT+Octroi+OMR)
  const current = calculateCumulativeTaxes(priceHT, tvaRate, octroiRate, omrRate)

  // Alternative simulation: All taxes independently on HT (no cascade)
  const octroiAmount = priceHT * (octroiRate / 100)
  const omrAmount = priceHT * (omrRate / 100)
  const tvaAmount = priceHT * (tvaRate / 100) // TVA on HT only
  const alternativePrice = priceHT + octroiAmount + omrAmount + tvaAmount

  return {
    scenario: 'Simulation : Réduction effet cascade',
    currentMethod: 'Actuel : TVA calculée sur (HT + Octroi + OMR)',
    currentPrice: current.priceTTC,
    alternativeMethod: 'Simulation : Toutes taxes calculées sur HT uniquement',
    alternativePrice: alternativePrice,
    difference: current.priceTTC - alternativePrice,
    educationalNote:
      'Cette simulation illustre l\'effet d\'empilement fiscal. Le système actuel amplifie l\'impact des taxes locales.',
    disclaimer:
      'SIMULATION PÉDAGOGIQUE. Changement de méthode de calcul nécessiterait réforme législative complexe.',
  }
}

/**
 * Simulate basket price with modified tax structure (EDUCATIONAL)
 */
export function simulateBasketWithChanges(
  basketItems: Array<{ name: string; priceHT: number }>,
  currentRates: { tva: number; octroi: number; omr: number },
  simulatedRates: { tva: number; octroi: number; omr: number }
): {
  scenario: string
  itemCount: number
  currentTotal: number
  simulatedTotal: number
  difference: number
  differencePercent: number
  itemDetails: Array<{
    name: string
    currentPrice: number
    simulatedPrice: number
    saving: number
  }>
  disclaimer: string
} {
  const itemDetails = basketItems.map((item) => {
    const current = calculateCumulativeTaxes(
      item.priceHT,
      currentRates.tva,
      currentRates.octroi,
      currentRates.omr
    )
    const simulated = calculateCumulativeTaxes(
      item.priceHT,
      simulatedRates.tva,
      simulatedRates.octroi,
      simulatedRates.omr
    )

    return {
      name: item.name,
      currentPrice: current.priceTTC,
      simulatedPrice: simulated.priceTTC,
      saving: current.priceTTC - simulated.priceTTC,
    }
  })

  const currentTotal = itemDetails.reduce((sum, item) => sum + item.currentPrice, 0)
  const simulatedTotal = itemDetails.reduce((sum, item) => sum + item.simulatedPrice, 0)

  return {
    scenario: 'Simulation : Panier avec taux modifiés',
    itemCount: basketItems.length,
    currentTotal,
    simulatedTotal,
    difference: currentTotal - simulatedTotal,
    differencePercent: ((currentTotal - simulatedTotal) / currentTotal) * 100,
    itemDetails,
    disclaimer:
      'SIMULATION PÉDAGOGIQUE sur panier type. Ne constitue pas une prédiction de prix réels ni une recommandation politique.',
  }
}

/**
 * Get all available simulation scenarios
 */
export function getAllSimulationScenarios(): SimulationScenario[] {
  return SIMULATION_SCENARIOS
}

/**
 * Get simulation scenario by ID
 */
export function getSimulationScenario(id: string): SimulationScenario | undefined {
  return SIMULATION_SCENARIOS.find((scenario) => scenario.id === id)
}

/**
 * IMPORTANT DISCLAIMER FOR ALL SIMULATIONS
 */
export const GLOBAL_SIMULATION_DISCLAIMER = `
⚠️ AVERTISSEMENT IMPORTANT ⚠️

Toutes les simulations présentées sont EXCLUSIVEMENT À BUT PÉDAGOGIQUE.

❌ Ces simulations NE SONT PAS :
- Des prédictions de changements fiscaux futurs
- Des recommandations de politique publique
- Des promesses d'économies réelles
- Des conseils financiers personnalisés

✅ Ces simulations SONT :
- Des outils éducatifs pour comprendre les mécanismes fiscaux
- Des illustrations des impacts relatifs des différentes taxes
- Des aides à la compréhension de la structure de prix dans les DOM

Tout changement de fiscalité nécessite :
- Un processus législatif complet
- Des études d'impact approfondies
- Des mesures compensatoires pour les collectivités
- Un cadre européen respecté

Les montants simulés sont indicatifs et peuvent varier selon de nombreux facteurs.
`
