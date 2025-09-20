# A KI PRI SA YÉ - GitHub Copilot Instructions

A KI PRI SA YÉ is a React 18 + Vite 5 PWA price comparison application for French overseas territories (Guadeloupe, Martinique, Réunion, etc.). The app uses TailwindCSS 4 for styling and deploys to multiple platforms.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Prerequisites
Ensure Node.js 18-22 is installed. Node.js 20 is recommended.
```bash
node --version  # Should show 20.x.x
npm --version   # Should show 10.x.x
```

### Bootstrap and Build
NEVER CANCEL builds or long-running commands. Wait for completion.

1. **Install dependencies (choose one method):**
   ```bash
   # Method 1: Using npm (recommended for first-time setup)
   npm install  # Takes ~12 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
   
   # Method 2: Using pnpm (if available)
   npm install -g pnpm  # Takes ~1 second
   pnpm install         # Takes ~7 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
   ```

2. **Build the application:**
   ```bash
   npm run build  # Takes ~1.5 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
   # OR
   pnpm run build  # Takes ~1.7 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
   ```
   - Build output goes to `dist/client/`
   - Build warnings about TailwindCSS utility classes are NORMAL and do not prevent successful builds

3. **Type checking:**
   ```bash
   npm run check  # TypeScript check (no tsconfig.json present, will show help)
   ```

### Development and Testing

1. **Start development server:**
   ```bash
   npm run dev  # Starts on http://localhost:5173/ in ~180ms. NEVER CANCEL.
   ```

2. **Preview production build:**
   ```bash
   npm run preview  # Starts on http://localhost:4173/. NEVER CANCEL.
   ```

3. **Test API endpoints (production):**
   ```bash
   chmod +x test_api.sh
   ./test_api.sh  # Tests https://akiprisaye.pages.dev/api endpoints
   ```

4. **Test deployment health:**
   ```bash
   chmod +x scripts/deploy_check.sh
   ./scripts/deploy_check.sh  # Checks production deployment status
   ```

## Validation Requirements

### CRITICAL: Manual Testing After Changes
ALWAYS manually validate the application after making code changes:

1. **Start the development server**: `npm run dev`
2. **Open http://localhost:5173/ in browser**
3. **Test basic functionality:**
   - Verify the page loads with "A KI PRI SA YÉ" heading
   - Fill the "Nom du produit" field with test data (e.g., "Pain de mie")
   - Fill the "Prix (€)" field with a price (e.g., "2.50")
   - Click the "Ajouter" button
   - Verify no console errors appear

### Build Timing Expectations
- **npm install**: ~12 seconds
- **pnpm install**: ~7 seconds  
- **Build**: ~1.5-2 seconds
- **Dev server startup**: ~180ms
- **NEVER CANCEL**: All commands complete quickly, but always set appropriate timeouts

## Common Issues and Solutions

### React Import Error
If you see "React is not defined" errors:
```jsx
// ALWAYS include React import in .jsx files
import React from "react";

export default function Component() {
  return <div>...</div>;
}
```

### TailwindCSS Warnings
Build warnings like "Cannot apply unknown utility class" are NORMAL and do not prevent successful builds. The app works correctly despite these warnings.

### Missing TypeScript Config
The project has TypeScript as a dependency but no `tsconfig.json`. The `npm run check` command will show TypeScript help instead of running type checks.

## Deployment Options

The project supports multiple deployment targets:

### 1. Cloudflare Pages (Primary)
- Automatic deployment via GitHub Actions on push to `main`
- Production URL: https://akiprisaye.pages.dev
- Uses `dist/` directory as build output

### 2. Firebase Hosting  
```bash
# Requires Firebase credentials configuration
./deploy_akipri.sh  # Automated Firebase deployment
```

### 3. GitHub Pages
```bash
./deploiement_akiprisaye_gitbash.sh  # GitHub Pages setup
```

### 4. Manual Build & Deploy
```bash
chmod +x deploy-pages.sh
./deploy-pages.sh  # Requires pnpm
```

## Project Structure

### Key Directories
- `/src/` - React application source code
- `/src/components/` - Reusable UI components
- `/src/pages/` - Application pages/routes
- `/src/contexts/` - React context providers
- `/public/` - Static assets
- `/functions/` - Firebase Cloud Functions
- `/worker_api/` - Cloudflare Workers API

### Important Files
- `package.json` - Dependencies and scripts
- `vite.config.js` - Vite build configuration
- `tailwind.config.js` - TailwindCSS configuration
- `firebase.json` - Firebase hosting configuration
- `.github/workflows/deploy.yml` - Automated deployment

### Build Artifacts (Do Not Edit)
- `dist/client/` - Vite build output
- `node_modules/` - Dependencies
- Various `.bak` files - Backup configurations

## Development Guidelines

### Code Style
- Use React functional components with hooks
- Include React imports in all .jsx files
- Follow existing TailwindCSS class patterns
- Maintain French language for UI text

### Testing
- No formal test suite exists
- Always manually test changes in browser
- Use API test scripts for backend validation
- Test on both development and preview servers

### Before Committing
1. Run `npm run build` to ensure build succeeds
2. Test in development server
3. Verify no new console errors
4. Test core user flows (form input, navigation)

## API Information

### Production Endpoints
- **Base URL**: https://akiprisaye.pages.dev/api
- **Territories**: `/api/territories` - List of DOM-TOM territories
- **Prices**: `/api/prices?territory=guadeloupe&limit=3` - Price data by territory

### Functions
- Firebase Functions in `/functions/` directory
- Cloudflare Workers in `/worker_api/` directory
- Test functions with `./test_functions.sh`

## Time-Saving Commands Reference

### Quick Development Cycle
```bash
# Fresh start (run once)
npm install && npm run build

# Development workflow  
npm run dev  # Start coding

# Before committing
npm run build  # Verify builds
```

### Common Debugging
```bash
# Check Node.js version
node --version

# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Test production API
./test_api.sh
```

Remember: This project has fast build times and simple setup. The main complexity is in the multiple deployment options and the TailwindCSS v4 configuration warnings (which are normal).