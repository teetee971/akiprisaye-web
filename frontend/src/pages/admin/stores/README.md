# Store Management Admin Pages

This directory contains the admin interface pages for managing stores (enseignes).

## Components

### StoreList.tsx
List view for stores with:
- Pagination and sorting via @tanstack/react-table
- Search by store name
- Filters: Territory dropdown, Status (active/inactive)
- Edit/Delete actions with confirmation dialogs
- Responsive glassmorphism design

### StoreForm.tsx
Create/Edit form with:
- Form validation using react-hook-form + zod
- Required fields: name, brandId, address, postalCode, city, territory
- Optional fields: latitude, longitude, phone
- Geocoding button to auto-fill coordinates
- Active status checkbox (edit mode only)
- Toast notifications for feedback

### StoreDetail.tsx
Detail view showing:
- Full store information
- Interactive Leaflet map with marker (when coordinates available)
- Edit/Delete action buttons
- Formatted timestamps and status indicators

## Routes

- `/admin/stores` - List all stores
- `/admin/stores/new` - Create new store
- `/admin/stores/:id` - View store details
- `/admin/stores/:id/edit` - Edit store

## Services Used

- `storeAdminService.ts` - CRUD operations for stores
- `geocodingService.ts` - Address to coordinates conversion

## Dependencies

All required dependencies are already in package.json:
- @tanstack/react-table
- react-hook-form
- @hookform/resolvers
- zod
- leaflet
- react-leaflet
- lucide-react
- react-hot-toast
