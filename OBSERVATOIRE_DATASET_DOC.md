# Documentation: Dataset Observatoire

## 📂 Structure des fichiers

Les données de l'Observatoire sont stockées dans `/data/observatoire/` et copiées vers `/public/data/observatoire/` lors du build pour être accessibles depuis le frontend.

### Fichiers actuels

- `guadeloupe_2026-01.json` - Snapshot de janvier 2026
- `guadeloupe_2026-02.json` - Snapshot de février 2026

## 📊 Format des données

Chaque fichier suit ce schéma:

```json
{
  "territoire": "Guadeloupe",
  "date_snapshot": "2026-01-03",
  "source": "releve_citoyen",
  "qualite": "verifie",
  "donnees": [
    {
      "commune": "Les Abymes",
      "enseigne": "Carrefour",
      "categorie": "Produits laitiers",
      "produit": "Lait demi-écrémé UHT 1L",
      "ean": "3560070123456",
      "unite": "1L",
      "prix": 1.42
    }
  ]
}
```

## 🔧 Utilisation dans le code

### Charger les données

```typescript
import { loadObservatoireData } from '@/services/observatoireDataLoader';

const snapshots = await loadObservatoireData('Guadeloupe');
```

### Calculer les statistiques

```typescript
import { calculateStatistics } from '@/services/observatoireDataLoader';

const stats = calculateStatistics(snapshots);
// Retourne: prix moyen, min, max par produit
```

### Calculer l'évolution des prix

```typescript
import { calculatePriceChange } from '@/services/observatoireDataLoader';

const changes = calculatePriceChange(snapshots[0], snapshots[1]);
// Retourne: % de changement pour chaque produit
```

### Obtenir un résumé

```typescript
import { getObservatoireSummary } from '@/utils/testObservatoire';

const summary = await getObservatoireSummary('Guadeloupe');
console.log(summary);
// {
//   available: true,
//   productsTracked: 5,
//   avgPrice: 1.78,
//   priceEvolution: { percentage: 2.5, direction: 'hausse' }
// }
```

## ✅ Validation

Les données sont validées automatiquement par le CI via:

```bash
node scripts/validate-observatoire-data.js
```

### Règles de validation

1. Champs obligatoires présents
2. Dates au format ISO (YYYY-MM-DD)
3. Prix positifs
4. Catégories valides (voir schema)
5. Territoires valides
6. Code EAN valide si présent (8-13 chiffres)

## 📈 Indicateurs calculés

Avec ces données, l'Observatoire peut afficher:

- **Prix moyen** par produit et catégorie
- **Écart DOM/Métropole** (nécessite données métropole)
- **Dispersion entre enseignes** (min/max/variance)
- **Évolution temporelle** (comparaison entre snapshots)
- **Inflation** (% de changement global)

## 🔄 Ajouter de nouvelles données

1. Créer un nouveau fichier JSON dans `/data/observatoire/`
2. Suivre le format existant
3. Valider avec `node scripts/validate-observatoire-data.js`
4. Copier vers `/public/data/observatoire/` lors du build
5. Le CI validera automatiquement les données

## 🎯 Prochaines étapes

Pour une utilisation complète de ces données:

1. **Backend API** - Servir les données via une API REST
2. **Base de données** - Stocker les observations dans une DB
3. **Agrégation automatique** - Calculer les stats à la volée
4. **Intégration Dashboard** - Connecter au ObservatoireDashboard
5. **Exports** - Permettre l'export CSV/JSON pour Open Data

## 📝 Notes

- Les données actuelles sont des échantillons réels pour Guadeloupe
- 5 produits essentiels sur 2 communes et 3 enseignes
- 2 snapshots pour démontrer l'évolution temporelle
- Prêt pour montée en charge (plus de produits, territoires, dates)
