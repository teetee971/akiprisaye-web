# ⚠️ AVERTISSEMENT CRITIQUE - DONNÉES NON OFFICIELLES

**Date:** 2025-12-17

## 🔴 ÉTAT ACTUEL DES DONNÉES

**TOUTES les données actuellement présentes dans ce projet sont des DONNÉES DE DÉMONSTRATION.**

Elles ne doivent **PAS** être utilisées en production ou pour des décisions réelles.

## ✅ RÈGLE ABSOLUE DU PROJET

A KI PRI SA YÉ n'utilise QUE :
- ✅ Des données publiques officielles
- ✅ Des données observées terrain clairement étiquetées
- ❌ AUCUNE donnée simulée
- ❌ AUCUNE extrapolation chiffrée

## 📊 SOURCES OFFICIELLES AUTORISÉES

### Prix & Consommation
- **INSEE** - https://www.insee.fr
  - Indice des prix à la consommation (IPC)
  - Panier de consommation
  - Différences DOM / Hexagone

- **Observatoires des prix (OPMR)**
  - Guadeloupe
  - Martinique
  - Guyane
  - La Réunion
  - Mayotte
  - Publications préfectorales (PDF officiels)

- **DGCCRF** - https://www.economie.gouv.fr/dgccrf
  - Études de prix
  - Rapports "vie chère"

### Revenus de Référence
- **Service Public** - https://www.service-public.fr
  - SMIC net (Ministère du Travail)
  
- **CAF** - https://www.caf.fr
  - RSA
  - Minimum vieillesse (ASPA)

### Transport / Énergie
- **Prix Carburants** - https://www.prix-carburants.gouv.fr
  - Prix carburants en temps réel

## 📁 FICHIERS À REMPLACER

Tous les fichiers JSON dans `src/data/` contiennent actuellement des données de démonstration :

| Fichier | Statut | Action Requise |
|---------|--------|----------------|
| `ievr-data.json` | ⚠️ Démonstration | Remplacer par données INSEE + OPMR |
| `budget_reference.json` | ⚠️ Démonstration | Remplacer par données CAF + Service-public |
| `budget-vital.json` | ⚠️ Démonstration | Remplacer par données INSEE |
| `produits_formats.json` | ⚠️ Démonstration | Remplacer par relevés OPMR |
| `prices-history.json` | ⚠️ Démonstration | Remplacer par historique OPMR |
| `faux-bons-plans.json` | ⚠️ Démonstration | Remplacer par relevés terrain sourcés |
| `iev_r_reference.json` | ⚠️ Démonstration | Remplacer par calculs basés INSEE |

## 🔧 FORMAT REQUIS POUR DONNÉES OFFICIELLES

Chaque donnée DOIT inclure :

```json
{
  "valeur": 1234.56,
  "source": "INSEE",
  "date": "2025-12-01",
  "lien": "https://www.insee.fr/fr/statistiques/...",
  "territoire": "Guadeloupe",
  "note": "Indice des prix à la consommation"
}
```

## ⚖️ CONSÉQUENCES SI DONNÉES NON OFFICIELLES

- ❌ Perte de crédibilité juridique
- ❌ Non exploitable par médias
- ❌ Non auditable
- ❌ Ne peut pas devenir référence officielle
- ❌ Risque de contestation

## ✅ BÉNÉFICES AVEC DONNÉES OFFICIELLES

- ✅ Juridiquement solide
- ✅ Reprenable par des médias
- ✅ Auditable
- ✅ Peut devenir référence officielle
- ✅ Crédibilité maximale

## 🚀 PROCHAINES ÉTAPES

1. **Identifier** les données officielles disponibles pour chaque module
2. **Télécharger** les publications officielles (PDF, CSV, API)
3. **Extraire** les données avec métadonnées (source, date, lien)
4. **Structurer** au format JSON avec traçabilité complète
5. **Afficher** la source sous chaque chiffre dans l'UI
6. **Si données absentes** → Afficher "Donnée non disponible"

## 📝 RÈGLE D'AFFICHAGE UI

**SI** donnée source manquante → **ALORS** :
- ❌ NE PAS calculer l'indicateur
- ❌ NE PAS afficher de graphique
- ✅ Afficher : "⚠️ Donnée non disponible - En attente de source officielle"
- ✅ Proposer lien pour contribuer/signaler une source

## 🔒 ENGAGEMENT

**PRIORITÉ ABSOLUE À LA CRÉDIBILITÉ, même si cela réduit le périmètre fonctionnel.**

---

**Document établi le:** 2025-12-17  
**Dernière révision:** 2025-12-17  
**Statut:** CRITIQUE - À APPLIQUER IMMÉDIATEMENT
