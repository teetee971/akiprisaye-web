# Module d'observations de prix - Guide d'utilisation

Ce guide explique comment utiliser le module d'ingestion manuelle d'observations de prix basé sur des tickets de caisse.

## 📋 Vue d'ensemble

Le module permet de :
- ✅ Ajouter des observations de prix réels à partir de tickets de caisse
- ✅ Valider automatiquement les données selon un schéma strict
- ✅ Générer un index trié des observations
- ✅ Publier les observations sur la page publique `/observatoire.html`

## 🚀 Utilisation rapide

### 1. Préparer votre observation

Créez un fichier JSON avec les données de votre ticket de caisse :

```json
{
  "territoire": "Guadeloupe",
  "commune": "Morne-à-l'Eau",
  "enseigne": "U express",
  "magasin_id": "37966",
  "date": "2025-12-31",
  "heure": "12:07:56",
  "produits": [
    {
      "nom": "CHIPS",
      "quantite": 1,
      "prix_unitaire": 1.87,
      "prix_total": 1.87,
      "tva_pct": 0,
      "categorie": "Épicerie"
    },
    {
      "nom": "CIDRE",
      "quantite": 2,
      "prix_unitaire": 3.54,
      "prix_total": 7.08,
      "tva_pct": 13,
      "categorie": "Boissons"
    }
  ],
  "total_ttc": 8.95,
  "notes": "Observation du 31 décembre 2025"
}
```

**Note** : Les champs `id`, `created_at`, `source`, `fiabilite` et `verifie` sont auto-générés.

### 2. Ajouter l'observation

```bash
npm run observations:add chemin/vers/mon-observation.json
```

Le script va :
- ✅ Valider les données
- ✅ Générer un ID unique
- ✅ Ajouter l'horodatage
- ✅ Enregistrer dans `data/observations/`
- ✅ Régénérer l'index automatiquement
- ✅ Synchroniser vers `public/data/observations/`

### 3. Régénérer l'index manuellement (optionnel)

Si besoin de régénérer l'index sans ajouter d'observation :

```bash
npm run observations:generate
```

### 4. Visualiser

Ouvrez `/observatoire.html` dans votre navigateur ou déployez pour voir les observations publiées.

## 📝 Champs requis

### Observation

| Champ | Type | Requis | Description | Exemple |
|-------|------|--------|-------------|---------|
| `territoire` | string | ✅ | Territoire DROM-COM | `"Guadeloupe"` |
| `commune` | string | ✅ | Commune de l'observation | `"Morne-à-l'Eau"` |
| `enseigne` | string | ✅ | Nom de l'enseigne | `"U express"` |
| `magasin_id` | string | ❌ | ID du magasin (si sur ticket) | `"37966"` |
| `date` | string | ✅ | Date d'achat (YYYY-MM-DD) | `"2025-12-31"` |
| `heure` | string | ✅ | Heure d'achat (HH:MM:SS) | `"12:07:56"` |
| `produits` | array | ✅ | Liste des produits | `[...]` |
| `total_ttc` | number | ✅ | Montant total TTC | `11.16` |
| `notes` | string | ❌ | Commentaires libres | `"Observation du..."` |

### Produit

| Champ | Type | Requis | Description | Exemple |
|-------|------|--------|-------------|---------|
| `nom` | string | ✅ | Nom du produit | `"CHIPS"` |
| `quantite` | number | ✅ | Quantité achetée | `1` |
| `prix_unitaire` | number | ✅ | Prix unitaire en € | `1.87` |
| `prix_total` | number | ✅ | Prix total (prix × qté) | `1.87` |
| `tva_pct` | number | ✅ | Taux de TVA (0-100) | `0` |
| `categorie` | string | ❌ | Catégorie du produit | `"Épicerie"` |
| `ean` | string | ❌ | Code-barres EAN/GTIN | `"3560070123456"` |

## 🏝️ Territoires valides

Les territoires DROM-COM acceptés sont :
- Guadeloupe
- Martinique
- Guyane
- La Réunion
- Mayotte
- Saint-Pierre-et-Miquelon
- Saint-Barthélemy
- Saint-Martin
- Wallis-et-Futuna
- Polynésie française
- Nouvelle-Calédonie

## ⚠️ Validation

Le script valide automatiquement :
- ✅ Format des dates et heures
- ✅ Cohérence des prix (positifs, non nuls)
- ✅ Structure des produits
- ✅ Territoire dans la liste autorisée
- ✅ Tous les champs requis présents

En cas d'erreur, le script affiche les problèmes détectés :

```
Validation errors:
  - Field "date" must be in YYYY-MM-DD format
  - Product 2: Product "prix_unitaire" must be a non-negative number
```

## 🗂️ Structure des fichiers

```
data/observations/
├── .gitkeep                              # Garde le dossier
├── index.json                            # Index trié (desc par date)
└── 2025-12-31-120756-uexpress-morne.json # Observation individuelle

public/data/observations/
├── index.json                            # Copie synchronisée
└── 2025-12-31-120756-uexpress-morne.json # Copie synchronisée
```

## 🔐 Sécurité et vie privée

- ❌ **Aucune donnée personnelle** collectée
- ✅ Seules les informations commerciales publiques
- ✅ Pas de numéro de carte, nom du client, etc.
- ✅ Géolocalisation large (commune uniquement)

## 📖 Documentation complète

Pour plus de détails sur la méthodologie, consultez :
- [METHODOLOGY_TICKETS.md](/docs/METHODOLOGY_TICKETS.md) - Méthodologie complète
- [observation.ts](/src/schemas/observation.ts) - Schéma TypeScript

## 🤝 Contribuer

1. Ajoutez vos observations via Pull Request
2. Utilisez le script `observations:add` pour validation
3. Incluez une copie du ticket (photo) dans le PR si possible
4. Attendez la validation manuelle (`verifie: true`)

## 🛠️ Scripts disponibles

| Script | Commande | Description |
|--------|----------|-------------|
| Ajouter | `npm run observations:add <file>` | Ajoute et valide une observation |
| Générer | `npm run observations:generate` | Régénère l'index et synchronise |
| Build | `npm run build` | Compile le site complet |

## ❓ FAQ

### Q: Puis-je modifier une observation existante ?
A: Oui, éditez directement le fichier JSON puis lancez `npm run observations:generate`.

### Q: Comment supprimer une observation ?
A: Supprimez le fichier JSON correspondant puis lancez `npm run observations:generate`.

### Q: Le magasin_id est-il obligatoire ?
A: Non, c'est optionnel. Ajoutez-le seulement s'il apparaît sur le ticket.

### Q: Quelle différence entre `prix_total` et `total_ttc` ?
A: `prix_total` est le prix d'un produit × quantité. `total_ttc` est la somme totale du ticket.

### Q: Puis-je ajouter plusieurs observations en une fois ?
A: Oui, lancez `npm run observations:add` plusieurs fois, l'index se régénère automatiquement.

## 📞 Support

- GitHub Issues : [teetee971/akiprisaye-web/issues](https://github.com/teetee971/akiprisaye-web/issues)
- Documentation : [/docs](/docs)

---

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2025
