# A KI PRI SA YÉ - Price Comparison Web Application

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Project Overview

A KI PRI SA YÉ is a React-based price comparison web application for French overseas territories (DOM-TOM). The application is built with Vite, uses Tailwind CSS for styling, and deploys to both Firebase Hosting and Cloudflare Pages.

## Working Effectively

### Prerequisites and Setup
- **Node.js version**: 20+ (currently 20.19.5 works perfectly)
- **Package manager**: npm (10.8.2)
- **Firebase CLI**: Required for Functions deployment - install with `npm install -g firebase-tools`

### Bootstrap and Build Process
**VALIDATED COMMANDS** - Always run these commands in order for a fresh setup:

```bash
# Install dependencies (takes 15 seconds) - NEVER CANCEL
npm install

# Build application (takes 2 seconds) - NEVER CANCEL builds, timeout: 60+ minutes  
npm run build

# Development server (starts in <200ms)
npm run dev
# → Application available at http://localhost:5173

# Preview production build (starts in <200ms, after build)
npm run preview  
# → Application available at http://localhost:4173
```

**CRITICAL TIMING INFORMATION:**
- `npm install`: 15 seconds - NEVER CANCEL, set timeout to 300+ seconds
- `npm run build`: 2 seconds - NEVER CANCEL, set timeout to 1800+ seconds (60+ minutes)
- `npm run dev`: Instant startup
- `npm run preview`: Instant startup

**NEVER CANCEL** any build or long-running commands. Always set timeout to 60+ minutes for any build operations.

### Key Commands and Timing

- `npm install` - 15 seconds - Installs all dependencies
- `npm run build` - 2 seconds - NEVER CANCEL: Builds application to `dist/` directory
- `npm run dev` - Instant startup - Runs development server on http://localhost:5173
- `npm run preview` - Instant startup - Serves production build on http://localhost:4173
- `npm run check` - TypeScript check (requires tsconfig.json - currently not configured)
- `npm run start` - Alias for preview command

### Configuration Files
**Critical configuration files that must be maintained:**
- `postcss.config.cjs` - PostCSS configuration (use .cjs extension, NOT .js)
- `tailwind.config.js` - Tailwind CSS configuration
- `vite.config.js` - Vite build configuration
- `package.json` - Dependencies and scripts

### Firebase Functions
Located in `/functions` directory:
```bash
cd functions
npm install  # Takes ~4 seconds
# Firebase CLI required for deployment
```

## Validation

### Manual Testing Requirements
**VALIDATED SCENARIOS** - Always perform these validation steps after making changes:

1. **Basic Application Testing** (VALIDATED ✅):
   ```bash
   npm run dev
   # Navigate to http://localhost:5173
   # Verify the form loads with "A KI PRI SA YÉ" heading
   # Test product name input (e.g., "Pain de mie", "Baguette de pain", "Test Final - Produit DOM-TOM")
   # Test price input (e.g., "2.50", "1.20", "3.75")
   # Click "Ajouter" button to verify form interaction
   # Verify no console errors occur
   ```

2. **Production Build Testing** (VALIDATED ✅):
   ```bash
   npm run build  # NEVER CANCEL: takes 2 seconds, timeout 60+ minutes
   npm run preview
   # Navigate to http://localhost:4173
   # Repeat the same form testing as above
   # Verify production build works identically to development
   ```

3. **Complete End-to-End Scenario Testing** (VALIDATED ✅):
   - Load the application successfully
   - Verify French language interface ("Comparateur - version démo")
   - Enter a product name (validated: "Baguette de pain", "Test Final - Produit DOM-TOM")
   - Enter a price (validated: "1.20", "3.75")
   - Click the "Ajouter" button and verify it's clickable
   - Verify form remains functional after interaction
   - Verify no React errors in console
   - Application should render with proper Tailwind styling

### Known Issues and Workarounds
- **Tailwind Warning**: Build shows "Cannot apply unknown utility class `bg-slate-50`" but build completes successfully
- **TypeScript Check**: `npm run check` fails due to missing tsconfig.json - this is expected
- **ESLint Configuration**: Current config has module scope issues - needs updating for modern JS modules
- **PostCSS Configuration**: Must use `.cjs` extension, not `.js`, due to package.json "type": "module"

## Build and Deployment

### Local Development
```bash
npm run dev  # Development server with hot reload
```

### Production Build
```bash
npm run build      # NEVER CANCEL: Fast 2-second build
npm run preview    # Test production build locally
```

### Deployment Options
The project supports multiple deployment methods:

1. **Cloudflare Pages** (primary): Automated via GitHub Actions in `.github/workflows/deploy.yml`
2. **Firebase Hosting**: Use `firebase deploy` after building
3. **Manual Scripts**: Various deployment scripts available in root directory

### GitHub Actions
- **Build Workflow**: `.github/workflows/build.yml` - Windows installer builds
- **Deploy Workflow**: `.github/workflows/deploy.yml` - Cloudflare Pages deployment

## Project Structure

### Key Directories
- `/src` - React application source code
  - `/src/App.jsx` - Main application component (requires React import)
  - `/src/main.jsx` - Application entry point
  - `/src/index.css` - Global styles with Tailwind directives
- `/public` - Static assets and Cloudflare Pages Functions
  - `/public/api` - API endpoints (e.g., territories.json)
- `/functions` - Firebase Cloud Functions
- `/scripts` - Utility and deployment scripts
- `/dist` - Build output directory

### Important Files
- `package.json` - Project dependencies and scripts
- `vite.config.js` - Build configuration
- `tailwind.config.js` - CSS framework configuration
- `postcss.config.cjs` - CSS processing configuration
- `firebase.json` - Firebase project configuration
- `.firebaserc` - Firebase project settings

## Common Tasks

### Adding New Features
1. Always start development server: `npm run dev`
2. Make changes in `/src` directory
3. Test in browser at http://localhost:5173
4. Build and test production: `npm run build && npm run preview`
5. Test on http://localhost:4173

### Troubleshooting Build Issues
1. Check PostCSS configuration file extension (.cjs not .js)
2. Verify Tailwind configuration is correct
3. Ensure React imports are present in JSX files
4. Clear node_modules and reinstall if needed

### Fixing Common Configuration Issues
Use the comprehensive fix script when encountering setup problems:
```bash
./fix_all_vite_tailwind.sh
# This script fixes common Vite/Tailwind/PostCSS issues
# NEVER CANCEL: May take 15+ seconds to complete
```

## API and External Services

### Available APIs
- **Territories API**: `/public/api/territories.json` - Lists French overseas territories
- **Firebase Functions**: EAN code conversion and news processing
- **Production APIs**: https://akiprisaye.pages.dev/api/* (external network required)

### Testing APIs
```bash
node test_api.js  # Tests external production endpoints
```

## Performance and Optimization

### Build Performance
- **Development**: Hot reload in <200ms
- **Production Build**: Complete build in 2 seconds
- **Dependencies Install**: 15 seconds for fresh install

### Development Tips
- Use `npm run dev` for active development with hot reload
- Use `npm run preview` to test production builds locally
- Always test both development and production modes before committing
- The application supports price comparison functionality for DOM-TOM territories

## Deployment Health Checks

Use the comprehensive health check script:
```bash
./scripts/mega_check.sh
# Validates deployment status and API endpoints
# Note: Requires external network access to production URLs
```

This script verifies:
- HTML page loading
- Version information
- API endpoint functionality
- Territory data availability
- Price comparison features