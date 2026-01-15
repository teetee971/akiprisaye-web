# 📸 Spécifications Techniques - Recherche de Prix par Photo Produit

**Version**: 1.0  
**Date**: 2026-01-07  
**Statut**: Proposition - À valider avant implémentation  
**PR cible**: Nouvelle PR (après validation)

---

## 🎯 Objectif

Permettre aux citoyens de photographier un produit en magasin et d'obtenir instantanément les prix observés dans leur territoire, transformant l'application en outil terrain utilisable pendant les courses.

**Valeur ajoutée**:
- ✅ Expérience utilisateur comparable à Google Lens / Amazon
- ✅ Collecte passive ET active de données prix
- ✅ Conversion naturelle utilisateur → contributeur
- ✅ Couverture produits accélérée
- ✅ Crédibilité renforcée face aux médias et institutions

---

## 📋 Périmètre Fonctionnel

### MVP (Minimum Viable Product)

#### Fonctionnalités Essentielles
1. **Capture photo produit** (1 à 3 photos)
2. **Détection automatique code-barres** (prioritaire)
3. **Recherche instantanée** dans la base prix existante
4. **Affichage résultats** (prix min/max, enseignes, dates)
5. **Contribution optionnelle** si données manquantes/anciennes

#### Hors Scope MVP
- ❌ Reconnaissance visuelle avancée (logo, packaging) - Phase 2
- ❌ OCR nom produit - Phase 2
- ❌ Détection GPS automatique - Phase 2
- ❌ Historique personnel - Phase 2
- ❌ Détection anomalies en temps réel - Phase 2

---

## 🏗️ Architecture Technique

### Stack Technologique

#### Frontend (React + Vite)
```
src/
├── components/
│   └── ProductPhotoSearch/
│       ├── ProductPhotoSearch.tsx       # Composant principal
│       ├── PhotoCapture.tsx             # Capture/upload photos
│       ├── BarcodeDetector.tsx          # Détection code-barres
│       ├── PriceResults.tsx             # Affichage résultats
│       └── ContributionForm.tsx         # Formulaire contribution
├── services/
│   ├── barcode-detection.ts             # Service détection code-barres
│   └── price-lookup.ts                  # Recherche prix existants
└── types/
    └── product-search.ts                # Types TypeScript
```

#### Compatibilité Cloudflare Pages
- ✅ **100% client-side** (pas de backend requis pour MVP)
- ✅ Utilisation d'APIs navigateur natives
- ✅ Dépendances légères et maîtrisées
- ✅ Build Vite standard

---

## 🔧 Options Techniques

### 1. Détection Code-Barres

#### Option A: `@zxing/browser` (Recommandée pour MVP)
**Avantages**:
- ✅ Pure JavaScript, fonctionne dans le navigateur
- ✅ Support EAN-13, UPC-A, EAN-8, Code-128
- ✅ ~200KB gzippé
- ✅ Actif et maintenu
- ✅ Licence Apache 2.0

**Inconvénients**:
- ⚠️ Performance variable selon luminosité
- ⚠️ Nécessite photos de qualité

**Installation**:
```bash
npm install @zxing/browser @zxing/library
```

**Exemple d'utilisation**:
```typescript
import { BrowserMultiFormatReader } from '@zxing/browser';

const codeReader = new BrowserMultiFormatReader();
const result = await codeReader.decodeFromImageElement(imageElement);
console.log(result.getText()); // EAN-13: "3274080005003"
```

#### Option B: Barcode Detection API (Future)
**Avantages**:
- ✅ API native navigateur (Chrome/Edge)
- ✅ Performance optimale
- ✅ Aucune dépendance

**Inconvénients**:
- ❌ Support limité (Chrome/Edge uniquement en 2026)
- ❌ Pas de fallback Safari/Firefox

**Stratégie**: Garder en veille pour migration future

---

### 2. Capture Photo

#### Approche Recommandée: Input File + Camera
```typescript
// Permet upload fichier OU capture directe
<input 
  type="file" 
  accept="image/jpeg,image/png,image/webp"
  capture="environment"  // Ouvre caméra directement sur mobile
  multiple                // Jusqu'à 3 photos
/>
```

**Avantages**:
- ✅ Compatible tous navigateurs
- ✅ UX native mobile
- ✅ Pas de dépendance lourde
- ✅ Gestion permissions automatique

---

### 3. Recherche Prix Existants

#### Intégration avec Base Existante
```typescript
// Utilise l'index observations existant
import observations from '/data/observations/index.json';

interface PriceLookupResult {
  produit: string;
  ean?: string;
  prix_min: number;
  prix_max: number;
  prix_median: number | null;
  enseignes: string[];
  derniereMAJ: string;
  nb_observations: number;
  territoire: string;
}

function lookupPricesByEAN(
  ean: string, 
  territoire: string
): PriceLookupResult | null {
  const matches = observations.filter(obs => 
    obs.territoire === territoire &&
    obs.produits.some(p => p.ean === ean)
  );
  
  if (matches.length === 0) return null;
  
  // Calcul min/max/median...
  return result;
}
```

---

## 🎨 Parcours Utilisateur (UX)

### Étape 1: Point d'Entrée

**Modification Hub "Contribuer"**:
```
Que souhaitez-vous faire ?

[🧾] Scanner un ticket de caisse
     Analyser un ticket complet

[📦] Rechercher un prix produit    ← NOUVEAU
     Photographier un produit

[🏷️] Scanner une étiquette
     Analyser ingrédients/composition
```

---

### Étape 2: Capture Photos

**UI Proposée**:
```
┌─────────────────────────────────┐
│  📸 Photographier le produit    │
├─────────────────────────────────┤
│                                 │
│  Prenez 1 à 3 photos :          │
│  • Face du produit              │
│  • Code-barres (si visible)     │
│  • Étiquette prix (optionnel)   │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │  Photo 1 │  │ [+Ajouter]│    │
│  │  [Image] │  │          │    │
│  └──────────┘  └──────────┘    │
│                                 │
│  [ Analyser les photos ]        │
│                                 │
└─────────────────────────────────┘
```

**Messages utilisateur**:
- ℹ️ "L'identification est automatique et peut être approximative"
- ⚠️ "Pour de meilleurs résultats, assurez-vous que le code-barres est visible"

---

### Étape 3: Détection & Recherche

**Indicateur de progression**:
```
🔍 Recherche en cours...

✓ Photo 1 analysée
✓ Code-barres détecté: 3274080005003
✓ Recherche dans la base prix...
```

**Si code-barres non détecté**:
```
⚠️ Code-barres non détecté

Vous pouvez :
• Reprendre une photo plus nette
• Saisir le code-barres manuellement
• Rechercher par nom de produit
```

---

### Étape 4: Affichage Résultats

**Résultats trouvés**:
```
┌─────────────────────────────────┐
│  📦 Cidre Loïc Raison 75cl      │
│  EAN: 3274080005003             │
├─────────────────────────────────┤
│  💰 Prix observés - Guadeloupe  │
│                                 │
│  Prix minimum:  3,29 €          │
│  Prix maximum:  3,89 €          │
│  Prix médian:   3,54 €          │
│                                 │
│  📊 8 observations              │
│  📍 Enseignes: U express, Carrefour│
│  📅 Dernière MAJ: Il y a 2 jours│
│                                 │
│  [🔍 Voir le détail]            │
│                                 │
│  🟢 Données récentes            │
└─────────────────────────────────┘

💡 Le prix que vous constatez est différent ?
   [ Ajouter mon observation ]
```

**Aucune donnée**:
```
┌─────────────────────────────────┐
│  📦 Produit identifié           │
│  EAN: 3274080005003             │
├─────────────────────────────────┤
│  🔴 Aucune donnée disponible    │
│                                 │
│  Soyez le premier à contribuer !│
│                                 │
│  Prix constaté: [____] €        │
│  Enseigne: [___________]        │
│  Commune: [____________]        │
│                                 │
│  [ Ajouter ce prix ]            │
│                                 │
└─────────────────────────────────┘
```

**Données anciennes**:
```
┌─────────────────────────────────┐
│  📦 Cidre Loïc Raison 75cl      │
├─────────────────────────────────┤
│  💰 Dernier prix connu          │
│                                 │
│  3,54 €                         │
│  U express, Morne-à-l'Eau       │
│                                 │
│  🟡 Données anciennes           │
│  📅 Dernière MAJ: Il y a 45 jours│
│                                 │
│  💡 Ces données ne sont peut-être│
│     plus d'actualité            │
│                                 │
│  [ Mettre à jour le prix ]      │
└─────────────────────────────────┘
```

---

### Étape 5: Contribution (Optionnelle)

**Formulaire simplifié**:
```
┌─────────────────────────────────┐
│  ➕ Ajouter une observation     │
├─────────────────────────────────┤
│  Produit: Cidre Loïc Raison 75cl│
│  EAN: 3274080005003             │
│                                 │
│  Prix constaté: [3,54] €        │
│                                 │
│  Enseigne: [U express ▼]        │
│  Commune: [Morne-à-l'Eau ▼]     │
│                                 │
│  ☐ Joindre photo ticket (optionnel)│
│                                 │
│  [ Annuler ]  [ Ajouter ]       │
└─────────────────────────────────┘
```

**Confirmation**:
```
✅ Merci pour votre contribution !

Votre observation a été ajoutée à l'observatoire
et sera visible publiquement après validation.

[ Rechercher un autre produit ]
[ Retour à l'accueil ]
```

---

## 🔒 Garde-Fous & Conformité

### Mentions Légales Obligatoires

**Affichage permanent (footer du module)**:
```
ℹ️ Les résultats affichés proviennent de données citoyennes agrégées.
   Aucune garantie de disponibilité en magasin ni d'exactitude en temps réel.
   Cet outil est fourni à titre informatif uniquement.
```

### RGPD & Données Personnelles

#### Données Collectées
- ✅ **Photos produit**: Traitées localement, NON stockées (sauf si ticket joint)
- ✅ **Code-barres**: Données publiques (EAN)
- ✅ **Prix/Enseigne/Commune**: Données agrégées, non personnelles
- ✅ **Territoire**: Sélection manuelle utilisateur

#### Données NON Collectées
- ❌ **Géolocalisation GPS** (sauf opt-in explicite en Phase 2)
- ❌ **Identité utilisateur** (contribution anonyme)
- ❌ **Métadonnées photos** (EXIF stripped)

#### Conformité
```typescript
// Strip EXIF metadata avant traitement
import piexif from 'piexifjs';

function removeExifData(imageDataUrl: string): string {
  return piexif.remove(imageDataUrl);
}
```

---

### Avertissements Utilisateur

**Message au lancement**:
```
📸 Recherche par photo

Cette fonctionnalité utilise la caméra de votre appareil
pour détecter automatiquement les codes-barres.

• Les photos ne sont PAS envoyées à un serveur
• Le traitement est 100% local (dans votre navigateur)
• Aucune donnée personnelle n'est collectée

[ J'ai compris ]
```

---

## 🧪 Stratégie de Test

### Tests Unitaires (Vitest)

```typescript
// src/services/__tests__/barcode-detection.test.ts
describe('BarcodeDetection', () => {
  it('should detect EAN-13 from image', async () => {
    const mockImage = createMockImage('ean13-sample.jpg');
    const result = await detectBarcode(mockImage);
    expect(result).toBe('3274080005003');
  });

  it('should return null if no barcode detected', async () => {
    const mockImage = createMockImage('no-barcode.jpg');
    const result = await detectBarcode(mockImage);
    expect(result).toBeNull();
  });
});

// src/services/__tests__/price-lookup.test.ts
describe('PriceLookup', () => {
  it('should find prices by EAN and territory', () => {
    const result = lookupPricesByEAN('3274080005003', 'Guadeloupe');
    expect(result).toMatchObject({
      prix_min: expect.any(Number),
      prix_max: expect.any(Number),
      nb_observations: expect.any(Number)
    });
  });

  it('should return null if no data found', () => {
    const result = lookupPricesByEAN('0000000000000', 'Guadeloupe');
    expect(result).toBeNull();
  });
});
```

### Tests Manuels

**Checklist Validation**:
- [ ] Upload photo depuis galerie (Android/iOS)
- [ ] Capture photo directe (Android/iOS)
- [ ] Détection code-barres (EAN-13, EAN-8, UPC-A)
- [ ] Affichage résultats avec données
- [ ] Affichage "aucune donnée"
- [ ] Affichage "données anciennes"
- [ ] Formulaire contribution
- [ ] Messages d'erreur clairs
- [ ] Performance < 2s (détection + recherche)
- [ ] Responsive mobile/desktop

---

## 📈 Métriques de Succès

### KPIs à Suivre (Phase 2)

1. **Adoption**:
   - Nombre de recherches photo/jour
   - % utilisateurs revenant à la fonctionnalité

2. **Performance Technique**:
   - Taux de détection code-barres réussie
   - Temps moyen détection + recherche

3. **Contribution**:
   - % recherches → contribution
   - Nombre nouveaux produits ajoutés

4. **Qualité Données**:
   - % produits avec ≥3 observations
   - Fraîcheur moyenne données (jours)

---

## 🚀 Plan de Déploiement

### Phase 1: MVP (Semaine 1-2)
1. Setup composant React + routing
2. Implémentation capture photo
3. Intégration `@zxing/browser`
4. Service recherche prix existants
5. UI résultats + contribution
6. Tests + documentation

### Phase 2: Améliorations (Semaine 3-4)
1. Optimisation performance détection
2. Gestion multi-photos intelligente
3. Cache recherches récentes
4. Analytics basiques

### Phase 3: Évolutions (Futur)
1. Reconnaissance visuelle (ML.js / TensorFlow.js)
2. OCR nom produit (Tesseract.js)
3. Détection GPS opt-in
4. Historique personnel
5. Détection anomalies en temps réel

---

## 💰 Estimation Charge

### Développement MVP
- **Setup + Architecture**: 4h
- **Capture Photo + UI**: 6h
- **Détection Code-Barres**: 8h
- **Recherche Prix + Intégration**: 6h
- **UI Résultats + Contribution**: 8h
- **Tests + Debug**: 8h
- **Documentation**: 4h

**Total**: ~44h (1 semaine développeur expérimenté)

### Maintenance Continue
- **Monitoring performance**: 2h/mois
- **Ajustements UX**: 4h/mois
- **Évolutions mineures**: 8h/mois

---

## ⚠️ Risques & Mitigations

### Risques Techniques

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Détection code-barres peu fiable | Élevé | Moyen | Guide utilisateur + retry + saisie manuelle |
| Performance mobile faible | Moyen | Faible | Optimisation images + lazy loading |
| Incompatibilité navigateurs | Faible | Faible | Feature detection + fallback |
| Absence données produit | Élevé | Élevé | UX contribution facile + messaging clair |

### Risques Légaux

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| RGPD (données photos) | Élevé | Faible | Traitement 100% local + pas de stockage |
| Garantie prix affichés | Élevé | Moyen | Disclaimers clairs + données citoyennes |
| Responsabilité données erronées | Moyen | Moyen | Modération + signalement + CGU |

---

## 📚 Dépendances Requises

### NPM Packages

```json
{
  "dependencies": {
    "@zxing/browser": "^0.1.4",
    "@zxing/library": "^0.20.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0"
  }
}
```

**Taille Bundle Impact**: ~220KB gzippé (acceptable)

---

## 🔗 Intégration avec Modules Existants

### 1. Base Observations
```typescript
// Réutilise l'infrastructure existante
import { Observation, Product } from '@/schemas/observation';
import observations from '/data/observations/index.json';

// Aucune modification schema requise
// Ajout champ optionnel "ean" sur Product (déjà présent)
```

### 2. Sélecteur Territoire
```typescript
// Réutilise le sélecteur territoire existant
import { TerritoireSelector } from '@/components/TerritoireSelector';

// Le territoire sélectionné filtre les résultats
```

### 3. Services Comparaison
```typescript
// Réutilise les fonctions de calcul prix
import { calculatePriceStats } from '@/services/comparison';

// Permet affichage cohérent min/max/median
```

---

## ✅ Checklist Validation Avant Implémentation

### Validation Fonctionnelle
- [ ] Périmètre MVP validé par @teetee971
- [ ] Parcours utilisateur approuvé
- [ ] Mentions légales validées

### Validation Technique
- [ ] Architecture compatible Cloudflare Pages
- [ ] Dépendances approuvées (taille, licence)
- [ ] Plan de tests validé

### Validation Éthique
- [ ] Conformité RGPD
- [ ] Transparence données
- [ ] Pas de notation commerciale
- [ ] Contribution citoyenne respectée

---

## 📞 Points de Contact

**Questions Techniques**: @copilot  
**Validation Fonctionnelle**: @teetee971  
**Documentation**: `docs/SPEC_PHOTO_PRODUCT_SEARCH.md`

---

## 📝 Historique des Versions

| Version | Date | Auteur | Changements |
|---------|------|--------|-------------|
| 1.0 | 2026-01-07 | @copilot | Spécifications initiales MVP |

---

## 🎬 Prochaines Étapes

1. ✅ **Validation spécifications** par @teetee971
2. ⏳ **Création issue GitHub** avec référence à ce document
3. ⏳ **Création branche** `feature/photo-product-search`
4. ⏳ **Développement MVP** (44h estimées)
5. ⏳ **Code review + tests**
6. ⏳ **Merge dans main**
7. ⏳ **Déploiement production**

---

**Note Importante**: Cette fonctionnalité ne sera implémentée qu'après validation explicite de ces spécifications. La PR actuelle (observatoire + ingestion + open-data) reste indépendante et peut être mergée sans attendre.
