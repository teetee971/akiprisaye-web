# 🏛️ Interface d'Administration - A KI PRI SA YÉ

## Vue d'ensemble

L'interface d'administration fournit un accès sécurisé pour la gestion de l'application A KI PRI SA YÉ. Elle inclut des mécanismes de sécurité robustes, une authentification renforcée, et un système d'audit complet.

## 🔐 Sécurité

### Authentification
- **Firebase Authentication** avec rôles personnalisés
- **Vérification des rôles** : seuls les utilisateurs avec `admin: true` peuvent accéder
- **Persistance de session** configurable (session ou persistante)
- **Limitation des tentatives** de connexion (3 tentatives max)
- **Déconnexion automatique** après inactivité

### Autorisation
- **Custom Claims Firebase** pour les rôles admin/premium
- **Règles Firestore** strictes pour l'accès aux données
- **Middleware d'authentification** sur les endpoints API
- **Vérification des permissions** côté client et serveur

### Audit et Surveillance
- **Journalisation complète** de toutes les actions admin
- **Tracking des connexions** et tentatives d'accès
- **Géolocalisation IP** et informations de session
- **Alertes de sécurité** automatiques
- **Rétention des logs** configurable (90 jours par défaut)

## 📊 Fonctionnalités

### Tableau de Bord
- **Statistiques utilisateurs** (total, premium, admin)
- **Métriques d'activité** (connexions récentes, etc.)
- **État de la sécurité** en temps réel
- **Activité récente** avec horodatage

### Gestion des Utilisateurs
- **Liste complète** des utilisateurs inscrits
- **Filtrage par statut** (premium, standard, admin)
- **Attribution de rôles** (admin, premium)
- **Recherche et export** des données

### Surveillance Sécurité
- **État HTTPS/SSL**
- **Statut du pare-feu Cloudflare**
- **Authentification 2FA** (en préparation)
- **Audit des accès** en continu

### Journaux d'Activité
- **Logs d'authentification**
- **Actions administratives**
- **Événements de sécurité**
- **Export et filtrage** par date/type

### Paramètres Système
- **Configuration de sécurité**
- **Gestion des notifications**
- **Maintenance et sauvegarde**
- **Nettoyage automatique** des logs

## 🚀 Installation et Configuration

### Prérequis
- **Node.js 18+** et npm/pnpm
- **Firebase Project** configuré
- **Cloudflare Pages** (recommandé)
- **Certificat SSL** actif

### Configuration Firebase

1. **Service Account**
   ```bash
   # Télécharger la clé de service depuis Firebase Console
   # Placer dans firebase_functions/serviceAccountKey.json
   ```

2. **Custom Claims**
   ```javascript
   // Utiliser admin-setup.js pour créer les premiers admins
   node firebase_functions/admin-setup.js
   ```

3. **Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Cloud Functions**
   ```bash
   cd firebase_functions
   npm install
   firebase deploy --only functions
   ```

### Variables d'Environnement

Créer un fichier `.env.local` :
```env
# Configuration Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id

# Configuration Admin
VITE_ADMIN_SESSION_TIMEOUT=3600000
VITE_ADMIN_MAX_LOGIN_ATTEMPTS=3
VITE_ENABLE_AUDIT_LOGGING=true
```

### Déploiement

1. **Build de production**
   ```bash
   npm run build
   ```

2. **Déploiement Cloudflare Pages**
   ```bash
   # Automatique via GitHub Actions
   # ou manuel via wrangler
   ```

## 🛡️ Bonnes Pratiques de Sécurité

### Authentification
- ✅ **Mots de passe forts** obligatoires
- ✅ **Double authentification** (2FA) recommandée
- ✅ **Sessions limitées** dans le temps
- ✅ **Logout automatique** après inactivité

### Accès Admin
- ✅ **Principe du moindre privilège**
- ✅ **Rôles spécifiques** par fonction
- ✅ **Audit trail** complet
- ✅ **Accès depuis IP approuvées** (optionnel)

### Données Sensibles
- ✅ **Chiffrement en transit** (HTTPS)
- ✅ **Chiffrement au repos** (Firebase)
- ✅ **Anonymisation des logs** après 90 jours
- ✅ **Sauvegarde chiffrée** des configurations

### Surveillance
- ✅ **Monitoring continu** des accès
- ✅ **Alertes en temps réel** pour anomalies
- ✅ **Rapports de sécurité** hebdomadaires
- ✅ **Tests de pénétration** périodiques

## 🔧 Maintenance

### Scripts Utilitaires

1. **Créer un admin**
   ```bash
   node firebase_functions/admin-setup.js
   # Choisir option 1
   ```

2. **Nettoyer les logs**
   ```bash
   node firebase_functions/admin-setup.js
   # Choisir option 7
   ```

3. **Vérifier la sécurité**
   ```bash
   node firebase_functions/admin-setup.js
   # Choisir option 6
   ```

### Sauvegarde

- **Automatique** : quotidienne via Firebase
- **Manuelle** : bouton dans l'interface admin
- **Export** : données utilisateurs et configurations

### Mise à Jour

1. **Vérifier les dépendances**
   ```bash
   npm audit
   npm update
   ```

2. **Tests de sécurité**
   ```bash
   npm run test:security
   ```

3. **Déploiement progressif**
   ```bash
   # Test en staging puis production
   ```

## 📱 Interface Utilisateur

### Design Adaptatif
- **Responsive design** pour tous les écrans
- **Thème sombre/clair** avec persistence
- **Navigation intuitive** par onglets
- **Indicateurs visuels** pour le statut de sécurité

### Accessibilité
- **Contrastes élevés** pour la lisibilité
- **Navigation clavier** complète
- **Labels sémantiques** pour les lecteurs d'écran
- **Temps de réponse** optimisés

## 🚨 Gestion des Incidents

### Procédures d'Urgence

1. **Compromission suspectée**
   - Révoquer tous les tokens admin
   - Changer les mots de passe
   - Activer la 2FA obligatoire
   - Analyser les logs d'audit

2. **Accès non autorisé**
   - Bloquer les IP suspectes
   - Notifier les administrateurs
   - Sauvegarder les preuves
   - Mettre à jour les règles de sécurité

3. **Panne de service**
   - Basculer vers le mode maintenance
   - Vérifier l'intégrité des données
   - Restaurer depuis la sauvegarde
   - Tester toutes les fonctionnalités

### Contacts d'Urgence
- **Admin Principal** : admin@akiprisaye.com
- **Support Technique** : support@akiprisaye.com
- **Sécurité** : security@akiprisaye.com

## 📈 Métriques et KPI

### Sécurité
- Nombre de tentatives d'accès échouées
- Temps de réponse aux incidents
- Couverture des tests de sécurité
- Conformité aux standards (OWASP, etc.)

### Performance
- Temps de chargement de l'interface
- Disponibilité du service (uptime)
- Latence des API admin
- Satisfaction utilisateur admin

### Audit
- Actions admin journalières
- Fréquence des sauvegardes
- Rétention des logs
- Compliance réglementaire

## 🔮 Roadmap

### Version 1.1 (À venir)
- [ ] **Authentification 2FA** obligatoire
- [ ] **Dashboard temps réel** avec WebSockets
- [ ] **Notifications push** pour alertes
- [ ] **Export avancé** des rapports

### Version 1.2 (Futur)
- [ ] **IA pour détection d'anomalies**
- [ ] **Interface mobile native**
- [ ] **Single Sign-On (SSO)**
- [ ] **Conformité RGPD** avancée

---

> **Note Importante** : Cette interface contient des données sensibles. L'accès est strictement limité aux administrateurs autorisés. Toute tentative d'accès non autorisé est surveillée et peut faire l'objet de poursuites.