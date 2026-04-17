/**
 * batimentStoresData.ts
 *
 * Catalogue des magasins de matériaux de construction DOM-TOM
 * avec prix indicatifs par produit et par territoire.
 *
 * Sources de prix : building-materials-prices.json (relevés citoyens),
 * sites officiels des enseignes, observations terrain.
 * Tous les prix sont à titre indicatif et peuvent varier.
 */

export type TerritoryCode = 'GP' | 'MQ' | 'GF' | 'RE' | 'YT';

export interface BatimentStore {
  id: string;
  name: string;
  brand: string;
  territory: TerritoryCode;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  openingHours: string;
  type: 'grande_surface' | 'negociant_pro' | 'negociant_local' | 'franchise';
  brandEmoji: string;
  brandColor: string; // tailwind bg class
  website: string;
  googleMapsUrl: string;
  featured?: boolean;
  catalogLabel?: string;
}

export interface ProductCatalogItem {
  id: string;
  label: string;
  reference: string;
  imageDescription: string; // text description used for alt
  category:
    | 'parpaing'
    | 'ciment'
    | 'sable'
    | 'gravier'
    | 'treillis'
    | 'peinture'
    | 'carrelage'
    | 'colle'
    | 'enduit'
    | 'tole'
    | 'acier'
    | 'autre';
  unit: string;
}

export interface StorePrice {
  storeId: string;
  productId: string;
  price: number;
  inStock: boolean;
  promotion?: string;
  note?: string;
}

// ─── Store Catalog ─────────────────────────────────────────────────────────────

export const BATISTORE_CATALOG: BatimentStore[] = [
  // ── Guadeloupe ──
  {
    id: 'bricoceram-gp',
    name: 'Bricoceram Baie-Mahault',
    brand: 'Bricoceram',
    territory: 'GP',
    address: 'ZAC de Moudong Sud',
    city: 'Baie-Mahault',
    postalCode: '97122',
    phone: '0590 26 14 14',
    openingHours: 'Lun–Sam 7h30–19h00 • Dim 8h00–12h30',
    type: 'grande_surface',
    brandEmoji: '🟠',
    brandColor: 'bg-orange-600',
    website: 'https://www.bricoceram.fr',
    googleMapsUrl: 'https://maps.google.com/?q=Bricoceram+Baie-Mahault+Guadeloupe',
    featured: true,
    catalogLabel: 'Nouveau catalogue disponible',
  },
  {
    id: 'leroy-gp',
    name: 'Leroy Merlin Guadeloupe',
    brand: 'Leroy Merlin',
    territory: 'GP',
    address: 'ZAC de Moudong Nord',
    city: 'Baie-Mahault',
    postalCode: '97122',
    phone: '0590 38 42 00',
    openingHours: 'Lun–Sam 7h30–19h30 • Dim 8h00–13h00',
    type: 'grande_surface',
    brandEmoji: '🟢',
    brandColor: 'bg-green-600',
    website: 'https://www.leroymerlin.fr',
    googleMapsUrl: 'https://maps.google.com/?q=Leroy+Merlin+Guadeloupe',
  },
  {
    id: 'mrbrico-gp',
    name: 'Mr. Bricolage Destreland',
    brand: 'Mr. Bricolage',
    territory: 'GP',
    address: 'Centre Commercial Destreland',
    city: 'Baie-Mahault',
    postalCode: '97122',
    phone: '0590 32 90 00',
    openingHours: 'Lun–Sam 8h00–19h00 • Dim 9h00–12h00',
    type: 'franchise',
    brandEmoji: '🔵',
    brandColor: 'bg-blue-600',
    website: 'https://www.mr-bricolage.fr',
    googleMapsUrl: 'https://maps.google.com/?q=Mr+Bricolage+Destreland+Guadeloupe',
  },
  {
    id: 'pointp-gp',
    name: 'Point P Jarry',
    brand: 'Point P',
    territory: 'GP',
    address: 'ZI Jarry – Rue des Électriciens',
    city: 'Baie-Mahault',
    postalCode: '97122',
    phone: '0590 26 97 97',
    openingHours: 'Lun–Ven 6h30–17h30 • Sam 7h00–12h00',
    type: 'negociant_pro',
    brandEmoji: '🔴',
    brandColor: 'bg-red-600',
    website: 'https://www.pointp.fr',
    googleMapsUrl: 'https://maps.google.com/?q=Point+P+Jarry+Guadeloupe',
  },
  {
    id: 'bondisbwa-gp',
    name: 'Bondis Bwa',
    brand: 'Bondis Bwa',
    territory: 'GP',
    address: 'Route de Versailles',
    city: 'Les Abymes',
    postalCode: '97139',
    phone: '0590 83 12 34',
    openingHours: 'Lun–Ven 7h00–17h00 • Sam 7h00–12h00',
    type: 'negociant_local',
    brandEmoji: '🟤',
    brandColor: 'bg-amber-700',
    website: 'https://www.bondisbwa.fr',
    googleMapsUrl: 'https://maps.google.com/?q=Bondis+Bwa+Les+Abymes+Guadeloupe',
  },

  // ── Martinique ──
  {
    id: 'bricoceram-mq',
    name: 'Bricoceram Le Lamentin',
    brand: 'Bricoceram',
    territory: 'MQ',
    address: 'ZI La Lézarde, Route de Rivière-Salée',
    city: 'Le Lamentin',
    postalCode: '97232',
    phone: '0596 50 14 14',
    openingHours: 'Lun–Sam 7h30–19h00 • Dim 8h00–12h30',
    type: 'grande_surface',
    brandEmoji: '🟠',
    brandColor: 'bg-orange-600',
    website: 'https://www.bricoceram.fr',
    googleMapsUrl: 'https://maps.google.com/?q=Bricoceram+Le+Lamentin+Martinique',
    featured: true,
    catalogLabel: 'Promotions en cours',
  },
  {
    id: 'leroy-mq',
    name: 'Leroy Merlin Martinique',
    brand: 'Leroy Merlin',
    territory: 'MQ',
    address: 'ZI La Jambette',
    city: 'Fort-de-France',
    postalCode: '97200',
    phone: '0596 75 68 00',
    openingHours: 'Lun–Sam 7h30–19h30 • Dim 8h00–13h00',
    type: 'grande_surface',
    brandEmoji: '🟢',
    brandColor: 'bg-green-600',
    website: 'https://www.leroymerlin.fr',
    googleMapsUrl: 'https://maps.google.com/?q=Leroy+Merlin+Fort-de-France+Martinique',
  },
  {
    id: 'pointp-mq',
    name: 'Point P Martinique',
    brand: 'Point P',
    territory: 'MQ',
    address: 'ZI La Lézarde',
    city: 'Le Lamentin',
    postalCode: '97232',
    phone: '0596 51 00 40',
    openingHours: 'Lun–Ven 6h30–17h30 • Sam 7h00–12h00',
    type: 'negociant_pro',
    brandEmoji: '🔴',
    brandColor: 'bg-red-600',
    website: 'https://www.pointp.fr',
    googleMapsUrl: 'https://maps.google.com/?q=Point+P+Le+Lamentin+Martinique',
  },
  {
    id: 'mrbrico-mq',
    name: 'Mr. Bricolage Martinique',
    brand: 'Mr. Bricolage',
    territory: 'MQ',
    address: 'Centre Commercial La Galleria',
    city: 'Le Lamentin',
    postalCode: '97232',
    phone: '0596 51 40 40',
    openingHours: 'Lun–Sam 8h00–19h00 • Dim 9h00–12h00',
    type: 'franchise',
    brandEmoji: '🔵',
    brandColor: 'bg-blue-600',
    website: 'https://www.mr-bricolage.fr',
    googleMapsUrl: 'https://maps.google.com/?q=Mr+Bricolage+Lamentin+Martinique',
  },

  // ── La Réunion ──
  {
    id: 'leroy-re',
    name: 'Leroy Merlin Saint-Paul',
    brand: 'Leroy Merlin',
    territory: 'RE',
    address: 'ZAC Cambaie, Route du Portail',
    city: 'Saint-Paul',
    postalCode: '97460',
    phone: '0262 45 68 00',
    openingHours: 'Lun–Sam 7h30–19h30 • Dim 8h00–13h00',
    type: 'grande_surface',
    brandEmoji: '🟢',
    brandColor: 'bg-green-600',
    website: 'https://www.leroymerlin.fr',
    googleMapsUrl: 'https://maps.google.com/?q=Leroy+Merlin+Saint-Paul+Reunion',
    featured: true,
  },
  {
    id: 'castorama-re',
    name: 'Castorama Saint-Denis',
    brand: 'Castorama',
    territory: 'RE',
    address: 'Centre Cial Saint-Denis 2',
    city: 'Saint-Denis',
    postalCode: '97400',
    phone: '0262 90 36 10',
    openingHours: 'Lun–Sam 8h00–19h00 • Dim 9h00–12h30',
    type: 'grande_surface',
    brandEmoji: '🟡',
    brandColor: 'bg-yellow-600',
    website: 'https://www.castorama.fr',
    googleMapsUrl: 'https://maps.google.com/?q=Castorama+Saint-Denis+Reunion',
  },
  {
    id: 'batimat-re',
    name: 'Batimat Océan Indien',
    brand: 'Batimat OI',
    territory: 'RE',
    address: 'ZI du Chaudron',
    city: 'Saint-André',
    postalCode: '97440',
    phone: '0262 58 40 20',
    openingHours: 'Lun–Ven 7h00–17h00 • Sam 7h00–12h00',
    type: 'negociant_pro',
    brandEmoji: '🟤',
    brandColor: 'bg-amber-800',
    website: 'https://batimat-oi.re',
    googleMapsUrl: 'https://maps.google.com/?q=Batimat+Reunion',
  },
  {
    id: 'pointp-re',
    name: 'Point P Le Port',
    brand: 'Point P',
    territory: 'RE',
    address: 'ZI du Port – Rue Pierre et Marie Curie',
    city: 'Le Port',
    postalCode: '97420',
    phone: '0262 42 85 00',
    openingHours: 'Lun–Ven 6h30–17h30 • Sam 7h00–12h00',
    type: 'negociant_pro',
    brandEmoji: '🔴',
    brandColor: 'bg-red-600',
    website: 'https://www.pointp.fr',
    googleMapsUrl: 'https://maps.google.com/?q=Point+P+Le+Port+Reunion',
  },

  // ── Guyane ──
  {
    id: 'pointp-gf',
    name: 'Point P Cayenne',
    brand: 'Point P',
    territory: 'GF',
    address: 'ZI Collery 4',
    city: 'Cayenne',
    postalCode: '97300',
    phone: '0594 28 00 50',
    openingHours: 'Lun–Ven 6h30–17h00 • Sam 7h00–12h00',
    type: 'negociant_pro',
    brandEmoji: '🔴',
    brandColor: 'bg-red-600',
    website: 'https://www.pointp.fr',
    googleMapsUrl: 'https://maps.google.com/?q=Point+P+Cayenne+Guyane',
    featured: true,
  },
  {
    id: 'bricomarche-gf',
    name: 'Brico Marché Cayenne',
    brand: 'Brico Marché',
    territory: 'GF',
    address: 'Centre Commercial Rémire',
    city: 'Rémire-Montjoly',
    postalCode: '97354',
    phone: '0594 35 12 00',
    openingHours: 'Lun–Sam 8h00–19h00 • Dim 9h00–13h00',
    type: 'franchise',
    brandEmoji: '🔵',
    brandColor: 'bg-blue-700',
    website: 'https://www.bricomarche.com',
    googleMapsUrl: 'https://maps.google.com/?q=Brico+Marche+Cayenne+Guyane',
  },

  // ── Mayotte ──
  {
    id: 'pointp-yt',
    name: 'Point P Mamoudzou',
    brand: 'Point P',
    territory: 'YT',
    address: 'ZI de Kawéni',
    city: 'Mamoudzou',
    postalCode: '97600',
    phone: '0269 61 14 60',
    openingHours: 'Lun–Ven 7h00–17h00 • Sam 7h00–12h00',
    type: 'negociant_pro',
    brandEmoji: '🔴',
    brandColor: 'bg-red-600',
    website: 'https://www.pointp.fr',
    googleMapsUrl: 'https://maps.google.com/?q=Point+P+Mamoudzou+Mayotte',
    featured: true,
  },
  {
    id: 'batimat-yt',
    name: 'Batimat Mayotte',
    brand: 'Batimat',
    territory: 'YT',
    address: 'Route Nationale 1',
    city: 'Bandraboua',
    postalCode: '97680',
    phone: '0269 60 81 00',
    openingHours: 'Lun–Ven 7h00–17h00 • Sam 7h00–12h00',
    type: 'negociant_pro',
    brandEmoji: '🟤',
    brandColor: 'bg-amber-800',
    website: 'https://batimat-oi.re',
    googleMapsUrl: 'https://maps.google.com/?q=Batimat+Mayotte',
  },
];

// ─── Product Catalog ──────────────────────────────────────────────────────────

export const PRODUCT_CATALOG: ProductCatalogItem[] = [
  {
    id: 'parpaing_15',
    label: 'Parpaing 15×20×50',
    reference: 'Parpaing creux béton 15cm',
    imageDescription: 'Parpaing béton gris 15x20x50cm',
    category: 'parpaing',
    unit: 'unité',
  },
  {
    id: 'parpaing_20',
    label: 'Parpaing 20×20×50',
    reference: 'Parpaing creux béton 20cm',
    imageDescription: 'Parpaing béton gris 20x20x50cm',
    category: 'parpaing',
    unit: 'unité',
  },
  {
    id: 'parpaing_7',
    label: 'Parpaing 7×20×50',
    reference: 'Parpaing creux béton 7cm',
    imageDescription: 'Parpaing béton gris 7x20x50cm',
    category: 'parpaing',
    unit: 'unité',
  },
  {
    id: 'bloc_us_14',
    label: 'Bloc US 14×19×39',
    reference: 'Bloc béton US 14cm',
    imageDescription: 'Bloc béton US 14x19x39cm',
    category: 'parpaing',
    unit: 'unité',
  },
  {
    id: 'ciment_25kg',
    label: 'Ciment CPJ 32.5 – 25 kg',
    reference: 'Sac ciment CPJ 32.5 25kg',
    imageDescription: 'Sac de ciment gris 25kg',
    category: 'ciment',
    unit: 'sac 25 kg',
  },
  {
    id: 'ciment_35kg',
    label: 'Ciment CPJ 32.5 – 35 kg',
    reference: 'Sac ciment CPJ 32.5 35kg',
    imageDescription: 'Sac de ciment gris 35kg',
    category: 'ciment',
    unit: 'sac 35 kg',
  },
  {
    id: 'sable_25kg',
    label: 'Sable 0/5 – 25 kg',
    reference: 'Sable maçonnerie 0/5 25kg',
    imageDescription: 'Sac de sable beige 25kg 0/5',
    category: 'sable',
    unit: 'sac 25 kg',
  },
  {
    id: 'gravier_25kg',
    label: 'Gravier 0/20 – 25 kg',
    reference: 'Gravier béton 0/20 25kg',
    imageDescription: 'Sac de gravier concassé 25kg',
    category: 'gravier',
    unit: 'sac 25 kg',
  },
  {
    id: 'treillis_1224',
    label: 'Treillis soudé 1,2×2,4 m',
    reference: 'Panneau treillis ST25',
    imageDescription: 'Panneau de treillis soudé acier',
    category: 'treillis',
    unit: 'panneau',
  },
  {
    id: 'peinture_10L',
    label: 'Peinture blanche mat 10 L',
    reference: 'Peinture intérieure blanche',
    imageDescription: 'Bidon peinture blanche 10L',
    category: 'peinture',
    unit: 'bidon 10 L',
  },
  {
    id: 'peinture_15L',
    label: 'Peinture blanche mat 15 L',
    reference: 'Peinture intérieure blanche',
    imageDescription: 'Bidon peinture blanche 15L',
    category: 'peinture',
    unit: 'bidon 15 L',
  },
  {
    id: 'carrelage_60',
    label: 'Carrelage sol 60×60 cm',
    reference: 'Carrelage grès cérame rectifié',
    imageDescription: 'Carrelage grès 60x60cm gris clair',
    category: 'carrelage',
    unit: 'm²',
  },
  {
    id: 'colle_25kg',
    label: 'Colle carrelage C1 – 25 kg',
    reference: 'Colle à carrelage C1T',
    imageDescription: 'Sac de colle blanche carrelage 25kg',
    category: 'colle',
    unit: 'sac 25 kg',
  },
  {
    id: 'joint_5kg',
    label: 'Jointement carrelage – 5 kg',
    reference: 'Mortier joint souple',
    imageDescription: 'Sac de joint carrelage gris 5kg',
    category: 'colle',
    unit: 'sac 5 kg',
  },
  // Enduit / façade
  {
    id: 'enduit_25kg',
    label: 'Enduit façade – 25 kg',
    reference: 'Enduit de façade minéral',
    imageDescription: 'Sac enduit blanc façade 25kg',
    category: 'enduit',
    unit: 'sac 25 kg',
  },
  // Tôles couverture
  {
    id: 'tole_3m',
    label: 'Tôle ondulée acier galvanisé 3 m',
    reference: 'Tôle ondulée Zinguée 3m',
    imageDescription: 'Tôle ondulée galvanisée grise 3m',
    category: 'tole',
    unit: 'pièce',
  },
  {
    id: 'tole_4m',
    label: 'Tôle ondulée acier galvanisé 4 m',
    reference: 'Tôle ondulée Zinguée 4m',
    imageDescription: 'Tôle ondulée galvanisée grise 4m',
    category: 'tole',
    unit: 'pièce',
  },
  {
    id: 'vis_autoperceuse_100',
    label: 'Vis auto-perceuses 5,5×38 (boîte 100)',
    reference: 'Vis tôles à tête hex',
    imageDescription: 'Boîte de vis auto-perceuses pour tôle',
    category: 'autre',
    unit: 'boîte 100',
  },
  // Acier / ferraillage
  {
    id: 'acier_ha12_6m',
    label: 'Barre acier HA 12 mm – 6 m',
    reference: 'Acier à béton HA12',
    imageDescription: 'Barre acier nervuré 12mm longueur 6m',
    category: 'acier',
    unit: 'barre 6 m',
  },
];

// ─── Store Prices ─────────────────────────────────────────────────────────────
// Prices in € per unit. Based on citizen observations + official sources.
// Updated: 2026-02

export const STORE_PRICES: StorePrice[] = [
  // ── Bricoceram Baie-Mahault (GP) ──
  { storeId: 'bricoceram-gp', productId: 'parpaing_15', price: 1.65, inStock: true },
  { storeId: 'bricoceram-gp', productId: 'parpaing_20', price: 1.89, inStock: true },
  { storeId: 'bricoceram-gp', productId: 'parpaing_7', price: 1.35, inStock: true },
  { storeId: 'bricoceram-gp', productId: 'bloc_us_14', price: 2.1, inStock: true },
  {
    storeId: 'bricoceram-gp',
    productId: 'ciment_25kg',
    price: 8.9,
    inStock: true,
    promotion: '-10% ce mois',
  },
  { storeId: 'bricoceram-gp', productId: 'ciment_35kg', price: 11.5, inStock: true },
  { storeId: 'bricoceram-gp', productId: 'sable_25kg', price: 6.5, inStock: true },
  { storeId: 'bricoceram-gp', productId: 'gravier_25kg', price: 6.9, inStock: true },
  { storeId: 'bricoceram-gp', productId: 'treillis_1224', price: 18.5, inStock: true },
  { storeId: 'bricoceram-gp', productId: 'peinture_10L', price: 34.9, inStock: true },
  { storeId: 'bricoceram-gp', productId: 'peinture_15L', price: 47.9, inStock: true },
  { storeId: 'bricoceram-gp', productId: 'carrelage_60', price: 27.5, inStock: true },
  { storeId: 'bricoceram-gp', productId: 'colle_25kg', price: 14.9, inStock: true },
  { storeId: 'bricoceram-gp', productId: 'joint_5kg', price: 9.5, inStock: true },
  // Nouveaux produits — GP
  { storeId: 'bricoceram-gp', productId: 'enduit_25kg', price: 12.9, inStock: true },
  { storeId: 'bricoceram-gp', productId: 'tole_3m', price: 14.5, inStock: true },
  { storeId: 'bricoceram-gp', productId: 'tole_4m', price: 18.9, inStock: true },
  { storeId: 'bricoceram-gp', productId: 'vis_autoperceuse_100', price: 8.9, inStock: true },
  { storeId: 'bricoceram-gp', productId: 'acier_ha12_6m', price: 7.8, inStock: true },

  // ── Leroy Merlin (GP) ──
  { storeId: 'leroy-gp', productId: 'parpaing_15', price: 1.55, inStock: true },
  { storeId: 'leroy-gp', productId: 'parpaing_20', price: 1.79, inStock: true },
  { storeId: 'leroy-gp', productId: 'parpaing_7', price: 1.29, inStock: true },
  { storeId: 'leroy-gp', productId: 'bloc_us_14', price: 2.05, inStock: true },
  { storeId: 'leroy-gp', productId: 'ciment_25kg', price: 8.5, inStock: true },
  { storeId: 'leroy-gp', productId: 'ciment_35kg', price: 10.9, inStock: true },
  { storeId: 'leroy-gp', productId: 'sable_25kg', price: 6.2, inStock: true },
  { storeId: 'leroy-gp', productId: 'gravier_25kg', price: 6.5, inStock: true },
  { storeId: 'leroy-gp', productId: 'treillis_1224', price: 17.9, inStock: true },
  { storeId: 'leroy-gp', productId: 'peinture_10L', price: 32.9, inStock: true },
  { storeId: 'leroy-gp', productId: 'peinture_15L', price: 44.9, inStock: true },
  { storeId: 'leroy-gp', productId: 'carrelage_60', price: 24.9, inStock: true },
  { storeId: 'leroy-gp', productId: 'colle_25kg', price: 13.9, inStock: true },
  { storeId: 'leroy-gp', productId: 'joint_5kg', price: 8.9, inStock: true },
  { storeId: 'leroy-gp', productId: 'enduit_25kg', price: 11.9, inStock: true },
  { storeId: 'leroy-gp', productId: 'tole_3m', price: 13.9, inStock: true },
  { storeId: 'leroy-gp', productId: 'tole_4m', price: 17.9, inStock: true },
  { storeId: 'leroy-gp', productId: 'vis_autoperceuse_100', price: 8.2, inStock: true },
  { storeId: 'leroy-gp', productId: 'acier_ha12_6m', price: 7.4, inStock: true },

  // ── Mr. Bricolage (GP) ──
  { storeId: 'mrbrico-gp', productId: 'parpaing_15', price: 1.7, inStock: true },
  { storeId: 'mrbrico-gp', productId: 'parpaing_20', price: 1.95, inStock: true },
  { storeId: 'mrbrico-gp', productId: 'ciment_25kg', price: 9.2, inStock: true },
  { storeId: 'mrbrico-gp', productId: 'ciment_35kg', price: 12.1, inStock: true },
  { storeId: 'mrbrico-gp', productId: 'sable_25kg', price: 6.8, inStock: true },
  {
    storeId: 'mrbrico-gp',
    productId: 'gravier_25kg',
    price: 7.1,
    inStock: false,
    note: 'Sur commande',
  },
  { storeId: 'mrbrico-gp', productId: 'treillis_1224', price: 19.9, inStock: true },
  { storeId: 'mrbrico-gp', productId: 'peinture_10L', price: 35.9, inStock: true },
  { storeId: 'mrbrico-gp', productId: 'peinture_15L', price: 49.9, inStock: true },
  { storeId: 'mrbrico-gp', productId: 'carrelage_60', price: 28.9, inStock: true },
  { storeId: 'mrbrico-gp', productId: 'colle_25kg', price: 15.2, inStock: true },
  { storeId: 'mrbrico-gp', productId: 'joint_5kg', price: 9.9, inStock: true },
  { storeId: 'mrbrico-gp', productId: 'enduit_25kg', price: 13.5, inStock: true },
  { storeId: 'mrbrico-gp', productId: 'tole_3m', price: 15.5, inStock: true },
  { storeId: 'mrbrico-gp', productId: 'tole_4m', price: 19.9, inStock: true },
  { storeId: 'mrbrico-gp', productId: 'vis_autoperceuse_100', price: 9.5, inStock: true },
  {
    storeId: 'mrbrico-gp',
    productId: 'acier_ha12_6m',
    price: 8.2,
    inStock: false,
    note: 'Sur commande',
  },

  // ── Point P Jarry (GP) ──
  { storeId: 'pointp-gp', productId: 'parpaing_15', price: 1.42, inStock: true, note: 'Prix pro' },
  { storeId: 'pointp-gp', productId: 'parpaing_20', price: 1.68, inStock: true, note: 'Prix pro' },
  { storeId: 'pointp-gp', productId: 'parpaing_7', price: 1.18, inStock: true },
  { storeId: 'pointp-gp', productId: 'bloc_us_14', price: 1.95, inStock: true },
  { storeId: 'pointp-gp', productId: 'ciment_25kg', price: 8.2, inStock: true, note: 'Prix pro' },
  { storeId: 'pointp-gp', productId: 'ciment_35kg', price: 10.5, inStock: true },
  { storeId: 'pointp-gp', productId: 'sable_25kg', price: 5.9, inStock: true },
  { storeId: 'pointp-gp', productId: 'gravier_25kg', price: 6.2, inStock: true },
  { storeId: 'pointp-gp', productId: 'treillis_1224', price: 16.8, inStock: true },
  { storeId: 'pointp-gp', productId: 'peinture_10L', price: 33.5, inStock: true },
  { storeId: 'pointp-gp', productId: 'carrelage_60', price: 22.9, inStock: true },
  { storeId: 'pointp-gp', productId: 'colle_25kg', price: 12.9, inStock: true },
  { storeId: 'pointp-gp', productId: 'joint_5kg', price: 8.5, inStock: true },
  { storeId: 'pointp-gp', productId: 'enduit_25kg', price: 11.2, inStock: true, note: 'Prix pro' },
  { storeId: 'pointp-gp', productId: 'tole_3m', price: 12.9, inStock: true, note: 'Prix pro' },
  { storeId: 'pointp-gp', productId: 'tole_4m', price: 16.9, inStock: true, note: 'Prix pro' },
  { storeId: 'pointp-gp', productId: 'vis_autoperceuse_100', price: 7.9, inStock: true },
  { storeId: 'pointp-gp', productId: 'acier_ha12_6m', price: 6.9, inStock: true, note: 'Prix pro' },

  // ── Bondis Bwa (GP) ──
  { storeId: 'bondisbwa-gp', productId: 'parpaing_15', price: 1.48, inStock: true },
  { storeId: 'bondisbwa-gp', productId: 'parpaing_20', price: 1.72, inStock: true },
  { storeId: 'bondisbwa-gp', productId: 'ciment_25kg', price: 8.6, inStock: true },
  { storeId: 'bondisbwa-gp', productId: 'ciment_35kg', price: 11.0, inStock: true },
  { storeId: 'bondisbwa-gp', productId: 'sable_25kg', price: 6.0, inStock: true },
  { storeId: 'bondisbwa-gp', productId: 'gravier_25kg', price: 6.3, inStock: true },
  { storeId: 'bondisbwa-gp', productId: 'treillis_1224', price: 17.5, inStock: true },
  { storeId: 'bondisbwa-gp', productId: 'enduit_25kg', price: 12.2, inStock: true },
  { storeId: 'bondisbwa-gp', productId: 'tole_3m', price: 14.2, inStock: true },
  { storeId: 'bondisbwa-gp', productId: 'tole_4m', price: 18.5, inStock: true },
  { storeId: 'bondisbwa-gp', productId: 'acier_ha12_6m', price: 7.5, inStock: true },

  // ── Bricoceram Le Lamentin (MQ) ──
  { storeId: 'bricoceram-mq', productId: 'parpaing_15', price: 1.62, inStock: true },
  { storeId: 'bricoceram-mq', productId: 'parpaing_20', price: 1.85, inStock: true },
  {
    storeId: 'bricoceram-mq',
    productId: 'ciment_25kg',
    price: 8.8,
    inStock: true,
    promotion: 'Pack 10 sacs -8%',
  },
  { storeId: 'bricoceram-mq', productId: 'ciment_35kg', price: 11.2, inStock: true },
  { storeId: 'bricoceram-mq', productId: 'sable_25kg', price: 6.4, inStock: true },
  { storeId: 'bricoceram-mq', productId: 'gravier_25kg', price: 6.8, inStock: true },
  { storeId: 'bricoceram-mq', productId: 'treillis_1224', price: 18.2, inStock: true },
  { storeId: 'bricoceram-mq', productId: 'peinture_10L', price: 33.9, inStock: true },
  { storeId: 'bricoceram-mq', productId: 'peinture_15L', price: 46.9, inStock: true },
  { storeId: 'bricoceram-mq', productId: 'carrelage_60', price: 26.5, inStock: true },
  { storeId: 'bricoceram-mq', productId: 'colle_25kg', price: 14.5, inStock: true },
  { storeId: 'bricoceram-mq', productId: 'joint_5kg', price: 9.2, inStock: true },
  { storeId: 'bricoceram-mq', productId: 'enduit_25kg', price: 12.6, inStock: true },
  { storeId: 'bricoceram-mq', productId: 'tole_3m', price: 14.2, inStock: true },
  { storeId: 'bricoceram-mq', productId: 'tole_4m', price: 18.5, inStock: true },
  { storeId: 'bricoceram-mq', productId: 'vis_autoperceuse_100', price: 8.7, inStock: true },
  { storeId: 'bricoceram-mq', productId: 'acier_ha12_6m', price: 7.6, inStock: true },

  // ── Leroy Merlin (MQ) ──
  { storeId: 'leroy-mq', productId: 'parpaing_15', price: 1.52, inStock: true },
  { storeId: 'leroy-mq', productId: 'parpaing_20', price: 1.75, inStock: true },
  { storeId: 'leroy-mq', productId: 'ciment_25kg', price: 8.4, inStock: true },
  { storeId: 'leroy-mq', productId: 'ciment_35kg', price: 10.7, inStock: true },
  { storeId: 'leroy-mq', productId: 'sable_25kg', price: 6.1, inStock: true },
  { storeId: 'leroy-mq', productId: 'gravier_25kg', price: 6.4, inStock: true },
  { storeId: 'leroy-mq', productId: 'treillis_1224', price: 17.6, inStock: true },
  { storeId: 'leroy-mq', productId: 'peinture_10L', price: 32.5, inStock: true },
  { storeId: 'leroy-mq', productId: 'peinture_15L', price: 43.9, inStock: true },
  { storeId: 'leroy-mq', productId: 'carrelage_60', price: 24.5, inStock: true },
  { storeId: 'leroy-mq', productId: 'colle_25kg', price: 13.7, inStock: true },
  { storeId: 'leroy-mq', productId: 'joint_5kg', price: 8.7, inStock: true },
  { storeId: 'leroy-mq', productId: 'enduit_25kg', price: 11.7, inStock: true },
  { storeId: 'leroy-mq', productId: 'tole_3m', price: 13.7, inStock: true },
  { storeId: 'leroy-mq', productId: 'tole_4m', price: 17.7, inStock: true },
  { storeId: 'leroy-mq', productId: 'vis_autoperceuse_100', price: 8.0, inStock: true },
  { storeId: 'leroy-mq', productId: 'acier_ha12_6m', price: 7.2, inStock: true },

  // ── Point P (MQ) ──
  { storeId: 'pointp-mq', productId: 'parpaing_15', price: 1.4, inStock: true, note: 'Prix pro' },
  { storeId: 'pointp-mq', productId: 'parpaing_20', price: 1.65, inStock: true, note: 'Prix pro' },
  { storeId: 'pointp-mq', productId: 'ciment_25kg', price: 8.1, inStock: true },
  { storeId: 'pointp-mq', productId: 'ciment_35kg', price: 10.3, inStock: true },
  { storeId: 'pointp-mq', productId: 'sable_25kg', price: 5.8, inStock: true },
  { storeId: 'pointp-mq', productId: 'gravier_25kg', price: 6.1, inStock: true },
  { storeId: 'pointp-mq', productId: 'treillis_1224', price: 16.5, inStock: true },
  { storeId: 'pointp-mq', productId: 'enduit_25kg', price: 11.0, inStock: true, note: 'Prix pro' },
  { storeId: 'pointp-mq', productId: 'tole_3m', price: 12.6, inStock: true },
  { storeId: 'pointp-mq', productId: 'tole_4m', price: 16.5, inStock: true },
  { storeId: 'pointp-mq', productId: 'acier_ha12_6m', price: 6.8, inStock: true, note: 'Prix pro' },

  // ── Leroy Merlin Saint-Paul (RE) ──
  { storeId: 'leroy-re', productId: 'parpaing_15', price: 1.35, inStock: true },
  { storeId: 'leroy-re', productId: 'parpaing_20', price: 1.58, inStock: true },
  { storeId: 'leroy-re', productId: 'ciment_25kg', price: 7.9, inStock: true },
  { storeId: 'leroy-re', productId: 'ciment_35kg', price: 9.8, inStock: true },
  { storeId: 'leroy-re', productId: 'sable_25kg', price: 5.4, inStock: true },
  { storeId: 'leroy-re', productId: 'gravier_25kg', price: 5.8, inStock: true },
  { storeId: 'leroy-re', productId: 'treillis_1224', price: 15.9, inStock: true },
  { storeId: 'leroy-re', productId: 'peinture_10L', price: 30.9, inStock: true },
  { storeId: 'leroy-re', productId: 'peinture_15L', price: 41.9, inStock: true },
  { storeId: 'leroy-re', productId: 'carrelage_60', price: 22.5, inStock: true },
  { storeId: 'leroy-re', productId: 'colle_25kg', price: 12.5, inStock: true },
  { storeId: 'leroy-re', productId: 'joint_5kg', price: 8.2, inStock: true },
  { storeId: 'leroy-re', productId: 'enduit_25kg', price: 10.9, inStock: true },
  { storeId: 'leroy-re', productId: 'tole_3m', price: 12.5, inStock: true },
  { storeId: 'leroy-re', productId: 'tole_4m', price: 15.9, inStock: true },
  { storeId: 'leroy-re', productId: 'vis_autoperceuse_100', price: 7.5, inStock: true },
  { storeId: 'leroy-re', productId: 'acier_ha12_6m', price: 6.9, inStock: true },

  // ── Castorama Saint-Denis (RE) ──
  { storeId: 'castorama-re', productId: 'parpaing_15', price: 1.38, inStock: true },
  { storeId: 'castorama-re', productId: 'parpaing_20', price: 1.62, inStock: true },
  { storeId: 'castorama-re', productId: 'ciment_25kg', price: 8.1, inStock: true },
  { storeId: 'castorama-re', productId: 'sable_25kg', price: 5.6, inStock: true },
  { storeId: 'castorama-re', productId: 'gravier_25kg', price: 5.9, inStock: true },
  { storeId: 'castorama-re', productId: 'treillis_1224', price: 16.2, inStock: true },
  { storeId: 'castorama-re', productId: 'peinture_10L', price: 31.5, inStock: true },
  { storeId: 'castorama-re', productId: 'carrelage_60', price: 23.9, inStock: true },
  { storeId: 'castorama-re', productId: 'colle_25kg', price: 13.2, inStock: true },
  { storeId: 'castorama-re', productId: 'joint_5kg', price: 8.5, inStock: true },
  { storeId: 'castorama-re', productId: 'enduit_25kg', price: 11.2, inStock: true },
  { storeId: 'castorama-re', productId: 'tole_3m', price: 13.2, inStock: true },
  { storeId: 'castorama-re', productId: 'tole_4m', price: 16.9, inStock: true },
  { storeId: 'castorama-re', productId: 'vis_autoperceuse_100', price: 7.9, inStock: true },
  { storeId: 'castorama-re', productId: 'acier_ha12_6m', price: 7.1, inStock: true },

  // ── Batimat OI (RE) ──
  { storeId: 'batimat-re', productId: 'parpaing_15', price: 1.28, inStock: true, note: 'Prix pro' },
  { storeId: 'batimat-re', productId: 'parpaing_20', price: 1.5, inStock: true, note: 'Prix pro' },
  { storeId: 'batimat-re', productId: 'ciment_25kg', price: 7.6, inStock: true, note: 'Prix pro' },
  { storeId: 'batimat-re', productId: 'sable_25kg', price: 5.2, inStock: true },
  { storeId: 'batimat-re', productId: 'gravier_25kg', price: 5.5, inStock: true },
  { storeId: 'batimat-re', productId: 'treillis_1224', price: 15.5, inStock: true },
  { storeId: 'batimat-re', productId: 'enduit_25kg', price: 10.2, inStock: true, note: 'Prix pro' },
  { storeId: 'batimat-re', productId: 'tole_3m', price: 11.8, inStock: true, note: 'Prix pro' },
  { storeId: 'batimat-re', productId: 'tole_4m', price: 15.2, inStock: true, note: 'Prix pro' },
  {
    storeId: 'batimat-re',
    productId: 'acier_ha12_6m',
    price: 6.5,
    inStock: true,
    note: 'Prix pro',
  },

  // ── Point P (RE) ──
  { storeId: 'pointp-re', productId: 'parpaing_15', price: 1.3, inStock: true },
  { storeId: 'pointp-re', productId: 'parpaing_20', price: 1.52, inStock: true },
  { storeId: 'pointp-re', productId: 'ciment_25kg', price: 7.7, inStock: true },
  { storeId: 'pointp-re', productId: 'sable_25kg', price: 5.3, inStock: true },
  { storeId: 'pointp-re', productId: 'gravier_25kg', price: 5.6, inStock: true },
  { storeId: 'pointp-re', productId: 'treillis_1224', price: 15.7, inStock: true },
  { storeId: 'pointp-re', productId: 'enduit_25kg', price: 10.5, inStock: true },
  { storeId: 'pointp-re', productId: 'tole_3m', price: 12.0, inStock: true },
  { storeId: 'pointp-re', productId: 'tole_4m', price: 15.5, inStock: true },
  { storeId: 'pointp-re', productId: 'acier_ha12_6m', price: 6.7, inStock: true },

  // ── Point P Cayenne (GF) ──
  { storeId: 'pointp-gf', productId: 'parpaing_15', price: 1.78, inStock: true },
  { storeId: 'pointp-gf', productId: 'parpaing_20', price: 2.05, inStock: true },
  { storeId: 'pointp-gf', productId: 'ciment_25kg', price: 10.5, inStock: true },
  { storeId: 'pointp-gf', productId: 'ciment_35kg', price: 13.5, inStock: true },
  { storeId: 'pointp-gf', productId: 'sable_25kg', price: 7.8, inStock: true },
  { storeId: 'pointp-gf', productId: 'gravier_25kg', price: 8.2, inStock: true },
  { storeId: 'pointp-gf', productId: 'treillis_1224', price: 21.0, inStock: true },
  { storeId: 'pointp-gf', productId: 'peinture_10L', price: 38.0, inStock: true },
  { storeId: 'pointp-gf', productId: 'carrelage_60', price: 29.9, inStock: true },
  { storeId: 'pointp-gf', productId: 'enduit_25kg', price: 15.5, inStock: true },
  { storeId: 'pointp-gf', productId: 'tole_3m', price: 17.9, inStock: true },
  { storeId: 'pointp-gf', productId: 'tole_4m', price: 22.9, inStock: true },
  { storeId: 'pointp-gf', productId: 'vis_autoperceuse_100', price: 11.5, inStock: true },
  { storeId: 'pointp-gf', productId: 'acier_ha12_6m', price: 9.8, inStock: true },

  // ── Brico Marché Cayenne (GF) ──
  { storeId: 'bricomarche-gf', productId: 'parpaing_15', price: 1.82, inStock: true },
  { storeId: 'bricomarche-gf', productId: 'ciment_25kg', price: 10.9, inStock: true },
  { storeId: 'bricomarche-gf', productId: 'sable_25kg', price: 8.0, inStock: true },
  {
    storeId: 'bricomarche-gf',
    productId: 'gravier_25kg',
    price: 8.5,
    inStock: false,
    note: 'Sur commande',
  },
  { storeId: 'bricomarche-gf', productId: 'peinture_10L', price: 39.5, inStock: true },
  { storeId: 'bricomarche-gf', productId: 'carrelage_60', price: 32.0, inStock: true },
  { storeId: 'bricomarche-gf', productId: 'enduit_25kg', price: 16.0, inStock: true },
  { storeId: 'bricomarche-gf', productId: 'tole_3m', price: 18.5, inStock: true },
  {
    storeId: 'bricomarche-gf',
    productId: 'tole_4m',
    price: 24.0,
    inStock: false,
    note: 'Sur commande',
  },
  { storeId: 'bricomarche-gf', productId: 'acier_ha12_6m', price: 10.2, inStock: true },

  // ── Point P Mamoudzou (YT) ──
  { storeId: 'pointp-yt', productId: 'parpaing_15', price: 1.68, inStock: true },
  { storeId: 'pointp-yt', productId: 'parpaing_20', price: 1.95, inStock: true },
  { storeId: 'pointp-yt', productId: 'ciment_25kg', price: 10.2, inStock: true },
  { storeId: 'pointp-yt', productId: 'sable_25kg', price: 7.5, inStock: true },
  { storeId: 'pointp-yt', productId: 'gravier_25kg', price: 7.9, inStock: true },
  { storeId: 'pointp-yt', productId: 'treillis_1224', price: 20.0, inStock: true },
  { storeId: 'pointp-yt', productId: 'peinture_10L', price: 36.0, inStock: true },
  { storeId: 'pointp-yt', productId: 'enduit_25kg', price: 14.9, inStock: true },
  { storeId: 'pointp-yt', productId: 'tole_3m', price: 17.5, inStock: true },
  { storeId: 'pointp-yt', productId: 'tole_4m', price: 22.5, inStock: true },
  { storeId: 'pointp-yt', productId: 'vis_autoperceuse_100', price: 10.9, inStock: true },
  { storeId: 'pointp-yt', productId: 'acier_ha12_6m', price: 9.5, inStock: true },

  // ── Batimat Mayotte (YT) ──
  { storeId: 'batimat-yt', productId: 'parpaing_15', price: 1.72, inStock: true },
  { storeId: 'batimat-yt', productId: 'ciment_25kg', price: 10.5, inStock: true },
  { storeId: 'batimat-yt', productId: 'sable_25kg', price: 7.7, inStock: true },
  { storeId: 'batimat-yt', productId: 'gravier_25kg', price: 8.1, inStock: true },
  { storeId: 'batimat-yt', productId: 'enduit_25kg', price: 15.2, inStock: true },
  { storeId: 'batimat-yt', productId: 'tole_3m', price: 18.0, inStock: true },
  { storeId: 'batimat-yt', productId: 'tole_4m', price: 23.0, inStock: true },
  { storeId: 'batimat-yt', productId: 'acier_ha12_6m', price: 9.8, inStock: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getStoresForTerritory(territory: TerritoryCode): BatimentStore[] {
  return BATISTORE_CATALOG.filter((s) => s.territory === territory);
}

export function getPriceForStore(storeId: string, productId: string): StorePrice | undefined {
  return STORE_PRICES.find((p) => p.storeId === storeId && p.productId === productId);
}

export interface MaterialNeed {
  productId: string;
  qty: number;
}

export interface StoreQuote {
  store: BatimentStore;
  lines: Array<{
    product: ProductCatalogItem;
    qty: number;
    unitPrice: number;
    total: number;
    inStock: boolean;
    promotion?: string;
    note?: string;
  }>;
  grandTotal: number;
  missingCount: number;
}

/**
 * Build store quotes for a given list of material needs in a territory.
 * Returns stores sorted by grandTotal (cheapest first).
 */
export function buildStoreQuotes(territory: TerritoryCode, needs: MaterialNeed[]): StoreQuote[] {
  const stores = getStoresForTerritory(territory);

  return stores
    .map((store): StoreQuote => {
      const lines = needs
        .map((need) => {
          const price = getPriceForStore(store.id, need.productId);
          const product = PRODUCT_CATALOG.find((p) => p.id === need.productId);
          if (!price || !product) return null;
          return {
            product,
            qty: need.qty,
            unitPrice: price.price,
            total: Math.round(price.price * need.qty * 100) / 100,
            inStock: price.inStock,
            promotion: price.promotion,
            note: price.note,
          };
        })
        .filter((l): l is NonNullable<typeof l> => l !== null);

      const neededIds = needs.map((n) => n.productId);
      const foundIds = lines.map((l) => l.product.id);
      const missingCount = neededIds.filter((id) => !foundIds.includes(id)).length;

      const grandTotal = Math.round(lines.reduce((sum, l) => sum + l.total, 0) * 100) / 100;

      return { store, lines, grandTotal, missingCount };
    })
    .filter((q) => q.lines.length > 0)
    .sort((a, b) => {
      // Sort by completeness first, then price
      if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
      return a.grandTotal - b.grandTotal;
    });
}
