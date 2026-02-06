# 🗺️ Suggestions Supplémentaires pour la Carte
**Priorité 2+ — Améliorations au-delà de l'impact immédiat**

**Date:** 6 février 2026  
**Contexte:** Suite à la complétion de la Priorité 1 (Performance carte)

---

## 📊 Vue d'Ensemble

Après analyse approfondie des 3 implémentations de carte existantes, voici les suggestions d'amélioration classées par priorité et impact utilisateur.

### État Actuel

| Composant | Lignes | Fonctionnalités | Score |
|-----------|--------|-----------------|-------|
| **MapLeaflet.jsx** | 334 | Map simple avec markers | ✅ 9/10 |
| **Carte.jsx** | 1,062 | Map complète avec clustering, filtres, géolocalisation | ✅ 8/10 |
| **CarteObservations.jsx** | 218 | Observations citoyennes validées | ⚠️ 6/10 |

**Points forts:**
- ✅ Performance optimisée (Priorité 1 terminée)
- ✅ Marker clustering implémenté
- ✅ Filtres avancés (catégories, services, distance)
- ✅ Multi-modal navigation (Google Maps, Waze, Apple Maps)

**Points faibles identifiés:**
- ⚠️ Accessibilité limitée (pas de navigation clavier)
- ⚠️ Incohérence des coordonnées (`lat/lng` vs `lat/lon`)
- ⚠️ Popups en HTML inline (risque XSS, difficile à maintenir)
- ⚠️ Pas de recherche par nom de magasin
- ⚠️ Markers génériques (pas d'icônes par catégorie)

---

## 🎯 PRIORITÉ 2 : UX & Accessibilité (Impact Élevé)

### 1. Navigation Clavier & Accessibilité WCAG ⭐⭐⭐⭐⭐
**Impact:** Critique pour conformité RGAA/WCAG 2.1  
**Effort:** 2-3 jours  
**Fichiers:** Tous les composants carte

#### Problème
- Les markers ne sont pas accessibles au clavier
- Pas d'annonces pour les lecteurs d'écran
- Ratio de contraste insuffisant sur certains popups
- Touches de navigation (Tab, Enter, Esc) non gérées

#### Solution Technique

```jsx
// frontend/src/components/MapLeaflet.jsx
// Ajouter rôles ARIA et gestion clavier

<div 
  ref={mapRef}
  role="region"
  aria-label={`Carte interactive des magasins en ${TERRITORY_COORDINATES[territory]?.name}`}
  aria-live="polite"
  aria-busy={isLoading}
  tabIndex={-1}
  className="map-container"
/>

// Pour chaque marker:
const marker = window.L.marker([store.lat, store.lng], {
  keyboard: true,
  tabIndex: 0,
  alt: `${store.name}, ${store.address || ''}`,
});

// Gérer les événements clavier
marker.on('keypress', (e) => {
  if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
    marker.openPopup();
    onStoreClick?.(store);
  }
});
```

**Checklist:**
- [ ] Ajouter `role="region"` et `aria-label` au conteneur de carte
- [ ] Ajouter `aria-live="polite"` pour annoncer le nombre de markers chargés
- [ ] Rendre les markers focusables (`tabIndex={0}`)
- [ ] Gérer Enter/Espace pour ouvrir les popups
- [ ] Gérer Échap pour fermer les popups
- [ ] Ajouter `aria-label` descriptif sur chaque marker
- [ ] Tester avec NVDA/JAWS/VoiceOver
- [ ] Vérifier contraste de couleurs (4.5:1 minimum)

**Tests:**
```bash
# Utiliser axe DevTools ou Lighthouse
npm run lighthouse -- --only-categories=accessibility
```

**Bénéfices:**
- ✅ Conformité WCAG 2.1 niveau AA
- ✅ Accessible aux 15% d'utilisateurs ayant un handicap
- ✅ Meilleur SEO (Google valorise l'accessibilité)
- ✅ Utilisable au clavier uniquement

---

### 2. Unification des Coordonnées (lat/lng vs lat/lon) ⭐⭐⭐⭐
**Impact:** Moyen (évite bugs, simplifie maintenance)  
**Effort:** 1 jour  
**Fichiers:** `mapService.js`, tous les composants carte

#### Problème
```javascript
// MapLeaflet.jsx utilise "lng"
const coords = TERRITORY_COORDINATES[territory] || TERRITORY_COORDINATES.GP;
map.setView([coords.lat, coords.lng], coords.zoom);

// Carte.jsx utilise "lon"
const leafletMarker = leaflet.marker([store.lat, store.lon]);

// Confusion dans mapService.js
{ lat: 16.2650, lng: -61.5510 } // Format 1
{ coordinates: { lat: ..., lon: ... } } // Format 2
```

#### Solution: Utilitaire de Normalisation

```javascript
// frontend/src/utils/coordinates.js
/**
 * Normalise les coordonnées d'un magasin
 * Supporte les formats: { lat, lng }, { lat, lon }, { coordinates: { lat, lon } }
 */
export function normalizeCoordinates(store) {
  // Priorité: lat/lon direct > lat/lng > coordinates.lat/lon > coordinates.lat/lng
  const lat = store.lat ?? store.coordinates?.lat;
  const lon = store.lon ?? store.lng ?? store.coordinates?.lon ?? store.coordinates?.lng;
  
  if (lat === undefined || lon === undefined) {
    console.warn('Store missing coordinates:', store);
    return null;
  }
  
  return { lat, lon };
}

/**
 * Convertit un tableau de magasins avec coordonnées normalisées
 */
export function normalizeStoreCoordinates(stores) {
  return stores
    .map(store => {
      const coords = normalizeCoordinates(store);
      if (!coords) return null;
      
      return {
        ...store,
        lat: coords.lat,
        lon: coords.lon,
        // Garder compatibilité avec code existant
        lng: coords.lon,
      };
    })
    .filter(Boolean);
}

/**
 * Valide que des coordonnées sont dans les DOM-COM
 */
export function isValidDOMCOMCoordinate(lat, lon) {
  // Guadeloupe: 15.8-16.5, -61.8 à -61.0
  // Martinique: 14.4-14.9, -61.2 à -60.8
  // Guyane: 2-6, -55 à -51
  // La Réunion: -21.4 à -20.9, 55.2 à 55.8
  // etc.
  
  const territories = [
    { latMin: 15.8, latMax: 16.5, lonMin: -61.8, lonMax: -61.0 }, // GP
    { latMin: 14.4, latMax: 14.9, lonMin: -61.2, lonMax: -60.8 }, // MQ
    { latMin: 2, latMax: 6, lonMin: -55, lonMax: -51 }, // GF
    { latMin: -21.4, latMax: -20.9, lonMin: 55.2, lonMax: 55.8 }, // RE
    { latMin: -13, latMax: -12.6, lonMin: 45, lonMax: 45.3 }, // YT
    // ... autres territoires
  ];
  
  return territories.some(t => 
    lat >= t.latMin && lat <= t.latMax &&
    lon >= t.lonMin && lon <= t.lonMax
  );
}
```

**Utilisation:**
```javascript
// Dans MapLeaflet.jsx
import { normalizeCoordinates } from '../utils/coordinates';

visibleStores.forEach((store) => {
  const coords = normalizeCoordinates(store);
  if (!coords) return;
  
  const marker = window.L.marker([coords.lat, coords.lon]);
  // ...
});

// Dans Carte.jsx
import { normalizeStoreCoordinates } from '../utils/coordinates';

const normalizedStores = useMemo(() => 
  normalizeStoreCoordinates(stores),
  [stores]
);
```

**Tests:**
```javascript
// frontend/src/utils/__tests__/coordinates.test.js
import { normalizeCoordinates, isValidDOMCOMCoordinate } from '../coordinates';

describe('normalizeCoordinates', () => {
  it('should handle lat/lng format', () => {
    expect(normalizeCoordinates({ lat: 16.5, lng: -61.5 }))
      .toEqual({ lat: 16.5, lon: -61.5 });
  });
  
  it('should handle lat/lon format', () => {
    expect(normalizeCoordinates({ lat: 16.5, lon: -61.5 }))
      .toEqual({ lat: 16.5, lon: -61.5 });
  });
  
  it('should handle coordinates object', () => {
    expect(normalizeCoordinates({ coordinates: { lat: 16.5, lon: -61.5 } }))
      .toEqual({ lat: 16.5, lon: -61.5 });
  });
  
  it('should return null for invalid coordinates', () => {
    expect(normalizeCoordinates({})).toBeNull();
    expect(normalizeCoordinates({ lat: 16.5 })).toBeNull();
  });
});

describe('isValidDOMCOMCoordinate', () => {
  it('should validate Guadeloupe coordinates', () => {
    expect(isValidDOMCOMCoordinate(16.2650, -61.5510)).toBe(true);
  });
  
  it('should reject Paris coordinates', () => {
    expect(isValidDOMCOMCoordinate(48.8566, 2.3522)).toBe(false);
  });
});
```

**Checklist:**
- [ ] Créer `frontend/src/utils/coordinates.js`
- [ ] Implémenter `normalizeCoordinates()`
- [ ] Implémenter `normalizeStoreCoordinates()`
- [ ] Implémenter `isValidDOMCOMCoordinate()`
- [ ] Ajouter tests unitaires (>90% coverage)
- [ ] Mettre à jour MapLeaflet.jsx
- [ ] Mettre à jour Carte.jsx
- [ ] Mettre à jour CarteObservations.jsx
- [ ] Mettre à jour mapService.js
- [ ] Vérifier que les 12 territoires fonctionnent
- [ ] Documenter dans ARCHITECTURE.md

---

### 3. Icônes de Markers par Catégorie ⭐⭐⭐⭐
**Impact:** Élevé (navigation visuelle intuitive)  
**Effort:** 2 jours  
**Fichiers:** `MapLeaflet.jsx`, `Carte.jsx`

#### Problème
Tous les markers utilisent l'icône Leaflet par défaut (pin bleu). Difficile de distinguer les types de magasins.

#### Solution: Markers Colorés par Catégorie

```javascript
// frontend/src/utils/markerIcons.js
import L from 'leaflet';

// Couleurs par catégorie
const CATEGORY_COLORS = {
  'Alimentation': '#10b981', // Vert
  'Électronique': '#3b82f6', // Bleu
  'Bricolage': '#f59e0b', // Orange
  'Sport': '#ef4444', // Rouge
  'Beauté': '#ec4899', // Rose
  'Maison': '#8b5cf6', // Violet
  'Vêtements': '#06b6d4', // Cyan
  'default': '#6b7280', // Gris
};

// Icône SVG personnalisée
function createMarkerIcon(category, isSmall = false) {
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  const size = isSmall ? 25 : 35;
  
  const svgIcon = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
            fill="${color}" 
            stroke="white" 
            stroke-width="2"/>
      <circle cx="12" cy="9" r="3" fill="white"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Légende de la carte
export function getMarkerLegend() {
  return Object.entries(CATEGORY_COLORS)
    .filter(([key]) => key !== 'default')
    .map(([category, color]) => ({ category, color }));
}

export { createMarkerIcon, CATEGORY_COLORS };
```

**Utilisation dans MapLeaflet.jsx:**
```jsx
import { createMarkerIcon } from '../utils/markerIcons';

// Dans updateMarkers()
visibleStores.forEach((store) => {
  const category = store.category || 'default';
  const icon = createMarkerIcon(category, config.isMobile);
  
  const marker = window.L.marker([coords.lat, coords.lon], {
    icon,
    riseOnHover: config.performanceTier !== 'low',
  });
  // ...
});
```

**Ajouter une Légende:**
```jsx
// frontend/src/components/MapLegend.jsx
import { getMarkerLegend } from '../utils/markerIcons';

export function MapLegend() {
  const legend = getMarkerLegend();
  
  return (
    <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 max-w-xs">
      <h3 className="font-semibold text-sm mb-2">Légende</h3>
      <div className="space-y-1">
        {legend.map(({ category, color }) => (
          <div key={category} className="flex items-center gap-2 text-xs">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white" 
              style={{ backgroundColor: color }}
            />
            <span>{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**CSS pour les markers:**
```css
/* frontend/src/styles/map-markers.css */
.custom-marker-icon {
  background: none !important;
  border: none !important;
}

.custom-marker-icon svg {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: transform 0.2s ease;
}

.custom-marker-icon:hover svg {
  transform: scale(1.1);
}

/* Animation d'apparition des markers */
@keyframes markerFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.custom-marker-icon {
  animation: markerFadeIn 0.3s ease-out;
}
```

**Checklist:**
- [ ] Créer `frontend/src/utils/markerIcons.js`
- [ ] Définir couleurs pour 8-10 catégories principales
- [ ] Créer fonction `createMarkerIcon(category, isSmall)`
- [ ] Créer composant `MapLegend.jsx`
- [ ] Intégrer dans MapLeaflet.jsx
- [ ] Intégrer dans Carte.jsx
- [ ] Ajouter CSS pour animations
- [ ] Tester sur mobile (taille réduite)
- [ ] Vérifier contraste des couleurs (accessibilité)
- [ ] Ajouter icônes personnalisées si besoin (ex: panier pour supermarché)

---

### 4. Recherche de Magasins par Nom ⭐⭐⭐⭐
**Impact:** Élevé (gain de temps utilisateur)  
**Effort:** 1 jour  
**Fichiers:** `Carte.jsx`

#### Solution

```jsx
// Dans Carte.jsx, ajouter input de recherche
const [searchQuery, setSearchQuery] = useState('');

// Filtrer les magasins par recherche
const searchFilteredStores = useMemo(() => {
  if (!searchQuery.trim()) return filteredStores;
  
  const query = searchQuery.toLowerCase();
  return filteredStores.filter(store =>
    store.name.toLowerCase().includes(query) ||
    store.address?.toLowerCase().includes(query) ||
    store.category?.toLowerCase().includes(query)
  );
}, [filteredStores, searchQuery]);

// UI
<div className="mb-4">
  <div className="relative">
    <input
      type="search"
      placeholder="Rechercher un magasin..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500"
      aria-label="Rechercher un magasin"
    />
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" 
         fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </div>
  {searchQuery && (
    <p className="text-sm text-gray-600 mt-2">
      {searchFilteredStores.length} résultat{searchFilteredStores.length > 1 ? 's' : ''} pour "{searchQuery}"
    </p>
  )}
</div>
```

**Améliorations:**
- Surligner les résultats dans les popups
- Ajouter autocomplete avec suggestions
- Persister la recherche dans l'URL (`?search=Leader Price`)

---

### 5. Popups en Composants React (Sécurité XSS) ⭐⭐⭐⭐
**Impact:** Critique (sécurité)  
**Effort:** 1 jour  
**Fichiers:** `MapLeaflet.jsx`, `Carte.jsx`

#### Problème
```javascript
// ❌ Risque XSS si store.name contient du HTML malveillant
const popupContent = `
  <h3>${store.name}</h3>
  <p>${store.address}</p>
`;
marker.bindPopup(popupContent);
```

#### Solution: ReactDOMServer

```jsx
// frontend/src/components/StorePopup.jsx
import { MapPin, Phone, Package, Euro } from 'lucide-react';

export function StorePopup({ store, onViewDetails, onNavigate }) {
  return (
    <div className="p-2 min-w-[200px]">
      <h3 className="font-semibold text-primary-600 mb-2 text-base">
        {store.name}
      </h3>
      
      {store.address && (
        <div className="flex items-start gap-2 text-sm text-gray-700 mb-1">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{store.address}</span>
        </div>
      )}
      
      {store.phone && (
        <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
          <Phone className="w-4 h-4 flex-shrink-0" />
          <a href={`tel:${store.phone}`} className="hover:underline">
            {store.phone}
          </a>
        </div>
      )}
      
      {store.productCount && (
        <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
          <Package className="w-4 h-4 flex-shrink-0" />
          <span>{store.productCount} produits</span>
        </div>
      )}
      
      {store.avgPrice && (
        <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
          <Euro className="w-4 h-4 flex-shrink-0" />
          <span>Prix moyen: {store.avgPrice.toFixed(2)}€</span>
        </div>
      )}
      
      <div className="flex gap-2 mt-3">
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(store)}
            className="flex-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs rounded transition-colors"
          >
            Voir les prix
          </button>
        )}
        
        {onNavigate && (
          <button
            onClick={() => onNavigate(store)}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded transition-colors"
            title="Itinéraire"
          >
            📍
          </button>
        )}
      </div>
    </div>
  );
}
```

**Intégration avec Leaflet:**
```jsx
import { renderToString } from 'react-dom/server';
import { StorePopup } from './StorePopup';

// Dans MapLeaflet.jsx
const popupHTML = renderToString(
  <StorePopup 
    store={store}
    onViewDetails={onStoreClick}
  />
);

marker.bindPopup(popupHTML, {
  maxWidth: config.isMobile ? 250 : 300,
  className: 'store-popup',
});

// Gérer les événements après montage
marker.on('popupopen', () => {
  const popup = marker.getPopup();
  const popupNode = popup.getElement();
  
  // Attacher les event listeners
  const viewButton = popupNode?.querySelector('[data-action="view-details"]');
  if (viewButton) {
    viewButton.addEventListener('click', () => onStoreClick?.(store));
  }
});
```

**Alternative avec react-leaflet:**
```jsx
import { Popup } from 'react-leaflet';

<Marker position={[store.lat, store.lon]} icon={icon}>
  <Popup maxWidth={300}>
    <StorePopup 
      store={store}
      onViewDetails={handleViewDetails}
      onNavigate={handleNavigate}
    />
  </Popup>
</Marker>
```

**Checklist:**
- [ ] Créer composant `StorePopup.jsx`
- [ ] Remplacer HTML inline dans MapLeaflet.jsx
- [ ] Remplacer HTML inline dans Carte.jsx
- [ ] Tester que les boutons fonctionnent
- [ ] Vérifier que le contenu s'échappe correctement (XSS)
- [ ] Ajouter tests unitaires pour StorePopup
- [ ] Documenter dans le guide de sécurité

---

## 🚀 PRIORITÉ 3 : Fonctionnalités Avancées (Impact Moyen)

### 6. Itinéraire Multi-Magasins (Route Optimization) ⭐⭐⭐
**Effort:** 3-4 jours  
**ROI:** Moyen (utile pour comparaison de paniers)

**Concept:**
Permettre à l'utilisateur de sélectionner plusieurs magasins et calculer l'itinéraire optimal (problème du voyageur de commerce).

**Bibliothèques:**
- `@turf/turf` pour calculs géospatiaux
- API Google Directions ou OSRM (Open Source Routing Machine)

```javascript
// frontend/src/utils/routeOptimization.js
import * as turf from '@turf/turf';

export function optimizeRoute(userLocation, stores) {
  // Algorithme glouton simple (nearest neighbor)
  const unvisited = [...stores];
  const route = [];
  let current = userLocation;
  
  while (unvisited.length > 0) {
    let nearest = null;
    let minDistance = Infinity;
    
    unvisited.forEach((store, index) => {
      const distance = turf.distance(
        turf.point([current.lon, current.lat]),
        turf.point([store.lon, store.lat]),
        { units: 'kilometers' }
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = index;
      }
    });
    
    const nextStore = unvisited.splice(nearest, 1)[0];
    route.push(nextStore);
    current = nextStore;
  }
  
  return route;
}
```

### 7. Heatmap des Prix (CarteObservations.jsx) ⭐⭐⭐
**Effort:** 2 jours

Visualiser les zones de prix élevés/bas avec un dégradé de couleurs.

```javascript
import L from 'leaflet';
import 'leaflet.heat';

const heatPoints = observations.map(obs => [
  obs.store.lat,
  obs.store.lon,
  obs.price / 10, // Normaliser l'intensité
]);

const heatLayer = L.heatLayer(heatPoints, {
  radius: 25,
  blur: 15,
  maxZoom: 13,
  gradient: {
    0.0: 'green',  // Prix bas
    0.5: 'yellow',
    1.0: 'red',    // Prix élevé
  },
});

heatLayer.addTo(map);
```

### 8. Mode Hors Ligne avec Service Worker ⭐⭐⭐
**Effort:** 2-3 jours

Précharger les tuiles de carte et données des magasins pour utilisation offline.

```javascript
// service-worker.js
const TILE_CACHE = 'map-tiles-v1';
const MAP_DATA_CACHE = 'map-data-v1';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Cache des tuiles CartoDB
  if (url.hostname.includes('cartocdn.com')) {
    event.respondWith(
      caches.open(TILE_CACHE).then(cache =>
        cache.match(event.request).then(response =>
          response || fetch(event.request).then(fetchResponse => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          })
        )
      )
    );
  }
  
  // Cache des données de magasins
  if (url.pathname.includes('/api/stores')) {
    event.respondWith(
      caches.open(MAP_DATA_CACHE).then(cache =>
        fetch(event.request)
          .then(response => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cache.match(event.request))
      )
    );
  }
});
```

### 9. Export de la Liste de Magasins (PDF/CSV) ⭐⭐
**Effort:** 1-2 jours

```javascript
// frontend/src/utils/mapExport.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportStoreListPDF(stores, territory) {
  const doc = new jsPDF();
  
  doc.text(`Magasins en ${territory}`, 14, 15);
  doc.setFontSize(10);
  doc.text(`Exporté le ${new Date().toLocaleDateString()}`, 14, 22);
  
  autoTable(doc, {
    head: [['Nom', 'Catégorie', 'Adresse', 'Téléphone']],
    body: stores.map(s => [
      s.name,
      s.category || '-',
      s.address || '-',
      s.phone || '-',
    ]),
    startY: 25,
  });
  
  doc.save(`magasins-${territory}-${Date.now()}.pdf`);
}

export function exportStoreListCSV(stores) {
  const headers = ['Nom', 'Catégorie', 'Adresse', 'Téléphone', 'Latitude', 'Longitude'];
  const rows = stores.map(s => [
    s.name,
    s.category || '',
    s.address || '',
    s.phone || '',
    s.lat,
    s.lon,
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `magasins-${Date.now()}.csv`;
  link.click();
}
```

### 10. Favoris/Signets de Magasins ⭐⭐
**Effort:** 1 jour

```javascript
// frontend/src/hooks/useFavoriteStores.js
import { useState, useEffect } from 'react';
import { safeLocalStorage } from '../utils/safeLocalStorage';

const FAVORITES_KEY = 'favorite_stores';

export function useFavoriteStores() {
  const [favorites, setFavorites] = useState([]);
  
  useEffect(() => {
    const stored = safeLocalStorage.getItem(FAVORITES_KEY);
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);
  
  const addFavorite = (storeId) => {
    const updated = [...favorites, storeId];
    setFavorites(updated);
    safeLocalStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };
  
  const removeFavorite = (storeId) => {
    const updated = favorites.filter(id => id !== storeId);
    setFavorites(updated);
    safeLocalStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };
  
  const isFavorite = (storeId) => favorites.includes(storeId);
  
  return { favorites, addFavorite, removeFavorite, isFavorite };
}
```

---

## 🔧 PRIORITÉ 4 : Maintenance & Qualité (Impact Technique)

### 11. Tests Automatisés pour Composants Carte ⭐⭐⭐⭐
**Effort:** 2-3 jours

**Coverage actuel:** 0% ❌

```javascript
// frontend/src/components/__tests__/MapLeaflet.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { MapLeaflet } from '../MapLeaflet';

// Mock Leaflet
jest.mock('../../utils/leafletClient', () => ({
  loadLeaflet: jest.fn(() => Promise.resolve({
    map: jest.fn(() => ({
      setView: jest.fn(),
      addLayer: jest.fn(),
      remove: jest.fn(),
    })),
    marker: jest.fn(() => ({
      bindPopup: jest.fn(),
      addTo: jest.fn(),
      on: jest.fn(),
    })),
    tileLayer: jest.fn(() => ({
      addTo: jest.fn(),
    })),
  })),
}));

describe('MapLeaflet', () => {
  const mockStores = [
    { id: '1', name: 'Carrefour', lat: 16.265, lon: -61.551 },
    { id: '2', name: 'Leader Price', lat: 16.270, lon: -61.560 },
  ];
  
  it('should render loading state initially', () => {
    render(<MapLeaflet territory="GP" stores={mockStores} />);
    expect(screen.getByText(/carte interactive/i)).toBeInTheDocument();
  });
  
  it('should load map when visible', async () => {
    const { container } = render(<MapLeaflet territory="GP" stores={mockStores} />);
    
    // Simuler IntersectionObserver
    const observe = jest.fn();
    window.IntersectionObserver = jest.fn(() => ({
      observe,
      disconnect: jest.fn(),
    }));
    
    await waitFor(() => {
      expect(observe).toHaveBeenCalled();
    });
  });
  
  it('should display error state on load failure', async () => {
    const { loadLeaflet } = require('../../utils/leafletClient');
    loadLeaflet.mockRejectedValueOnce(new Error('Failed to load'));
    
    render(<MapLeaflet territory="GP" stores={mockStores} />);
    
    await waitFor(() => {
      expect(screen.getByText(/erreur lors du chargement/i)).toBeInTheDocument();
    });
  });
  
  it('should limit markers on mobile', () => {
    // Mock mobile detection
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });
    
    const manyStores = Array.from({ length: 100 }, (_, i) => ({
      id: `store-${i}`,
      name: `Store ${i}`,
      lat: 16.265 + i * 0.01,
      lon: -61.551 + i * 0.01,
    }));
    
    render(<MapLeaflet territory="GP" stores={manyStores} />);
    
    // Vérifier que le message de limitation est affiché
    expect(screen.getByText(/50 magasins affichés/i)).toBeInTheDocument();
  });
});
```

**Checklist:**
- [ ] Tests MapLeaflet.jsx (>80% coverage)
- [ ] Tests Carte.jsx (filtres, clustering)
- [ ] Tests CarteObservations.jsx
- [ ] Tests utils/deviceDetection.js
- [ ] Tests utils/coordinates.js
- [ ] Tests d'intégration (Cypress/Playwright)
- [ ] Tests de performance (Lighthouse CI)

### 12. Migration CarteObservations vers API ⭐⭐⭐⭐
**Effort:** 1 jour  
**Urgence:** Haute (actuellement données statiques)

**Problème:**
```javascript
// ❌ Données statiques
const response = await fetch('/data/observations-validees.json');
```

**Solution:**
```javascript
// ✅ API dynamique avec cache
const response = await fetch('/api/observations/validated', {
  headers: {
    'Cache-Control': 'max-age=300', // Cache 5 min
  },
});
```

**Backend (Cloudflare Functions):**
```javascript
// functions/api/observations/validated.js
export async function onRequest({ env, request }) {
  const url = new URL(request.url);
  const territory = url.searchParams.get('territory');
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');
  
  // Query Firestore
  const observations = await env.FIRESTORE
    .collection('observations')
    .where('validated', '==', true)
    .where('territory', '==', territory || undefined)
    .where('date', '>=', startDate || '2020-01-01')
    .where('date', '<=', endDate || new Date().toISOString())
    .get();
  
  return Response.json(observations.docs.map(doc => doc.data()), {
    headers: {
      'Cache-Control': 'public, max-age=300',
      'Content-Type': 'application/json',
    },
  });
}
```

### 13. Monitoring Performance en Production ⭐⭐⭐
**Effort:** 1 jour

```javascript
// frontend/src/utils/mapPerformance.js
import { getAnalytics, logEvent } from 'firebase/analytics';

export function trackMapPerformance(eventName, metrics) {
  const analytics = getAnalytics();
  
  logEvent(analytics, eventName, {
    ...metrics,
    user_agent: navigator.userAgent,
    connection_type: navigator.connection?.effectiveType,
    device_memory: navigator.deviceMemory,
  });
}

// Utilisation
trackMapPerformance('map_loaded', {
  territory: 'GP',
  stores_count: 45,
  load_time_ms: 1234,
  mobile: true,
});

trackMapPerformance('map_interaction', {
  action: 'marker_click',
  store_id: 'store-123',
});
```

---

## 📊 Tableau Récapitulatif

| # | Suggestion | Priorité | Effort | Impact | Status |
|---|------------|----------|--------|--------|--------|
| 1 | Navigation clavier & WCAG | ⭐⭐⭐⭐⭐ | 2-3j | Critique | 🔴 À faire |
| 2 | Unification coordonnées | ⭐⭐⭐⭐ | 1j | Moyen | 🔴 À faire |
| 3 | Icônes par catégorie | ⭐⭐⭐⭐ | 2j | Élevé | 🔴 À faire |
| 4 | Recherche par nom | ⭐⭐⭐⭐ | 1j | Élevé | 🔴 À faire |
| 5 | Popups React (XSS) | ⭐⭐⭐⭐ | 1j | Critique | 🔴 À faire |
| 6 | Route optimization | ⭐⭐⭐ | 3-4j | Moyen | 🟡 Nice-to-have |
| 7 | Heatmap des prix | ⭐⭐⭐ | 2j | Moyen | 🟡 Nice-to-have |
| 8 | Mode offline | ⭐⭐⭐ | 2-3j | Moyen | 🟡 Nice-to-have |
| 9 | Export PDF/CSV | ⭐⭐ | 1-2j | Faible | 🟢 Futur |
| 10 | Favoris magasins | ⭐⭐ | 1j | Faible | 🟢 Futur |
| 11 | Tests automatisés | ⭐⭐⭐⭐ | 2-3j | Technique | 🔴 À faire |
| 12 | API CarteObservations | ⭐⭐⭐⭐ | 1j | Haute | 🔴 À faire |
| 13 | Monitoring performance | ⭐⭐⭐ | 1j | Moyen | 🟡 Nice-to-have |

**Légende:**
- 🔴 **À faire** (Priorité 2 - Sprint prochain)
- 🟡 **Nice-to-have** (Priorité 3 - Backlog)
- 🟢 **Futur** (Priorité 4 - Roadmap long terme)

---

## 🎯 Roadmap Suggérée

### Sprint 1 (2 semaines) - Priorité 2A
- [ ] #1: Navigation clavier & WCAG (2-3j)
- [ ] #2: Unification coordonnées (1j)
- [ ] #5: Popups React sécurisées (1j)
- [ ] #12: API CarteObservations (1j)
- [ ] #11: Tests automatisés (3j)

**Bénéfices:** Conformité WCAG, sécurité XSS, maintenabilité

### Sprint 2 (1 semaine) - Priorité 2B
- [ ] #3: Icônes par catégorie (2j)
- [ ] #4: Recherche par nom (1j)
- [ ] #13: Monitoring performance (1j)

**Bénéfices:** UX améliorée, découvrabilité, observabilité

### Sprint 3+ (Backlog) - Priorité 3
- [ ] #6: Route optimization (3-4j)
- [ ] #7: Heatmap des prix (2j)
- [ ] #8: Mode offline (2-3j)

**Bénéfices:** Fonctionnalités avancées, différenciation

---

## 📝 Conclusion

La **Priorité 1** (Performance) est ✅ **TERMINÉE**.

Les suggestions ci-dessus constituent la **Priorité 2** et au-delà. Elles se concentrent sur:
1. **Accessibilité & Conformité** (WCAG, sécurité)
2. **UX & Découvrabilité** (recherche, icônes, popups)
3. **Qualité & Maintenance** (tests, monitoring, refactoring)
4. **Fonctionnalités Avancées** (route optimization, heatmap, offline)

**Recommandation:** Commencer par le **Sprint 1** (Priorité 2A) pour solidifier les fondations avant d'ajouter de nouvelles fonctionnalités.

---

**Document créé par:** GitHub Copilot Coding Agent  
**Date:** 6 février 2026  
**Basé sur:** Analyse approfondie des 3 implémentations de carte (1,614 lignes de code)  
**Référence:** MAP_PERFORMANCE_COMPLETE.md (Priorité 1 terminée)
