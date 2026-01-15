# STRATÉGIE DONNÉES RÉELLES
## A KI PRI SA YÉ – Charte des Données et Politique Anti-Simulation

**Version:** 1.0  
**Date de publication:** 13 janvier 2026  
**Statut:** Document de référence contraignant

---

## PRÉAMBULE

### Engagement fondamental

**A KI PRI SA YÉ** s'engage solennellement à n'afficher que des **données réelles, traçables, datées et vérifiables**. Aucun prix simulé, estimé, extrapolé ou inventé ne sera jamais publié.

### Pourquoi ce document ?

La crédibilité d'un observatoire public repose sur la **qualité et l'authenticité** de ses données. Toute simulation, même bien intentionnée, compromettrait irrémédiablement la confiance institutionnelle et citoyenne.

### Principe directeur

> **Si une donnée n'existe pas, elle n'est pas affichée.**  
> **Mieux vaut une absence documentée qu'une estimation déguisée.**

---

## 1️⃣ TYPOLOGIE OFFICIELLE DES SOURCES DE DONNÉES

### ✅ Sources autorisées

#### 🧾 1. Relevés citoyens vérifiés

**Description :**  
Tickets de caisse ou photos de rayons soumis par des citoyens contributeurs.

**Processus de validation :**
- Photo lisible avec prix visible
- Date et lieu identifiables
- Vérification manuelle par modération
- Horodatage automatique de la contribution

**Traçabilité :**
- Identifiant unique de contribution
- Date et heure de capture
- Territoire d'origine
- Statut : "En attente" / "Validé" / "Rejeté"

**Limites assumées :**
- Couverture inégale selon participation citoyenne
- Possible biais de sélection (produits plus souvent photographiés)

---

#### 🏪 2. Observations terrain validées

**Description :**  
Relevés effectués par des agents de terrain, bénévoles encadrés ou partenaires institutionnels.

**Processus de validation :**
- Protocole de relevé standardisé
- Identité de l'observateur déclarée
- Date et heure obligatoires
- Géolocalisation précise

**Traçabilité :**
- Nom ou identifiant de l'observateur
- Méthode de relevé documentée
- Support photo ou scan (recommandé)

**Limites assumées :**
- Coût et temps nécessaires
- Couverture limitée aux zones accessibles

---

#### 📊 3. Données publiques officielles

**Description :**  
Données issues d'organismes publics reconnus (INSEE, observatoires des prix, collectivités territoriales).

**Sources acceptées :**
- INSEE (indices, paniers de référence)
- Observatoires locaux des prix (Guadeloupe, Martinique, Réunion, etc.)
- Publications officielles de collectivités
- Études publiques accessibles en open data

**Traçabilité :**
- Source exacte citée (nom, date, lien)
- Fréquence de mise à jour connue
- Périmètre géographique précisé

**Limites assumées :**
- Délais de publication (souvent plusieurs mois)
- Agrégations parfois larges (catégories générales)

---

#### 🧮 4. Calculs dérivés transparents

**Description :**  
Indicateurs calculés à partir des données primaires (moyennes, médianes, évolutions).

**Conditions strictes :**
- Algorithme de calcul publié
- Données sources identifiées
- Nombre d'observations utilisé affiché
- Méthodologie documentée

**Exemples autorisés :**
- Moyenne des prix observés sur 30 jours
- Médiane des prix par territoire
- Écart-type (dispersion)
- Taux de variation temporelle

**Limites assumées :**
- Sensibilité aux valeurs extrêmes
- Représentativité statistique non garantie

---

### ❌ Sources strictement interdites

#### ❌ 1. Prix estimés ou modélisés

**Interdit :**
- "Prix probable"
- "Estimation basée sur..."
- Prédictions non étiquetées clairement
- Extrapolations non documentées

**Raison :** Confusion entre observation et hypothèse.

---

#### ❌ 2. Prix "probables" sans données

**Interdit :**
- "D'après notre algorithme, le prix devrait être..."
- "Prix similaires dans d'autres territoires suggèrent..."
- Toute formulation ambiguë

**Raison :** Risque de désinformation involontaire.

---

#### ❌ 3. Données copiées de métropole

**Interdit :**
- Appliquer un prix métropole + coefficient DOM
- "Ajuster" un prix métropole pour le DOM
- Extrapoler à partir de ratios généraux

**Raison :** Chaque territoire a ses spécificités. Aucune extrapolation mécanique n'est fiable.

---

#### ❌ 4. Scraping commercial opaque

**Interdit :**
- Scraping de sites e-commerce sans accord explicite
- Collecte automatisée non documentée
- Données dont la source ne peut être citée publiquement

**Raison :** Risque juridique et opacité inacceptable pour un service public.

---

## 2️⃣ PIPELINE DE DONNÉES RÉELLES

### Schéma général

```
┌─────────────┐
│  CAPTURE    │  Ticket, photo, saisie manuelle
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ VALIDATION  │  Vérification humaine ou automatique avec seuil
└──────┬──────┘
       │
       ▼
┌─────────────┐
│NORMALISATION│  Format unifié, unités cohérentes
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ AGRÉGATION  │  Calculs statistiques documentés
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PUBLICATION │  Affichage avec métadonnées complètes
└─────────────┘
```

### Étape 1 : Capture

**Méthodes :**
- Upload photo de ticket (OCR)
- Saisie manuelle formulaire
- Photo rayon (scan EAN + prix)
- Import fichier (CSV, Excel) pour partenaires

**Données minimales obligatoires :**
- Produit (nom ou EAN)
- Prix (TTC)
- Date d'observation
- Lieu (territoire + enseigne si possible)

**Rejet immédiat si :**
- Données incomplètes
- Photo illisible
- Date absurde (futur ou trop ancienne)

---

### Étape 2 : Validation

**Validation automatique (score de confiance) :**
- OCR : Seuil de confiance ≥ 85%
- Cohérence : Prix dans fourchette attendue (pas de 0,01€ ni 999€ aberrant)
- Format : EAN valide, date ISO

**Validation humaine légère (modération) :**
- Vérification visuelle rapide
- Rejet des contributions manifestement erronées
- Validation manuelle si score OCR < 85%

**Critères de rejet :**
- Prix manifestement aberrant
- Photo floue ou tronquée
- Doublon exact (même produit, même lieu, même jour, même contributeur)
- Suspicion de fraude (multiples contributions identiques suspectes)

---

### Étape 3 : Normalisation

**Unification format :**
- Prix : Euros TTC avec 2 décimales
- Date : Format ISO 8601 (YYYY-MM-DD)
- Territoire : Code standard (GP, MQ, GF, RE, YT)
- Produit : EAN13 si disponible + nom normalisé

**Enrichissement :**
- Catégorie produit (automatique via base EAN)
- Enseigne (normalisation nom : "Carrefour" = "CARREFOUR")
- Géolocalisation (si consentement utilisateur)

---

### Étape 4 : Agrégation

**Calculs statistiques autorisés :**
- **Moyenne arithmétique** : Prix moyen sur période donnée
- **Médiane** : Prix médian (robuste aux valeurs extrêmes)
- **Minimum / Maximum** : Fourchette observée
- **Écart-type** : Dispersion des prix

**Règle de publication :**
- Nombre d'observations (N) toujours affiché
- Si N < seuil minimal → Pas de publication ou flag "Données partielles"

**Pondération interdite :**
- Aucune pondération cachée par enseigne, volume, etc.
- Toutes les observations validées ont le même poids

---

### Étape 5 : Publication

**Affichage obligatoire :**
- Prix (valeur calculée)
- Métadonnées complètes (voir section 5)
- Drapeaux de qualité (voir section 8)
- Source et méthode de calcul

**Mise à jour :**
- Quotidienne pour données citoyennes
- Selon calendrier pour données officielles
- Date de dernière mise à jour affichée

---

## 3️⃣ POLITIQUE ANTI-SIMULATION (Clause Forte)

### Règle absolue

> **Si une donnée n'existe pas réellement, elle n'est pas affichée.**  
> **Aucune estimation. Aucune extrapolation. Aucune simulation.**

### Conséquences pratiques

**Cas 1 : Produit sans observation**
- ❌ Ne pas afficher : "Prix estimé : 3,50€"
- ✅ Afficher : "Aucune observation pour ce produit dans ce territoire"
- ✅ Proposer : "Contribuer une observation"

**Cas 2 : Territoire non couvert**
- ❌ Ne pas afficher : "Prix similaire à la Martinique"
- ✅ Afficher : "Territoire non couvert actuellement"
- ✅ Informer : "Déploiement prévu : [date]" si applicable

**Cas 3 : Données insuffisantes**
- ❌ Ne pas afficher : Un prix calculé sur 1 seule observation
- ✅ Afficher : "⚠️ Données partielles (1 observation) – Prudence d'interprétation"
- ✅ Seuil : Minimum 3 observations pour publication standard

**Cas 4 : Période sans données**
- ❌ Ne pas afficher : Ligne continue sur graphique par interpolation
- ✅ Afficher : Rupture visible sur graphique
- ✅ Légende : "Pas d'observation entre [date1] et [date2]"

---

### Formulations autorisées pour absence de données

**Messages standards :**

```
🔵 "Données en cours de collecte"
🔵 "Observations insuffisantes pour ce produit"
🔵 "Territoire non couvert à ce jour"
🔵 "Historique incomplet (observations ponctuelles)"
🔵 "Donnée partielle (N < seuil minimal)"
```

**Messages interdits :**

```
❌ "Prix estimé à..."
❌ "Probablement autour de..."
❌ "D'après nos calculs..."
❌ "Prix similaire à..."
❌ "Approximativement..."
```

---

### Engagement de transparence

**A KI PRI SA YÉ** s'engage à :
- ✅ Préférer l'absence de donnée à une donnée douteuse
- ✅ Documenter systématiquement les limites de couverture
- ✅ Ne jamais masquer les trous dans les données
- ✅ Corriger publiquement toute erreur identifiée

---

## 4️⃣ SEUILS MINIMAUX DE PUBLICATION

### Principe général

Un seuil minimal d'observations est requis avant publication pour éviter :
- Les généralisations abusives à partir d'un cas isolé
- Les biais de sélection non détectés
- Les erreurs de saisie non identifiées

---

### Seuils recommandés

#### Produit individuel

**Seuil minimal : 3 observations**

- 1 observation → ❌ Non publié (ou flag "Observation unique")
- 2 observations → ⚠️ "Données très partielles"
- 3+ observations → ✅ Publication avec N affiché

**Raison :** Une seule observation peut être une erreur ou une promotion temporaire.

---

#### Enseigne (magasin)

**Seuil minimal : 5 tickets ou contributions**

- < 5 contributions → ❌ Non publié ou "Données insuffisantes"
- 5-9 contributions → ⚠️ "Échantillon limité"
- 10+ contributions → ✅ Publication standard

**Raison :** Un magasin ne peut être caractérisé par 1 ou 2 tickets isolés.

---

#### Territoire

**Seuil minimal : 10 points de collecte distincts**

- < 10 points → ❌ "Territoire en déploiement"
- 10-19 points → ⚠️ "Couverture partielle"
- 20+ points → ✅ "Couverture acceptable"

**Raison :** Un territoire ne peut être documenté par quelques magasins d'une seule ville.

---

#### Historique temporel

**Seuil minimal : 30 jours de données**

- < 30 jours → ❌ "Historique insuffisant"
- 30-89 jours → ⚠️ "Historique court terme"
- 90+ jours → ✅ "Historique moyen terme"
- 365+ jours → ✅✅ "Historique long terme"

**Raison :** Une tendance ne peut être établie sur quelques jours.

---

### Drapeaux selon seuils

| Critère | Seuil | Drapeau | Affichage |
|---------|-------|---------|-----------|
| N observations | < 3 | 🔴 | "Donnée insuffisante" |
| N observations | 3-9 | 🟡 | "Donnée partielle" |
| N observations | 10+ | 🟢 | "Donnée robuste" |
| Points de collecte | < 10 | 🔴 | "Couverture faible" |
| Points de collecte | 10-19 | 🟡 | "Couverture partielle" |
| Points de collecte | 20+ | 🟢 | "Couverture acceptable" |

---

### Exception : Données officielles

Les données issues d'organismes publics (INSEE, observatoires) ne sont **pas soumises aux seuils minimaux** mais doivent être clairement identifiées comme telles :

```
📊 Source : INSEE - Indice des prix à la consommation
📅 Date : Trimestre 3 2025
⚠️ Méthodologie différente des observations citoyennes
```

---

## 5️⃣ MÉTADONNÉES OBLIGATOIRES

### Principe de transparence totale

**Chaque prix affiché doit être accompagné de métadonnées complètes** permettant à l'utilisateur d'évaluer la fiabilité et la pertinence de la donnée.

---

### Métadonnées minimales obligatoires

#### 📍 1. Territoire

**Obligatoire :**
- Code territoire (GP, MQ, GF, RE, YT, etc.)
- Nom territoire complet ("Guadeloupe")
- Commune ou zone si pertinent

**Affichage :**
```
📍 Guadeloupe (GP) - Pointe-à-Pitre
```

---

#### 🏪 2. Enseigne

**Obligatoire si disponible :**
- Nom enseigne standardisé
- Localisation précise (ville/quartier)

**Affichage si connu :**
```
🏪 Carrefour - Jarry
```

**Affichage si inconnu :**
```
🏪 Enseigne non spécifiée
```

---

#### 📅 3. Date d'observation

**Obligatoire :**
- Date exacte de l'observation
- OU période d'agrégation (ex : "Semaine du 8 au 14 janvier 2026")

**Affichage :**
```
📅 Observé le 13/01/2026
```

OU

```
📅 Moyenne sur 7 jours (08/01 - 14/01/2026)
```

---

#### 🔢 4. Nombre d'observations (N)

**Obligatoire pour calculs agrégés :**
- Nombre total d'observations utilisées
- Nombre de points de collecte distincts si pertinent

**Affichage :**
```
🔢 Basé sur 12 observations (5 magasins)
```

---

#### 🧠 5. Méthode de calcul

**Obligatoire pour calculs dérivés :**
- Moyenne arithmétique
- Médiane
- Minimum / Maximum
- Observation brute (ticket unique)

**Affichage :**
```
🧠 Médiane des prix observés
```

OU

```
🧠 Observation unique (ticket validé)
```

---

### Métadonnées recommandées (optionnelles)

- **Conditionnement :** "1L", "500g", "pack de 6"
- **Promotion :** Flag si prix promotionnel détecté
- **Score de confiance OCR :** Si issu d'OCR (ex : 92%)
- **Dernière mise à jour :** Si donnée ancienne (> 30 jours)

---

### Exemple complet d'affichage

```
┌─────────────────────────────────────────┐
│ Lait UHT demi-écrémé 1L                │
│                                         │
│ 1,89 €                                  │
│                                         │
│ 📍 Guadeloupe (GP) - Pointe-à-Pitre   │
│ 🏪 Carrefour - Jarry                   │
│ 📅 Moyenne sur 7 jours (08-14/01/2026)│
│ 🔢 12 observations (5 magasins)        │
│ 🧠 Médiane des prix observés           │
│ 🟢 Donnée robuste                       │
│                                         │
│ ⓘ Méthodologie détaillée               │
└─────────────────────────────────────────┘
```

---

## 6️⃣ RÈGLES SPÉCIFIQUES DOM (Territoires d'Outre-Mer)

### Principe fondamental

**Les prix DOM ne peuvent être déduits, extrapolés ou "ajustés" à partir des prix métropole.**  
Chaque territoire a ses spécificités logistiques, fiscales et économiques.

---

### ❌ Interdictions strictes pour les DOM

#### ❌ 1. Copier prix métropole

**Interdit :**
```javascript
// Code interdit
const prixDOM = prixMetropole * 1.4; // ❌
```

**Raison :** Chaque produit a un surcoût différent selon :
- Le transport (maritime, aérien)
- L'octroi de mer (variable selon produits)
- La structure de marché locale
- Les contraintes logistiques spécifiques

---

#### ❌ 2. Ajuster via indices généraux

**Interdit :**
```javascript
// Code interdit
const prixGuadeloupe = prixParis * coefficientINSEE; // ❌
```

**Raison :** Les indices généraux (IPC, etc.) sont des moyennes agrégées. Ils ne s'appliquent pas produit par produit.

---

#### ❌ 3. "Corriger" pour inflation supposée

**Interdit :**
```javascript
// Code interdit
const prixActuel = prixAncien * (1 + tauxInflationEstimé); // ❌
```

**Raison :** L'inflation varie fortement selon les produits et les territoires. Aucune correction automatique n'est fiable.

---

### ✅ Pratiques autorisées pour les DOM

#### ✅ 1. Comparer DOM ↔ DOM

**Autorisé :**
- Comparer prix Guadeloupe vs Martinique (si données réelles des deux côtés)
- Afficher écarts entre territoires DOM
- Identifier produits les plus chers/moins chers par territoire

**Condition :** Données réelles des deux territoires, même méthodologie.

---

#### ✅ 2. Afficher écart observé, pas justifié

**Autorisé :**
```
Prix observé Guadeloupe : 3,50€
Prix observé Métropole : 2,80€
Écart constaté : +25%
```

**Interdit :**
```
❌ "Cet écart est dû à l'octroi de mer"
❌ "Le transport explique cette différence"
```

**Raison :** L'observatoire observe, il n'explique pas (sauf documentation séparée pédagogique).

---

#### ✅ 3. Documenter contraintes logistiques séparément

**Autorisé :**
- Page éducative : "Pourquoi les prix sont-ils différents dans les DOM ?"
- Explication facteurs généraux (transport, fiscalité, marchés)
- Contexte pédagogique

**Condition :** Séparation claire entre :
- **Observation** (prix affichés)
- **Éducation** (contexte général, sans lien direct prix-à-prix)

---

### Cas particulier : Comparaison DOM/Métropole

**Autorisé SI :**
- ✅ Données réelles des deux côtés
- ✅ Même produit (EAN identique idéalement)
- ✅ Période comparable
- ✅ Disclaimer : "Écart observé, non expliqué par l'observatoire"

**Affichage recommandé :**
```
┌─────────────────────────────────────────┐
│ Comparaison : Lait UHT 1L              │
│                                         │
│ 🏝️ Guadeloupe : 1,89€ (12 obs.)       │
│ 🗼 Métropole : 1,45€ (source INSEE)    │
│                                         │
│ Écart constaté : +30,3%                │
│                                         │
│ ⚠️ Cet écart est une observation       │
│    factuelle. Les causes sont multiples│
│    (logistique, fiscalité, marché).    │
│                                         │
│ ℹ️ En savoir plus sur les écarts DOM   │
└─────────────────────────────────────────┘
```

---

## 7️⃣ OCR : USAGE AUTORISÉ UNIQUEMENT

### Principe : OCR = Outil de collecte, PAS preuve absolue

L'OCR (reconnaissance optique de caractères) est un **outil d'aide à la saisie**, pas une source de vérité absolue.

---

### ✅ Rôle autorisé de l'OCR

#### 1. Source brute de données

**Utilisation :**
- Scanner un ticket de caisse
- Extraire lignes de produits + prix
- Pré-remplir formulaire de contribution

**Statut :** Données candidates, en attente de validation.

---

#### 2. Score de confiance affiché

**Obligation :**
- Chaque extraction OCR a un score de confiance (0-100%)
- Score affiché à l'utilisateur
- Si score < 85% → Validation humaine obligatoire

**Affichage :**
```
📄 Ticket scanné
🎯 Confiance OCR : 92%
✅ Validation automatique
```

OU

```
📄 Ticket scanné
⚠️ Confiance OCR : 78%
👤 Vérification manuelle requise
```

---

#### 3. Relecture possible par utilisateur

**Fonctionnalité :**
- Utilisateur peut corriger les erreurs OCR
- Correction enregistrée et améliore le modèle
- Historique des corrections conservé

---

#### 4. Jamais décision automatique critique

**Interdit :**
- Publier automatiquement un prix OCR sans validation si score < seuil
- Prendre une décision algorithmique basée uniquement sur OCR faible confiance
- Considérer l'OCR comme "preuve" juridique

**Autorisé :**
- OCR haute confiance (≥ 90%) → Validation automatique pour pré-publication
- OCR moyenne confiance (85-89%) → Validation humaine légère
- OCR faible confiance (< 85%) → Correction manuelle obligatoire

---

### Limitations assumées de l'OCR

**A KI PRI SA YÉ** reconnaît que l'OCR peut :
- ❌ Confondre des chiffres (1 et 7, 0 et 8)
- ❌ Mal lire les tickets flous ou abîmés
- ❌ Échouer sur certains formats de tickets
- ❌ Extraire des données incomplètes

**Conséquence :** Aucune décision automatique critique basée sur OCR seul.

---

### Amélioration continue

- Feedback utilisateurs sur erreurs OCR
- Entraînement progressif du modèle
- Tests réguliers de performance
- Transparence sur taux d'erreur actuel

---

## 8️⃣ DRAPEAUX DE QUALITÉ (Visuels)

### Système de signalisation

Pour faciliter la lecture et l'interprétation, chaque donnée est accompagnée d'un **drapeau de qualité** visuel et explicite.

---

### 🟢 Donnée robuste

**Critères :**
- N ≥ 10 observations
- Période ≥ 30 jours
- Plusieurs points de collecte
- Méthodologie documentée

**Affichage :**
```
🟢 Donnée robuste
   Basée sur 15 observations validées
```

**Interprétation :** Confiance élevée dans cette donnée.

---

### 🟡 Donnée partielle

**Critères :**
- 3 ≤ N < 10 observations
- OU Période < 30 jours
- OU Points de collecte limités (< 5)

**Affichage :**
```
🟡 Donnée partielle
   Basée sur 6 observations - Prudence d'interprétation
```

**Interprétation :** Indication utile mais limitée. À compléter.

---

### 🔴 Donnée insuffisante

**Critères :**
- N < 3 observations
- OU Donnée unique non vérifiable
- OU Ancienneté > 90 jours sans mise à jour

**Affichage :**
```
🔴 Donnée insuffisante
   2 observations seulement - Non représentatif
```

**Interprétation :** Donnée affichée à titre indicatif uniquement, non fiable pour décision.

**Option :** Ne pas publier du tout (recommandé).

---

### ⚪ Non disponible

**Critères :**
- Aucune observation pour ce produit/territoire
- Territoire non encore couvert
- Produit non référencé

**Affichage :**
```
⚪ Donnée non disponible
   Aucune observation pour ce produit en Guadeloupe
   
   👉 Contribuer une observation
```

**Interprétation :** Absence de donnée documentée.

---

### Affichage visuel

Les drapeaux sont accompagnés d'explications au survol (tooltip) :

```html
<span class="flag-green" title="Donnée robuste : basée sur 15 observations validées sur 60 jours">
  🟢 Donnée robuste
</span>
```

---

## 9️⃣ JOURNAL PUBLIC DES CORRECTIONS

### Principe de traçabilité

Toute modification, suppression ou recalcul de données publiées fait l'objet d'une **entrée dans un journal public**.

---

### Obligation de transparence

**Pourquoi un journal public ?**
- Garantir l'auditabilité de l'observatoire
- Documenter les erreurs et corrections
- Renforcer la confiance par la transparence
- Permettre un contrôle citoyen et institutionnel

---

### Événements à journaliser

#### 1. Modification de donnée

**Cas :**
- Correction d'un prix erroné
- Changement de territoire/enseigne suite à erreur de saisie
- Mise à jour métadonnées

**Entrée journal :**
```
Date : 2026-01-13 14:32
Type : Modification
Produit : Lait UHT 1L (EAN: 3017620422003)
Avant : 1,99€ (Guadeloupe - Carrefour)
Après : 1,89€ (Guadeloupe - Carrefour)
Raison : Erreur OCR corrigée suite signalement utilisateur
Auteur : Modération (ID: MOD-042)
```

---

#### 2. Suppression de donnée

**Cas :**
- Donnée frauduleuse détectée
- Doublon confirmé
- Donnée aberrante non corrigible

**Entrée journal :**
```
Date : 2026-01-13 15:10
Type : Suppression
Produit : Pain de mie 500g (EAN: 3245678901234)
Prix supprimé : 0,05€
Raison : Prix aberrant - suspicion erreur saisie
Auteur : Modération (ID: MOD-051)
```

---

#### 3. Recalcul d'agrégats

**Cas :**
- Modification algorithme de calcul
- Ajout de nouvelles observations changeant moyenne/médiane
- Correction méthodologique

**Entrée journal :**
```
Date : 2026-01-13 16:45
Type : Recalcul
Produit : Riz blanc 1kg (catégorie)
Territoire : Guadeloupe
Avant : Moyenne 2,45€ (N=8)
Après : Médiane 2,40€ (N=12)
Raison : Passage de moyenne à médiane (plus robuste) + ajout 4 observations
Auteur : Système (version 1.2.0)
```

---

### Format du journal

**Accessible publiquement :**
- Page dédiée : `/journal-corrections`
- Fichier téléchargeable : `corrections_log.csv`
- API lecture seule : `/api/v1/corrections-log`

**Colonnes obligatoires :**
- Date/heure (ISO 8601)
- Type d'événement
- Identifiant produit (EAN si disponible)
- Valeur avant / après
- Raison (texte libre)
- Auteur (anonymisé : "Modération", "Système", "Contributeur XYZ")

---

### Protection des données personnelles

**RGPD :**
- Aucun nom de contributeur citoyen publié
- Identifiants anonymisés
- Aucune donnée personnelle dans le journal public

---

### Fréquence de publication

- **Temps réel** pour modifications manuelles importantes
- **Batch quotidien** pour recalculs automatiques
- **Synthèse mensuelle** publiée en complément

---

## 10️⃣ SYNTHÈSE : DOCUMENTS LIVRABLES

### 📄 1. Charte des données réelles (ce document)

**Contenu :**
- Typologie sources autorisées/interdites
- Pipeline de données
- Politique anti-simulation
- Seuils de publication
- Métadonnées obligatoires

**Statut :** Contraignant, public, auditable.

---

### 📄 2. Politique anti-simulation (section 3)

**Engagement :**
> **Si une donnée n'existe pas, elle n'est pas affichée.**

**Formulations interdites :** Liste exhaustive.

---

### 📄 3. Seuils de publication (section 4)

**Minimums requis :**
- Produit : ≥ 3 observations
- Enseigne : ≥ 5 tickets
- Territoire : ≥ 10 points
- Historique : ≥ 30 jours

---

### 📄 4. Pipeline documenté (section 2)

**Schéma :**
```
Capture → Validation → Normalisation → Agrégation → Publication
```

**Traçabilité :** Chaque étape documentée.

---

### 📄 5. Règles DOM spécifiques (section 6)

**Interdictions strictes :**
- ❌ Copie prix métropole
- ❌ Ajustement via indices
- ❌ Correction inflation supposée

**Autorisation :** Comparaisons factuelles uniquement.

---

### 📄 6. Rôle OCR clarifié (section 7)

**OCR = Outil d'aide, pas preuve.**

**Score de confiance obligatoire.**  
**Validation humaine si score < 85%.**

---

### 📄 7. Drapeaux de qualité (section 8)

**Système visuel :**
- 🟢 Donnée robuste
- 🟡 Donnée partielle
- 🔴 Donnée insuffisante
- ⚪ Non disponible

---

### 📄 8. Journal des corrections (section 9)

**Public, auditable, temps réel.**

**Événements journalisés :**
- Modifications
- Suppressions
- Recalculs

---

## ✅ PROTECTIONS GARANTIES PAR CE DOCUMENT

### 🔐 1. Protection juridique

- Aucune donnée inventée → Pas de désinformation
- Traçabilité totale → Auditabilité
- Métadonnées complètes → Transparence

---

### 🔐 2. Protection scientifique

- Méthodologie documentée → Reproductibilité
- Limites assumées → Honnêteté intellectuelle
- Seuils minimaux → Fiabilité statistique

---

### 🔐 3. Protection médiatique

- Aucune simulation → Pas de "faux chiffres"
- Sources citées → Vérifiable par journalistes
- Journal public → Confiance renforcée

---

### 🔐 4. Protection institutionnelle

- Conformité observatoire public → Crédibilité
- Politique anti-dérive → Prévisibilité
- Auditabilité externe → Légitimité

---

## CONCLUSION

**A KI PRI SA YÉ** s'engage à respecter scrupuleusement cette **Charte des Données Réelles**.

### Engagement solennel

> **Nous n'afficherons jamais un prix qui n'a pas été réellement observé.**  
> **Mieux vaut une absence documentée qu'une estimation déguisée.**

### Audit et contrôle

Cette charte est **auditable** par toute partie prenante légitime :
- Collectivités territoriales
- Services de l'État (DGCCRF, observatoires)
- Chercheurs
- Associations de consommateurs
- Presse

### Révision

Ce document peut être amendé, mais uniquement :
- Après consultation publique (30 jours)
- Avec justification documentée
- Sans affaiblir les protections existantes

---

**Adoption :** 13 janvier 2026  
**Statut :** **CONTRAIGNANT**  
**Prochaine révision :** Décembre 2026

---

**Version :** 1.0  
**Dépôt public :** https://github.com/teetee971/akiprisaye-web  
**Contact :** Documentation accessible sur le site officiel

---

*Fin du document – Charte des Données Réelles*
