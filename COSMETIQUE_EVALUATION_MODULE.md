# Module d'Évaluation Cosmétique

## Vue d'ensemble

Le module d'évaluation cosmétique permet d'analyser la composition d'un produit cosmétique à partir de sa liste INCI (International Nomenclature of Cosmetic Ingredients) en utilisant **uniquement des sources de données officielles**.

## Sources de données officielles

### 1. CosIng (EU Cosmetic Ingredients Database)
- **URL**: https://ec.europa.eu/growth/tools-databases/cosing/
- **Description**: Base de données officielle de la Commission Européenne des ingrédients cosmétiques
- **Contenu**: Nomenclature INCI, fonctions, numéros CAS/EINECS, restrictions réglementaires

### 2. Règlement (CE) n° 1223/2009
- **URL**: https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223
- **Description**: Règlement du Parlement européen et du Conseil relatif aux produits cosmétiques
- **Annexes importantes**:
  - Annexe II: Substances interdites
  - Annexe III: Substances soumises à restrictions
  - Annexe IV: Colorants autorisés
  - Annexe V: Conservateurs autorisés
  - Annexe VI: Filtres UV autorisés

### 3. ANSES (Agence nationale de sécurité sanitaire)
- **URL**: https://www.anses.fr/
- **Description**: Agence française de sécurité sanitaire
- **Utilisation**: Évaluations de risques, recommandations

### 4. ECHA (European Chemicals Agency)
- **URL**: https://echa.europa.eu/
- **Description**: Agence européenne des produits chimiques
- **Utilisation**: Informations sur les substances chimiques, classifications

## Méthodologie de scoring

### Système de notation transparent

Le score est calculé selon une méthodologie objective basée sur les niveaux de risque des ingrédients:

#### Points attribués par niveau de risque:
- **LOW (Risque faible)**: +10 points
- **MODERATE (Risque modéré)**: +5 points  
- **HIGH (Attention requise)**: 0 point
- **RESTRICTED (Restreint)**: -5 points
- **PROHIBITED (Interdit/Très restreint)**: -10 points

#### Formule de calcul:
```
Score = (Points totaux / Points maximum possibles) × 100
```

Où:
- Points totaux = Somme des points de tous les ingrédients
- Points maximum possibles = Nombre d'ingrédients × 10

#### Interprétation du score:
- **80-100**: Excellent - Composition majoritairement sûre
- **60-79**: Bon - Composition globalement acceptable
- **40-59**: Acceptable - Nécessite attention
- **0-39**: À surveiller - Présence de substances préoccupantes

## Niveaux de risque

### LOW (Risque faible)
Ingrédients couramment utilisés, bien documentés, sans restrictions particulières.

**Exemples**: AQUA (eau), GLYCERIN (glycérine), NIACINAMIDE (vitamine B3)

### MODERATE (Risque modéré)
Ingrédients autorisés avec certaines précautions ou restrictions d'usage. Peut être irritant pour certaines peaux sensibles.

**Exemples**: PHENOXYETHANOL (conservateur limité à 1%), METHYLPARABEN (limité à 0,4%)

### HIGH (Attention requise)
Ingrédients nécessitant une attention particulière, potentiellement allergènes ou irritants pour certaines populations.

### RESTRICTED (Restreint)
Substances soumises à des restrictions strictes selon le Règlement CE 1223/2009 (Annexe III).

**Exemple**: FORMALDEHYDE (limité à 0,2%)

### PROHIBITED (Interdit/Très restreint)
Substances interdites (Annexe II) ou très fortement restreintes.

## Avertissements générés

Le système génère automatiquement des avertissements selon le contenu:

### Niveau Erreur (🔴)
- Présence de substances interdites ou très fortement restreintes

### Niveau Avertissement (🟡)
- Substances soumises à restrictions réglementaires
- Substances nécessitant une attention particulière

### Niveau Information (🔵)
- Substances avec restrictions d'usage
- Présence de parfum (allergènes potentiels)

## Utilisation du module

### Interface utilisateur

1. **Saisie du produit**:
   - Nom du produit
   - Catégorie (crème, shampoing, etc.)
   - Liste INCI complète (copiée depuis l'emballage)

2. **Analyse**:
   - Identification automatique des ingrédients
   - Calcul du score transparent
   - Génération des avertissements

3. **Résultats**:
   - Score global sur 100
   - Décomposition par niveau de risque
   - Liste détaillée des ingrédients avec:
     - Nom INCI et nom commun
     - Fonction(s) cosmétique(s)
     - Numéros CAS/EINECS
     - Niveau de risque
     - Restrictions éventuelles
     - Références réglementaires
     - **Liens vers les sources officielles**

### API de service

```javascript
import { evaluateProduct } from '../services/cosmeticEvaluationService';

const result = evaluateProduct(
  'Ma Crème Hydratante',
  'Crème visage',
  'AQUA, GLYCERIN, NIACINAMIDE, PHENOXYETHANOL'
);

// Result contient:
// - product: informations du produit et ingrédients
// - score: note sur 100
// - scoreBreakdown: détail par niveau de risque
// - warnings: avertissements générés
// - sources: liste des sources officielles utilisées
// - disclaimer: avertissement légal
```

## Avertissement légal

⚠️ **IMPORTANT**: Cette évaluation est basée uniquement sur des données publiques officielles (CosIng, ANSES, ECHA) et le Règlement CE 1223/2009. Elle a un but informatif et éducatif.

**Cette évaluation NE CONSTITUE PAS**:
- Un avis médical
- Une recommandation thérapeutique
- Une garantie d'innocuité absolue
- Une certification de conformité

En cas de doute, consultez un professionnel de santé qualifié.
Les personnes allergiques ou sensibles doivent toujours vérifier la liste complète des ingrédients.

**Aucune affirmation médicale** n'est faite par ce module.
**Données officielles uniquement** - Aucune donnée fictive.

## Limitations

### Ingrédients non reconnus
Si un ingrédient n'est pas dans notre base de données:
- Il est marqué comme "MODERATE" par précaution
- Un lien vers la recherche CosIng est fourni
- L'utilisateur est invité à vérifier manuellement

### Concentrations
Le système ne connaît pas les concentrations exactes (non obligatoires sur l'étiquette INCI), seulement l'ordre d'apparition.

### Interactions
Les interactions entre ingrédients ne sont pas évaluées (données non disponibles publiquement).

### Sensibilités individuelles
Les réactions individuelles peuvent varier. Les personnes sensibles doivent toujours faire un test préalable.

## Base de données d'ingrédients

La base contient actuellement les ingrédients les plus couramment utilisés avec leurs données officielles complètes:
- Solvants (eau, glycérine)
- Conservateurs (phénoxyéthanol, parabènes)
- Filtres UV (dioxyde de titane, oxyde de zinc, avobenzone)
- Émollients (alcools gras, triglycérides)
- Émulsifiants (polysorbates, cétéareth)
- Actifs (vitamines, acide hyaluronique)

**Tous les ingrédients** sont référencés avec:
- Nom INCI officiel
- Numéro CAS (Chemical Abstracts Service)
- Numéro EINECS (European Inventory of Existing Commercial Chemical Substances)
- Fonction(s) cosmétique(s) selon CosIng
- Niveau de risque documenté
- Restrictions réglementaires le cas échéant
- Sources officielles avec URLs

## Mise à jour des données

Les données sont mises à jour régulièrement à partir des sources officielles:
- CosIng pour les nouveaux ingrédients et mises à jour INCI
- EUR-Lex pour les modifications réglementaires
- ANSES pour les nouvelles évaluations

## Tests

Le module dispose de **35 tests unitaires** couvrant:
- Parsing de listes INCI
- Recherche d'ingrédients
- Calcul de scores
- Génération d'avertissements
- Intégrité des données officielles
- Validation du disclaimer

Tous les tests passent avec succès ✅

## Accès

Le module est accessible via l'URL: `/evaluation-cosmetique`

## Support

Pour toute question sur les sources de données ou la méthodologie:
- Consultez le Règlement CE 1223/2009
- Visitez la base CosIng de la Commission Européenne
- Consultez les sites ANSES et ECHA

---

**Développé avec rigueur scientifique et conformité réglementaire**
