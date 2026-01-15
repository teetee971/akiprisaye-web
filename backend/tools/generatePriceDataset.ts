/**
 * Générateur déterministe de datasets de prix
 * Version: 1.0.0
 * 
 * Usage:
 *   npx tsx tools/generatePriceDataset.ts
 *   → génère priceObservations.generated.json
 * 
 * Objectif:
 * - Générer des datasets de test volumineux (500 / 1000 / 10000 observations)
 * - Données déterministes et reproductibles
 * - Aucun bruit promotionnel
 * - Produits stables vs instables clairement identifiés
 * - Respect des écarts logistiques réels DOM
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

const territories = ['971', '972', '973', '974'] as const;

const stores: Record<typeof territories[number], Array<{ id: string; name: string }>> = {
  '971': [
    { id: 'lp_971', name: 'Leader Price' },
    { id: 'u_971', name: 'Super U' },
  ],
  '972': [
    { id: 'u_972', name: 'Super U' },
    { id: 'cm_972', name: 'Carrefour Market' },
  ],
  '973': [
    { id: 'cg_973', name: 'Carrefour Guyane' },
  ],
  '974': [
    { id: 'lp_974', name: 'Leader Price' },
    { id: 'cm_974', name: 'Carrefour Market' },
  ],
};

interface Product {
  id: string;
  name: string;
  cat: string;
  base: Record<typeof territories[number], number>;
  unstable?: boolean;
}

const products: Product[] = [
  {
    id: 'p_rice_1kg',
    name: 'Riz long grain 1kg',
    cat: 'Épicerie',
    base: { '971': 1.30, '972': 1.35, '973': 1.58, '974': 1.33 },
  },
  {
    id: 'p_pasta_500g',
    name: 'Pâtes 500g',
    cat: 'Épicerie',
    base: { '971': 0.90, '972': 0.95, '973': 1.10, '974': 0.98 },
  },
  {
    id: 'p_milk_1l',
    name: 'Lait demi-écrémé 1L',
    cat: 'Frais',
    base: { '971': 1.04, '972': 1.06, '973': 1.18, '974': 1.08 },
  },
  {
    id: 'p_flour_1kg',
    name: 'Farine de blé 1kg',
    cat: 'Épicerie',
    base: { '971': 1.15, '972': 1.20, '973': 1.40, '974': 1.22 },
  },
  {
    id: 'p_sugar_1kg',
    name: 'Sucre blanc 1kg',
    cat: 'Épicerie',
    base: { '971': 1.35, '972': 1.40, '973': 1.60, '974': 1.42 },
  },
  {
    id: 'p_eggs_6',
    name: 'Oeufs x6',
    cat: 'Frais',
    base: { '971': 2.10, '972': 2.20, '973': 2.55, '974': 2.25 },
  },
  // INSTABLE VOLONTAIRE (doit être exclu du panier anti-crise)
  {
    id: 'p_oil_1l',
    name: 'Huile végétale 1L',
    cat: 'Épicerie',
    base: { '971': 2.40, '972': 2.50, '973': 2.80, '974': 2.55 },
    unstable: true,
  },
];

/**
 * Génère le dataset
 * @param monthCount Nombre de mois à générer (défaut: 12)
 * @param multipleStores Si true, génère des observations pour plusieurs enseignes par territoire
 */
function generateDataset(monthCount: number = 12, multipleStores: boolean = false) {
  const data: Array<{
    productId: string;
    productName: string;
    category: string;
    storeId: string;
    storeName: string;
    territory: string;
    price: number;
    observedAt: string;
  }> = [];

  // Générer les mois (en partant de maintenant et remontant dans le temps)
  const now = new Date();
  const months: string[] = [];
  for (let i = 0; i < monthCount; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    d.setDate(1); // Premier jour du mois
    months.unshift(d.toISOString().slice(0, 10));
  }

  for (const t of territories) {
    const territoryStores = multipleStores ? stores[t] : [stores[t][0]];

    for (const p of products) {
      for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
        const m = months[monthIdx];

        for (const s of territoryStores) {
          let price = p.base[t];

          if (p.unstable) {
            // Variation sinusoïdale pour produits instables (+/- 20%)
            const variance = Math.sin(monthIdx * 0.5) * 0.35;
            price += variance;
          } else {
            // Petite variation naturelle pour produits stables (+/- 2%)
            const monthVariation = ((monthIdx % 4) - 1.5) * 0.01;
            price += monthVariation;
          }

          data.push({
            productId: p.id,
            productName: p.name,
            category: p.cat,
            storeId: s.id,
            storeName: s.name,
            territory: t,
            price: Number(price.toFixed(2)),
            observedAt: m,
          });
        }
      }
    }
  }

  return data;
}

// Génération principale
const dataset = generateDataset(12, false); // 12 mois, 1 enseigne par territoire
const outputPath = join(process.cwd(), 'priceObservations.generated.json');

writeFileSync(outputPath, JSON.stringify(dataset, null, 2));

console.log(`✅ Generated ${dataset.length} observations`);
console.log(`📊 Breakdown:`);
console.log(`   - Territories: ${territories.length}`);
console.log(`   - Products: ${products.length}`);
console.log(`   - Months: 12`);
console.log(`   - Stable products: ${products.filter(p => !p.unstable).length}`);
console.log(`   - Unstable products: ${products.filter(p => p.unstable).length}`);
console.log(`📁 Output: ${outputPath}`);
console.log(``);
console.log(`🔧 Pour générer plus de données:`);
console.log(`   - Modifier monthCount (12 → 24 pour 2 ans)`);
console.log(`   - Activer multipleStores (false → true)`);
console.log(`   - Ajouter des produits dans l'array 'products'`);
