# Système d'Ingestion PDF Officiels

**Objectif :** Transformer des PDF officiels (OPMR / INSEE / DGCCRF) en données JSON exploitables **sans déformation**.

---

## Principe Absolu

**AUCUNE réinterprétation • AUCUNE estimation • AUCUNE transformation statistique**

---

## Processus d'Ingestion

### 1. Chargement du PDF Officiel

```
Entrée : PDF officiel depuis OPMR, INSEE ou DGCCRF
Sortie : Document structuré pour extraction
```

**Métadonnées à capturer :**
- Nom du fichier source
- URL de téléchargement
- Date de publication
- Organisme émetteur
- Territoire concerné
- Type de document

### 2. Extraction des Données

**Éléments à extraire :**
- Tableaux de données
- Dates de référence
- Intitulés exacts (sans reformulation)
- Unités de mesure
- Notes de bas de page
- Sources citées dans le document

**Règles strictes :**
- ✅ Copier la valeur exacte
- ✅ Conserver l'intitulé original
- ✅ Noter le numéro de page
- ❌ Ne PAS arrondir
- ❌ Ne PAS reformuler
- ❌ Ne PAS interpréter

### 3. Gestion des Ambiguïtés

**SI** une valeur est ambiguë (peu lisible, contradictoire, incomplète) :
- → **NE PAS l'extraire**
- → Créer une note dans `metadata.warnings`
- → Signaler pour vérification manuelle

**SI** un tableau est incomplet :
- → Extraire uniquement les données claires
- → Signaler les cellules manquantes
- → Ne PAS compléter avec des estimations

### 4. Structuration JSON

Format de sortie standardisé :

```json
{
  "metadata": {
    "sourceDocument": "rapport_opmr_guadeloupe_2025_12.pdf",
    "sourceURL": "https://www.guadeloupe.gouv.fr/...",
    "datePublication": "2025-12-15",
    "organisme": "OPMR Guadeloupe",
    "territoire": "Guadeloupe",
    "typeDocument": "Rapport mensuel des prix",
    "dateExtraction": "2025-12-17",
    "statut": "OFFICIEL",
    "warnings": []
  },
  "donnees": [
    {
      "produit": "Pain complet 500g",
      "valeur": 2.45,
      "unite": "EUR",
      "dateObservation": "2025-12-01",
      "page": 12,
      "tableau": "Tableau 3 - Produits de première nécessité",
      "note": "Prix moyen observé sur 10 enseignes",
      "contextOriginal": "Pain complet bio de 500g"
    }
  ]
}
```

---

## Cas d'Usage Typiques

### A. Extraction Rapport OPMR

**Document type :** "Rapport mensuel des prix - Guadeloupe - Décembre 2025"

**Contenu exploitable :**
- Tableau des prix moyens par produit
- Évolution mensuelle
- Comparaison avec mois précédent
- Comparaison avec hexagone

**Extraction :**
```json
{
  "produits": [
    {
      "nom": "Riz blanc 1kg",
      "prixMoyen": 3.20,
      "territoire": "Guadeloupe",
      "dateObservation": "2025-12-01",
      "source": "OPMR Guadeloupe - Rapport mensuel",
      "page": 8
    }
  ],
  "comparaisons": [
    {
      "produit": "Riz blanc 1kg",
      "prixGuadeloupe": 3.20,
      "prixHexagone": 2.10,
      "ecart": "+52.4%",
      "source": "OPMR - Tableau comparatif p.15"
    }
  ]
}
```

### B. Extraction Données INSEE

**Document type :** "IPC - Indices des prix à la consommation - DOM"

**Contenu exploitable :**
- Séries temporelles IPC
- Décomposition par catégorie
- Base 100 de référence

**Extraction :**
```json
{
  "series": [
    {
      "territoire": "Martinique",
      "categorie": "Alimentation",
      "indice": 115.3,
      "base": "Base 100 en 2015",
      "periode": "2025-11",
      "source": "INSEE - Bulletin mensuel",
      "numeroSerie": "001763852"
    }
  ]
}
```

### C. Extraction Revenus de Référence

**Document type :** Service-public.fr - SMIC

**Extraction :**
```json
{
  "type": "SMIC net mensuel",
  "valeur": 1398.69,
  "unite": "EUR",
  "dateApplicable": "2025-01-01",
  "source": "Service-public.fr",
  "lienSource": "https://www.service-public.fr/particuliers/vosdroits/F2300",
  "autorite": "Ministère du Travail"
}
```

---

## Outils Techniques Suggérés

### Extraction PDF

**Options :**
1. **pdf.js** (JavaScript) - Pour extraction côté navigateur
2. **PyPDF2** ou **pdfplumber** (Python) - Pour extraction serveur/batch
3. **Tabula** - Spécialisé extraction tableaux

### Validation

**Chaque extraction doit passer par :**
1. Validation du format JSON
2. Vérification présence métadonnées obligatoires
3. Contrôle cohérence des valeurs
4. Détection anomalies (valeurs aberrantes)

---

## Workflow Recommandé

```
1. Télécharger PDF officiel
   ↓
2. Extraire métadonnées du document
   ↓
3. Identifier les tableaux/données
   ↓
4. Extraire valeurs exactes
   ↓
5. Structurer en JSON
   ↓
6. Valider le JSON
   ↓
7. Vérifier manuellement (échantillon)
   ↓
8. Publier dans /src/data/official/
```

---

## Format de Fichier Final

### Nom de Fichier

Convention :
```
{organisme}_{territoire}_{type}_{periode}.json
```

Exemples :
```
opmr_guadeloupe_prix_2025_12.json
insee_martinique_ipc_2025_11.json
caf_reunion_rsa_2025_01.json
```

### Structure

```json
{
  "metadata": { ... },
  "donnees": [ ... ],
  "notes": [ ... ],
  "liens": [ ... ]
}
```

---

## Contrôle Qualité

### Checklist Pré-Publication

- [ ] Source officielle vérifiée
- [ ] URL source accessible
- [ ] Dates cohérentes
- [ ] Unités spécifiées
- [ ] Pages de référence notées
- [ ] Aucune valeur estimée
- [ ] Aucune reformulation
- [ ] Métadonnées complètes
- [ ] JSON valide
- [ ] Échantillon vérifié manuellement

---

## Maintenance

### Mise à Jour

Quand un nouveau rapport officiel est publié :
1. Télécharger le nouveau PDF
2. Extraire selon le processus
3. Versionner le fichier JSON (append-only)
4. Archiver l'ancien
5. Mettre à jour la référence dans le code

### Historisation

Format :
```
/src/data/official/
  /current/
    opmr_guadeloupe_prix_2025_12.json
  /archives/
    opmr_guadeloupe_prix_2025_11.json
    opmr_guadeloupe_prix_2025_10.json
```

---

## Sécurité & Traçabilité

### Hash du Fichier Source

Chaque JSON doit inclure :
```json
{
  "metadata": {
    "sourceFileSHA256": "a3f8b9c2d1e...",
    "sourceFileSize": 2458976
  }
}
```

### Audit Trail

Conserver :
- PDF source original
- JSON extrait
- Logs d'extraction
- Validations effectuées

---

**Document technique**  
**Version :** 1.0  
**Date :** 2025-12-17
