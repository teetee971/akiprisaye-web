/**
 * Public Observatory Service - v4.3.0
 *
 * Official public observatory for cost of living
 * - Long-term series
 * - Fixed methodology
 * - Citable datasets
 *
 * @module publicObservatoryService
 */

import type {
  ObservatoryIndicator,
  PublicationVersion,
  PublicDataset,
} from '../types/publicObservatory';

/**
 * Get official indicators
 */
export async function getOfficialIndicators(): Promise<ObservatoryIndicator[]> {
  return [
    {
      id: 'ievr',
      name: 'IEVR',
      description: "Indice d'Équivalence de Vie Réelle",
      unit: 'index',
      methodology: 'https://akiprisaye.fr/docs/methodologie-ievr',
      version: '4.3.0',
    },
  ];
}

/**
 * Get publication version
 */
export async function getPublicationVersion(version: string): Promise<PublicationVersion> {
  return {
    version,
    date: new Date().toISOString(),
    methodology: 'https://akiprisaye.fr/docs/methodologie',
    frozenAt: new Date().toISOString(),
  };
}

/**
 * Get citable dataset
 */
export async function getCitableDataset(id: string): Promise<PublicDataset> {
  return {
    id,
    title: 'Cost of Living Index',
    permanentUrl: `https://akiprisaye.fr/datasets/${id}`,
    version: '4.3.0',
    data: [],
  };
}
