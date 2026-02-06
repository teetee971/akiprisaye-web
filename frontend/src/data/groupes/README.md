# Comparaisons Multi-Groupes - A KI PRI SA YÉ

## Vue d'ensemble

Ce répertoire contient les données de comparaison des écarts de prix entre les territoires ultramarins (DROM) et la métropole, organisées par secteur d'activité.

## Objectif

**A KI PRI SA YÉ analyse un système économique, pas des entreprises individuelles.**

## Principes éditoriaux

### ✅ Approche neutre et contextuelle
- **Comparaison multi-acteurs** : Toujours plusieurs groupes dans chaque analyse
- **Référence indépendante** : Les commerces indépendants sont systématiquement inclus comme baseline
- **Vision systémique** : Focus sur les écarts territoriaux, pas sur un classement d'entreprises
- **Transparence** : Indices visuels clairs (🔴 🟠 🟢) basés sur les écarts moyens

### ❌ Ce que nous évitons
- Classements agressifs ou stigmatisants
- Désignation de "gagnants" ou "perdants"
- Analyses isolées d'un seul acteur
- Jugements de valeur non étayés par les données

## Structure des données

Chaque fichier JSON contient un array d'objets avec :

```json
{
  "groupe": "Nom du groupe",
  "indice": "🔴|🟠|🟢",
  "ecart_moyen": "+XX%",
  "territoires": ["Liste", "des", "territoires"]
}
```

### Légende des indices

- 🔴 **Rouge** : Écart significatif (>15%)
- 🟠 **Orange** : Écart modéré (8-15%)
- 🟢 **Vert** : Écart faible ou compétitif (<8%)

## Fichiers disponibles

### 1. `grande_distribution.json`
Commerce alimentaire et distribution générale
- 5 acteurs (4 groupes + indépendants)
- Couvre : Guadeloupe, Martinique, Guyane, La Réunion

### 2. `distribution_automobile.json`
Secteur automobile et mobilité
- 4 acteurs (3 groupes + indépendants)
- Couvre : Guadeloupe, Martinique, Guyane, La Réunion

### 3. `agro_alimentaire.json`
Production et transformation agro-alimentaire
- 3 acteurs (2 groupes + indépendants)
- Couvre : Guadeloupe, Martinique, La Réunion

## Utilisation dans le comparateur

Ces données permettent :
1. **Analyses sectorielles** : Comprendre les écarts par type d'activité
2. **Comparaisons territoriales** : Identifier les spécificités locales
3. **Benchmark indépendants** : Mesurer l'impact de la concentration économique
4. **Visualisations neutres** : Graphiques multi-acteurs sans stigmatisation

## Protection juridique

Cette approche garantit :
- ✔️ Neutralité éditoriale renforcée
- ✔️ Crédibilité scientifique
- ✔️ Protection contre les risques de diffamation
- ✔️ Intérêt public reconnu (information citoyenne)

## Sources et méthodologie

Les écarts sont calculés par rapport aux prix pratiqués en métropole pour des produits équivalents, en tenant compte :
- Des données officielles (INSEE, OPMR)
- Des relevés de prix terrain
- Des analyses comparatives multi-territoires
- De la pondération par catégories de produits

---

**Note** : Ces données sont fournies à titre informatif dans un but d'intérêt public. Elles visent à éclairer le débat sur la cherté de la vie dans les territoires ultramarins, conformément à la mission d'A KI PRI SA YÉ.
