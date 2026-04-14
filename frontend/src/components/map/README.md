# Interactive Map Components

Core components for the store map feature using React Leaflet.

## Components

### StoreMap.tsx
Main map component that orchestrates all other components.

**Props:**
- `territory?: string` - Filter by territory code (e.g., 'GP', 'MQ')
- `chains?: string[]` - Filter by store chains
- `center?: [number, number]` - Initial map center coordinates
- `zoom?: number` - Initial zoom level
- `showHeatmap?: boolean` - Display price heatmap (future feature)
- `showUserLocation?: boolean` - Show user's current location
- `radius?: number` - Search radius in kilometers

**Features:**
- Automatic territory centering
- User geolocation support
- Marker clustering for better performance
- Real-time filtering
- Responsive design

**Example:**
```tsx
import { StoreMap } from '@/components/map';

function MapPage() {
  return (
    <div className="h-screen">
      <StoreMap
        territory="GP"
        showUserLocation={true}
        radius={10}
      />
    </div>
  );
}
```

### StoreMarker.tsx
Individual store marker with colored SVG based on price index.

**Props:**
- `store: StoreMarkerType` - Store data
- `onClick: (store) => void` - Click handler

**Features:**
- Color-coded by price category (green/orange/red)
- Hover tooltip with store name
- Custom SVG icon

### StorePopup.tsx
Store details popup displayed when clicking a marker.

**Props:**
- `store: StoreMarkerType` - Store data
- `onGetDirections?: (store) => void` - Directions callback
- `onViewDetails?: (store) => void` - Details view callback

**Features:**
- Store name, chain, and address
- Price index with visual indicator
- Average basket price
- Distance from user (if available)
- Services list
- Open/closed status
- Action buttons

### MapLegend.tsx
Price category legend positioned at bottom-right.

**Features:**
- Color coding explanation
- Price ranges (0-33, 34-66, 67-100)
- Emoji indicators
- Accessible labels

### MapFilters.tsx
Collapsible filter panel positioned at top-left.

**Props:**
- `filters: MapFiltersType` - Current filter state
- `availableChains: string[]` - List of available chains
- `availableServices: string[]` - List of available services
- `onFiltersChange: (filters) => void` - Filter change callback

**Features:**
- Territory selector
- Chain multi-select (checkboxes)
- Price category filters
- Services filters
- Radius slider (1-50 km)
- "Only open" toggle
- Reset button

## Types

See `/frontend/src/types/map.ts` for TypeScript definitions:
- `StoreMarker` - Store data structure
- `StoreMapProps` - Map component props
- `MapFilters` - Filter state
- `GeolocationState` - User location state

## Utilities

### `/frontend/src/utils/priceColors.ts`
- `getPriceCategory(index)` - Get price category from index
- `getMarkerColor(index)` - Get marker color
- `getAllPriceCategories()` - Get all categories for legend

### `/frontend/src/utils/geoUtils.ts`
- `calculateDistance(lat1, lon1, lat2, lon2)` - Haversine distance
- `formatDistance(km)` - Format distance for display
- `isWithinRadius(...)` - Check if point is within radius
- `getBounds(coordinates)` - Get bounding box
- `getCenterPoint(coordinates)` - Calculate center point

### `/frontend/src/utils/mapConfig.ts`
- `TERRITORY_CENTERS` - Territory center coordinates
- `MAP_CONFIG` - Map configuration constants
- `getTerritoryConfig(code)` - Get territory config

## Styling

Custom styles in `map.css`:
- Custom marker styles
- Marker cluster styles (small/medium/large)
- Popup and tooltip styles
- Responsive adjustments for mobile

## Dependencies

- `leaflet` ^1.9.4
- `react-leaflet` ^5.0.0
- `leaflet.markercluster` ^1.5.3
- `@types/leaflet` ^1.9.21

## Accessibility

All components include:
- ARIA labels and roles
- Keyboard navigation support
- Screen reader announcements
- High contrast colors
- Focus indicators

## Performance

- Marker clustering for large datasets
- Lazy loading of MarkerCluster library
- Memoized filters and calculations
- Efficient re-renders with useMemo/useCallback

## Future Enhancements

- Heatmap overlay for price visualization
- Route calculation and display
- Store hours display
- Real-time availability
- Search box with autocomplete
- Print/export map view
