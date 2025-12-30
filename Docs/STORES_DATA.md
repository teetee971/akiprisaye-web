# Données des Magasins (Stores Data)

## Vue d'ensemble

Ce document décrit la structure et l'utilisation des données des magasins dans l'application A KI PRI SA YÉ.

## Structure des données

### Fichier principal: `src/data/seedStores.js`

Ce fichier contient la base de données centralisée de tous les magasins référencés dans les 12 territoires DROM-COM.

### Structure d'un magasin

```javascript
{
  id: 'carrefour_baie_mahault',           // Identifiant unique
  name: 'Carrefour Baie-Mahault',         // Nom du magasin
  chain: 'Carrefour',                     // Chaîne (Carrefour, Système U, etc.)
  territory: 'Guadeloupe',                // Territoire DROM-COM
  city: 'Baie-Mahault',                   // Ville
  address: 'Centre Commercial Destrelande', // Adresse
  postalCode: '97122',                    // Code postal
  coordinates: {                          // Coordonnées GPS
    lat: 16.2676,
    lon: -61.5252
  },
  phone: '+590 590 XX XX XX',            // Téléphone
  openingHours: 'Lun-Sam 8h30-20h30, Dim 9h-13h', // Horaires
  services: [                             // Services disponibles
    'parking',
    'carte_bancaire',
    'livraison',
    'retrait_course'
  ]
}
```

## Territoires couverts

L'application couvre les 12 territoires DROM-COM:

1. 🇬🇵 **Guadeloupe** - 5 magasins
2. 🇲🇶 **Martinique** - 4 magasins
3. 🇬🇫 **Guyane** - 3 magasins
4. 🇷🇪 **La Réunion** - 4 magasins
5. 🇾🇹 **Mayotte** - 2 magasins
6. 🇵🇲 **Saint-Pierre-et-Miquelon** - 1 magasin
7. 🇧🇱 **Saint-Barthélemy** - 1 magasin
8. 🇲🇫 **Saint-Martin** - 2 magasins
9. 🇼🇫 **Wallis-et-Futuna** - 1 magasin
10. 🇵🇫 **Polynésie française** - 2 magasins
11. 🇳🇨 **Nouvelle-Calédonie** - 2 magasins
12. 🇹🇫 **Terres australes** - (à venir)

**Total: 27 magasins**

## Chaînes de magasins

Les principales chaînes représentées:

- **Carrefour** - Hypermarché
- **Système U** (Super U, Hyper U) - Supermarché
- **E.Leclerc** - Hypermarché
- **Leader Price** - Discount
- **Intermarché** - Supermarché
- **Match** - Supermarché
- **Super Score** - Supermarché local

## Fonctions utilitaires

### `getStoreById(storeId)`
Récupère un magasin par son ID.

```javascript
import { getStoreById } from './src/data/seedStores.js';

const store = getStoreById('carrefour_baie_mahault');
console.log(store.name); // "Carrefour Baie-Mahault"
```

### `getStoresByTerritory(territory)`
Récupère tous les magasins d'un territoire.

```javascript
import { getStoresByTerritory } from './src/data/seedStores.js';

const stores = getStoresByTerritory('Guadeloupe');
console.log(stores.length); // 5
```

### `getAllStores()`
Récupère tous les magasins.

```javascript
import { getAllStores } from './src/data/seedStores.js';

const allStores = getAllStores();
console.log(allStores.length); // 27
```

### `searchStores(query)`
Recherche des magasins par nom, ville ou chaîne.

```javascript
import { searchStores } from './src/data/seedStores.js';

const results = searchStores('Carrefour');
// Retourne tous les magasins Carrefour
```

### `getStoresByChain(chain)`
Récupère tous les magasins d'une chaîne.

```javascript
import { getStoresByChain } from './src/data/seedStores.js';

const carrefours = getStoresByChain('Carrefour');
```

### `getTerritoryNameFromCode(code)`
Convertit un code de territoire en nom complet.

```javascript
import { getTerritoryNameFromCode } from './src/data/seedStores.js';

const name = getTerritoryNameFromCode('guadeloupe');
console.log(name); // "Guadeloupe"
```

## Services disponibles

Liste des services que peuvent proposer les magasins:

- `parking` - Parking disponible
- `carte_bancaire` - Paiement par carte bancaire
- `livraison` - Service de livraison à domicile
- `retrait_course` - Click & Collect / Retrait en magasin
- `essence` - Station essence

## Intégration avec Firestore

Le module `firestorePrices.js` intègre les données seed avec Firestore:

1. Tentative de récupération depuis Firestore
2. Fallback automatique sur les données seed si Firestore est indisponible
3. Garantit la disponibilité des données même hors ligne

## Intégration avec la carte

Le fichier `carte.html` utilise ces données pour afficher les magasins sur une carte interactive Leaflet.

Les marqueurs affichent:
- Nom du magasin
- Chaîne
- Localisation (ville, territoire)
- Adresse
- Horaires d'ouverture
- Services disponibles

## Cohérence avec seedProducts.js

Les IDs de magasins dans `seedStores.js` correspondent aux `storeId` utilisés dans `seedProducts.js` pour les prix, garantissant une cohérence entre les données.

## Ajout de nouveaux magasins

Pour ajouter un nouveau magasin:

1. Ajouter l'entrée dans `SEED_STORES` dans `src/data/seedStores.js`
2. S'assurer que l'ID est unique et en snake_case
3. Utiliser le même format de territoire que les magasins existants
4. Ajouter les coordonnées GPS précises (utiliser Google Maps ou OpenStreetMap)
5. Vérifier que le territoire est bien dans la liste des 12 DROM-COM

## Migration vers Firestore

Pour migrer les données vers Firestore:

```javascript
import { SEED_STORES } from './src/data/seedStores.js';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase-config.js';

async function migrateStores() {
  for (const store of SEED_STORES) {
    const storeRef = doc(db, 'stores', store.id);
    await setDoc(storeRef, {
      name: store.name,
      chain: store.chain,
      territory: store.territory,
      city: store.city,
      address: store.address,
      postalCode: store.postalCode,
      coordinates: store.coordinates,
      phone: store.phone,
      openingHours: store.openingHours,
      services: store.services,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}
```

## Prochaines étapes

- [ ] Ajouter plus de magasins pour chaque territoire
- [ ] Intégrer les horaires d'ouverture en temps réel
- [ ] Ajouter les photos des magasins
- [ ] Implémenter la géolocalisation pour trouver le magasin le plus proche
- [ ] Ajouter les avis et notes des utilisateurs
- [ ] Synchroniser avec les APIs des magasins partenaires
