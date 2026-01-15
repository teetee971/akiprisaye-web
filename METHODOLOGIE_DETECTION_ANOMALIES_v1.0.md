# Méthodologie de Détection d'Anomalies de Prix - A KI PRI SA YÉ

**Plateforme citoyenne de transparence des prix**

Version 1.0.0 - Janvier 2026

---

## Principe Fondamental

**La détection d'anomalies utilise des méthodes statistiques explicables et auditables.**

❌ Aucun "machine learning" opaque
✅ Règles statistiques simples et transparentes
✅ Seuils configurables et documentés
✅ Détection descriptive uniquement

---

## Objectif

Identifier automatiquement les variations de prix inhabituelles pour aider les citoyens à comprendre l'évolution des prix, **sans porter d'accusation ni de jugement**.

Une anomalie détectée n'implique :
- ❌ Aucune infraction
- ❌ Aucune illégalité
- ❌ Aucune manipulation
- ✅ Uniquement une observation statistique

---

## Méthodes de Détection

### 1. Anomalies Temporelles

**Principe**: Détection de variations brutales de prix sur une période courte.

**Méthode**: Comparaison glissante entre observations successives.

**Calcul**:
```
Variation (%) = (Prix actuel - Prix précédent) / Prix précédent × 100
```

**Seuils par défaut** (sur 7 jours):
- 🔵 **LOW**: ≥ 5% de variation
- 🟠 **MEDIUM**: ≥ 10% de variation
- 🔴 **HIGH**: ≥ 20% de variation

**Exemple**:
- Prix le 1er janvier: 10,00€
- Prix le 5 janvier: 12,00€
- Variation: +20% en 4 jours → Anomalie HIGH détectée

**Limitations**:
- Ne détecte que les variations dans la fenêtre de temps configurée
- Ne tient pas compte des variations saisonnières
- Peut être normale en période de crise ou pénurie

---

### 2. Anomalies Territoriales

**Principe**: Détection d'écarts de prix inhabituels entre territoires.

**Méthode**: Comparaison du prix territorial avec le prix de référence France hexagonale.

**Calcul**:
```
Écart (%) = (Prix territoire - Prix France) / Prix France × 100
```

**Seuils par défaut**:
- 🔵 **LOW**: ≥ 10% d'écart
- 🟠 **MEDIUM**: ≥ 20% d'écart
- 🔴 **HIGH**: ≥ 30% d'écart

**Exemple**:
- Prix France hexagonale: 10,00€
- Prix Martinique: 13,50€
- Écart: +35% → Anomalie HIGH détectée

**Limitations**:
- Ne tient pas compte des coûts de transport (fret maritime, octroi de mer)
- Ne tient pas compte des différences structurelles (économie insulaire)
- Peut être normale pour certains produits

**Important**: Les écarts territoriaux documentés par l'INSEE et les OPMR peuvent atteindre +30-40% pour certains produits, en raison de facteurs structurels connus.

---

### 3. Outliers Statistiques

**Principe**: Détection de valeurs statistiquement aberrantes par rapport à un ensemble de prix.

**Méthode**: Analyse Z-score (nombre d'écarts-types par rapport à la moyenne).

**Calcul**:
```
Moyenne = Σ Prix / Nombre de prix
Écart-type = √(Σ(Prix - Moyenne)² / Nombre de prix)
Z-score = |Prix - Moyenne| / Écart-type
```

**Seuils par défaut**:
- 🟠 **MEDIUM**: Z-score ≥ 2 (au-delà de 2 écarts-types)
- 🔴 **HIGH**: Z-score ≥ 3 (au-delà de 3 écarts-types)

**Exemple**:
- Prix observés: [10,00€, 10,10€, 10,05€, 10,15€, 25,00€]
- Moyenne: 13,06€
- Écart-type: 5,97€
- Z-score pour 25,00€: 2,00 → Anomalie MEDIUM détectée

**Limitations**:
- Nécessite au moins 3 observations
- Sensible aux petits échantillons
- Peut être normale si différences de conditionnement

---

## Cadre Légal et Transparence

### Disclaimers Obligatoires

Sur toute interface affichant des anomalies, les mentions suivantes doivent apparaître:

> "Les anomalies sont détectées par des règles statistiques simples.
> Elles n'impliquent aucune infraction ni jugement.
> Une anomalie peut avoir des causes légitimes (coûts de transport, variations saisonnières, promotions, etc.)."

### Interdictions Absolues

❌ Ne jamais utiliser les termes suivants sans contexte approprié:
- "Abus"
- "Arnaque"
- "Fraude"
- "Prix abusif"
- "Spéculation"
- Tout terme accusatoire ou juridique

✅ Utiliser plutôt:
- "Variation inhabituelle"
- "Écart statistique"
- "Valeur atypique"
- "Différence observée"

---

## Configuration et Paramétrage

### Seuils Modifiables

Les seuils sont **configurables** et peuvent être ajustés selon:
- Le type de produit (alimentaire, énergie, etc.)
- La période de l'année (saisonnalité)
- Le contexte économique (inflation, crise)
- Les retours citoyens

### Audit et Traçabilité

Chaque détection est enregistrée avec:
- ✅ Date et heure de détection
- ✅ Méthode utilisée
- ✅ Seuils appliqués
- ✅ Données sources
- ✅ Version du service

---

## Limites et Précautions

### Ce que cette détection N'EST PAS

❌ Une preuve d'infraction
❌ Une recommandation d'achat
❌ Un jugement de valeur
❌ Un système d'"intelligence artificielle"

### Ce que cette détection EST

✅ Un outil d'observation statistique
✅ Une aide à la compréhension
✅ Un signal factuel
✅ Une méthode transparente et auditable

---

## Références Techniques

### Algorithmes Utilisés

1. **Variation temporelle**: Comparaison séquentielle simple
2. **Écart territorial**: Ratio de prix
3. **Outliers**: Méthode Z-score (écarts-types)

### Bibliographie

- ISO 7870-2:2013 - Cartes de contrôle statistique
- NIST/SEMATECH e-Handbook of Statistical Methods
- INSEE - Méthodologie de l'indice des prix à la consommation

---

## Évolutions Futures

### Version 1.0.0 (actuelle)
- Détection temporelle, territoriale et outliers
- Seuils configurables
- Interface citoyenne

### Version 1.1.0 (prévue)
- Ajustement saisonnier
- Comparaison par catégorie de produit
- Prise en compte du contexte (promotion, fin de série)

### Version 2.0.0 (future)
- Analyse de tendance à moyen terme
- Détection de ruptures structurelles
- Alertes citoyennes personnalisées

---

## Contact et Signalements

Pour toute question sur la méthodologie ou signalement d'anomalie:
- 📧 Email: contact@akiprisaye.fr
- 🌐 Site: https://akiprisaye.fr

**Date de dernière mise à jour**: Janvier 2026
**Version du document**: 1.0.0
