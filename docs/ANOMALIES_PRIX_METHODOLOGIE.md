# Méthodologie de Détection d'Anomalies de Prix - A KI PRI SA YÉ

## Description

Système de détection automatique d'anomalies de prix basé exclusivement sur des méthodes statistiques simples, explicables et traçables. Ce module sert de signal de vigilance citoyenne, pas de jugement.

## Principe fondamental

⚠️ **Règles non négociables**:

- ❌ Aucune prédiction
- ❌ Aucun score opaque
- ❌ Aucun apprentissage automatique non explicable
- ✅ Méthodes statistiques simples et documentées
- ✅ Résultats interprétables par un citoyen ou une collectivité
- ✅ Traçabilité complète des calculs

## Définition d'une anomalie

Une anomalie est définie comme:

> **Une variation de prix statistiquement atypique par rapport à l'historique observé d'un même produit, dans un même territoire, sur une période comparable.**

## Types d'anomalies détectées

### 1. Hausse brutale (`hausse_brutale`)

**Définition**: Augmentation significative du prix moyen par rapport à la période précédente

**Méthode**: Comparaison période N vs N-1

**Formule**:
```
variation_pct = ((prix_N - prix_N-1) / prix_N-1) × 100
```

**Seuils**:
- Niveau **modéré**: variation ≥ 15%
- Niveau **élevé**: variation ≥ 25%

**Exemple**:
- Période N-1: Prix moyen = 1.50€
- Période N: Prix moyen = 1.92€
- Variation: +28% → Anomalie détectée (niveau élevé)

### 2. Baisse brutale (`baisse_brutale`)

**Définition**: Diminution significative du prix moyen par rapport à la période précédente

**Méthode**: Comparaison période N vs N-1

**Formule**:
```
variation_pct = ((prix_N - prix_N-1) / prix_N-1) × 100
```

**Seuils**:
- Niveau **modéré**: variation ≤ -15%
- Niveau **élevé**: variation ≤ -25%

**Exemple**:
- Période N-1: Prix moyen = 2.00€
- Période N: Prix moyen = 1.45€
- Variation: -27.5% → Anomalie détectée (niveau élevé)

### 3. Écart extrême (`ecart_extreme`)

**Définition**: Prix très éloigné de la médiane historique

**Méthode**: Écart Interquartile (IQR)

**Formules**:
```
Q1 = premier quartile (25ème percentile)
Q3 = troisième quartile (75ème percentile)
IQR = Q3 - Q1

Borne inférieure = Q1 - (3.0 × IQR)
Borne supérieure = Q3 + (3.0 × IQR)
```

**Détection**:
Si prix_moyen < borne_inférieure OU prix_moyen > borne_supérieure → Anomalie

**Seuils**:
- Niveau **modéré**: facteur IQR = 1.5
- Niveau **élevé**: facteur IQR = 3.0

**Exemple**:
- Données historiques: [1.20, 1.25, 1.30, 1.35, 1.40, 1.45, 1.50]
- Q1 = 1.25, Q3 = 1.45, IQR = 0.20
- Borne supérieure = 1.45 + (3.0 × 0.20) = 2.05€
- Prix observé = 2.15€ → Anomalie détectée (niveau élevé)

### 4. Dispersion anormale (`dispersion_anormale`)

**Définition**: Écart important entre le prix minimum et maximum observés dans une même période

**Méthode**: Ratio max/min

**Formule**:
```
ratio_dispersion = prix_max / prix_min
```

**Seuils**:
- Niveau **modéré**: ratio ≥ 1.3 (écart de 30%)
- Niveau **élevé**: ratio ≥ 1.5 (écart de 50%)

**Exemple**:
- Dans une même semaine:
  - Prix min: 1.20€
  - Prix max: 1.86€
  - Ratio: 1.55 (écart de 55%) → Anomalie détectée (niveau élevé)

## Méthodes statistiques utilisées

### Médiane

**Définition**: Valeur centrale d'un ensemble de données ordonnées

**Avantages**:
- Robuste aux valeurs extrêmes
- Représente mieux le "prix typique" que la moyenne

**Calcul**:
- Si n impair: médiane = valeur centrale
- Si n pair: médiane = moyenne des deux valeurs centrales

### Écart Interquartile (IQR)

**Définition**: Mesure de dispersion statistique

**Formule**: IQR = Q3 - Q1

**Avantages**:
- Robuste aux valeurs aberrantes
- Utilisée en statistique descriptive classique
- Interprétation simple

**Usage**: Identifier les valeurs atypiques selon la règle:
- Valeur atypique si < Q1 - k×IQR ou > Q3 + k×IQR
- k = 1.5 (modéré) ou k = 3.0 (élevé)

### Comparaison période sur période

**Définition**: Calcul de variation relative entre deux périodes consécutives

**Formule**: `variation % = ((nouveau - ancien) / ancien) × 100`

**Avantages**:
- Compréhensible par tous
- Détecte les changements brusques
- Interprétation directe en pourcentage

## Seuils configurables

Tous les seuils sont explicites et modifiables:

```typescript
const SEUILS = {
  // Variation brutale (%)
  HAUSSE_MODEREE: 15,
  HAUSSE_ELEVEE: 25,
  BAISSE_MODEREE: 15,
  BAISSE_ELEVEE: 25,
  
  // Écart par rapport à la médiane (facteur IQR)
  ECART_MODERE: 1.5,
  ECART_ELEVE: 3.0,
  
  // Dispersion (ratio max/min)
  DISPERSION_MODEREE: 1.3,
  DISPERSION_ELEVEE: 1.5,
  
  // Nombre minimum d'observations
  MIN_OBSERVATIONS: 3,
  MIN_PERIODES_HISTORIQUE: 4,
};
```

**Justification des seuils**:
- **15% de variation**: Seuil communément utilisé en surveillance des prix
- **25% de variation**: Variation considérée comme significative
- **IQR × 1.5**: Règle statistique standard (Tukey, 1977)
- **IQR × 3.0**: Valeurs extrêmes selon Tukey
- **Ratio 1.3-1.5**: Écart jugé notable en distribution de détail

## Limites connues

### 1. Données insuffisantes

**Problème**: Si moins de 4 périodes ou moins de 3 observations par période

**Comportement**: Aucune anomalie n'est détectée

**Raison**: Les méthodes statistiques nécessitent un historique minimum pour être fiables

### 2. Saisonnalité

**Problème**: Les produits saisonniers peuvent générer des faux positifs

**Exemple**: Prix des fruits variant naturellement selon les saisons

**Atténuation**: Comparer des périodes similaires de l'année

### 3. Changements structurels

**Problème**: Nouveaux taxes, pénuries, changements de conditionnement

**Exemple**: Une taxe de 10% créera systématiquement une anomalie

**Interprétation**: L'anomalie est réelle, mais peut avoir une explication légitime

### 4. Hétérogénéité des produits

**Problème**: Même nom ≠ produit strictement identique

**Exemple**: "Riz 1kg" peut inclure plusieurs marques/qualités

**Atténuation**: Utiliser les codes EAN quand disponibles

### 5. Couverture géographique partielle

**Problème**: Les observations ne couvrent pas tous les points de vente

**Conséquence**: Les anomalies reflètent les lieux observés, pas l'ensemble du marché

## Exemples réels

### Exemple 1: Hausse modérée détectée

```json
{
  "type": "hausse_brutale",
  "periode": "2026-01-W02",
  "valeur": 1.75,
  "reference": 1.50,
  "variation_pct": 16.67,
  "niveau": "modéré",
  "commentaire": "Augmentation de 17% par rapport à la période précédente",
  "methode": "Comparaison période N vs N-1"
}
```

**Interprétation**: Le prix moyen du produit est passé de 1.50€ à 1.75€ en une semaine, ce qui représente une hausse de 17%. Cette variation dépasse le seuil de vigilance de 15%.

### Exemple 2: Écart extrême élevé

```json
{
  "type": "ecart_extreme",
  "periode": "2026-01-W03",
  "valeur": 2.20,
  "reference": 1.55,
  "variation_pct": 41.94,
  "niveau": "élevé",
  "commentaire": "Prix très éloigné de la médiane historique (42%)",
  "methode": "Méthode IQR (Interquartile Range)"
}
```

**Interprétation**: Le prix observé (2.20€) est 42% plus élevé que la médiane historique (1.55€) et se situe au-delà de 3 fois l'écart interquartile. Cela indique un prix statistiquement atypique.

### Exemple 3: Dispersion anormale

```json
{
  "type": "dispersion_anormale",
  "periode": "2026-01-W04",
  "valeur": 1.95,
  "reference": 1.25,
  "variation_pct": 56.00,
  "niveau": "élevé",
  "commentaire": "Écart important entre prix minimum (1.25€) et maximum (1.95€)",
  "methode": "Ratio max/min"
}
```

**Interprétation**: Dans la même semaine, le produit a été observé à 1.25€ dans un magasin et à 1.95€ dans un autre, soit un écart de 56%. Cette dispersion inhabituelle peut indiquer des stratégies tarifaires différentes ou des produits non strictement identiques.

## Cas limites gérés

### Cas 1: Aucune donnée historique

**Situation**: Premier produit observé dans un territoire

**Comportement**: Aucune anomalie détectée

**Raison**: Pas de référence pour comparaison

### Cas 2: Données très dispersées

**Situation**: Prix très variables (marché volatil, promotions fréquentes)

**Comportement**: L'IQR sera large, donc moins d'anomalies "écart extrême"

**Raison**: La méthode s'adapte à la volatilité naturelle

### Cas 3: Prix stable puis variation

**Situation**: Longue période de stabilité suivie d'un changement

**Comportement**: Détecté comme "hausse/baisse brutale" ET "écart extrême"

**Raison**: Les deux méthodes sont complémentaires

## Avertissements d'usage

### Pour les citoyens

✅ **Les anomalies peuvent indiquer**:
- Une variation de prix inhabituelle
- Un signal de vigilance
- Une donnée à contextualiser

❌ **Les anomalies ne prouvent PAS**:
- Une pratique illégale
- Une manipulation de prix
- Une faute d'un commerçant

### Pour les institutions

✅ **Les anomalies peuvent servir à**:
- Orienter des enquêtes de terrain
- Identifier des zones de vigilance
- Analyser des tendances de marché

❌ **Les anomalies ne doivent PAS**:
- Être utilisées comme preuve unique
- Justifier des sanctions sans enquête
- Remplacer un contrôle sur site

### Pour les journalistes

✅ **Les anomalies peuvent**:
- Suggérer des sujets d'investigation
- Illustrer des variations de prix
- Contextualiser des reportages

❌ **Les anomalies ne doivent PAS**:
- Être présentées comme accusations
- Être utilisées hors contexte
- Ignorer les explications alternatives

## Mentions légales obligatoires

Lors de l'affichage d'anomalies, toujours inclure:

> **Avertissement**: Les anomalies signalées sont des indicateurs statistiques basés sur des observations réelles. Elles ne constituent ni une accusation ni une preuve de pratique illégale.

## API Endpoint

**GET** `/api/anomalies/prix`

Voir la documentation complète de l'API dans [API_OPEN_DATA.md](./API_OPEN_DATA.md)

## Références bibliographiques

- **Tukey, J. W. (1977)**. _Exploratory Data Analysis_. Addison-Wesley. (Méthode IQR)
- **DGCCRF**. Méthodologie de surveillance des prix. (Seuils de variation)
- **INSEE**. Analyse des séries temporelles de prix. (Comparaison temporelle)

## Support

Pour toute question sur la méthodologie:
- Site web: https://akiprisaye.pages.dev
- Documentation API: [API_OPEN_DATA.md](./API_OPEN_DATA.md)

## Licence

Cette méthodologie est publiée sous licence ouverte conformément à la politique de transparence du projet A KI PRI SA YÉ.

---

**Dernière mise à jour**: 2026-01-07
**Version**: 1.0.0
