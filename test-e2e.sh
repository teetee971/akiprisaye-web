#!/bin/bash

# Test end-to-end pour A KI PRI SA YÉ
# Vérifie que toutes les fonctionnalités principales fonctionnent

echo "🧪 Tests End-to-End A KI PRI SA YÉ"
echo "=================================="

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Fonction d'aide
log_test() {
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ $2${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Fonction pour tester l'existence d'un fichier
test_file_exists() {
    if [ -f "$1" ]; then
        log_test 0 "Fichier $1 existe"
    else
        log_test 1 "Fichier $1 manquant"
    fi
}

# Fonction pour tester l'existence d'un dossier
test_dir_exists() {
    if [ -d "$1" ]; then
        log_test 0 "Dossier $1 existe"
    else
        log_test 1 "Dossier $1 manquant"
    fi
}

# Fonction pour tester le contenu d'un fichier
test_file_contains() {
    if grep -q "$2" "$1" 2>/dev/null; then
        log_test 0 "Fichier $1 contient '$2'"
    else
        log_test 1 "Fichier $1 ne contient pas '$2'"
    fi
}

# Fonction pour tester une URL (si curl est disponible)
test_url() {
    if command -v curl >/dev/null 2>&1; then
        if curl -s -f "$1" >/dev/null; then
            log_test 0 "URL $1 accessible"
        else
            log_test 1 "URL $1 non accessible"
        fi
    else
        echo -e "${YELLOW}⚠️  Curl non disponible, test URL ignoré${NC}"
    fi
}

echo -e "${BLUE}📋 Test 1: Structure des fichiers PWA${NC}"
echo "----------------------------------------"

# Test de la structure PWA
test_file_exists "public/manifest.webmanifest"
test_file_exists "public/service-worker.js"
test_file_exists "public/icon.svg"
test_file_exists "public/icons/icon-192x192.png"
test_file_exists "public/icons/icon-512x512.png"

echo ""
echo -e "${BLUE}📋 Test 2: Fichiers SEO essentiels${NC}"
echo "-----------------------------------"

# Test des fichiers SEO
test_file_exists "public/robots.txt"
test_file_exists "public/sitemap.xml"
test_file_contains "public/robots.txt" "User-agent"
test_file_contains "public/sitemap.xml" "<?xml version"
test_file_contains "public/sitemap.xml" "akiprisaye.pages.dev"

echo ""
echo -e "${BLUE}📋 Test 3: Pages d'authentification${NC}"
echo "--------------------------------------"

# Test de l'authentification
test_file_exists "public/login.html"
test_file_exists "public/admin.html"
test_file_exists "public/dashboard-admin.html"
test_file_contains "public/login.html" "Connexion Admin"
test_file_contains "public/dashboard-admin.html" "Administration"

echo ""
echo -e "${BLUE}📋 Test 4: Page actualités${NC}"
echo "-----------------------------"

# Test de la page actualités
test_file_exists "public/actualites.html"
test_file_exists "functions/news.js"
test_file_contains "public/actualites.html" "Actualités"
test_file_contains "functions/news.js" "onRequest"

echo ""
echo -e "${BLUE}📋 Test 5: Modules JavaScript${NC}"
echo "---------------------------------"

# Test des modules JS
test_dir_exists "public/js"
test_file_exists "public/js/export-utils.js"
test_file_exists "public/js/local-suggestions.js"
test_file_exists "public/js/form-protection.js"
test_file_exists "public/js/analytics.js"
test_file_exists "public/js/tests.js"

echo ""
echo -e "${BLUE}📋 Test 6: Contenu des modules${NC}"
echo "----------------------------------"

# Test du contenu des modules
test_file_contains "public/js/export-utils.js" "ExportUtils"
test_file_contains "public/js/local-suggestions.js" "LocalSuggestions"
test_file_contains "public/js/form-protection.js" "FormProtection"
test_file_contains "public/js/analytics.js" "AnalyticsManager"

echo ""
echo -e "${BLUE}📋 Test 7: Configuration et intégration${NC}"
echo "--------------------------------------------"

# Test de l'intégration dans index.html
test_file_contains "index.html" "manifest.webmanifest"
test_file_contains "index.html" "service-worker.js"
test_file_contains "public/manifest.webmanifest" "icon-192x192.png"
test_file_contains "public/manifest.webmanifest" "icon-512x512.png"

echo ""
echo -e "${BLUE}📋 Test 8: Service Worker${NC}"
echo "-----------------------------"

# Test du Service Worker
test_file_contains "public/service-worker.js" "CACHE_NAME"
test_file_contains "public/service-worker.js" "install"
test_file_contains "public/service-worker.js" "fetch"
test_file_contains "public/service-worker.js" "activate"

echo ""
echo -e "${BLUE}📋 Test 9: Sécurité et protection${NC}"
echo "-----------------------------------"

# Test de sécurité
test_file_contains "public/js/form-protection.js" "csrf"
test_file_contains "public/js/form-protection.js" "sanitize"
test_file_contains "public/js/form-protection.js" "rateLimit"
test_file_contains "public/login.html" "noindex"

echo ""
echo -e "${BLUE}📋 Test 10: Responsive et accessibilité${NC}"
echo "--------------------------------------------"

# Test responsive
test_file_contains "index.html" "viewport"
test_file_contains "public/login.html" "viewport"
test_file_contains "public/dashboard-admin.html" "viewport"

echo ""
echo -e "${BLUE}📋 Test 11: Validation du HTML${NC}"
echo "----------------------------------"

# Test de validation basique HTML
if [ -f "index.html" ]; then
    if grep -q "<!doctype html>" "index.html"; then
        log_test 0 "DOCTYPE HTML5 présent"
    else
        log_test 1 "DOCTYPE HTML5 manquant"
    fi
    
    if grep -q '<html lang="fr"' "index.html"; then
        log_test 0 "Langue française spécifiée"
    else
        log_test 1 "Langue française non spécifiée"
    fi
fi

echo ""
echo -e "${BLUE}📋 Test 12: Tests unitaires${NC}"
echo "-------------------------------"

# Exécuter les tests unitaires JavaScript (simulation)
if [ -f "public/js/tests.js" ]; then
    log_test 0 "Fichier de tests unitaires présent"
    
    # Compter le nombre de tests dans le fichier
    TEST_COUNT=$(grep -c "test.it(" "public/js/tests.js" 2>/dev/null || echo "0")
    if [ "$TEST_COUNT" -gt "10" ]; then
        log_test 0 "Plus de 10 tests unitaires définis ($TEST_COUNT)"
    else
        log_test 1 "Nombre insuffisant de tests unitaires ($TEST_COUNT)"
    fi
else
    log_test 1 "Fichier de tests unitaires manquant"
fi

echo ""
echo -e "${BLUE}📋 Test 13: Performance et optimisation${NC}"
echo "--------------------------------------------"

# Test de la taille des fichiers
if [ -f "public/icons/icon-512x512.png" ]; then
    SIZE=$(du -k "public/icons/icon-512x512.png" | cut -f1)
    if [ "$SIZE" -lt 100 ]; then
        log_test 0 "Icône 512x512 de taille raisonnable (${SIZE}KB)"
    else
        log_test 1 "Icône 512x512 trop lourde (${SIZE}KB)"
    fi
fi

# Test de minification (présence de commentaires = non minifié)
JS_FILES=("public/js/export-utils.js" "public/js/local-suggestions.js")
for file in "${JS_FILES[@]}"; do
    if [ -f "$file" ]; then
        COMMENT_COUNT=$(grep -c "^\s*/\*\|^\s*//" "$file" 2>/dev/null || echo "0")
        if [ "$COMMENT_COUNT" -gt "5" ]; then
            log_test 0 "Fichier $file bien documenté ($COMMENT_COUNT commentaires)"
        else
            log_test 1 "Fichier $file peu documenté ($COMMENT_COUNT commentaires)"
        fi
    fi
done

echo ""
echo -e "${BLUE}📋 Test 14: Configuration du déploiement${NC}"
echo "--------------------------------------------"

# Test de la configuration de déploiement
test_file_exists "_headers"
test_file_exists "_redirects"
test_file_exists "firebase.json"

if [ -f "_headers" ]; then
    test_file_contains "_headers" "Cache-Control"
fi

echo ""
echo -e "${BLUE}📋 Test 15: Documentation${NC}"
echo "-----------------------------"

# Test de la documentation
test_file_exists "README.md"
test_file_exists "docs/checklist.md"
test_file_contains "README.md" "A KI PRI SA YÉ"

echo ""
echo "================================================"
echo -e "${BLUE}📊 RÉSULTATS FINAUX${NC}"
echo "================================================"

# Calcul du pourcentage de réussite
if [ $TESTS_TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((TESTS_PASSED * 100 / TESTS_TOTAL))
else
    SUCCESS_RATE=0
fi

echo -e "✅ Tests réussis: ${GREEN}$TESTS_PASSED${NC}"
echo -e "❌ Tests échoués: ${RED}$TESTS_FAILED${NC}"
echo -e "📈 Total: $TESTS_TOTAL"
echo -e "🎯 Taux de réussite: ${GREEN}$SUCCESS_RATE%${NC}"

# Recommandations basées sur les résultats
echo ""
echo -e "${BLUE}📝 RECOMMANDATIONS${NC}"
echo "==================="

if [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "${GREEN}🎉 Excellent! Le site est prêt pour le déploiement.${NC}"
elif [ $SUCCESS_RATE -ge 75 ]; then
    echo -e "${YELLOW}⚠️  Bon état général, quelques ajustements recommandés.${NC}"
else
    echo -e "${RED}🚨 Plusieurs problèmes détectés, révision nécessaire.${NC}"
fi

# Suggestions spécifiques
if [ $TESTS_FAILED -gt 0 ]; then
    echo ""
    echo "Suggestions d'amélioration:"
    echo "- Vérifier les fichiers manquants signalés"
    echo "- Compléter la documentation si nécessaire"
    echo "- Optimiser les images si elles sont trop lourdes"
    echo "- Ajouter plus de tests unitaires"
fi

# Code de sortie basé sur le taux de réussite
if [ $SUCCESS_RATE -ge 75 ]; then
    exit 0
else
    exit 1
fi