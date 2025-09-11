# Design Guidelines for A KI PRI SA YÉ (FR)

## Design Approach Documentation
**Selected Approach:** Reference-based design inspired by modern utility apps like Notion and Linear, with tropical/Caribbean visual elements to reflect the Territoires d'Outre-Mer context.

**Key Design Principles:**
- Mobile-first responsive design optimized for smartphone usage
- Clear data visualization prioritizing readability
- Tropical color palette reflecting Caribbean/Pacific island heritage
- Accessibility-focused with strong contrast ratios

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Light mode: Deep ocean blue (220 85% 25%) for headers and primary actions
- Dark mode: Coral accent (15 80% 65%) for interactive elements
- Neutral grays: (220 15% 95%) light backgrounds, (220 20% 15%) dark backgrounds

**Accent Colors:**
- Tropical teal (180 65% 45%) for positive price trends
- Warm coral (15 75% 55%) for negative price trends
- Sandy beige (45 25% 85%) for neutral backgrounds

### B. Typography
- **Primary:** Inter (Google Fonts) for all interface text
- **Secondary:** Poppins for headings and hero text
- Sizes: text-sm (14px) base, text-lg (18px) headings, text-3xl hero sections

### C. Layout System
**Tailwind Spacing Units:** Consistent use of 2, 4, 8, 12, 16 units
- Micro spacing: p-2, m-2 for tight elements
- Standard spacing: p-4, m-4 for general layout
- Section spacing: p-8, m-8 for major components
- Page-level: p-12, m-16 for outer containers

### D. Component Library

**Navigation:**
- Sticky mobile navigation bar with island-inspired iconography
- Bottom tab bar for primary sections (Prix, Carte, Palmarès)
- Breadcrumb navigation for deep product comparisons

**Data Visualization:**
- Clean line charts for price evolution using tropical color gradients
- Card-based layout for price comparisons with clear typography hierarchy
- Interactive map with custom markers for different territories
- Leaderboard-style ranking cards with subtle shadows

**Forms & Inputs:**
- Rounded search bars with prominent search icons
- Territory filter dropdowns with flag imagery
- Product category chips with icon representations

**Cards & Lists:**
- Product comparison cards with price highlighting
- Store rating cards with star ratings and territory badges
- Price alert notification cards with action buttons

### E. Mobile-First Considerations
- Touch-friendly button sizes (minimum 44px height)
- Swipeable price comparison carousels
- Collapsible sections for detailed product information
- Pull-to-refresh functionality for price updates

## Images
**Hero Section:** Medium-sized hero (40vh) featuring a stylized illustration of tropical islands with price comparison overlay graphics
**Territory Map:** Interactive SVG map of French overseas territories with custom styling
**Store Logos:** Small (32px) store logo thumbnails in ranking cards
**Product Images:** Standardized 80px square product thumbnails with rounded corners
**Background Elements:** Subtle tropical pattern overlays for section dividers

## Special Features
- Price trend arrows with color-coded indicators
- Territory-specific currency formatting
- Accessibility features including high contrast mode
- Smooth transitions between price comparison views
- Gentle haptic feedback for mobile interactions