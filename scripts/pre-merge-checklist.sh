#!/bin/bash

################################################################################
# Checklist interactive de vérification pré-fusion
# Pose 15 questions à l'utilisateur pour valider manuellement les aspects
# critiques de l'application avant fusion vers main
#
# Réponses: o (oui), n (non), s (skip)
################################################################################

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m'

# Compteurs
CRITICAL_YES=0
CRITICAL_NO=0
CRITICAL_SKIP=0
IMPORTANT_YES=0
IMPORTANT_NO=0
IMPORTANT_SKIP=0
OPTIONAL_YES=0
OPTIONAL_NO=0
OPTIONAL_SKIP=0

# Fonction pour poser une question
ask_question() {
    local category=$1
    local question=$2
    local response=""
    
    while true; do
        echo -e "${CYAN}${question}${NC}"
        read -p "Réponse (o/n/s): " response
        
        case "$response" in
            o|O|oui|OUI)
                echo -e "${GREEN}✅ Oui${NC}"
                echo ""
                return 0
                ;;
            n|N|non|NON)
                echo -e "${RED}❌ Non${NC}"
                echo ""
                return 1
                ;;
            s|S|skip|SKIP)
                echo -e "${YELLOW}⏭️  Skip${NC}"
                echo ""
                return 2
                ;;
            *)
                echo -e "${RED}Réponse invalide. Utilisez o (oui), n (non) ou s (skip)${NC}"
                ;;
        esac
    done
}

# Fonction pour mettre à jour les compteurs
update_counters() {
    local category=$1
    local result=$2
    
    case "$category" in
        "critical")
            case $result in
                0) CRITICAL_YES=$((CRITICAL_YES + 1)) ;;
                1) CRITICAL_NO=$((CRITICAL_NO + 1)) ;;
                2) CRITICAL_SKIP=$((CRITICAL_SKIP + 1)) ;;
            esac
            ;;
        "important")
            case $result in
                0) IMPORTANT_YES=$((IMPORTANT_YES + 1)) ;;
                1) IMPORTANT_NO=$((IMPORTANT_NO + 1)) ;;
                2) IMPORTANT_SKIP=$((IMPORTANT_SKIP + 1)) ;;
            esac
            ;;
        "optional")
            case $result in
                0) OPTIONAL_YES=$((OPTIONAL_YES + 1)) ;;
                1) OPTIONAL_NO=$((OPTIONAL_NO + 1)) ;;
                2) OPTIONAL_SKIP=$((OPTIONAL_SKIP + 1)) ;;
            esac
            ;;
    esac
}

# En-tête
clear
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     ✅ CHECKLIST PRÉ-FUSION INTERACTIVE                   ║"
echo "║     A Ki Pri Sa Yé - Manual Quality Gate                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${BLUE}Cette checklist contient 15 questions réparties en 3 catégories:${NC}"
echo -e "  ${RED}🔴 Critiques (5)${NC} - bloquantes pour la fusion"
echo -e "  ${YELLOW}🟡 Importantes (5)${NC} - recommandées avant fusion"
echo -e "  ${CYAN}🔵 Optionnelles (5)${NC} - amélioration continue"
echo ""
echo -e "${BLUE}Répondez par:${NC}"
echo -e "  ${GREEN}o${NC} = oui (fonctionnel)"
echo -e "  ${RED}n${NC} = non (problème détecté)"
echo -e "  ${YELLOW}s${NC} = skip (non testé)"
echo ""
read -p "Appuyez sur Entrée pour commencer..."
clear

################################################################################
# SECTION 1: QUESTIONS CRITIQUES (Bloquantes)
################################################################################

echo ""
echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
echo -e "${RED}🔴 SECTION 1: QUESTIONS CRITIQUES (Bloquantes)${NC}"
echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
echo ""

# Question 1
ask_question "critical" "1️⃣  Le build production passe-t-il sans erreur (npm run build) ?"
update_counters "critical" $?

# Question 2
ask_question "critical" "2️⃣  L'application démarre-t-elle correctement en mode preview (npm run preview) ?"
update_counters "critical" $?

# Question 3
ask_question "critical" "3️⃣  La navigation principale fonctionne-t-elle (menu, liens, transitions) ?"
update_counters "critical" $?

# Question 4
ask_question "critical" "4️⃣  La page Comparateur s'affiche-t-elle correctement ?"
update_counters "critical" $?

# Question 5
ask_question "critical" "5️⃣  La carte Leaflet s'affiche-t-elle avec les markers de magasins ?"
update_counters "critical" $?

################################################################################
# SECTION 2: QUESTIONS IMPORTANTES (Warnings)
################################################################################

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🟡 SECTION 2: QUESTIONS IMPORTANTES (Recommandées)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo ""

# Question 6
ask_question "important" "6️⃣  L'interface est-elle responsive et s'adapte-t-elle aux mobiles ?"
update_counters "important" $?

# Question 7
ask_question "important" "7️⃣  L'indicateur hors-ligne s'affiche-t-il quand la connexion est perdue ?"
update_counters "important" $?

# Question 8
ask_question "important" "8️⃣  Les toasts de notification s'affichent-ils correctement ?"
update_counters "important" $?

# Question 9
ask_question "important" "9️⃣  Le Ti-Panier (panier d'achat) fonctionne-t-il correctement ?"
update_counters "important" $?

# Question 10
ask_question "important" "🔟 La recherche de produits fonctionne-t-elle ?"
update_counters "important" $?

################################################################################
# SECTION 3: QUESTIONS OPTIONNELLES
################################################################################

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}🔵 SECTION 3: QUESTIONS OPTIONNELLES (Amélioration)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""

# Question 11
ask_question "optional" "1️⃣1️⃣  Le score Lighthouse Performance est-il > 80 ?"
update_counters "optional" $?

# Question 12
ask_question "optional" "1️⃣2️⃣  Le score Lighthouse Accessibility est-il > 90 ?"
update_counters "optional" $?

# Question 13
ask_question "optional" "1️⃣3️⃣  L'application PWA est-elle installable (prompt d'installation) ?"
update_counters "optional" $?

# Question 14
ask_question "optional" "1️⃣4️⃣  La console du navigateur est-elle exempte d'erreurs ?"
update_counters "optional" $?

# Question 15
ask_question "optional" "1️⃣5️⃣  Les meta tags SEO sont-ils présents et corrects ?"
update_counters "optional" $?

################################################################################
# RÉSUMÉ FINAL
################################################################################

clear
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    RÉSUMÉ DE LA CHECKLIST                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Section Critiques
echo -e "${RED}🔴 QUESTIONS CRITIQUES (Bloquantes):${NC}"
echo -e "  ${GREEN}✅ Oui  : ${CRITICAL_YES}/5${NC}"
echo -e "  ${RED}❌ Non  : ${CRITICAL_NO}/5${NC}"
echo -e "  ${YELLOW}⏭️  Skip : ${CRITICAL_SKIP}/5${NC}"
echo ""

# Section Importantes
echo -e "${YELLOW}🟡 QUESTIONS IMPORTANTES (Recommandées):${NC}"
echo -e "  ${GREEN}✅ Oui  : ${IMPORTANT_YES}/5${NC}"
echo -e "  ${RED}❌ Non  : ${IMPORTANT_NO}/5${NC}"
echo -e "  ${YELLOW}⏭️  Skip : ${IMPORTANT_SKIP}/5${NC}"
echo ""

# Section Optionnelles
echo -e "${CYAN}🔵 QUESTIONS OPTIONNELLES (Amélioration):${NC}"
echo -e "  ${GREEN}✅ Oui  : ${OPTIONAL_YES}/5${NC}"
echo -e "  ${RED}❌ Non  : ${OPTIONAL_NO}/5${NC}"
echo -e "  ${YELLOW}⏭️  Skip : ${OPTIONAL_SKIP}/5${NC}"
echo ""

# Calcul des totaux
TOTAL_YES=$((CRITICAL_YES + IMPORTANT_YES + OPTIONAL_YES))
TOTAL_NO=$((CRITICAL_NO + IMPORTANT_NO + OPTIONAL_NO))
TOTAL_SKIP=$((CRITICAL_SKIP + IMPORTANT_SKIP + OPTIONAL_SKIP))

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 TOTAUX:${NC}"
echo -e "  ${GREEN}✅ Total Oui  : ${TOTAL_YES}/15${NC}"
echo -e "  ${RED}❌ Total Non  : ${TOTAL_NO}/15${NC}"
echo -e "  ${YELLOW}⏭️  Total Skip : ${TOTAL_SKIP}/15${NC}"
echo ""

# Calcul du taux de réussite (sur les questions répondues)
TOTAL_ANSWERED=$((TOTAL_YES + TOTAL_NO))
if [ $TOTAL_ANSWERED -gt 0 ]; then
    SUCCESS_RATE=$(( (TOTAL_YES * 100) / TOTAL_ANSWERED ))
    echo -e "${BLUE}📈 Taux de réussite: ${SUCCESS_RATE}% (${TOTAL_YES}/${TOTAL_ANSWERED} réponses positives)${NC}"
else
    echo -e "${YELLOW}⚠️  Aucune question répondue (toutes skippées)${NC}"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"

# VERDICT FINAL
echo ""

# Logique de décision
BLOCKING_ISSUES=false
WARNINGS=false

# Vérifier les questions critiques
if [ $CRITICAL_NO -gt 0 ]; then
    BLOCKING_ISSUES=true
fi

# Vérifier les questions importantes
if [ $IMPORTANT_NO -gt 0 ]; then
    WARNINGS=true
fi

# Afficher le verdict
if [ "$BLOCKING_ISSUES" = true ]; then
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                    🚨 FEU ROUGE 🚨                        ║${NC}"
    echo -e "${RED}║          Des problèmes CRITIQUES ont été détectés         ║${NC}"
    echo -e "${RED}║       NE PAS fusionner vers main tant que ces issues     ║${NC}"
    echo -e "${RED}║                ne sont pas résolues                       ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}❌ ${CRITICAL_NO} question(s) critique(s) ont reçu une réponse négative.${NC}"
    echo -e "${RED}   Ces problèmes DOIVENT être résolus avant la fusion.${NC}"
    EXIT_CODE=1
elif [ "$WARNINGS" = true ]; then
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║                    🟡 FEU ORANGE 🟡                       ║${NC}"
    echo -e "${YELLOW}║        Des problèmes IMPORTANTS ont été détectés          ║${NC}"
    echo -e "${YELLOW}║      Fusion possible mais correction recommandée          ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  ${IMPORTANT_NO} question(s) importante(s) ont reçu une réponse négative.${NC}"
    echo -e "${YELLOW}   Il est recommandé de résoudre ces problèmes avant fusion.${NC}"
    EXIT_CODE=0
else
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    🎉 FEU VERT 🎉                         ║${NC}"
    echo -e "${GREEN}║         Le code est prêt pour la fusion vers main        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}✅ Toutes les vérifications critiques et importantes sont OK.${NC}"
    
    if [ $OPTIONAL_NO -gt 0 ]; then
        echo -e "${CYAN}ℹ️  Note: ${OPTIONAL_NO} question(s) optionnelle(s) peuvent être améliorées.${NC}"
    fi
    EXIT_CODE=0
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""

exit $EXIT_CODE
