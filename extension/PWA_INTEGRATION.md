# Integration PWA - Extension Browser

Ce document décrit comment l'extension navigateur et la PWA A KI PRI SA YÉ fonctionnent ensemble.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Utilisateur Citoyen                       │
└─────────────┬───────────────────────────┬───────────────────┘
              │                           │
              │                           │
      ┌───────▼────────┐          ┌──────▼──────────┐
      │   Extension    │          │   PWA Mobile    │
      │   Browser      │          │   / Desktop     │
      └───────┬────────┘          └──────┬──────────┘
              │                           │
              │    Synchronisation        │
              │    (Optionnelle)          │
              │                           │
              └──────────┬────────────────┘
                         │
                 ┌───────▼────────┐
                 │   API Commune  │
                 │   akiprisaye   │
                 └───────┬────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
      ┌───────▼────────┐    ┌──────▼─────────┐
      │  Données       │    │  Stockage      │
      │  Officielles   │    │  Utilisateur   │
      └────────────────┘    └────────────────┘
```

## Modes de Fonctionnement

### Mode Autonome (Extension seule)

L'extension fonctionne de manière totalement autonome:
- Stockage local uniquement
- Pas de compte utilisateur requis
- Pas de synchronisation
- Fonctionnalités de base complètes

### Mode Connecté (Extension + PWA)

L'utilisateur peut synchroniser avec la PWA:
- Compte utilisateur optionnel
- Synchronisation liste de courses
- Synchronisation produits suivis
- Partage des préférences

## Stockage des Données

### Extension Browser (Chrome Storage API)

```javascript
// Structure de stockage local
{
  user_consent: true,
  consent_date: "2025-12-18T10:00:00.000Z",
  user_territory: {
    code: "GP",
    name: "Guadeloupe",
    type: "DOM"
  },
  shopping_list: [
    {
      name: "Produit X",
      brand: "Marque Y",
      price: 3.50,
      store: "Carrefour",
      addedAt: "2025-12-18T10:00:00.000Z"
    }
  ],
  followed_products: [
    {
      name: "Produit Z",
      price: 5.00,
      lastPrice: 5.00,
      followedAt: "2025-12-18T10:00:00.000Z",
      alerts: {
        priceIncrease: true,
        priceDecrease: true,
        threshold: 0.05
      }
    }
  ],
  price_alerts: true
}
```

### PWA (IndexedDB + Firebase)

```javascript
// Structure similaire mais avec support hors ligne avancé
{
  userId: "optional-user-id",
  lastSync: "2025-12-18T10:00:00.000Z",
  territory: { code: "GP", name: "Guadeloupe" },
  shoppingList: [...],
  followedProducts: [...],
  priceHistory: [...],
  syncEnabled: true
}
```

## API de Synchronisation

### Endpoints

#### POST /api/sync/shopping_list
Synchronise la liste de courses

```json
{
  "data": [
    {
      "name": "Produit",
      "price": 3.50,
      "store": "Carrefour",
      "addedAt": "2025-12-18T10:00:00.000Z"
    }
  ]
}
```

#### POST /api/sync/followed_products
Synchronise les produits suivis

```json
{
  "data": [
    {
      "name": "Produit",
      "price": 5.00,
      "alerts": { "threshold": 0.05 }
    }
  ]
}
```

#### GET /api/sync/status
Vérifie l'état de synchronisation

```json
{
  "lastSync": "2025-12-18T10:00:00.000Z",
  "itemsCount": {
    "shoppingList": 5,
    "followedProducts": 3
  }
}
```

### Authentification (Optionnelle)

Si l'utilisateur souhaite synchroniser entre appareils:

1. Création compte (email + mot de passe)
2. Token JWT pour authentification
3. Extension stocke le token de manière sécurisée
4. Synchronisation automatique en arrière-plan

## Flux de Synchronisation

### Depuis Extension vers PWA

```javascript
// Dans le service worker de l'extension
async function syncWithPWA(dataType, data) {
  const token = await getAuthToken(); // Si utilisateur connecté
  
  const response = await fetch(`${API_URL}/sync/${dataType}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : null
    },
    body: JSON.stringify({ data })
  });
  
  return response.json();
}
```

### Depuis PWA vers Extension

La PWA peut proposer un bouton "Installer l'extension" qui:
1. Détecte le navigateur
2. Redirige vers le Chrome Web Store (ou équivalent)
3. Propose de synchroniser après installation

## Messages Cross-Context

### Extension → PWA

L'extension peut communiquer avec la PWA si celle-ci est ouverte:

```javascript
// Depuis l'extension
chrome.runtime.sendMessage({
  type: 'SYNC_DATA',
  data: { shoppingList: [...] }
});

// Dans la PWA
window.addEventListener('message', (event) => {
  if (event.data.type === 'SYNC_DATA') {
    updateLocalData(event.data.data);
  }
});
```

## Gestion des Conflits

### Stratégie: Last-Write-Wins

En cas de modification simultanée:
1. Timestamp le plus récent gagne
2. Fusion intelligente des listes (union)
3. Notification à l'utilisateur en cas de conflit important

### Exemple de Fusion

```javascript
function mergeLists(local, remote) {
  const merged = [...local];
  
  for (const remoteItem of remote) {
    const existingIndex = merged.findIndex(
      item => item.name === remoteItem.name && item.store === remoteItem.store
    );
    
    if (existingIndex === -1) {
      // Nouvel item
      merged.push(remoteItem);
    } else {
      // Conflit: garder le plus récent
      if (new Date(remoteItem.addedAt) > new Date(merged[existingIndex].addedAt)) {
        merged[existingIndex] = remoteItem;
      }
    }
  }
  
  return merged;
}
```

## Mode Hors Ligne

### Extension
- Fonctionne toujours hors ligne
- Stockage local Chrome Storage
- Synchronisation différée quand connexion revient

### PWA
- Service Worker avec cache stratégique
- IndexedDB pour stockage persistant
- Synchronisation en arrière-plan (Background Sync API)

## Sécurité

### Transmission de Données
- HTTPS uniquement
- Pas de données sensibles transmises
- Token JWT avec expiration courte (24h)

### Stockage
- Chrome Storage (chiffré par le navigateur)
- IndexedDB (chiffré par le navigateur)
- Pas de stockage de mots de passe côté extension

### Validation
- Validation côté serveur de toutes les données
- Limite de taille des listes
- Rate limiting sur l'API

## Déploiement

### Extension
1. Build de production
2. Publication Chrome Web Store
3. Publication Firefox Add-ons
4. (Optionnel) Publication Edge Add-ons

### PWA
1. Build de production
2. Déploiement sur Cloudflare Pages
3. Mise à jour du Service Worker
4. Cache invalidation

### Coordination
- Versions compatibles documentées
- Extension v1.x ↔ PWA v2.x
- API versionnée (v1, v2, etc.)

## Tests

### Tests d'Intégration
```javascript
describe('Extension-PWA Sync', () => {
  it('should sync shopping list', async () => {
    // Ajouter item dans extension
    await extension.addToShoppingList(product);
    
    // Vérifier synchronisation
    const pwaList = await pwa.getShoppingList();
    expect(pwaList).toContainEqual(product);
  });
  
  it('should handle conflicts', async () => {
    // Modifier dans les deux
    await extension.updateProduct(productA);
    await pwa.updateProduct(productB);
    
    // Vérifier fusion
    await sync();
    const result = await getProduct();
    expect(result.updatedAt).toBe(max(productA.updatedAt, productB.updatedAt));
  });
});
```

## Monitoring

### Métriques à Suivre
- Taux de synchronisation réussie
- Latence de synchronisation
- Conflits détectés et résolus
- Utilisation de la synchronisation (% utilisateurs)

### Logs
```javascript
{
  event: 'sync_success',
  dataType: 'shopping_list',
  itemsCount: 5,
  timestamp: '2025-12-18T10:00:00.000Z',
  userId: 'anonymous' // ou ID si connecté
}
```

## Roadmap

- [ ] Synchronisation temps réel (WebSockets)
- [ ] Partage de listes entre utilisateurs
- [ ] Import/Export de données
- [ ] Synchronisation cross-platform (iOS/Android)
- [ ] Encryption end-to-end des données sensibles

---

**Version**: 1.0.0  
**Date**: Décembre 2025  
**Status**: Spécification complète
