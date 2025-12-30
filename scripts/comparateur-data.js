/*****************************************************
 * A KI PRI SA YÉ - Base produits / Comparateur v2.1
 * Compatible Firestore + Scanner + Alertes prix
 *****************************************************/

// -----------------------------
// 📌 Base des catégories
// -----------------------------
export const categories = [
  'Fruits & Légumes',
  'Viandes & Poissons',
  'Épicerie',
  'Boissons',
  'Hygiène',
  'Maison',
  'Bébé',
  'Animaux',
];

// -----------------------------
// 📌 Base produits nationale (DOM-TOM)
// Format compatible Firestore
// -----------------------------
export const produits = [
  {
    id: 'p-banane',
    nom: 'Banane Locale',
    categorie: 'Fruits & Légumes',
    unite: 'kg',
    prixMoyen: {
      guadeloupe: 2.40,
      martinique: 2.20,
      guyane: 2.80,
      reunion: 2.10,
      mayotte: 2.60,
      nc: 3.20,
      pf: 3.50,
    },
  },
  {
    id: 'p-eau-1l',
    nom: 'Eau Minérale 1L',
    categorie: 'Boissons',
    unite: 'L',
    prixMoyen: {
      guadeloupe: 0.65,
      martinique: 0.60,
      guyane: 0.70,
      reunion: 0.55,
      mayotte: 0.75,
      nc: 0.90,
      pf: 1.00,
    },
  },
  {
    id: 'p-riz-1kg',
    nom: 'Riz Long 1kg',
    categorie: 'Épicerie',
    unite: 'kg',
    prixMoyen: {
      guadeloupe: 1.95,
      martinique: 1.90,
      guyane: 2.10,
      reunion: 1.85,
      mayotte: 2.20,
      nc: 2.90,
      pf: 3.10,
    },
  },
  {
    id: 'p-lait-1l',
    nom: 'Lait UHT 1L',
    categorie: 'Boissons',
    unite: 'L',
    prixMoyen: {
      guadeloupe: 1.35,
      martinique: 1.30,
      guyane: 1.50,
      reunion: 1.25,
      mayotte: 1.65,
      nc: 2.20,
      pf: 2.40,
    },
  },
  {
    id: 'p-savon',
    nom: 'Savon corporel 250ml',
    categorie: 'Hygiène',
    unite: '250 ml',
    prixMoyen: {
      guadeloupe: 2.90,
      martinique: 2.80,
      guyane: 3.10,
      reunion: 2.70,
      mayotte: 3.20,
      nc: 3.80,
      pf: 4.10,
    },
  },
];

// -----------------------------
// 📌 Fonction utilitaire
// Récupère le prix selon territoire
// -----------------------------
export function getPrixProduit(id, territoire) {
  const item = produits.find(p => p.id === id);
  if (!item) return null;

  const prix = item.prixMoyen[territoire.toLowerCase()];
  return prix ?? null;
}

// -----------------------------
// 📌 Export Firestore (si nécessaire)
// -----------------------------
export const firestoreStructure = produits.map(p => ({
  id: p.id,
  nom: p.nom,
  categorie: p.categorie,
  unite: p.unite,
  prixMoyen: p.prixMoyen,
}));

console.log('✔ comparateur-data.js chargé.');
