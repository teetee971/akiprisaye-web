# ROADMAP D'EXTENSION GÉOGRAPHIQUE

**A KI PRI SA YÉ - Observatoire de la vie chère**

Version: 1.0  
Date: 2025-12-17

---

## 🎯 VISION

Transformer A KI PRI SA YÉ d'un observatoire DOM-TOM en un **observatoire national puis européen** de données publiques sur le coût de la vie.

**Principe immuable:** Données réelles uniquement, aucune simulation.

---

## 📊 PHASES D'EXTENSION

### ✅ PHASE 0: DOM-TOM (ACTUEL)

**Status:** Structure créée, en attente données officielles

**Périmètre:**
- Guadeloupe
- Martinique
- Guyane
- La Réunion
- Mayotte
- Nouvelle-Calédonie
- Polynésie française

**Sources:**
- OPMR (Observatoires locaux)
- INSEE (IPC DOM)
- CAF/Service-public (revenus référence)

**Critères de succès:**
- [ ] Au moins 3 territoires avec données OPMR officielles
- [ ] IPC INSEE intégré pour tous les DOM
- [ ] Revenus référence validés

**Timeline:** Q1 2026

---

### 🔵 PHASE 1: HEXAGONE (13 RÉGIONS)

**Objectif:** Étendre l'observatoire aux 13 régions métropolitaines

**Périmètre:**
1. Auvergne-Rhône-Alpes
2. Bourgogne-Franche-Comté
3. Bretagne
4. Centre-Val de Loire
5. Corse
6. Grand Est
7. Hauts-de-France
8. Île-de-France
9. Normandie
10. Nouvelle-Aquitaine
11. Occitanie
12. Pays de la Loire
13. Provence-Alpes-Côte d'Azur

**Sources autorisées:**
- **INSEE** - IPC régional, revenus médians, dépenses contraintes
- **DREES** - Dépenses santé (si publiées par région)
- **Ministère Transition écologique** - Données énergie
- **Prix-carburants.gouv.fr** - Prix carburants régionaux

**Données clés:**
- IPC par région
- Revenus médians
- Prix de l'énergie
- Loyers moyens (si données officielles disponibles)

**Structure de données:**
```
src/data/hexagone/
  ├── ile_de_france.json          ✅ Template créé
  ├── provence_alpes_cote_azur.json
  ├── auvergne_rhone_alpes.json
  └── [autres régions]
```

**UI attendue:**
- Sélecteur DOM/Hexagone
- Carte de France interactive par région
- Comparaison DOM ↔ Hexagone
- Sources visibles sous chaque valeur

**Critères de succès:**
- [ ] Templates JSON pour les 13 régions
- [ ] IPC INSEE intégré pour au moins 5 régions
- [ ] Carte France interactive opérationnelle
- [ ] Comparateur DOM/Hexagone fonctionnel

**Risques:**
| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Données régionales incomplètes | Moyenne | Élevé | Afficher "Donnée non disponible" |
| Comparabilité DOM/Hexagone | Faible | Moyen | Méthodologie harmonisée INSEE |
| Hétérogénéité données régionales | Moyenne | Moyen | Documenter différences |

**Timeline:** Q2-Q3 2026

---

### 🇪🇺 PHASE 2: EUROPE (PAYS COMPARABLES)

**Objectif:** Étendre à l'échelle européenne avec données harmonisées

**Périmètre initial:**
1. France (déjà couvert)
2. Belgique
3. Allemagne
4. Espagne
5. Portugal
6. Italie

**Extension future (si données disponibles):**
- Pays-Bas
- Luxembourg
- Autriche
- Grèce

**Sources autorisées:**
- **Eurostat** - HICP (Indice harmonisé), niveaux de prix, revenus médians
- **Instituts statistiques nationaux** (liens officiels uniquement)
  - Destatis (Allemagne)
  - INE (Espagne)
  - INE (Portugal)
  - ISTAT (Italie)
  - Statbel (Belgique)

**Données clés:**
- HICP (Harmonised Index of Consumer Prices)
- Niveaux de prix comparatifs (UE27=100)
- Revenus médians en PPA (Parité Pouvoir d'Achat)

**Structure de données:**
```
src/data/europe/
  ├── france.json                 ✅ Template créé
  ├── belgique.json
  ├── allemagne.json
  ├── espagne.json
  ├── portugal.json
  └── italie.json
```

**Règles de comparabilité:**
- ✅ Comparaison UNIQUEMENT si année identique
- ✅ Utiliser HICP (méthodologie harmonisée)
- ✅ Exprimer en PPA pour les comparaisons monétaires
- ❌ AUCUNE conversion artificielle
- ❌ Afficher "Donnée non comparable" si nécessaire

**UI attendue:**
- Carte Europe interactive
- Sélecteur multi-niveaux: DOM / Régions / Pays
- Comparateur avec notes de comparabilité
- Warning si années différentes

**Critères de succès:**
- [ ] Templates JSON pour 6 pays
- [ ] Données HICP Eurostat intégrées
- [ ] Système de comparabilité opérationnel
- [ ] Carte Europe interactive
- [ ] Warnings automatiques si données non comparables

**Risques:**
| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Hétérogénéité méthodologique | Moyenne | Élevé | Utiliser uniquement HICP harmonisé |
| Délais publication Eurostat | Faible | Moyen | Documenter dates de publication |
| Langues multiples | Élevée | Faible | Interface en français, sources multilingues |
| Comparabilité contestée | Faible | Élevé | Documentation méthodologique exhaustive |

**Timeline:** Q4 2026 - Q1 2027

---

### 🔓 PHASE 3: API LECTURE SEULE

**Objectif:** Ouvrir les données via API publique pour réutilisation

**Périmètre:**
- Lecture seule (GET uniquement)
- Toutes les données officielles intégrées
- Métadonnées complètes (sources, dates, liens)

**Format API:**
```
GET /api/v1/dom/{territoire}
GET /api/v1/hexagone/{region}
GET /api/v1/europe/{pays}
GET /api/v1/compare?territories=GP,MQ,75
```

**Documentation:**
- OpenAPI/Swagger
- Exemples d'utilisation
- Limites de taux
- Licence de réutilisation

**Critères de succès:**
- [ ] API REST déployée
- [ ] Documentation complète
- [ ] Rate limiting configuré
- [ ] Monitoring mis en place
- [ ] Au moins 3 réutilisations externes

**Timeline:** Q2 2027

---

## 📋 CRITÈRES DÉCISIONNELS PAR PHASE

### Disponibilité des Données

| Phase | Sources requises | Disponibilité | GO/NO-GO |
|-------|------------------|---------------|----------|
| DOM | OPMR + INSEE | ✅ Confirmée | ✅ GO |
| Hexagone | INSEE régional | ✅ Confirmée | ✅ GO |
| Europe | Eurostat HICP | ✅ Confirmée | ✅ GO |
| API | Toutes ci-dessus | ⏳ En cours | ⏳ Conditionnel |

### Comparabilité Statistique

| Niveau | Méthodologie | Comparabilité | Status |
|--------|--------------|---------------|--------|
| DOM ↔ DOM | OPMR + INSEE | Élevée | ✅ OK |
| DOM ↔ Hexagone | INSEE IPC | Élevée | ✅ OK |
| Hexagone ↔ Hexagone | INSEE régional | Élevée | ✅ OK |
| France ↔ Europe | HICP Eurostat | Moyenne (harmonisé) | ⚠️ Avec notes |
| Europe ↔ Europe | HICP | Élevée | ✅ OK |

### Risque Juridique

| Extension | Risque juridique | Niveau | Mitigation |
|-----------|------------------|--------|------------|
| DOM | Très faible | 🟢 | Sources officielles uniquement |
| Hexagone | Très faible | 🟢 | INSEE données publiques |
| Europe | Faible | 🟡 | Eurostat + instituts nationaux |
| API | Moyen | 🟡 | Licence claire, attribution sources |

---

## 🎯 IMPACT & VALEUR

### Par Phase

| Phase | Impact citoyen | Valeur médiatique | Réutilisation institutionnelle |
|-------|----------------|-------------------|--------------------------------|
| DOM | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Hexagone | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Europe | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| API | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### Positionnement Stratégique

**Après Phase 1 (Hexagone):**
- Observatoire national de référence
- Utilisable par médias nationaux
- Outil pour débat public national

**Après Phase 2 (Europe):**
- Observatoire européen unique en son genre
- Référence pour comparaisons internationales
- Outil de politique publique européenne

**Après Phase 3 (API):**
- Infrastructure de données publiques
- Écosystème de réutilisations
- Standard de fait pour données coût de la vie

---

## 📊 RESSOURCES REQUISES

### Par Phase

| Phase | Dev (mois) | Data (sources) | Infrastructure | Budget estimé |
|-------|------------|----------------|----------------|---------------|
| DOM | 2 | 5-7 sources | Cloudflare Pages | Minimal |
| Hexagone | 3 | INSEE régional | +CDN | Faible |
| Europe | 4 | Eurostat + 6 pays | +API Gateway | Moyen |
| API | 2 | Existantes | +Monitoring | Moyen |

---

## ✅ CHECKLIST DE VALIDATION PAR PHASE

### Phase 1 (Hexagone) - GO Criteria

- [ ] Templates JSON créés pour 13 régions
- [ ] Données INSEE IPC disponibles et accessibles
- [ ] Méthodologie harmonisation DOM/Hexagone validée
- [ ] UI carte France développée
- [ ] Tests avec données réelles réussis
- [ ] Documentation méthodologique mise à jour
- [ ] Dossier média national préparé

### Phase 2 (Europe) - GO Criteria

- [ ] Accès Eurostat API confirmé
- [ ] Méthodologie HICP documentée
- [ ] Système comparabilité développé
- [ ] UI carte Europe développée
- [ ] Tests multi-pays réussis
- [ ] Documentation comparabilité finalisée
- [ ] Partenariats instituts nationaux explorés

### Phase 3 (API) - GO Criteria

- [ ] Volumes de données suffisants (toutes phases)
- [ ] Infrastructure API déployée
- [ ] Documentation OpenAPI complète
- [ ] Rate limiting testé
- [ ] Licence réutilisation définie
- [ ] Monitoring opérationnel

---

## 🚀 RÉSULTAT FINAL

**A KI PRI SA YÉ devient:**

✅ **Observatoire DOM-TOM** (Phase 0)  
✅ **Observatoire national** (Phase 1)  
✅ **Observatoire européen** (Phase 2)  
✅ **Infrastructure de données publiques** (Phase 3)

**Toujours avec:**
- 100% données officielles
- 0% simulation ou extrapolation
- Traçabilité totale
- Neutralité absolue
- Réutilisabilité maximale

---

**Document de planification stratégique**  
**Version:** 1.0  
**Date:** 2025-12-17  
**Statut:** ROADMAP VALIDÉE
