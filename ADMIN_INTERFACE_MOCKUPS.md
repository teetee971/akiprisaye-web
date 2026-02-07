# Admin Interface Visual Mockups

This document describes the visual design of the admin interface pages.

## 🎨 Design System

### Color Palette
- **Background**: Gradient from `blue-50` → `indigo-50` → `purple-50`
- **Cards**: Glassmorphism - `bg-white/[0.08]` with `backdrop-blur-[14px]`
- **Borders**: `border-white/[0.22]`
- **Text**: White with varying opacity (100%, 70%)
- **Accents**: 
  - Blue gradient: `from-blue-500 to-cyan-500`
  - Purple gradient: `from-purple-500 to-pink-500`
  - Green gradient: `from-green-500 to-emerald-500`
  - Orange gradient: `from-orange-500 to-red-500`

### Typography
- **Headings**: Bold, white text
- **Body**: Regular, white/70 text
- **Font Family**: System font stack (default)

---

## 📐 Page Layouts

### 1. Admin Layout (Shell)

```
┌─────────────────────────────────────────────────────────────────┐
│ Sidebar (Desktop)                    │ Main Content              │
│ ┌──────────────────────────────────┐ │                           │
│ │ 🏠 Administration                │ │ ☰ Menu (Mobile)           │
│ │ A KI PRI SA YÉ                   │ │                           │
│ ├──────────────────────────────────┤ │ 👤 Administrateur         │
│ │                                  │ ├───────────────────────────┤
│ │ 📊 Dashboard          [Active]   │ │                           │
│ │ 🏪 Enseignes                     │ │                           │
│ │ 📦 Articles                       │ │     Page Content          │
│ │ 📤 Import                         │ │     Renders Here          │
│ │ 📈 Statistiques                   │ │                           │
│ │                                  │ │                           │
│ │ [270+ lines of space]            │ │                           │
│ │                                  │ │                           │
│ ├──────────────────────────────────┤ │                           │
│ │ ← Retour au site                 │ │                           │
│ └──────────────────────────────────┘ │                           │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Collapsible sidebar (mobile)
- Active route highlighting
- Glassmorphism cards
- Sticky navigation

---

### 2. Admin Dashboard

```
┌────────────────────────────────────────────────────────────────────┐
│ Tableau de bord                                                    │
│ Vue d'ensemble de la plateforme A KI PRI SA YÉ                   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│ │ 🏪 156  │  │ 📦 2.4K │  │ 💰 12K  │  │ 📍 7    │              │
│ │Enseignes│  │Articles │  │  Prix   │  │Territ.  │              │
│ └─────────┘  └─────────┘  └─────────┘  └─────────┘              │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Dernières modifications                                      │  │
│ ├──────────────────────────────────────────────────────────────┤  │
│ │ • Super U Raizet ajouté                    il y a 2h        │  │
│ │ • 45 produits importés                     il y a 5h        │  │
│ │ • Prix Carrefour MAJ                       hier             │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐                         │
│ │ 🏪       │  │ 📦       │  │ 📤       │                         │
│ │ Gérer    │  │ Gérer    │  │ Import   │                         │
│ │ enseignes│  │ articles │  │ en masse │                         │
│ │ [Accéder]│  │ [Accéder]│  │ [Accéder]│                         │
│ └──────────┘  └──────────┘  └──────────┘                         │
└────────────────────────────────────────────────────────────────────┘
```

**Components:**
- 4 stat cards with gradient icons
- Recent activity feed
- 3 quick action cards
- Responsive grid layout

---

### 3. Store List Page

```
┌────────────────────────────────────────────────────────────────────┐
│ 🏪 Enseignes                                   [+ Nouvelle enseigne]│
├────────────────────────────────────────────────────────────────────┤
│ 🔍 Rechercher...     Territoire [Tous ▼]     Statut [Tous ▼]      │
├─────────┬─────────────┬───────────┬────────┬─────────┬────────────┤
│ Nom     │ Territoire  │ Ville     │ Statut │ Actions │            │
├─────────┼─────────────┼───────────┼────────┼─────────┤            │
│ Carrefo │ Guadeloupe  │ Pointe-à- │ 🟢     │ 👁️ ✏️ 🗑️│            │
│ -ur     │             │ Pitre     │        │         │            │
├─────────┼─────────────┼───────────┼────────┼─────────┤            │
│ Super U │ Guadeloupe  │ Les Abyms │ 🟢     │ 👁️ ✏️ 🗑️│            │
│ Raizet  │             │           │        │         │            │
├─────────┼─────────────┼───────────┼────────┼─────────┤            │
│ Leader  │ Martinique  │ Fort-de-  │ 🔴     │ 👁️ ✏️ 🗑️│            │
│ Price   │             │ France    │        │         │            │
└─────────┴─────────────┴───────────┴────────┴─────────┴────────────┘
│ ◀ 1 2 3 ... 12 ▶                    Afficher [20 ▼] par page     │
└────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Search bar with debouncing
- Territory filter dropdown
- Status filter (All/Active/Inactive)
- Sortable columns
- Inline actions (View/Edit/Delete)
- Pagination controls
- Configurable page size

---

### 4. Store Form Page

```
┌────────────────────────────────────────────────────────────────────┐
│ Créer une enseigne                                     ← Annuler   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ Informations générales                                            │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Nom du magasin *                                             │  │
│ │ [_________________________________________________________]  │  │
│ │                                                              │  │
│ │ Enseigne (Brand ID) *                                        │  │
│ │ [_________________________________________________________]  │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ Adresse                                                            │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Adresse complète *                                           │  │
│ │ [_________________________________________________________]  │  │
│ │                                                              │  │
│ │ Code postal *        Ville *                                 │  │
│ │ [____________]       [____________________________]          │  │
│ │                                                              │  │
│ │ Territoire *                                                 │  │
│ │ [Guadeloupe ▼]                                              │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ Géolocalisation                            [🗺️ Géolocaliser]      │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Latitude             Longitude                               │  │
│ │ [____________]       [____________]                          │  │
│ │                                                              │  │
│ │ Téléphone                                                    │  │
│ │ [_________________________________________________________]  │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│                                    [Annuler]  [Créer l'enseigne]  │
└────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Grouped form sections
- Required field indicators (*)
- Territory dropdown (11 options)
- Geocoding button (auto-fills lat/lon)
- Real-time validation
- Toast notifications on submit
- Cancel/Submit actions

---

### 5. Store Detail Page

```
┌────────────────────────────────────────────────────────────────────┐
│ ← Retour    Super U Raizet                    ✏️ Modifier  🗑️ Suppr│
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Informations générales                                       │  │
│ ├──────────────────────────────────────────────────────────────┤  │
│ │ Nom: Super U Raizet                                          │  │
│ │ Enseigne: Super U                                            │  │
│ │ Statut: 🟢 Actif                                             │  │
│ │                                                              │  │
│ │ Adresse                                                       │  │
│ │ 123 Rue de la République                                     │  │
│ │ 97139 Les Abymes                                             │  │
│ │ Guadeloupe                                                   │  │
│ │                                                              │  │
│ │ Téléphone: 0590 00 00 00                                     │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Localisation                                                 │  │
│ ├──────────────────────────────────────────────────────────────┤  │
│ │ Latitude: 16.2415                                            │  │
│ │ Longitude: -61.5331                                          │  │
│ │                                                              │  │
│ │ [Leaflet Map Display]                                        │  │
│ │  📍                                                           │  │
│ │    🗺️ Interactive Map                                        │  │
│ │                                                              │  │
│ └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Back navigation
- Edit/Delete actions in header
- Grouped information display
- Status indicator (green/red dot)
- Interactive Leaflet map (if coordinates)
- Responsive layout

---

### 6. Product List Page

```
┌────────────────────────────────────────────────────────────────────┐
│ 📦 Articles                                      [+ Nouveau produit]│
├────────────────────────────────────────────────────────────────────┤
│ 🔍 Rechercher (nom/EAN)...   Catégorie [Toutes ▼]  Marque [____]  │
│ ☑️ Avec EAN uniquement                                              │
├───────┬──────────────┬─────────┬───────────┬──────────┬──────────┤
│ Image │ Nom          │ Marque  │ Catégorie │ EAN      │ Actions  │
├───────┼──────────────┼─────────┼───────────┼──────────┼──────────┤
│ 🖼️    │ Nutella 400g │ Ferrero │ Épicerie  │ 3017...  │ 👁️ ✏️ 🗑️ │
├───────┼──────────────┼─────────┼───────────┼──────────┼──────────┤
│ 🖼️    │ Coca-Cola 2L │ Coca    │ Boissons  │ 5449...  │ 👁️ ✏️ 🗑️ │
├───────┼──────────────┼─────────┼───────────┼──────────┼──────────┤
│ 📷    │ Pain complet │ Various │ Boulanger │ -        │ 👁️ ✏️ 🗑️ │
└───────┴──────────────┴─────────┴───────────┴──────────┴──────────┘
│ ◀ 1 2 3 ... 24 ▶                    Afficher [20 ▼] par page     │
└────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Product image thumbnails
- Search by name or EAN
- Category dropdown filter
- Brand text filter
- "Has EAN" checkbox filter
- Sortable columns
- Inline actions
- Pagination

---

### 7. Product Form Page

```
┌────────────────────────────────────────────────────────────────────┐
│ Créer un produit                                       ← Annuler   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ Informations principales                                          │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Nom du produit *                                             │  │
│ │ [_________________________________________________________]  │  │
│ │                                                              │  │
│ │ Marque                    Catégorie *                        │  │
│ │ [_______________]         [Alimentaire ▼]                   │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ Code-barres EAN                          [🔍 OpenFoodFacts]       │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ EAN-13 (13 chiffres)                                         │  │
│ │ [_________________________________________________________]  │  │
│ │ ℹ️ Entrez un EAN pour rechercher automatiquement              │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ Description & contenance                                          │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Description (optionnelle)                                    │  │
│ │ [_________________________________________________________]  │  │
│ │ [_________________________________________________________]  │  │
│ │ [_________________________________________________________]  │  │
│ │                                                              │  │
│ │ Quantité *           Unité *                                 │  │
│ │ [____________]       [grammes (g) ▼]                        │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ Image                                                              │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ URL de l'image                                               │  │
│ │ [_________________________________________________________]  │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│                                  [Annuler]  [Créer le produit]    │
└────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Grouped form sections
- OpenFoodFacts lookup button
- Auto-fill on EAN search
- Category dropdown (5 categories)
- Unit dropdown (g, kg, ml, L, unité)
- Optional description textarea
- Optional image URL
- Real-time validation
- Toast notifications

---

### 8. CSV Import Page

```
┌────────────────────────────────────────────────────────────────────┐
│ 📤 Import en masse                                                 │
├────────────────────────────────────────────────────────────────────┤
│ [Enseignes] [Produits] [Prix]                    ← Tab Navigation  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ 📋 Instructions                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Format attendu: CSV avec colonnes                            │  │
│ │ name, address, city, territory, phone, lat, lon              │  │
│ │                                          [📥 Télécharger mod.]│  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ 📂 Fichier                                                         │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │           Glissez-déposez votre fichier CSV                  │  │
│ │                     ou                                       │  │
│ │              [📤 Cliquez pour parcourir]                     │  │
│ │                                                              │  │
│ │              Fichiers acceptés: .csv, .xlsx                  │  │
│ │              Taille max: 50 MB                               │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ✅ Aperçu (20 premières lignes)                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Nom          │ Territoire │ Ville      │ Statut              │  │
│ ├──────────────┼────────────┼────────────┼─────────────────────┤  │
│ │ Carrefour    │ GP         │ PAP        │ ✅ Valide           │  │
│ │ Super U      │ GP         │ Abymes     │ ✅ Valide           │  │
│ │ Leader Price │ MQ         │ FDF        │ ❌ Code postal req. │  │
│ └──────────────┴────────────┴────────────┴─────────────────────┘  │
│                                                                    │
│ 📊 Résumé: 150 lignes | 148 valides | 2 erreurs                   │
│                                                                    │
│                                         [Importer les données]     │
└────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Tabbed interface (3 tabs)
- CSV format instructions
- Download template button
- Drag & drop upload area
- File validation
- Preview table (first 20 rows)
- Error highlighting
- Summary statistics
- Import button

---

### 9. Import Report Page

```
┌────────────────────────────────────────────────────────────────────┐
│ 📊 Résultat de l'import                                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ ✅ Import terminé avec succès                                      │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Statistiques                                                 │  │
│ ├──────────────────────────────────────────────────────────────┤  │
│ │ Total:      150 lignes                                       │  │
│ │ Importées:  148 lignes  ████████████████░░  98.7%           │  │
│ │ Échecs:     2 lignes                                         │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ❌ Erreurs détaillées                            [📥 Télécharger]  │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Ligne 15: Code postal requis                                 │  │
│ │ Ligne 87: Territoire invalide (XYZ)                          │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│                                    [Importer un autre fichier]     │
└────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Success/error status
- Progress bar with percentage
- Statistics breakdown
- Detailed error list
- Download error report button
- "Import another file" button
- Color coding (green/red/yellow)

---

## 🎯 Responsive Behavior

### Desktop (≥ 1024px)
- Sidebar always visible
- Full-width data tables
- Multi-column layouts

### Tablet (768px - 1023px)
- Collapsible sidebar
- Responsive tables with scroll
- Adjusted column widths

### Mobile (< 768px)
- Hidden sidebar (hamburger menu)
- Stacked form fields
- Mobile-optimized tables
- Bottom action buttons

---

## 🎨 Animation & Transitions

- **Hover**: `hover:bg-white/10`, `hover:scale-105`
- **Active**: `active:scale-95`
- **Transitions**: `transition-all duration-300`
- **Loading**: Spinner with pulse animation
- **Toast**: Slide-in from top

---

## ♿ Accessibility Features

- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation support
- ✅ Focus indicators (`focus:ring-2`)
- ✅ Screen reader friendly
- ✅ High contrast text (white on gradient)
- ✅ Semantic HTML structure

---

**Design System Version**: 1.0  
**Last Updated**: February 7, 2026  
**Status**: Production-ready
