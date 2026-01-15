# STRATÉGIE DE COLLECTE RÉELLE DES DONNÉES
## A KI PRI SA YÉ – Sortir Définitivement du "Déclaratif"

**Version:** 1.0  
**Date de publication:** 13 janvier 2026  
**Statut:** Document opérationnel contraignant

---

## PRÉAMBULE

### Engagement fondamental

> **"A KI PRI SA YÉ ne montre que des prix observés.**  
> **Quand la donnée est insuffisante, il le dit."**

Cette stratégie de collecte garantit que **100% des prix affichés** proviennent de sources réelles, traçables et vérifiables.

### Pourquoi ce module est critique

**Sans collecte rigoureuse :**
- ❌ Les classements "Anti-Crise" sont invérifiables
- ❌ Les comparaisons DOM/Métropole sont contestables
- ❌ Les alertes inflation sont inexploitables
- ❌ La crédibilité institutionnelle s'effondre

**Avec collecte rigoureuse :**
- ✅ Chaque prix est traçable
- ✅ Les recoupements valident les données
- ✅ Les institutions peuvent auditer
- ✅ Les citoyens font confiance

---

## 1️⃣ LES 4 CANAUX DE COLLECTE COMPLÉMENTAIRES

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  🟢 Canal A : Relevés Terrain Structurés           │
│     (Qualité élevée, couverture partielle)         │
│                                                     │
│  🟡 Canal B : Contributions Citoyennes             │
│     (Volume élevé, nécessite filtrage)             │
│                                                     │
│  🔵 Canal C : Partenariats Distributeurs           │
│     (Stabilité, négociation lente)                 │
│                                                     │
│  🟣 Canal D : Sources Institutionnelles            │
│     (Légitimité, granularité faible)               │
│                                                     │
└─────────────────────────────────────────────────────┘
           ↓ Recoupement & Validation ↓
┌─────────────────────────────────────────────────────┐
│         PRIX VALIDÉ ET PUBLIÉ                       │
└─────────────────────────────────────────────────────┘
```

---

### 🟢 CANAL A — Relevés Terrain Structurés

#### Description

Relevés de prix effectués par des **personnes formées** selon un **protocole standardisé**.

#### Acteurs possibles

**1. Agents terrain rémunérés**
- Statut : CDD, stage, prestation
- Formation : Protocole de 2 heures
- Zone : Affectation territoriale fixe
- Fréquence : Hebdomadaire ou bi-hebdomadaire

**2. Partenaires institutionnels**
- Collectivités territoriales
- Associations de consommateurs
- Services civiques

**3. Étudiants en projet**
- Universités locales (Antilles, Réunion, Guyane)
- Stages de recherche appliquée
- Projets pédagogiques

**4. Associations citoyennes**
- Associations quartier
- Comités de vigilance prix
- Groupes consommateurs

---

#### Protocole de relevé standardisé

**ÉTAPE 1 : Préparation**
- ✅ Liste de produits prédéfinie (panier de référence)
- ✅ Fiche de relevé numérique ou papier
- ✅ Appareil photo / smartphone chargé
- ✅ Autorisation magasin (si requise)

**ÉTAPE 2 : Relevé in situ**
- ✅ Photo rayon avec prix visible
- ✅ Scan code-barres (EAN13)
- ✅ Note du prix TTC affiché
- ✅ Note du conditionnement (poids, volume)
- ✅ Horodatage automatique
- ✅ Géolocalisation (si consentement)

**ÉTAPE 3 : Saisie structurée**
- ✅ Formulaire web dédié
- ✅ Champs obligatoires (EAN, prix, date, magasin)
- ✅ Upload photo preuve
- ✅ Validation format automatique

**ÉTAPE 4 : Vérification**
- ✅ Relecture par coordinateur
- ✅ Cohérence prix (pas d'aberration)
- ✅ Complétude des métadonnées

---

#### Panier de référence

**Produits prioritaires (50-100 produits) :**
- 🥖 Alimentaire de base (pain, lait, riz, huile, etc.)
- 🧴 Hygiène essentielle (savon, dentifrice, etc.)
- 🧹 Entretien courant (lessive, etc.)
- 🍼 Produits bébé (lait infantile, couches)

**Critères de sélection :**
- Produits à forte consommation
- Disponibles dans tous les territoires DOM
- EAN13 identifiable
- Prix régulièrement suivis par INSEE/observatoires

---

#### Avantages / Limites

**✅ Avantages :**
- Qualité élevée (formation, protocole)
- Fiabilité maximale (photos preuves)
- Couverture géographique maîtrisée
- Recrutement et coordination possibles

**📌 Limites :**
- Coût (rémunération agents ou partenariats)
- Couverture partielle (impossible de tout couvrir)
- Fréquence limitée (hebdomadaire au mieux)

**Budget indicatif :**
- Agent terrain mi-temps : 800-1200€/mois
- Formation initiale : 100€/agent
- Outils (smartphone, etc.) : 200€/agent
- **Total par territoire : 1000-1500€/mois**

---

### 🟡 CANAL B — Contributions Citoyennes Encadrées

#### Description

Les citoyens peuvent contribuer des observations de prix via l'application/site web, sous réserve de **validation** et de **garde-fous anti-fraude**.

---

#### Processus de contribution

**ÉTAPE 1 : Capture**
- Utilisateur upload photo ticket ou rayon
- OU scan code-barres + saisie manuelle prix
- Horodatage automatique
- Géolocalisation approximative (ville, territoire)

**ÉTAPE 2 : OCR (si photo ticket)**
- Extraction automatique lignes produits
- Score de confiance par champ (EAN, prix, date)
- Pré-remplissage formulaire

**ÉTAPE 3 : Vérification utilisateur**
- Utilisateur corrige erreurs OCR
- Complète informations manquantes (enseigne, etc.)
- Confirme soumission

**ÉTAPE 4 : Validation automatique (filtre 1)**
- ✅ EAN13 valide (checksum)
- ✅ Prix plausible (0,10€ < prix < 500€)
- ✅ Date cohérente (pas de futur, pas trop ancien)
- ✅ Territoire cohérent (IP, géoloc)

**ÉTAPE 5 : Validation humaine légère (filtre 2)**
- Modération manuelle si :
  - Score OCR < 85%
  - Prix hors fourchette attendue (±50% médiane connue)
  - Premier ticket d'un nouveau contributeur
  - Signalement par autres utilisateurs

**ÉTAPE 6 : Publication conditionnelle**
- Si N≥3 observations convergentes → Publication
- Si N<3 → En attente de recoupement
- Flag "Contributeur vérifié" après 10 contributions validées

---

#### Garde-fous anti-fraude

**1. Limitation par utilisateur**
- Max 20 contributions/jour
- Max 100 contributions/mois (sauf contributeurs vérifiés)
- Blocage si taux rejet > 50%

**2. Détection doublons**
- Hash (EAN + magasin + date + contributeur)
- Rejet automatique si doublon exact

**3. Détection patterns suspects**
- Contributions identiques répétées
- Prix toujours extrêmes (min ou max)
- Géolocalisation incohérente
- Timing suspect (100 contributions en 10 minutes)

**4. Système de réputation**
- Contributeur "Nouveau" : Validation manuelle stricte
- Contributeur "Vérifié" (10+ validations) : Validation automatique renforcée
- Contributeur "Expert" (100+ validations, 0 rejet) : Publication immédiate

**5. Signalement communautaire**
- Autres utilisateurs peuvent signaler une donnée douteuse
- Si 3+ signalements → Revue manuelle
- Si confirmé frauduleux → Suppression + pénalité contributeur

---

#### Avantages / Limites

**✅ Avantages :**
- Volume élevé (scalabilité)
- Couverture large (tous territoires)
- Coût faible (modération seule)
- Engagement citoyen

**📌 Limites :**
- Qualité variable (nécessite filtrage)
- Risque de fraude ou erreurs
- Biais de sélection (produits photographiés)
- Nécessite modération continue

**Budget indicatif :**
- Modération humaine : 500-1000€/mois (temps partiel)
- Outils OCR : Coût par API call (5-10€/1000 scans)
- **Total : 600-1200€/mois**

---

### 🔵 CANAL C — Partenariats Distributeurs

#### Description

Partenariats formalisés avec enseignes acceptant de partager des données tarifaires, sous conditions strictes de **transparence** et **absence de favoritisme**.

---

#### Types de partenariats possibles

**1. Partenariat open-data**
- Enseigne publie prix publiquement (CSV, API)
- A KI PRI SA YÉ intègre automatiquement
- Aucune contrepartie financière
- Transparence totale (partenariat affiché publiquement)

**Exemple :** Enseigne coopérative locale, enseigne publique

**2. Partenariat données semi-ouvertes**
- Enseigne fournit extraction hebdomadaire/mensuelle
- Produits définis (panier de référence)
- Échange non rémunéré (ou symbolique)
- Transparence totale

**Exemple :** Enseigne nationale souhaitant démontrer transparence

**3. Partenariat API automatisée**
- A KI PRI SA YÉ accède à API enseigne (read-only)
- Extraction automatique quotidienne/hebdomadaire
- Convention technique + juridique
- Transparence totale

**Exemple :** Enseigne avec API existante (e-commerce)

---

#### Conditions strictes de partenariat

**NON-NÉGOCIABLES :**
- ❌ Aucune rémunération d'A KI PRI SA YÉ par l'enseigne
- ❌ Aucun favoritisme dans affichage (pas de mise en avant payante)
- ❌ Aucune exclusivité (données partagées avec autres observatoires si demandé)
- ✅ Transparence publique : Partenariat mentionné sur page `/partenaires`
- ✅ Neutralité : Toutes enseignes traitées à égalité
- ✅ Clause de sortie : Partenariat résiliable sans préavis par A KI PRI SA YÉ

---

#### Format de données standard

**CSV ou JSON structuré :**
```csv
EAN13,Nom_Produit,Prix_TTC,Conditionnement,Enseigne,Ville,Date
3017620422003,Lait UHT 1L,1.89,1L,Carrefour,Pointe-à-Pitre,2026-01-13
```

**Champs obligatoires :**
- EAN13 (ou nom normalisé si EAN absent)
- Prix TTC
- Date d'observation
- Enseigne et localisation (ville minimum)

---

#### Avantages / Limites

**✅ Avantages :**
- Stabilité (flux régulier)
- Qualité (données officielles enseigne)
- Automatisation (pas de saisie manuelle)
- Légitimité institutionnelle

**📌 Limites :**
- Négociation lente (juridique, technique)
- Dépendance (si enseigne arrête)
- Risque favoritisme perçu (nécessite transparence absolue)
- Couverture limitée (seulement enseignes partenaires)

**Budget indicatif :**
- Négociation juridique : 1000-3000€ par partenariat (une fois)
- Intégration technique : 500-2000€ (développement API)
- Maintenance : 100-300€/mois par partenariat

---

### 🟣 CANAL D — Sources Institutionnelles & Open-Data

#### Description

Intégration de données publiques officielles issues d'organismes reconnus (INSEE, DGCCRF, observatoires locaux, collectivités).

---

#### Sources disponibles

**1. INSEE**
- Indices des prix à la consommation (IPC)
- Paniers de référence
- Données par territoire (DOM inclus)

**Format :** CSV, API, publications PDF  
**Fréquence :** Mensuelle ou trimestrielle  
**Granularité :** Catégories agrégées (pas produit par produit)

**2. Observatoires locaux des prix**
- OPMR Guadeloupe
- OPR Martinique
- OPMR Réunion

**Format :** Rapports PDF, fichiers Excel  
**Fréquence :** Trimestrielle ou semestrielle  
**Granularité :** Paniers de produits, comparaisons DOM/Métropole

**3. DGCCRF**
- Enquêtes ponctuelles
- Relevés de prix spécifiques
- Publications thématiques

**Format :** Rapports publics  
**Fréquence :** Irrégulière  
**Granularité :** Variable

**4. Collectivités territoriales**
- Enquêtes locales
- Relevés services publics
- Études commanditées

**Format :** Variable  
**Fréquence :** Variable  
**Granularité :** Variable

---

#### Processus d'intégration

**ÉTAPE 1 : Identification source**
- Vérification fiabilité (organisme reconnu)
- Vérification accès public (open-data)
- Vérification licence (réutilisable)

**ÉTAPE 2 : Extraction**
- Téléchargement manuel (si PDF/Excel)
- OU extraction automatique (si API/CSV)

**ÉTAPE 3 : Normalisation**
- Conversion format standard
- Mapping catégories vers référentiel interne
- Ajout métadonnées (source, date, périmètre)

**ÉTAPE 4 : Publication**
- Mention explicite de la source (INSEE, OPMR, etc.)
- Date de publication officielle
- Lien vers document source original

---

#### Avantages / Limites

**✅ Avantages :**
- Légitimité maximale (données officielles)
- Fiabilité (méthodes validées)
- Gratuité (open-data)
- Complémentarité (indices macro)

**📌 Limites :**
- Granularité faible (catégories, pas produits individuels)
- Fréquence faible (mensuelle/trimestrielle)
- Délais de publication (plusieurs semaines/mois)
- Périmètres parfois larges (région entière)

**Budget indicatif :**
- Intégration technique : 500-1500€ (une fois)
- Maintenance : Gratuit (automatisation)

---

## 2️⃣ RÈGLE D'OR : AUCUNE SOURCE UNIQUE

### Principe de recoupement

> **Un prix n'est jamais "vrai" seul.**  
> **Il est crédible par recoupement de sources indépendantes.**

---

### Stratégie de validation croisée

**Cas 1 : Prix convergents (écart < 5%)**
```
Source A (terrain) : 1,89€
Source B (citoyen) : 1,85€
Source C (partenaire): 1,90€

→ Prix validé : 1,88€ (médiane)
→ Confiance : 🟢 Élevée (3 sources)
```

**Cas 2 : Prix divergents (écart > 10%)**
```
Source A (terrain) : 1,89€
Source B (citoyen) : 2,50€

→ Alerte divergence
→ Vérification manuelle requise
→ Exclusion source aberrante
```

**Cas 3 : Source unique**
```
Source A (partenaire) : 1,89€
(Aucune autre source)

→ Publication avec flag : 🟡 "Source unique"
→ Appel à contributions citoyennes
```

---

### Pondération par type de source

| Type de source | Poids | Justification |
|----------------|-------|---------------|
| **Terrain certifié** | 🔵🔵🔵🔵 (4/4) | Formation, protocole, photo preuve |
| **Partenaire enseigne** | 🔵🔵🔵🔵 (4/4) | Données officielles enseigne |
| **Ticket OCR validé** | 🔵🔵🔵 (3/4) | Preuve document, mais OCR possiblement imparfait |
| **Contribution véri fiée** | 🔵🔵🔵 (3/4) | Contributeur réputé, validation humaine |
| **Open-data institutionnel** | 🔵🔵 (2/4) | Légitime mais agrégé, granularité faible |
| **Contribution non vérifiée** | 🔵 (1/4) | En attente validation |

---

### Algorithme de décision

**SI N sources ≥ 3 ET écart < 10% :**
→ Calcul médiane → Publication 🟢

**SI N sources = 2 ET écart < 5% :**
→ Calcul moyenne → Publication 🟡 "Données partielles"

**SI N sources = 1 :**
→ Publication 🟡 "Source unique" OU attente recoupement

**SI écart > 10% :**
→ Alerte → Vérification manuelle → Exclusion source aberrante

---

## 3️⃣ PIPELINE DE VALIDATION (Étapes Obligatoires)

### Schéma général

```
┌─────────────────────┐
│ 1. RÉCEPTION DONNÉE │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 2. VÉRIF. FORMAT    │ (EAN, prix, date valides?)
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 3. VÉRIF. TERRITOIRE│ (DOM connu? Cohérence géoloc?)
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 4. VÉRIF. PRODUIT   │ (EAN existe? Nom cohérent?)
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 5. VÉRIF. PLAUSIBILITÉ│ (Prix dans fourchette?)
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 6. HISTORISATION    │ (Enregistrement BDD)
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 7. PUBLICATION      │ (Si seuils atteints)
└─────────────────────┘
```

---

### Détail des étapes

#### ÉTAPE 1 : Réception donnée

**Sources d'entrée :**
- API upload (contributions citoyennes)
- Formulaire web (relevés terrain)
- Import CSV (partenaires)
- Scraping (open-data)

**Données brutes reçues :**
- EAN13 (ou nom produit)
- Prix TTC
- Date observation
- Lieu (territoire, magasin)
- Source (type de canal)
- Métadonnées (photo, contributeur ID, etc.)

---

#### ÉTAPE 2 : Vérification format

**Contrôles automatiques :**
- ✅ EAN13 : 13 chiffres + checksum valide
- ✅ Prix : Nombre décimal positif (0.01€ à 9999€)
- ✅ Date : Format ISO 8601 (YYYY-MM-DD)
- ✅ Territoire : Code valide (GP, MQ, GF, RE, YT, etc.)

**Rejet immédiat si :**
- ❌ EAN invalide (sauf si nom produit fourni)
- ❌ Prix = 0 ou négatif
- ❌ Date dans le futur
- ❌ Territoire inconnu

---

#### ÉTAPE 3 : Vérification territoire

**Contrôles :**
- ✅ Cohérence géolocalisation (si fournie) avec territoire déclaré
- ✅ Vérification IP (pays France + DOM)
- ✅ Magasin connu (si nom fourni) dans ce territoire

**Alerte si :**
- ⚠️ Géolocalisation incohérente (ex : IP Métropole, territoire déclaré Guadeloupe)
- ⚠️ Magasin inconnu (ajout en base après validation)

---

#### ÉTAPE 4 : Vérification produit

**Contrôles :**
- ✅ EAN existe dans base de référence (base EAN nationale)
- ✅ Nom produit cohérent avec EAN
- ✅ Catégorie identifiable

**Enrichissement :**
- Ajout nom officiel (si EAN connu)
- Ajout catégorie (ex : Produits laitiers > Lait UHT)
- Ajout conditionnement (ex : 1L, 500g)

**Si EAN inconnu :**
- Ajout en base "Produits non référencés"
- Validation manuelle ultérieure

---

#### ÉTAPE 5 : Vérification plausibilité

**Contrôles statistiques :**
- ✅ Prix dans fourchette attendue : [médiane * 0.5, médiane * 2]
- ✅ Pas de variation brutale : écart < 50% vs dernière observation

**Calcul fourchette :**
- Si historique existe : Médiane ± 50%
- Si pas d'historique : Fourchette large (0,50€ - 100€)

**Rejet si :**
- ❌ Prix aberrant : 0,01€ pour un produit normalement à 2€
- ❌ Prix extrême : 500€ pour un pack de lait

**Validation manuelle si :**
- ⚠️ Hors fourchette mais pas aberrant (ex : promotion -40%)

---

#### ÉTAPE 6 : Historisation

**Enregistrement base de données :**
```sql
INSERT INTO observations_prix (
  id,
  ean13,
  prix_ttc,
  date_observation,
  territoire,
  magasin,
  source_type,
  source_id,
  statut,
  created_at
) VALUES (
  UUID(),
  '3017620422003',
  1.89,
  '2026-01-13',
  'GP',
  'Carrefour Jarry',
  'citoyen',
  'user_abc123',
  'validé',
  NOW()
);
```

**Statuts possibles :**
- `en_attente` : Validation manuelle requise
- `validé` : Publié ou en attente recoupement
- `rejeté` : Exclu (aberrant, doublon, fraude)

---

#### ÉTAPE 7 : Publication conditionnelle

**Conditions de publication :**
- ✅ Statut = `validé`
- ✅ N observations ≥ seuil minimal (3 par défaut)
- ✅ Sources indépendantes (pas 3 fois même contributeur)

**Calcul prix publié :**
- **Médiane** des observations validées (robuste aux valeurs extrêmes)
- OU **Moyenne** si distribution normale

**Métadonnées publiées :**
- Prix calculé
- N observations
- Date dernière observation
- Fourchette (min-max)
- Drapeaux de qualité (🟢🟡🔴)

---

## 4️⃣ POLITIQUE ANTI-SIMULATION (Clause Forte)

### Interdictions strictes

#### ❌ 1. Prix estimés

**Interdit :**
```javascript
// Code interdit
const prixEstimé = prixMetropole * coefficientDOM; // ❌
```

**Alternative autorisée :**
```javascript
// Si aucune donnée
afficher("⚪ Donnée non disponible pour ce produit");
```

---

#### ❌ 2. Prix extrapolés

**Interdit :**
```javascript
// Code interdit
const prixAujourdhui = prixMoisDernier * (1 + tauxInflation); // ❌
```

**Alternative autorisée :**
```javascript
// Afficher dernière observation connue avec date
afficher(`Prix observé : 1,89€ (dernière observation : 13/01/2026)`);
```

---

#### ❌ 3. Prix "moyens" inventés

**Interdit :**
```javascript
// Code interdit
const prixMoyen = (prixMin + prixMax) / 2; // Sans observations réelles ❌
```

**Alternative autorisée :**
```javascript
// Calculer moyenne uniquement si observations réelles
if (observations.length >= 3) {
  const prixMoyen = mediane(observations);
  afficher(`Prix moyen : ${prixMoyen}€ (${observations.length} observations)`);
} else {
  afficher("🟡 Données insuffisantes (< 3 observations)");
}
```

---

#### ❌ 4. Données test en production

**Interdit :**
- Prix fictifs pour remplir l'interface
- Données "lorem ipsum"
- Valeurs placeholder (0,00€, 99,99€)

**Alternative autorisée :**
- États vides explicites
- Messages "Données en cours de collecte"
- Appels à contribution

---

### Messages autorisés pour absence de données

**Formulations standards :**
```
⚪ "Donnée non disponible pour ce produit"
🔵 "Données en cours de collecte"
🟡 "Observations insuffisantes (N < 3)"
⚠️ "Territoire non couvert à ce jour"
📊 "Historique incomplet (observations ponctuelles)"
```

**Formulations interdites :**
```
❌ "Prix estimé à..."
❌ "Probablement autour de..."
❌ "D'après nos calculs..."
❌ "Prix similaire à [autre territoire]"
```

---

## 5️⃣ FRÉQUENCE & FRAÎCHEUR DES DONNÉES

### Règles par catégorie de produit

| Catégorie | Fréquence cible | Tolérance max | Justification |
|-----------|-----------------|---------------|---------------|
| **Alimentaire frais** | 7 jours | 14 jours | Prix volatils |
| **Alimentaire sec** | 14 jours | 30 jours | Stabilité moyenne |
| **Hygiène/Entretien** | 14 jours | 30 jours | Stabilité moyenne |
| **Produits bébé** | 14 jours | 30 jours | Sensibilité sociale |
| **Services** | 30 jours | 90 jours | Prix contractuels |
| **Énergie (essence)** | 3 jours | 7 jours | Très volatil |

---

### Affichage date et fraîcheur

**Pour chaque prix affiché :**
```
┌──────────────────────────────────────┐
│ Lait UHT 1L                          │
│ 1,89€                                │
│                                      │
│ 📅 Dernière observation : 13/01/2026│
│ 🕐 Il y a 2 jours                    │
│ 👥 12 observations (7 jours)         │
│ 🟢 Données fraîches                  │
└──────────────────────────────────────┘
```

**Flag fraîcheur :**
- 🟢 **Frais** : < 7 jours
- 🟡 **Acceptable** : 7-30 jours
- 🟠 **Ancien** : 30-90 jours
- 🔴 **Périmé** : > 90 jours (non publié ou disclaimer fort)

---

### Stratégie de rafraîchissement

**Priorité 1 (hebdomadaire) :**
- Panier de référence (50-100 produits essentiels)
- Produits "Anti-Crise"
- Produits à forte consommation

**Priorité 2 (bi-hebdomadaire) :**
- Top 500 produits les plus recherchés
- Produits avec alertes actives

**Priorité 3 (mensuelle) :**
- Catalogue général (milliers de produits)
- Produits de niche

---

## 6️⃣ TRAÇABILITÉ VISIBLE POUR L'UTILISATEUR

### Métadonnées affichées

**Pour chaque prix, affichage obligatoire :**

```
┌──────────────────────────────────────────────────┐
│ 🥛 Lait UHT demi-écrémé 1L                      │
│                                                  │
│ 1,89€                                            │
│                                                  │
│ 📍 Guadeloupe (GP) - Pointe-à-Pitre            │
│ 🏪 Carrefour - Jarry                            │
│ 📅 Dernière observation : 13/01/2026            │
│ 👥 12 observations (5 magasins, 7 jours)        │
│ 🧠 Médiane des prix observés                    │
│ 🟢 Donnée robuste (confiance élevée)            │
│                                                  │
│ ⓘ Méthodologie détaillée                        │
│ 📊 Voir l'historique                            │
└──────────────────────────────────────────────────┘
```

---

### Niveaux de confiance (explicite)

**🟢 Confiance élevée**
- N ≥ 10 observations
- Sources diversifiées (≥ 2 types)
- Fraîcheur < 7 jours
- Écart-type faible (< 10%)

**🟡 Confiance moyenne**
- 3 ≤ N < 10 observations
- Sources limitées
- Fraîcheur 7-30 jours
- Écart-type moyen (10-20%)

**🔴 Confiance faible**
- N < 3 observations
- Source unique
- Fraîcheur > 30 jours
- Écart-type élevé (> 20%)

**⚪ Pas de donnée**
- N = 0
- Affichage : "Donnée non disponible"

---

### Modal "Méthodologie détaillée"

**Accessible via lien ⓘ :**
```
┌──────────────────────────────────────────────────┐
│ 📊 Méthodologie de calcul                       │
│                                                  │
│ Prix affiché : 1,89€                            │
│                                                  │
│ Calcul : Médiane de 12 observations             │
│                                                  │
│ Sources :                                        │
│ • 5 relevés terrain (protocole certifié)        │
│ • 4 tickets citoyens (OCR validé >90%)          │
│ • 3 données partenaire (Carrefour API)          │
│                                                  │
│ Fourchette observée : 1,85€ - 1,95€             │
│ Écart-type : 0,03€ (1,6%)                       │
│                                                  │
│ Période : 07/01/2026 - 13/01/2026               │
│                                                  │
│ → Consulter la charte des données                │
└──────────────────────────────────────────────────┘
```

---

## 7️⃣ GOUVERNANCE DES DONNÉES COLLECTÉES

### Comité méthodologie

**Composition :**
- 1 représentant équipe technique
- 1 représentant contributeurs actifs
- 1 expert externe (statisticien, data scientist)
- 1 représentant collectivité ou association (si partenariat)

**Rôle :**
- Valider évolutions méthodologiques
- Arbitrer cas limites (données ambiguës)
- Auditer qualité des données
- Proposer améliorations pipeline

**Fréquence :** Réunion trimestrielle + ad-hoc si besoin

---

### Processus de décision

**ÉTAPE 1 : Proposition**
- Émise par équipe technique, contributeur ou comité
- Documentée (problème, solution, impact)

**ÉTAPE 2 : Analyse**
- Impact qualité données
- Impact coût/ressources
- Impact utilisateurs

**ÉTAPE 3 : Consultation**
- Comité méthodologie
- Contributeurs actifs (si modification protocole)
- Utilisateurs (si changement majeur)

**ÉTAPE 4 : Décision**
- Vote comité méthodologie
- Décision documentée publiquement
- Implémentation planifiée

**ÉTAPE 5 : Suivi**
- Monitoring post-implémentation
- Ajustements si nécessaire
- Bilan public

---

### Versionnement public

**Chaque modification méthodologique = nouvelle version mineure**

Exemple :
- v1.0 : Version initiale
- v1.1 : Ajout seuil plausibilité dynamique
- v1.2 : Modification pondération sources
- v2.0 : Refonte complète pipeline (changement majeur)

**Changelog public accessible :** `/methodologie/changelog`

---

## 8️⃣ LIEN AVEC MODULE ANTI-CRISE

### Critères d'éligibilité "Anti-Crise"

Un produit peut être étiqueté "Anti-Crise" **uniquement si** :

#### Critère 1 : Volume d'observations
- ✅ N ≥ 10 observations
- ✅ Sur ≥ 5 magasins distincts
- ✅ Sur période ≤ 14 jours

**Raison :** Un produit "Anti-Crise" doit être largement disponible et observé.

---

#### Critère 2 : Stabilité du prix
- ✅ Écart-type ≤ 10% du prix médian
- ✅ Aucune variation brutale (> 20%) non expliquée

**Raison :** Un prix "Anti-Crise" doit être stable, pas une promotion temporaire.

---

#### Critère 3 : Positionnement relatif
- ✅ Prix ≤ Percentile 25 de sa catégorie
- ✅ Écart ≥ -15% vs médiane catégorie

**Raison :** "Anti-Crise" = parmi les moins chers, pas forcément LE moins cher (qui peut être une aberration).

---

#### Critère 4 : Disponibilité territoriale
- ✅ Observé dans ≥ 60% des territoires DOM couverts
- ✅ Disponible dans ≥ 3 types d'enseignes (hyper, super, discount)

**Raison :** Un produit "Anti-Crise" doit être accessible largement.

---

### Processus de labellisation

**ÉTAPE 1 : Calcul automatique**
- Algorithme quotidien
- Évaluation des 4 critères pour tous produits

**ÉTAPE 2 : Validation manuelle**
- Comité méthodologie vérifie liste
- Exclusion produits non pertinents (luxe, alcool, tabac)
- Vérification cohérence

**ÉTAPE 3 : Publication**
- Page `/anti-crise`
- Label visible sur fiche produit
- Métadonnées : Date labellisation, critères remplis

**ÉTAPE 4 : Réévaluation**
- Hebdomadaire
- Retrait automatique si critères non remplis
- Historique conservé

---

### Affichage label "Anti-Crise"

```
┌──────────────────────────────────────────────────┐
│ 🥛 Lait UHT demi-écrémé 1L                      │
│                                                  │
│ 1,45€                                            │
│                                                  │
│ 🏷️ ANTI-CRISE                                   │
│    Parmi les 25% les moins chers de sa catégorie│
│                                                  │
│ ✅ 15 observations (8 magasins, 10 jours)       │
│ ✅ Prix stable (écart-type : 2%)                │
│ ✅ Disponible dans 4 territoires DOM            │
│                                                  │
│ ⓘ Critères de labellisation                     │
└──────────────────────────────────────────────────┘
```

---

## 9️⃣ LIVRABLES FINAUX DU MODULE J

### Documents créés

✅ **1. STRATEGIE_COLLECTE_DONNEES.md** (ce document - 27 KB)
- 4 canaux de collecte
- Pipeline de validation (7 étapes)
- Politique anti-simulation
- Règles de fraîcheur
- Traçabilité utilisateur
- Gouvernance données
- Critères Anti-Crise

✅ **2. Protocole de relevé terrain** (à créer)
- Fiche de relevé numérique
- Guide photographique
- Formation agents (2h)

✅ **3. Formulaire contribution citoyenne** (à implémenter)
- Upload photo ticket/rayon
- Scan EAN + saisie manuelle
- Validation multi-étapes

✅ **4. Convention type partenariat** (à créer)
- Modèle juridique
- Clauses non-négociables
- Format technique données

✅ **5. Dashboard qualité données** (à implémenter)
- Monitoring temps réel
- Alertes divergences
- KPIs (N observations, fraîcheur, etc.)

---

## CONCLUSION

### Engagement opérationnel

> **"A KI PRI SA YÉ ne montre que des prix observés.**  
> **Quand la donnée est insuffisante, il le dit."**

Cette stratégie de collecte garantit :
- ✅ **Authenticité** : 100% données réelles
- ✅ **Traçabilité** : Chaque prix a une source
- ✅ **Robustesse** : Recoupement multi-sources
- ✅ **Transparence** : Métadonnées complètes visibles
- ✅ **Gouvernance** : Comité méthodologie indépendant

### Déploiement progressif

**Phase 1 (Q1 2026) :**
- Canal A activé (2 agents terrain Guadeloupe + Martinique)
- Canal B activé (contributions citoyennes beta)
- Pipeline validation opérationnel

**Phase 2 (Q2-Q3 2026) :**
- Extension Canal A (Réunion, Guyane)
- Premiers partenariats distributeurs (Canal C)
- Intégration open-data INSEE/observatoires (Canal D)

**Phase 3 (Q4 2026+) :**
- Montée en charge tous canaux
- Optimisation pipeline (ML pour détection fraudes)
- Dashboard temps réel

---

**Adoption :** 13 janvier 2026  
**Statut :** Contraignant  
**Prochaine révision :** Post-déploiement Phase 1

---

*Fin du document – Stratégie de Collecte Réelle des Données*
