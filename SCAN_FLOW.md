# Documentation du Flux de Scan Unifié (SCAN_FLOW.md)

## 📋 Vue d'ensemble

Le flux de scan unifié fusionne proprement le module de comparaison de prix avec les fonctionnalités de scan (EAN, photo produit, ticket OCR) pour créer un parcours utilisateur unique, cohérent et progressif.

### Objectifs

- ✅ Un seul point d'entrée pour scanner un produit
- ✅ Progression automatique en 3 étapes (Capture → Comprendre → Comparer)
- ✅ Réutilisation maximale des composants existants
- ✅ Aucune duplication de logique
- ✅ Conformité RGPD stricte (pas de stockage serveur, données locales uniquement)
- ✅ Messages clairs sur limites et fiabilité

## 🏗️ Architecture

### Composants principaux

1. **ScanFlowContext** (`src/context/ScanFlowContext.tsx`)
   - Provider React Context pour partager l'état du flux
   - Gestion des 3 étapes du parcours
   - Stockage du contexte produit scanné
   - Aucune persistance serveur (mémoire uniquement)

2. **ScanFlow** (`src/pages/ScanFlow.tsx`)
   - Page principale du flux unifié
   - Point d'entrée unique avec choix de méthode
   - Indicateur de progression visuel
   - Redirection automatique vers le comparateur

3. **ScanEAN** (modifié) (`src/pages/ScanEAN.tsx`)
   - Support du mode "unified flow" via paramètres URL
   - Intégration avec ScanFlowContext
   - Mise à jour du contexte après scan réussi

4. **EnhancedComparator** (modifié) (`src/pages/EnhancedComparator.tsx`)
   - Accepte les paramètres de scan depuis l'URL
   - Affiche le contexte scanné (source, confiance, prix de référence)
   - Badge de fiabilité selon la méthode de scan

### Types et interfaces

```typescript
// ScannedProductContext - Objet intermédiaire après capture et compréhension
interface ScannedProductContext {
  source: 'ean' | 'photo' | 'ticket'
  ean?: string
  rawText?: string
  detectedPrice?: number
  detectedStore?: string
  detectedDate?: string
  confidenceScore: number  // 0-100
  productName?: string
  timestamp: Date
}
```

## 🔄 Flux utilisateur

### Étape 1: CAPTURE

**Page:** `/scanner-produit`

L'utilisateur choisit sa méthode de scan:

1. **Code-barres (caméra)**
   - Méthode la plus rapide et fiable (95%+ confiance)
   - Redirection vers `/scan-ean?flow=unified`
   - Détection automatique via BarcodeDetector ou ZXing

2. **Photo produit**
   - OCR expérimental (75% confiance)
   - Validation utilisateur obligatoire
   - Redirection vers `/scan-ean?flow=unified&mode=photo`
   - Extraction du code EAN via OCR (Tesseract.js)

3. **Ticket de caisse**
   - OCR avec limites (60-80% confiance selon qualité)
   - Extraction prix + enseigne + produit
   - Redirection vers `/scan?flow=unified`

### Étape 2: COMPRÉHENSION

**Phase automatique (non visible par l'utilisateur)**

1. Normalisation des données issues du scan
2. Identification du produit (recherche dans catalogue public)
3. Création de l'objet `ScannedProductContext`
4. Validation du niveau de confiance

### Étape 3: COMPARAISON

**Redirection automatique:** `/comparateur-intelligent?ean=XXX&source=YYY&confidence=ZZZ`

Le comparateur affiche:
- Prix scanné comme référence (si disponible)
- Comparaison avec autres enseignes
- Badge de fiabilité selon source
- Historique de prix
- Actions: créer alerte, voir historique, signaler anomalie

## 🎯 Routes et navigation

### Routes existantes (conservées)

- `/scan-ean` - Scanner code-barres (mode standalone)
- `/scan` - Scanner ticket OCR (mode standalone)
- `/comparateur-intelligent` - Comparateur de prix (mode standalone)

### Nouvelle route

- `/scanner-produit` - Point d'entrée du flux unifié

### Paramètres URL

**ScanEAN en mode unifié:**
```
/scan-ean?flow=unified&mode=photo
```

**Comparateur avec contexte scanné:**
```
/comparateur-intelligent?ean=3017620422003&source=ean&confidence=95&referencePrice=1.95&referenceStore=Carrefour
```

## 💾 Gestion des données

### Principes RGPD

- ❌ **Aucune donnée stockée côté serveur**
- ❌ **Aucune écriture dans la base publique**
- ✅ **Stockage en mémoire uniquement** (React Context)
- ✅ **Données effacées à la fermeture de la page**
- ✅ **Historique local optionnel** (localStorage, contrôlé par utilisateur)

### Flux de données

```
Scan caméra/photo/ticket
    ↓
Extraction EAN/texte (local, navigateur)
    ↓
ScannedProductContext (mémoire React)
    ↓
Passage en paramètres URL
    ↓
Comparateur (lecture seule, données publiques)
```

## 🔒 Sécurité et conformité

### Validation des données

- ✅ Validation checksum EAN-8 et EAN-13
- ✅ Sanitisation des entrées OCR
- ✅ Limite de taille pour texte OCR (max 10KB)
- ✅ Timeout sur traitement OCR (30s max)

### Messages utilisateur

Tous les messages sont clairs sur les limites:

- **Code-barres:** "Détection automatique rapide et fiable (95%+)"
- **Photo produit:** "OCR expérimental, validation utilisateur obligatoire"
- **Ticket:** "OCR avec limites selon qualité (60-80% fiabilité)"
- **Comparateur:** "Prix informatifs et non contractuels"

## 🧪 Tests

### Tests unitaires

```bash
npm test -- src/context/ScanFlowContext.test.tsx
npm test -- src/types/scanFlow.test.ts
```

### Tests d'intégration

1. Flux complet code-barres
2. Flux complet photo produit
3. Flux complet ticket OCR
4. Redirection correcte vers comparateur
5. Affichage contexte dans comparateur

### Tests manuels requis

- [ ] Scanner un code-barres avec caméra
- [ ] Uploader une photo de code-barres
- [ ] Scanner un ticket de caisse
- [ ] Vérifier affichage contexte dans comparateur
- [ ] Tester sur mobile (iOS + Android)
- [ ] Vérifier messages de limites/fiabilité

## 📱 UX/UI

### Design patterns

- **Progressive disclosure:** Une seule action principale visible
- **Clear feedback:** Indicateur de progression à chaque étape
- **Error recovery:** Messages pédagogiques en cas d'échec
- **Accessibility:** ARIA labels, navigation clavier, contraste WCAG AA

### Responsive

- ✅ Mobile-first (touch targets 44px min)
- ✅ Tablette (grilles adaptatives)
- ✅ Desktop (colonnes multiples)

## 🚀 Déploiement

### Prérequis

- Node.js 20 LTS
- React 18.3+
- React Router 7+
- Tesseract.js 6+ (OCR)
- @zxing/library (codes-barres)

### Build

```bash
npm run build
```

### Variables d'environnement

Aucune variable d'environnement requise (fonctionnement 100% client).

## 📊 Métriques et monitoring

### Événements trackés (local uniquement)

- Choix de méthode de scan
- Succès/échec détection
- Temps de traitement OCR
- Redirection vers comparateur
- Niveau de confiance moyen

### Aucune télémétrie externe

Conformément aux principes du projet, aucune donnée n'est envoyée à des services tiers.

## 🔧 Maintenance

### Points d'attention

1. **Performance OCR:** Tesseract.js peut être lent sur mobile bas de gamme
2. **Compatibilité caméra:** Vérifier permissions sur tous navigateurs
3. **Qualité scan:** Limites OCR dépendent de l'éclairage et netteté

### Dépendances critiques

- `tesseract.js` - OCR
- `@zxing/library` - Codes-barres
- `react-router-dom` - Navigation
- `lucide-react` - Icônes

## 📖 Exemples d'utilisation

### Intégration dans d'autres pages

```tsx
import { Link } from 'react-router-dom'

// Bouton pour lancer le flux unifié
<Link to="/scanner-produit">
  <button>📷 Scanner un produit</button>
</Link>
```

### Utilisation du contexte

```tsx
import { useScanFlow } from '../context/ScanFlowContext'

function MyComponent() {
  const { scannedProduct, currentStep, updateScannedProduct } = useScanFlow()
  
  // Accès au produit scanné
  if (scannedProduct) {
    console.log('EAN:', scannedProduct.ean)
    console.log('Confiance:', scannedProduct.confidenceScore)
  }
}
```

## 🎓 Bonnes pratiques

### À faire ✅

- Utiliser le flux unifié pour une expérience cohérente
- Afficher les badges de confiance selon la source
- Proposer la saisie manuelle en fallback
- Éduquer l'utilisateur sur les limites OCR

### À éviter ❌

- Ne pas stocker de données personnelles
- Ne pas promettre une fiabilité de 100%
- Ne pas écrire dans la base publique
- Ne pas dupliquer la logique de scan

## 📞 Support et questions

Pour toute question sur l'implémentation du flux unifié:

1. Consulter ce document
2. Vérifier les commentaires dans le code source
3. Créer une issue GitHub avec le tag `scan-flow`

---

**Version:** 1.0.0  
**Date:** 2026-01-07  
**Auteur:** GitHub Copilot Agent  
**Statut:** ✅ Implémenté et documenté
