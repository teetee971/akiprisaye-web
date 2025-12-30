# 🏪 MODULE MAGASINS DROM-COM - Documentation Complète

## 📋 Vue d'Ensemble

Le module "Magasins DROM-COM" est un référentiel exhaustif des établissements commerciaux dans les Départements et Régions d'Outre-Mer (DROM) et Collectivités d'Outre-Mer (COM) français.

**Principe fondamental:** **"Aucun magasin affiché sans source vérifiable"**

---

## 🌍 Périmètre Territorial Complet

### DROM (5 territoires)
- ✅ **971** - Guadeloupe (SIRENE ✓)
- ✅ **972** - Martinique (SIRENE ✓)
- ✅ **973** - Guyane (SIRENE ✓)
- ✅ **974** - La Réunion (SIRENE ✓)
- ✅ **976** - Mayotte (SIRENE ✓)

### COM (6 territoires)
- ✅ **975** - Saint-Pierre-et-Miquelon (Sources locales)
- ✅ **977** - Saint-Barthélemy (SIRENE ✓)
- ✅ **978** - Saint-Martin (SIRENE ✓)
- ✅ **986** - Wallis-et-Futuna (STSEE)
- ✅ **987** - Polynésie française (ISPF)
- ✅ **988** - Nouvelle-Calédonie (ISEE)

**AUCUN territoire n'est omis.**

---

## 🔐 Sources Officielles Autorisées

### Sources Principales

| Source | Territoires | URL | Type |
|--------|-------------|-----|------|
| **INSEE SIRENE** | 971-974, 976-978 | https://api.insee.fr | API + fichiers |
| **data.gouv.fr** | 971-978 | https://data.gouv.fr | Open Data |
| **OPMR** | 971-974, 976 | Rapports préfectoraux | PDF officiels |
| **DGCCRF** | Tous DROM | economie.gouv.fr/dgccrf | Rapports |

### Sources Territoriales Spécifiques

| Territoire | Organisme | Raison |
|------------|-----------|--------|
| **988** Nouvelle-Calédonie | ISEE-NC | Pas de SIRENE |
| **987** Polynésie française | ISPF | Pas de SIRENE |
| **986** Wallis-et-Futuna | STSEE | Pas de SIRENE |
| **975** SPM | Sources locales | Couverture limitée |

### ❌ Sources INTERDITES

- Google Maps seul (sans confirmation officielle)
- TripAdvisor, Pages Jaunes
- Listes non sourcées
- Estimations ou suppositions

---

## 📊 Structure des Données

### Format JSON Standardisé

```json
{
  "territoire": "Guadeloupe",
  "code_territoire": "971",
  "statut_territorial": "DROM",
  "magasins": [
    {
      "categorie": "Grande distribution",
      "enseigne": "Carrefour",
      "type_magasin": "Hypermarché",
      "presence": "confirmee | a_confirmer | non_disponible",
      "nombre_etablissements": null,
      "source": {
        "organisme": "INSEE SIRENE",
        "url": "https://...",
        "date_verification": "2025-12-17"
      },
      "remarques": "..."
    }
  ],
  "metadata": {
    "derniere_maj": "2025-12-17",
    "statut_fichier": "template_vide | extraction_sirene | verifie",
    "avertissement": "..."
  }
}
```

### Statuts de Présence

| Statut | Signification | Affichage UI |
|--------|---------------|--------------|
| **confirmee** | Source officielle vérifiée | ✅ Badge vert |
| **a_confirmer** | Extrait SIRENE, à vérifier | ⚠️ Badge jaune |
| **non_disponible** | Donnée absente | ❌ "Donnée non disponible" |

---

## 🏷️ Catégories Normalisées

### Classification Officielle

1. **Grande distribution** - Hypermarchés, chaînes nationales
2. **Supermarché / Hypermarché** - Commerce alimentaire > 400m²
3. **Hard discount** - Prix bas, gamme limitée
4. **Commerce de proximité** - Alimentation < 400m²
5. **Alimentation spécialisée** - Boulangerie, boucherie, etc.
6. **Bricolage / Matériaux** - BTP, jardinage
7. **Électroménager / Multimédia** - High-tech, électroménager
8. **Pharmacie / Parapharmacie** - Santé, hygiène
9. **Carburant / Énergie** - Stations-service
10. **Marchés alimentaires** - Marchés couverts/forains
11. **Commerce indépendant local** - Enseignes locales

### Codes NAF Référencés

```javascript
// Commerce de détail en magasin non spécialisé
'4711A', '4711B', '4711C', '4711D', '4711E', '4711F'
'4719A', '4719B'

// Alimentaire spécialisé
'4721Z', '4722Z', '4723Z', '4724Z', '4725Z', '4726Z', '4729Z'

// Bricolage, quincaillerie
'4752A', '4752B', '4753Z', '4754Z'

// Électroménager, multimédia
'4741Z', '4742Z', '4743Z', '4751Z'

// Pharmacies
'4773Z'

// Carburants
'4730Z'
```

---

## 🔧 Scripts d'Extraction

### Script SIRENE

**Fichier:** `scripts/extract-sirene.js`

**Utilisation:**
```bash
# Extraction territoire spécifique
node scripts/extract-sirene.js 971

# Extraction tous territoires SIRENE
node scripts/extract-sirene.js all

# Afficher l'aide
node scripts/extract-sirene.js
```

**Processus:**
1. Connexion API SIRENE (clé requise)
2. Filtrage codes postaux DROM-COM
3. Filtrage codes NAF commerce
4. Génération JSON avec statut "a_confirmer"
5. **AUCUNE confirmation automatique**

**Prérequis:**
- Clé API INSEE: https://api.insee.fr
- OU fichier SIRENE complet: https://data.gouv.fr

---

## 🎨 Interface Utilisateur

### Page Magasins

**Route:** `/magasins`

**Fonctionnalités:**
- ✅ Sélecteur territoire (DROM/COM)
- ✅ Badge statut (DROM/COM)
- ✅ Liste par catégorie
- ✅ Statuts visuels (confirmé/à confirmer)
- ✅ Bouton "Source officielle"
- ✅ Avertissement "Liste non exhaustive"

**Interdictions UI:**
- ❌ Aucun score ou classement
- ❌ Aucune promesse de complétude
- ❌ Aucun magasin affiché sans source

### Messages d'Avertissement

**Template requis sur chaque page:**
```html
<div class="alert alert-warning">
  ⚠️ Liste non exhaustive - Données en cours de consolidation
  
  Les magasins affichés sont ceux dont la présence est confirmée 
  par des sources officielles (INSEE SIRENE, OPMR, etc.).
  
  Cette liste s'enrichira progressivement.
</div>
```

---

## 🔄 Workflow de Validation

### Processus Complet

1. **Extraction automatique** (SIRENE)
   - Statut: "a_confirmer"
   - Source: INSEE SIRENE
   - Date extraction

2. **Vérification manuelle**
   - Contrôle enseigne réelle
   - Vérification activité
   - Confirmation catégorie

3. **Confirmation sources multiples**
   - SIRENE + OPMR
   - OU SIRENE + site officiel enseigne
   - OU SIRENE + rapport DGCCRF

4. **Mise à jour statut**
   - "a_confirmer" → "confirmee"
   - Ajout URL source complémentaire
   - Mise à jour date_verification

5. **Publication**
   - Commit Git avec changelog
   - Déploiement automatique
   - Historique conservé

---

## 📋 Règles Absolues

### Principes Non Négociables

1. ✅ **Chaque magasin DOIT avoir une source vérifiable**
2. ✅ **Sinon → statut "a_confirmer" ou "non_disponible"**
3. ✅ **Sources autorisées UNIQUEMENT (liste fermée)**
4. ✅ **INTERDIT: Google Maps seul, listes non sourcées**
5. ✅ **UX honnête: "Liste non exhaustive", alertes**
6. ✅ **Évolution incrémentale: Append-only, historisé**

### Règle d'Or

> **"Mieux vaut une liste courte et vraie qu'une liste longue et fausse"**

Application stricte à TOUS les territoires.

---

## 🚀 Intégration Pipeline CI/CD

### Validation Automatique

**Fichier:** `.github/workflows/observatory-pipeline.yml`

**Job ajouté:**
```yaml
validate-stores:
  name: 🏪 Validation Magasins
  runs-on: ubuntu-latest
  steps:
    - name: Validate stores data
      run: node scripts/validate-stores.js
      
    # RÈGLES:
    # - Échec si magasin sans source
    # - Échec si statut incohérent
    # - Échec si URL source invalide
```

**Tests requis:**
- ✅ Schéma JSON valide
- ✅ Champs obligatoires présents
- ✅ Statut cohérent (confirmee → source obligatoire)
- ✅ URL sources valides
- ✅ Dates ISO format

---

## 📊 Métriques de Qualité

### Indicateurs Clés

| Métrique | Cible | Actuel |
|----------|-------|--------|
| % magasins avec source | 100% | Templates |
| % statuts "confirmee" | 80%+ | 0% (normal) |
| Territoires couverts | 11/11 | 11/11 ✅ |
| Mise à jour | Mensuel | À planifier |

### État Actuel

**Territoires:** 11/11 créés (100%) ✅  
**Templates:** 11 fichiers JSON ✅  
**Données confirmées:** 0 (attendu - templates)  
**Script extraction:** Créé, API à implémenter  
**Documentation:** Complète ✅  

---

## 🔮 Prochaines Étapes

### Phase 1: Extraction SIRENE (Priorité 1)
- [ ] Obtenir clé API INSEE
- [ ] Implémenter connexion API dans extract-sirene.js
- [ ] Tester extraction territoire pilote (971)
- [ ] Valider format données extraites

### Phase 2: Vérification Manuelle (Priorité 1)
- [ ] Vérifier échantillon extractions SIRENE
- [ ] Croiser avec OPMR Guadeloupe
- [ ] Confirmer enseignes réelles
- [ ] Mettre à jour statuts "confirmee"

### Phase 3: Extension Territoriale (Priorité 2)
- [ ] Extraction 972-974, 976-978
- [ ] Sources ISEE, ISPF, STSEE pour COM
- [ ] Consolidation multi-sources
- [ ] Publication progressive

### Phase 4: UI et API (Priorité 3)
- [ ] Créer page /magasins
- [ ] Intégrer sélecteur territoire
- [ ] API publique /api/magasins/:code
- [ ] Extension navigateur

---

## 📞 Support et Contribution

**Documentation:** Ce fichier + METHODOLOGIE_OFFICIELLE_v2.0.md  
**Scripts:** `/scripts/extract-sirene.js`  
**Données:** `/src/data/magasins/*.json`  
**Validation:** `/scripts/validate-stores.js` (à créer)  

**Principe:** Transparence totale, auditabilité complète, neutralité absolue.

---

**🏪 MODULE MAGASINS DROM-COM - READY FOR DATA INTEGRATION**
