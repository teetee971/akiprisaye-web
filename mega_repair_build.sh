#!/data/data/com.termux/files/usr/bin/bash
# =======================================================
# 🚀 Script méga réparation & build pour A KI PRI SA YÉ
# Compatible Termux (Node.js v22+) + Cloudflare Pages
# =======================================================

# Fallback pour environnements non-Termux
if [ ! -f "/data/data/com.termux/files/usr/bin/bash" ] && [ -f "/bin/bash" ]; then
  exec /bin/bash "$0" "$@"
fi

set -euo pipefail

# --------------------------
# Configuration & Helpers
# --------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$SCRIPT_DIR}"
SCRIPT_NAME="mega_repair_build.sh"

# Couleurs pour les logs
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  CYAN='\033[0;36m'
  NC='\033[0m' # No Color
else
  RED='' GREEN='' YELLOW='' BLUE='' CYAN='' NC=''
fi

# Fonctions utilitaires
log() { printf "${GREEN}[✔]${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}[!]${NC} %s\n" "$*"; }
error() { printf "${RED}[✗]${NC} %s\n" "$*"; }
info() { printf "${BLUE}[ℹ]${NC} %s\n" "$*"; }
step() { printf "\n${CYAN}=== %s ===${NC}\n" "$*"; }

# --------------------------
# Gestion des options - MOVED TO TOP
# --------------------------
show_help() {
  cat <<EOF
🚀 Script de méga réparation & build pour A KI PRI SA YÉ

Usage: $SCRIPT_NAME [OPTIONS]

OPTIONS:
  -h, --help          Afficher cette aide
  -c, --clean-only    Nettoyage seulement (sans build)
  -b, --build-only    Build seulement (sans nettoyage)
  --project-root DIR  Répertoire du projet (défaut: répertoire courant)

EXEMPLES:
  $SCRIPT_NAME                  # Réparation complète
  $SCRIPT_NAME --clean-only     # Nettoyage seulement
  $SCRIPT_NAME --build-only     # Build seulement

VARIABLES D'ENVIRONNEMENT:
  PROJECT_ROOT        Répertoire du projet

Compatible avec Termux (Node.js v22+) et Cloudflare Pages.
EOF
}

# Parse arguments EARLY
CLEAN_ONLY=false
BUILD_ONLY=false

for arg in "$@"; do
  case $arg in
    -h|--help)
      show_help
      exit 0
      ;;
    -c|--clean-only)
      CLEAN_ONLY=true
      ;;
    -b|--build-only)
      BUILD_ONLY=true
      ;;
    --project-root)
      # Will be handled in the full parsing loop
      ;;
    *)
      if [[ $arg != --project-root=* ]] && [[ $arg != /* ]] && [[ $arg != .* ]] && [[ ! -z $arg ]]; then
        echo "Option inconnue: $arg"
        show_help
        exit 1
      fi
      ;;
  esac
done

# --------------------------
# Fonction de nettoyage complet
# --------------------------
cleanup_dependencies() {
  step "🧹 Nettoyage complet des dépendances"
  
  # Suppression des caches et modules
  rm -rf node_modules package-lock.json yarn.lock pnpm-lock.yaml 2>/dev/null || true
  rm -rf .vite dist .next .nuxt build 2>/dev/null || true
  
  # Nettoyage des caches npm
  if [ -d "$HOME/.npm" ]; then
    rm -rf "$HOME/.npm/_npx" "$HOME/.npm/_cacache" 2>/dev/null || true
  fi
  
  # Nettoyage des fichiers de cache Termux spécifiques
  if [ -d "${PREFIX:-/data/data/com.termux/files/usr}/tmp" ]; then
    rm -rf "${PREFIX:-/data/data/com.termux/files/usr}/tmp/npm-*" 2>/dev/null || true
  fi
  
  log "Nettoyage terminé"
}

# --------------------------
# Vérification de l'environnement
# --------------------------
check_environment() {
  step "🔍 Vérification de l'environnement"
  
  # Vérification Node.js
  if ! command -v node >/dev/null 2>&1; then
    error "Node.js n'est pas installé"
    info "Installation sur Termux: pkg install nodejs"
    exit 1
  fi
  
  local node_version
  node_version=$(node --version | sed 's/v//')
  log "Node.js version: $node_version"
  
  # Vérification npm
  if ! command -v npm >/dev/null 2>&1; then
    error "npm n'est pas disponible"
    exit 1
  fi
  
  local npm_version
  npm_version=$(npm --version)
  log "npm version: $npm_version"
  
  # Vérification git
  if ! command -v git >/dev/null 2>&1; then
    warn "git n'est pas installé - installation recommandée"
    info "Installation sur Termux: pkg install git"
  fi
}

# --------------------------
# Correction des dépendances
# --------------------------
fix_dependencies() {
  step "📦 Correction et installation des dépendances"
  
  cd "$PROJECT_ROOT"
  
  # Backup du package.json original
  if [ -f package.json ]; then
    cp package.json "package.json.backup.$(date +%Y%m%d_%H%M%S)"
    log "Sauvegarde du package.json créée"
  fi
  
  # Configuration npm pour éviter les warnings
  npm config set audit false
  npm config set fund false
  npm config set update-notifier false
  
  # Installation avec legacy peer deps pour résoudre les conflits React
  info "Installation avec --legacy-peer-deps pour résoudre les conflits React..."
  if npm install --legacy-peer-deps --no-audit --no-fund; then
    log "Installation réussie avec --legacy-peer-deps"
  else
    warn "Échec avec --legacy-peer-deps, tentative avec --force..."
    if npm install --force --no-audit --no-fund; then
      log "Installation réussie avec --force"
    else
      error "Échec de l'installation des dépendances"
      
      # Tentative de correction automatique des versions
      info "Tentative de correction automatique des versions conflictuelles..."
      
      # Correction des versions React pour éviter les conflits avec react-leaflet
      npm install react@^18.3.1 react-dom@^18.3.1 --save --legacy-peer-deps --no-audit
      
      # Installation de react-leaflet compatible
      npm install react-leaflet@^4.2.1 --save --legacy-peer-deps --no-audit
      
      # Réinstallation complète
      npm install --legacy-peer-deps --no-audit --no-fund
      
      log "Correction automatique appliquée"
    fi
  fi
  
  # Vérification des dépendances critiques
  local critical_deps=("react" "react-dom" "vite" "tailwindcss")
  for dep in "${critical_deps[@]}"; do
    if npm list "$dep" >/dev/null 2>&1; then
      log "✓ $dep installé"
    else
      warn "✗ $dep manquant"
    fi
  done
}

# --------------------------
# Configuration Vite optimisée
# --------------------------
setup_vite_config() {
  step "⚙️ Configuration Vite optimisée"
  
  cat > vite.config.js <<'VITE_CONFIG'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Configuration serveur pour Termux
  server: {
    host: true,
    port: 5174,
    strictPort: false,
    cors: true
  },
  
  // Configuration build optimisée
  build: {
    target: 'es2015',
    minify: 'esbuild',
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          maps: ['leaflet', 'react-leaflet']
        }
      }
    },
    // Optimisation pour Termux
    chunkSizeWarningLimit: 1000
  },
  
  // Optimisations des dépendances
  optimizeDeps: {
    include: ['react', 'react-dom', 'chart.js', 'leaflet'],
    force: true
  }
})
VITE_CONFIG
  
  log "Configuration Vite créée/mise à jour"
}

# --------------------------
# Configuration Tailwind/PostCSS
# --------------------------
setup_tailwind_config() {
  step "🎨 Configuration Tailwind CSS"
  
  # Tailwind config optimisée
  cat > tailwind.config.js <<'TAILWIND_CONFIG'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
  darkMode: 'media'
}
TAILWIND_CONFIG
  
  # PostCSS config
  cat > postcss.config.js <<'POSTCSS_CONFIG'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
POSTCSS_CONFIG
  
  log "Configuration Tailwind/PostCSS créée/mise à jour"
}

# --------------------------
# Build et vérification
# --------------------------
build_project() {
  step "🏗️ Build du projet"
  
  # Nettoyage du dossier de build
  rm -rf dist .vite 2>/dev/null || true
  
  # Build avec gestion d'erreur
  if npm run build; then
    log "Build réussi"
  else
    error "Échec du build"
    
    # Diagnostic des erreurs de build
    info "Diagnostic des erreurs de build..."
    
    # Vérification des fichiers d'entrée
    if [ -f src/main.jsx ]; then
      log "Fichier src/main.jsx trouvé"
    elif [ -f src/main.js ]; then
      log "Fichier src/main.js trouvé"
    else
      warn "Fichier d'entrée principal introuvable"
    fi
    
    # Vérification de l'index.html
    if [ -f index.html ]; then
      log "index.html trouvé"
    else
      warn "index.html manquant"
    fi
    
    return 1
  fi
  
  # Vérification du build
  if [ -d dist ]; then
    local dist_size
    dist_size=$(du -sh dist 2>/dev/null | cut -f1 || echo "unknown")
    log "Dossier dist généré (taille: $dist_size)"
    
    # Vérification des fichiers essentiels
    if [ -f dist/index.html ]; then
      log "✓ index.html généré"
    else
      warn "✗ index.html manquant dans dist"
    fi
    
    local asset_count
    asset_count=$(find dist -name "*.js" -o -name "*.css" 2>/dev/null | wc -l)
    log "Assets générés: $asset_count fichiers"
    
  else
    error "Dossier dist non généré"
    return 1
  fi
}

# --------------------------
# Fonction principale
# --------------------------
main() {
  step "🚀 Démarrage du script de méga réparation A KI PRI SA YÉ"
  
  # Changement vers le répertoire du projet
  cd "$PROJECT_ROOT"
  log "Répertoire de travail: $PROJECT_ROOT"
  
  # Étapes de réparation
  check_environment
  cleanup_dependencies
  fix_dependencies
  setup_vite_config
  setup_tailwind_config
  build_project
  
  step "🎉 Méga réparation terminée avec succès!"
  
  info "Prochaines étapes:"
  echo "  • Test local: npm run preview"
  echo "  • Développement: npm run dev"
  echo "  • Production: Le dossier dist/ est prêt pour Cloudflare Pages"
}

# --------------------------
# Exécution selon les options
# --------------------------
if [ "$CLEAN_ONLY" = true ]; then
  step "🧹 Mode nettoyage seulement"
  cd "$PROJECT_ROOT"
  cleanup_dependencies
  log "Nettoyage terminé"
elif [ "$BUILD_ONLY" = true ]; then
  step "🏗️ Mode build seulement"
  cd "$PROJECT_ROOT"
  check_environment
  setup_vite_config
  setup_tailwind_config
  build_project
  log "Build terminé"
else
  # Exécution complète
  main
fi

log "Script terminé avec succès! 🎉"