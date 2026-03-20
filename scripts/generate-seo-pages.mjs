/**
 * generate-seo-pages.mjs — SEO page URL generator
 *
 * Generates 1000+ long-tail SEO pages across 5 intent types:
 *   1. Local product price pages  (/prix/<product>-<territory>)
 *   2. Retailer comparison pages  (/comparer/<r1>-vs-<r2>-<territory>)
 *   3. Inflation trend pages      (/inflation/<category>-<territory>-<year>)
 *   4. Cheapest products pages    (/moins-cher/<territory>)
 *   5. Guide pages               (/guide-prix/<product>-<territory>)
 *
 * Scale: ~200 products × 5 territories × 2 intents = 2000+ product pages
 *
 * Usage:
 *   node scripts/generate-seo-pages.mjs
 *   node scripts/generate-seo-pages.mjs --json      # output JSON manifest
 *   node scripts/generate-seo-pages.mjs --sitemap   # output sitemap entries
 *
 * Output: seo-pages-manifest.json (list of all generated URLs + metadata)
 */

import fs from 'fs';

// ── Site constants ─────────────────────────────────────────────────────────────

const SITE_URL = 'https://teetee971.github.io/akiprisaye-web';

// ── Territories (DROM focus for SEO priority) ─────────────────────────────────

const TERRITORIES = [
  { code: 'GP', name: 'guadeloupe',  label: 'Guadeloupe' },
  { code: 'MQ', name: 'martinique',  label: 'Martinique' },
  { code: 'GF', name: 'guyane',      label: 'Guyane' },
  { code: 'RE', name: 'reunion',     label: 'La Réunion' },
  { code: 'YT', name: 'mayotte',     label: 'Mayotte' },
];

// ── Product catalog — 200 products for long-tail coverage ────────────────────
// Each product × territory generates 2 pages (/prix/ and /guide-prix/)
// 200 × 5 × 2 = 2000 product-focused pages

const PRODUCTS = [
  // ── Boissons (25) ──────────────────────────────────────────────────────────
  { slug: 'coca-cola-1-5l',           name: 'Coca-Cola 1,5L',             category: 'boissons' },
  { slug: 'coca-cola-33cl-pack6',     name: 'Coca-Cola 33cl pack×6',      category: 'boissons' },
  { slug: 'eau-evian-1-5l',           name: 'Eau Évian 1,5L',             category: 'boissons' },
  { slug: 'eau-crystal-1-5l',         name: 'Eau Crystal 1,5L',           category: 'boissons' },
  { slug: 'eau-mont-roucous-1-5l',    name: 'Eau Mont Roucous 1,5L',      category: 'boissons' },
  { slug: 'jus-orange-tropicana-1l',  name: 'Jus Orange Tropicana 1L',    category: 'boissons' },
  { slug: 'jus-ananas-1l',            name: 'Jus Ananas 1L',              category: 'boissons' },
  { slug: 'jus-goyave-1l',            name: 'Jus Goyave 1L',              category: 'boissons' },
  { slug: 'jus-maracuja-1l',          name: 'Jus Maracuja 1L',            category: 'boissons' },
  { slug: 'biere-lorraine-50cl',      name: 'Bière Lorraine 50cl',        category: 'boissons' },
  { slug: 'biere-desperados-33cl',    name: 'Bière Desperados 33cl',      category: 'boissons' },
  { slug: 'biere-heineken-33cl',      name: 'Bière Heineken 33cl',        category: 'boissons' },
  { slug: 'rhum-clement-70cl',        name: 'Rhum Clément 70cl',          category: 'boissons' },
  { slug: 'rhum-agricole-blanc-70cl', name: 'Rhum Agricole Blanc 70cl',   category: 'boissons' },
  { slug: 'punch-coco-70cl',          name: 'Punch Coco 70cl',            category: 'boissons' },
  { slug: 'sirop-grenadine-750ml',    name: 'Sirop Grenadine 750ml',      category: 'boissons' },
  { slug: 'limonade-lorina-75cl',     name: 'Limonade Lorina 75cl',       category: 'boissons' },
  { slug: 'eau-gazeuse-perrier-75cl', name: 'Eau Gazeuse Perrier 75cl',   category: 'boissons' },
  { slug: 'the-glace-lipton-150cl',   name: 'Thé Glacé Lipton 1,5L',      category: 'boissons' },
  { slug: 'redbull-25cl',             name: 'Red Bull 25cl',              category: 'boissons' },
  { slug: 'orangina-1-5l',            name: 'Orangina 1,5L',              category: 'boissons' },
  { slug: 'fanta-1-5l',               name: 'Fanta 1,5L',                 category: 'boissons' },
  { slug: 'sprite-1-5l',              name: 'Sprite 1,5L',                category: 'boissons' },
  { slug: 'schweppes-1-5l',           name: 'Schweppes 1,5L',             category: 'boissons' },
  { slug: 'nesquik-chocolat-900g',    name: 'Nesquik Chocolat 900g',      category: 'boissons' },

  // ── Épicerie (40) ──────────────────────────────────────────────────────────
  { slug: 'riz-basmati-1kg',          name: 'Riz Basmati 1kg',            category: 'epicerie' },
  { slug: 'riz-long-grain-1kg',       name: 'Riz Long Grain 1kg',         category: 'epicerie' },
  { slug: 'riz-arborio-500g',         name: 'Riz Arborio 500g',           category: 'epicerie' },
  { slug: 'pates-panzani-500g',       name: 'Pâtes Panzani 500g',         category: 'epicerie' },
  { slug: 'pates-barilla-500g',       name: 'Pâtes Barilla 500g',         category: 'epicerie' },
  { slug: 'pates-coquillettes-500g',  name: 'Coquillettes 500g',          category: 'epicerie' },
  { slug: 'huile-tournesol-1l',       name: 'Huile Tournesol 1L',         category: 'epicerie' },
  { slug: 'huile-olive-75cl',         name: 'Huile Olive 75cl',           category: 'epicerie' },
  { slug: 'huile-coco-500ml',         name: 'Huile Coco 500ml',           category: 'epicerie' },
  { slug: 'nutella-400g',             name: 'Nutella 400g',               category: 'epicerie' },
  { slug: 'nutella-750g',             name: 'Nutella 750g',               category: 'epicerie' },
  { slug: 'sucre-blanc-1kg',          name: 'Sucre blanc 1kg',            category: 'epicerie' },
  { slug: 'sucre-roux-1kg',           name: 'Sucre roux 1kg',             category: 'epicerie' },
  { slug: 'cassonade-500g',           name: 'Cassonade 500g',             category: 'epicerie' },
  { slug: 'farine-ble-1kg',           name: 'Farine de blé 1kg',          category: 'epicerie' },
  { slug: 'farine-mais-500g',         name: 'Farine de maïs 500g',        category: 'epicerie' },
  { slug: 'sauce-tomate-400g',        name: 'Sauce Tomate 400g',          category: 'epicerie' },
  { slug: 'sauce-tomate-680g',        name: 'Sauce Tomate 680g',          category: 'epicerie' },
  { slug: 'concentre-tomate-140g',    name: 'Concentré Tomate 140g',      category: 'epicerie' },
  { slug: 'conserve-thon-160g',       name: 'Thon en boîte 160g',         category: 'epicerie' },
  { slug: 'conserve-thon-280g',       name: 'Thon en boîte 280g',         category: 'epicerie' },
  { slug: 'conserve-sardines-135g',   name: 'Sardines en boîte 135g',     category: 'epicerie' },
  { slug: 'conserve-haricots-820g',   name: 'Haricots rouges 820g',       category: 'epicerie' },
  { slug: 'lentilles-500g',           name: 'Lentilles vertes 500g',      category: 'epicerie' },
  { slug: 'pois-chiches-400g',        name: 'Pois chiches 400g',          category: 'epicerie' },
  { slug: 'chocolat-noir-100g',       name: 'Chocolat Noir 100g',         category: 'epicerie' },
  { slug: 'cafe-senseo-36d',          name: 'Café Senseo 36 dosettes',    category: 'epicerie' },
  { slug: 'cafe-nescafe-100g',        name: 'Café Nescafé 100g',          category: 'epicerie' },
  { slug: 'sel-fin-1kg',              name: 'Sel fin 1kg',                category: 'epicerie' },
  { slug: 'poivre-moulu-100g',        name: 'Poivre moulu 100g',          category: 'epicerie' },
  { slug: 'curry-poudre-100g',        name: 'Curry en poudre 100g',       category: 'epicerie' },
  { slug: 'curcuma-100g',             name: 'Curcuma 100g',               category: 'epicerie' },
  { slug: 'moutarde-amora-440g',      name: 'Moutarde Amora 440g',        category: 'epicerie' },
  { slug: 'mayonnaise-benedicta-235g', name: 'Mayonnaise Bénédicta 235g', category: 'epicerie' },
  { slug: 'ketchup-heinz-342g',       name: 'Ketchup Heinz 342g',         category: 'epicerie' },
  { slug: 'confiture-fraise-370g',    name: 'Confiture Fraise 370g',      category: 'epicerie' },
  { slug: 'miel-400g',                name: 'Miel 400g',                  category: 'epicerie' },
  { slug: 'biscuits-lu-168g',         name: 'Biscuits Lu Petit Écolier',  category: 'epicerie' },
  { slug: 'chips-lays-150g',          name: 'Chips Lays 150g',            category: 'epicerie' },
  { slug: 'pop-corn-micro-ondes-3x',  name: 'Pop-corn micro-ondes ×3',    category: 'epicerie' },

  // ── Produits laitiers (20) ─────────────────────────────────────────────────
  { slug: 'lait-entier-1l',           name: 'Lait entier 1L',             category: 'produits-laitiers' },
  { slug: 'lait-demi-ecreme-1l',      name: 'Lait demi-écrémé 1L',        category: 'produits-laitiers' },
  { slug: 'lait-uht-pack6',           name: 'Lait UHT pack×6',            category: 'produits-laitiers' },
  { slug: 'yaourt-nature-danone-8',   name: 'Yaourt Nature Danone ×8',    category: 'produits-laitiers' },
  { slug: 'yaourt-aromatise-8',       name: 'Yaourt Aromatisé ×8',        category: 'produits-laitiers' },
  { slug: 'yaourt-brassé-4',          name: 'Yaourt Brassé ×4',           category: 'produits-laitiers' },
  { slug: 'beurre-president-250g',    name: 'Beurre Président 250g',      category: 'produits-laitiers' },
  { slug: 'beurre-doux-500g',         name: 'Beurre doux 500g',           category: 'produits-laitiers' },
  { slug: 'fromage-emmental-200g',    name: 'Emmental râpé 200g',         category: 'produits-laitiers' },
  { slug: 'fromage-camembert-250g',   name: 'Camembert 250g',             category: 'produits-laitiers' },
  { slug: 'fromage-cheddar-200g',     name: 'Cheddar 200g',               category: 'produits-laitiers' },
  { slug: 'fromage-fondu-16p',        name: 'Fromage fondu ×16',          category: 'produits-laitiers' },
  { slug: 'creme-fraiche-20cl',       name: 'Crème fraîche 20cl',         category: 'produits-laitiers' },
  { slug: 'creme-liquide-25cl',       name: 'Crème liquide 25cl',         category: 'produits-laitiers' },
  { slug: 'creme-dessert-chocolat-4', name: 'Crème dessert chocolat ×4',  category: 'produits-laitiers' },
  { slug: 'flan-caramel-4',           name: 'Flan caramel ×4',            category: 'produits-laitiers' },
  { slug: 'petit-suisse-12',          name: 'Petit suisse ×12',           category: 'produits-laitiers' },
  { slug: 'fromage-blanc-500g',       name: 'Fromage blanc 500g',         category: 'produits-laitiers' },
  { slug: 'quark-nature-500g',        name: 'Quark nature 500g',          category: 'produits-laitiers' },
  { slug: 'mozzarella-125g',          name: 'Mozzarella 125g',            category: 'produits-laitiers' },

  // ── Viande (20) ────────────────────────────────────────────────────────────
  { slug: 'poulet-entier-kg',         name: 'Poulet entier /kg',          category: 'viande' },
  { slug: 'cuisses-poulet-kg',        name: 'Cuisses de poulet /kg',      category: 'viande' },
  { slug: 'blanc-poulet-kg',          name: 'Blanc de poulet /kg',        category: 'viande' },
  { slug: 'steak-hache-400g',         name: 'Steak haché 400g',           category: 'viande' },
  { slug: 'boeuf-bourguignon-kg',     name: 'Bœuf bourguignon /kg',       category: 'viande' },
  { slug: 'cote-porc-kg',             name: 'Côte de porc /kg',           category: 'viande' },
  { slug: 'roti-porc-kg',             name: 'Rôti de porc /kg',           category: 'viande' },
  { slug: 'jambon-blanc-4tr',         name: 'Jambon blanc 4 tranches',    category: 'viande' },
  { slug: 'lardons-fumés-200g',       name: 'Lardons fumés 200g',         category: 'viande' },
  { slug: 'saucisses-viennoises-350g', name: 'Saucisses viennoises 350g', category: 'viande' },
  { slug: 'merguez-500g',             name: 'Merguez 500g',               category: 'viande' },
  { slug: 'chorizo-200g',             name: 'Chorizo 200g',               category: 'viande' },
  { slug: 'agneau-gigot-kg',          name: 'Gigot d\'agneau /kg',        category: 'viande' },
  { slug: 'escalope-veau-kg',         name: 'Escalope de veau /kg',       category: 'viande' },
  { slug: 'foie-poulet-500g',         name: 'Foie de poulet 500g',        category: 'viande' },
  { slug: 'rillettes-200g',           name: 'Rillettes 200g',             category: 'viande' },
  { slug: 'pate-campagne-200g',       name: 'Pâté de campagne 200g',      category: 'viande' },
  { slug: 'andouillette-300g',        name: 'Andouillette 300g',          category: 'viande' },
  { slug: 'boudin-antillais-300g',    name: 'Boudin antillais 300g',      category: 'viande' },
  { slug: 'acras-morue-350g',         name: 'Accras de morue 350g',       category: 'viande' },

  // ── Poisson (15) ───────────────────────────────────────────────────────────
  { slug: 'saumon-fume-130g',         name: 'Saumon fumé 130g',           category: 'poisson' },
  { slug: 'filets-cabillaud-kg',      name: 'Filets de cabillaud /kg',    category: 'poisson' },
  { slug: 'daurade-entiere-kg',       name: 'Daurade entière /kg',        category: 'poisson' },
  { slug: 'vivaneau-kg',              name: 'Vivaneau /kg',               category: 'poisson' },
  { slug: 'thon-rouge-kg',            name: 'Thon rouge frais /kg',       category: 'poisson' },
  { slug: 'crevettes-royales-500g',   name: 'Crevettes royales 500g',     category: 'poisson' },
  { slug: 'crevettes-vannamei-500g',  name: 'Crevettes vannamei 500g',    category: 'poisson' },
  { slug: 'moules-kg',                name: 'Moules /kg',                 category: 'poisson' },
  { slug: 'chatrou-kg',               name: 'Chatrou /kg',                category: 'poisson' },
  { slug: 'lambis-kg',                name: 'Lambis /kg',                 category: 'poisson' },
  { slug: 'dorade-coryphene-kg',      name: 'Dorade coryphène /kg',       category: 'poisson' },
  { slug: 'blaff-poisson-portion',    name: 'Blaff de poisson (portion)', category: 'poisson' },
  { slug: 'langouste-kg',             name: 'Langouste /kg',              category: 'poisson' },
  { slug: 'crabe-kg',                 name: 'Crabe /kg',                  category: 'poisson' },
  { slug: 'maquereau-300g',           name: 'Maquereau 300g',             category: 'poisson' },

  // ── Fruits & Légumes (20) ──────────────────────────────────────────────────
  { slug: 'banane-kg',                name: 'Banane /kg',                 category: 'fruits-legumes' },
  { slug: 'banane-plantain-kg',       name: 'Banane plantain /kg',        category: 'fruits-legumes' },
  { slug: 'ananas-piece',             name: 'Ananas (pièce)',             category: 'fruits-legumes' },
  { slug: 'mangue-kg',                name: 'Mangue /kg',                 category: 'fruits-legumes' },
  { slug: 'papaye-kg',                name: 'Papaye /kg',                 category: 'fruits-legumes' },
  { slug: 'fruit-passion-kg',         name: 'Fruit de la passion /kg',    category: 'fruits-legumes' },
  { slug: 'pomme-golden-kg',          name: 'Pomme Golden /kg',           category: 'fruits-legumes' },
  { slug: 'tomate-kg',                name: 'Tomate /kg',                 category: 'fruits-legumes' },
  { slug: 'poivron-kg',               name: 'Poivron /kg',               category: 'fruits-legumes' },
  { slug: 'aubergine-kg',             name: 'Aubergine /kg',              category: 'fruits-legumes' },
  { slug: 'courgette-kg',             name: 'Courgette /kg',              category: 'fruits-legumes' },
  { slug: 'pomme-de-terre-kg',        name: 'Pomme de terre /kg',         category: 'fruits-legumes' },
  { slug: 'igname-kg',                name: 'Igname /kg',                 category: 'fruits-legumes' },
  { slug: 'madere-kg',                name: 'Madère /kg',                 category: 'fruits-legumes' },
  { slug: 'christophine-kg',          name: 'Christophine /kg',           category: 'fruits-legumes' },
  { slug: 'carotte-kg',               name: 'Carotte /kg',                category: 'fruits-legumes' },
  { slug: 'salade-laitue',            name: 'Salade Laitue (pièce)',      category: 'fruits-legumes' },
  { slug: 'oignon-kg',                name: 'Oignon /kg',                 category: 'fruits-legumes' },
  { slug: 'ail-tete',                 name: 'Ail (tête)',                 category: 'fruits-legumes' },
  { slug: 'citron-vert-kg',           name: 'Citron vert /kg',            category: 'fruits-legumes' },

  // ── Hygiène & Beauté (20) ─────────────────────────────────────────────────
  { slug: 'shampoing-head-shoulders-300ml', name: 'Shampooing Head & Shoulders 300ml', category: 'hygiene' },
  { slug: 'shampoing-elvive-200ml',   name: 'Shampooing Elvive 200ml',    category: 'hygiene' },
  { slug: 'apres-shampoing-200ml',    name: 'Après-shampooing 200ml',     category: 'hygiene' },
  { slug: 'dentifrice-colgate-75ml',  name: 'Dentifrice Colgate 75ml',    category: 'hygiene' },
  { slug: 'dentifrice-signal-75ml',   name: 'Dentifrice Signal 75ml',     category: 'hygiene' },
  { slug: 'brosse-dents-oral-b',      name: 'Brosse à dents Oral-B',      category: 'hygiene' },
  { slug: 'deodorant-axe-150ml',      name: 'Déodorant Axe 150ml',        category: 'hygiene' },
  { slug: 'deodorant-dove-200ml',     name: 'Déodorant Dove 200ml',       category: 'hygiene' },
  { slug: 'savon-main-500ml',         name: 'Savon liquide main 500ml',   category: 'hygiene' },
  { slug: 'gel-douche-250ml',         name: 'Gel douche 250ml',           category: 'hygiene' },
  { slug: 'savon-dove-100g',          name: 'Savon Dove 100g',            category: 'hygiene' },
  { slug: 'crème-solaire-spf50',      name: 'Crème solaire SPF50',        category: 'hygiene' },
  { slug: 'moustiquaire-roll-on',     name: 'Anti-moustiques roll-on',    category: 'hygiene' },
  { slug: 'coton-hygienique-200',     name: 'Coton hygiénique ×200',      category: 'hygiene' },
  { slug: 'rasoir-gillette-mach3',    name: 'Rasoir Gillette Mach3',      category: 'hygiene' },
  { slug: 'serviettes-always-10',     name: 'Serviettes Always ×10',      category: 'hygiene' },
  { slug: 'tampons-ob-16',            name: 'Tampons OB ×16',             category: 'hygiene' },
  { slug: 'maquillage-fond-teint',    name: 'Fond de teint',              category: 'hygiene' },
  { slug: 'creme-hydratante-200ml',   name: 'Crème hydratante 200ml',     category: 'hygiene' },
  { slug: 'huile-coco-capillaire',    name: 'Huile coco capillaire',      category: 'hygiene' },

  // ── Entretien (15) ─────────────────────────────────────────────────────────
  { slug: 'lessive-ariel-30d',        name: 'Lessive Ariel 30 doses',     category: 'entretien' },
  { slug: 'lessive-skip-30d',         name: 'Lessive Skip 30 doses',      category: 'entretien' },
  { slug: 'lessive-liquide-3l',       name: 'Lessive liquide 3L',         category: 'entretien' },
  { slug: 'assouplissant-lenor-1-5l', name: 'Assouplissant Lenor 1,5L',   category: 'entretien' },
  { slug: 'liquide-vaisselle-500ml',  name: 'Liquide vaisselle 500ml',    category: 'entretien' },
  { slug: 'liquide-vaisselle-1l',     name: 'Liquide vaisselle 1L',       category: 'entretien' },
  { slug: 'tablettes-lave-vaisselle-30', name: 'Tablettes lave-vaisselle ×30', category: 'entretien' },
  { slug: 'nettoyant-wc-750ml',       name: 'Nettoyant WC 750ml',         category: 'entretien' },
  { slug: 'nettoyant-sol-1l',         name: 'Nettoyant sol 1L',           category: 'entretien' },
  { slug: 'spray-multi-usages',       name: 'Spray multi-usages',         category: 'entretien' },
  { slug: 'papier-toilette-12r',      name: 'Papier toilette ×12',        category: 'entretien' },
  { slug: 'essuie-tout-6r',           name: 'Essuie-tout ×6',             category: 'entretien' },
  { slug: 'sacs-poubelle-30l',        name: 'Sacs poubelle 30L ×50',      category: 'entretien' },
  { slug: 'insecticide-baygon-400ml', name: 'Insecticide Baygon 400ml',   category: 'entretien' },
  { slug: 'desinfectant-javel-750ml', name: 'Désinfectant Javel 750ml',   category: 'entretien' },

  // ── Bébé (10) ──────────────────────────────────────────────────────────────
  { slug: 'couches-pampers-t3-50',    name: 'Couches Pampers T3 ×50',     category: 'bebe' },
  { slug: 'couches-pampers-t4-44',    name: 'Couches Pampers T4 ×44',     category: 'bebe' },
  { slug: 'couches-huggies-t3',       name: 'Couches Huggies T3',         category: 'bebe' },
  { slug: 'lait-bebe-guigoz-1-800g',  name: 'Lait bébé Guigoz 1 (800g)', category: 'bebe' },
  { slug: 'lait-bebe-aptamil-1',      name: 'Lait bébé Aptamil 1',       category: 'bebe' },
  { slug: 'petits-pots-bledina-4',    name: 'Petits pots Blédina ×4',     category: 'bebe' },
  { slug: 'lingettes-bebe-72',        name: 'Lingettes bébé ×72',         category: 'bebe' },
  { slug: 'crème-bébé-100ml',         name: 'Crème bébé 100ml',           category: 'bebe' },
  { slug: 'biberon-250ml',            name: 'Biberon 250ml',              category: 'bebe' },
  { slug: 'gourdes-compote-bebe-4',   name: 'Gourdes compote bébé ×4',    category: 'bebe' },

  // ── Pain & Pâtisserie (10) ─────────────────────────────────────────────────
  { slug: 'pain-de-mie-650g',         name: 'Pain de mie 650g',           category: 'pain-patisserie' },
  { slug: 'pain-baguette',            name: 'Baguette de pain',           category: 'pain-patisserie' },
  { slug: 'pain-complet-500g',        name: 'Pain complet 500g',          category: 'pain-patisserie' },
  { slug: 'pain-brioche-500g',        name: 'Pain brioché 500g',          category: 'pain-patisserie' },
  { slug: 'croissants-x6',            name: 'Croissants ×6',              category: 'pain-patisserie' },
  { slug: 'madeleine-x10',            name: 'Madeleines ×10',             category: 'pain-patisserie' },
  { slug: 'gateau-quatre-quarts-400g', name: 'Gâteau quatre-quarts 400g', category: 'pain-patisserie' },
  { slug: 'pain-sucre-piece',         name: 'Pain sucré (pièce)',         category: 'pain-patisserie' },
  { slug: 'donut-x4',                 name: 'Donuts ×4',                  category: 'pain-patisserie' },
  { slug: 'pain-patate-piece',        name: 'Pain patate (pièce)',        category: 'pain-patisserie' },

  // ── Surgelés (10) ──────────────────────────────────────────────────────────
  { slug: 'glace-miko-500ml',         name: 'Glace Miko 500ml',           category: 'surgeles' },
  { slug: 'sorbet-ananas-500ml',      name: 'Sorbet Ananas 500ml',        category: 'surgeles' },
  { slug: 'frites-mccain-600g',       name: 'Frites McCain 600g',         category: 'surgeles' },
  { slug: 'pizza-surgelee-400g',      name: 'Pizza surgelée 400g',        category: 'surgeles' },
  { slug: 'poisson-pane-450g',        name: 'Poisson pané 450g',          category: 'surgeles' },
  { slug: 'legumes-surgeles-1kg',     name: 'Légumes surgelés 1kg',       category: 'surgeles' },
  { slug: 'crevettes-surgeles-500g',  name: 'Crevettes surgelées 500g',   category: 'surgeles' },
  { slug: 'plat-prepare-surgele',     name: 'Plat préparé surgelé',       category: 'surgeles' },
  { slug: 'cordon-bleu-x2',           name: 'Cordon bleu ×2',             category: 'surgeles' },
  { slug: 'nuggets-x20',              name: 'Nuggets ×20',                category: 'surgeles' },
];

// ── Retailers (main DOM-TOM supermarkets) ─────────────────────────────────────

const RETAILERS = [
  { slug: 'carrefour',    name: 'Carrefour' },
  { slug: 'leclerc',      name: 'E.Leclerc' },
  { slug: 'super-u',      name: 'Super U' },
  { slug: 'leader-price', name: 'Leader Price' },
  { slug: 'intermarche',  name: 'Intermarché' },
  { slug: 'simply-market', name: 'Simply Market' },
];

// ── Categories ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { slug: 'alimentaire',      name: 'Alimentaire' },
  { slug: 'boissons',         name: 'Boissons' },
  { slug: 'produits-laitiers', name: 'Produits Laitiers' },
  { slug: 'viande',           name: 'Viande' },
  { slug: 'epicerie',         name: 'Épicerie' },
  { slug: 'hygiene-entretien', name: 'Hygiène & Entretien' },
  { slug: 'fruits-legumes',   name: 'Fruits & Légumes' },
  { slug: 'bebe',             name: 'Bébé' },
];

// ── Years (current + last 2 years) ───────────────────────────────────────────

const YEARS = ['2024', '2025', '2026'];

// ── Slug helper ────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Page generators ────────────────────────────────────────────────────────────

/**
 * 1. Local product price pages — /prix/<product-slug>-<territory-name>
 *    Ex: /prix/coca-cola-1-5l-guadeloupe
 *    Target: "prix coca cola guadeloupe", "prix nutella martinique"
 */
function generatePrixPages() {
  const pages = [];
  for (const product of PRODUCTS) {
    for (const territory of TERRITORIES) {
      const slug = `${product.slug}-${territory.name}`;
      pages.push({
        type: 'prix-local',
        url: `${SITE_URL}/prix/${slug}`,
        path: `/prix/${slug}`,
        priority: '0.9',
        changefreq: 'daily',
        meta: {
          title: `Prix ${product.name} en ${territory.label} — Comparateur`,
          description: `Comparez le prix de ${product.name} en ${territory.label}. Trouvez le meilleur prix dans les supermarchés locaux.`,
          territory: territory.code,
          product: product.slug,
          category: product.category,
        },
      });
    }
  }
  return pages;
}

/**
 * 2. Retailer comparison pages — /comparer/<r1>-vs-<r2>-<territory>
 *    Ex: /comparer/carrefour-vs-leclerc-guadeloupe
 *    Target: "carrefour vs leclerc guadeloupe prix"
 */
function generateComparaisonPages() {
  const pages = [];
  for (let i = 0; i < RETAILERS.length; i++) {
    for (let j = i + 1; j < RETAILERS.length; j++) {
      for (const territory of TERRITORIES) {
        const slug = `${RETAILERS[i].slug}-vs-${RETAILERS[j].slug}-${territory.name}`;
        pages.push({
          type: 'comparaison-enseignes',
          url: `${SITE_URL}/comparer/${slug}`,
          path: `/comparer/${slug}`,
          priority: '0.8',
          changefreq: 'weekly',
          meta: {
            title: `${RETAILERS[i].name} vs ${RETAILERS[j].name} ${territory.label} — Qui est le moins cher ?`,
            description: `Comparez les prix ${RETAILERS[i].name} et ${RETAILERS[j].name} en ${territory.label}. Trouvez le supermarché le moins cher pour vos courses.`,
            territory: territory.code,
            retailer1: RETAILERS[i].slug,
            retailer2: RETAILERS[j].slug,
          },
        });
      }
    }
  }
  return pages;
}

/**
 * 3. Inflation trend pages — /inflation/<category-slug>-<territory>-<year>
 *    Ex: /inflation/alimentaire-guadeloupe-2026
 *    Target: "inflation alimentaire guadeloupe 2026"
 */
function generateInflationPages() {
  const pages = [];
  for (const category of CATEGORIES) {
    for (const territory of TERRITORIES) {
      for (const year of YEARS) {
        const slug = `${category.slug}-${territory.name}-${year}`;
        pages.push({
          type: 'inflation-tendances',
          url: `${SITE_URL}/inflation/${slug}`,
          path: `/inflation/${slug}`,
          priority: '0.8',
          changefreq: 'monthly',
          meta: {
            title: `Inflation ${category.name} en ${territory.label} ${year} — Évolution des prix`,
            description: `Suivez l'évolution des prix ${category.name.toLowerCase()} en ${territory.label} en ${year}. Données officielles et tendances inflation.`,
            territory: territory.code,
            category: category.slug,
            year,
          },
        });
      }
    }
  }
  return pages;
}

/**
 * 4. Cheapest products intent pages — /moins-cher/<territory>
 *    Ex: /moins-cher/guadeloupe
 *    Target: "produits moins chers guadeloupe", "où faire ses courses moins cher"
 */
function generateMoinsChersPages() {
  const pages = [];
  for (const territory of TERRITORIES) {
    pages.push({
      type: 'moins-chers',
      url: `${SITE_URL}/moins-cher/${territory.name}`,
      path: `/moins-cher/${territory.name}`,
      priority: '0.9',
      changefreq: 'daily',
      meta: {
        title: `Produits les moins chers en ${territory.label} — Top offres du jour`,
        description: `Découvrez les produits les moins chers en ${territory.label} aujourd'hui. Comparez toutes les enseignes et économisez sur vos courses.`,
        territory: territory.code,
      },
    });
    // Also add category-specific cheapest pages
    for (const category of CATEGORIES.slice(0, 4)) { // Top 4 categories
      pages.push({
        type: 'moins-chers-categorie',
        url: `${SITE_URL}/moins-cher/${territory.name}/${category.slug}`,
        path: `/moins-cher/${territory.name}/${category.slug}`,
        priority: '0.8',
        changefreq: 'daily',
        meta: {
          title: `${category.name} moins chers en ${territory.label} — Comparateur`,
          description: `Les meilleurs prix ${category.name.toLowerCase()} en ${territory.label}. Économisez sur vos courses avec notre comparateur.`,
          territory: territory.code,
          category: category.slug,
        },
      });
    }
  }
  return pages;
}

// ── Main execution ─────────────────────────────────────────────────────────────

// ── Brands (20) ────────────────────────────────────────────────────────────────

const BRANDS = [
  { slug: 'coca-cola',    name: 'Coca-Cola' },
  { slug: 'nutella',      name: 'Nutella' },
  { slug: 'nestle',       name: 'Nestlé' },
  { slug: 'president',    name: 'Président' },
  { slug: 'panzani',      name: 'Panzani' },
  { slug: 'evian',        name: 'Évian' },
  { slug: 'ariel',        name: 'Ariel' },
  { slug: 'pampers',      name: 'Pampers' },
  { slug: 'barilla',      name: 'Barilla' },
  { slug: 'danone',       name: 'Danone' },
  { slug: 'kiri',         name: 'Kiri' },
  { slug: 'lu',           name: 'LU' },
  { slug: 'maggi',        name: 'Maggi' },
  { slug: 'bonduelle',    name: 'Bonduelle' },
  { slug: 'william-saurin', name: 'William Saurin' },
  { slug: 'clipper',      name: 'Clipper' },
  { slug: 'tropicana',    name: 'Tropicana' },
  { slug: 'heineken',     name: 'Heineken' },
  { slug: 'gillette',     name: 'Gillette' },
  { slug: 'dove',         name: 'Dove' },
];

// ── Guide prix pages (/guide-prix/<product>-<territory>) ──────────────────────

function generateGuidePrixPages() {
  const pages = [];
  for (const territory of TERRITORIES) {
    for (const product of PRODUCTS) {
      const slug = `${product.slug}-${territory.name}`;
      pages.push({
        type: 'guide-prix',
        url: `${SITE_URL}/guide-prix/${slug}`,
        path: `/guide-prix/${slug}`,
        priority: '0.8',
        changefreq: 'monthly',
        meta: {
          title: `Guide prix ${product.name} en ${territory.label} 2026 — Historique & conseils`,
          description: `Guide complet sur le prix de ${product.name} en ${territory.label}. Historique, comparaison des enseignes, conseils pour payer moins cher.`,
          territory: territory.code,
          category: product.category,
          productSlug: product.slug,
        },
      });
    }
  }
  return pages;
}

// ── Brand pages (/marque/<brand>-<territory>) ─────────────────────────────────

function generateMarquePages() {
  const pages = [];
  for (const territory of TERRITORIES) {
    for (const brand of BRANDS) {
      const slug = `${brand.slug}-${territory.name}`;
      pages.push({
        type: 'marque',
        url: `${SITE_URL}/marque/${slug}`,
        path: `/marque/${slug}`,
        priority: '0.7',
        changefreq: 'weekly',
        meta: {
          title: `Prix ${brand.name} en ${territory.label} — Tous les produits comparés`,
          description: `Comparez les prix de tous les produits ${brand.name} en ${territory.label}. Tableau comparatif par enseigne, mis à jour quotidiennement.`,
          territory: territory.code,
          brand: brand.slug,
        },
      });
    }
  }
  return pages;
}

// ── Enseigne pages (/prix-enseigne/<retailer>/<territory>) ─────────────────────

function generateEnseignePages() {
  const pages = [];
  for (const territory of TERRITORIES) {
    for (const retailer of RETAILERS) {
      pages.push({
        type: 'enseigne-prix',
        url: `${SITE_URL}/prix-enseigne/${retailer.slug}/${territory.name}`,
        path: `/prix-enseigne/${retailer.slug}/${territory.name}`,
        priority: '0.8',
        changefreq: 'daily',
        meta: {
          title: `Prix ${retailer.name} en ${territory.label} — Top produits du moment`,
          description: `Découvrez les meilleurs prix chez ${retailer.name} en ${territory.label}. Top 10 produits, comparaison concurrents, conseils économies.`,
          territory: territory.code,
          retailer: retailer.slug,
        },
      });
    }
  }
  return pages;
}

const args = process.argv.slice(2);
const outputJson    = args.includes('--json');
const outputSitemap = args.includes('--sitemap');

const prixPages         = generatePrixPages();
const comparaisonPages  = generateComparaisonPages();
const inflationPages    = generateInflationPages();
const moinsChersPages   = generateMoinsChersPages();
const guidePrixPages    = generateGuidePrixPages();
const marquePages       = generateMarquePages();
const enseignePages     = generateEnseignePages();

const allPages = [
  ...prixPages,
  ...comparaisonPages,
  ...inflationPages,
  ...moinsChersPages,
  ...guidePrixPages,
  ...marquePages,
  ...enseignePages,
];

console.log('🚀 A KI PRI SA YÉ — Générateur de pages SEO longue traîne');
console.log('──────────────────────────────────────────────────────────');
console.log(`📄 Pages prix locaux         : ${prixPages.length}`);
console.log(`🏪 Pages comparaison enseignes: ${comparaisonPages.length}`);
console.log(`📈 Pages inflation/tendances  : ${inflationPages.length}`);
console.log(`💰 Pages produits moins chers : ${moinsChersPages.length}`);
console.log(`📖 Pages guide prix           : ${guidePrixPages.length}`);
console.log(`🏷️  Pages marques              : ${marquePages.length}`);
console.log(`🏬 Pages enseignes            : ${enseignePages.length}`);
console.log(`──────────────────────────────────────────────────────────`);
console.log(`🎯 TOTAL pages générées       : ${allPages.length}`);
console.log('');

// ── JSON output ────────────────────────────────────────────────────────────────

if (outputJson || !outputSitemap) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    siteUrl: SITE_URL,
    totalPages: allPages.length,
    byType: {
      'prix-local':            prixPages.length,
      'comparaison-enseignes': comparaisonPages.length,
      'inflation-tendances':   inflationPages.length,
      'moins-chers':           moinsChersPages.length,
      'guide-prix':            guidePrixPages.length,
      'marque':                marquePages.length,
      'enseigne-prix':         enseignePages.length,
    },
    products:    PRODUCTS.length,
    territories: TERRITORIES.length,
    retailers:   RETAILERS.length,
    brands:      BRANDS.length,
    pages: allPages,
  };

  fs.writeFileSync('seo-pages-manifest.json', JSON.stringify(manifest, null, 2));
  console.log('✔ seo-pages-manifest.json written');

  // Also write to frontend/src/data/seo/
  const seoDataDir = 'frontend/src/data/seo';
  fs.mkdirSync(seoDataDir, { recursive: true });
  const generatedPagesData = {
    generatedAt: manifest.generatedAt,
    totalPages:  manifest.totalPages,
    byType:      manifest.byType,
    products:    manifest.products,
    territories: manifest.territories,
    retailers:   manifest.retailers,
    brands:      manifest.brands,
  };
  fs.writeFileSync(`${seoDataDir}/generated-pages.json`, JSON.stringify(generatedPagesData, null, 2));
  console.log(`✔ ${seoDataDir}/generated-pages.json written`);
}

// ── Sitemap fragment output ────────────────────────────────────────────────────

if (outputSitemap) {
  let sitemapFragment = '';
  for (const page of allPages) {
    sitemapFragment += `  <url>
    <loc>${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }
  fs.writeFileSync('seo-pages-sitemap-fragment.xml', sitemapFragment);
  console.log('✔ seo-pages-sitemap-fragment.xml written');
}
