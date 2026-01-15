# Méthodologie – Observations de prix basées sur tickets de caisse

## Vue d'ensemble

L'observatoire "A KI PRI SA YÉ" collecte des **prix réels observés** en Outre-mer à partir de **tickets de caisse physiques** fournis par des citoyens. Cette approche garantit la traçabilité et la fiabilité des données.

## 🎯 Objectifs

- **Transparence** : Publier des prix réels vérifiables (date, lieu, enseigne)
- **Participation citoyenne** : Permettre aux citoyens de contribuer avec leurs propres observations
- **Comparabilité** : Faciliter les comparaisons de prix entre territoires et enseignes
- **Archivage** : Constituer un historique des prix dans les DROM-COM

## 📊 Source des données

### Source primaire : Tickets de caisse

Chaque observation provient d'un **ticket de caisse physique** fourni par un citoyen. Le ticket constitue la **preuve physique** du prix observé.

**Informations extraites du ticket :**
- Date et heure de l'achat
- Commune et enseigne
- Identifiant du magasin (si disponible)
- Liste des produits avec quantités et prix unitaires
- Total TTC
- TVA applicable par produit

### Niveau de fiabilité

Toutes les observations sont marquées avec :
- **Source** : `ticket_caisse` (source vérifiable)
- **Fiabilité** : `preuve_physique` (niveau maximal de confiance)
- **Vérification** : `verifie: false` par défaut, devient `true` après validation manuelle

## 🔄 Processus d'ingestion

### 1. Collecte citoyenne

Les citoyens peuvent contribuer en :
1. Prenant en photo leur ticket de caisse
2. Extrayant les informations dans un fichier JSON
3. Soumettant les données via Pull Request ou formulaire dédié

### 2. Validation des données

Chaque observation est validée selon le schéma strict défini dans `src/schemas/observation.ts` :

**Champs obligatoires :**
- `territoire` : Territoire DROM-COM (liste fermée)
- `commune` : Nom de la commune
- `enseigne` : Nom de l'enseigne commerciale
- `date` : Date d'achat (format YYYY-MM-DD)
- `heure` : Heure d'achat (format HH:MM:SS)
- `produits[]` : Liste des produits avec nom, quantité, prix unitaire, prix total, TVA
- `total_ttc` : Montant total TTC du ticket
- `source` : Toujours `"ticket_caisse"`
- `fiabilite` : Toujours `"preuve_physique"`

**Champs optionnels :**
- `magasin_id` : Identifiant du magasin si présent sur le ticket
- `notes` : Commentaires ou précisions

**Champs auto-générés :**
- `id` : Identifiant unique (format: YYYY-MM-DD-HHMMSS-random)
- `created_at` : Horodatage de création (ISO 8601)
- `verifie` : Statut de vérification (false par défaut)

### 3. Stockage

Les observations validées sont stockées sous forme de fichiers JSON individuels :
- Répertoire : `data/observations/`
- Format : `{id}.json` (un fichier par observation)
- Index trié : `data/observations/index.json` (liste complète, triée par date décroissante)

### 4. Publication

Les données sont publiées sur la page `/public/observatoire.html` qui :
- Charge automatiquement l'index des observations
- Affiche les observations en ordre chronologique (plus récent en premier)
- Présente chaque produit avec son prix unitaire et total
- Affiche clairement le badge "Prix réel – ticket de caisse"

## 🛠️ Utilisation des scripts

### Ajouter une observation

```bash
# Préparer un fichier JSON avec les données du ticket
# (sans id, created_at, verifie qui seront auto-générés)

npm run observations:add chemin/vers/observation.json
```

Le script :
1. Lit et valide le fichier JSON
2. Génère automatiquement `id`, `created_at`, et définit `verifie=false`
3. Enregistre l'observation dans `data/observations/{id}.json`
4. Régénère l'index trié

### Régénérer l'index

```bash
npm run observations:generate
```

Le script :
1. Scanne tous les fichiers `*.json` dans `data/observations/` (sauf `index.json`)
2. Charge et parse chaque observation
3. Trie par `created_at` décroissant
4. Écrit `data/observations/index.json`

## 🔒 Respect de la vie privée

### Anonymisation

- **Aucune donnée personnelle** n'est collectée ou stockée
- Les tickets ne contiennent que des informations commerciales publiques
- Aucun numéro de carte bancaire, nom du client ou autre donnée sensible

### Données publiques

Toutes les données publiées sont **non personnelles** :
- Nom de l'enseigne (information publique)
- Commune (géolocalisation large)
- Date et heure (horodatage de la transaction)
- Produits et prix (informations commerciales)

### Magasin ID

L'identifiant du magasin (`magasin_id`) est **optionnel** et provient du ticket lui-même. Il ne permet pas d'identifier une personne, seulement le point de vente.

## ⚠️ Limites et avertissements

### Échantillonnage

- Les observations sont **ponctuelles** et ne constituent pas un relevé exhaustif
- La couverture géographique dépend des contributions citoyennes
- Certains territoires ou enseignes peuvent être sous-représentés

### Pas d'API temps réel

- Ce n'est **pas** un système de scraping ou d'API temps réel
- Les prix évoluent : une observation reflète un prix à un instant T
- Les promotions temporaires peuvent créer des variations

### Pas de comparaison directe avec la métropole

- Les prix en Outre-mer incluent des coûts logistiques spécifiques (octroi de mer, transport maritime/aérien)
- Les comparaisons doivent tenir compte du contexte économique local
- Les produits peuvent différer (marques, conditionnements)

## 📈 Traçabilité

### Audit trail

Chaque observation est **traçable** :
- `id` unique et horodaté
- `created_at` : date de création de l'enregistrement
- `date` et `heure` : moment de l'achat d'origine
- Fichier JSON versionnant l'observation complète

### Vérification a posteriori

Les observations peuvent être vérifiées manuellement :
1. Vérification de la cohérence interne (total = somme des produits)
2. Vérification de la plausibilité (prix dans des fourchettes raisonnables)
3. Validation par recoupement avec d'autres sources si disponibles

Une fois vérifiée, l'observation passe à `verifie: true`.

## 🌐 Open Data

### Licence

Les données de l'observatoire sont publiées sous licence ouverte **Etalab 2.0** :
- Réutilisation libre (commerciale ou non)
- Obligation de mentionner la source : "A KI PRI SA YÉ"
- Obligation de mentionner la date de dernière mise à jour

### Accès aux données

- **Web** : Page publique `/public/observatoire.html`
- **JSON** : Index complet `/data/observations/index.json`
- **Fichiers individuels** : `/data/observations/{id}.json`

### Format standardisé

Le schéma TypeScript strict garantit la cohérence et la réutilisabilité des données.

## 🚀 Évolutions futures

### Contributeurs vérifiés

- Mise en place d'un système de contributeurs de confiance
- Badge "contributeur vérifié" pour les utilisateurs réguliers
- Score de fiabilité basé sur l'historique

### Détection automatique

- OCR automatique des tickets de caisse (en cours)
- Validation semi-automatique avec révision humaine
- Extraction des codes-barres EAN pour enrichissement produit

### Analyse et statistiques

- Calcul de prix moyens par produit, catégorie, territoire
- Détection d'anomalies et d'outliers
- Évolution temporelle des prix
- Comparaisons inter-enseignes

### API publique

- API REST pour interroger les observations
- Filtres par territoire, commune, enseigne, produit
- Agrégations et statistiques

## 📞 Contact

Pour toute question sur la méthodologie ou pour contribuer :
- **GitHub** : [Issues du projet](https://github.com/teetee971/akiprisaye-web/issues)
- **Email** : contact@akiprisaye.fr
- **Documentation** : [/docs](/docs)

---

**Dernière mise à jour** : Janvier 2025  
**Version** : 1.0.0
