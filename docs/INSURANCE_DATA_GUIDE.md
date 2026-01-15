# Guide d'ajout des données d'assurance

## 📋 Introduction

Ce guide explique comment ajouter des données d'assurance réelles au comparateur A KI PRI SA YÉ.

## 🏗️ Structure du fichier

Le fichier `public/data/insurance-prices.json` contient les données des offres d'assurance observées.

### Format JSON

```json
{
  "metadata": {
    "version": "1.0.0",
    "generated_at": "ISO 8601 date",
    "source": "A KI PRI SA YÉ - Contributions citoyennes"
  },
  "providers": ["AXA", "Allianz", ...],
  "insurances": [...]
}
```

## ➕ Comment ajouter une offre

### 1. Collecter les informations

#### Sources recommandées
- **Sites officiels des assureurs** (fiabilité: high)
- **Contributions citoyennes vérifiées** (fiabilité: medium)
- **Baromètres sectoriels** (fiabilité: medium-high)
  - lecomparateurassurance.com
  - hellosafe.fr
  - assurland.com

#### Informations obligatoires
- Nom de l'assureur
- Nom de l'offre
- Type d'assurance: `auto`, `home`, `health`
- Niveau de couverture: `basic`, `intermediate`, `comprehensive`
- Prix annuel TTC
- Territoire: GP, MQ, GY, RE, YT
- Garanties principales (liste)
- Date d'observation
- Source

#### Informations optionnelles
- Franchise
- Durée de contrat
- Conditions de paiement

### 2. Vérifier le territoire

Territoires supportés:
- **GP** - Guadeloupe
- **MQ** - Martinique
- **GY** - Guyane
- **RE** - La Réunion
- **YT** - Mayotte

### 3. Ajouter l'entrée dans le fichier

Ouvrez `public/data/insurance-prices.json` et ajoutez l'offre dans le tableau `insurances`:

```json
{
  "id": "unique-id",
  "providerName": "Nom de l'assureur",
  "offerName": "Nom de l'offre",
  "insuranceType": "auto | home | health",
  "coverageLevel": "basic | intermediate | comprehensive",
  "annualPriceTTC": 450.00,
  "territory": "MQ",
  "mainCoverages": [
    "Responsabilité civile",
    "Garantie 1",
    "Garantie 2"
  ],
  "deductible": 300,
  "observationDate": "2026-01-14T00:00:00.000Z",
  "source": {
    "type": "official_website",
    "url": "https://example-assureur.fr",
    "reliability": "high"
  },
  "additionalInfo": {
    "contractDuration": "1 an",
    "paymentOptions": ["Mensuel", "Annuel"]
  }
}
```

## 📝 Types d'assurance

### 🚗 Assurance Automobile (`auto`)

**Niveaux de couverture:**
- **basic** - Tiers (minimum légal)
  - Responsabilité civile
  - Défense pénale
  - Protection juridique
  
- **intermediate** - Tiers étendu
  - Tout le basic +
  - Vol
  - Incendie
  - Bris de glace
  
- **comprehensive** - Tous risques
  - Tout l'intermediate +
  - Dommages tous accidents
  - Catastrophes naturelles
  - Assistance 0 km

### 🏠 Assurance Habitation (`home`)

**Niveaux de couverture:**
- **basic** - Couverture minimale
  - Responsabilité civile
  - Incendie
  - Dégâts des eaux
  - Bris de glace
  
- **intermediate** - Confort
  - Tout le basic +
  - Vol
  - Catastrophes naturelles
  - Dommages électriques
  
- **comprehensive** - Premium
  - Tout l'intermediate +
  - Objets de valeur
  - Jardin
  - Dépendances

### 💊 Assurance Santé (`health`)

**Niveaux de couverture:**
- **basic** - Essentiel
  - Hospitalisation 100%
  - Médecin 100%
  - Pharmacie 100%
  - Optique forfaitaire
  - Dentaire forfaitaire
  
- **intermediate** - Confort
  - Remboursements 125%
  - Forfaits optique/dentaire augmentés
  - Médecines douces
  
- **comprehensive** - Premium
  - Remboursements 150%+
  - Forfaits optique/dentaire élevés
  - Prévention
  - Médecines douces étendues

## ⚠️ Bonnes pratiques

### Validation des données
1. **Vérifier l'actualité** - Prix datant de moins de 6 mois
2. **Confirmer la disponibilité** - Offre disponible dans le territoire
3. **Compléter les garanties** - Liste complète des couvertures principales
4. **Citer la source** - URL ou référence vérifiable

### Qualité des données
- **Fiabilité haute** - Site officiel de l'assureur
- **Fiabilité moyenne** - Contribution citoyenne avec justificatifs
- **Fiabilité basse** - Information non vérifiée (à éviter)

### Format des dates
Utiliser le format ISO 8601:
```
2026-01-14T00:00:00.000Z
```

### Identifiants uniques
Format recommandé:
```
{assureur}-{type}-{territoire}-{numero}
exemple: axa-auto-gp-001
```

## 🔄 Mise à jour des données

### Fréquence recommandée
- **Assurance Auto** - Tous les 6 mois
- **Assurance Habitation** - Tous les 6 mois
- **Assurance Santé** - Tous les ans (renouvellement)

### Archivage
Les anciennes données peuvent être conservées avec:
- Un flag `archived: true`
- Une date de fin `validUntil`

## 🤝 Contribution citoyenne

### Comment contribuer
1. Collecter une offre d'assurance réelle
2. Prendre une capture d'écran ou noter les détails
3. Ajouter l'offre dans le fichier JSON
4. Créer une Pull Request sur GitHub
5. Fournir les justificatifs (captures d'écran anonymisées)

### Protection des données personnelles
❌ **Ne jamais inclure:**
- Numéros de contrat
- Données personnelles (nom, adresse, etc.)
- Informations bancaires
- Numéros de téléphone/email

✅ **Données acceptées:**
- Tarifs publics
- Noms des offres commerciales
- Garanties standards
- Territoires de disponibilité

## 📊 Statistiques

Le comparateur calcule automatiquement:
- Prix minimum, maximum, moyen
- Écart-type
- Médiane
- Classement des offres
- Comparaison vs moyenne

## 🚀 Évolutions futures

- Import automatique depuis APIs assureurs
- Historique des prix
- Alertes de baisse de prix
- Simulateur de profil
- Comparaison multi-territoires

## 📞 Support

Pour toute question:
- Issues GitHub: https://github.com/teetee971/akiprisaye-web/issues
- Documentation: Voir METHODOLOGIE_ASSURANCE_v1.8.0.md

---

**Rappel**: A KI PRI SA YÉ observe, ne vend pas. Aucune affiliation commerciale, aucun conseil personnalisé.
