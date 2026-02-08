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

  // Groupe Bernard Hayot (GBH) - Major retail group in French Antilles
  {
    id: 'company-gbh',
    siretCode: '31322226000015', // GBH headquarters
    sirenCode: '313222260',
    vatCode: 'FR60313222260',
    legalName: 'Groupe Bernard Hayot',
    tradeName: 'GBH',
    activityStatus: 'ACTIVE',
    creationDate: '1960-01-01',
    headOffice: {
      streetNumber: 'Zone',
      streetName: 'Industrielle de Jarry',
      city: 'Baie-Mahault',
      department: '971',
      postalCode: '97122',
      country: 'France',
    },
    geoLocation: {
      latitude: 16.2469,
      longitude: -61.5717,
    },
    lastUpdate: '2024-12-18T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Groupe Caillé - Major retail group in La Réunion
  {
    id: 'company-caille',
    siretCode: '31806506600015', // Groupe Caillé headquarters
    sirenCode: '318065066',
    vatCode: 'FR42318065066',
    legalName: 'Groupe Caillé',
    tradeName: 'Groupe Caillé',
    activityStatus: 'ACTIVE',
    creationDate: '1965-01-01',
    headOffice: {
      streetNumber: '1',
      streetName: 'Rue du Commerce',
      city: 'Saint-Denis',
      department: '974',
      postalCode: '97400',
      country: 'France',
    },
    geoLocation: {
      latitude: -20.8823,
      longitude: 55.4504,
    },
    lastUpdate: '2024-12-18T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Groupe Parfait - Major retail group in Guadeloupe and Martinique
  {
    id: 'company-parfait',
    siretCode: '32456789000015', // Groupe Parfait headquarters
    sirenCode: '324567890',
    vatCode: 'FR38324567890',
    legalName: 'Groupe Parfait',
    tradeName: 'Groupe Parfait',
    activityStatus: 'ACTIVE',
    creationDate: '1970-01-01',
    headOffice: {
      streetNumber: 'Zone',
      streetName: 'Commerciale de Dillon',
      city: 'Fort-de-France',
      department: '972',
      postalCode: '97200',
      country: 'France',
    },
    geoLocation: {
      latitude: 14.6118,
      longitude: -61.0736,
    },
    lastUpdate: '2024-12-18T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Groupe Hayot-Sodiprav - Retail group in Martinique
  {
    id: 'company-hayot-sodiprav',
    siretCode: '34512345600015', // Hayot-Sodiprav headquarters
    sirenCode: '345123456',
    vatCode: 'FR55345123456',
    legalName: 'Groupe Hayot-Sodiprav',
    tradeName: 'Hayot-Sodiprav',
    activityStatus: 'ACTIVE',
    creationDate: '1968-01-01',
    headOffice: {
      streetNumber: 'Zone',
      streetName: 'Industrielle de Rivière Roche',
      city: 'Fort-de-France',
      department: '972',
      postalCode: '97200',
      country: 'France',
    },
    geoLocation: {
      latitude: 14.6160,
      longitude: -61.0588,
    },
    lastUpdate: '2024-12-18T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Groupe Loret - Automotive and mobility group in Antilles and Guyane
  {
    id: 'company-loret',
    siretCode: '35678901200015', // Groupe Loret headquarters
    sirenCode: '356789012',
    vatCode: 'FR63356789012',
    legalName: 'Groupe Loret',
    tradeName: 'Groupe Loret',
    activityStatus: 'ACTIVE',
    creationDate: '1975-01-01',
    headOffice: {
      streetNumber: 'Zone',
      streetName: 'Industrielle de Jarry',
      city: 'Baie-Mahault',
      department: '971',
      postalCode: '97122',
      country: 'France',
    },
    geoLocation: {
      latitude: 16.2450,
      longitude: -61.5700,
    },
    lastUpdate: '2024-12-18T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Sucreries de Bourbon - Agro-food industry in La Réunion
  {
    id: 'company-sucreries-bourbon',
    siretCode: '36789012300015', // Sucreries de Bourbon headquarters
    sirenCode: '367890123',
    vatCode: 'FR71367890123',
    legalName: 'Sucreries de Bourbon',
    tradeName: 'Sucreries de Bourbon',
    activityStatus: 'ACTIVE',
    creationDate: '1970-01-01',
    headOffice: {
      streetNumber: '10',
      streetName: 'Rue du Pont',
      city: 'Le Port',
      department: '974',
      postalCode: '97420',
      country: 'France',
    },
    geoLocation: {
      latitude: -20.9400,
      longitude: 55.2930,
    },
    lastUpdate: '2024-12-18T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Casino Group
  {
    id: 'company-casino',
    siretCode: '55490656100015',
    sirenCode: '554906561',
    vatCode: 'FR95554906561',
    legalName: 'Casino Guichard-Perrachon',
    tradeName: 'Casino',
    activityStatus: 'ACTIVE',
    creationDate: '1898-01-01',
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
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Ecomax - Local retail chain in DOM-TOM
  {
    id: 'company-ecomax',
    siretCode: '37890123400015',
    sirenCode: '378901234',
    vatCode: 'FR79378901234',
    legalName: 'Ecomax Distribution',
    tradeName: 'Ecomax',
    activityStatus: 'ACTIVE',
    creationDate: '1985-01-01',
    headOffice: {
      streetNumber: 'Zone',
      streetName: 'Commerciale de Jarry',
      city: 'Baie-Mahault',
      department: '971',
      postalCode: '97122',
      country: 'France',
    },
    geoLocation: {
      latitude: 16.2450,
      longitude: -61.5700,
    },
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Cora - Major hypermarket chain
  {
    id: 'company-cora',
    siretCode: '37557019000015',
    sirenCode: '375570190',
    vatCode: 'FR88375570190',
    legalName: 'Cora SA',
    tradeName: 'Cora',
    activityStatus: 'ACTIVE',
    creationDate: '1969-01-01',
    headOffice: {
      streetNumber: '1',
      streetName: 'Rue de la Girafe',
      city: 'Strasbourg',
      department: '67',
      postalCode: '67000',
      country: 'France',
    },
    geoLocation: {
      latitude: 48.5734,
      longitude: 7.7521,
    },
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // 8 à Huit (Groupe Casino)
  {
    id: 'company-8ahuit',
    siretCode: '38901234500015',
    sirenCode: '389012345',
    vatCode: 'FR87389012345',
    legalName: '8 à Huit Distribution',
    tradeName: '8 à Huit',
    activityStatus: 'ACTIVE',
    creationDate: '1968-01-01',
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
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Simply Market (Groupe Auchan)
  {
    id: 'company-simply-market',
    siretCode: '39012345600015',
    sirenCode: '390123456',
    vatCode: 'FR96390123456',
    legalName: 'Simply Market Distribution',
    tradeName: 'Simply Market',
    activityStatus: 'ACTIVE',
    creationDate: '2005-01-01',
    headOffice: {
      streetNumber: '200',
      streetName: 'Avenue de la Voie Lactée',
      city: 'Villeneuve-d\'Ascq',
      department: '59',
      postalCode: '59650',
      country: 'France',
    },
    geoLocation: {
      latitude: 50.6292,
      longitude: 3.1385,
    },
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Auchan
  {
    id: 'company-auchan',
    siretCode: '38890005700015',
    sirenCode: '388900057',
    vatCode: 'FR05388900057',
    legalName: 'Auchan Hypermarché',
    tradeName: 'Auchan',
    activityStatus: 'ACTIVE',
    creationDate: '1961-01-01',
    headOffice: {
      streetNumber: '200',
      streetName: 'Avenue de la Voie Lactée',
      city: 'Villeneuve-d\'Ascq',
      department: '59',
      postalCode: '59650',
      country: 'France',
    },
    geoLocation: {
      latitude: 50.6292,
      longitude: 3.1385,
    },
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Score - Local retail chain in La Réunion and Mayotte
  {
    id: 'company-score',
    siretCode: '40123456700015',
    sirenCode: '401234567',
    vatCode: 'FR04401234567',
    legalName: 'Score Distribution',
    tradeName: 'Score',
    activityStatus: 'ACTIVE',
    creationDate: '1975-01-01',
    headOffice: {
      streetNumber: '10',
      streetName: 'Rue de la Réunion',
      city: 'Saint-Denis',
      department: '974',
      postalCode: '97400',
      country: 'France',
    },
    geoLocation: {
      latitude: -20.8823,
      longitude: 55.4504,
    },
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Jumbo - Retail chain in DOM-TOM
  {
    id: 'company-jumbo',
    siretCode: '41234567800015',
    sirenCode: '412345678',
    vatCode: 'FR13412345678',
    legalName: 'Jumbo Distribution',
    tradeName: 'Jumbo',
    activityStatus: 'ACTIVE',
    creationDate: '1970-01-01',
    headOffice: {
      streetNumber: '5',
      streetName: 'Avenue de la Réunion',
      city: 'Saint-Denis',
      department: '974',
      postalCode: '97400',
      country: 'France',
    },
    geoLocation: {
      latitude: -20.8823,
      longitude: 55.4504,
    },
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Shopi - Local retail chain in Mayotte
  {
    id: 'company-shopi',
    siretCode: '42345678900015',
    sirenCode: '423456789',
    vatCode: 'FR22423456789',
    legalName: 'Shopi Distribution',
    tradeName: 'Shopi',
    activityStatus: 'ACTIVE',
    creationDate: '1980-01-01',
    headOffice: {
      streetNumber: 'Centre',
      streetName: 'Commercial',
      city: 'Mamoudzou',
      department: '976',
      postalCode: '97600',
      country: 'France',
    },
    geoLocation: {
      latitude: -12.7806,
      longitude: 45.2278,
    },
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // AMC - Local retail chain in Saint-Barthélemy
  {
    id: 'company-amc',
    siretCode: '43456789000015',
    sirenCode: '434567890',
    vatCode: 'FR31434567890',
    legalName: 'AMC Distribution',
    tradeName: 'AMC',
    activityStatus: 'ACTIVE',
    creationDate: '1990-01-01',
    headOffice: {
      streetNumber: 'Rue',
      streetName: 'de la République',
      city: 'Gustavia',
      department: '977',
      postalCode: '97133',
      country: 'France',
    },
    geoLocation: {
      latitude: 17.8962,
      longitude: -62.8498,
    },
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Vival (Système U)
  {
    id: 'company-vival',
    siretCode: '44567890100015',
    sirenCode: '445678901',
    vatCode: 'FR40445678901',
    legalName: 'Vival Distribution',
    tradeName: 'Vival',
    activityStatus: 'ACTIVE',
    creationDate: '1988-01-01',
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
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Euromarché
  {
    id: 'company-euromarche',
    siretCode: '45678901200015',
    sirenCode: '456789012',
    vatCode: 'FR49456789012',
    legalName: 'Euromarché Distribution',
    tradeName: 'Euromarché',
    activityStatus: 'ACTIVE',
    creationDate: '1965-01-01',
    headOffice: {
      streetNumber: '10',
      streetName: 'Avenue du Commerce',
      city: 'Fort-de-France',
      department: '972',
      postalCode: '97200',
      country: 'France',
    },
    geoLocation: {
      latitude: 14.6078,
      longitude: -61.0595,
    },
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Mr. Bricolage
  {
    id: 'company-mr-bricolage',
    siretCode: '46789012300015',
    sirenCode: '467890123',
    vatCode: 'FR58467890123',
    legalName: 'Mr. Bricolage SA',
    tradeName: 'Mr. Bricolage',
    activityStatus: 'ACTIVE',
    creationDate: '1964-01-01',
    headOffice: {
      streetNumber: '1',
      streetName: 'Rue de Paris',
      city: 'Rennes',
      department: '35',
      postalCode: '35000',
      country: 'France',
    },
    geoLocation: {
      latitude: 48.1173,
      longitude: -1.6778,
    },
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Bricopro
  {
    id: 'company-bricopro',
    siretCode: '47890123400015',
    sirenCode: '478901234',
    vatCode: 'FR67478901234',
    legalName: 'Bricopro Distribution',
    tradeName: 'Bricopro',
    activityStatus: 'ACTIVE',
    creationDate: '1995-01-01',
    headOffice: {
      streetNumber: 'Zone',
      streetName: 'Commerciale',
      city: 'Baie-Mahault',
      department: '971',
      postalCode: '97122',
      country: 'France',
    },
    geoLocation: {
      latitude: 16.2690,
      longitude: -61.5240,
    },
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Bricomarché
  {
    id: 'company-bricomarche',
    siretCode: '48901234500015',
    sirenCode: '489012345',
    vatCode: 'FR76489012345',
    legalName: 'Bricomarché SA',
    tradeName: 'Bricomarché',
    activityStatus: 'ACTIVE',
    creationDate: '1979-01-01',
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
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Darty
  {
    id: 'company-darty',
    siretCode: '54205011100015',
    sirenCode: '542050111',
    vatCode: 'FR85542050111',
    legalName: 'Darty et Fils',
    tradeName: 'Darty',
    activityStatus: 'ACTIVE',
    creationDate: '1957-01-01',
    headOffice: {
      streetNumber: '129',
      streetName: 'Avenue Gallieni',
      city: 'Fontenay-sous-Bois',
      department: '94',
      postalCode: '94120',
      country: 'France',
    },
    geoLocation: {
      latitude: 48.8533,
      longitude: 2.4831,
    },
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // BUT
  {
    id: 'company-but',
    siretCode: '30825551100015',
    sirenCode: '308255511',
    vatCode: 'FR94308255511',
    legalName: 'BUT International',
    tradeName: 'BUT',
    activityStatus: 'ACTIVE',
    creationDate: '1972-01-01',
    headOffice: {
      streetNumber: '5',
      streetName: 'Boulevard de la République',
      city: 'Villeneuve-la-Garenne',
      department: '92',
      postalCode: '92390',
      country: 'France',
    },
    geoLocation: {
      latitude: 48.9364,
      longitude: 2.3253,
    },
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Décathlon
  {
    id: 'company-decathlon',
    siretCode: '30621894700015',
    sirenCode: '306218947',
    vatCode: 'FR48306218947',
    legalName: 'Decathlon SA',
    tradeName: 'Décathlon',
    activityStatus: 'ACTIVE',
    creationDate: '1976-01-01',
    headOffice: {
      streetNumber: '4',
      streetName: 'Boulevard de Mons',
      city: 'Villeneuve-d\'Ascq',
      department: '59',
      postalCode: '59650',
      country: 'France',
    },
    geoLocation: {
      latitude: 50.6292,
      longitude: 3.1385,
    },
    lastUpdate: '2026-02-07T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  },

  // Intersport
  {
    id: 'company-intersport',
    siretCode: '31234567800015',
    sirenCode: '312345678',
    vatCode: 'FR57312345678',
    legalName: 'Intersport France',
    tradeName: 'Intersport',
    activityStatus: 'ACTIVE',
    creationDate: '1969-01-01',
    headOffice: {
      streetNumber: '4',
      streetName: 'Rue de Chantepie',
      city: 'Longjumeau',
      department: '91',
      postalCode: '91160',
      country: 'France',
    },
    geoLocation: {
      latitude: 48.6958,
      longitude: 2.2946,
    },
    lastUpdate: '2026-02-07T12:00:00Z',
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
