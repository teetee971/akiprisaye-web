# Composants "Effet Waouh" - Page d'Accueil

Ces 5 composants sont conçus pour déclencher un impact immédiat et montrer la valeur concrète de la plateforme en **moins de 10 secondes**.

## Objectif

> "En moins de 10 secondes, l'utilisateur doit comprendre : Ce site me fait économiser de l'argent ici, maintenant."

## Les 5 Composants

### ① 💸 `RealSavingsBlock` - Économies Réelles (IMPACT MAX)

**Priorité absolue** - Premier élément visible après le hero

```tsx
import { RealSavingsBlock } from '@/components/home/RealSavingsBlock';

<RealSavingsBlock />
```

**Affiche :**
- ✔️ +2,43 € économisés
- ✔️ -18 % par rapport au prix moyen
- 📍 Enseigne la moins chère : Super U Jarry
- 🕒 Données mises à jour il y a 3h

**Données :** Charge depuis `localStorage.getItem('latest_savings')`

---

### ② 🧾 `BeforeAfterComparison` - Comparaison Visuelle

**Compréhension instantanée** avec barres visuelles

```tsx
import { BeforeAfterComparison } from '@/components/home/BeforeAfterComparison';

<BeforeAfterComparison 
  productName="Jus de citron 1L"
  currentPrice={3.20}
  bestPrice={2.45}
  bestStore="Carrefour Destreland"
/>
```

**Affiche :**
- ❌ Prix constaté : 3,20 € (barre rouge)
- ✅ Meilleur prix : 2,45 € (barre verte)
- 👉 Économie potentielle : **0,75 €**

**Props :** Toutes optionnelles avec valeurs par défaut

---

### ③ 🧭 `OptimalRoutePreview` - Itinéraire Optimal

**Différenciation forte** - Montre que c'est un assistant, pas un simple comparateur

```tsx
import { OptimalRoutePreview } from '@/components/home/OptimalRoutePreview';

<OptimalRoutePreview />
```

**Affiche :**
- 1️⃣ Leader Price — sucre (1,12 €)
- 2️⃣ Super U — jus (2,45 €)
- 3️⃣ Carrefour — riz (1,89 €)
- 📏 Distance : 4,3 km
- ⏱️ Temps : 11 min
- 🌱 CO₂ évité : -420 g

**CTA :** Bouton "🗺️ Voir sur la carte"

---

### ④ ⚠️ `PriceAnomalyBadge` - Anomalie de Prix

**Confiance + Viralité** - Contenu partageable

```tsx
import { PriceAnomalyBadge } from '@/components/home/PriceAnomalyBadge';

<PriceAnomalyBadge 
  percentageAboveAverage={27}
  showTooltip={true}
/>
```

**Affiche :**
- ⚠️ Prix inhabituellement élevé
- +27% au-dessus de la moyenne locale
- Signalement automatique basé sur les données publiques

**Usage :** À intégrer dans les cards produits/enseignes

**Note :** Ne s'affiche que si `percentageAboveAverage >= 15`

---

### ⑤ 🏆 `StoreRanking` - Classement des Enseignes

**Social + Crédible** - Réassurance collective

```tsx
import { StoreRanking } from '@/components/home/StoreRanking';

<StoreRanking />
```

**Affiche :**
- 🥇 Leader Price — 12 produits les moins chers
- 🥈 Super U — 9 produits
- 🥉 Carrefour — 7 produits
- 📊 Données publiques – observatoire citoyen
- Basé sur 28 produits suivis

---

## Intégration dans HOME_v3

```tsx
import { 
  RealSavingsBlock,
  BeforeAfterComparison,
  OptimalRoutePreview,
  StoreRanking
} from '@/components/home';

export default function HomeV3() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <HeroSection />
      
      {/* ① IMPACT MAX */}
      <RealSavingsBlock />
      
      {/* ② Visuel */}
      <BeforeAfterComparison />
      
      {/* ③ Assistant */}
      <OptimalRoutePreview />
      
      {/* ⑤ Social */}
      <StoreRanking />
      
      {/* Reste du contenu... */}
    </div>
  );
}
```

---

## Pourquoi ça fonctionne

| Composant | Effet psychologique | Temps |
|-----------|-------------------|-------|
| Économies réelles | Valeur immédiate | < 2s |
| Avant/Après | Compréhension visuelle | < 3s |
| Itinéraire | "C'est un assistant" | < 5s |
| Anomalies | Sentiment de justice | Immédiat |
| Classement | Réassurance sociale | < 3s |

**Total : < 10 secondes** pour comprendre la valeur

---

## Design System

Tous les composants utilisent :
- `GlassCard` pour le glassmorphisme cohérent
- Animations `animate-slide-in` pour l'entrée
- Couleurs sémantiques (green = économie, red = cher)
- Responsive mobile-first
- WCAG AAA compliance

---

## Données

### Sources de données

1. **RealSavingsBlock** : `localStorage.getItem('latest_savings')`
2. **BeforeAfterComparison** : Props ou données par défaut
3. **OptimalRoutePreview** : Données statiques (à connecter à l'API route)
4. **StoreRanking** : Données statiques (à connecter à l'API classement)
5. **PriceAnomalyBadge** : Props dynamiques

### Connexion future API

```tsx
// Exemple pour RealSavingsBlock
useEffect(() => {
  fetch('/api/v1/savings/latest')
    .then(res => res.json())
    .then(data => setSavingsData(data));
}, []);
```

---

## Compatibilité

✅ **Aucune promesse mensongère** - Données réelles ou clairement exemple
✅ **Open Data** - Mention "données publiques" partout
✅ **Institutionnel** - Compatible presse, collectivités, chercheurs
✅ **RGPD** - Aucun tracking utilisateur
✅ **Accessible** - WCAG AAA, 44px touch targets

---

## Maintenance

### Mise à jour des données exemple

Les données par défaut sont dans chaque composant :
- `RealSavingsBlock.tsx` ligne 15-20
- `OptimalRoutePreview.tsx` ligne 13-17
- `StoreRanking.tsx` ligne 13-17

### Styles

Tous les composants héritent du design system global via :
- `GlassCard` component
- Classes Tailwind cohérentes
- Variables CSS custom properties
