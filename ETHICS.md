# Charte Éthique – A KI PRI SA YÉ

## 🎯 Principes Fondamentaux

**A KI PRI SA YÉ** est une plateforme citoyenne dédiée à la transparence des prix dans les territoires ultramarins français (DOM-ROM-COM). Notre engagement éthique est au cœur de notre mission.

---

## ❌ ZÉRO DARK PATTERN

Nous nous engageons formellement à **JAMAIS** utiliser de techniques de manipulation psychologique :

### Ce que nous ne faisons PAS :

#### ❌ Manipulation de l'Interface
- **Pas de boutons trompeurs** : Les actions destructives (annuler un abonnement) sont aussi visibles que les actions positives
- **Pas de double négation** : "Ne pas ne pas s'abonner" → Nous utilisons un langage clair et direct
- **Pas de pré-cochage forcé** : Aucune option n'est sélectionnée sans votre consentement explicite
- **Pas de "roach motel"** : S'inscrire est aussi facile que de se désinscrire

#### ❌ Pression Temporelle Artificielle
- **Pas de compte à rebours** : "Plus que 5 minutes pour profiter de cette offre !"
- **Pas de fausse rareté** : "Plus que 3 places disponibles !"
- **Pas d'urgence fabriquée** : "Cette offre expire dans 10 minutes !"

#### ❌ Obstruction à la Désinscription
- **Annulation en 1 clic** : Pas de labyrinthe de menus
- **Pas de ligne téléphonique obligatoire** : Tout se fait en ligne
- **Pas de délai de traitement** : Effet immédiat
- **Confirmation claire** : Vous savez toujours où vous en êtes

#### ❌ Culpabilisation
- **Pas de shaming** : "Êtes-vous SÛR de vouloir manquer cette opportunité ?"
- **Pas de FOMO** : "Tous vos voisins ont déjà souscrit"
- **Pas de menace** : "Vous perdrez tous vos avantages"

#### ❌ Coûts Cachés
- **Prix TTC affichés** : Toujours toutes taxes comprises
- **Pas de frais surprise** : Tous les coûts sont indiqués avant validation
- **Pas de reconduction tacite masquée** : Les abonnements sont clairement indiqués comme récurrents

---

## ✅ TRANSPARENCE ABSOLUE

### 1. Sources de Données Toujours Visibles

Chaque donnée affichée inclut **obligatoirement** :

```
📊 Composant DataBadge
├─ Source (INSEE, OPMR, DGCCRF, data.gouv.fr)
├─ Date de mise à jour
├─ Territoire concerné
└─ Limite méthodologique (si applicable)
```

**Exemple** :
```
Source : INSEE | Mise à jour : 15/12/2024 | Territoire : Martinique
Limite : Prix moyens observés, variations possibles selon enseigne
```

### 2. Pas de Données Inventées

- **JAMAIS** de prix générés aléatoirement
- **JAMAIS** de prédictions non sourcées
- **JAMAIS** de moyennes non documentées

Si une donnée n'est pas disponible, nous affichons :
```
❌ Donnée non disponible pour ce territoire
Source : [Explication du manque]
```

### 3. Limites Méthodologiques Expliquées

Nous documentons clairement :
- La couverture géographique réelle (magasins référencés)
- La fréquence de mise à jour des prix
- Les marges d'erreur des estimations
- Les biais méthodologiques connus

---

## 🔒 PROTECTION DES DONNÉES PERSONNELLES

### Collecte Minimale

Nous ne collectons que ce qui est **strictement nécessaire** :

**Pour l'utilisation gratuite** :
- Territoire sélectionné (stocké localement)
- Liste de courses (stockée localement)
- Aucun compte requis

**Pour les abonnements payants** :
- Email (uniquement pour facturation)
- Territoire (personnalisation)
- Informations de paiement (traitées par Stripe, jamais stockées chez nous)

### Stockage Local d'Abord

- **localStorage** : Préférences, territoire, historique
- **IndexedDB** : Listes de courses, historique de prix
- **Pas de tracking** : Aucun cookie publicitaire
- **Pas d'analytics comportemental** : Uniquement des statistiques anonymisées d'usage

### Géolocalisation Opt-In

- **Jamais activée par défaut**
- **Demande de permission explicite**
- **Utilisée uniquement pour la recherche de magasins proches**
- **Jamais stockée sur nos serveurs**
- **Désactivable à tout moment**

### Conformité RGPD

- ✅ Droit d'accès à vos données
- ✅ Droit de rectification
- ✅ Droit à l'effacement ("droit à l'oubli")
- ✅ Droit à la portabilité
- ✅ Droit d'opposition
- ✅ Notification en cas de violation de données (72h)

---

## 💰 MODÈLE ÉCONOMIQUE ÉTHIQUE

### Principe de Base

> **"Vous payez pour le service, pas pour vendre vos données"**

### Tarification Transparente

Tous nos prix sont :
- **TTC** (Toutes Taxes Comprises)
- **Sans frais cachés**
- **Sans engagement caché**
- **Réduction DOM-ROM-COM clairement affichée** (-30% sur plans Pro/Business)

### Remise Spéciale Territoriale

Les résidents des DOM-ROM-COM bénéficient automatiquement de **-30%** sur :
- Plan Professionnel (13,30 € au lieu de 19 €)
- Plan Business (69,30 € au lieu de 99 €)

**Pourquoi ?** 
Parce que la vie est déjà plus chère dans ces territoires, et notre mission est de la rendre plus abordable, pas de profiter de cette situation.

### Annulation Sans Rétention

- **1 clic pour annuler**
- **Effet immédiat**
- **Pas de période de préavis**
- **Remboursement au prorata** (si applicable selon CGV)
- **Pas de relance commerciale agressive**

---

## 🌍 ENGAGEMENT TERRITORIAL

### Priorité DOM-ROM-COM

Nous servons en priorité les 12 territoires ultramarins français :

**DROM (5)** :
- 🇬🇵 Guadeloupe
- 🇲🇶 Martinique
- 🇬🇫 Guyane
- 🇷🇪 La Réunion
- 🇾🇹 Mayotte

**COM (7)** :
- 🇵🇲 Saint-Pierre-et-Miquelon
- 🇧🇱 Saint-Barthélemy
- 🇲🇫 Saint-Martin
- 🇼🇫 Wallis-et-Futuna
- 🇵🇫 Polynésie française
- 🇳🇨 Nouvelle-Calédonie
- 🇹🇫 Terres australes et antarctiques françaises

### Accessibilité Maximale

- **Mode hors ligne** : Fonctionnement sans connexion internet
- **PWA** : Installation comme application native
- **Mobile first** : Optimisé pour smartphones
- **WCAG 2.1 AA** : Accessibilité pour tous
- **Multilingue** : Français, Créole, Espagnol (selon territoires)

---

## 🚫 CE QUE NOUS NE FAISONS PAS

### JAMAIS de Revente de Données

- ❌ Pas de vente de données utilisateurs
- ❌ Pas de partage avec des tiers (sauf obligations légales)
- ❌ Pas de profiling publicitaire
- ❌ Pas de tracking inter-sites

### JAMAIS de Promesses Irréalistes

- ❌ "Économisez 500 € par mois garanti !"
- ❌ "Les prix vont exploser demain !"
- ❌ "Intelligence artificielle qui prédit tout !"

### JAMAIS de Manipulation Editoriale

- ❌ Pas d'articles sponsorisés déguisés
- ❌ Pas de classements truqués
- ❌ Pas de favorisation d'enseignes payantes
- ❌ Pas de censure de données gênantes

---

## 📊 PRÉDICTIONS DE PRIX : MÉTHODOLOGIE CLAIRE

### Ce que c'est

Un **outil statistique basique** qui analyse :
- Historique des prix (données publiques)
- Saisonnalité observée
- Tendances moyennes

### Ce que ce n'est PAS

- ❌ Pas une "IA magique"
- ❌ Pas une certitude
- ❌ Pas une garantie contractuelle

### Message Obligatoire

Toute prédiction affiche :

```
⚠️ ESTIMATION INDICATIVE
Basée sur données historiques publiques (INSEE/OPMR).
Pas une garantie. Les prix réels peuvent varier.
Dernière mise à jour : [DATE]
```

---

## 🏛️ INDÉPENDANCE & NEUTRALITÉ

### Aucun Conflit d'Intérêts

- **Pas de partenariats avec des enseignes**
- **Pas de commissions sur achats**
- **Pas de publicité ciblée**
- **Financement : abonnements uniquement**

### Traitement Équitable

Tous les magasins sont traités de manière égale :
- Même critères d'évaluation
- Même visibilité sur la carte
- Pas de mise en avant payante

---

## 📞 CONTACT & RÉCLAMATIONS

### Support Accessible

- **Email** : support@akiprisaye.fr
- **Délai de réponse** : 48h ouvrées (objectif)
- **Pas de numéro surtaxé**

### Médiation Indépendante

En cas de litige non résolu :
- Médiateur de la consommation (coordonnées dans CGV)
- Gratuit pour les consommateurs
- Indépendant de A KI PRI SA YÉ

---

## 🔄 ÉVOLUTION DE CETTE CHARTE

Cette charte peut évoluer, mais **toujours dans le sens d'une plus grande transparence**.

- Toute modification majeure sera notifiée aux utilisateurs
- L'historique des versions est public (Git)
- Les utilisateurs peuvent commenter via GitHub Issues

---

## 🏆 NOTRE ENGAGEMENT

**A KI PRI SA YÉ** s'engage à :

✅ **Servir les citoyens**, pas les actionnaires  
✅ **Éclairer**, pas manipuler  
✅ **Respecter**, pas exploiter  
✅ **Être transparent**, pas opaque  

---

**Dernière mise à jour** : Décembre 2024  
**Version** : 1.0  
**Contact** : ethics@akiprisaye.fr

---

*"Un service citoyen qui respecte, sert et éclaire. Aucune promesse irréaliste. Aucun greenwashing. Aucun bullshit. Juste des données publiques, rendues utiles."*
