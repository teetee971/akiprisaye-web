# 🌀 Comparateur Préparation Cyclones & Catastrophes Naturelles

## Vue d'ensemble

Le **Comparateur Préparation Cyclones** est un outil de résilience conçu pour sauver des vies dans les territoires ultramarins français exposés aux cyclones. Il fournit des informations essentielles pour se préparer, réagir et se remettre des catastrophes naturelles.

## 🎯 Objectifs

- **Accessibilité financière** : Comparateur de prix pour kits de survie
- **Prévention des oublis** : Checklist interactive complète
- **Sécurité** : Localisation des refuges officiels
- **Anticipation** : Intégration des alertes Météo France
- **Solidarité** : Réseau d'entraide communautaire
- **Apprentissage** : Base de données historique des cyclones

## 📍 Accès

Le comparateur est accessible via plusieurs routes :

- `/preparation-cyclones` (route principale)
- `/cyclones` (raccourci)
- `/resilience-cyclone` (descriptif)

Navigation intégrée :
- **Comparateurs Hub** : Section dédiée aux outils de comparaison
- **Solidarité Hub** : Section entraide et résilience

## 🛠️ Architecture

### Types TypeScript (`src/types/cycloneComparison.ts`)

15+ interfaces et types couvrant :
- `SurvivalKitItem` : Articles de kit de survie
- `PreparednessChecklist` : Checklist de préparation
- `Shelter` : Refuges et centres d'hébergement
- `CycloneAlert` : Alertes et vigilances cycloniques
- `CycloneHistory` : Historique des cyclones
- `SolidarityOffer` : Offres d'entraide

### Services

#### `survivalKitService.ts`
- Gestion des articles essentiels
- Calcul du budget par taille de foyer
- Comparaison des prix entre enseignes
- Filtrage par catégorie et priorité

```typescript
calculateKitBudget(householdSize: 4, territory: 'GP', prices: [...])
// → { totalBudget: 250, items: [...], byCategory: {...} }
```

#### `preparednessService.ts`
- Gestion des checklists avant/pendant/après
- Calcul du score de préparation (0-100%)
- Recommandations personnalisées
- Sauvegarde en local storage

```typescript
const checklist = getChecklistByPhase('before');
const score = calculatePreparednessScore(checklist); // 75%
```

#### `shelterService.ts`
- Liste des refuges par territoire
- Recherche des refuges les plus proches
- Calcul de distance (Haversine)
- Mise à jour du statut en temps réel

```typescript
getNearestShelters([16.2415, -61.5331], maxDistance: 20)
// → [{ shelter, distance: 5.2 }, ...]
```

#### `cycloneAlertService.ts`
- Gestion des alertes Météo France
- Système de vigilance (vert → violet)
- Notifications push (structure)
- Abonnements par territoire

```typescript
const alert = await getCurrentAlerts('GP');
// → { vigilance: 'orange', cycloneName: 'Maria', ... }
```

### Données (`public/data/survival-kit-prices.json`)

Structure complète incluant :
- **24 articles essentiels** avec quantités par personne
- **4 refuges** (Guadeloupe, Martinique, Réunion)
- **3 cyclones historiques** (Irma, Maria, Chido)
- **Templates de checklist** pour les 3 phases

## 🎨 Interface Utilisateur

### Page Principale (`CyclonePreparation.tsx`)

#### 1. Bannière de Vigilance
```tsx
<header style={{ backgroundColor: vigilanceColor }}>
  <AlertTriangle />
  {getVigilanceText(currentAlert.vigilance)}
</header>
```
- Couleurs dynamiques selon niveau de vigilance
- Affichage du nom du cyclone si applicable
- Informations Météo France

#### 2. Checklist Interactive
- 11 tâches essentielles (phase "avant")
- Score de préparation en temps réel (0-100%)
- Indicateurs de priorité (critique, high, medium, low)
- Sauvegarde automatique en localStorage

```tsx
<div className="checklist">
  {items.map(item => (
    <ChecklistItem 
      key={item.id}
      item={item}
      onToggle={() => handleToggle(item.id)}
    />
  ))}
  <ProgressBar score={75} />
</div>
```

#### 3. Kit de Survie
- Affichage des articles essentiels
- Calcul par taille de foyer (1-10 personnes)
- Budget estimé (150-300€)
- Priorisation visuelle (essential, important, recommended)

#### 4. Carte des Refuges
- Liste géolocalisée des refuges
- Informations détaillées :
  - Capacité d'accueil
  - Équipements (lits, douches, cuisine, générateur, médical)
  - Accessibilité PMR
  - Animaux acceptés
  - Contact téléphone
- Statut temps réel (ouvert/fermé)

#### 5. Historique des Cyclones
- Données d'impact (morts, blessés, dégâts)
- Leçons apprises
- Trajectoires
- Filtrage par territoire

#### 6. Réseau Solidaire
- Placeholder pour offres d'entraide
- Types : hébergement, eau, nourriture, transport, équipement

## 💾 Stockage Local

Données sauvegardées dans `localStorage` :
- `checklist-before` : Checklist phase avant
- `checklist-during` : Checklist phase pendant
- `checklist-after` : Checklist phase après
- `alert-subscriptions-{userId}` : Abonnements aux alertes
- `shelter-status-{shelterId}` : Statut des refuges
- `cyclone-notifications` : Historique des notifications

## 🧪 Tests

Tests unitaires complets pour `preparednessService` :
```bash
npm test -- src/services/__tests__/preparednessService.test.ts
```

13 tests couvrant :
- ✅ Génération des checklists par phase
- ✅ Calcul du score de préparation
- ✅ Toggle des items
- ✅ Sauvegarde/chargement
- ✅ Recommandations personnalisées
- ✅ Export en texte

## 📊 Données Réelles

### Cyclones Majeurs Inclus

#### Irma (2017)
- Catégorie 5
- 11 morts, 130 blessés
- 1,2 milliards € de dégâts
- 4 500 maisons détruites

#### Maria (2017)
- Catégorie 5
- 5 morts, 89 blessés
- 650 millions € de dégâts
- 2 200 maisons détruites

#### Chido (2024)
- Catégorie 4
- 39 morts, 1 400 blessés
- 800 millions € de dégâts
- 3 800 maisons détruites

### Articles Essentiels

**Eau** : 10 bouteilles 1.5L/personne (15L total)
**Nourriture** : Conserves, riz, pâtes (3-7 jours)
**Énergie** : Lampes, piles, radio, bougies
**Sécurité** : Trousse premiers secours, masques
**Protection** : Bâches, ruban adhésif, cordes
**Documents** : Pochette étanche

## 🔒 Sécurité

- Pas de stockage de données personnelles côté serveur
- Utilisation de localStorage uniquement
- Pas de tracking utilisateur
- Données ouvertes et transparentes
- Conformité RGPD

## 🚀 Évolutions Futures

### Phase 2 (court terme)
- [ ] Intégration API Météo France réelle
- [ ] Notifications push natives
- [ ] Carte interactive Leaflet pour refuges
- [ ] Export PDF de la checklist
- [ ] Mode hors-ligne complet (PWA)

### Phase 3 (moyen terme)
- [ ] Comparateur assurances catastrophes naturelles
- [ ] Simulateur coût reconstruction
- [ ] Plus de refuges (crowdsourcing)
- [ ] Formulaire de contribution citoyenne
- [ ] Système de partage checklist famille

### Phase 4 (long terme)
- [ ] Application mobile native
- [ ] Intégration avec alertes préfecture
- [ ] Partenariats enseignes pour prix réels
- [ ] Base de données artisans reconstruction
- [ ] Analyse prédictive trajectoires

## 📱 Responsive Design

Interface optimisée pour :
- Desktop (> 1024px)
- Tablette (768-1024px)
- Mobile (< 768px)

Design mobile-first avec :
- Grilles flexibles (grid)
- Composants empilables
- Touch-friendly (taille minimum 44x44px)
- Performance optimisée

## 🎓 Méthodologie

Basée sur :
- Données Météo France
- Rapports Sénat catastrophes naturelles DOM-TOM
- Retours d'expérience Irma, Maria, Chido
- Recommandations Croix-Rouge et Secours Populaire
- Standards internationaux de résilience

## 📞 Support

Pour toute question ou suggestion :
- Issues GitHub
- Contact via formulaire A KI PRI SA YÉ
- Email communautaire

## 📄 Licence

Données ouvertes sous licence compatible avec la mission de service public de transparence des prix.

---

**Ce comparateur PEUT SAUVER DES VIES.**

Innovation unique : Premier outil citoyen de résilience cyclonique complet en France 🇫🇷🌀
