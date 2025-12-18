# Sources de Données Officielles – A KI PRI SA YÉ

## 🎯 Principe Fondamental

**AUCUNE donnée inventée. UNIQUEMENT des sources publiques officielles.**

Toute donnée affichée sur A KI PRI SA YÉ provient exclusivement d'organismes publics français ou européens reconnus.

---

## ✅ SOURCES AUTORISÉES

### 1. INSEE (Institut National de la Statistique et des Études Économiques)

**Site officiel** : [https://www.insee.fr](https://www.insee.fr)

#### Données utilisées :
- **Indice des Prix à la Consommation (IPC)**
  - Fréquence : Mensuelle
  - Couverture : France métropolitaine + DOM
  - URL API : `https://api.insee.fr/series/BDM`
  - Licence : Licence Ouverte 2.0 (Etalab)

- **Comparaison des prix DOM-Métropole**
  - Publication annuelle (IEVR - Indice d'Écart de niveau de Vie en lieux de Résidence)
  - Territoires : Guadeloupe, Martinique, Guyane, La Réunion, Mayotte
  - Source : Enquêtes de comparaison spatiale des prix

- **Données démographiques**
  - Recensement de la population
  - Niveaux de vie par territoire
  - Composition des ménages

#### Limitations connues :
- ⚠️ Fréquence mensuelle (pas de suivi quotidien)
- ⚠️ Délai de publication : 2-3 mois après collecte
- ⚠️ Couverture partielle des COM (données moins fréquentes)
- ⚠️ Moyennes nationales/régionales (pas de détail par magasin)

---

### 2. OPMR (Observatoire des Prix, des Marges et des Revenus)

**Sites officiels** :
- Guadeloupe : [http://www.guadeloupe.gouv.fr/opmr](http://www.guadeloupe.gouv.fr/opmr)
- Martinique : [http://www.martinique.gouv.fr/opmr](http://www.martinique.gouv.fr/opmr)
- Guyane : [http://www.guyane.gouv.fr/opmr](http://www.guyane.gouv.fr/opmr)
- La Réunion : [http://www.reunion.gouv.fr/opmr](http://www.reunion.gouv.fr/opmr)
- Mayotte : [http://www.mayotte.gouv.fr/opmr](http://www.mayotte.gouv.fr/opmr)

#### Données utilisées :
- **Enquêtes de prix**
  - Paniers de produits de consommation courante
  - Comparaison entre enseignes
  - Évolution mensuelle des prix

- **Bulletins trimestriels**
  - Analyse sectorielle (alimentaire, carburants, etc.)
  - Marges de distribution
  - Coût du fret

- **Études spécifiques**
  - Prix du carburant
  - Panier de la ménagère
  - Produits de première nécessité

#### Limitations connues :
- ⚠️ Fréquence : Mensuelle à trimestrielle
- ⚠️ Couverture : Principalement DROM (peu de données COM)
- ⚠️ Échantillon limité de produits (100-200 références)
- ⚠️ Pas de données en temps réel
- ⚠️ Format : PDF majoritairement (nécessite extraction manuelle)

---

### 3. DGCCRF (Direction Générale de la Concurrence, de la Consommation et de la Répression des Fraudes)

**Site officiel** : [https://www.economie.gouv.fr/dgccrf](https://www.economie.gouv.fr/dgccrf)

#### Données utilisées :
- **Alertes produits**
  - Rappels de produits dangereux
  - Retraits du marché
  - Non-conformités

- **Enquêtes de conformité**
  - Affichage des prix
  - Pratiques commerciales trompeuses
  - Fraudes détectées

- **RappelConso** : [https://rappel.conso.gouv.fr](https://rappel.conso.gouv.fr)
  - API publique disponible
  - Mise à jour quotidienne
  - Licence : Licence Ouverte 2.0

#### Limitations connues :
- ⚠️ Données orientées contrôle/sanctions (pas exhaustives)
- ⚠️ Pas de suivi systématique des prix
- ⚠️ Informations ponctuelles

---

### 4. data.gouv.fr (Plateforme Ouverte des Données Publiques Françaises)

**Site officiel** : [https://www.data.gouv.fr](https://www.data.gouv.fr)

#### Données utilisées :
- **Datasets utilisés** :
  - Prix des carburants (mise à jour quotidienne)
  - Établissements commerciaux (base SIRENE)
  - Zonages territoriaux (code postal, commune)
  - Données de transport public

- **API disponibles** :
  - API Adresse (géocodage)
  - API Entreprise (pour données établissements)
  - API Sirene (informations légales magasins)

#### Limitations connues :
- ⚠️ Qualité variable selon le dataset
- ⚠️ Fréquence de mise à jour hétérogène
- ⚠️ Couverture géographique inégale

---

### 5. Ministère des Outre-Mer

**Site officiel** : [https://www.outre-mer.gouv.fr](https://www.outre-mer.gouv.fr)

#### Données utilisées :
- **Rapports sur la vie chère**
  - Analyses annuelles
  - Mesures gouvernementales
  - Indicateurs économiques

- **Bouclier qualité prix**
  - Liste des produits concernés
  - Plafonds de prix

#### Limitations connues :
- ⚠️ Publications espacées (annuelles)
- ⚠️ Données agrégées (peu de détail)

---

### 6. CEROM (Comptes Économiques Rapides de l'Outre-Mer)

**Site officiel** : [https://www.cerom-outremer.fr](https://www.cerom-outremer.fr)

#### Données utilisées :
- **Tableaux de bord économiques**
  - PIB par territoire
  - Évolution des prix
  - Taux de chômage
  - Pouvoir d'achat

#### Limitations connues :
- ⚠️ Fréquence : Trimestrielle à annuelle
- ⚠️ Données macro-économiques (peu de détail sur produits)

---

## ❌ SOURCES NON UTILISÉES

Pour garantir la neutralité et l'objectivité, nous **n'utilisons PAS** :

### Interdictions :
- ❌ **Données d'enseignes privées** (sauf si publiées officiellement)
- ❌ **Agrégateurs commerciaux** (Que Choisir, 60 Millions de consommateurs - sauf études publiées)
- ❌ **Crowdsourcing non vérifié** (contributions utilisateurs sans validation)
- ❌ **Web scraping de sites marchands** (illégal sans autorisation)
- ❌ **Données "leaked" ou piratées**
- ❌ **Estimations basées sur IA générative** (ChatGPT, etc.)

### Exception : Données Utilisateurs Opt-In

Les utilisateurs **peuvent volontairement** contribuer :
- Upload de tickets de caisse (avec consentement explicite)
- Signalement de variations de prix (nécessite modération)

**Conditions** :
- ✅ Consentement explicite (RGPD)
- ✅ Anonymisation
- ✅ Modération humaine avant publication
- ✅ Badge "Contribué par utilisateur" visible

---

## 📊 TRAITEMENT DES DONNÉES

### Pipeline de Traitement

```
1. COLLECTE
   ├─ API automatique (si disponible)
   ├─ Extraction PDF (OPMR bulletins)
   └─ Scraping éthique (sites .gouv.fr uniquement, avec respect robots.txt)

2. VALIDATION
   ├─ Vérification source officielle
   ├─ Contrôle de cohérence
   └─ Détection d'anomalies

3. STOCKAGE
   ├─ Base de données PostgreSQL
   ├─ Métadonnées complètes (source, date, territoire)
   └─ Versioning (historique des modifications)

4. AFFICHAGE
   ├─ Composant DataBadge obligatoire
   ├─ Indication des limites méthodologiques
   └─ Date de dernière mise à jour
```

### Fréquence de Mise à Jour

| Source | Collecte | Affichage |
|--------|----------|-----------|
| INSEE (IPC) | Mensuelle | Mensuelle |
| OPMR bulletins | Mensuelle | Mensuelle |
| RappelConso | Quotidienne | Quotidienne |
| Prix carburants | Quotidienne | Quotidienne |
| CEROM | Trimestrielle | Trimestrielle |

---

## 🔍 TRANSPARENCE : COMPOSANT DataBadge

Chaque donnée affichée **DOIT** inclure :

```jsx
<DataBadge 
  source="INSEE"
  date="15/12/2024"
  territory="Martinique"
  limitation="Prix moyens observés, variations possibles selon enseigne"
/>
```

### Affichage utilisateur :

```
📊 Source : INSEE | 15/12/2024 | Martinique
ℹ️  Prix moyens observés, variations possibles selon enseigne
```

---

## 🚨 GESTION DES DONNÉES MANQUANTES

### Si une donnée n'existe pas :

**❌ INTERDIT** :
- Inventer une valeur
- Extrapoler sans source
- Utiliser une moyenne non documentée

**✅ OBLIGATOIRE** :
```
❌ Donnée non disponible pour ce territoire

Raison : [Explication claire]
- L'INSEE ne publie pas ces données pour ce territoire
- Dernière publication : [DATE si applicable]
- Alternative : [Suggestion si applicable]
```

---

## 📈 PRÉDICTIONS DE PRIX

### Méthodologie Statistique Simple

**Données utilisées** :
- Historique INSEE (12-24 mois)
- Saisonnalité observée (OPMR)
- Tendance linéaire (régression simple)

**Modèle** :
- Moyenne mobile sur 3-6 mois
- Détection de tendance (hausse/baisse)
- Pas de machine learning complexe

**Affichage obligatoire** :
```
⚠️ ESTIMATION INDICATIVE
Basée sur historique INSEE (12 mois).
Méthode : Moyenne mobile + tendance.
Pas une garantie. Marge d'erreur : ±15%.
Dernière mise à jour : [DATE]
```

---

## 📞 SIGNALER UNE ERREUR DE SOURCE

Si vous détectez :
- Une donnée incorrecte
- Une source mal citée
- Une mise à jour manquante

**Contact** : sources@akiprisaye.fr

**Délai de traitement** : 48h ouvrées

---

## 📚 DOCUMENTATION TECHNIQUE

### Accès aux APIs

Tous les endpoints utilisés sont documentés :
- `/api/sources` - Liste des sources actives
- `/api/sources/{source_id}/metadata` - Métadonnées d'une source
- `/api/data/{data_id}/provenance` - Traçabilité complète d'une donnée

### Open Source

Le code de collecte et traitement est open source :
- GitHub : [https://github.com/teetee971/akiprisaye-web](https://github.com/teetee971/akiprisaye-web)
- Licence : MIT (code) + CC BY 4.0 (documentation)

---

## 🏛️ CONFORMITÉ LÉGALE

### Licences Respectées

- **Licence Ouverte 2.0** (Etalab) : INSEE, data.gouv.fr
- **Licence ODbL** (Open Database License) : Données géographiques
- **Creative Commons BY-SA** : Certains datasets data.gouv.fr

### Mentions Obligatoires

Toute réutilisation de données A KI PRI SA YÉ doit mentionner :
```
Source : A KI PRI SA YÉ (https://akiprisaye.fr)
Données d'origine : [INSEE/OPMR/DGCCRF/etc.]
Licence : Licence Ouverte 2.0
```

---

## 🔄 ÉVOLUTION

Cette documentation est mise à jour :
- À chaque ajout de source
- En cas de modification méthodologique
- Sur retour utilisateur documenté

**Historique** : Consultable sur GitHub (commits)

---

**Dernière mise à jour** : Décembre 2024  
**Version** : 1.0  
**Contact** : sources@akiprisaye.fr

---

*"Des données publiques, rendues utiles. Rien d'inventé, tout sourcé."*
