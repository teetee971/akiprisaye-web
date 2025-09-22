#!/usr/bin/env bash
set -euo pipefail

# Script pour créer une check-list de déploiement interactive
# Utilise l'API GitHub pour créer une issue avec la check-list

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configuration par défaut
DEFAULT_VERSION="$(date +%Y.%m.%d)"
DEFAULT_ENV="production"
GITHUB_REPO="teetee971/akiprisaye-web"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -v, --version VERSION    Version du déploiement (défaut: $DEFAULT_VERSION)"
    echo "  -e, --env ENVIRONMENT    Environnement (production|staging|development, défaut: $DEFAULT_ENV)"
    echo "  -h, --help              Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 -v v1.2.0 -e production"
    echo "  $0 --version v1.2.0 --env staging"
}

log() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

# Parse arguments
VERSION="$DEFAULT_VERSION"
ENVIRONMENT="$DEFAULT_ENV"

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            error "Option inconnue: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Vérifier que gh CLI est installé
if ! command -v gh &> /dev/null; then
    error "GitHub CLI (gh) n'est pas installé. Installez-le depuis https://cli.github.com/"
    exit 1
fi

# Vérifier l'authentification GitHub
if ! gh auth status &> /dev/null; then
    error "Vous n'êtes pas authentifié avec GitHub CLI. Exécutez 'gh auth login'"
    exit 1
fi

DATE=$(date '+%d/%m/%Y')

log "Création de la check-list de déploiement..."
log "Version: $VERSION"
log "Environnement: $ENVIRONMENT"
log "Date: $DATE"

# Contenu de l'issue
ISSUE_BODY="# 🚀 Check-list de déploiement A KI PRI SA YÉ

**Version:** $VERSION  
**Environnement:** $ENVIRONMENT  
**Date:** $DATE

Cette issue permet de suivre l'avancement du déploiement étape par étape.
Cochez les cases au fur et à mesure de la validation de chaque point.

---

## 1. Code & Fonctionnalités

- [ ] Les composants \`ProductDetails.jsx\` et \`ScannerPage.jsx\` sont présents et testés
- [ ] Le scanner réel fonctionne sur mobile et desktop
- [ ] Les appels à OpenFoodFacts sont OK : nom, marque, Nutri-Score, photo, origine, labels, ingrédients s'affichent
- [ ] L'historique des prix (Firestore) s'affiche en graphique (react-chartjs-2)
- [ ] Les tickets associés (Firestore) s'affichent correctement
- [ ] Le cache local fonctionne (localStorage)
- [ ] Les animations (fade-in) sont visibles sur la fiche produit

## 2. Design & Accessibilité

- [ ] Dark mode / mode sombre cohérent sur toutes les pages
- [ ] Les badges, cartes, boutons et graphiques sont bien stylisés (Tailwind + shadcn/ui)
- [ ] Responsive mobile-first (affichage correct sur smartphone, tablette, desktop)
- [ ] Les \`aria-label\` sont présents sur tous les éléments interactifs

## 3. Dépendances & Build

- [ ] Toutes les dépendances sont installées (\`html5-qrcode\`, \`react-chartjs-2\`, \`chart.js\`, \`shadcn-ui\`, \`tailwindcss\`, \`firebase\`)
- [ ] Le build local fonctionne sans erreur (\`npm run build\` ou équivalent)
- [ ] Le fichier \`firebase.js\` est bien configuré (accès Firestore sécurisé)

## 4. Déploiement

- [ ] Le dépôt GitHub est à jour sur la branche principale (\`main\`)
- [ ] Le service de déploiement (Pages.dev, Vercel, Netlify…) est configuré pour déployer sur chaque push
- [ ] La dernière version du code est déployée (vérifier logs, date du build)
- [ ] L'URL de production est accessible : https://akiprisaye.pages.dev/

## 5. Tests & Validation

- [ ] Tester un scan de code-barres réel sur mobile
- [ ] Vérifier l'affichage d'un produit connu (ex : Nutella)
- [ ] Vérifier l'affichage de l'historique des prix et tickets pour ce produit
- [ ] Vérifier la gestion des erreurs (produit non trouvé, prix/ticket absent, problème API)
- [ ] Vérifier le comportement sur différents navigateurs (Chrome, Safari, Firefox)

## 6. Sécurité & RGPD

- [ ] Les données Firestore sont protégées (règles de sécurité)
- [ ] Les données personnelles (tickets, prix) ne sont pas exposées publiquement
- [ ] Les mentions RGPD sont présentes (si besoin)

## 7. Monitoring & Support

- [ ] Un moyen de monitoring est en place (logs, erreurs déploiement)
- [ ] Un canal support est prêt en cas de bug (mail, Discord, GitHub issues)

---

## ✅ Validation finale

Une fois toutes les cases cochées, le déploiement peut être considéré comme validé et prêt pour la production.

**Notes additionnelles :**
_Ajoutez ici toute note ou observation importante concernant ce déploiement_"

# Créer l'issue
ISSUE_TITLE="🚀 Check-list de déploiement $ENVIRONMENT - $VERSION ($DATE)"

log "Création de l'issue GitHub..."

if ISSUE_URL=$(gh issue create \
    --repo "$GITHUB_REPO" \
    --title "$ISSUE_TITLE" \
    --body "$ISSUE_BODY" \
    --label "deployment,checklist,$ENVIRONMENT,priority-high"); then
    
    success "Issue créée avec succès : $ISSUE_URL"
    
    # Ajouter un commentaire avec des liens utiles
    COMMENT_BODY="## 🔗 Liens utiles pour ce déploiement

- 🌐 [Site de production](https://akiprisaye.pages.dev/)
- 📊 [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)
- 📋 [Documentation déploiement](./CHECKLIST_DEPLOIEMENT.md)
- 🛠 [Scripts de vérification](./scripts/)

**Commandes utiles :**
\`\`\`bash
# Vérification du déploiement
./scripts/deploy_check.sh

# Vérification complète
./scripts/mega_check.sh
\`\`\`"

    gh issue comment "$ISSUE_URL" --body "$COMMENT_BODY"
    success "Commentaire avec liens utiles ajouté"
    
    log "Ouverture de l'issue dans le navigateur..."
    gh issue view "$ISSUE_URL" --web
    
else
    error "Erreur lors de la création de l'issue"
    exit 1
fi