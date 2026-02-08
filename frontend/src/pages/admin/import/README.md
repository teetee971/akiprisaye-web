# CSV Import Admin Pages

This directory contains the CSV import functionality for the admin interface, allowing administrators to bulk import stores, products, and prices from CSV files.

## Components

### ImportPage.tsx
Main page component with tabbed interface for managing different types of imports.

**Features:**
- Three tabs: Stores, Products, and Prices
- Multi-step import workflow:
  1. Upload: Select and validate CSV file
  2. Preview: Review data with inline validation
  3. Import: Process with progress indicator
  4. Results: View detailed import statistics
- Download CSV templates
- Contextual instructions for each import type

**Usage:**
```tsx
import { ImportPage } from '@/pages/admin/import';

// In your admin routes
<Route path="/admin/import" element={<ImportPage />} />
```

### CsvUploader.tsx
Reusable file upload component with drag-and-drop support.

**Features:**
- Drag and drop interface
- Click to browse fallback
- File type validation (.csv only by default)
- File size validation (configurable max size)
- CSV parsing using PapaParse
- Loading states and error handling
- Visual feedback during upload

**Props:**
```tsx
interface CsvUploaderProps {
  onFileLoaded: (data: any[], file: File) => void;
  onError: (error: string) => void;
  acceptedTypes?: string[];  // Default: ['.csv', '.xlsx']
  maxSize?: number;          // Default: 10MB
}
```

**Usage:**
```tsx
<CsvUploader
  onFileLoaded={(data, file) => {
    console.log('Loaded data:', data);
  }}
  onError={(error) => {
    toast.error(error);
  }}
  maxSize={50} // 50MB
/>
```

### ImportPreview.tsx
Data preview component with validation and statistics.

**Features:**
- Interactive table using @tanstack/react-table
- Displays first 20 rows (configurable)
- Real-time validation with inline error highlighting
- Hover tooltips on error fields
- Statistics: total rows, valid rows, error count
- Detailed error list (expandable)
- Row-level error tracking

**Props:**
```tsx
interface ImportPreviewProps {
  data: any[];
  errors: ImportError[];
  maxRows?: number;  // Default: 20
  onValidationComplete?: (validCount: number, errorCount: number) => void;
}
```

**Usage:**
```tsx
<ImportPreview
  data={csvData}
  errors={validationErrors}
  maxRows={30}
  onValidationComplete={(valid, errors) => {
    console.log(`${valid} valid, ${errors} with errors`);
  }}
/>
```

### ImportReport.tsx
Results display component showing import statistics and errors.

**Features:**
- Success/failure statistics with visual indicators
- Success rate progress bar
- Detailed error list with row numbers
- Download error report as CSV
- "Import another file" reset button
- Color-coded status indicators

**Props:**
```tsx
interface ImportReportProps {
  result: ImportResult<any>;
  onReset: () => void;
  entityType: string;  // "magasins" or "produits"
}
```

**Usage:**
```tsx
<ImportReport
  result={importResult}
  onReset={() => setStep('upload')}
  entityType="magasins"
/>
```

## CSV Format Requirements

### Stores CSV Format
Required columns:
- `name` - Store name (required)
- `address` - Full address (required)
- `territory` - Territory code: GP, MQ, GF, RE, YT, PM, BL, MF, WF, PF, NC (required)

Optional columns:
- `chain` - Store chain/brand
- `city` - City name
- `phone` - Phone number
- `lat` - Latitude (auto-geocoded if missing)
- `lon` - Longitude (auto-geocoded if missing)
- `type` - Store type (default: "supermarket")
- `services` - Comma-separated services

**Example:**
```csv
name,chain,address,city,territory,phone,lat,lon,type,services
Carrefour Jarry,Carrefour,123 Rue de la République,Pointe-à-Pitre,GP,0590 00 00 00,16.2415,-61.5331,supermarket,parking,bakery
```

### Products CSV Format
Required columns:
- `ean` - EAN barcode (8 or 13 digits, required)
- `name` - Product name (required)

Optional columns:
- `brand` - Brand name
- `category` - Product category
- `unit` - Unit of measure
- `price` - Price
- `store` - Store ID
- `territory` - Territory code
- `date` - Observation date (YYYY-MM-DD)

**Example:**
```csv
ean,name,brand,category,unit,price,store,territory,date
3017620422003,Nutella 400g,Ferrero,Épicerie sucrée,pot,4.99,carrefour-jarry,GP,2024-01-15
```

### Prices CSV Format
Required columns:
- `ean` - Product EAN (required)
- `price` - Price (required)
- `store` - Store ID (required)
- `territory` - Territory code (required)

Optional columns:
- `date` - Observation date (YYYY-MM-DD)

**Example:**
```csv
ean,price,store,territory,date
3017620422003,4.99,carrefour-jarry,GP,2024-01-15
```

## Integration with Services

The import components integrate with:

### csvImportService.ts
- `importStoresFromCSV(content, geocode, onProgress)` - Import stores with optional geocoding
- `importProductsFromCSV(content, onProgress)` - Import products
- `generateStoreCSVTemplate()` - Generate store template
- `generateProductCSVTemplate()` - Generate product template
- `downloadCSV(content, filename)` - Download CSV file

### csv.ts utilities
- `parseCsv(content, delimiter)` - Parse CSV to array of objects
- `stringifyCsv(rows, delimiter)` - Convert array to CSV string

## Error Handling

All components include comprehensive error handling:

1. **File Validation**: Type and size validation before parsing
2. **CSV Parsing**: Handles malformed CSV with helpful error messages
3. **Data Validation**: Field-level validation with specific error messages
4. **Import Errors**: Row-level error tracking with detailed reports

Error messages are displayed:
- Inline in preview table (highlighted fields)
- In statistics summary
- In detailed error list
- In downloadable error report

## Styling

All components follow the glassmorphism design pattern:
- GlassCard component for containers
- lucide-react icons throughout
- Tailwind CSS for responsive layout
- Color-coded status indicators:
  - Green: Success
  - Yellow: Warning
  - Red: Error
  - Blue: Info/Progress

## State Management

The import flow manages multiple states:
- `upload`: Initial file selection
- `preview`: Data validation and review
- `importing`: Processing with progress
- `results`: Final report

State is managed locally in ImportPage.tsx with clear transitions between steps.

## Accessibility

- Proper ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly error messages
- Color contrast meets WCAG standards
- Focus indicators on all interactive elements

## Performance

- Lazy loading of CSV parsing library
- Preview limited to 20 rows by default
- Progress callbacks during import
- Efficient table rendering with @tanstack/react-table
- Debounced validation

## Future Enhancements

Potential improvements:
- Excel file support (.xlsx parsing)
- CSV column mapping interface
- Batch import queuing
- Import scheduling
- Data transformation rules
- Duplicate detection
- Undo/rollback functionality

## Testing

To test the import functionality:

1. Navigate to `/admin/import`
2. Select the "Enseignes" tab
3. Click "Télécharger le modèle CSV"
4. Open the template and add your data
5. Upload the file
6. Review the preview and errors
7. Click "Importer" to process
8. Review the results report

## Troubleshooting

**CSV not parsing:**
- Ensure file is UTF-8 encoded
- Check for proper comma delimiters
- Verify header row exists

**Validation errors:**
- Check required fields are present
- Verify EAN codes are 8 or 13 digits
- Ensure territory codes are valid
- Confirm numeric fields are numbers

**Import fails:**
- Check network connection
- Verify API endpoints are accessible
- Review browser console for errors
- Check file size (max 50MB)

## Related Files

- `/frontend/src/services/csvImportService.ts` - Import logic
- `/frontend/src/utils/csv.ts` - CSV utilities
- `/frontend/src/components/ui/GlassCard.jsx` - UI component
- `/frontend/src/pages/admin/AdminLayout.tsx` - Admin layout
