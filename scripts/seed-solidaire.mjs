import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// ⚠️ Téléchargez votre clé de service depuis : 
// Console Firebase -> Paramètres -> Comptes de service -> Générer une nouvelle clé privée
const serviceAccount = JSON.parse(fs.readFileSync('./service-account-file.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const producteurs = [
  {
    id: 'prod-tijardin-gp',
    nom: 'Ferme Ti Jardin',
    description: 'Maraîchage diversifié en agriculture biologique.',
    territoire: 'GP',
    adresse: 'Capesterre-Belle-Eau',
    telephone: '0590 12 34 56',
    email: 'contact@tijardin.gp',
    specialites: ['Légumes racine', 'Salades', 'Herbes'],
    certification: 'BIO AB',
    active: true
  },
  {
    id: 'prod-cooppeyi-mq',
    nom: 'Coopérative Péyi Martinique',
    description: 'Regroupement de producteurs pour la souveraineté alimentaire.',
    territoire: 'MQ',
    adresse: 'Le Lamentin',
    telephone: '0596 77 88 99',
    email: 'info@cooppeyi.mq',
    specialites: ['Bananes', 'Ananas', 'Épices'],
    certification: 'Zéro Chlordécone',
    active: true
  }
];

const paniers = [
  {
    titre: 'Panier Fond de Cuisine 🥗',
    description: 'Sélection de 5kg de légumes de saison (patates douces, ignames, giraumon)',
    prix: 15.00,
    prixHabituel: 22.50,
    economie: 7.50,
    territoire: 'GP',
    producteur: 'Ferme Ti Jardin',
    disponible: 12,
    type: 'bio',
    updatedAt: new Date().toISOString()
  },
  {
    titre: 'Pack Fraîcheur Fruits 🍍',
    description: 'Assortiment de fruits tropicaux cueillis à maturité.',
    prix: 10.00,
    prixHabituel: 16.00,
    economie: 6.00,
    territoire: 'MQ',
    producteur: 'Coopérative Péyi Martinique',
    disponible: 5,
    type: 'local',
    updatedAt: new Date().toISOString()
  }
];

async function seed() {
  console.log('🚀 Début de l\'injection des données réelles...');

  // Injecter les producteurs
  for (const p of producteurs) {
    await db.collection('producteurs').doc(p.id).set(p);
    console.log(`✅ Producteur ajouté : ${p.nom}`);
  }

  // Injecter les paniers
  for (const pan of paniers) {
    await db.collection('paniers').add(pan);
    console.log(`✅ Panier ajouté : ${pan.titre}`);
  }

  console.log('✨ Terminé ! Votre module Ti-Panié est maintenant alimenté.');
}

seed().catch(console.error);