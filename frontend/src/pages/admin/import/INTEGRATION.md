# Integration Guide for CSV Import Pages

This guide shows how to integrate the CSV import pages into your admin interface.

## Quick Start

### 1. Import the Component

```tsx
import { ImportPage } from '@/pages/admin/import';
```

### 2. Add to Admin Routes

If using React Router:

```tsx
import { Routes, Route } from 'react-router-dom';
import { ImportPage } from '@/pages/admin/import';
import AdminLayout from '@/pages/admin/AdminLayout';

function AdminRoutes() {
  return (
    <AdminLayout>
      <Routes>
        {/* Other admin routes */}
        <Route path="/admin/import" element={<ImportPage />} />
      </Routes>
    </AdminLayout>
  );
}
```

### 3. Add Navigation Link

In your admin navigation menu:

```tsx
import { FileSpreadsheet } from 'lucide-react';

<nav>
  {/* Other nav items */}
  <NavLink to="/admin/import">
    <FileSpreadsheet className="w-5 h-5" />
    <span>Import CSV</span>
  </NavLink>
</nav>
```

## Complete Example

Here's a complete integration example with the admin layout:

```tsx
// pages/admin/AdminLayout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Package, 
  FileSpreadsheet,
  Settings 
} from 'lucide-react';

export function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/stores', label: 'Stores', icon: Store },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/import', label: 'Import CSV', icon: FileSpreadsheet },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-white/5 backdrop-blur-md border-r border-white/20">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

```tsx
// App.tsx or admin routes file
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import { ImportPage } from '@/pages/admin/import';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        
        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="import" element={<ImportPage />} />
          {/* Other admin routes */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## Dashboard Integration

Add import statistics to your admin dashboard:

```tsx
// pages/admin/AdminDashboard.tsx
import { FileSpreadsheet } from 'lucide-react';
import { Link } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats cards */}
        
        {/* Import Card */}
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Quick Actions</p>
              <h3 className="text-2xl font-bold text-white mt-1">Import</h3>
            </div>
            <FileSpreadsheet className="w-12 h-12 text-blue-400" />
          </div>
          <Link
            to="/admin/import"
            className="mt-4 block text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Import CSV
          </Link>
        </GlassCard>
      </div>
    </div>
  );
}
```

## Standalone Usage

You can also use individual components separately:

```tsx
import { CsvUploader, ImportPreview } from '@/pages/admin/import';
import { useState } from 'react';

function MyCustomImporter() {
  const [data, setData] = useState([]);
  
  return (
    <div>
      <CsvUploader
        onFileLoaded={(data, file) => setData(data)}
        onError={(error) => console.error(error)}
      />
      
      {data.length > 0 && (
        <ImportPreview
          data={data}
          errors={[]}
        />
      )}
    </div>
  );
}
```

## Customization

### Custom Styling

Override default styles:

```tsx
<ImportPage className="custom-import-page" />
```

```css
.custom-import-page .glass-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}
```

### Custom Validation

Add custom validation logic:

```tsx
const validateCustomData = (data: any[]) => {
  const errors: ImportError[] = [];
  
  data.forEach((row, index) => {
    // Your custom validation
    if (row.customField && !isValid(row.customField)) {
      errors.push({
        row: index + 2,
        field: 'customField',
        message: 'Invalid custom field',
      });
    }
  });
  
  return errors;
};
```

## API Integration

The import components work with the existing `csvImportService`:

```tsx
import {
  importStoresFromCSV,
  importProductsFromCSV,
} from '@/services/csvImportService';

// Import with progress tracking
const result = await importStoresFromCSV(
  csvContent,
  true, // Enable geocoding
  (current, total) => {
    console.log(`Progress: ${current}/${total}`);
  }
);

console.log(`Imported ${result.successful} stores`);
console.log(`Failed: ${result.failed}`);
console.log('Errors:', result.errors);
```

## Testing

Test the import functionality:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportPage } from '@/pages/admin/import';

test('uploads and previews CSV file', async () => {
  render(<ImportPage />);
  
  const file = new File(['name,address,territory\nTest,123 St,GP'], 'test.csv', {
    type: 'text/csv',
  });
  
  const input = screen.getByLabelText(/upload/i);
  await userEvent.upload(input, file);
  
  await waitFor(() => {
    expect(screen.getByText(/aperçu/i)).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Import button disabled
- Ensure CSV file is uploaded
- Check that validation passed
- Verify at least one valid row exists

### Geocoding timeout
- Reduce batch size
- Add delay between requests
- Use pre-geocoded coordinates

### Memory issues with large files
- Limit preview rows
- Process in batches
- Increase max file size carefully

## Support

For issues or questions:
1. Check the README.md in the import directory
2. Review csvImportService.ts documentation
3. Check browser console for errors
4. Verify CSV format matches templates
