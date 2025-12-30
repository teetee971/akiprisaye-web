# MÉTHODOLOGIE IEVR - VERSION 1.0

**Indice d'Écart de Vie Réelle (IEVR)**

Document officiel - Version 1.0.0 - Décembre 2025

---

## 1. DÉFINITION

L'**Indice d'Écart de Vie Réelle (IEVR)** est un indicateur synthétique mesurant la difficulté réelle de vivre dans un territoire donné, en tenant compte des coûts incompressibles et d'un revenu standard de référence.

**Identifiant officiel :** `IEVR-FR-v1.0`

---

## 2. RÉFÉRENCE NATIONALE

**Territoire de référence :** France métropolitaine (Hexagone)

**Score de référence :** 100

### Interprétation

- **Score = 100** : Coût de la vie équivalent à la référence
- **Score < 100** : Vivre y est plus difficile (coûts plus élevés par rapport aux revenus)
- **Score > 100** : Vivre y est plus facile (coûts plus faibles par rapport aux revenus)

---

## 3. CATÉGORIES ET PONDÉRATIONS

L'IEVR est calculé à partir de **5 catégories de coûts incompressibles**, pondérées comme suit :

| Catégorie | Pondération | Description |
|-----------|-------------|-------------|
| **Alimentation essentielle** | 40% | Panier alimentaire de base (produits essentiels) |
| **Hygiène** | 15% | Produits d'hygiène et de soins personnels |
| **Transport courant** | 15% | Coûts de déplacement quotidien |
| **Énergie / Eau** | 15% | Électricité, eau, gaz |
| **Autres coûts incompressibles** | 15% | Autres dépenses essentielles non évitables |

**Total :** 100%

### Justification des pondérations

- **Alimentation (40%)** : Premier poste de dépense incompressible
- **Autres catégories (15% chacune)** : Répartition équilibrée des autres coûts essentiels

---

## 4. FORMULE DE CALCUL

```
IEVR = Σ (Score_catégorie × Pondération_catégorie)
```

### Exemple de calcul

Pour un territoire avec les scores suivants :
- Alimentation : 65
- Hygiène : 68
- Transport : 72
- Énergie : 70
- Autres : 67

```
IEVR = (65 × 0.40) + (68 × 0.15) + (72 × 0.15) + (70 × 0.15) + (67 × 0.15)
IEVR = 26 + 10.2 + 10.8 + 10.5 + 10.05
IEVR = 67.55 ≈ 68
```

---

## 5. LABELS AUTOMATIQUES

Des labels descriptifs sont automatiquement attribués selon le score :

| Score IEVR | Label | Signification |
|------------|-------|---------------|
| ≥ 90 | **Situation normale** | Écart faible avec la référence |
| 75 à 89 | **Sous tension** | Écart notable nécessitant une vigilance |
| < 75 | **Forte tension** | Écart important nécessitant une attention particulière |

---

## 6. SOURCES DE DONNÉES

Les données utilisées pour calculer l'IEVR proviennent de :

1. **Relevés terrain** : Observations citoyennes encadrées
2. **Données publiques** : Statistiques officielles disponibles
3. **Historiques internes** : Base de données versionnée

**Format de stockage :** JSON versionné (append-only pour traçabilité)

---

## 7. FRÉQUENCE DE MISE À JOUR

- **Calcul mensuel** de l'IEVR
- **Publication** : Premier jour du mois suivant
- **Historisation** : Conservation de tous les scores précédents

---

## 8. PRINCIPES DÉONTOLOGIQUES

### Ce que l'IEVR EST :

✅ Un indicateur factuel et chiffré

✅ Une mesure comparative entre territoires

✅ Un outil de transparence citoyenne

✅ Une base de dialogue constructif


### Ce que l'IEVR N'EST PAS :

❌ Une accusation envers des enseignes

❌ Une prédiction de l'évolution future

❌ Un classement punitif

❌ Un outil polémique


---

## 9. REPRODUCTIBILITÉ

Cette méthodologie est **publique, stable et reproductible**.

Toute entité peut :
- Appliquer les mêmes pondérations
- Utiliser les mêmes formules
- Obtenir des résultats comparables

**Code source :** Disponible sur GitHub avec licence open source

---

## 10. VERSIONNEMENT

**Version actuelle :** 1.0.0

**Date de publication :** Décembre 2025

**Modifications majeures nécessitant changement de version :**
- Modification des pondérations
- Ajout/suppression de catégories
- Changement de la référence nationale

**Modifications mineures (patch) :**
- Corrections typographiques
- Clarifications méthodologiques
- Mises à jour de données

---

## 11. CONTACT

**Projet :** A KI PRI SA YÉ

**Site web :** [URL du projet]

**Email :** [contact]

---

## 12. LICENCE

Cette méthodologie est publiée sous licence **Creative Commons BY-SA 4.0**.

Vous êtes libre de :
- Partager et adapter ce document
- À condition de créditer l'auteur et de partager dans les mêmes conditions

---

**Document officiel - Ne pas modifier sans autorisation**

**Dernière révision :** 2025-12-17
