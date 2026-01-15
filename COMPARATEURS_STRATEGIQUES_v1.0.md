# 📊 Comparateurs Stratégiques — Documentation v1.1

## 🎯 Vision & Philosophie

**A KI PRI SA YÉ** implémente une approche citoyenne unique pour les comparateurs de prix et services :

### Principe fondamental : "Observer, pas vendre"
- ✅ **Transparence totale** sur les écarts de prix
- ❌ **Aucune affiliation opaque** avec les opérateurs
- ✅ **Données sourcées** et vérifiables
- ✅ **Méthodologie documentée** et accessible
- ❌ **Aucune recommandation commerciale**
- ✅ **Visualisations graphiques** pour une meilleure compréhension
- ✅ **Export des données** pour utilisation personnelle

---

## 🥇 PRIORITÉ 1 — TRANSPORTS VITAUX (IMPACT MAXIMUM)

### ✈️ Comparateur de prix des vols

**Route :** `/comparateur-vols` ou `/vols`

#### Pourquoi en premier ?
- Poste de dépense le plus sensible pour les territoires ultramarins
- Sujet médiatique et politique majeur
- Forte variabilité des prix → valeur immédiate pour les citoyens
- ROI citoyen : **TRÈS ÉLEVÉ**

#### Nouvelles fonctionnalités (v1.1)
- 📊 **Visualisations graphiques interactives**
  - Comparaison visuelle des prix par compagnie
  - Graphique des frais supplémentaires
  - Analyse temporelle du moment d'achat
  - Évolution des prix selon l'anticipation
- 📥 **Export des résultats**
  - Format CSV pour tableurs (Excel, Google Sheets)
  - Format texte pour impression ou partage
  - Toutes les statistiques incluses
- 📱 **Interface responsive** optimisée pour mobile

#### Comparaisons incluses :
1. **Prix par route**
   - Prix moyen / min / max par compagnie
   - DOM ↔ Métropole
   - Inter-DOM
   - Régional

2. **Analyse temporelle**
   - Date d'achat vs date de vol
   - Fenêtre d'achat optimale observée
   - Impact des jours avant départ

3. **Analyse saisonnière**
   - Haute saison (vacances)
   - Basse saison
   - Saison intermédiaire
   - Multiplicateur de prix saisonnier

4. **Détails par compagnie**
   - Aéroport de départ/arrivée
   - Durée de vol
   - Escales (direct ou avec escales)
   - Conditions tarifaires (bagages, modification, remboursement)
   - Frais supplémentaires transparents

#### Méthodologie
- **Source :** Observations citoyennes vérifiées
- **Agrégation :** Moyenne pondérée par volume d'observations
- **Mise à jour :** Hebdomadaire
- **Transparence :** Sources visibles pour chaque prix

#### Exemple d'utilisation
```
Route : Pointe-à-Pitre (PTP) → Paris Orly (ORY)
Période : Basse saison
Résultat :
- Prix moyen : 452€
- Prix min (Corsair) : 398€ + 60€ frais → 458€ total
- Prix max (Air France) : 485€
- Fenêtre optimale : 61-90 jours avant départ
- Économie potentielle : jusqu'à 87€ (18%)
```

---

### 🚢 Comparateur de prix des bateaux/ferries

**Route :** `/comparateur-bateaux`, `/bateaux`, ou `/ferries`

#### Pourquoi juste après l'avion ?
- **Indispensable dans les DOM** pour la mobilité inter-îles
- Peu de comparateurs neutres existants
- Données plus stables → fiabilité rapide
- **Crédibilité territoriale forte**

#### Nouvelles fonctionnalités (v1.1)
- 📊 **Visualisations graphiques**
  - Comparaison des prix passagers par opérateur
  - Comparaison des prix véhicules (voiture, moto)
  - Graphiques interactifs et clairs
- 📥 **Export des résultats**
  - Format CSV avec prix passagers et véhicules
  - Format texte avec résumé complet
  - Statistiques de fréquence et capacité
- 📱 **Interface mobile optimisée**

#### Cas d'usage couverts :

1. **Inter-îles** (passagers)
   - Guadeloupe ↔ Martinique
   - Guadeloupe ↔ Saint-Martin
   - Guadeloupe ↔ Saintes, Marie-Galante, Désirade
   - Saint-Martin ↔ Saint-Barthélemy

2. **Transport véhicules**
   - Prix voiture
   - Prix moto
   - Prix van/camion (si disponible)
   - Capacités et disponibilité

3. **Passagers réguliers**
   - Abonnements (si disponibles)
   - Fréquences de service
   - Services quotidiens vs hebdomadaires

#### Comparaisons incluses :
- **Prix passagers** (adulte, enfant)
- **Prix véhicules** par type
- **Durée de traversée**
- **Fréquence** (quotidien, 3x/semaine, etc.)
- **Capacités** (passagers et véhicules)
- **Conditions** (remboursable, modifiable, cabine disponible)
- **Disponibilité** (élevée, moyenne, faible)

#### Méthodologie
- **Source :** Observations citoyennes + données opérateurs
- **Agrégation :** Moyenne simple par route
- **Mise à jour :** Hebdomadaire
- **Transparence :** Sources et dates d'observation visibles

#### Exemple d'utilisation
```
Route : Pointe-à-Pitre → Fort-de-France
Type : Passager + Voiture

Résultat :
Passager seul :
- Prix moyen : 77€
- Prix min (Jeans for Freedom) : 75€
- Prix max (L'Express des Îles) : 79€
- Fréquence : Services quotidiens

Avec véhicule :
- Prix moyen voiture : 180€
- Prix min : 175€
- Prix max : 185€
- Disponibilité : Élevée (réservation recommandée en haute saison)
```

---

## 🥈 PRIORITÉ 2 — ABONNEMENTS ESSENTIELS (PRESSION MENSUELLE)

### 📱 Comparateur Mobile + Internet

**Route :** `/comparateur-telecoms` (à venir)

#### Pourquoi maintenant ?
- **Dépense récurrente mensuelle** impactant tous les foyers
- Écarts énormes DOM / Métropole documentés
- Données publiques disponibles
- Possibilité d'intégrer contributions citoyennes (factures anonymisées)

#### Comparaisons prévues :
1. **Prix réel payé vs prix annoncé**
   - Frais cachés identifiés
   - Coût réel première année
   - Coût réel après promotion

2. **Débit réel vs débit annoncé**
   - Tests de vitesse terrain
   - Taux d'achievement (% du débit annoncé)
   - Par technologie (Fibre, ADSL, 4G box)

3. **Engagement**
   - Durée
   - Frais de résiliation anticipée
   - Options sans engagement

4. **Couverture réelle**
   - Par territoire
   - Par technologie (4G, 5G, Fibre)
   - Taux de couverture population
   - Qualité signalée par utilisateurs

---

### ⚡ Comparateur Électricité / Eau

**Route :** `/comparateur-energie` (à venir)

#### Pourquoi ?
- Sujet **hautement sensible** dans les DOM
- Très peu d'outils pédagogiques disponibles
- Idéal pour **expliquer la formation des prix**
- Excellent pour institutions / presse

#### Approche recommandée :
1. **Tarif réglementé** (comparaison territoriale)
2. **Décomposition des taxes**
3. **Abonnements** par puissance
4. **Évolution dans le temps**
5. **Simulateur de facture** par profil de consommation

---

## 🥉 PRIORITÉ 3 — COÛT DE LA VIE STRUCTUREL

### 🛒 Panier moyen / Produits de base

**Route :** `/comparateur-panier` (à venir)

#### Objectif :
- Montrer **l'inflation réelle locale**
- Comparer territoires entre eux
- Donner des indicateurs simples et compréhensibles

#### Comparaisons prévues :
- Panier alimentaire de base (30 produits essentiels)
- Évolution prix dans le temps
- Écart vs métropole
- Écart inter-DOM

---

### ⛽ Comparateur Carburants

**Route :** `/comparateur-carburants` (à venir)

#### Pourquoi plus tard :
- Données souvent déjà publiées (prix-carburants.gouv.fr)
- Moins différenciant
- Mais bon **complément graphique** à l'observatoire

#### Comparaisons prévues :
- Prix par station et territoire
- Évolution temporelle
- Écart vs métropole
- Écart inter-DOM

---

## 📊 SYNTHÈSE — ORDRE FINAL RECOMMANDÉ

| Rang | Module | Impact | Urgence | Statut |
|------|--------|--------|---------|--------|
| 🥇 1 | ✈️ Avions | 🔥🔥🔥 | Immédiate | ✅ **Implémenté** |
| 🥇 2 | 🚢 Bateaux | 🔥🔥 | Immédiate | ✅ **Implémenté** |
| 🥈 3 | 📱 Internet / Mobile | 🔥🔥 | Court terme | 🚧 En préparation |
| 🥈 4 | ⚡ Énergie / Eau | 🔥🔥 | Court terme | 📋 Planifié |
| 🥉 5 | 🛒 Panier | 🔥 | Moyen | 📋 Planifié |
| 🥉 6 | ⛽ Carburant | 🔥 | Complément | 📋 Planifié |

---

## 🔧 Aspects techniques

### Architecture commune

Tous les comparateurs suivent la même architecture :

```
src/
├── types/
│   ├── flightComparison.ts     # Types vols
│   ├── boatComparison.ts       # Types bateaux
│   └── telecomComparison.ts    # Types télécoms (à venir)
├── services/
│   ├── flightComparisonService.ts
│   ├── boatComparisonService.ts
│   └── telecomComparisonService.ts (à venir)
├── pages/
│   ├── FlightComparator.tsx
│   ├── BoatComparator.tsx
│   └── TelecomComparator.tsx (à venir)
└── data/ (public)
    ├── flight-prices.json
    ├── boat-prices.json
    └── telecom-prices.json (à venir)
```

### Principes de code

1. **Read-only** : Aucune modification de données
2. **TypeScript strict** : Tous les types définis
3. **Agrégation transparente** : Méthodologie documentée
4. **Source tracking** : Chaque donnée a une source
5. **Responsive** : Mobile-first design

### Format des données

Exemple de structure JSON pour les prix :

```json
{
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "ISO 8601",
    "disclaimer": "Observer, pas vendre",
    "methodology": "v1.0.0"
  },
  "prices": [
    {
      "id": "unique-id",
      "operator": "Nom opérateur",
      "route": {...},
      "price": 100.00,
      "source": {
        "type": "user_report",
        "observedAt": "ISO 8601",
        "reliability": "high"
      },
      "verified": true,
      "volume": 10
    }
  ]
}
```

---

## 🎓 Utilisation par les citoyens

### Comment utiliser les comparateurs ?

1. **Sélectionner la route/service**
   - Choisir origine et destination
   - Appliquer des filtres (période, classe, etc.)

2. **Consulter les statistiques**
   - Prix moyen, min, max
   - Écart de prix en %
   - Variation saisonnière (pour vols)
   - Fréquence (pour bateaux)

3. **Comparer les opérateurs**
   - Classement du moins cher au plus cher
   - Conditions tarifaires
   - Frais supplémentaires transparents
   - Services inclus

4. **Comprendre la méthodologie**
   - Sources des données
   - Période d'observation
   - Nombre d'observations
   - Limitations reconnues

### Interprétation des données

**Disclaimer important :**
> Les prix affichés sont des **observations** et peuvent varier. 
> A KI PRI SA YÉ **observe, ne vend pas**.
> Pas de recommandation commerciale, uniquement de la transparence.

**Catégories de prix :**
- 🟢 **Le moins cher** : Prix le plus bas observé
- 🔵 **En dessous de la moyenne** : Prix inférieur de >5% à la moyenne
- ⚪ **Prix moyen** : Prix dans la fourchette ±5% de la moyenne
- 🟠 **Au-dessus de la moyenne** : Prix supérieur de >5% à la moyenne
- 🔴 **Le plus cher** : Prix le plus élevé observé

---

## 📞 Contact & Contribution

### Signaler des données incorrectes
Route : `/signaler-abus`

### Contribuer des observations
Route : `/contribuer-prix`

### Questions sur la méthodologie
Route : `/methodologie`

---

## 📝 Changelog

### v1.1.0 (2026-01-13)
- ✅ **Visualisations graphiques** ajoutées
  - Graphiques interactifs avec Chart.js
  - Comparaison visuelle des prix par compagnie/opérateur
  - Analyse temporelle pour les vols
  - Comparaison des prix véhicules pour les bateaux
- ✅ **Fonctionnalités d'export**
  - Export CSV pour analyse dans Excel/Sheets
  - Export texte formaté pour impression
  - Inclut toutes les statistiques et analyses
- ✅ **Données enrichies**
  - Plus de routes de vols (15 observations vs 10)
  - Plus de routes de bateaux (8 observations vs 6)
  - Couverture améliorée : Cayenne, Réunion, Marie-Galante
  - Compagnie Air Austral ajoutée
  - Opérateur Val'Ferry ajouté
- ✅ **Améliorations UX**
  - Interface responsive optimisée mobile
  - Composants réutilisables
  - Meilleure présentation des données

### v1.0.0 (2026-01-08)
- ✅ Implémentation comparateur vols (DOM ↔ Métropole)
  - Analyse temporelle (moment d'achat)
  - Analyse saisonnière
  - Classement compagnies
  - Frais transparents
- ✅ Implémentation comparateur bateaux/ferries
  - Inter-îles
  - Transport véhicules
  - Fréquences de service
  - Capacités
- 🚧 Préparation comparateur télécoms
  - Types définis
  - Service en cours
- 📋 Planification comparateurs énergie, panier, carburants

---

## 📚 Références

- Méthodologie détaillée : `/methodologie`
- Données publiques : `/donnees-publiques`
- Gouvernance : `/gouvernance`
- À propos : `/a-propos`

---

**A KI PRI SA YÉ** — Observatoire citoyen des prix
*Observer, pas vendre. Transparence, pas affiliation.*

