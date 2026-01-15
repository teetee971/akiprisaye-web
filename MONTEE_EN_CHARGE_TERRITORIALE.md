# 🌍 MONTÉE EN CHARGE TERRITORIALE (DOM → NATIONAL)

**A KI PRI SA YÉ - Observatoire Public des Prix**  
**Stratégie d'Extension Multi-Territoires**  
**Version 1.0 - Janvier 2026**

---

## 📌 Principe Fondamental

> **De l'observatoire local à la référence nationale, sans casser la crédibilité.**

**Règle d'or :**  
Passer de DOM ciblés → multi-territoires en garantissant comparabilité et équité, sans biais structurels.

**Trois interdictions absolues :**
- ❌ Copier-coller DOM → France (contextes différents)
- ❌ Comparer sans contextualiser (désinformation)
- ❌ Uniformiser artificiellement (perte spécificités)

**Trois obligations :**
- ✅ Architecture multi-territoires normalisée
- ✅ Comparaisons intelligentes avec ajustements
- ✅ Transparence totale sur limites et biais

---

## 1️⃣ MODÈLE TERRITORIAL UNIFIÉ

### 1.1 Principe Architecture

**Créer une couche territoriale unique, utilisée partout dans le code.**

Chaque calcul, affichage, comparaison doit dépendre du territoire sélectionné. Aucune logique métier ne doit être "en dur" pour un territoire spécifique.

### 1.2 Schéma de Données

#### Type Territory (TypeScript)

```typescript
export interface Territory {
  // Identification
  id: string;                    // ISO ou custom: "GP", "MQ", "RE", "FR-75", "FR-13"
  code_insee: string;            // Code INSEE officiel
  nom: string;                   // "Guadeloupe", "Martinique", "Paris"
  nom_court: string;             // "GP", "MQ", "Paris"
  
  // Classification
  type: TerritoryType;           // "DOM" | "DROM" | "METRO_REGION" | "METRO_DEPT"
  zone_geographique: string;     // "Caraïbes", "Océan Indien", "Europe"
  
  // Caractéristiques économiques
  zone_logistique: LogisticZone; // "ultraperiph_carib", "ultraperiph_indoc", "metro_idf", etc.
  cout_transport_index: number;  // Base 100 = métropole moyenne
  distance_hub_km: number;       // Distance hub logistique principal (Paris/Marseille)
  
  // Fiscalité
  octroi_mer_applicable: boolean;
  taux_octroi_moyen: number;     // % moyen (si applicable)
  tva_taux_normal: number;       // 8.5% DOM, 20% Métropole
  fiscalite_locale: string;      // Description spécificités
  
  // Démographie & économie
  population: number;
  pib_par_habitant: number;      // Euros, référence nationale = 100
  taux_chomage: number;          // %
  indice_vie_chere_officiel: number; // INSEE si dispo (base 100 = métropole)
  
  // Marché local
  nombre_enseignes_estimees: number;
  densite_commerces: number;     // Commerces/1000 habitants
  accessibilite_commerce: "faible" | "moyenne" | "elevee";
  
  // Couverture données
  date_debut_collecte: string;   // ISO date première observation
  observations_totales: number;  // Nombre observations cumulées
  fiabilite_donnees: "insuffisante" | "partielle" | "robuste";
  couverture_produits_percent: number; // % produits de référence couverts
  
  // Métadonnées
  actif: boolean;                // Territoire actif sur plateforme
  ordre_affichage: number;       // Ordre dans sélecteur (DOM prioritaires)
  drapeau_emoji: string;         // 🇬🇵 🇲🇶 🇫🇷
  created_at: string;
  updated_at: string;
}

export type TerritoryType = 
  | "DOM"              // Départements d'Outre-Mer (Guadeloupe, Martinique, Guyane, Réunion, Mayotte)
  | "DROM"             // Alias DOM (Départements et Régions d'Outre-Mer)
  | "COM"              // Collectivités d'Outre-Mer (Polynésie, Nouvelle-Calédonie, etc.)
  | "METRO_REGION"     // Région métropolitaine (Île-de-France, PACA, etc.)
  | "METRO_DEPT"       // Département métropolitaine (75, 13, 33, etc.)
  | "METRO_NATIONAL";  // France métropolitaine agrégée

export type LogisticZone = 
  | "ultraperiph_carib"      // Caraïbes (GP, MQ)
  | "ultraperiph_indoc"      // Océan Indien (RE, YT)
  | "ultraperiph_amazonie"   // Amazonie (GF)
  | "ultraperiph_pacifique"  // Pacifique (PF, NC)
  | "metro_idf"              // Île-de-France
  | "metro_sud"              // Sud métropole
  | "metro_ouest"            // Ouest métropole
  | "metro_est"              // Est métropole
  | "metro_nord";            // Nord métropole
```

### 1.3 Base de Données Territoires

#### Collection Firestore `territories`

**Documents initiaux (DOM prioritaires) :**

```json
{
  "id": "GP",
  "code_insee": "971",
  "nom": "Guadeloupe",
  "nom_court": "GP",
  "type": "DOM",
  "zone_geographique": "Caraïbes",
  "zone_logistique": "ultraperiph_carib",
  "cout_transport_index": 165,
  "distance_hub_km": 6700,
  "octroi_mer_applicable": true,
  "taux_octroi_moyen": 2.5,
  "tva_taux_normal": 8.5,
  "fiscalite_locale": "Octroi de mer applicable, TVA réduite 8.5%",
  "population": 384239,
  "pib_par_habitant": 23500,
  "taux_chomage": 21.5,
  "indice_vie_chere_officiel": 112,
  "nombre_enseignes_estimees": 85,
  "densite_commerces": 8.5,
  "accessibilite_commerce": "moyenne",
  "date_debut_collecte": "2025-11-01",
  "observations_totales": 1247,
  "fiabilite_donnees": "robuste",
  "couverture_produits_percent": 78,
  "actif": true,
  "ordre_affichage": 1,
  "drapeau_emoji": "🇬🇵",
  "created_at": "2025-11-01T00:00:00Z",
  "updated_at": "2026-01-13T00:00:00Z"
}
```

**Métropole référence :**

```json
{
  "id": "FR-METRO",
  "code_insee": "FR",
  "nom": "France Métropolitaine",
  "nom_court": "Métropole",
  "type": "METRO_NATIONAL",
  "zone_geographique": "Europe",
  "zone_logistique": "metro_idf",
  "cout_transport_index": 100,
  "distance_hub_km": 0,
  "octroi_mer_applicable": false,
  "taux_octroi_moyen": 0,
  "tva_taux_normal": 20,
  "fiscalite_locale": "TVA standard 20%",
  "population": 64800000,
  "pib_par_habitant": 33000,
  "taux_chomage": 7.3,
  "indice_vie_chere_officiel": 100,
  "nombre_enseignes_estimees": 15000,
  "densite_commerces": 12.5,
  "accessibilite_commerce": "elevee",
  "date_debut_collecte": "2026-03-01",
  "observations_totales": 0,
  "fiabilite_donnees": "insuffisante",
  "couverture_produits_percent": 0,
  "actif": false,
  "ordre_affichage": 99,
  "drapeau_emoji": "🇫🇷",
  "created_at": "2026-01-13T00:00:00Z",
  "updated_at": "2026-01-13T00:00:00Z"
}
```

---

## 2️⃣ COMPARABILITÉ INTELLIGENTE

### 2.1 Règle d'Or

> **On ne compare que ce qui est comparable.**

**Principe :** Éviter comparaisons trompeuses en contextualisant systématiquement.

### 2.2 Trois Niveaux de Comparaison

#### **Niveau 1 : Comparaison Intra-Territoire (Par Défaut)**

**Contexte :** Comparaison au sein d'un même territoire.

**Exemple :**
- Prix produit X magasin A vs magasin B (Guadeloupe)
- Évolution prix produit Y dans le temps (Martinique)
- Classement produits "Anti-Crise" (Réunion uniquement)

**Avantage :** Aucun biais logistique, fiscal ou contextuel.

**Affichage :**
```
Prix Lait UHT 1L - Guadeloupe
Magasin A: 2.45€  |  Magasin B: 2.20€  |  Médiane: 2.35€
```

---

#### **Niveau 2 : Comparaison DOM ↔ DOM**

**Contexte :** Comparaison entre départements d'outre-mer.

**Ajustements appliqués :**
- Aucun ajustement prix brut (contextes similaires)
- Mention différences fiscales si significatives (ex: octroi mer Guadeloupe ≠ Réunion)
- Contextualisation distance métropole

**Exemple :**
```
Prix médian Riz 1kg - Comparaison DOM

Guadeloupe:  2.80€  ████████████░░
Martinique:  2.65€  ████████████
Réunion:     3.10€  ██████████████░

Note: Écarts peuvent refléter zones logistiques distinctes 
(Caraïbes vs Océan Indien). Données nov 2025-janv 2026.
```

**Avertissement si pertinent :**
> ⚠️ La Réunion bénéficie d'une zone logistique différente (Océan Indien) 
> avec coûts transport spécifiques.

---

#### **Niveau 3 : Comparaison DOM ↔ Métropole (Avec Ajustements)**

**Contexte :** Comparaison ultrapériphérie vs métropole.

**⚠️ CRITIQUE : Toujours accompagner de :**

1. **Ajustements Logistiques**
   - Coût transport estimé
   - Distance hub logistique
   - Fréquence rotations

2. **Ajustements Fiscaux**
   - Différentiel TVA (8.5% vs 20%)
   - Octroi de mer (si applicable)
   - Fiscalité locale

3. **Avertissement Visuel**

**Exemple d'Affichage Correct :**

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ COMPARAISON DOM - MÉTROPOLE (Contextualisée)            │
├─────────────────────────────────────────────────────────────┤
│ Produit: Lait UHT 1L                                        │
│                                                             │
│ Guadeloupe:       2.35€  ██████████████████░░              │
│ France Métropole: 1.45€  ██████████                        │
│                                                             │
│ Écart brut: +0.90€ (+62%)                                  │
│                                                             │
│ ┌─ Analyse Contextualisée ────────────────────────────┐   │
│ │ • Coût transport estimé:     +0.35€ (+24%)          │   │
│ │ • Différentiel fiscal:       -0.17€ (-12%)          │   │
│ │   (TVA 8.5% DOM vs 20% Métro)                       │   │
│ │ • Octroi de mer:             +0.04€ (+3%)           │   │
│ │ • Écart résiduel non expliqué: +0.68€ (+47%)       │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Sources: Observations nov 2025-janv 2026                   │
│ Guadeloupe: N=127 | Métropole: N=0 (données insuffisantes)│
└─────────────────────────────────────────────────────────────┘
```

**Clause obligatoire :**
> Cette comparaison intègre des estimations de coûts logistiques et fiscaux. 
> Elle ne constitue pas une preuve d'abus, mais un outil de lecture économique. 
> Méthodologie complète : [lien]

### 2.3 Formules d'Ajustement

#### Ajustement Transport

```typescript
function calculateTransportCost(
  productWeight: number, // kg
  basePrice: number,     // € métropole
  territory: Territory
): number {
  const TRANSPORT_BASE_COST = 0.15; // €/kg base
  const indexMultiplier = territory.cout_transport_index / 100;
  return productWeight * TRANSPORT_BASE_COST * indexMultiplier;
}
```

#### Ajustement Fiscal

```typescript
function calculateFiscalDifference(
  priceHT: number,
  territorySource: Territory,
  territoryTarget: Territory
): number {
  const tvaSource = priceHT * (territorySource.tva_taux_normal / 100);
  const tvaTarget = priceHT * (territoryTarget.tva_taux_normal / 100);
  
  const octroiSource = territorySource.octroi_mer_applicable 
    ? priceHT * (territorySource.taux_octroi_moyen / 100) 
    : 0;
  const octroiTarget = territoryTarget.octroi_mer_applicable 
    ? priceHT * (territoryTarget.taux_octroi_moyen / 100) 
    : 0;
  
  return (tvaTarget + octroiTarget) - (tvaSource + octroiSource);
}
```

---

## 3️⃣ INDICES TERRITORIAUX

### 3.1 Principe

**Pourquoi des indices ?**
- Médias et institutions préfèrent indices normalisés (compréhension rapide)
- Comparaisons temporelles facilitées (base fixe)
- Abstraction complexité calculs
- Communication neutre (pas prix bruts sensibles)

### 3.2 Indice Vie Chère (IVC)

**Définition :**  
Mesure le coût d'un panier de produits de référence dans un territoire, par rapport à la métropole (base 100).

**Formule :**
```typescript
IVC_territoire = (Coût_panier_territoire / Coût_panier_métropole) * 100
```

**Exemple :**
- Guadeloupe: IVC = 112 (+12% vs métropole)
- Martinique: IVC = 109 (+9% vs métropole)
- Réunion: IVC = 115 (+15% vs métropole)

**Panier de référence :** 50 produits de base (alimentaire, hygiène, entretien)

**Mise à jour :** Trimestrielle

---

### 3.3 Indice Logistique (IL)

**Définition :**  
Mesure le surcoût logistique moyen pour un territoire par rapport à la métropole (base 100).

**Formule :**
```typescript
IL_territoire = territoire.cout_transport_index
```

**Exemple :**
- Guadeloupe: IL = 165 (+65% surcoût transport)
- Martinique: IL = 160 (+60%)
- Réunion: IL = 180 (+80%)
- Guyane: IL = 190 (+90%)

**Basé sur :**
- Distance hub logistique
- Fréquence rotations maritimes/aériennes
- Coûts portuaires/aéroportuaires
- Volumes traités

---

### 3.4 Indice Accessibilité Produits (IAP)

**Définition :**  
Mesure la disponibilité et diversité de l'offre commerciale dans un territoire (base 100 = métropole moyenne).

**Formule :**
```typescript
IAP = (
  (densite_commerces / densite_ref) * 0.4 +
  (nombre_enseignes / enseignes_ref) * 0.3 +
  (couverture_produits_percent / 100) * 0.3
) * 100
```

**Exemple :**
- Guadeloupe: IAP = 68 (accessibilité inférieure)
- Paris: IAP = 145 (accessibilité supérieure)
- Rural métropole: IAP = 75

---

### 3.5 Indice Inflation Locale (IIL)

**Définition :**  
Évolution des prix sur 12 mois glissants dans un territoire (base 100 = mois de référence).

**Formule :**
```typescript
IIL_mois = (Prix_moyen_panier_mois / Prix_moyen_panier_référence) * 100
```

**Exemple :**
- Janvier 2025: IIL = 100 (référence)
- Janvier 2026: IIL = 104.2 (+4.2% sur 12 mois)

**Affichage :**
```
Inflation Guadeloupe (12 mois glissants)
Janvier 2026: +4.2%
France Métropole: +2.8%
Écart: +1.4 points
```

---

## 4️⃣ UI - SÉLECTEUR TERRITORIAL INTELLIGENT

### 4.1 Fonctionnalités

#### 1. Détection Automatique (Fallback)

```typescript
async function detectUserTerritory(): Promise<string> {
  // Priorité 1: GPS (mobile avec permission)
  if (navigator.geolocation) {
    const position = await getPosition();
    return getTerritoryFromCoords(position.coords);
  }
  
  // Priorité 2: IP geolocation (API tierce ou Cloudflare)
  const ipData = await fetch('/api/geoip').then(r => r.json());
  if (ipData.territory) return ipData.territory;
  
  // Priorité 3: localStorage (précédent choix)
  const saved = localStorage.getItem('akiprisaye_territory');
  if (saved) return saved;
  
  // Fallback: Guadeloupe (DOM prioritaire)
  return 'GP';
}
```

#### 2. Sélecteur Manuel (Toujours Visible)

**Position :** Header fixe, toujours accessible

**UI :**
```tsx
<div className="territory-selector">
  <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border shadow-sm">
    <span className="text-2xl">{currentTerritory.drapeau_emoji}</span>
    <span className="font-medium">{currentTerritory.nom_court}</span>
    <ChevronDown className="w-4 h-4" />
  </button>
  
  {/* Dropdown */}
  <div className="dropdown-menu">
    <div className="font-semibold px-4 py-2 text-sm text-slate-500">
      Départements d'Outre-Mer
    </div>
    {domTerritories.map(t => (
      <button key={t.id} onClick={() => selectTerritory(t.id)}>
        <span>{t.drapeau_emoji}</span>
        <span>{t.nom}</span>
        {t.fiabilite_donnees === 'robuste' && <CheckCircle className="text-green-500" />}
      </button>
    ))}
    
    <div className="font-semibold px-4 py-2 text-sm text-slate-500 border-t mt-2 pt-2">
      France Métropolitaine
    </div>
    {metroTerritories.map(t => (
      <button key={t.id} onClick={() => selectTerritory(t.id)} disabled={!t.actif}>
        <span>{t.drapeau_emoji}</span>
        <span>{t.nom}</span>
        {!t.actif && <span className="text-xs text-orange-500">Bientôt</span>}
      </button>
    ))}
  </div>
</div>
```

#### 3. Badge Territoire Actif

**Position :** Pages avec données sensibles au territoire

```tsx
<div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
  <MapPin className="w-4 h-4" />
  <span>Données pour {currentTerritory.nom}</span>
</div>
```

#### 4. Historique Territoires Consultés

**LocalStorage :**
```typescript
interface TerritoryHistory {
  territoryId: string;
  lastVisit: string;
  viewCount: number;
}

function addToHistory(territoryId: string) {
  const history: TerritoryHistory[] = JSON.parse(
    localStorage.getItem('territory_history') || '[]'
  );
  
  const existing = history.find(h => h.territoryId === territoryId);
  if (existing) {
    existing.lastVisit = new Date().toISOString();
    existing.viewCount++;
  } else {
    history.push({
      territoryId,
      lastVisit: new Date().toISOString(),
      viewCount: 1
    });
  }
  
  // Garder seulement 5 derniers
  history.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
  localStorage.setItem('territory_history', JSON.stringify(history.slice(0, 5)));
}
```

### 4.2 UX Clé

#### Changement Territoire = Reset Contextuel

**Comportement :**
- Filtres réinitialisés (catégories, magasins)
- Données rechargées (nouvelles observations)
- URL mise à jour (`?territory=MQ`)
- Notification utilisateur

**Exemple :**
```tsx
function handleTerritoryChange(newTerritoryId: string) {
  // 1. Sauvegarde préférences
  localStorage.setItem('akiprisaye_territory', newTerritoryId);
  addToHistory(newTerritoryId);
  
  // 2. Reset filtres
  resetFilters();
  
  // 3. Update URL
  const url = new URL(window.location.href);
  url.searchParams.set('territory', newTerritoryId);
  window.history.pushState({}, '', url);
  
  // 4. Notification
  toast.info(`Territoire changé: ${getTerritoryName(newTerritoryId)}`);
  
  // 5. Reload données
  await loadDataForTerritory(newTerritoryId);
}
```

#### Message Données Insuffisantes

**Si territoire sans données fiables :**

```tsx
{territory.fiabilite_donnees === 'insuffisante' && (
  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
          Données insuffisantes pour {territory.nom}
        </h4>
        <p className="text-sm text-orange-800 dark:text-orange-200">
          Nous collectons actuellement des observations pour ce territoire. 
          Les données affichées sont partielles et peuvent ne pas être représentatives.
        </p>
        <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">
          <strong>Observations actuelles:</strong> {territory.observations_totales} 
          (minimum recommandé: 500)
        </p>
      </div>
    </div>
  </div>
)}
```

---

## 5️⃣ SEUILS DE FIABILITÉ PAR TERRITOIRE

### 5.1 Principe

**Aucune donnée n'apparaît si les critères minimaux ne sont pas remplis.**

### 5.2 Seuils Minimaux

#### Configuration par Territoire

```typescript
interface TerritoryThresholds {
  min_observations_product: number;      // Observations minimum pour afficher prix produit
  min_observations_category: number;     // Observations minimum pour stats catégorie
  min_observations_comparison: number;   // Observations minimum pour comparaison
  min_time_period_days: number;          // Période minimum collecte
  min_distinct_stores: number;           // Magasins distincts minimum
  min_source_diversity: number;          // Sources distinctes minimum (terrain, citoyen, etc.)
}

const THRESHOLDS: Record<string, TerritoryThresholds> = {
  // DOM avec données robustes
  "GP": {
    min_observations_product: 3,
    min_observations_category: 15,
    min_observations_comparison: 30,
    min_time_period_days: 14,
    min_distinct_stores: 3,
    min_source_diversity: 2
  },
  
  // Métropole (phase pilote)
  "FR-METRO": {
    min_observations_product: 10,
    min_observations_category: 50,
    min_observations_comparison: 100,
    min_time_period_days: 30,
    min_distinct_stores: 10,
    min_source_diversity: 3
  },
  
  // Default (conservateur)
  "default": {
    min_observations_product: 5,
    min_observations_category: 25,
    min_observations_comparison: 50,
    min_time_period_days: 21,
    min_distinct_stores: 5,
    min_source_diversity: 2
  }
};
```

#### Fonction de Vérification

```typescript
function canDisplayData(
  territory: Territory,
  dataType: 'product' | 'category' | 'comparison',
  stats: DataStats
): { allowed: boolean; reason?: string } {
  const thresholds = THRESHOLDS[territory.id] || THRESHOLDS.default;
  
  let minObs: number;
  switch (dataType) {
    case 'product':
      minObs = thresholds.min_observations_product;
      break;
    case 'category':
      minObs = thresholds.min_observations_category;
      break;
    case 'comparison':
      minObs = thresholds.min_observations_comparison;
      break;
  }
  
  if (stats.observations < minObs) {
    return {
      allowed: false,
      reason: `Données insuffisantes (N=${stats.observations}, minimum=${minObs})`
    };
  }
  
  if (stats.time_period_days < thresholds.min_time_period_days) {
    return {
      allowed: false,
      reason: `Période trop courte (${stats.time_period_days}j, minimum=${thresholds.min_time_period_days}j)`
    };
  }
  
  if (stats.distinct_stores < thresholds.min_distinct_stores) {
    return {
      allowed: false,
      reason: `Sources trop concentrées (${stats.distinct_stores} magasins, minimum=${thresholds.min_distinct_stores})`
    };
  }
  
  return { allowed: true };
}
```

### 5.3 Affichage Conditionnel

```typescript
const displayCheck = canDisplayData(currentTerritory, 'product', productStats);

if (!displayCheck.allowed) {
  return (
    <div className="text-center py-8">
      <Database className="w-12 h-12 text-slate-400 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
        Données non disponibles
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
        {displayCheck.reason}
      </p>
      <button 
        onClick={() => navigate('/contribuer')}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        Contribuer des observations
      </button>
    </div>
  );
}

// Sinon, afficher données normalement
return <ProductPriceDisplay data={productData} />;
```

---

## 6️⃣ GOUVERNANCE TERRITORIALE DISTRIBUÉE

### 6.1 Principe

**L'outil n'est pas centralisé arbitrairement.**

À mesure que la plateforme grandit, prévoir une gouvernance qui reflète la diversité territoriale sans perdre cohérence méthodologique.

### 6.2 Référents Locaux (Phase Ultérieure)

**Rôle :**
- Validation observations locales sensibles
- Contextualisation spécificités territoriales
- Liaison avec institutions locales
- Animation communauté contributeurs

**Critères sélection :**
- Résident territoire (vérifiable)
- Connaissance marché local
- Neutralité avérée (pas lié distributeurs)
- Accord charte éthique

**Statut juridique :** Membre comité consultatif territorial (pas décisionnel seul)

### 6.3 Signalement Local

**Formulaire spécifique territoire :**
- `/contester-donnee?territory=GP`
- Traitement prioritaire référent local (si existe)
- Délai : 15 jours (vs 30j général)

### 6.4 Notes Méthodologiques par Territoire

**Page `/methodologie/{territory_id}/specificites`**

**Exemple Guadeloupe :**
```markdown
# Spécificités Méthodologiques - Guadeloupe

## Contexte Économique
- Économie insulaire dépendante importations (>90% produits manufacturés)
- Octroi de mer applicable (taux moyen 2.5%)
- TVA réduite 8.5% (vs 20% métropole)

## Particularités Collecte
- Couverture prioritaire: Pointe-à-Pitre, Les Abymes, Baie-Mahault
- Zones rurales: données partielles (accessibilité limitée)
- Périodes cycloniques: collecte suspendue (sécurité agents)

## Limites Connues
- Marchés locaux non couverts (méthodologie inadaptée)
- Commerce informel non capturé (hors périmètre)
- Variations saisonnières produits locaux (fruits/légumes)

## Sources Principales
- Relevés terrain: 60%
- Contributions citoyennes: 30%
- Partenariats locaux: 10%
```

---

## 7️⃣ ROADMAP D'EXTENSION RÉALISTE

### Phase 1 : DOM Principaux (Actuelle - Q1-Q4 2026)

**Territoires :**
- ✅ Guadeloupe (robuste)
- ✅ Martinique (robuste)
- 🟡 Réunion (en cours)
- 🟡 Guyane (en cours)
- ⚪ Mayotte (planifié Q3)

**Objectifs :**
- Atteindre 10,000 observations par territoire
- Fiabilité "robuste" (N≥500/produit, 30+ magasins)
- Stabilisation méthodologie
- Audit externe validation

**Critère passage Phase 2 :** 3+ territoires DOM "robustes" + audit externe OK

---

### Phase 2 : Régions Métropolitaines Pilotes (Q4 2026 - Q2 2027)

**Territoires pilotes :**
- 🔵 Île-de-France (Paris + banlieue)
- 🔵 Provence-Alpes-Côte d'Azur (Marseille, Nice)
- 🔵 Auvergne-Rhône-Alpes (Lyon)

**Objectifs :**
- Tester comparabilité DOM-Métropole
- Valider ajustements logistiques/fiscaux
- Identifier biais méthodologiques
- Former contributeurs métropole

**Critère passage Phase 3 :** 2+ régions métropole "robustes" + comparaisons validées institutions

---

### Phase 3 : National Complet (2028+)

**Territoires :**
- 🟢 Toutes régions métropolitaines
- 🟢 Tous DOM/DROM
- 🟢 COM (Polynésie, Nouvelle-Calédonie) si pertinent

**Objectifs :**
- Indices nationaux publiés (IVC, IIL)
- API open-data contrôlée
- Partenariat INSEE/DGCCRF formalisé
- Reconnaissance référence institutionnelle

**Condition maintien :** Audit externe annuel + comité gouvernance actif + 0 dérives méthodologiques

---

## 8️⃣ COMMUNICATION MAÎTRISÉE

### 8.1 Vocabulaire Autorisé

**✅ Toujours dire :**
- "Observatoire territorial"
- "Lecture contextualisée"
- "Comparaison pédagogique"
- "Données multi-territoires"
- "Analyse différentielle ajustée"

**❌ Jamais dire :**
- "Classement national brut" (sans contexte)
- "Les plus chers de France" (sans nuances)
- "Scandale prix DOM" (accusation)
- "Métropole moins chère" (simplification)

### 8.2 Exemple Communication Correcte

**Titre article :**
> "Observatoire territorial des prix : écarts DOM-Métropole analysés avec ajustements logistiques"

**Mauvais titre (à éviter) :**
> ~~"Les DOM payent 60% plus cher : scandale national"~~

### 8.3 Template Communiqué Extension

**Titre :**
> "Extension géographique de A KI PRI SA YÉ : {territoire} intégré à l'observatoire"

**Corps :**
```
A KI PRI SA YÉ, observatoire citoyen des prix, annonce l'intégration de 
{territoire} à sa plateforme de données publiques.

Cette extension s'inscrit dans une démarche progressive visant à couvrir 
l'ensemble des territoires français, en garantissant la même rigueur 
méthodologique et la même transparence.

Les données pour {territoire} seront publiées dès que les seuils minimaux 
de fiabilité seront atteints (N≥500 observations, 30+ points de vente).

Méthodologie complète : {URL}
```

---

## 9️⃣ CHECKLIST TECHNIQUE EXTENSION TERRITOIRE

### Avant Activation Nouveau Territoire

- [ ] Créer document `Territory` dans Firestore
- [ ] Définir seuils fiabilité spécifiques
- [ ] Documenter spécificités méthodologiques (`/methodologie/{id}/specificites`)
- [ ] Configurer ajustements logistiques/fiscaux
- [ ] Ajouter dans sélecteur UI (ordre, drapeau)
- [ ] Tester comparaisons avec territoires existants
- [ ] Valider absence biais structurels
- [ ] Former contributeurs/référents locaux (si applicable)
- [ ] Préparer communication extension (communiqué sobr)

### Après Activation

- [ ] Monitorer qualité données (N observations, diversité sources)
- [ ] Publier rapport transparence mensuel
- [ ] Recueillir feedback utilisateurs territoire
- [ ] Ajuster seuils si nécessaire (documenté)
- [ ] Valider comparaisons cross-territoire

---

## 🔟 MÉTRIQUES PAR TERRITOIRE

### Tableau de Bord Public (`/transparence/territoires`)

| Territoire | Observations | Magasins | Fiabilité | Couverture Produits | Dernière MAJ |
|------------|--------------|----------|-----------|---------------------|--------------|
| Guadeloupe | 1,247 | 42 | 🟢 Robuste | 78% | 2026-01-12 |
| Martinique | 1,089 | 38 | 🟢 Robuste | 72% | 2026-01-11 |
| Réunion | 567 | 24 | 🟡 Partielle | 54% | 2026-01-10 |
| Guyane | 198 | 12 | 🔴 Insuffisante | 31% | 2026-01-09 |
| Mayotte | 0 | 0 | ⚪ Non actif | 0% | - |

**Légende :**
- 🟢 Robuste : N≥1000, 30+ magasins, 60%+ produits
- 🟡 Partielle : N≥300, 15+ magasins, 40%+ produits
- 🔴 Insuffisante : N<300
- ⚪ Non actif : Collecte pas démarrée

---

## ✅ LIVRABLES MODULE O

À la fin de O, tu as :

✅ **Type `Territory` TypeScript** - Modèle unifié  
✅ **Collection Firestore `territories`** - Base données centralisée  
✅ **3 niveaux comparaison** - Intra, DOM-DOM, DOM-Métropole  
✅ **4 indices territoriaux** - IVC, IL, IAP, IIL  
✅ **Sélecteur territorial intelligent** - UI + détection auto  
✅ **Seuils fiabilité par territoire** - Configuration granulaire  
✅ **Roadmap 3 phases** - DOM → Pilotes Métro → National  
✅ **Gouvernance distribuée** - Référents locaux (futur)  
✅ **Communication maîtrisée** - Vocabulaire strict  

---

## 🔑 PHRASE CLÉ DU MODULE

> **"Comparer sans contexte, c'est désinformer."**

---

## 📝 HISTORIQUE VERSIONS DOCUMENT

| Version | Date | Changements |
|---------|------|-------------|
| 1.0 | 2026-01-13 | Création stratégie montée en charge territoriale |

---

**Mise à jour :** 13 janvier 2026  
**Prochaine révision :** Post-intégration Réunion (mars 2026)  
**Statut :** ✅ Actif - En attente implémentation technique

---

> **Citation finale :**  
> *"Un observatoire qui grandit trop vite perd sa précision.  
> Un observatoire qui grandit méthodiquement gagne sa légitimité."*
