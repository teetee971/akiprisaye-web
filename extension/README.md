# A KI PRI SA YÉ - Extension Navigateur

Extension officielle pour la transparence des prix - Conforme aux principes de neutralité et de protection de la vie privée.

## 🎯 Objectif

Permettre aux citoyens de comparer les prix en temps réel lors de leurs achats en ligne, tout en respectant leur vie privée et en s'appuyant uniquement sur des données officielles.

## ✨ Fonctionnalités

### Détection Intelligente
- ✓ Détecte automatiquement les pages produits des magasins supportés
- ✓ Demande explicitement le consentement de l'utilisateur
- ✓ Ne fonctionne que sur les sites autorisés

### Comparaison de Prix
- ✓ Affiche les prix observés dans le territoire de l'utilisateur
- ✓ Compare avec d'autres magasins de la même zone
- ✓ Affiche la moyenne territoriale
- ✓ Historique des prix (quand disponible)

### Gestion de Liste
- ✓ Ajout facile à la liste de courses
- ✓ Synchronisation avec l'application PWA
- ✓ Suivi des prix avec alertes

### Respect de la Vie Privée
- ✓ Aucune donnée personnelle collectée
- ✓ Aucun historique de navigation
- ✓ Données stockées localement uniquement
- ✓ Transparence totale

## 🏪 Magasins Supportés

- Carrefour
- E.Leclerc
- Auchan
- Intermarché
- Lidl
- Super U
- Monoprix
- Casino

## 🌍 Territoires

- France Métropolitaine
- Guadeloupe
- Martinique
- Guyane
- La Réunion
- Mayotte

## 📦 Installation

### Chrome / Edge
1. Téléchargez l'extension
2. Ouvrez `chrome://extensions/`
3. Activez le "Mode développeur"
4. Cliquez sur "Charger l'extension non empaquetée"
5. Sélectionnez le dossier `extension/`

### Firefox
1. Ouvrez `about:debugging#/runtime/this-firefox`
2. Cliquez sur "Charger un module complémentaire temporaire"
3. Sélectionnez `extension/manifest.json`

## 🔒 Sécurité & Conformité

### Permissions Minimales
- `storage`: Stockage local des préférences utilisateur
- `activeTab`: Accès uniquement à l'onglet actif sur demande

### Aucune Permission de Tracking
- ❌ Pas de permission `tabs` (liste de tous les onglets)
- ❌ Pas de permission `history` (historique de navigation)
- ❌ Pas de permission `cookies`
- ❌ Pas de permission `webRequest` (surveillance réseau)

### Manifest V3
- Utilise le nouveau standard Manifest V3
- Service Worker au lieu de background page
- Permissions déclaratives
- Content Security Policy stricte

## 📖 Utilisation

1. **Visitez une page produit** d'un magasin supporté
2. **Acceptez le consentement** (première fois uniquement)
3. **Cliquez sur "Analyser"** pour voir les comparaisons de prix
4. **Consultez les informations** dans l'overlay latéral
5. **Ajoutez à votre liste** ou activez le suivi du prix

## 🎨 Design

- **Thème**: Dark/Neutral
- **Effet**: Liquid glass avec backdrop-filter
- **Ton**: Institutionnel, sobre, sans emojis
- **Animations**: Minimales et fluides

## ⚖️ Principes Absolus

### ✅ CE QUE NOUS FAISONS
- Utiliser uniquement des sources officielles
- Demander le consentement explicite
- Afficher les données telles que publiées
- Citer les sources
- Respecter la vie privée

### ❌ CE QUE NOUS NE FAISONS JAMAIS
- Scraping illégal
- Tracking caché
- Données simulées
- Vente de données
- Surveillance en arrière-plan

## 🔄 Synchronisation PWA

L'extension peut synchroniser les données avec l'application PWA principale:
- Liste de courses
- Produits suivis
- Préférences utilisateur

La synchronisation nécessite:
- Consentement explicite
- Compte utilisateur (optionnel)
- API disponible

## 📝 Structure du Projet

```
extension/
├── manifest.json               # Configuration Manifest V3
├── icons/                      # Icônes de l'extension
├── src/
│   ├── background/
│   │   └── service-worker.js   # Service worker principal
│   ├── content/
│   │   ├── detector.js         # Détection de produits
│   │   └── overlay.css         # Styles de l'overlay
│   ├── popup/
│   │   ├── popup.html          # Interface popup
│   │   ├── popup.css           # Styles popup
│   │   └── popup.js            # Logique popup
│   └── shared/
│       ├── config.js           # Configuration partagée
│       └── productDetector.js  # Utilitaires de détection
└── README.md                   # Cette documentation
```

## 🧪 Tests

Pour tester l'extension:

1. Chargez l'extension en mode développeur
2. Visitez une page produit (ex: carrefour.fr)
3. Vérifiez l'apparition du bouton d'analyse
4. Testez la comparaison de prix
5. Vérifiez la synchronisation avec la PWA

## 📊 Données Utilisées

- **Sources**: Observatoires officiels (OPMR, INSEE, etc.)
- **Fraîcheur**: Mise à jour selon disponibilité officielle
- **Fiabilité**: 100% données vérifiables
- **Traçabilité**: Source + date + lien pour chaque donnée

## 🚀 Roadmap

- [ ] Support Firefox (adaptation Manifest V2)
- [ ] Support Safari
- [ ] Ajout de nouveaux magasins
- [ ] Extension aux territoires d'Outre-mer
- [ ] API de synchronisation améliorée
- [ ] Mode hors ligne complet

## 📞 Support

- **Documentation**: README.md (ce fichier)
- **Issues**: GitHub Issues
- **Application principale**: https://akiprisaye.web.app

## 📜 Licence

Open source - Licence à définir
Données: Réutilisation de données publiques

---

**Version**: 1.0.0  
**Date**: Décembre 2025  
**Status**: Production Ready
