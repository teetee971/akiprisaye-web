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
  {
    id: 'casino_baie_mahault',
    name: 'Casino Baie-Mahault',
    chain: 'Casino',
    companyId: 'company-casino',
    territory: 'Guadeloupe',
    city: 'Baie-Mahault',
    address: 'Centre Commercial',
    postalCode: '97122',
    coordinates: {
      lat: 16.2650,
      lon: -61.5280,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h, Dim 8h-13h',
    services: ['parking', 'carte_bancaire', 'livraison'],
  },
  {
    id: 'hyper_casino_gosier',
    name: 'Hyper Casino Le Gosier',
    chain: 'Casino',
    companyId: 'company-casino',
    territory: 'Guadeloupe',
    city: 'Le Gosier',
    address: 'Zone Commerciale Bas du Fort',
    postalCode: '97190',
    coordinates: {
      lat: 16.2250,
      lon: -61.5050,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h30, Dim 8h-13h',
    services: ['parking', 'carte_bancaire', 'livraison', 'essence'],
  },
  {
    id: 'ecomax_pointe_pitre',
    name: 'Ecomax Pointe-à-Pitre',
    chain: 'Ecomax',
    companyId: 'company-ecomax',
    territory: 'Guadeloupe',
    city: 'Pointe-à-Pitre',
    address: 'Centre-ville',
    postalCode: '97110',
    coordinates: {
      lat: 16.2400,
      lon: -61.5350,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 7h-20h',
    services: ['parking', 'carte_bancaire'],
  },
  {
    id: 'ecomax_les_abymes',
    name: 'Ecomax Les Abymes',
    chain: 'Ecomax',
    companyId: 'company-ecomax',
    territory: 'Guadeloupe',
    city: 'Les Abymes',
    address: 'Zone de Jarry',
    postalCode: '97139',
    coordinates: {
      lat: 16.2700,
      lon: -61.5850,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 7h-20h',
    services: ['parking', 'carte_bancaire'],
  },
  {
    id: 'huit_a_huit_saint_francois',
    name: '8 à Huit Saint-François',
    chain: '8 à Huit',
    companyId: 'company-8ahuit',
    territory: 'Guadeloupe',
    city: 'Saint-François',
    address: 'Centre-ville',
    postalCode: '97118',
    coordinates: {
      lat: 16.2550,
      lon: -61.2750,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Dim 8h-20h',
    services: ['parking', 'carte_bancaire'],
  },
  {
    id: 'vival_sainte_rose',
    name: 'Vival Sainte-Rose',
    chain: 'Vival',
    companyId: 'company-vival',
    territory: 'Guadeloupe',
    city: 'Sainte-Rose',
    address: 'Centre-ville',
    postalCode: '97115',
    coordinates: {
      lat: 16.3300,
      lon: -61.7000,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 7h-20h, Dim 8h-13h',
    services: ['parking', 'carte_bancaire'],
  },
  {
    id: 'leclerc_sainte_rose',
    name: 'E.Leclerc Sainte-Rose',
    chain: 'E.Leclerc',
    companyId: 'company-leclerc',
    territory: 'Guadeloupe',
    city: 'Sainte-Rose',
    address: 'Zone Commerciale',
    postalCode: '97115',
    coordinates: {
      lat: 16.3320,
      lon: -61.6980,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h, Dim 8h-13h',
    services: ['parking', 'carte_bancaire', 'livraison', 'essence'],
  },
  // Bricolage
  {
    id: 'mr_bricolage_jarry',
    name: 'Mr. Bricolage Jarry',
    chain: 'Mr. Bricolage',
    companyId: 'company-mr-bricolage',
    territory: 'Guadeloupe',
    city: 'Les Abymes',
    address: 'Zone de Jarry',
    postalCode: '97139',
    coordinates: {
      lat: 16.2720,
      lon: -61.5900,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 7h30-19h',
    services: ['parking', 'carte_bancaire', 'livraison'],
  },
  {
    id: 'bricopro_baie_mahault',
    name: 'Bricopro Baie-Mahault',
    chain: 'Bricopro',
    companyId: 'company-bricopro',
    territory: 'Guadeloupe',
    city: 'Baie-Mahault',
    address: 'Zone Commerciale',
    postalCode: '97122',
    coordinates: {
      lat: 16.2690,
      lon: -61.5240,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 7h-19h',
    services: ['parking', 'carte_bancaire'],
  },
  // Électronique & Électroménager
  {
    id: 'darty_destreland',
    name: 'Darty Destreland',
    chain: 'Darty',
    companyId: 'company-darty',
    territory: 'Guadeloupe',
    city: 'Baie-Mahault',
    address: 'Centre Commercial Destreland',
    postalCode: '97122',
    coordinates: {
      lat: 16.2670,
      lon: -61.5260,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 9h-19h30',
    services: ['parking', 'carte_bancaire', 'livraison', 'SAV'],
  },
  {
    id: 'but_jarry',
    name: 'BUT Jarry',
    chain: 'BUT',
    companyId: 'company-but',
    territory: 'Guadeloupe',
    city: 'Les Abymes',
    address: 'Zone de Jarry',
    postalCode: '97139',
    coordinates: {
      lat: 16.2710,
      lon: -61.5880,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 9h-19h',
    services: ['parking', 'carte_bancaire', 'livraison'],
  },
  // Sport
  {
    id: 'decathlon_jarry',
    name: 'Décathlon Jarry',
    chain: 'Décathlon',
    companyId: 'company-decathlon',
    territory: 'Guadeloupe',
    city: 'Les Abymes',
    address: 'Zone de Jarry',
    postalCode: '97139',
    coordinates: {
      lat: 16.2730,
      lon: -61.5870,
    },
    phone: '+590 590 XX XX XX',
    openingHours: 'Lun-Sam 9h-20h, Dim 9h-13h',
    services: ['parking', 'carte_bancaire', 'livraison'],
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
  {
    id: 'auchan_la_galleria',
    name: 'Auchan La Galleria',
    chain: 'Auchan',
    companyId: 'company-auchan',
    territory: 'Martinique',
    city: 'Le Lamentin',
    address: 'Centre Commercial La Galleria',
    postalCode: '97232',
    coordinates: {
      lat: 14.6100,
      lon: -61.0000,
    },
    phone: '+596 596 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h30, Dim 8h-13h',
    services: ['parking', 'carte_bancaire', 'livraison', 'retrait_course'],
  },
  {
    id: 'geant_casino_bateliere',
    name: 'Géant Casino La Batelière',
    chain: 'Casino',
    companyId: 'company-casino',
    territory: 'Martinique',
    city: 'Schœlcher',
    address: 'La Batelière',
    postalCode: '97233',
    coordinates: {
      lat: 14.6140,
      lon: -61.0900,
    },
    phone: '+596 596 XX XX XX',
    openingHours: 'Lun-Sam 8h-21h, Dim 8h-13h',
    services: ['parking', 'carte_bancaire', 'livraison', 'essence'],
  },
  {
    id: 'leclerc_place_armes',
    name: 'E.Leclerc Place d\'Armes',
    chain: 'E.Leclerc',
    companyId: 'company-leclerc',
    territory: 'Martinique',
    city: 'Le Lamentin',
    address: 'Place d\'Armes',
    postalCode: '97232',
    coordinates: {
      lat: 14.6120,
      lon: -61.0010,
    },
    phone: '+596 596 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h, Dim 8h-13h',
    services: ['parking', 'carte_bancaire', 'livraison', 'essence'],
  },
  {
    id: 'simply_market_francois',
    name: 'Simply Market Le François',
    chain: 'Simply Market',
    companyId: 'company-simply-market',
    territory: 'Martinique',
    city: 'Le François',
    address: 'Centre-ville',
    postalCode: '97240',
    coordinates: {
      lat: 14.6180,
      lon: -60.9050,
    },
    phone: '+596 596 XX XX XX',
    openingHours: 'Lun-Sam 7h30-20h, Dim 8h-13h',
    services: ['parking', 'carte_bancaire'],
  },
  {
    id: 'leader_price_trinite',
    name: 'Leader Price La Trinité',
    chain: 'Leader Price',
    companyId: 'company-leader-price',
    territory: 'Martinique',
    city: 'La Trinité',
    address: 'Centre-ville',
    postalCode: '97220',
    coordinates: {
      lat: 14.7380,
      lon: -60.9680,
    },
    phone: '+596 596 XX XX XX',
    openingHours: 'Lun-Sam 7h-20h',
    services: ['parking', 'carte_bancaire'],
  },
  {
    id: 'euromarche_riviere_salee',
    name: 'Euromarché Rivière-Salée',
    chain: 'Euromarché',
    companyId: 'company-euromarche',
    territory: 'Martinique',
    city: 'Rivière-Salée',
    address: 'Centre-ville',
    postalCode: '97215',
    coordinates: {
      lat: 14.5300,
      lon: -60.9700,
    },
    phone: '+596 596 XX XX XX',
    openingHours: 'Lun-Sam 7h-20h',
    services: ['parking', 'carte_bancaire'],
  },
  // Bricolage
  {
    id: 'mr_bricolage_lamentin',
    name: 'Mr. Bricolage Le Lamentin',
    chain: 'Mr. Bricolage',
    companyId: 'company-mr-bricolage',
    territory: 'Martinique',
    city: 'Le Lamentin',
    address: 'Zone Industrielle',
    postalCode: '97232',
    coordinates: {
      lat: 14.6150,
      lon: -61.0020,
    },
    phone: '+596 596 XX XX XX',
    openingHours: 'Lun-Sam 7h30-19h',
    services: ['parking', 'carte_bancaire', 'livraison'],
  },
  // Électronique & Électroménager
  {
    id: 'but_acajou',
    name: 'BUT Acajou',
    chain: 'BUT',
    companyId: 'company-but',
    territory: 'Martinique',
    city: 'Le Lamentin',
    address: 'ZI Acajou Californie',
    postalCode: '97232',
    coordinates: {
      lat: 14.6130,
      lon: -61.0050,
    },
    phone: '+596 596 XX XX XX',
    openingHours: 'Lun-Sam 9h-19h',
    services: ['parking', 'carte_bancaire', 'livraison'],
  },
  {
    id: 'darty_cluny',
    name: 'Darty Cluny',
    chain: 'Darty',
    companyId: 'company-darty',
    territory: 'Martinique',
    city: 'Fort-de-France',
    address: 'Centre Commercial Cluny',
    postalCode: '97200',
    coordinates: {
      lat: 14.6050,
      lon: -61.0700,
    },
    phone: '+596 596 XX XX XX',
    openingHours: 'Lun-Sam 9h-19h30',
    services: ['parking', 'carte_bancaire', 'livraison', 'SAV'],
  },
  // Sport
  {
    id: 'decathlon_lamentin',
    name: 'Décathlon Le Lamentin',
    chain: 'Décathlon',
    companyId: 'company-decathlon',
    territory: 'Martinique',
    city: 'Le Lamentin',
    address: 'Zone Commerciale',
    postalCode: '97232',
    coordinates: {
      lat: 14.6140,
      lon: -61.0030,
    },
    phone: '+596 596 XX XX XX',
    openingHours: 'Lun-Sam 9h-20h, Dim 9h-13h',
    services: ['parking', 'carte_bancaire', 'livraison'],
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
  {
    id: 'casino_cayenne',
    name: 'Casino Cayenne',
    chain: 'Casino',
    companyId: 'company-casino',
    territory: 'Guyane',
    city: 'Cayenne',
    address: 'Centre Commercial',
    postalCode: '97300',
    coordinates: {
      lat: 4.9250,
      lon: -52.3150,
    },
    phone: '+594 594 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h, Dim 8h-13h',
    services: ['parking', 'carte_bancaire', 'livraison'],
  },
  {
    id: 'simply_market_saint_laurent',
    name: 'Simply Market Saint-Laurent-du-Maroni',
    chain: 'Simply Market',
    companyId: 'company-simply-market',
    territory: 'Guyane',
    city: 'Saint-Laurent-du-Maroni',
    address: 'Centre-ville',
    postalCode: '97320',
    coordinates: {
      lat: 5.4980,
      lon: -54.0300,
    },
    phone: '+594 594 XX XX XX',
    openingHours: 'Lun-Sam 7h30-20h',
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
  {
    id: 'casino_saint_denis',
    name: 'Casino Saint-Denis',
    chain: 'Casino',
    companyId: 'company-casino',
    territory: 'La Réunion',
    city: 'Saint-Denis',
    address: 'Centre-ville',
    postalCode: '97400',
    coordinates: {
      lat: -20.8800,
      lon: 55.4500,
    },
    phone: '+262 262 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h',
    services: ['parking', 'carte_bancaire'],
  },
  {
    id: 'leader_price_saint_pierre',
    name: 'Leader Price Saint-Pierre',
    chain: 'Leader Price',
    companyId: 'company-leader-price',
    territory: 'La Réunion',
    city: 'Saint-Pierre',
    address: 'Centre-ville',
    postalCode: '97410',
    coordinates: {
      lat: -21.3400,
      lon: 55.4800,
    },
    phone: '+262 262 XX XX XX',
    openingHours: 'Lun-Sam 7h-20h',
    services: ['parking', 'carte_bancaire'],
  },
  {
    id: 'auchan_saint_andre',
    name: 'Auchan Saint-André',
    chain: 'Auchan',
    companyId: 'company-auchan',
    territory: 'La Réunion',
    city: 'Saint-André',
    address: 'Centre Commercial',
    postalCode: '97440',
    coordinates: {
      lat: -20.9620,
      lon: 55.6480,
    },
    phone: '+262 262 XX XX XX',
    openingHours: 'Lun-Sam 8h-20h, Dim 8h-13h',
    services: ['parking', 'carte_bancaire', 'livraison'],
  },
  // Bricolage
  {
    id: 'bricomarche_saint_pierre',
    name: 'Bricomarché Saint-Pierre',
    chain: 'Bricomarché',
    companyId: 'company-bricomarche',
    territory: 'La Réunion',
    city: 'Saint-Pierre',
    address: 'Zone Commerciale',
    postalCode: '97410',
    coordinates: {
      lat: -21.3400,
      lon: 55.4820,
    },
    phone: '+262 262 XX XX XX',
    openingHours: 'Lun-Sam 8h-19h',
    services: ['parking', 'carte_bancaire'],
  },
  // Électronique & Électroménager
  {
    id: 'darty_saint_denis',
    name: 'Darty Saint-Denis',
    chain: 'Darty',
    companyId: 'company-darty',
    territory: 'La Réunion',
    city: 'Saint-Denis',
    address: 'Centre Commercial Chaudron',
    postalCode: '97490',
    coordinates: {
      lat: -20.8960,
      lon: 55.4860,
    },
    phone: '+262 262 XX XX XX',
    openingHours: 'Lun-Sam 9h-19h30',
    services: ['parking', 'carte_bancaire', 'livraison', 'SAV'],
  },
  {
    id: 'but_saint_pierre',
    name: 'BUT Saint-Pierre',
    chain: 'BUT',
    companyId: 'company-but',
    territory: 'La Réunion',
    city: 'Saint-Pierre',
    address: 'Zone Commerciale',
    postalCode: '97410',
    coordinates: {
      lat: -21.3380,
      lon: 55.4800,
    },
    phone: '+262 262 XX XX XX',
    openingHours: 'Lun-Sam 9h-19h',
    services: ['parking', 'carte_bancaire', 'livraison'],
  },
  // Sport
  {
    id: 'decathlon_saint_denis',
    name: 'Décathlon Saint-Denis',
    chain: 'Décathlon',
    companyId: 'company-decathlon',
    territory: 'La Réunion',
    city: 'Saint-Denis',
    address: 'Centre Commercial',
    postalCode: '97400',
    coordinates: {
      lat: -20.8920,
      lon: 55.4520,
    },
    phone: '+262 262 XX XX XX',
    openingHours: 'Lun-Sam 9h-20h, Dim 9h-13h',
    services: ['parking', 'carte_bancaire', 'livraison'],
  },
  {
    id: 'intersport_saint_paul',
    name: 'Intersport Saint-Paul',
    chain: 'Intersport',
    companyId: 'company-intersport',
    territory: 'La Réunion',
    city: 'Saint-Paul',
    address: 'Centre Commercial Savanna',
    postalCode: '97460',
    coordinates: {
      lat: -21.0110,
      lon: 55.2710,
    },
    phone: '+262 262 XX XX XX',
    openingHours: 'Lun-Sam 9h-19h30',
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
