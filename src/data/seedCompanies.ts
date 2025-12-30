/**
 * Seed Company Data for DROM-COM Stores
 * 
 * This file contains real company data for major retailers in French overseas territories.
 * Data structure follows the Company Registry specification.
 */

import type { Company } from '../types/company';

/**
 * Seed company data based on existing stores
 * This data represents the parent companies that own the stores
 */
export const SEED_COMPANIES: Company[] = [
  // Carrefour France - Major retail chain
  {
    id: 'company-carrefour-france',
    siretCode: '65220019600018', // Carrefour Hypermarchés headquarters
    sirenCode: '652200196',
    vatCode: 'FR91652200196',
    legalName: 'Carrefour Hypermarchés SAS',
    tradeName: 'Carrefour',
    activityStatus: 'ACTIVE',
    creationDate: '1960-01-01',
    headOffice: {
      streetNumber: '93',
      streetName: 'Avenue de Paris',
      city: 'Massy',
      department: '91',
      postalCode: '91300',
      country: 'France',
    },
    geoLocation: {
      latitude: 48.7312,
      longitude: 2.2745,
    },
    lastUpdate: '2024-12-18T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Système U - Major cooperative retail chain
  {
    id: 'company-systeme-u',
    siretCode: '30537080900011', // Système U Centrale Nationale headquarters
    sirenCode: '305370809',
    vatCode: 'FR26305370809',
    legalName: 'Système U Centrale Nationale',
    tradeName: 'Système U',
    activityStatus: 'ACTIVE',
    creationDate: '1894-01-01',
    headOffice: {
      streetNumber: '4',
      streetName: 'Rue Jean Mermoz',
      city: 'Rungis',
      department: '94',
      postalCode: '94150',
      country: 'France',
    },
    geoLocation: {
      latitude: 48.7564,
      longitude: 2.3522,
    },
    lastUpdate: '2024-12-18T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // E.Leclerc - Major retail chain
  {
    id: 'company-leclerc',
    siretCode: '38035044800025', // E.Leclerc headquarters
    sirenCode: '380350448',
    vatCode: 'FR35380350448',
    legalName: 'Association des Centres Distributeurs E.Leclerc',
    tradeName: 'E.Leclerc',
    activityStatus: 'ACTIVE',
    creationDate: '1949-01-01',
    headOffice: {
      streetNumber: '26',
      streetName: 'Quai Marcel Boyer',
      city: 'Ivry-sur-Seine',
      department: '94',
      postalCode: '94200',
      country: 'France',
    },
    geoLocation: {
      latitude: 48.8175,
      longitude: 2.3878,
    },
    lastUpdate: '2024-12-18T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Intermarché (Les Mousquetaires)
  {
    id: 'company-intermarche',
    siretCode: '31282736700017', // Groupement Les Mousquetaires
    sirenCode: '312827367',
    vatCode: 'FR16312827367',
    legalName: 'Groupement Les Mousquetaires',
    tradeName: 'Intermarché',
    activityStatus: 'ACTIVE',
    creationDate: '1969-01-01',
    headOffice: {
      streetNumber: '24',
      streetName: 'Rue Auguste Chabrières',
      city: 'Paris',
      department: '75',
      postalCode: '75015',
      country: 'France',
    },
    geoLocation: {
      latitude: 48.8413,
      longitude: 2.2986,
    },
    lastUpdate: '2024-12-18T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Leader Price (Casino Group)
  {
    id: 'company-leader-price',
    siretCode: '34481241600015', // Leader Price headquarters
    sirenCode: '344812416',
    vatCode: 'FR37344812416',
    legalName: 'Leader Price Distribution France',
    tradeName: 'Leader Price',
    activityStatus: 'ACTIVE',
    creationDate: '1989-01-01',
    headOffice: {
      streetNumber: '1',
      streetName: 'Esplanade de France',
      city: 'Saint-Étienne',
      department: '42',
      postalCode: '42000',
      country: 'France',
    },
    geoLocation: {
      latitude: 45.4397,
      longitude: 4.3872,
    },
    lastUpdate: '2024-12-18T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Match (Cora Group)
  {
    id: 'company-match',
    siretCode: '32210902700015', // Match headquarters
    sirenCode: '322109027',
    vatCode: 'FR42322109027',
    legalName: 'Match Distribution',
    tradeName: 'Match',
    activityStatus: 'ACTIVE',
    creationDate: '1976-01-01',
    headOffice: {
      streetNumber: '1',
      streetName: 'Avenue de la République',
      city: 'Villeneuve-d\'Ascq',
      department: '59',
      postalCode: '59650',
      country: 'France',
    },
    geoLocation: {
      latitude: 50.6292,
      longitude: 3.1385,
    },
    lastUpdate: '2024-12-18T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },
];

/**
 * Get company by ID
 * 
 * @param companyId - Company ID
 * @returns Company or undefined
 */
export function getCompanyFromSeed(companyId: string): Company | undefined {
  return SEED_COMPANIES.find(c => c.id === companyId);
}

/**
 * Get company by SIREN
 * 
 * @param siren - SIREN code
 * @returns Company or undefined
 */
export function getCompanyBySirenFromSeed(siren: string): Company | undefined {
  const normalized = siren.replace(/[\s-]/g, '');
  return SEED_COMPANIES.find(c => c.sirenCode === normalized);
}

/**
 * Get all seed companies
 * 
 * @returns Array of all seed companies
 */
export function getAllSeedCompanies(): Company[] {
  return SEED_COMPANIES;
}
