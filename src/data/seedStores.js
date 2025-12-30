/**
 * SEED_STORES - Données des magasins pour tous les territoires DROM-COM
 * Base de données centralisée des magasins partenaires et référencés
 */

export const SEED_STORES = [
  // ========== GUADELOUPE ==========
  {
    id: 'superu_petit_canal',
    name: 'Super U Petit-Canal',
    chain: 'Système U',
    companyId: 'company-systeme-u',
    territory: 'Guadeloupe',
    city: 'Le Gosier',
    address: 'Petit-Canal',
    postalCode: '97190',
    coordinates: {
      lat: 16.2731,
      lon: -61.5062,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h, Dim 8h-13h',
    services: ['parking', 'carte_bancaire', 'livraison'],
  },
  {
    id: 'carrefour_baie_mahault',
    name: 'Carrefour Baie-Mahault',
    chain: 'Carrefour',
    companyId: 'company-carrefour-france',
    territory: 'Guadeloupe',
    city: 'Baie-Mahault',
    address: 'Centre Commercial Destrelande',
    postalCode: '97122',
    coordinates: {
      lat: 16.2676,
      lon: -61.5252,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 8h30-20h30, Dim 9h-13h',
    services: ['parking', 'carte_bancaire', 'livraison', 'retrait_course'],
  },
  {
    id: 'leader_price_pointe_pitre',
    name: 'Leader Price Pointe-à-Pitre',
    chain: 'Leader Price',
    companyId: 'company-leader-price',
    territory: 'Guadeloupe',
    city: 'Pointe-à-Pitre',
    address: 'Centre-ville',
    postalCode: '97110',
    coordinates: {
      lat: 16.2415,
      lon: -61.5331,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 7h-20h',
    services: ['parking', 'carte_bancaire'],
  },
  {
    id: 'leclerc_abymes',
    name: 'E.Leclerc Les Abymes',
    chain: 'E.Leclerc',
    companyId: 'company-leclerc',
    territory: 'Guadeloupe',
    city: 'Les Abymes',
    address: 'Zone Commerciale de Jarry',
    postalCode: '97139',
    coordinates: {
      lat: 16.2679,
      lon: -61.5863,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h, Dim 8h-13h',
    services: ['parking', 'carte_bancaire', 'livraison', 'essence'],
  },
  {
    id: 'intermarche_gosier',
    name: 'Intermarché Le Gosier',
    chain: 'Intermarché',
    companyId: 'company-intermarche',
    territory: 'Guadeloupe',
    city: 'Le Gosier',
    address: 'Centre Commercial',
    postalCode: '97190',
    coordinates: {
      lat: 16.2280,
      lon: -61.5100,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 8h-19h30',
    services: ['parking', 'carte_bancaire'],
  },

  // ========== MARTINIQUE ==========
  {
    id: 'super_score_fort_de_france',
    name: 'Super Score Fort-de-France',
    chain: 'Super Score',
    companyId: 'company-carrefour-france',
    territory: 'Martinique',
    city: 'Fort-de-France',
    address: 'Centre-ville',
    postalCode: '97200',
    coordinates: {
      lat: 14.6078,
      lon: -61.0595,
    },
    phone: '+596 596 XX XX XX',
    openingHours: 'Lun-Sam 7h30-20h',
    services: ['parking', 'carte_bancaire'],
  },
  {
    id: 'carrefour_dillon',
    name: 'Carrefour Dillon',
    chain: 'Carrefour',
    companyId: 'company-carrefour-france',
    territory: 'Martinique',
    city: 'Fort-de-France',
    address: 'Quartier Dillon',
    postalCode: '97200',
    coordinates: {
      lat: 14.616,
      lon: -61.053,
    },
    phone: '+596 596 XX XX XX',
    openingHours: 'Lun-Sam 8h30-20h, Dim 9h-13h',
    services: ['parking', 'carte_bancaire', 'livraison', 'retrait_course'],
  },
  {
    id: 'hyper_u_lamentin',
    name: 'Hyper U Le Lamentin',
    chain: 'Système U',
    companyId: 'company-systeme-u',
    territory: 'Martinique',
    city: 'Le Lamentin',
    address: 'Zone Industrielle',
    postalCode: '97232',
    coordinates: {
      lat: 14.6162,
      lon: -61.0037,
    },
    phone: '+596 596 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h, Dim 8h-13h',
    services: ['parking', 'carte_bancaire', 'livraison', 'essence'],
  },
  {
    id: 'leclerc_ducos',
    name: 'E.Leclerc Ducos',
    chain: 'E.Leclerc',
    companyId: 'company-leclerc',
    territory: 'Martinique',
    city: 'Ducos',
    address: 'Zone Commerciale',
    postalCode: '97224',
    coordinates: {
      lat: 14.5950,
      lon: -61.0050,
    },
    phone: '+596 596 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h',
    services: ['parking', 'carte_bancaire', 'essence'],
  },

  // ========== GUYANE ==========
  {
    id: 'hyper_u_cayenne',
    name: 'Hyper U Cayenne',
    chain: 'Système U',
    companyId: 'company-systeme-u',
    territory: 'Guyane',
    city: 'Cayenne',
    address: 'Avenue Léopold Héder',
    postalCode: '97300',
    coordinates: {
      lat: 4.9380,
      lon: -52.3300,
    },
    phone: '+594 594 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h, Dim 8h-13h',
    services: ['parking', 'carte_bancaire', 'livraison'],
  },
  {
    id: 'carrefour_cayenne',
    name: 'Carrefour Cayenne',
    chain: 'Carrefour',
    companyId: 'company-carrefour-france',
    territory: 'Guyane',
    city: 'Cayenne',
    address: 'Centre Commercial',
    postalCode: '97300',
    coordinates: {
      lat: 4.9220,
      lon: -52.3130,
    },
    phone: '+594 594 XX XX XX',
    openingHours: 'Lun-Sam 8h30-20h',
    services: ['parking', 'carte_bancaire', 'retrait_course'],
  },
  {
    id: 'leader_price_kourou',
    name: 'Leader Price Kourou',
    chain: 'Leader Price',
    companyId: 'company-leader-price',
    territory: 'Guyane',
    city: 'Kourou',
    address: 'Centre-ville',
    postalCode: '97310',
    coordinates: {
      lat: 5.1598,
      lon: -52.6481,
    },
    phone: '+594 594 XX XX XX',
    openingHours: 'Lun-Sam 7h-20h',
    services: ['parking', 'carte_bancaire'],
  },

  // ========== LA RÉUNION ==========
  {
    id: 'hyper_u_saint_denis',
    name: 'Hyper U Saint-Denis',
    chain: 'Système U',
    companyId: 'company-systeme-u',
    territory: 'La Réunion',
    city: 'Saint-Denis',
    address: 'Centre Commercial Chaudron',
    postalCode: '97490',
    coordinates: {
      lat: -20.8950,
      lon: 55.4850,
    },
    phone: '+262 262 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h, Dim 8h-13h',
    services: ['parking', 'carte_bancaire', 'livraison'],
  },
  {
    id: 'carrefour_saint_pierre',
    name: 'Carrefour Saint-Pierre',
    chain: 'Carrefour',
    companyId: 'company-carrefour-france',
    territory: 'La Réunion',
    city: 'Saint-Pierre',
    address: 'Zone Commerciale',
    postalCode: '97410',
    coordinates: {
      lat: -21.3387,
      lon: 55.4787,
    },
    phone: '+262 262 XX XX XX',
    openingHours: 'Lun-Sam 8h30-20h',
    services: ['parking', 'carte_bancaire', 'livraison'],
  },
  {
    id: 'leclerc_saint_paul',
    name: 'E.Leclerc Saint-Paul',
    chain: 'E.Leclerc',
    companyId: 'company-leclerc',
    territory: 'La Réunion',
    city: 'Saint-Paul',
    address: 'Zone Commerciale Savanna',
    postalCode: '97460',
    coordinates: {
      lat: -21.0100,
      lon: 55.2700,
    },
    phone: '+262 262 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h',
    services: ['parking', 'carte_bancaire', 'essence'],
  },
  {
    id: 'super_u_saint_andre',
    name: 'Super U Saint-André',
    chain: 'Système U',
    companyId: 'company-systeme-u',
    territory: 'La Réunion',
    city: 'Saint-André',
    address: 'Centre Commercial',
    postalCode: '97440',
    coordinates: {
      lat: -20.9606,
      lon: 55.6500,
    },
    phone: '+262 262 XX XX XX',
    openingHours: 'Lun-Sam 8h-19h30',
    services: ['parking', 'carte_bancaire'],
  },

  // ========== MAYOTTE ==========
  {
    id: 'carrefour_mamoudzou',
    name: 'Carrefour Mamoudzou',
    chain: 'Carrefour',
    companyId: 'company-carrefour-france',
    territory: 'Mayotte',
    city: 'Mamoudzou',
    address: 'Centre Commercial',
    postalCode: '97600',
    coordinates: {
      lat: -12.7806,
      lon: 45.2278,
    },
    phone: '+269 269 XX XX XX',
    openingHours: 'Lun-Sam 8h30-20h',
    services: ['parking', 'carte_bancaire'],
  },
  {
    id: 'leader_price_mamoudzou',
    name: 'Leader Price Mamoudzou',
    chain: 'Leader Price',
    companyId: 'company-leader-price',
    territory: 'Mayotte',
    city: 'Mamoudzou',
    address: 'Centre-ville',
    postalCode: '97600',
    coordinates: {
      lat: -12.7830,
      lon: 45.2300,
    },
    phone: '+269 269 XX XX XX',
    openingHours: 'Lun-Sam 7h-20h',
    services: ['parking', 'carte_bancaire'],
  },

  // ========== SAINT-PIERRE-ET-MIQUELON ==========
  {
    id: 'super_u_saint_pierre',
    name: 'Super U Saint-Pierre',
    chain: 'Système U',
    companyId: 'company-systeme-u',
    territory: 'Saint-Pierre-et-Miquelon',
    city: 'Saint-Pierre',
    address: 'Rue du Général de Gaulle',
    postalCode: '97500',
    coordinates: {
      lat: 46.7791,
      lon: -56.1773,
    },
    phone: '+508 508 XX XX XX',
    openingHours: 'Lun-Sam 8h-19h',
    services: ['parking', 'carte_bancaire'],
  },

  // ========== SAINT-BARTHÉLEMY ==========
  {
    id: 'match_gustavia',
    name: 'Match Gustavia',
    chain: 'Match',
    companyId: 'company-match',
    territory: 'Saint-Barthélemy',
    city: 'Gustavia',
    address: 'Port de Gustavia',
    postalCode: '97133',
    coordinates: {
      lat: 17.8962,
      lon: -62.8498,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 8h-19h30',
    services: ['parking', 'carte_bancaire'],
  },

  // ========== SAINT-MARTIN ==========
  {
    id: 'super_u_marigot',
    name: 'Super U Marigot',
    chain: 'Système U',
    companyId: 'company-systeme-u',
    territory: 'Saint-Martin',
    city: 'Marigot',
    address: 'Centre Commercial',
    postalCode: '97150',
    coordinates: {
      lat: 18.0679,
      lon: -63.0823,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h',
    services: ['parking', 'carte_bancaire'],
  },
  {
    id: 'carrefour_sandy_ground',
    name: 'Carrefour Sandy Ground',
    chain: 'Carrefour',
    companyId: 'company-carrefour-france',
    territory: 'Saint-Martin',
    city: 'Sandy Ground',
    address: 'Route de Sandy Ground',
    postalCode: '97150',
    coordinates: {
      lat: 18.0570,
      lon: -63.0900,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 8h30-20h',
    services: ['parking', 'carte_bancaire'],
  },

  // ========== WALLIS-ET-FUTUNA ==========
  {
    id: 'super_u_mata_utu',
    name: 'Super U Mata-Utu',
    chain: 'Système U',
    companyId: 'company-systeme-u',
    territory: 'Wallis-et-Futuna',
    city: 'Mata-Utu',
    address: 'Centre-ville',
    postalCode: '98600',
    coordinates: {
      lat: -13.2816,
      lon: -176.1745,
    },
    phone: '+681 681 XX XX XX',
    openingHours: 'Lun-Sam 7h30-19h',
    services: ['parking', 'carte_bancaire'],
  },

  // ========== POLYNÉSIE FRANÇAISE ==========
  {
    id: 'carrefour_papeete',
    name: 'Carrefour Papeete',
    chain: 'Carrefour',
    companyId: 'company-carrefour-france',
    territory: 'Polynésie française',
    city: 'Papeete',
    address: 'Centre Commercial Moana Nui',
    postalCode: '98713',
    coordinates: {
      lat: -17.5350,
      lon: -149.5690,
    },
    phone: '+689 40 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h',
    services: ['parking', 'carte_bancaire', 'livraison'],
  },
  {
    id: 'super_u_punaauia',
    name: 'Super U Punaauia',
    chain: 'Système U',
    companyId: 'company-systeme-u',
    territory: 'Polynésie française',
    city: 'Punaauia',
    address: 'Centre Commercial',
    postalCode: '98717',
    coordinates: {
      lat: -17.6300,
      lon: -149.6000,
    },
    phone: '+689 40 XX XX XX',
    openingHours: 'Lun-Sam 8h-19h30',
    services: ['parking', 'carte_bancaire'],
  },

  // ========== NOUVELLE-CALÉDONIE ==========
  {
    id: 'carrefour_noumea',
    name: 'Carrefour Nouméa',
    chain: 'Carrefour',
    companyId: 'company-carrefour-france',
    territory: 'Nouvelle-Calédonie',
    city: 'Nouméa',
    address: 'Centre Commercial Kenu In',
    postalCode: '98800',
    coordinates: {
      lat: -22.2758,
      lon: 166.4580,
    },
    phone: '+687 687 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h',
    services: ['parking', 'carte_bancaire', 'livraison'],
  },
  {
    id: 'super_u_dumbea',
    name: 'Super U Dumbéa',
    chain: 'Système U',
    companyId: 'company-systeme-u',
    territory: 'Nouvelle-Calédonie',
    city: 'Dumbéa',
    address: 'Zone Commerciale',
    postalCode: '98835',
    coordinates: {
      lat: -22.1500,
      lon: 166.4500,
    },
    phone: '+687 687 XX XX XX',
    openingHours: 'Lun-Sam 8h-19h30',
    services: ['parking', 'carte_bancaire'],
  },
];

/**
 * Obtenir un magasin par son ID
 * @param {string} storeId - ID du magasin
 * @returns {Object|null} Magasin trouvé ou null
 */
export function getStoreById(storeId) {
  return SEED_STORES.find(store => store.id === storeId) || null;
}

/**
 * Obtenir tous les magasins d'un territoire
 * @param {string} territory - Nom du territoire
 * @returns {Array} Liste des magasins du territoire
 */
export function getStoresByTerritory(territory) {
  if (!territory || territory === 'all') {
    return SEED_STORES;
  }
  return SEED_STORES.filter(store => 
    store.territory.toLowerCase() === territory.toLowerCase(),
  );
}

/**
 * Obtenir tous les territoires disponibles
 * @returns {Array<string>} Liste des territoires
 */
export function getAvailableTerritories() {
  const territories = new Set();
  SEED_STORES.forEach(store => {
    territories.add(store.territory);
  });
  return Array.from(territories).sort();
}

/**
 * Obtenir tous les magasins
 * @returns {Array} Liste complète des magasins
 */
export function getAllStores() {
  return SEED_STORES;
}

/**
 * Rechercher des magasins par nom ou ville
 * @param {string} query - Terme de recherche
 * @returns {Array} Liste des magasins correspondants
 */
export function searchStores(query) {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  return SEED_STORES.filter(store => 
    store.name.toLowerCase().includes(lowerQuery) ||
    store.city.toLowerCase().includes(lowerQuery) ||
    store.chain.toLowerCase().includes(lowerQuery),
  );
}

/**
 * Obtenir les magasins par chaîne
 * @param {string} chain - Nom de la chaîne (Carrefour, Système U, etc.)
 * @returns {Array} Liste des magasins de la chaîne
 */
export function getStoresByChain(chain) {
  return SEED_STORES.filter(store => 
    store.chain.toLowerCase() === chain.toLowerCase(),
  );
}

/**
 * Mapper les territoires vers les codes utilisés dans carte.html
 * @param {string} territoryCode - Code du territoire (ex: 'guadeloupe')
 * @returns {string} Nom complet du territoire
 */
export function getTerritoryNameFromCode(territoryCode) {
  const mapping = {
    'guadeloupe': 'Guadeloupe',
    'martinique': 'Martinique',
    'guyane': 'Guyane',
    'reunion': 'La Réunion',
    'mayotte': 'Mayotte',
    'spm': 'Saint-Pierre-et-Miquelon',
    'stbarth': 'Saint-Barthélemy',
    'stmartin': 'Saint-Martin',
    'wallis': 'Wallis-et-Futuna',
    'polynesie': 'Polynésie française',
    'noumea': 'Nouvelle-Calédonie',
    'taaf': 'Terres australes et antarctiques françaises',
  };
  return mapping[territoryCode] || territoryCode;
}
