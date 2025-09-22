# 📋 Check-list de déploiement interactive

Ce répertoire contient les outils pour créer et gérer des check-lists de déploiement interactives via les issues GitHub.

## 🎯 Objectif

Faciliter le suivi et la validation du déploiement du projet A KI PRI SA YÉ en créant automatiquement des issues GitHub avec des tâches cochables pour chaque étape du processus.

## 🚀 Utilisation

### Méthode 1 : Via l'interface GitHub (Recommandée)

1. Allez dans l'onglet **Issues** du dépôt GitHub
2. Cliquez sur **New issue**
3. Sélectionnez le template **"Check-list de déploiement A KI PRI SA YÉ"**
4. Remplissez le titre avec la version/date
5. Cochez les cases au fur et à mesure du déploiement

### Méthode 2 : Via GitHub Actions

1. Allez dans l'onglet **Actions** du dépôt
2. Sélectionnez le workflow **"Créer une check-list de déploiement"**
3. Cliquez sur **Run workflow**
4. Renseignez la version et l'environnement
5. L'issue sera créée automatiquement

### Méthode 3 : Via le script local

```bash
# Utilisation basique
./scripts/create-deployment-checklist.sh

# Avec version et environnement spécifiques
./scripts/create-deployment-checklist.sh -v v1.2.0 -e production

# Aide
./scripts/create-deployment-checklist.sh --help
```

## 📝 Contenu de la check-list

La check-list couvre 7 domaines essentiels :

### 1. Code & Fonctionnalités
- Validation des composants React
- Tests du scanner QR
- Intégration OpenFoodFacts
- Historique des prix et tickets
- Cache local et animations

### 2. Design & Accessibilité
- Mode sombre
- Stylisation (Tailwind + shadcn/ui)
- Responsive design
- Accessibilité (aria-labels)

### 3. Dépendances & Build
- Installation des dépendances
- Build sans erreur
- Configuration Firebase

### 4. Déploiement
- Code à jour sur main
- Configuration du service de déploiement
- Accessibilité de l'URL de production

### 5. Tests & Validation
- Tests fonctionnels sur mobile
- Validation des produits
- Gestion des erreurs
- Tests multi-navigateurs

### 6. Sécurité & RGPD
- Protection des données Firestore
- Confidentialité des données
- Mentions RGPD

### 7. Monitoring & Support
- Système de monitoring
- Canal de support

## 🔗 Liens utiles

- 📋 [Check-list originale](../CHECKLIST_DEPLOIEMENT.md)
- 🛠 [Scripts de vérification](../scripts/)
- 🌐 [Site de production](https://akiprisaye.pages.dev/)

## ⚙️ Configuration

### Prérequis pour le script local

1. **GitHub CLI** installé et configuré :
   ```bash
   # Installation (macOS)
   brew install gh
   
   # Installation (Ubuntu/Debian)
   sudo apt install gh
   
   # Authentification
   gh auth login
   ```

### Templates d'issues

Les templates sont stockés dans `.github/ISSUE_TEMPLATE/` :
- `deployment-checklist.yml` : Template principal pour l'interface GitHub

### Workflows GitHub Actions

Les workflows sont dans `.github/workflows/` :
- `create-deployment-checklist.yml` : Création automatique d'issues de déploiement

## 🎨 Personnalisation

Pour modifier la check-list :

1. **Pour l'interface GitHub** : Modifiez `.github/ISSUE_TEMPLATE/deployment-checklist.yml`
2. **Pour le script local** : Modifiez `scripts/create-deployment-checklist.sh`
3. **Pour GitHub Actions** : Modifiez `.github/workflows/create-deployment-checklist.yml`

## 📊 Suivi

Une fois l'issue créée :

1. **Équipe** : Chaque membre peut cocher les tâches qu'il valide
2. **Responsable** : Suit l'avancement global via l'issue
3. **Historique** : L'issue conserve l'historique des validations
4. **Intégration** : Possibilité de lier l'issue aux PR et commits

## 🎉 Avantages

- ✅ **Collaboration** : Toute l'équipe peut participer
- ✅ **Traçabilité** : Historique complet des validations
- ✅ **Automatisation** : Création d'issues automatisée
- ✅ **Intégration** : Intégré dans l'écosystème GitHub
- ✅ **Flexibilité** : Adapté à différents environnements
- ✅ **Documentation** : Liens et ressources inclus

---

*Créé pour faciliter le déploiement de A KI PRI SA YÉ* 🌍