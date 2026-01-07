# Méthodologie : Observations basées sur tickets de caisse

## À propos de A KI PRI SA YÉ

**A KI PRI SA YÉ** est un observatoire public des prix en Outre-mer, alimenté par les citoyens eux-mêmes. Notre mission est de rendre visible et traçable l'évolution des prix réels payés par les habitants des territoires ultramarins.

## Source des données : Tickets de caisse citoyens

### Principe

Les observations de prix présentées sur cet observatoire sont basées sur des **tickets de caisse physiques** fournis par des citoyens. Ces tickets constituent une **preuve matérielle** du prix réellement payé à une date et un lieu précis.

### Pourquoi les tickets de caisse ?

1. **Preuve physique** : Un ticket de caisse est un document officiel émis par le commerçant
2. **Traçabilité complète** : Date, heure, enseigne, produits et prix sont tous présents
3. **Fiabilité maximale** : Contrairement aux déclarations orales, le ticket ne peut être contesté
4. **Transparence** : Les données peuvent être vérifiées et recoupées

### Processus de collecte

1. **Contribution citoyenne** : Les habitants photographient leurs tickets de caisse
2. **Vérification manuelle** : Chaque ticket est vérifié avant ingestion
3. **Saisie des données** : Les informations sont extraites et structurées selon notre schéma strict
4. **Publication** : Les observations sont publiées sur l'observatoire public

## Limites méthodologiques

### Ce que nous NE faisons PAS

- ❌ **Pas d'API temps réel** : Les données ne sont pas mises à jour automatiquement
- ❌ **Pas de scraping** : Nous ne récupérons pas les prix depuis les sites web des enseignes
- ❌ **Pas d'estimation** : Nous ne publions que les prix réellement observés et prouvés
- ❌ **Pas d'exhaustivité** : Nous dépendons des contributions citoyennes

### Ce que nous GARANTISSONS

- ✅ **Authenticité** : Chaque observation est basée sur un ticket réel
- ✅ **Traçabilité** : Source, date, lieu et heure sont toujours documentés
- ✅ **Transparence** : Notre méthodologie est publique et documentée
- ✅ **Exactitude** : Les prix publiés correspondent exactement aux tickets

## Schéma des données

Chaque observation respecte un schéma strict incluant :

### Champs obligatoires

- **id** : Identifiant unique de l'observation
- **territoire** : Territoire ultramarin (ex: Guadeloupe, Martinique, etc.)
- **commune** : Commune précise de l'observation
- **enseigne** : Nom de l'enseigne commerciale
- **date** : Date de l'achat (YYYY-MM-DD)
- **heure** : Heure précise de l'achat (HH:MM:SS)
- **produits** : Liste des produits avec quantité, prix unitaire et prix total
- **total_ttc** : Montant total TTC du ticket
- **source** : Toujours `ticket_caisse`
- **fiabilite** : Toujours `preuve_physique`
- **verifie** : Statut de vérification (boolean)
- **created_at** : Timestamp de création de l'observation (ISO 8601)

### Champs optionnels

- **magasin_id** : Identifiant du magasin si disponible
- **tva_pct** : Taux de TVA par produit (si lisible sur le ticket)
- **categorie** : Catégorie du produit
- **ean** : Code-barres EAN/GTIN du produit

## Ingestion des observations

### Pour les contributeurs

Les citoyens souhaitant contribuer peuvent :

1. Photographier leurs tickets de caisse
2. Nous les transmettre via notre formulaire de contact
3. Nous nous chargeons de l'extraction et de la vérification

### Pour les développeurs et institutions

L'ingestion technique se fait via des scripts Node.js fournis dans le dépôt :

#### Ajout d'une observation

```bash
npm run observations:add <fichier-observation.json>
```

Le fichier JSON doit respecter le schéma suivant (minimum) :

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
      "nom": "CHIPS SAVEUR",
      "quantite": 1,
      "prix_unitaire": 1.87,
      "prix_total": 1.87,
      "tva_pct": 0
    },
    {
      "nom": "CIDRE BRUT",
      "quantite": 2,
      "prix_unitaire": 3.54,
      "prix_total": 7.08,
      "tva_pct": 13
    }
  ],
  "total_ttc": 11.16
}
```

Le script :
- Valide le format et les données
- Génère automatiquement un `id` unique
- Ajoute un `created_at` (timestamp actuel)
- Définit `source`, `fiabilite` et `verifie=false`
- Sauvegarde dans `data/observations/<id>.json`
- Régénère l'index trié `data/observations/index.json`

#### Régénération de l'index

```bash
npm run observations:generate
```

Ce script :
- Scanne tous les fichiers `data/observations/*.json`
- Charge et valide chaque observation
- Trie par `created_at` (décroissant : plus récent en premier)
- Écrit `data/observations/index.json`

## Respect de la vie privée

### Anonymisation

- Les tickets de caisse peuvent contenir des informations personnelles (numéro de carte, etc.)
- **Nous ne publions JAMAIS ces informations**
- Seules les données de prix et de localisation sont extraites

### Données collectées

Les observations publiées contiennent uniquement :
- Territoire et commune (géolocalisation large)
- Enseigne et éventuellement identifiant magasin
- Date et heure
- Liste de produits et prix
- Total TTC

**Aucune donnée personnelle** (nom, email, carte bancaire, etc.) n'est incluse.

## Utilisation des données

### Licence

Les données de l'observatoire sont publiées sous licence ouverte permettant :
- Consultation libre
- Réutilisation avec attribution
- Analyse et recherche

### Attribution

Toute réutilisation doit mentionner :
```
Source : A KI PRI SA YÉ - Observatoire citoyen des prix en Outre-mer
```

## Contribution et amélioration

### Comment contribuer ?

1. **Envoyez vos tickets** : Photographiez vos tickets de caisse et transmettez-les nous
2. **Signalez des erreurs** : Si vous constatez une erreur, contactez-nous
3. **Proposez des améliorations** : Ce projet est open source, vos suggestions sont les bienvenues

### Contact

- **Site web** : https://akiprisaye.fr
- **Email** : contact@akiprisaye.fr
- **GitHub** : https://github.com/teetee971/akiprisaye-web

## Avertissements

### Représentativité

Les observations publiées représentent des achats **réels** mais **ne constituent pas un échantillon statistiquement représentatif** de tous les prix pratiqués dans les territoires. Elles dépendent :
- Du nombre de contributeurs
- De leur localisation géographique
- De leurs habitudes d'achat

### Variations de prix

Les prix observés peuvent varier selon :
- La date (promotions, saisonnalité)
- Le magasin (politique tarifaire)
- Le format ou la marque du produit

### Utilisation des données

Ces données sont fournies **à titre informatif**. Pour des analyses statistiques rigoureuses, nous recommandons de croiser ces observations avec d'autres sources officielles.

---

**Dernière mise à jour** : Janvier 2026  
**Version** : 1.0
