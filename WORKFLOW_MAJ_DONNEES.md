# Workflow de Mise à Jour Mensuelle des Données

**Objectif:** Mettre à jour les données sans compromettre la crédibilité et la traçabilité.

---

## 🔒 RÈGLES ABSOLUES

1. ✅ **Utiliser UNIQUEMENT des sources officielles**
2. ✅ **Ne JAMAIS modifier une donnée existante**
3. ✅ **Ajouter les nouvelles données en append-only**
4. ✅ **Conserver les anciennes versions**
5. ❌ **Aucune estimation**
6. ❌ **Aucun calcul compensatoire**
7. ❌ **Aucun remplissage automatique**

---

## 📋 PROCESSUS MENSUEL

### Étape 1: Collecte des Sources

**Actions:**
- [ ] Télécharger les nouveaux rapports OPMR (tous territoires)
- [ ] Vérifier publications INSEE IPC du mois
- [ ] Contrôler mises à jour DGCCRF
- [ ] Vérifier changements revenus référence (CAF/Service-public)

**Checklist:**
- [ ] PDF téléchargé et archivé
- [ ] URL source notée
- [ ] Date de publication vérifiée
- [ ] Numéro de version/rapport noté

### Étape 2: Extraction des Données

**Selon:** `INGESTION_PDF_SPEC.md`

**Actions:**
- [ ] Extraire UNIQUEMENT les valeurs explicites
- [ ] Copier les intitulés exacts (sans reformulation)
- [ ] Noter les numéros de pages
- [ ] Capturer les notes de bas de page pertinentes
- [ ] Identifier les tableaux sources

**Règles strictes:**
- ✅ Copier la valeur exacte
- ❌ Ne PAS arrondir
- ❌ Ne PAS interpréter
- ❌ Ne PAS compléter si incomplet

### Étape 3: Création du Nouveau Fichier JSON

**Convention de nommage:**
```
{organisme}_{territoire}_{type}_{YYYY_MM}.json
```

**Exemple:**
```
opmr_guadeloupe_prix_2025_12.json
insee_martinique_ipc_2025_11.json
```

**Structure obligatoire:**
```json
{
  "territoire": "Guadeloupe",
  "organisme": "OPMR Guadeloupe",
  "date_publication": "2025-12-15",
  "source_officielle": "https://www.guadeloupe.gouv.fr/...",
  "document_source": "rapport_opmr_dec_2025.pdf",
  "hash_sha256": "a3f8b9c2...",
  "donnees": [...],
  "licence": "Donnée publique",
  "statut": "OFFICIEL"
}
```

### Étape 4: Validation

**Contrôles automatiques:**
- [ ] JSON valide (syntaxe)
- [ ] Métadonnées complètes (source, date, lien)
- [ ] Aucune valeur null dans les données
- [ ] Hash du fichier source présent

**Contrôles manuels:**
- [ ] Vérifier 5 valeurs aléatoires dans le PDF source
- [ ] Confirmer cohérence avec données précédentes
- [ ] Vérifier unités et formats

### Étape 5: Archivage Version Précédente

**Actions:**
```bash
# Déplacer l'ancienne version
mv src/data/opmr/guadeloupe.json \
   src/data/official/archives/opmr_guadeloupe_2025_11.json

# Copier la nouvelle version
cp nouvelle_extraction/opmr_guadeloupe_2025_12.json \
   src/data/opmr/guadeloupe.json
```

**Vérification:**
- [ ] Ancienne version archivée
- [ ] Nouvelle version en place
- [ ] Historique git committé

### Étape 6: Mise à Jour de l'Index

**Fichier:** `src/data/index.js`

**Actions:**
- [ ] Vérifier que l'export pointe vers le bon fichier
- [ ] Mettre à jour la date de dernière mise à jour
- [ ] Documenter les changements

### Étape 7: Changelog

**Créer une entrée dans:** `CHANGELOG_DONNEES.md`

**Format:**
```markdown
## [2025-12] - 2025-12-17

### Ajouté
- OPMR Guadeloupe - Rapport mensuel décembre 2025
  - Source: https://www.guadeloupe.gouv.fr/...
  - 45 nouveaux prix relevés
  - Panier alimentaire mis à jour

### Modifié
- Aucune modification (append-only)

### Archivé
- OPMR Guadeloupe novembre 2025 → archives/
```

### Étape 8: Tests

**Exécuter:**
```bash
npm run build
npm test
```

**Vérifier:**
- [ ] Build réussi
- [ ] Aucun test cassé
- [ ] Nouvelles données affichées correctement
- [ ] Sources visibles dans l'UI

### Étape 9: Commit & Push

**Git workflow:**
```bash
git add src/data/
git commit -m "feat(data): Mise à jour données officielles décembre 2025

- OPMR Guadeloupe: rapport mensuel
- INSEE: IPC novembre 2025
- Sources: [liens]
"

git push origin main
```

---

## 🚨 GESTION DES CAS PARTICULIERS

### Cas 1: Donnée Manquante dans le Rapport

**SI** une donnée attendue est absente du rapport officiel:
- ❌ Ne PAS inventer de valeur
- ❌ Ne PAS compléter avec la valeur précédente
- ✅ Marquer comme "non_disponible"
- ✅ Noter la raison dans les métadonnées

```json
{
  "intitule": "Prix moyen riz 1kg",
  "valeur": null,
  "statut": "non_disponible",
  "raison": "Donnée non publiée dans le rapport de décembre 2025",
  "page_pdf": null
}
```

### Cas 2: Valeur Ambiguë ou Illisible

**SI** une valeur est difficile à lire ou contradictoire:
- ❌ Ne PAS deviner
- ✅ Marquer comme "verification_requise"
- ✅ Signaler pour validation manuelle

```json
{
  "intitule": "Prix moyen pain",
  "valeur": null,
  "statut": "verification_requise",
  "raison": "Valeur illisible dans le PDF (page 12, tableau 3)",
  "page_pdf": 12
}
```

### Cas 3: Changement de Méthodologie

**SI** le rapport officiel change de méthodologie:
- ✅ Noter le changement dans les métadonnées
- ✅ Documenter dans le changelog
- ✅ Créer une nouvelle série de données si nécessaire

```json
{
  "note_methodologie": "À partir de décembre 2025, l'OPMR inclut 5 nouvelles enseignes dans le relevé",
  "changement": {
    "date": "2025-12",
    "description": "Extension du périmètre d'observation",
    "impact": "Hausse possible des prix moyens due au changement méthodologique"
  }
}
```

---

## 📊 TABLEAU DE BORD DE SUIVI

### Fréquence des Mises à Jour

| Source | Fréquence | Dernière MAJ | Prochaine MAJ |
|--------|-----------|--------------|---------------|
| OPMR Guadeloupe | Mensuelle | - | - |
| OPMR Martinique | Mensuelle | - | - |
| INSEE IPC | Mensuelle | - | - |
| CAF RSA | Annuelle | - | - |
| SMIC | Annuelle | - | - |

### Indicateurs de Qualité

| Critère | Cible | Actuel |
|---------|-------|--------|
| % données avec source | 100% | - |
| % données avec date | 100% | - |
| % données avec lien | 100% | - |
| Délai moyen mise à jour | < 7 jours | - |

---

## 🔄 AUTOMATISATION PARTIELLE

### Scripts Utiles

**Validation automatique:**
```bash
npm run validate-data
```

**Génération changelog:**
```bash
npm run generate-changelog
```

**Vérification liens sources:**
```bash
npm run check-sources
```

---

## ✅ CHECKLIST FINALE

Avant de pousser en production:

- [ ] Toutes les sources sont officielles
- [ ] Aucune donnée estimée ou simulée
- [ ] Métadonnées complètes pour chaque valeur
- [ ] Anciennes versions archivées
- [ ] Changelog mis à jour
- [ ] Tests passent
- [ ] Build réussi
- [ ] Sources visibles dans l'UI
- [ ] Documentation à jour

---

**Document de référence**  
**Version:** 1.0  
**Dernière révision:** 2025-12-17  
**Responsable:** Équipe A KI PRI SA YÉ
