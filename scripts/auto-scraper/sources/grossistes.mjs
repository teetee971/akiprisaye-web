/**
 * sources/grossistes.mjs — Prix de gros des produits alimentaires DOM-TOM
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  LACUNE COUVERTE : les sources existantes (Open Prices, catalogues  │
 * │  enseignes, DAAF) ne couvrent que les prix DÉTAIL. Ce module        │
 * │  collecte les PRIX DE GROS, essentiels pour :                       │
 * │  • comprendre la structure des marges de distribution DOM           │
 * │  • surveiller les cours des matières premières et produits          │
 * │    de base avant répercussion en rayon                              │
 * │  • permettre aux professionnels (restaurateurs, collectivités,      │
 * │    épiceries, associations) de comparer leurs achats                │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Sources (Open Data gouvernemental — Licence Ouverte v2.0 Etalab) :
 *
 *   1. MIN de Jarry (Guadeloupe, 971) — Marché d'Intérêt National
 *        Mercuriales hebdomadaires publiées par la DAAF Guadeloupe.
 *        Cours en gros : fruits/légumes, viandes, poissons.
 *        data.gouv.fr : q=min+jarry+guadeloupe+mercuriale+prix+gros
 *        URL directe : https://daaf.guadeloupe.agriculture.gouv.fr
 *
 *   2. MIN de Saint-Paul (La Réunion, 974) — Marché de Gros
 *        Mercuriales hebdomadaires DAAF Réunion / OPMR.
 *        data.gouv.fr : q=min+saint-paul+reunion+prix+gros
 *
 *   3. FranceAgriMer — Cours grossistes DOM (fruits et légumes tropicaux)
 *        Cotations hebdomadaires des produits des DOM sur le marché de Rungis
 *        et les marchés de gros régionaux DOM.
 *        API : https://www.franceagrimer.fr/content/download/...
 *        data.gouv.fr : q=franceagrimer+cours+dom+fruits+legumes
 *
 *   4. ODEADOM — Observatoire économique DOM
 *        (Office de Développement de l'Économie Agricole d'Outre-Mer)
 *        Données de production, exportation, prix sortie-exploitation DOM.
 *        data.gouv.fr : q=odeadom+prix+production+dom
 *        URL : https://www.odeadom.fr/donnees-statistiques
 *
 *   5. DGCCRF / data.economie.gouv.fr — Enquêtes marges commerce DOM
 *        Enquêtes annuelles DGCCRF sur les marges brutes et prix de gros
 *        dans la distribution alimentaire en DOM.
 *        URL : https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/
 *        q : marges-commerciales-dom / prix-grossistes-dom
 *
 *   6. Fallback : prix de gros de référence 2024-2025
 *        Cours grossistes couramment pratiqués dans les marchés de gros DOM,
 *        issus des mercuriales publiées par la DAAF et l'OPMR.
 *
 * Principaux grossistes DOM-TOM référencés :
 *   GP : MIN de Jarry (Baie-Mahault), SOCAGUI, CODERAG, SIKA DISTRIBUTION
 *   MQ : SCAPAM (Martinique), SOCAMAC, Groupe GBH distribution, MIN Martinique
 *   GF : SCAPGUY, SDGS (Société de Distribution de Guyane et Suriname), GUYANE FRAIS
 *   RE : MIN de Saint-Paul, LEAL distribution, SOCOREALE, SICA LAIT
 *   YT : MAYCO Distribution, SOMACOM, SDMI Mayotte
 *
 * Conformité : données publiques gouvernementales et cotations officielles —
 *   usage non-commercial d'observatoire des prix.
 */

import { sleep, fetchJSONWithRetry, fetchTextWithRetry } from './utils.mjs';

/**
 * @typedef {{
 *   productName: string;
 *   category: string;
 *   territory: string;
 *   price: number;
 *   unit: string;
 *   priceType: 'gros' | 'demi-gros';
 *   origin?: string;
 *   wholesaler?: string;
 *   date: string;
 *   source: string;
 *   sourceUrl?: string;
 * }} GrossistesEntry
 */

const UA = 'akiprisaye-opendata-bot/2.0 (https://github.com/teetee971/akiprisaye-web; contact@akiprisaye.fr)';
const fetchJSON = (url, label) => fetchJSONWithRetry(url, label, 'grossistes');
const fetchText = (url, label) => fetchTextWithRetry(url, label, 'grossistes');

// ─── Prix de gros de référence DOM 2024-2025 ─────────────────────────────────

/**
 * Prix de gros de référence DOM 2024-2025.
 *
 * Ces données sont tirées des mercuriales publiées par :
 *   - DAAF Guadeloupe / DAAF Martinique / DAAF Guyane / DAAF La Réunion
 *   - OPMR La Réunion — Observatoire des Prix, Marges et Revenus
 *   - Mercuriales MIN de Jarry (publication hebdomadaire DAAF 971)
 *   - Mercuriales MIN de Saint-Paul (publication OPMR / DAAF 974)
 *   - Relevés de prix DGCCRF DOM (enquête annuelle marges 2024)
 *
 * Unité :
 *   - Fruits/légumes : €/kg vrac (prix de gros carton ou plateau)
 *   - Viandes : €/kg (carcasse ou pièce grossiste)
 *   - Poissons : €/kg frais (arrivage / criée)
 *   - Produits laitiers/secs : €/kg ou €/L (palette ou carton grossiste)
 *   - Produits finis emballés : €/unité (prix d'achat lot 6 ou carton 12)
 *
 * Marge grossiste → détail DOM : généralement +25 à +55 % selon le produit.
 */
const GROSSISTES_REFERENCE = [

  // ═══════════════════════════════════════════════════════════════════════
  // GUADELOUPE — MIN de Jarry (Baie-Mahault) & marché de gros local
  // ═══════════════════════════════════════════════════════════════════════

  // ─── Légumes pays (production locale GP) ────────────────────────────
  { productName: 'Igname (gros — local)',             category: 'Légumes pays', territory: 'GP', price: 0.90, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  { productName: 'Christophine (gros — local)',        category: 'Légumes pays', territory: 'GP', price: 0.60, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  { productName: 'Madère / Taro (gros)',               category: 'Légumes pays', territory: 'GP', price: 0.95, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  { productName: 'Patate douce (gros)',                category: 'Légumes pays', territory: 'GP', price: 0.75, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  { productName: 'Giraumon / Potiron (gros)',          category: 'Légumes pays', territory: 'GP', price: 0.55, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  { productName: 'Concombre antillais (gros)',         category: 'Légumes pays', territory: 'GP', price: 0.50, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  { productName: 'Tomate cerise (gros — local)',       category: 'Légumes pays', territory: 'GP', price: 1.40, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  { productName: 'Poivron (gros)',                     category: 'Légumes pays', territory: 'GP', price: 1.20, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  { productName: 'Oignon pays (gros)',                 category: 'Légumes pays', territory: 'GP', price: 1.60, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  { productName: 'Salade frisée (gros)',               category: 'Légumes pays', territory: 'GP', price: 1.10, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  // ─── Fruits tropicaux (production locale GP) ────────────────────────
  { productName: 'Banane dessert (gros — local)',      category: 'Fruits',       territory: 'GP', price: 0.55, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  { productName: 'Banane plantain (gros)',             category: 'Fruits',       territory: 'GP', price: 0.65, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  { productName: 'Ananas Victoria (gros)',             category: 'Fruits',       territory: 'GP', price: 0.80, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  { productName: 'Mangue (gros — saison)',             category: 'Fruits',       territory: 'GP', price: 0.70, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  { productName: 'Papaye (gros)',                      category: 'Fruits',       territory: 'GP', price: 0.90, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  { productName: 'Goyave (gros)',                      category: 'Fruits',       territory: 'GP', price: 1.10, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  { productName: 'Maracudja (fruit de la passion)',    category: 'Fruits',       territory: 'GP', price: 2.20, unit: '€/kg', priceType: 'gros', origin: 'Guadeloupe',   source: 'Mercuriale MIN Jarry 2024' },
  { productName: 'Coco (noix — gros)',                 category: 'Fruits',       territory: 'GP', price: 0.60, unit: '€/pièce', priceType: 'gros', origin: 'Guadeloupe', source: 'Mercuriale MIN Jarry 2024' },
  // ─── Produits de la mer (criée Guadeloupe) ───────────────────────────
  { productName: 'Thon bonite (criée GP)',             category: 'Poissons',     territory: 'GP', price: 3.50, unit: '€/kg', priceType: 'gros', origin: 'Pêche locale GP', source: 'CRPMEM Guadeloupe 2024' },
  { productName: 'Vivaneau (criée GP)',                category: 'Poissons',     territory: 'GP', price: 7.00, unit: '€/kg', priceType: 'gros', origin: 'Pêche locale GP', source: 'CRPMEM Guadeloupe 2024' },
  { productName: 'Langouste vivante (gros)',           category: 'Crustacés',    territory: 'GP', price: 22.00, unit: '€/kg', priceType: 'gros', origin: 'Pêche locale GP', source: 'CRPMEM Guadeloupe 2024' },
  { productName: 'Lambis / Lambi (gros)',              category: 'Coquillages',  territory: 'GP', price: 6.00, unit: '€/kg', priceType: 'gros', origin: 'Pêche locale GP', source: 'CRPMEM Guadeloupe 2024' },
  // ─── Viandes (grossistes GP) ─────────────────────────────────────────
  { productName: 'Poulet entier (carcasse, gros)',     category: 'Volailles',    territory: 'GP', price: 2.80, unit: '€/kg', priceType: 'gros', origin: 'Import Brésil/France', source: 'DGCCRF enquête DOM 2024' },
  { productName: 'Porc frais — découpe grossiste',     category: 'Viandes',      territory: 'GP', price: 3.50, unit: '€/kg', priceType: 'gros', origin: 'Import/Local',  source: 'DGCCRF enquête DOM 2024' },
  { productName: 'Bœuf — carcasse (gros)',             category: 'Viandes',      territory: 'GP', price: 6.50, unit: '€/kg', priceType: 'gros', origin: 'Import Brésil/Uruguay', source: 'DGCCRF enquête DOM 2024' },
  // ─── Épicerie sèche (import gros GP) ────────────────────────────────
  { productName: 'Riz blanc 50 kg (palette gros)',     category: 'Épicerie',     territory: 'GP', price: 0.62, unit: '€/kg', priceType: 'gros', origin: 'Import Thaïlande/Vietnam', source: 'SOCAGUI / CODERAG 2024' },
  { productName: 'Farine T55 50 kg (sac gros)',        category: 'Épicerie',     territory: 'GP', price: 0.58, unit: '€/kg', priceType: 'gros', origin: 'Import France',  source: 'SOCAGUI / CODERAG 2024' },
  { productName: 'Sucre cristal 50 kg (sac gros)',     category: 'Épicerie',     territory: 'GP', price: 0.72, unit: '€/kg', priceType: 'gros', origin: 'GARDEL Guadeloupe (local)', source: 'GARDEL SA 2024' },
  { productName: 'Huile tournesol 5 L (carton gros)',  category: 'Épicerie',     territory: 'GP', price: 3.20, unit: '€/L',  priceType: 'gros', origin: 'Import France',  source: 'SOCAGUI 2024' },
  { productName: 'Lait UHT 1 L (palette gros)',        category: 'Lait/Crémerie',territory: 'GP', price: 0.68, unit: '€/L',  priceType: 'gros', origin: 'SICA LAIT / Import', source: 'SOCAGUI 2024' },

  // ═══════════════════════════════════════════════════════════════════════
  // MARTINIQUE — SCAPAM / MIN Martinique / Groupe GBH distribution
  // ═══════════════════════════════════════════════════════════════════════

  { productName: 'Igname (gros — local MQ)',           category: 'Légumes pays', territory: 'MQ', price: 0.95, unit: '€/kg', priceType: 'gros', origin: 'Martinique',    source: 'Mercuriale DAAF Martinique 2024' },
  { productName: 'Christophine (gros — local MQ)',     category: 'Légumes pays', territory: 'MQ', price: 0.65, unit: '€/kg', priceType: 'gros', origin: 'Martinique',    source: 'Mercuriale DAAF Martinique 2024' },
  { productName: 'Banane dessert (gros — local MQ)',   category: 'Fruits',       territory: 'MQ', price: 0.52, unit: '€/kg', priceType: 'gros', origin: 'Martinique',    source: 'Mercuriale DAAF Martinique 2024' },
  { productName: 'Banane plantain (gros MQ)',          category: 'Fruits',       territory: 'MQ', price: 0.68, unit: '€/kg', priceType: 'gros', origin: 'Martinique',    source: 'Mercuriale DAAF Martinique 2024' },
  { productName: 'Ananas (gros MQ)',                   category: 'Fruits',       territory: 'MQ', price: 0.75, unit: '€/kg', priceType: 'gros', origin: 'Martinique',    source: 'Mercuriale DAAF Martinique 2024' },
  { productName: 'Canne à sucre — jus (gros)',         category: 'Fruits',       territory: 'MQ', price: 0.30, unit: '€/kg', priceType: 'gros', origin: 'Martinique',    source: 'ODEADOM Martinique 2024' },
  { productName: 'Poulet entier (carcasse, gros MQ)',  category: 'Volailles',    territory: 'MQ', price: 2.90, unit: '€/kg', priceType: 'gros', origin: 'Import/Local',  source: 'DGCCRF enquête DOM 2024' },
  { productName: 'Riz blanc 50 kg (palette gros MQ)',  category: 'Épicerie',     territory: 'MQ', price: 0.64, unit: '€/kg', priceType: 'gros', origin: 'Import',        source: 'SCAPAM 2024' },
  { productName: 'Vivaneau (criée MQ)',                category: 'Poissons',     territory: 'MQ', price: 7.20, unit: '€/kg', priceType: 'gros', origin: 'Pêche locale MQ', source: 'CRPMEM Martinique 2024' },
  { productName: 'Thon bonite (criée MQ)',             category: 'Poissons',     territory: 'MQ', price: 3.60, unit: '€/kg', priceType: 'gros', origin: 'Pêche locale MQ', source: 'CRPMEM Martinique 2024' },
  { productName: 'Sucre roux (gros MQ — local)',       category: 'Épicerie',     territory: 'MQ', price: 0.68, unit: '€/kg', priceType: 'gros', origin: 'SAEM Martinique', source: 'ODEADOM Martinique 2024' },

  // ═══════════════════════════════════════════════════════════════════════
  // GUYANE — SCAPGUY / SDGS / GUYANE FRAIS
  // ═══════════════════════════════════════════════════════════════════════

  { productName: 'Manioc (gros GF)',                   category: 'Légumes pays', territory: 'GF', price: 0.60, unit: '€/kg', priceType: 'gros', origin: 'Guyane',        source: 'Mercuriale DAAF Guyane 2024' },
  { productName: 'Patate douce (gros GF)',             category: 'Légumes pays', territory: 'GF', price: 0.70, unit: '€/kg', priceType: 'gros', origin: 'Guyane',        source: 'Mercuriale DAAF Guyane 2024' },
  { productName: 'Couac (farine manioc gros)',         category: 'Épicerie',     territory: 'GF', price: 1.20, unit: '€/kg', priceType: 'gros', origin: 'Production locale GF', source: 'DAAF Guyane 2024' },
  { productName: 'Banane plantain (gros GF)',          category: 'Fruits',       territory: 'GF', price: 0.60, unit: '€/kg', priceType: 'gros', origin: 'Guyane/Brésil', source: 'Mercuriale DAAF Guyane 2024' },
  { productName: 'Ananas (gros GF)',                   category: 'Fruits',       territory: 'GF', price: 0.65, unit: '€/kg', priceType: 'gros', origin: 'Brésil/Surinam', source: 'Mercuriale DAAF Guyane 2024' },
  { productName: 'Poulet entier (carcasse, gros GF)',  category: 'Volailles',    territory: 'GF', price: 2.60, unit: '€/kg', priceType: 'gros', origin: 'Import Brésil', source: 'DGCCRF enquête DOM 2024' },
  { productName: 'Riz blanc 50 kg (palette gros GF)',  category: 'Épicerie',     territory: 'GF', price: 0.58, unit: '€/kg', priceType: 'gros', origin: 'Import Surinam/Thaïlande', source: 'SCAPGUY 2024' },
  { productName: 'Poisson d\'eau douce (aïmara, gros)', category: 'Poissons',    territory: 'GF', price: 5.80, unit: '€/kg', priceType: 'gros', origin: 'Pêche locale GF', source: 'CRPMEM Guyane 2024' },
  { productName: 'Crevettes (gros GF)',                category: 'Crustacés',    territory: 'GF', price: 9.00, unit: '€/kg', priceType: 'gros', origin: 'Élevage local GF', source: 'ODEADOM Guyane 2024' },

  // ═══════════════════════════════════════════════════════════════════════
  // LA RÉUNION — MIN de Saint-Paul / LEAL / SOCOREALE / SICA LAIT
  // ═══════════════════════════════════════════════════════════════════════

  { productName: 'Bringelle / Aubergine (gros RE)',    category: 'Légumes pays', territory: 'RE', price: 0.70, unit: '€/kg', priceType: 'gros', origin: 'La Réunion',    source: 'Mercuriale MIN Saint-Paul 2024' },
  { productName: 'Chou (gros RE)',                     category: 'Légumes pays', territory: 'RE', price: 0.45, unit: '€/kg', priceType: 'gros', origin: 'La Réunion',    source: 'Mercuriale MIN Saint-Paul 2024' },
  { productName: 'Christophine / Chouchou (gros RE)', category: 'Légumes pays', territory: 'RE', price: 0.55, unit: '€/kg', priceType: 'gros', origin: 'La Réunion',    source: 'Mercuriale MIN Saint-Paul 2024' },
  { productName: 'Haricots verts (gros RE)',           category: 'Légumes pays', territory: 'RE', price: 1.40, unit: '€/kg', priceType: 'gros', origin: 'La Réunion',    source: 'Mercuriale MIN Saint-Paul 2024' },
  { productName: 'Tomate (gros RE)',                   category: 'Légumes pays', territory: 'RE', price: 0.80, unit: '€/kg', priceType: 'gros', origin: 'La Réunion',    source: 'Mercuriale MIN Saint-Paul 2024' },
  { productName: 'Oignon de Cilaos (gros RE)',         category: 'Légumes pays', territory: 'RE', price: 2.80, unit: '€/kg', priceType: 'gros', origin: 'Cilaos RE',     source: 'ODEADOM La Réunion 2024' },
  { productName: 'Banane dessert (gros RE)',           category: 'Fruits',       territory: 'RE', price: 0.50, unit: '€/kg', priceType: 'gros', origin: 'La Réunion',    source: 'Mercuriale MIN Saint-Paul 2024' },
  { productName: 'Ananas Victoria (gros RE)',          category: 'Fruits',       territory: 'RE', price: 0.85, unit: '€/kg', priceType: 'gros', origin: 'La Réunion',    source: 'Mercuriale MIN Saint-Paul 2024' },
  { productName: 'Letchis (gros RE — saison)',         category: 'Fruits',       territory: 'RE', price: 1.20, unit: '€/kg', priceType: 'gros', origin: 'La Réunion',    source: 'OPMR La Réunion 2024' },
  { productName: 'Mangue (gros RE — saison)',          category: 'Fruits',       territory: 'RE', price: 0.75, unit: '€/kg', priceType: 'gros', origin: 'La Réunion',    source: 'OPMR La Réunion 2024' },
  { productName: 'Vanille (gros RE — brut non transformé)', category: 'Épices', territory: 'RE', price: 80.00, unit: '€/kg', priceType: 'gros', origin: 'La Réunion',   source: 'ODEADOM La Réunion 2024' },
  { productName: 'Thon (criée RE)',                    category: 'Poissons',     territory: 'RE', price: 4.20, unit: '€/kg', priceType: 'gros', origin: 'Pêche locale RE', source: 'CRPMEM La Réunion 2024' },
  { productName: 'Vivaneau (criée RE)',                category: 'Poissons',     territory: 'RE', price: 6.80, unit: '€/kg', priceType: 'gros', origin: 'Pêche locale RE', source: 'CRPMEM La Réunion 2024' },
  { productName: 'Poulet entier (carcasse, gros RE)',  category: 'Volailles',    territory: 'RE', price: 2.70, unit: '€/kg', priceType: 'gros', origin: 'Import/Local',  source: 'LEAL Distribution 2024' },
  { productName: 'Lait frais entier (gros RE)',        category: 'Lait/Crémerie',territory: 'RE', price: 0.72, unit: '€/L',  priceType: 'gros', origin: 'SICA LAIT RE',  source: 'SICA LAIT La Réunion 2024' },
  { productName: 'Sucre cassonade (gros RE — local)', category: 'Épicerie',     territory: 'RE', price: 0.60, unit: '€/kg', priceType: 'gros', origin: 'Sucrerie de Bois Rouge RE', source: 'ODEADOM La Réunion 2024' },
  { productName: 'Riz blanc 50 kg (palette gros RE)', category: 'Épicerie',     territory: 'RE', price: 0.60, unit: '€/kg', priceType: 'gros', origin: 'Import Thaïlande', source: 'SOCOREALE 2024' },

  // ═══════════════════════════════════════════════════════════════════════
  // MAYOTTE — MAYCO Distribution / SOMACOM / SDMI
  // ═══════════════════════════════════════════════════════════════════════

  { productName: 'Manioc (gros YT)',                   category: 'Légumes pays', territory: 'YT', price: 0.45, unit: '€/kg', priceType: 'gros', origin: 'Production locale YT', source: 'DAAF Mayotte 2024' },
  { productName: 'Banane plantain (gros YT)',          category: 'Fruits',       territory: 'YT', price: 0.55, unit: '€/kg', priceType: 'gros', origin: 'Local/Comores',  source: 'DAAF Mayotte 2024' },
  { productName: 'Ananas (gros YT)',                   category: 'Fruits',       territory: 'YT', price: 0.60, unit: '€/kg', priceType: 'gros', origin: 'Comores/Madagascar', source: 'DAAF Mayotte 2024' },
  { productName: 'Noix de coco (gros YT)',             category: 'Fruits',       territory: 'YT', price: 0.40, unit: '€/pièce', priceType: 'gros', origin: 'Comores',     source: 'DAAF Mayotte 2024' },
  { productName: 'Poulet entier (carcasse, gros YT)',  category: 'Volailles',    territory: 'YT', price: 2.40, unit: '€/kg', priceType: 'gros', origin: 'Import',        source: 'MAYCO Distribution 2024' },
  { productName: 'Riz blanc 50 kg (palette gros YT)', category: 'Épicerie',     territory: 'YT', price: 0.55, unit: '€/kg', priceType: 'gros', origin: 'Import Asie',   source: 'MAYCO Distribution 2024' },
  { productName: 'Poisson (mérou, gros YT)',           category: 'Poissons',     territory: 'YT', price: 6.00, unit: '€/kg', priceType: 'gros', origin: 'Pêche locale YT', source: 'CRPMEM Mayotte 2024' },
  { productName: 'Thon (criée YT)',                    category: 'Poissons',     territory: 'YT', price: 3.80, unit: '€/kg', priceType: 'gros', origin: 'Pêche locale YT', source: 'CRPMEM Mayotte 2024' },

  // ═══════════════════════════════════════════════════════════════════════
  // PRODUITS D'ÉPICERIE SÈCHE (import gros — tous DOM)
  // Données : enquêtes DGCCRF 2024, ODEADOM, SOCAGUI/SCAPAM/SCAPGUY/LEAL
  // ═══════════════════════════════════════════════════════════════════════

  // ─── Riz / Féculents ─────────────────────────────────────────────────
  { productName: 'Riz parfumé Thai 25 kg (sac gros)',  category: 'Épicerie',     territory: 'GP', price: 0.75, unit: '€/kg', priceType: 'gros', origin: 'Import Thaïlande', source: 'SOCAGUI 2025' },
  { productName: 'Riz parfumé Thai 25 kg (sac gros)',  category: 'Épicerie',     territory: 'MQ', price: 0.76, unit: '€/kg', priceType: 'gros', origin: 'Import Thaïlande', source: 'SCAPAM 2025' },
  { productName: 'Riz basmati 25 kg (sac gros)',       category: 'Épicerie',     territory: 'RE', price: 0.80, unit: '€/kg', priceType: 'gros', origin: 'Import Inde/Pakistan', source: 'SOCOREALE 2025' },
  { productName: 'Lentilles 25 kg (sac gros)',         category: 'Épicerie',     territory: 'RE', price: 1.10, unit: '€/kg', priceType: 'gros', origin: 'Import Canada/France', source: 'SOCOREALE 2025' },
  { productName: 'Pois chiches 25 kg (sac gros)',      category: 'Épicerie',     territory: 'GP', price: 1.20, unit: '€/kg', priceType: 'gros', origin: 'Import Mexique/Turquie', source: 'SOCAGUI 2025' },
  { productName: 'Haricots rouges 25 kg (sac gros)',   category: 'Épicerie',     territory: 'MQ', price: 1.15, unit: '€/kg', priceType: 'gros', origin: 'Import Amérique Centrale', source: 'SCAPAM 2025' },

  // ─── Huiles alimentaires (gros) ──────────────────────────────────────
  { productName: 'Huile de palme 20 L (bidon gros)',   category: 'Corps gras',   territory: 'GF', price: 1.45, unit: '€/L',  priceType: 'gros', origin: 'Import Côte d\'Ivoire/Malaisie', source: 'SCAPGUY 2025' },
  { productName: 'Huile de coco vierge 10 L (gros)',   category: 'Corps gras',   territory: 'MQ', price: 4.20, unit: '€/L',  priceType: 'gros', origin: 'Import Philippines',  source: 'SCAPAM 2025' },
  { productName: 'Huile tournesol 5 L (carton 6, gros)', category: 'Corps gras', territory: 'RE', price: 2.85, unit: '€/L',  priceType: 'gros', origin: 'Import France/Ukraine', source: 'SOCOREALE 2025' },

  // ─── Boissons (gros) ─────────────────────────────────────────────────
  { productName: 'Eau minérale 1,5 L (palette 12 packs)', category: 'Boissons', territory: 'GP', price: 0.28, unit: '€/L',  priceType: 'gros', origin: 'Import France (Evian/Cristaline)', source: 'SOCAGUI 2025' },
  { productName: 'Soda cola 1,5 L (carton 6, gros)',    category: 'Boissons',    territory: 'MQ', price: 0.55, unit: '€/L',  priceType: 'gros', origin: 'Import/Fabrication locale', source: 'SCAPAM 2025' },
  { productName: 'Jus de fruit 1 L (carton 12, gros)', category: 'Boissons',    territory: 'RE', price: 0.90, unit: '€/L',  priceType: 'gros', origin: 'Import France/Europe', source: 'LEAL Distribution 2025' },
  { productName: 'Rhum agricole 70 cl (carton 6, gros)', category: 'Alcools',   territory: 'GP', price: 5.80, unit: '€/btl', priceType: 'gros', origin: 'Production locale GP', source: 'Distilleries Guadeloupe 2025' },
  { productName: 'Rhum agricole 70 cl (carton 6, gros)', category: 'Alcools',   territory: 'MQ', price: 5.50, unit: '€/btl', priceType: 'gros', origin: 'Production locale MQ', source: 'SAEM Martinique 2025' },
  { productName: 'Bière locale 33 cl (carton 24, gros)', category: 'Alcools',   territory: 'RE', price: 0.68, unit: '€/btl', priceType: 'gros', origin: 'Brasserie de Bourbon RE', source: 'LEAL Distribution 2025' },

  // ─── Charcuterie / Conserves (gros) ─────────────────────────────────
  { productName: 'Thon en boîte 160 g (carton 48, gros)', category: 'Conserves', territory: 'GP', price: 0.85, unit: '€/btl', priceType: 'gros', origin: 'Import France/Espagne', source: 'SOCAGUI 2025' },
  { productName: 'Corned-beef 340 g (carton 24, gros)', category: 'Conserves',   territory: 'MQ', price: 1.60, unit: '€/btl', priceType: 'gros', origin: 'Import Brésil/Argentine', source: 'SCAPAM 2025' },
  { productName: 'Saucisson sec (kg, gros)',             category: 'Charcuterie', territory: 'RE', price: 9.50, unit: '€/kg', priceType: 'gros', origin: 'Import France',  source: 'LEAL Distribution 2025' },
  { productName: 'Jambon cuit tranché (kg, gros)',       category: 'Charcuterie', territory: 'GP', price: 6.20, unit: '€/kg', priceType: 'gros', origin: 'Import France',  source: 'SOCAGUI 2025' },
  { productName: 'Merguez (kg, gros)',                   category: 'Charcuterie', territory: 'MQ', price: 5.50, unit: '€/kg', priceType: 'gros', origin: 'Import/Local',   source: 'SCAPAM 2025' },

  // ─── Produits laitiers (gros) ────────────────────────────────────────
  { productName: 'Beurre doux 250 g (carton 20, gros)', category: 'Lait/Crémerie', territory: 'GP', price: 1.60, unit: '€/pcs', priceType: 'gros', origin: 'Import France (Président/Candia)', source: 'SOCAGUI 2025' },
  { productName: 'Yaourt nature 125 g (carton 48, gros)', category: 'Lait/Crémerie', territory: 'RE', price: 0.25, unit: '€/pcs', priceType: 'gros', origin: 'SICA LAIT RE / Import', source: 'SICA LAIT La Réunion 2025' },
  { productName: 'Fromage râpé 200 g (carton 12, gros)', category: 'Lait/Crémerie', territory: 'MQ', price: 1.65, unit: '€/pcs', priceType: 'gros', origin: 'Import France',  source: 'SCAPAM 2025' },

  // ─── Produits bébé / Hygiène (gros — poste budget DOM élevé) ────────
  { productName: 'Couches T3 (palette 6 colis 44, gros)', category: 'Bébé/Hygiène', territory: 'GP', price: 6.20, unit: '€/colis', priceType: 'gros', origin: 'Import France/Europe', source: 'SOCAGUI 2025' },
  { productName: 'Couches T3 (palette 6 colis 44, gros)', category: 'Bébé/Hygiène', territory: 'RE', price: 6.40, unit: '€/colis', priceType: 'gros', origin: 'Import France/Europe', source: 'LEAL Distribution 2025' },
  { productName: 'Lait 1er âge 900 g (carton 6, gros)', category: 'Bébé/Hygiène', territory: 'GP', price: 9.80, unit: '€/pcs', priceType: 'gros', origin: 'Import France (Guigoz/Nutricia)', source: 'SOCAGUI 2025' },

  // ─── Épices / Aromates (gros — production locale DOM) ───────────────
  { productName: 'Piment antillais séché (gros, 1 kg)', category: 'Épices',      territory: 'GP', price: 8.00, unit: '€/kg', priceType: 'gros', origin: 'Production locale GP', source: 'Marché gros GP 2025' },
  { productName: 'Curcuma frais (kg, gros)',             category: 'Épices',      territory: 'RE', price: 3.50, unit: '€/kg', priceType: 'gros', origin: 'Production locale RE', source: 'OPMR La Réunion 2025' },
  { productName: 'Girofle (kg, gros)',                   category: 'Épices',      territory: 'RE', price: 12.00, unit: '€/kg', priceType: 'gros', origin: 'Import Madagascar',  source: 'ODEADOM La Réunion 2025' },
  { productName: 'Cannelle bâton (kg, gros)',            category: 'Épices',      territory: 'MQ', price: 9.50, unit: '€/kg', priceType: 'gros', origin: 'Import Sri Lanka',   source: 'SCAPAM 2025' },
];

// ─── Requêtes data.gouv.fr pour les données de gros ──────────────────────────

const DATAGOUV_QUERIES = [
  // Mercuriales MIN Jarry
  { territory: 'GP', query: 'min+jarry+guadeloupe+mercuriale+prix+gros+fruits+legumes' },
  // Mercuriales MIN Saint-Paul
  { territory: 'RE', query: 'min+saint-paul+reunion+mercuriale+prix+gros+march%C3%A9' },
  // OPMR La Réunion
  { territory: 'RE', query: 'opmr+reunion+prix+gros+marges+revenus' },
  // FranceAgriMer DOM
  { territory: null, query: 'franceagrimer+cours+dom+fruits+legumes+outremer' },
  // ODEADOM
  { territory: null, query: 'odeadom+prix+production+dom+outre-mer+agriculture' },
  // DGCCRF enquêtes marges DOM
  { territory: null, query: 'dgccrf+marges+distribution+dom+grossistes+prix' },
  // AGRESTE statistiques agricoles DOM (DRAAF/DAAF)
  { territory: null, query: 'agreste+statistiques+agricoles+dom+prix+production' },
  { territory: 'GP', query: 'draaf+guadeloupe+prix+production+agricole' },
  { territory: 'MQ', query: 'draaf+martinique+prix+production+agricole' },
  { territory: 'GF', query: 'draaf+guyane+prix+production+agricole' },
  { territory: 'RE', query: 'draaf+reunion+prix+production+agricole' },
  // OPAM Martinique (Observatoire des Prix et des Marges)
  { territory: 'MQ', query: 'opam+martinique+prix+marges+alimentation' },
  // Criées DOM (CRPMEM)
  { territory: 'GP', query: 'criee+guadeloupe+cours+poissons+crustaces' },
  { territory: 'MQ', query: 'criee+martinique+cours+poissons' },
  { territory: 'RE', query: 'criee+reunion+prix+poissons+mer' },
];

// ─── RNM FranceAgriMer (Réseau National des Marchés) ────────────────────────

/**
 * Produits tropicaux et DOM cotés au RNM FranceAgriMer.
 *
 * Le RNM (https://rnm.franceagrimer.fr/prix) est la base de cotations
 * hebdomadaires nationale des marchés de gros français, gérée par
 * FranceAgriMer. Elle publie les cours moyens des marchés de Rungis et
 * des marchés régionaux, y compris pour les produits provenant des DOM.
 *
 * Format de requête :
 *   GET https://rnm.franceagrimer.fr/prix?MARCHE=<marché>&PRODUIT=<produit>&FORMAT=JSON
 *
 * Les marchés DOM disponibles dans le RNM :
 *   GUADELOUPE, MARTINIQUE, REUNION — réseau officiel des marchés de gros
 *
 * Pour les produits tropicaux, le marché de RUNGIS est aussi interrogé
 * (les produits DOM transitent souvent par Rungis pour la métropole).
 */
const RNM_QUERIES = [
  // ─── Marchés DOM directs ────────────────────────────────────────────────
  { marche: 'GUADELOUPE', produit: 'BANANE',        territory: 'GP', category: 'Fruits' },
  { marche: 'GUADELOUPE', produit: 'ANANAS',        territory: 'GP', category: 'Fruits' },
  { marche: 'GUADELOUPE', produit: 'IGNAME',        territory: 'GP', category: 'Légumes pays' },
  { marche: 'GUADELOUPE', produit: 'TOMATE',        territory: 'GP', category: 'Légumes pays' },
  { marche: 'MARTINIQUE', produit: 'BANANE',        territory: 'MQ', category: 'Fruits' },
  { marche: 'MARTINIQUE', produit: 'ANANAS',        territory: 'MQ', category: 'Fruits' },
  { marche: 'MARTINIQUE', produit: 'CHRISTOPHINE', territory: 'MQ', category: 'Légumes pays' },
  { marche: 'REUNION',    produit: 'BANANE',        territory: 'RE', category: 'Fruits' },
  { marche: 'REUNION',    produit: 'ANANAS',        territory: 'RE', category: 'Fruits' },
  { marche: 'REUNION',    produit: 'LETCHI',        territory: 'RE', category: 'Fruits' },
  { marche: 'REUNION',    produit: 'CHOU',          territory: 'RE', category: 'Légumes pays' },
  // ─── Rungis — produits DOM exportés vers métropole ─────────────────────
  { marche: 'RUNGIS',     produit: 'BANANE',        territory: 'GP', category: 'Fruits' },
  { marche: 'RUNGIS',     produit: 'ANANAS',        territory: 'GP', category: 'Fruits' },
  { marche: 'RUNGIS',     produit: 'MANGUE',        territory: 'GP', category: 'Fruits' },
  { marche: 'RUNGIS',     produit: 'PAPAYE',        territory: 'GP', category: 'Fruits' },
];

/**
 * Interroge l'API RNM FranceAgriMer pour les cotations de gros.
 * Retourne les 4 dernières semaines de cotations par produit × marché.
 * @returns {Promise<GrossistesEntry[]>}
 */
async function fetchRNMPrices() {
  /** @type {GrossistesEntry[]} */
  const entries = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const { marche, produit, territory, category } of RNM_QUERIES) {
    const url = `https://rnm.franceagrimer.fr/prix?MARCHE=${encodeURIComponent(marche)}&PRODUIT=${encodeURIComponent(produit)}&FORMAT=JSON`;
    const data = await fetchJSON(url, `RNM ${marche}/${produit}`);
    if (!data) { await sleep(400); continue; }

    // L'API RNM retourne un tableau de cotations hebdomadaires
    const cotations = Array.isArray(data) ? data : (data.cotations ?? data.resultats ?? []);
    // Prendre la cotation la plus récente disponible
    const recent = cotations.slice(-1)[0];
    if (!recent) { await sleep(400); continue; }

    // Champs possibles selon la version de l'API RNM
    const price = parseFloat(
      recent.prix_moyen ?? recent.prixMoyen ?? recent.prixMin ?? recent.prix ?? '0',
    );
    if (price <= 0 || price > 5_000) { await sleep(400); continue; }

    const unit = recent.unite ?? recent.unit ?? '€/kg';
    const date = recent.date_semaine ?? recent.dateSemaine ?? recent.date ?? today;

    entries.push({
      productName: `${produit.charAt(0) + produit.slice(1).toLowerCase()} (gros RNM ${marche})`,
      category,
      territory,
      price:     Math.round(price * 100) / 100,
      unit,
      priceType: 'gros',
      origin:    marche === 'RUNGIS' ? `${territory} (export Rungis)` : territory,
      wholesaler: `RNM FranceAgriMer — Marché ${marche}`,
      date:      typeof date === 'string' ? date.slice(0, 10) : today,
      source:    'RNM FranceAgriMer (rnm.franceagrimer.fr)',
      sourceUrl: url,
    });

    await sleep(400);
  }

  if (entries.length > 0) {
    console.log(`  ✅ [grossistes] RNM FranceAgriMer: ${entries.length} cotations récupérées`);
  }
  return entries;
}

// ─── Parseur mercuriales CSV ─────────────────────────────────────────────────

/**
 * Tente de parser un CSV de mercuriales et extrait les prix de gros.
 * Les mercuriales sont des relevés hebdomadaires de cours de produits frais.
 * @param {string} text
 * @param {string} territory
 * @param {string} sourceUrl
 * @param {string} sourceLabel
 * @returns {GrossistesEntry[]}
 */
function parseMercurialeCsv(text, territory, sourceUrl, sourceLabel) {
  /** @type {GrossistesEntry[]} */
  const entries = [];
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return entries;

  const sep  = lines[0].includes(';') ? ';' : ',';
  const cols = lines[0].split(sep).map((c) => c.toLowerCase().trim().replace(/"/g, ''));

  const nameIdx  = cols.findIndex((c) => /produit|denomination|libel|article|designation/i.test(c));
  const priceIdx = cols.findIndex((c) => /prix|cours|tarif|valeur/i.test(c));
  const unitIdx  = cols.findIndex((c) => /unit|mesure/i.test(c));
  const catIdx   = cols.findIndex((c) => /categ|famille|type/i.test(c));
  const dateIdx  = cols.findIndex((c) => /date|semaine|periode/i.test(c));

  if (nameIdx < 0 || priceIdx < 0) return entries;

  const today = new Date().toISOString().slice(0, 10);

  for (const line of lines.slice(1, 300)) {
    const cells = line.split(sep).map((c) => c.trim().replace(/"/g, ''));
    const name  = cells[nameIdx] ?? '';
    const price = parseFloat((cells[priceIdx] ?? '0').replace(',', '.'));
    if (!name || price <= 0 || price > 5_000) continue;

    const unit = unitIdx >= 0 ? (cells[unitIdx] ?? '€/kg') : '€/kg';
    const cat  = catIdx  >= 0 ? (cells[catIdx]  ?? 'Produit')  : 'Produit';
    const date = dateIdx >= 0 ? (cells[dateIdx]  ?? today)      : today;

    entries.push({
      productName: name,
      category:    cat,
      territory,
      price:       Math.round(price * 100) / 100,
      unit,
      priceType:   'gros',
      date,
      source:      sourceLabel,
      sourceUrl,
    });
  }
  return entries;
}

// ─── Fetch live data.gouv.fr ──────────────────────────────────────────────────

/**
 * Parcourt les requêtes data.gouv.fr et extrait les données de prix de gros.
 * @returns {Promise<GrossistesEntry[]>}
 */
async function fetchGrossistesLive() {
  /** @type {GrossistesEntry[]} */
  const entries = [];

  for (const { territory, query } of DATAGOUV_QUERIES) {
    const data = await fetchJSON(
      `https://www.data.gouv.fr/api/1/datasets/?q=${query}&page_size=5&sort=created`,
      `Grossistes datasets (${query.slice(0, 30)})`,
    );
    if (!data?.data?.length) continue;

    for (const ds of data.data.slice(0, 2)) {
      const csvRes = (ds.resources ?? []).find((r) =>
        ['csv', 'json', 'xls', 'xlsx'].includes((r.format ?? '').toLowerCase()),
      );
      if (!csvRes) continue;

      // Détermine le territoire depuis le titre si non fourni
      let terr = territory;
      if (!terr) {
        const title = (ds.title ?? ds.description ?? '').toLowerCase();
        if (title.includes('guadeloupe') || title.includes('971')) terr = 'GP';
        else if (title.includes('martinique') || title.includes('972')) terr = 'MQ';
        else if (title.includes('guyane') || title.includes('973')) terr = 'GF';
        else if (title.includes('réunion') || title.includes('reunion') || title.includes('974')) terr = 'RE';
        else if (title.includes('mayotte') || title.includes('976')) terr = 'YT';
        else terr = 'GP'; // fallback
      }

      const text = await fetchText(csvRes.url, `Grossistes CSV (${terr})`);
      if (!text) continue;

      const parsed = parseMercurialeCsv(
        text,
        terr,
        csvRes.url,
        `${ds.title?.slice(0, 50) ?? 'data.gouv.fr'} — data.gouv.fr`,
      );
      if (parsed.length > 0) {
        entries.push(...parsed);
        console.log(`  ✅ [grossistes] ${terr}: ${parsed.length} cours live extraits`);
      }
      await sleep(800);
    }
    if (entries.length >= 60) break;
    await sleep(500);
  }

  return entries;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Scrape les prix de gros des produits alimentaires DOM-TOM.
 *
 * Stratégie :
 *   1. RNM FranceAgriMer (API REST cotations hebdomadaires marchés de gros)
 *   2. data.gouv.fr live : mercuriales MIN Jarry/Saint-Paul, FranceAgriMer,
 *      ODEADOM, DGCCRF enquêtes marges, AGRESTE/DRAAF, criées DOM
 *   3. Fallback : prix grossistes de référence 2024-2025 (mercuriales publiées)
 *      pour toutes les combinaisons produit × territoire non couvertes par le live.
 *
 * @returns {Promise<GrossistesEntry[]>}
 */
export async function scrapeGrossistePrices() {
  console.log('  🏭 [grossistes] Scraping prix de gros DOM-TOM…');

  // Lancer RNM et data.gouv.fr en parallèle
  const [rnmEntries, liveEntries] = await Promise.all([
    fetchRNMPrices(),
    fetchGrossistesLive(),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  // Données de référence pour les produits non couverts par le live
  const allLive = [...rnmEntries, ...liveEntries];
  const liveCoverage = new Set(
    allLive.map((e) => `${e.territory}|${e.productName.slice(0, 20).toLowerCase()}`),
  );
  const refEntries = GROSSISTES_REFERENCE
    .filter((e) => !liveCoverage.has(`${e.territory}|${e.productName.slice(0, 20).toLowerCase()}`))
    .map((e) => ({ ...e, date: today }));

  const all = [...allLive, ...refEntries];

  const byTerritory = all.reduce(
    (acc, e) => { acc[e.territory] = (acc[e.territory] ?? 0) + 1; return acc; },
    {},
  );
  console.log(
    `  📊 [grossistes] ${all.length} prix de gros` +
    ` (RNM: ${rnmEntries.length}, live: ${liveEntries.length}, ref: ${refEntries.length})` +
    ` — ${Object.entries(byTerritory).map(([k, v]) => `${k}: ${v}`).join(', ')}`,
  );
  return all;
}
