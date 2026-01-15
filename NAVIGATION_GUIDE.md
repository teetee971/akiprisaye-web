# 🧭 Guide de Navigation A KI PRI SA YÉ

## Architecture des Routes

### 🏛️ Routes principales (7 Hubs)

L'application A KI PRI SA YÉ est structurée autour de 7 hubs principaux qui regroupent les fonctionnalités par thématique :

1. **`/` - Accueil**
   - Page d'accueil avec vue d'ensemble des fonctionnalités
   - Accès rapide aux 7 hubs principaux

2. **`/comparateurs` - ComparateursHub**
   - Point d'entrée pour tous les comparateurs de prix
   - Comparateur produits alimentaires
   - Comparateurs services (vols, bateaux, assurances, carburants)
   - Comparateur formations

3. **`/carte` - CarteItinerairesHub**
   - Carte interactive des magasins
   - Optimisation d'itinéraires de courses
   - Localisation géographique des points de vente

4. **`/scanner` - ScannerHub**
   - Scanner de codes-barres (EAN)
   - Scanner OCR de tickets de caisse
   - Analyse photo de produits

5. **`/assistant-ia` - AssistantIAHub**
   - Assistant virtuel intelligent
   - Conseils personnalisés sur les courses
   - Analyse de budget

6. **`/observatoire` - ObservatoireHub**
   - Observatoire des prix en temps réel
   - Analyses statistiques territoriales
   - Détection d'anomalies de prix

7. **`/solidarite` - SolidariteHub**
   - Actions solidaires et anti-gaspillage
   - **Ti-Panié Solidaire** (paniers anti-gaspi)
   - Initiatives locales
   - Modules citoyens

---

## 🧺 Routes Ti-Panier

### Route principale
- **URL** : `/ti-panie`
- **Composant** : `src/pages/TiPanie.jsx`
- **Description** : Page dédiée aux paniers anti-gaspillage disponibles dans les enseignes locales
- **Fonctionnalités** :
  - Filtrage par territoire (Guadeloupe, Martinique, Guyane, Réunion, Mayotte)
  - Filtrage par magasin
  - Filtrage par créneau horaire
  - Affichage uniquement des paniers en stock
  - Statistiques en temps réel (économies, disponibilité)

### Via le Hub Solidarité
- **URL** : `/solidarite`
- **Accès Ti-Panier** : Carte cliquable "Ti-Panié Solidaire" qui redirige vers `/ti-panie`
- **Description** : Vue d'ensemble de toutes les actions solidaires

### ⚠️ Routes obsolètes (redirigées)
Les anciennes routes suivantes sont **automatiquement redirigées** vers `/ti-panie` avec un code HTTP 301 :
- `/ti-panie-solidaire.html` → `/ti-panie` (301)
- `/ti-panie-solidaire` → `/ti-panie` (301)

> **Note** : Ces redirections sont gérées par Cloudflare Pages via le fichier `public/_redirects`

---

## 🛠️ Résolution des Problèmes

### "La page /ti-panie ne fonctionne pas"

#### Étape 1 : Vérifier la console développeur
1. Appuyez sur `F12` pour ouvrir les outils développeur
2. Consultez l'onglet "Console" pour voir les erreurs
3. Vérifiez l'onglet "Network" pour voir si les requêtes échouent

**Erreurs courantes** :
- `Failed to load baskets` : Problème de service backend
- `Network error` : Problème de connexion internet
- `404 Not Found` : La route n'existe pas (vérifier l'URL)

#### Étape 2 : Tester une route alternative
Essayez d'accéder via le Hub Solidarité :
```
https://akiprisaye-web.pages.dev/solidarite
```
Puis cliquez sur la carte "Ti-Panié Solidaire"

#### Étape 3 : Vider le cache du navigateur
1. `Ctrl + Shift + Delete` (ou `Cmd + Shift + Delete` sur Mac)
2. Sélectionnez "Images et fichiers en cache"
3. Cliquez sur "Effacer les données"
4. Rechargez la page avec `Ctrl + F5`

#### Étape 4 : Vérifier l'URL
Assurez-vous d'utiliser la bonne URL :
- ✅ Correct : `https://akiprisaye-web.pages.dev/ti-panie`
- ❌ Incorrect : `https://akiprisaye-web.pages.dev/ti-panie-solidaire.html`
- ❌ Incorrect : `https://akiprisaye-web.pages.dev/ti-panie/`

### "Aucun panier n'apparaît"

#### Solution 1 : Ajuster les filtres
- Vérifiez que vous n'avez pas de filtres trop restrictifs
- Essayez de désactiver le filtre "En stock seulement"
- Changez de territoire si aucun panier n'est disponible

#### Solution 2 : Actualiser les données
- Cliquez sur le bouton de filtrage pour forcer un rechargement
- Attendez quelques secondes pour le chargement des données

### "Message d'erreur rouge"

Si vous voyez un message d'erreur rouge sur la page :
1. Lisez le message d'erreur complet
2. Cliquez sur le bouton "Réessayer"
3. Si l'erreur persiste, contactez le support avec :
   - Le message d'erreur exact
   - Votre navigateur et version
   - Le territoire sélectionné
   - Une capture d'écran

---

## 📱 Navigation Mobile

### Menu hamburger
Sur mobile, toutes les routes sont accessibles via le menu hamburger (☰) en haut à gauche :
- Accueil
- Comparateur
- Scanner
- Carte
- Modules
- IA Conseiller
- Historique
- Mon Compte
- FAQ
- Contact

### Gestes de navigation
- **Swipe droite** : Retour à la page précédente (selon le navigateur)
- **Tap sur le logo** : Retour à l'accueil
- **Scroll vers le haut** : Affiche le header de navigation

---

## 🔗 Routes Avancées

### Comparateurs spécialisés
- `/comparateur-vols` - Comparaison de prix des vols inter-îles
- `/comparateur-bateaux` - Comparaison de prix des ferries
- `/comparateur-carburants` - Comparaison de prix des carburants
- `/comparateur-assurances` - Comparaison d'assurances
- `/comparateur-formations` - Comparaison de formations professionnelles

### Scanner et OCR
- `/scan` - Scanner de codes-barres basique
- `/scan-ean` - Scanner EAN avancé avec détection automatique
- `/ocr` - Hub OCR unifié
- `/ocr/history` - Historique des scans OCR

### Observatoire
- `/observatoire` - Observatoire principal
- `/observatoire-vivant` - Vue dynamique temps réel
- `/observatoire-temps-reel` - Flux de données en direct
- `/observatoire/methodologie` - Méthodologie de collecte

### Compte utilisateur
- `/login` ou `/connexion` - Connexion
- `/inscription` - Inscription
- `/mon-compte` - Tableau de bord utilisateur
- `/mon-espace` - Espace personnel
- `/reset-password` - Réinitialisation du mot de passe

### Administration
- `/admin/dashboard` - Tableau de bord admin
- `/admin/ai-dashboard` - Tableau de bord IA
- `/admin/ai-market-insights` - Insights marché IA

---

## 🚀 Routes Expérimentales (Feature Flags)

Certaines routes sont activées uniquement si les feature flags correspondants sont configurés dans l'environnement :

| Route | Feature Flag | Description |
|-------|-------------|-------------|
| `/recherche-prix/avions` | `VITE_FEATURE_FLIGHTS` | Prix des vols |
| `/recherche-prix/bateaux` | `VITE_FEATURE_BOATS` | Prix des ferries |
| `/recherche-prix/abonnements/mobile` | `VITE_FEATURE_MOBILE_PLANS` | Forfaits mobiles |
| `/recherche-prix/abonnements/internet` | `VITE_FEATURE_INTERNET_PLANS` | Forfaits internet |
| `/recherche-prix/energie/electricite` | `VITE_FEATURE_ELECTRICITY` | Prix électricité |
| `/recherche-prix/energie/eau` | `VITE_FEATURE_WATER` | Prix eau |
| `/recherche-prix/fret` | `VITE_FEATURE_FREIGHT` | Coûts fret maritime |
| `/recherche-prix/fret-aerien` | `VITE_FEATURE_FRET_AERIEN` | Coûts fret aérien |

> **Note** : Si une route expérimentale n'est pas activée, une page "Module en préparation" s'affiche.

---

## 📊 Métriques de Navigation

### Temps de chargement moyens
- Page d'accueil : < 1s
- Hubs principaux : < 1.5s
- Pages avec données : < 2s
- Pages avec carte : < 2.5s

### Accessibilité
- Navigation au clavier : ✅ Complète
- Lecteurs d'écran : ✅ ARIA labels
- Contraste WCAG 2.1 AA : ✅ Conforme
- Navigation tactile : ✅ Optimisée

---

## 🐛 Signaler un Problème

Si vous rencontrez un problème de navigation :

1. **GitHub Issues** : https://github.com/teetee971/akiprisaye-web/issues
2. **Email** : contact@akiprisaye.com
3. **Formulaire de contact** : `/contact`

**Informations à fournir** :
- URL complète de la page problématique
- Navigateur et version (ex: Chrome 120, Safari 17)
- Système d'exploitation (Windows, Mac, iOS, Android)
- Description du problème
- Capture d'écran si possible
- Message d'erreur dans la console (F12)

---

## 🔄 Historique des Routes

### Version 2.1.0 (Janvier 2026)
- ✅ Suppression de `ti-panie-solidaire.html` (doublon)
- ✅ Ajout redirections 301 vers `/ti-panie`
- ✅ Amélioration gestion erreurs Ti-Panie
- ✅ Tests automatisés de navigation

### Version 2.0.0
- Consolidation en 7 hubs principaux
- Lazy loading des pages secondaires
- Retry logic pour les imports de composants

### Version 1.x
- Architecture multi-pages HTML
- Migration progressive vers React

---

## 📚 Documentation Complémentaire

- [Architecture générale](ARCHITECTURE.md)
- [Rapport d'audit navigation](AUDIT_NAVIGATION_RAPPORT.md)
- [Guide de contribution](CONTRIBUTING.md)
- [FAQ](https://akiprisaye-web.pages.dev/faq)

---

**Dernière mise à jour** : Janvier 2026  
**Mainteneurs** : Équipe A KI PRI SA YÉ
