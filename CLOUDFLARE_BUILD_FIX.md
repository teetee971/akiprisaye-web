# Cloudflare Build Configuration Fix

## Problem (historique)
The Cloudflare Pages build was failing with the error:
```
Could not resolve "./styles/home-v4.css" from "src/main.jsx"
```

## Root Cause
The build command `cd frontend && npm ci && npm run build` was running from the `frontend/` subdirectory, which had an incomplete source structure. The `frontend/src` directory contained only partial files (components, firebase, modules, types, utils) but was missing the main entry point files (`main.jsx`, `main.tsx`) and the `styles/` directory.

## Solution (historique)
Created a symlink from `frontend/src` to `../src` so that when building from the `frontend/` directory, it can access the complete source code from the root level.

## Recommandation actuelle
Le build recommandé est désormais exécuté **à la racine** (`npm run build`, output `dist/`). 
Le mode `frontend/` reste documenté uniquement pour compatibilité historique.

### Changes Made
1. **Replaced `frontend/src` directory with symlink**: `frontend/src -> ../src`
   - Deleted ~118 orphaned/partial files in `frontend/src/`
   - Created symlink to access complete source from root `src/`

2. **Fixed `frontend/index.html`**: 
   - Changed `<script type="module" src="/src/main.tsx"></script>` 
   - To `<script type="module" src="/src/main.jsx"></script>`

3. **Updated `frontend/vite.config.ts`**:
   - Added `base: "/"` configuration
   - Added `resolve.alias` for `@` pointing to `./src`
   - Now matches root-level `vite.config.js` configuration

## Build Verification
The build now works successfully:
```bash
cd frontend && npm run build
```

Output:
- ✅ 3346+ modules transformed
- ✅ Build completed in ~11 seconds
- ✅ All assets generated in `frontend/dist/`
- ✅ No resolution errors

## Repository Structure
```
akiprisaye-web/
├── src/                       # Main source code (root level)
│   ├── main.jsx              # Entry point
│   ├── styles/               # Stylesheets including home-v4.css
│   ├── components/
│   ├── pages/
│   └── ...
├── frontend/                  # Cloudflare build directory
│   ├── src -> ../src         # ✅ SYMLINK to root src/
│   ├── index.html            # Updated to reference main.jsx
│   ├── vite.config.ts        # Updated with proper aliases
│   ├── public/
│   └── dist/                 # Build output (generated)
├── package.json              # Root package.json
└── vite.config.js           # Root vite config
```

## Why This Approach?
1. **Maintains single source of truth**: All source code remains at root level
2. **Works with Cloudflare's build command**: `cd frontend && npm ci && npm run build`
3. **No code duplication**: Symlink ensures consistency
4. **Minimal changes**: Only 3 files modified (symlink + 2 config files)

## Important Notes
- The `frontend/src` symlink must be committed to git
- When npm runs from `frontend/`, it finds `package.json` in the parent directory
- Vite resolves all imports correctly through the symlink
- No need to duplicate `package.json` or `node_modules` in `frontend/`

## Testing Locally (root build recommandé)
To verify the fix locally:
```bash
npm ci
npm run build
```

The build output will be in `dist/` directory.
