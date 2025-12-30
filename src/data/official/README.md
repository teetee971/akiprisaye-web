# Structure des Données Officielles

Ce répertoire contient **UNIQUEMENT** des données extraites de sources officielles.

## ⚠️ RÈGLE ABSOLUE

**Aucun fichier ne peut être placé ici sans :**
1. Une source officielle vérifiable
2. Des métadonnées complètes (source, date, lien)
3. Une validation de l'extraction

## Structure

```
/official/
  /current/          ← Données actuelles en production
  /archives/         ← Historique des données (append-only)
```

## Format Requis

Chaque fichier JSON doit suivre le template :

```json
{
  "metadata": {
    "sourceDocument": "nom_du_pdf_officiel.pdf",
    "sourceURL": "https://source-officielle.fr/...",
    "datePublication": "YYYY-MM-DD",
    "organisme": "INSEE|OPMR|DGCCRF|CAF",
    "territoire": "Nom du territoire",
    "typeDocument": "Type de publication",
    "dateExtraction": "YYYY-MM-DD",
    "statut": "OFFICIEL",
    "warnings": []
  },
  "donnees": [...]
}
```

## Processus d'Ajout

1. Obtenir le document source officiel (PDF, CSV, API)
2. Extraire selon la spécification (voir INGESTION_PDF_SPEC.md)
3. Valider le JSON
4. Vérifier manuellement un échantillon
5. Placer dans `/current/`
6. Archiver la version précédente dans `/archives/`

## Sources Autorisées

- ✅ INSEE (www.insee.fr)
- ✅ OPMR (Observatoires prix DOM)
- ✅ DGCCRF (economie.gouv.fr/dgccrf)
- ✅ CAF (www.caf.fr)
- ✅ Service-public.fr
- ❌ Toute autre source non officielle

## Vérification

Avant utilisation en production, chaque fichier doit :
- [ ] Avoir une source officielle vérifiable
- [ ] Contenir des métadonnées complètes
- [ ] Être validé JSON
- [ ] Avoir été vérifié manuellement (échantillon)
- [ ] Ne contenir AUCUNE donnée estimée ou simulée

---

**Date de création :** 2025-12-17  
**Responsable :** Équipe A KI PRI SA YÉ
