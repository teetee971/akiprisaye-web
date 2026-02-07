#!/bin/bash

################################################################################
# Script de vérification pré-fusion automatique
# Vérifie la qualité et la conformité du code avant fusion vers main
#
# Exit codes:
#   0 = Tous les tests sont passés (FEU VERT)
#   1 = Des erreurs bloquantes ont été détectées (FEU ROUGE)
################################################################################

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Fonction pour afficher les résultats
print_result() {
    local status=$1
    local message=$2
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $message"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC} - $message"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
    else
        echo -e "${RED}❌ FAIL${NC} - $message"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Fonction d'en-tête de section
print_section() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}📋 $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
}

# Début du script
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🔍 VÉRIFICATION PRÉ-FUSION AUTOMATIQUE                ║"
echo "║     A Ki Pri Sa Yé - Quality Gate Check                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json introuvable. Exécutez ce script depuis la racine du projet.${NC}"
    exit 1
fi

################################################################################
print_section "1. Structure du projet"
################################################################################

# Vérifier l'existence du dossier frontend/
if [ -d "frontend" ]; then
    print_result "OK" "Dossier frontend/ existe"
else
    print_result "FAIL" "Dossier frontend/ introuvable"
fi

# Vérifier package.json à la racine
if [ -f "package.json" ]; then
    print_result "OK" "package.json racine existe"
else
    print_result "FAIL" "package.json racine introuvable"
fi

# Vérifier package.json dans frontend/
if [ -f "frontend/package.json" ]; then
    print_result "OK" "frontend/package.json existe"
else
    print_result "FAIL" "frontend/package.json introuvable"
fi

################################################################################
print_section "2. Fichiers essentiels"
################################################################################

# Fichiers React essentiels
ESSENTIAL_FILES=(
    "frontend/src/main.jsx"
    "frontend/src/App.tsx"
    "frontend/src/components/Layout.jsx"
    "frontend/public/index.html"
    "frontend/vite.config.ts"
)

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_result "OK" "Fichier $file existe"
    else
        print_result "FAIL" "Fichier $file introuvable"
    fi
done

################################################################################
print_section "3. Détection de duplication src/ vs frontend/src/"
################################################################################

# Vérifier si un dossier src/ existe à la racine (ce qui serait une duplication)
if [ -d "src" ] && [ -d "frontend/src" ]; then
    print_result "WARN" "Duplication détectée: src/ et frontend/src/ existent tous les deux"
elif [ -d "src" ] && [ ! -d "frontend/src" ]; then
    print_result "FAIL" "Structure incorrecte: src/ existe mais pas frontend/src/"
else
    print_result "OK" "Pas de duplication src/ détectée"
fi

################################################################################
print_section "4. Installation des dépendances"
################################################################################

echo -e "${CYAN}📦 Installation des dépendances avec npm ci...${NC}"
cd frontend
NPM_OUTPUT=$(npm ci --silent 2>&1)
NPM_EXIT=$?
cd ..

if [ $NPM_EXIT -eq 0 ]; then
    print_result "OK" "Dépendances installées avec succès"
else
    print_result "FAIL" "npm ci a échoué"
fi

################################################################################
print_section "5. Audit de sécurité npm"
################################################################################

echo -e "${CYAN}🔒 Exécution de npm audit...${NC}"
cd frontend
AUDIT_OUTPUT=$(npm audit --audit-level=moderate 2>&1)
AUDIT_EXIT=$?

if [ $AUDIT_EXIT -eq 0 ]; then
    print_result "OK" "Aucune vulnérabilité détectée (npm audit)"
else
    # Compter les vulnérabilités
    VULNERABILITIES=$(echo "$AUDIT_OUTPUT" | grep -o "[0-9]* vulnerabilities" | head -1)
    if [ -n "$VULNERABILITIES" ]; then
        print_result "WARN" "Vulnérabilités détectées: $VULNERABILITIES"
    else
        print_result "WARN" "npm audit a signalé des problèmes"
    fi
fi
cd ..

################################################################################
print_section "6. Build production"
################################################################################

echo -e "${CYAN}🏗️  Build production en cours...${NC}"
cd frontend
if npm run build > /tmp/build.log 2>&1; then
    print_result "OK" "Build production réussi"
    
    # Vérifier que le dossier dist a été créé
    if [ -d "dist" ]; then
        print_result "OK" "Dossier dist/ créé"
    else
        print_result "FAIL" "Dossier dist/ non créé après build"
    fi
else
    print_result "FAIL" "Build production échoué (voir /tmp/build.log)"
fi
cd ..

################################################################################
print_section "7. Linting ESLint"
################################################################################

echo -e "${CYAN}🔍 Exécution du linting ESLint...${NC}"
cd frontend
if npm run lint > /tmp/eslint.log 2>&1; then
    print_result "OK" "ESLint: aucune erreur"
else
    # Compter les erreurs
    ERROR_COUNT=$(grep -c "error" /tmp/eslint.log 2>/dev/null || echo "0")
    WARNING_COUNT=$(grep -c "warning" /tmp/eslint.log 2>/dev/null || echo "0")
    
    if [ "$ERROR_COUNT" -gt 0 ]; then
        print_result "FAIL" "ESLint: $ERROR_COUNT erreurs trouvées"
    else
        print_result "WARN" "ESLint: $WARNING_COUNT avertissements"
    fi
fi
cd ..

################################################################################
print_section "8. Vérification TypeScript"
################################################################################

echo -e "${CYAN}📘 Vérification TypeScript (tsc --noEmit)...${NC}"
(cd frontend && npx tsc --noEmit > /tmp/tsc.log 2>&1)
TSC_EXIT=$?

if [ $TSC_EXIT -eq 0 ]; then
    print_result "OK" "TypeScript: aucune erreur de type"
else
    ERROR_COUNT=$(wc -l < /tmp/tsc.log 2>/dev/null || echo "0")
    print_result "FAIL" "TypeScript: erreurs de type détectées ($ERROR_COUNT lignes)"
fi

################################################################################
print_section "9. Routes essentielles"
################################################################################

# Vérifier que les routes essentielles sont définies dans main.jsx
ROUTES=(
    "/"
    "/comparateur"
    "/observatoire"
    "/faq"
    "/contact"
    "/methodologie"
)

if [ -f "frontend/src/main.jsx" ]; then
    for route in "${ROUTES[@]}"; do
        # Rechercher la route dans le fichier (en gérant le format path="route")
        route_clean="${route#/}"
        if [ "$route" = "/" ]; then
            # Pour la route racine, chercher path="/"
            if grep -q 'path="/"' frontend/src/main.jsx; then
                print_result "OK" "Route $route définie"
            else
                print_result "FAIL" "Route $route non trouvée dans main.jsx"
            fi
        else
            if grep -q "path=\"$route_clean\"" frontend/src/main.jsx; then
                print_result "OK" "Route $route définie"
            else
                print_result "FAIL" "Route $route non trouvée dans main.jsx"
            fi
        fi
    done
else
    print_result "FAIL" "frontend/src/main.jsx introuvable"
fi

################################################################################
print_section "10. Assets Leaflet"
################################################################################

# Vérifier les markers PNG de Leaflet
LEAFLET_ASSETS=(
    "frontend/public/leaflet/marker-icon.png"
    "frontend/public/leaflet/marker-icon-2x.png"
    "frontend/public/leaflet/marker-shadow.png"
)

for asset in "${LEAFLET_ASSETS[@]}"; do
    if [ -f "$asset" ]; then
        print_result "OK" "Asset $asset existe"
    else
        print_result "FAIL" "Asset $asset introuvable"
    fi
done

################################################################################
print_section "11. Logo et favicon"
################################################################################

# Vérifier le logo
if [ -f "frontend/public/logo-akiprisaye.svg" ] || [ -f "logo-akiprisaye.svg" ]; then
    print_result "OK" "Logo existe"
else
    print_result "WARN" "Logo logo-akiprisaye.svg introuvable"
fi

# Vérifier le favicon (dans index.html)
if [ -f "frontend/public/index.html" ]; then
    if grep -q "favicon" frontend/public/index.html || grep -q "icon" frontend/public/index.html; then
        print_result "OK" "Référence favicon trouvée dans index.html"
    else
        print_result "WARN" "Pas de référence favicon dans index.html"
    fi
fi

################################################################################
print_section "12. Manifest PWA"
################################################################################

if [ -f "frontend/public/manifest.webmanifest" ] || [ -f "manifest.webmanifest" ]; then
    print_result "OK" "Manifest PWA existe"
else
    print_result "WARN" "Manifest PWA introuvable"
fi

################################################################################
print_section "13. Variables d'environnement"
################################################################################

if [ -f ".env.example" ]; then
    print_result "OK" "Fichier .env.example existe"
else
    print_result "WARN" ".env.example introuvable"
fi

################################################################################
print_section "14. Recherche de secrets exposés"
################################################################################

echo -e "${CYAN}🔐 Recherche de secrets dans le code...${NC}"

# Patterns à rechercher (clés d'API, tokens, mots de passe)
SECRET_PATTERNS=(
    "api[_-]?key.*=.*['\"][A-Za-z0-9]{20,}"
    "secret.*=.*['\"][A-Za-z0-9]{20,}"
    "password.*=.*['\"][^'\"]{8,}"
    "token.*=.*['\"][A-Za-z0-9]{20,}"
)

SECRETS_FOUND=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -r -E -i "$pattern" frontend/src/ 2>/dev/null | grep -v "\.test\." | grep -v "example" | grep -v "\.env" | grep -v "fixtures" | head -1 > /dev/null; then
        SECRETS_FOUND=$((SECRETS_FOUND + 1))
    fi
done

if [ $SECRETS_FOUND -eq 0 ]; then
    print_result "OK" "Aucun secret exposé détecté dans le code"
else
    print_result "FAIL" "Potentiels secrets exposés détectés ($SECRETS_FOUND patterns)"
fi

################################################################################
print_section "15. Configuration Cloudflare"
################################################################################

if [ -f "frontend/public/_redirects" ]; then
    print_result "OK" "Fichier _redirects existe"
    
    # Vérifier la règle SPA (utiliser grep -E pour regex étendu)
    if grep -E -q "/\* .* 200" frontend/public/_redirects; then
        print_result "OK" "Règle SPA de redirection trouvée dans _redirects"
    else
        print_result "WARN" "Règle SPA non trouvée dans _redirects"
    fi
else
    print_result "FAIL" "Fichier _redirects introuvable"
fi

################################################################################
print_section "16. Taille des chunks JS"
################################################################################

if [ -d "frontend/dist/assets" ]; then
    echo -e "${CYAN}📊 Analyse de la taille des chunks JS...${NC}"
    
    # Trouver les fichiers JS et vérifier leur taille
    LARGE_CHUNKS=0
    while IFS= read -r file; do
        # Essayer stat Linux d'abord, puis BSD/macOS
        size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo "0")
        
        if [ "$size" = "0" ] || [ -z "$size" ]; then
            # Fallback: utiliser wc -c comme dernier recours
            size=$(wc -c < "$file" 2>/dev/null || echo "0")
        fi
        
        size_kb=$((size / 1024))
        filename=$(basename "$file")
        
        if [ $size_kb -gt 500 ]; then
            print_result "WARN" "Chunk $filename est gros: ${size_kb}KB (> 500KB)"
            LARGE_CHUNKS=$((LARGE_CHUNKS + 1))
        fi
    done < <(find frontend/dist/assets -name "*.js" -type f)
    
    if [ $LARGE_CHUNKS -eq 0 ]; then
        print_result "OK" "Tous les chunks JS sont < 500KB"
    fi
else
    print_result "WARN" "Dossier dist/assets introuvable, impossible de vérifier la taille"
fi

################################################################################
print_section "📊 RÉSUMÉ FINAL"
################################################################################

# Calculer le score de conformité
SCORE=0
if [ $TOTAL_CHECKS -gt 0 ]; then
    SCORE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
fi

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    RÉSULTATS FINAUX                       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  📊 Total des vérifications  : ${TOTAL_CHECKS}"
echo -e "  ${GREEN}✅ Tests réussis           : ${PASSED_CHECKS}${NC}"
echo -e "  ${RED}❌ Tests échoués           : ${FAILED_CHECKS}${NC}"
echo -e "  ${YELLOW}⚠️  Avertissements         : ${WARNING_CHECKS}${NC}"
echo ""
echo -e "  📈 Score de conformité     : ${SCORE}%"
echo ""

# Verdict final
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    🎉 FEU VERT 🎉                         ║${NC}"
    echo -e "${GREEN}║         Le code est prêt pour la fusion vers main        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    
    if [ $WARNING_CHECKS -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}ℹ️  Note: Il y a $WARNING_CHECKS avertissements à considérer${NC}"
    fi
    
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                    🚨 FEU ROUGE 🚨                        ║${NC}"
    echo -e "${RED}║        Des erreurs bloquantes ont été détectées          ║${NC}"
    echo -e "${RED}║       Veuillez corriger avant de fusionner vers main     ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}📝 Consultez les logs suivants pour plus de détails:${NC}"
    echo -e "   - /tmp/build.log (build errors)"
    echo -e "   - /tmp/eslint.log (linting errors)"
    echo -e "   - /tmp/tsc.log (TypeScript errors)"
    echo ""
    
    exit 1
fi
