# Modèle de Revenus & Facturation — A KI PRI SA YÉ

## 🎯 Vue d'ensemble

**A KI PRI SA YÉ** est un service numérique d'intérêt public **PAYANT**, sans freemium, offrant des données réelles, traçables et auditées pour lutter contre la vie chère dans les territoires d'outre-mer.

## ⚖️ Principes Fondamentaux (Non Négociables)

### ❌ Interdictions Strictes
- **Aucun freemium** — Pas d'accès gratuit illimité
- **Aucune donnée falsifiée** — Données réelles uniquement
- **Aucune promesse irréaliste** — IA responsable

### ✅ Engagements
- **Données réelles, traçables, auditées** — Qualité garantie
- **Facturation claire et contractuelle** — Transparence totale
- **IA responsable** — Estimations réalistes

## 📊 Segmentation des Clients

### 1️⃣ Citoyens (Plan CITIZEN)

**Cible** : Particuliers vivant dans les DOM-ROM-COM

**Services inclus** :
- ✅ Comparaison de prix multi-enseignes
- ✅ Listes de courses intelligentes
- ✅ Optimisation par distance/coût/territoire
- ✅ Alertes de variation de prix
- ✅ Prévisions de tendances (non spéculatives)
- ✅ Scanner de tickets de caisse
- ✅ Mode hors ligne renforcé
- ✅ Export PDF

**Tarification** :
- Mensuel : **4,99 €/mois** (prix de base)
- Annuel : **49 €/an** (2 mois offerts)
- Prix ajusté par territoire (ex: Guyane -20%, Réunion -10%)
- **Essai gratuit de 7 jours** (puis paiement requis)

### 2️⃣ Enseignes & Professionnels (Plans PRO & BUSINESS)

**Cible** : Commerçants, enseignes, PME

#### Plan PRO
**Services inclus** :
- ✅ Tous les services CITIZEN
- ✅ Inscription et gestion des points de vente
- ✅ Mise à jour des prix en temps réel
- ✅ Visibilité géolocalisée sur la plateforme
- ✅ Statistiques de consultation
- ✅ Export CSV

**Tarification** :
- Mensuel : **19 €/mois** par point de vente
- Annuel : **190 €/an** par point de vente
- Prix ajusté par territoire (ex: Guadeloupe -15%)

#### Plan BUSINESS
**Services inclus** :
- ✅ Tous les services PRO
- ✅ Intégration marketplace
- ✅ Analytics avancés
- ✅ Tableaux de bord personnalisés
- ✅ Gestion multi-points de vente

**Tarification** :
- Mensuel : **99 €/mois**
- Annuel : **990 €/an**
- Options premium (priorité, analytics avancés)

### 3️⃣ Institutions & Grands Comptes (Plans ENTERPRISE & INSTITUTION)

**Cible** : Entreprises, administrations, collectivités

#### Plan ENTERPRISE (Secteur privé)
**Services inclus** :
- ✅ Tous les services BUSINESS
- ✅ Données agrégées territoriales
- ✅ Analyses comparatives inter-zones
- ✅ Accès API sécurisé (lecture)
- ✅ Historique longue durée
- ✅ Devis générés par IA

**Tarification** :
- **Sur devis** généré par IA
- À partir de **2 500 €/an**
- Contrats annuels personnalisés

#### Plan INSTITUTION (Secteur public)
**Services inclus** :
- ✅ Tous les services ENTERPRISE
- ✅ Tableaux de bord institutionnels
- ✅ Rapports publics
- ✅ Export de données réglementé
- ✅ Support dédié

**Tarification** :
- **Sur devis** généré par IA
- À partir de **500 €/an** (tarif public)
- **Remise de 50%** pour institutions publiques
- Paiement différé possible

## 💳 Modules de Facturation

### 🧾 Module Facturation (BillingService)

**Fonctionnalités** :
- ✅ Génération automatique de factures
- ✅ Numérotation séquentielle (`INV-YYYY-NNNNNN`)
- ✅ Calcul TVA par territoire :
  - Guadeloupe/Martinique/Réunion : 8,5%
  - Polynésie française : 16%
  - Nouvelle-Calédonie : 11%
  - Guyane/Mayotte/SPM/etc. : 0%
  - France métropolitaine : 20%
- ✅ Historique des factures
- ✅ Export PDF
- ✅ Paiements récurrents

**Exemple de facture** :
```
═══════════════════════════════════════
          A KI PRI SA YÉ
   Service Numérique d'Intérêt Public
═══════════════════════════════════════

FACTURE N° INV-2025-000001

Plan : CITIZEN
Cycle : Mensuel
Territoire : Guadeloupe (GP)

Sous-total HT :        4,24 €
TVA (8,5%) :           0,36 €
────────────────────────────
TOTAL TTC :            4,60 €
```

### 💳 Module Paiement (PaymentProvider)

**Méthodes de paiement** :
1. **Carte bancaire** (Stripe/PayPal)
   - Paiement instantané
   - Sécurisé (3D Secure)
   - Récurrent automatique

2. **Virement bancaire**
   - IBAN fourni
   - Référence unique
   - Validation manuelle

3. **Paiement institutionnel différé**
   - Pour administrations
   - Délais 30-60 jours
   - Validation SIRET

**Sécurité** :
- ✅ Détection de fraude basique
- ✅ Vérification des montants élevés (>1000€)
- ✅ Tokenisation des cartes bancaires
- ✅ Conformité PCI-DSS (via fournisseur)

### 🤖 Module Devis IA (AIQuoteService)

**Processus** :
1. **Recueil des besoins** (formulaire intelligent)
   - Nombre d'utilisateurs
   - Nombre de points de vente
   - Appels API/mois
   - Niveau de support
   - Fonctionnalités personnalisées

2. **Estimation automatique** (IA)
   - Calcul du prix de base
   - Services additionnels
   - Remises applicables
   - Score de confiance (0-1)

3. **Validation humaine** (optionnelle)
   - Requise si :
     - Score IA < 70%
     - Montant > 50 000 €
     - Fonctionnalités sur-mesure

4. **Envoi du devis**
   - Numérotation : `QT-YYYY-NNNNNN`
   - Validité : 30 jours
   - Format PDF

5. **Acceptation et paiement**
   - Paiement direct après acceptation
   - Création automatique de l'abonnement

**Exemple de tarification automatique** :
```
Base ENTERPRISE :              2 500 €/an
+ 50 utilisateurs (40 x 10€) :  400 €/an
+ 200K appels API :              300 €/an
+ Support dédié :              1 000 €/an
─────────────────────────────────────
Sous-total :                   4 200 €
Remise volume (10%) :          - 420 €
─────────────────────────────────────
Total HT :                     3 780 €
TVA (20%) :                      756 €
─────────────────────────────────────
TOTAL TTC :                    4 536 €
```

## 🔐 Gouvernance & Transparence

### Journalisation des Accès Payants
- ✅ Tous les accès aux services payants sont loggés
- ✅ Traçabilité utilisateur ↔ service consommé
- ✅ Horodatage précis
- ✅ Stockage sécurisé (conformité RGPD)

### Traçabilité des Services Consommés
- ✅ Quota par plan
- ✅ Alertes de dépassement
- ✅ Facturation au réel pour dépassements

### Auditabilité du Modèle Économique
- ✅ Toutes les factures sont numérotées
- ✅ Exports comptables disponibles
- ✅ Rapports financiers générés automatiquement

### Indicateurs Publics (Non Sensibles)
- ✅ Nombre d'abonnés par plan (anonymisé)
- ✅ Revenus globaux par territoire (agrégés)
- ✅ Taux de satisfaction (anonymisé)

## 🔄 Cycle de Vie d'un Abonnement

```
┌─────────────────┐
│   Inscription   │
│   (7j essai)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Trial (7 jours)│
│   Accès limité  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  Fin du trial   │────▶│  Paiement    │
│                 │     │  requis      │
└────────┬────────┘     └──────┬───────┘
         │                     │
         │◀────────────────────┘
         ▼
┌─────────────────┐
│     Actif       │
│  Accès complet  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Renouvellement  │
│  automatique    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Annulation    │◀─── (Immédiat, sans relance)
│  (1 clic)       │
└─────────────────┘
```

## 📄 Statut des Plans

### Plans Actuellement Disponibles
| Plan | Prix Mensuel | Prix Annuel | Essai | Cible |
|------|-------------|-------------|-------|-------|
| CITIZEN | 4,99 € | 49 € | 7 jours | Particuliers |
| PRO | 19 € | 190 € | 7 jours | Professionnels |
| BUSINESS | 99 € | 990 € | 7 jours | PME/Enseignes |
| ENTERPRISE | Sur devis | ≥2 500 € | Sur demande | Grandes entreprises |
| INSTITUTION | Sur devis | ≥500 € | Sur demande | Secteur public |

### ❌ Plans Supprimés
- ~~FREE~~ — Supprimé (contre principe "No Freemium")

## 🌍 Tarification par Territoire

**Multiplicateurs appliqués** :
- Guadeloupe (GP) : **-15%**
- Martinique (MQ) : **-15%**
- Guyane (GF) : **-20%**
- Réunion (RE) : **-10%**
- Mayotte (YT) : **-25%**
- Wallis-et-Futuna (WF) : **-20%**
- Polynésie française (PF) : **-10%**
- Nouvelle-Calédonie (NC) : **-10%**
- Autres territoires : **Prix de base**

**Exemple** :
```
Plan CITIZEN en Guyane (GF)
Base : 4,99 €/mois
Multiplicateur : 0,80 (-20%)
Prix final : 3,99 €/mois
```

## 📚 Dépendances

- **Issue #477** : Vision et architecture institutionnelle
- **CORE** : Registre des entreprises (SIREN/SIRET/TVA)

## 🚀 Prochaines Étapes

### À implémenter
- [ ] Logging des accès payants
- [ ] Tracking de consommation
- [ ] Audit trail complet
- [ ] Indicateurs publics
- [ ] Tests automatisés
- [ ] Documentation API

### État du Projet
- 🟢 **Modèle de revenus** : ✅ Implémenté
- 🟢 **Facturation** : ✅ Implémenté
- 🟢 **Paiement** : ✅ Implémenté
- 🟢 **Devis IA** : ✅ Implémenté
- 🟡 **Gouvernance** : ⏳ En cours
- 🟡 **Tests** : ⏳ À faire
- 🟡 **Sécurité** : ⏳ À valider

## 📞 Contact

Pour toute question sur le modèle de revenus :
- Email : contact@akiprisaye.fr
- Documentation : [docs.akiprisaye.fr](https://docs.akiprisaye.fr)

---

**Dernière mise à jour** : 2025-12-18  
**Version** : 1.0.0  
**Statut** : ⏳ En conception → 🔒 Sans freemium → 🧠 Compatible IA → 🌍 DOM-ROM complet
