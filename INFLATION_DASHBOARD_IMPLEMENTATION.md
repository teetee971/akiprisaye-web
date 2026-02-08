# Inflation Dashboard Implementation

## Overview
The inflation dashboard provides a comprehensive view of price inflation across DOM-TOM territories with comparison to metropolitan France.

## Files Created

### Components (`frontend/src/components/inflation/`)
1. **InflationBadge.tsx** - Color-coded badge (green/yellow/orange/red) based on inflation rate
2. **InflationTrend.tsx** - Arrow indicator showing trend direction (up/down/stable)
3. **PeriodSelector.tsx** - Dropdown to select time period (1m, 3m, 6m, 1y)
4. **ExportButton.tsx** - Export data in CSV, JSON, or XLSX format
5. **InflationOverviewCard.tsx** - Display global inflation index with territory selector
6. **TerritoryInflationCard.tsx** - Show single territory inflation with styled card
7. **TerritoryInflationGrid.tsx** - Responsive grid layout for territory cards
8. **InflationLineChart.tsx** - Line chart using react-chartjs-2 for historical trends
9. **CategoryBarChart.tsx** - Bar chart for category comparison
10. **MetroComparisonChart.tsx** - Bar chart comparing DOM-TOM vs Metro
11. **TopMoversTable.tsx** - Table showing top price increases/decreases
12. **index.ts** - Export all components

### Hooks (`frontend/src/hooks/`)
1. **useInflationData.ts** - Fetch inflation overview and territory data
   - Fetches from `/api/inflation/overview`
   - Includes fallback mock data for development
   - Supports filtering by period and territory

2. **useInflationHistory.ts** - Fetch historical inflation data
   - Fetches from `/api/inflation/history`
   - Returns time-series data for charts
   - Generates mock historical data for development

3. **useTopMovers.ts** - Fetch top price movers
   - Fetches from `/api/inflation/top-movers`
   - Returns products with biggest price changes
   - Includes mock data for development

### Pages (`frontend/src/pages/`)
1. **InflationDashboardPage.tsx** - Main dashboard page (updated existing file)
   - Full dashboard layout with all components
   - Period and territory selection
   - Export functionality
   - Responsive design
   - Error handling and loading states

## Features

### 1. Global Overview
- Displays overall inflation rate
- Territory selector dropdown
- Trend indicator (up/down/stable)

### 2. Territory Grid
- Responsive grid of territory cards
- Individual inflation rates
- Comparison to metropolitan France
- Last update timestamps

### 3. Historical Trends
- Line chart showing inflation evolution over time
- Configurable time periods (1m, 3m, 6m, 1y)
- Smooth animations

### 4. Category Analysis
- Bar chart comparing inflation by category
- Color-coded by severity
- Average across selected territories

### 5. Metro Comparison
- Side-by-side comparison of DOM-TOM vs Metro
- Multiple categories
- Visual color differentiation

### 6. Top Movers
- Table of products with biggest price increases
- Table of products with biggest price decreases
- Includes previous price, current price, and percentage change

### 7. Export Functionality
- Export to CSV format
- Export to JSON format
- Export to Excel (XLSX) format
- Includes all dashboard data

## Technical Details

### Dependencies Used
- **React 18** - Component framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **chart.js** (^4.5.1) - Chart rendering engine
- **react-chartjs-2** (^5.3.1) - React wrapper for Chart.js
- **lucide-react** (^0.468.0) - Icons
- **xlsx** (^0.18.5) - Excel export functionality
- **react-router-dom** (^7.13.0) - Routing
- **react-helmet-async** (^2.0.5) - SEO meta tags

### API Endpoints Expected
```
GET /api/inflation/overview?period={period}&territory={code}
GET /api/inflation/history?period={period}&territory={code}
GET /api/inflation/top-movers?period={period}&territory={code}&limit={number}
```

### API Configuration
API base URL is configured via environment variable:
```env
VITE_API_URL=http://localhost:3001
```
Falls back to `http://localhost:3001` if not set.

### Mock Data
All hooks include fallback mock data for development when API is unavailable. This allows frontend development to proceed independently.

## Component Usage

### Basic Example
```tsx
import { InflationDashboardPage } from './pages/InflationDashboardPage';

function App() {
  return <InflationDashboardPage />;
}
```

### Individual Component Usage
```tsx
import { 
  InflationOverviewCard,
  TerritoryInflationGrid,
  InflationLineChart 
} from './components/inflation';

function CustomDashboard() {
  const territories = [
    { code: 'GP', name: 'Guadeloupe' }
  ];

  return (
    <div>
      <InflationOverviewCard
        globalRate={5.2}
        trend="up"
        selectedTerritory="GP"
        territories={territories}
        onTerritoryChange={(code) => console.log(code)}
      />
    </div>
  );
}
```

## Accessibility

All components follow WCAG 2.1 guidelines:
- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Sufficient color contrast
- Focus indicators

## Responsive Design

The dashboard is fully responsive:
- Mobile: Single column layout
- Tablet: 2-column grid
- Desktop: 3-4 column grid
- Large screens: Optimized spacing

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## Styling Patterns

Components use Tailwind CSS with consistent patterns from existing pages:
- `bg-white` - White backgrounds
- `rounded-lg` / `rounded-xl` - Rounded corners
- `shadow-md` / `shadow-lg` - Drop shadows
- `border border-gray-200` - Borders
- `p-4` / `p-6` - Padding
- `gap-4` / `gap-6` - Spacing
- Hover states: `hover:shadow-lg`, `hover:bg-gray-50`

## Color System

### Inflation Rate Colors
- **Green**: < 2% (Low inflation)
- **Yellow**: 2-5% (Moderate inflation)
- **Orange**: 5-8% (High inflation)
- **Red**: > 8% (Very high inflation)

### Chart Colors
- **Blue** (#3B82F6): Primary data, Metro
- **Red** (#EF4444): DOM-TOM data, increases
- **Green** (#22C55E): Decreases, positive trends

## Error Handling

All hooks implement error handling:
1. Try to fetch from API
2. On error, log to console
3. Display error message to user
4. Fall back to mock data
5. Allow user to retry

## Performance Optimizations

- Memoized calculations using `useMemo`
- Lazy loading of chart components
- Efficient re-renders with proper dependencies
- Chart.js optimizations (decimation, parsing)

## Testing

To test the components:

```bash
# Development server
cd frontend
npm run dev

# Build
npm run build

# Lint
npm run lint
```

Navigate to `/inflation-dashboard` to view the page.

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live data
2. **Comparison Mode**: Compare multiple territories side-by-side
3. **Alerts**: Set up price increase alerts
4. **Predictions**: ML-based inflation predictions
5. **Detailed Analysis**: Drill-down into specific products
6. **PDF Export**: Generate PDF reports
7. **Social Sharing**: Share insights on social media
8. **Filters**: Advanced filtering by category, store, brand
9. **Date Range Picker**: Custom date ranges
10. **Print Optimization**: Print-friendly layouts

## Integration Notes

### Adding to Router
Add route in `App.tsx` or routing configuration:

```tsx
import InflationDashboardPage from './pages/InflationDashboardPage';

<Route path="/inflation-dashboard" element={<InflationDashboardPage />} />
```

### Navigation Menu
Add link to navigation:

```tsx
<Link to="/inflation-dashboard">
  <Activity size={20} />
  Tableau de bord Inflation
</Link>
```

## Troubleshooting

### Charts Not Displaying
Ensure Chart.js is properly registered:
```tsx
import { Chart as ChartJS, ... } from 'chart.js';
ChartJS.register(...);
```

### API Errors
Check:
1. API base URL is correct
2. CORS is configured on backend
3. API endpoints exist and return correct format
4. Network tab in browser dev tools

### Build Errors
Common issues:
1. Missing dependencies: `npm install`
2. TypeScript errors: Check imports and types
3. Module resolution: Check `tsconfig.json`

## Support

For issues or questions:
1. Check this documentation
2. Review component source code
3. Check browser console for errors
4. Review network requests in dev tools
5. Check backend API logs

## License

Part of the A KI PRI SA YÉ project.
