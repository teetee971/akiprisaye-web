# A KI PRI SA YÉ - Documentation d'implémentation

## 📋 Vue d'ensemble

Ce document détaille l'implémentation de la plateforme **A KI PRI SA YÉ**, un comparateur de prix citoyen pour les territoires d'Outre-mer (DOM-TOM).

## 🎯 Philosophie du projet

> **"Faire peu, mais faire VRAI"**

A KI PRI SA YÉ n'est pas un gadget. C'est un outil citoyen, sérieux, factuel et vérifiable.

### Principes fondamentaux

1. ✅ **Transparence totale** - Sources clairement identifiées, méthodologie publique
2. ✅ **Données réelles** - Aucun prix inventé, aucune simulation présentée comme réelle
3. ✅ **Honnêteté** - Les modules en développement sont clairement identifiés
4. ✅ **Indépendance** - Aucun lien avec des enseignes ou marques commerciales

### Ce que nous ne faisons PAS

- ❌ Pas de prix inventés ou simulés
- ❌ Pas de fausse intelligence artificielle
- ❌ Pas de promesses impossibles
- ❌ Pas de publicité pour des enseignes
- ❌ Pas de collecte de données personnelles invasive

## 🏗️ Architecture

### Stack technique

- **Frontend**: React 18 + Vite 7
- **Styling**: TailwindCSS 4
- **Routing**: React Router DOM 7
- **Backend**: Firebase/Firestore (lecture seule)
- **Déploiement**: Cloudflare Pages
- **CI/CD**: GitHub Actions

### Structure des dossiers

```
akiprisaye-web/
├── src/
│   ├── pages/           # Pages de l'application
│   │   ├── Home.jsx
│   │   ├── Comparateur.jsx
│   │   ├── Carte.jsx
│   │   ├── Alertes.jsx       # ✨ NOUVEAU
│   │   ├── APropos.jsx       # ✨ NOUVEAU
│   │   ├── Methodologie.jsx  # ✨ NOUVEAU
│   │   ├── Actualites.jsx
│   │   ├── Contact.jsx
│   │   └── MentionsLegales.jsx
│   ├── components/      # Composants réutilisables
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── TerritorySelector.jsx
│   ├── context/         # Contextes React
│   │   └── AuthContext.jsx
│   ├── data/            # Données de démonstration
│   │   └── seedProducts.js
│   └── main.jsx         # Point d'entrée
├── public/              # Assets statiques
└── dist/                # Build de production
```

## 📄 Pages implémentées

### 1. Accueil (`/`)
- Hero section avec sélection de langue (FR, Kréyol, ES)
- Grille de fonctionnalités (Comparateur, Scanner, Carte, Alertes)
- Section Mission avec liens vers À propos et Méthodologie
- Mobile-first, responsive

### 2. Comparateur (`/comparateur`)
- Recherche par code EAN
- Sélection du territoire
- Scanner de code-barres
- Affichage des prix par magasin
- ⚠️ **Notice de transparence** : Données de démonstration clairement identifiées
- Lien vers la méthodologie

### 3. Carte (`/carte`)
- Carte interactive par territoire (Leaflet)
- Localisation des magasins
- Prix moyens par zone
- Géolocalisation non-invasive

### 4. Alertes (`/alertes`) ✨ NOUVEAU
- Système d'alertes consommateurs
- Types d'alertes : Prix élevés, Pénuries, Variations brutales
- Filtre par territoire
- ⚠️ **Avertissement "Module en développement"** avec description du futur fonctionnement
- Exemples d'alertes avec disclaimer

### 5. Actualités (`/actualites`)
- Fil d'actualités sur la vie chère
- Sources publiques uniquement (INSEE, DGCCRF)
- Filtre par territoire

### 6. À propos (`/a-propos`) ✨ NOUVEAU
- Mission de la plateforme
- Philosophie du projet
- Services proposés
- Ce que nous ne faisons PAS
- Informations sur l'équipe
- Contact

### 7. Méthodologie (`/methodologie`) ✨ NOUVEAU
- Transparence sur la collecte des données
- Sources publiques utilisées
- Processus de vérification des prix
- Calculs et moyennes expliqués
- Fréquence de mise à jour
- ⚠️ **Limites du service** honnêtement reconnues
- Comment contribuer

### 8. Mentions légales (`/mentions-legales`)
- Informations éditeur
- Hébergement
- RGPD et données personnelles
- Cookies

### 9. Contact (`/contact`)
- Formulaire de contact simple
- Pas de collecte invasive

## 🔄 Navigation

### Header (Desktop)
- Logo cliquable → Accueil
- Liens : Comparateur, Scanner, Carte, Alertes, Actualités, Mon Compte
- Toggle thème clair/sombre

### Header (Mobile)
- Menu burger avec drawer
- Navigation complète
- Safe areas pour notch/home indicator

### Footer
- Liens : À propos, Méthodologie, Actualités, Contact, Mentions légales
- Copyright et baseline

## 🎨 Design System

### Couleurs
- **Primary**: Blue 600 (`#2563eb`)
- **Background**: Slate 950 (dark mode)
- **Text**: White / Slate 300
- **Accent**: Blue 400-700 gradient

### Composants
- Cards avec border et hover effects
- Boutons avec transitions
- Icons emoji (pas de font icons)
- Spacing cohérent (Tailwind)

## 🚀 Déploiement

### Build local
```bash
npm install
npm run build
npm run preview
```

### CI/CD (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

steps:
  - Build avec npm run build
  - Deploy vers Cloudflare Pages
  - Dossier: dist/
```

### Configuration Cloudflare Pages
- **Project name**: akiprisaye-web
- **Build command**: `npm run build`
- **Build output**: `dist`
- **Node version**: 20

## 🔐 Sécurité

### Vérifications
- ✅ CodeQL scan: 0 alertes
- ✅ Pas de secrets dans le code
- ✅ Firebase auth optionnel
- ✅ RGPD compliant

### Firebase
- Configuration optionnelle
- Gestion gracieuse si non configuré
- Lecture seule pour les prix
- Pas d'écriture directe client-side

## 📊 Données

### Phase actuelle: Démonstration
Les données actuelles proviennent de `src/data/seedProducts.js`:
- Produits courants (Coca-Cola, Pâtes, Lait, etc.)
- Prix réalistes basés sur des relevés manuels
- Territoires: Guadeloupe, Martinique, La Réunion
- ⚠️ **Clairement identifiées comme données de démo**

### Phase future: Données réelles
Sources prévues:
1. Tickets de caisse citoyens (scanner)
2. Collecte manuelle bénévole
3. Partenariats enseignes
4. Open Data public (INSEE, DGCCRF)

## 🧪 Tests

### Tests manuels effectués
- ✅ Build réussi
- ✅ Navigation entre pages
- ✅ Responsive mobile
- ✅ Liens fonctionnels
- ✅ Transparence affichée

### À tester en production
- Performance mobile réelle
- Temps de chargement
- SEO
- Accessibilité (WCAG)

## 📈 Métriques

### Build
- Taille totale: ~1.4 MB
- Chunks principaux:
  - index: 565 kB
  - Comparateur: 432 kB (à optimiser)
  - Carte: 192 kB

### Performance à améliorer
- Code splitting dynamique
- Lazy loading images
- Bundle size optimization

## 🔧 Maintenance

### Ajout d'une nouvelle page
1. Créer `src/pages/NomPage.jsx`
2. Ajouter route dans `src/main.jsx`
3. Ajouter lien dans Header/Footer
4. Respecter le design system
5. Ajouter notices de transparence si nécessaire

### Mise à jour des données
1. Modifier `src/data/seedProducts.js`
2. Ou connecter à l'API Firebase
3. Toujours afficher date de mise à jour
4. Toujours identifier la source

## 📚 Ressources

### Documentation externe
- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [TailwindCSS](https://tailwindcss.com)
- [Cloudflare Pages](https://pages.cloudflare.com)

### Sources de données
- [INSEE](https://www.insee.fr)
- [DGCCRF](https://www.economie.gouv.fr/dgccrf)
- [Open Food Facts](https://fr.openfoodfacts.org)

## 🎯 Roadmap

### Court terme (1-3 mois)
- [ ] Activer la collecte de tickets citoyens
- [ ] Ajouter plus de produits de base
- [ ] Étendre la couverture géographique
- [ ] Optimiser les performances

### Moyen terme (3-6 mois)
- [ ] Partenariats avec enseignes
- [ ] Système d'alertes automatique
- [ ] API publique
- [ ] App mobile (PWA)

### Long terme (6-12 mois)
- [ ] IA de détection d'anomalies
- [ ] Prédictions de prix
- [ ] Extension à tous les DOM-TOM
- [ ] Open-source complet

## 📞 Contact

Pour toute question sur cette implémentation:
- GitHub Issues
- Page Contact du site
- Équipe A KI PRI SA YÉ

---

**Version**: 1.0.0  
**Date**: Janvier 2025  
**License**: À définir  
**Auteur**: Équipe A KI PRI SA YÉ
