# Guide d'Installation - Extension A KI PRI SA YÉ

Ce guide explique comment installer et configurer l'extension browser A KI PRI SA YÉ.

## 📋 Prérequis

- Navigateur supporté:
  - Google Chrome (version 88+)
  - Microsoft Edge (version 88+)
  - Firefox (version 109+)
- Connexion internet (pour les comparaisons de prix)

## 🚀 Installation en Mode Développeur

### Google Chrome / Microsoft Edge

1. **Télécharger l'extension**
   ```bash
   git clone https://github.com/teetee971/akiprisaye-web.git
   cd akiprisaye-web/extension
   ```

2. **Ouvrir la page des extensions**
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

3. **Activer le mode développeur**
   - Cliquez sur le bouton "Mode développeur" en haut à droite

4. **Charger l'extension**
   - Cliquez sur "Charger l'extension non empaquetée"
   - Sélectionnez le dossier `extension/` du projet

5. **Vérifier l'installation**
   - L'icône A KI PRI SA YÉ devrait apparaître dans la barre d'outils
   - Un message de confirmation devrait s'afficher

### Firefox

1. **Télécharger l'extension**
   ```bash
   git clone https://github.com/teetee971/akiprisaye-web.git
   cd akiprisaye-web/extension
   ```

2. **Ouvrir la page de débogage**
   - Allez sur `about:debugging#/runtime/this-firefox`

3. **Charger le module temporaire**
   - Cliquez sur "Charger un module complémentaire temporaire"
   - Sélectionnez le fichier `extension/manifest.json`

4. **Vérifier l'installation**
   - L'icône devrait apparaître dans la barre d'outils

## 📦 Installation depuis le Store (Production)

### Chrome Web Store

1. Visitez: [Chrome Web Store - A KI PRI SA YÉ](https://chrome.google.com/webstore) *(lien à venir)*
2. Cliquez sur "Ajouter à Chrome"
3. Confirmez les permissions
4. L'extension est installée automatiquement

### Firefox Add-ons

1. Visitez: [Firefox Add-ons - A KI PRI SA YÉ](https://addons.mozilla.org) *(lien à venir)*
2. Cliquez sur "Ajouter à Firefox"
3. Confirmez les permissions
4. L'extension est installée automatiquement

## ⚙️ Configuration Initiale

### Première Utilisation

1. **Cliquer sur l'icône de l'extension**
   - Dans la barre d'outils du navigateur

2. **Sélectionner votre territoire**
   - France Métropolitaine
   - Guadeloupe
   - Martinique
   - Guyane
   - La Réunion
   - Mayotte

3. **Donner votre consentement** (optionnel)
   - Lors de votre première visite sur un site de magasin
   - Lire la politique de confidentialité
   - Accepter ou refuser

### Paramètres Recommandés

- **Territoire**: Sélectionnez votre territoire réel pour des comparaisons pertinentes
- **Alertes prix**: Activez si vous souhaitez être notifié des variations
- **Synchronisation**: Activez si vous utilisez aussi la PWA

## 🧪 Test de l'Installation

1. **Visiter une page produit**
   - Allez sur carrefour.fr, leclerc.com, etc.
   - Cherchez un produit
   - Ouvrez la page du produit

2. **Vérifier l'apparition du bouton**
   - Un bouton "Analyser avec A KI PRI SA YÉ" devrait apparaître
   - En bas à droite de la page

3. **Tester l'analyse**
   - Cliquez sur le bouton
   - L'overlay devrait s'ouvrir à droite
   - Les informations du produit devraient s'afficher

## 🔧 Dépannage

### L'extension ne s'affiche pas

**Vérifications:**
1. L'extension est bien activée dans `chrome://extensions/`
2. Aucune erreur n'est affichée dans la console
3. Redémarrer le navigateur

**Solution:**
```bash
# Recharger l'extension
1. Aller sur chrome://extensions/
2. Cliquer sur le bouton de rechargement ⟳
3. Rafraîchir la page produit
```

### Le bouton n'apparaît pas sur les pages produits

**Vérifications:**
1. Vous êtes bien sur une page produit d'un magasin supporté
2. L'URL correspond aux patterns supportés
3. Le consentement a été donné

**Sites supportés:**
- carrefour.fr/p/...
- leclerc.com/p/...
- auchan.fr/.../p/...
- intermarche.com/.../produit/...
- lidl.fr/p/...
- super-u.fr/.../p/...
- monoprix.fr/.../p/...
- casino.fr/.../p/...

### Les prix ne s'affichent pas

**Causes possibles:**
1. Pas de connexion internet
2. API temporairement indisponible
3. Produit non référencé dans les sources officielles

**Normal:**
- L'extension ne crée PAS de données
- Si les sources officielles n'ont pas le produit, aucun prix n'est affiché
- Message: "Aucune donnée de comparaison disponible"

### Erreur de permissions

**Solution:**
```bash
# Réinstaller l'extension
1. Supprimer l'extension
2. Redémarrer le navigateur
3. Réinstaller
4. Accepter les permissions demandées
```

## 🔐 Vérification de Sécurité

### Vérifier les permissions

1. Aller sur `chrome://extensions/`
2. Cliquer sur "Détails" de l'extension
3. Vérifier la section "Autorisations"

**Permissions normales:**
- ✅ Stockage
- ✅ Onglet actif

**Permissions suspectes:**
- ❌ Historique de navigation
- ❌ Tous les sites web
- ❌ Cookies

### Vérifier le code source

```bash
# Inspecter le code de l'extension
cd extension/src
cat background/service-worker.js
cat content/detector.js
cat popup/popup.js
```

Le code doit:
- ✅ Être lisible et compréhensible
- ✅ Ne pas contenir de code obfusqué
- ✅ Ne pas contenir de trackers
- ✅ Correspondre au dépôt GitHub

## 📱 Synchronisation avec la PWA

### Activer la synchronisation

1. **Dans l'extension:**
   - Cliquer sur l'icône de l'extension
   - Option "Synchroniser avec l'application"

2. **Dans la PWA:**
   - Se connecter ou créer un compte
   - Aller dans Paramètres → Extensions
   - Activer la synchronisation

3. **Vérifier:**
   - Ajouter un produit à la liste dans l'extension
   - Ouvrir la PWA
   - Le produit devrait apparaître

### Désactiver la synchronisation

1. Dans l'extension: Paramètres → Désactiver la synchronisation
2. Les données restent stockées localement
3. Aucune nouvelle synchronisation

## 🗑️ Désinstallation

### Chrome / Edge

1. Aller sur `chrome://extensions/`
2. Trouver "A KI PRI SA YÉ"
3. Cliquer sur "Supprimer"
4. Confirmer

### Firefox

1. Aller sur `about:addons`
2. Trouver "A KI PRI SA YÉ"
3. Cliquer sur "Supprimer"
4. Confirmer

### Suppression des données

Les données sont automatiquement supprimées lors de la désinstallation.

Pour supprimer manuellement:
1. `chrome://settings/clearBrowserData`
2. Période: "Toutes les périodes"
3. Cocher "Cookies et données de sites"
4. Cliquer sur "Effacer les données"

## 📞 Support

### Problèmes connus

Consultez: [GitHub Issues](https://github.com/teetee971/akiprisaye-web/issues)

### Signaler un bug

1. Aller sur GitHub Issues
2. Créer une nouvelle issue
3. Utiliser le template "Bug Report"
4. Fournir:
   - Navigateur et version
   - Étapes pour reproduire
   - Captures d'écran
   - Console logs

### Demander une fonctionnalité

1. Aller sur GitHub Issues
2. Créer une nouvelle issue
3. Utiliser le template "Feature Request"
4. Décrire la fonctionnalité souhaitée

## 🔄 Mises à jour

### Automatiques (Store)

L'extension se met à jour automatiquement depuis le Chrome Web Store ou Firefox Add-ons.

### Manuelles (Mode développeur)

```bash
cd akiprisaye-web
git pull origin main
cd extension
# Recharger l'extension dans chrome://extensions/
```

## 📚 Ressources

- [Documentation complète](README.md)
- [Politique de confidentialité](PRIVACY.md)
- [Intégration PWA](PWA_INTEGRATION.md)
- [Code source](https://github.com/teetee971/akiprisaye-web)

---

**Besoin d'aide?** Visitez https://akiprisaye.web.app/contact
