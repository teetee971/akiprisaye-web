# ÉPOPÉE : Transformation Institutionnelle Complète – A KI PRI SA YÉ

**Type:** Epic  
**Priorité:** Stratégique  
**Statut:** Planifié  
**Date de création:** 2025-12-18  

---

## 📋 RÉSUMÉ EXÉCUTIF

Transformation complète de la plateforme A KI PRI SA YÉ d'un système de démonstration vers une plateforme institutionnelle payante de niveau production, destinée à lutter contre la vie chère dans TOUS les territoires français (Métropole + DOM-ROM).

**Objectif stratégique :** Devenir la référence institutionnelle de confiance pour l'analyse transparente des prix en Outre-mer.

---

## 🎯 PRINCIPES DIRECTEURS NON-NÉGOCIABLES

### Positionnement
- ❌ **PAS** de freemium
- ❌ **PAS** de données mockées ou fictives
- ❌ **PAS** de gamification
- ❌ **PAS** d'interface promotionnelle
- ✅ Positionnement neutre, sérieux, d'intérêt public
- ✅ Tout doit être auditable, documenté, testable

### Couverture géographique
France complète + **TOUS** les DOM-ROM :
- 🇬🇵 Guadeloupe
- 🇲🇶 Martinique
- 🇬🇫 Guyane
- 🇷🇪 La Réunion
- 🇾🇹 Mayotte
- 🇲🇫 Saint-Martin
- 🇧🇱 Saint-Barthélemy
- 🇵🇫 Polynésie française
- 🇳🇨 Nouvelle-Calédonie
- 🇼🇫 Wallis-et-Futuna
- 🇵🇲 Saint-Pierre-et-Miquelon
- 🇹🇫 Terres australes et antarctiques françaises

---

## 📦 WORKSTREAMS PRINCIPAUX

### 1️⃣ CORE DATA FOUNDATION – Registre Centralisé des Entreprises

**Epic:** `EPIC-001-Company-Registry`

#### Objectifs
- Créer un registre unique et fiable de toutes les entreprises
- Support multi-identifiant (SIRET, SIREN, TVA, ID interne)
- Validation automatique et cohérence des données
- Dérivation automatique du statut d'activité

#### Tâches principales

**Backend**
- [ ] `TASK-001.1` - Créer le modèle de données Company (TypeScript strict)
- [ ] `TASK-001.2` - Implémenter la validation SIRET (14 chiffres, Luhn)
- [ ] `TASK-001.3` - Implémenter la validation SIREN (9 chiffres)
- [ ] `TASK-001.4` - Implémenter la validation TVA française
- [ ] `TASK-001.5` - Créer l'API de recherche multi-critères (SIRET/SIREN/VAT/ID)
- [ ] `TASK-001.6` - Implémenter le système de dérivation automatique du statut
- [ ] `TASK-001.7` - Créer le système de tracking des changements historiques
- [ ] `TASK-001.8` - Intégrer les sources de données officielles (API INSEE, etc.)
- [ ] `TASK-001.9` - Implémenter le système de vérification et timestamp

**Tests**
- [ ] `TASK-001.10` - Tests unitaires (100% coverage sur validation)
- [ ] `TASK-001.11` - Tests d'intégration (API endpoints)
- [ ] `TASK-001.12` - Tests de cohérence des données

**Documentation**
- [ ] `TASK-001.13` - Documentation du modèle de données
- [ ] `TASK-001.14` - Documentation API (OpenAPI/Swagger)
- [ ] `TASK-001.15` - Guide de validation SIRET/SIREN/TVA

---

### 2️⃣ STORE-COMPANY INTEGRATION

**Epic:** `EPIC-002-Store-Company-Link`

#### Objectifs
- Lier chaque magasin à son entreprise parente
- Détecter les incohérences (magasin ouvert / entreprise inactive)
- Enrichir les pages magasins avec les données entreprise

#### Tâches principales

- [ ] `TASK-002.1` - Créer la relation Store → Company dans le modèle
- [ ] `TASK-002.2` - Migrer les données existantes
- [ ] `TASK-002.3` - Implémenter les alertes d'incohérence statut
- [ ] `TASK-002.4` - Enrichir le composant Store avec les données Company
- [ ] `TASK-002.5` - Créer le filtre "Statut entreprise" sur la liste magasins
- [ ] `TASK-002.6` - Tests de validation des liens
- [ ] `TASK-002.7` - Documentation

---

### 3️⃣ PUBLIC COMPANY PROFILE PAGE

**Epic:** `EPIC-003-Company-Profile`

#### Objectifs
- Page publique et partageable pour chaque entreprise
- Design institutionnel sobre
- Transparence totale (sources, vérifications, historique)

#### Tâches principales

**Frontend**
- [ ] `TASK-003.1` - Créer le composant CompanyProfile (React/TypeScript)
- [ ] `TASK-003.2` - Implémenter l'affichage badge ACTIVE / CEASED
- [ ] `TASK-003.3` - Section identité légale complète
- [ ] `TASK-003.4` - Intégration carte GPS (Leaflet)
- [ ] `TASK-003.5` - Liste des magasins liés
- [ ] `TASK-003.6` - Historique des changements de statut
- [ ] `TASK-003.7` - Panneau "Sources & Vérifications"
- [ ] `TASK-003.8` - Route `/company/:id` ou `/company/:siret`
- [ ] `TASK-003.9` - SEO & OpenGraph meta tags
- [ ] `TASK-003.10` - Mode partage (QR code, liens directs)

**Design**
- [ ] `TASK-003.11` - Wireframes "Chic Institutionnel"
- [ ] `TASK-003.12` - UI components dans le design system
- [ ] `TASK-003.13` - Tests d'accessibilité (WCAG 2.1 AA)

---

### 4️⃣ TRANSPARENCY & SOURCES SYSTEM

**Epic:** `EPIC-004-Transparency`

#### Objectifs
- Chaque information doit afficher sa source
- Typologie des sources (Institutionnel / Média / Signalement utilisateur)
- Date de dernière mise à jour
- Territoire concerné

#### Tâches principales

- [ ] `TASK-004.1` - Créer le modèle DataSource
- [ ] `TASK-004.2` - Créer le composant SourceBadge
- [ ] `TASK-004.3` - Intégrer SourceBadge dans tous les composants de données
- [ ] `TASK-004.4` - Créer le bloc "Pourquoi c'est important"
- [ ] `TASK-004.5` - Page /sources (liste de toutes les sources utilisées)
- [ ] `TASK-004.6` - Tests
- [ ] `TASK-004.7` - Documentation

---

### 5️⃣ ADVANCED PRICE COMPARISON ENGINE

**Epic:** `EPIC-005-Price-Comparison`

#### Objectifs
- Moteur de comparaison territorial avancé
- Prise en compte de la distance
- Prise en compte des coûts transport/logistique
- Contraintes spécifiques DOM-ROM

#### Tâches principales

- [ ] `TASK-005.1` - Algorithme de comparaison multi-magasins
- [ ] `TASK-005.2` - Calcul de distance géographique (Haversine)
- [ ] `TASK-005.3` - Pondération distance vs prix
- [ ] `TASK-005.4` - Intégration des coûts logistiques DOM-ROM
- [ ] `TASK-005.5` - Interface de comparaison avancée
- [ ] `TASK-005.6` - Filtre par territoire
- [ ] `TASK-005.7` - Export des résultats (CSV/PDF)
- [ ] `TASK-005.8` - Tests de performance (>10k produits)
- [ ] `TASK-005.9` - Documentation

---

### 6️⃣ PRICE TREND & PREDICTION MODULE (PAID)

**Epic:** `EPIC-006-Price-Prediction`

#### Objectifs
- Extension du Module 5 existant
- Analyse prédictive encadrée (PAS de promesses)
- Facteurs saisonniers et politiques publiques
- Disclaimer légal obligatoire

#### Tâches principales

- [ ] `TASK-006.1` - Modèle de tendance saisonnière
- [ ] `TASK-006.2` - Intégration des signaux politiques (taxes, plafonds)
- [ ] `TASK-006.3` - Calcul du score de confiance
- [ ] `TASK-006.4` - Génération d'explications human-readable
- [ ] `TASK-006.5` - Composant UI avec disclaimer légal
- [ ] `TASK-006.6` - Tests de validation du modèle
- [ ] `TASK-006.7` - Documentation méthodologique
- [ ] `TASK-006.8` - Restriction d'accès (paywall)

**Note :** Base déjà implémentée dans Module 5 (commit `43923bd`)

---

### 7️⃣ SMART SHOPPING LIST + GPS

**Epic:** `EPIC-007-Smart-Shopping`

#### Objectifs
- Liste de courses intelligente
- Géolocalisation utilisateur
- Optimisation multi-critères (prix, distance, meilleur parcours)
- Scénarios alternatifs

#### Tâches principales

- [ ] `TASK-007.1` - Modèle ShoppingList
- [ ] `TASK-007.2` - API de géolocalisation (permission navigateur)
- [ ] `TASK-007.3` - Algorithme de recherche produits multi-magasins
- [ ] `TASK-007.4` - Optimisation prix total
- [ ] `TASK-007.5` - Optimisation distance
- [ ] `TASK-007.6` - Optimisation "meilleur parcours" (TSP simplifié)
- [ ] `TASK-007.7` - Affichage scénarios alternatifs
- [ ] `TASK-007.8` - Carte interactive du parcours
- [ ] `TASK-007.9` - Sauvegarde listes utilisateur
- [ ] `TASK-007.10` - Export (PDF/Email)
- [ ] `TASK-007.11` - Tests de performance
- [ ] `TASK-007.12` - Documentation

---

### 8️⃣ ALERT SYSTEM (MULTI-CHANNEL)

**Epic:** `EPIC-008-Alerts`

#### Objectifs
- Système d'alertes intelligent
- Détection automatique d'anomalies
- Multi-canal (in-app, email)
- Traçabilité complète

#### Types d'alertes
1. Entreprise devient inactive
2. Incohérence magasin/entreprise (magasin ouvert, entreprise fermée)
3. Hausse anormale de prix
4. Anomalie territoriale de prix

#### Tâches principales

**Backend**
- [ ] `TASK-008.1` - Modèle Alert
- [ ] `TASK-008.2` - Détecteur entreprise inactive
- [ ] `TASK-008.3` - Détecteur incohérence magasin
- [ ] `TASK-008.4` - Détecteur hausse anormale prix (seuils)
- [ ] `TASK-008.5` - Détecteur anomalie territoriale
- [ ] `TASK-008.6` - Queue d'alertes (Bull/Redis)
- [ ] `TASK-008.7` - Service email (SendGrid/Mailgun)
- [ ] `TASK-008.8` - API subscription/unsubscribe
- [ ] `TASK-008.9` - Logs d'audit

**Frontend**
- [ ] `TASK-008.10` - Centre de notifications in-app
- [ ] `TASK-008.11` - Paramètres utilisateur (canaux, fréquence)
- [ ] `TASK-008.12` - Historique des alertes reçues
- [ ] `TASK-008.13` - Composant AlertBadge

**Tests**
- [ ] `TASK-008.14` - Tests détecteurs
- [ ] `TASK-008.15` - Tests delivery email
- [ ] `TASK-008.16` - Tests de charge (10k utilisateurs)

---

### 9️⃣ UX/UI – "CHIC INSTITUTIONNEL"

**Epic:** `EPIC-009-Design-System`

#### Objectifs
- Design system complet "Chic Institutionnel"
- Dark, sobre, glass-like
- Typographie Inter / Source Sans
- Accessibilité WCAG 2.1 AA
- Langage visuel de confiance

#### Principes de design
- Pas de couleurs flashy
- Cards, badges, dividers subtils
- Hiérarchie claire
- Micro-interactions sobres
- Responsive mobile-first

#### Tâches principales

- [ ] `TASK-009.1` - Audit UI actuel
- [ ] `TASK-009.2` - Définir palette couleurs institutionnelle
- [ ] `TASK-009.3` - Système typographique (Inter/Source Sans)
- [ ] `TASK-009.4` - Composants de base (Button, Card, Badge, Input, Select)
- [ ] `TASK-009.5` - Composants avancés (DataTable, Modal, Toast, Alert)
- [ ] `TASK-009.6` - Dark mode cohérent
- [ ] `TASK-009.7` - Glass-like effects (backdrop-filter)
- [ ] `TASK-009.8` - Animations subtiles
- [ ] `TASK-009.9` - Grid system responsive
- [ ] `TASK-009.10` - Documentation Storybook
- [ ] `TASK-009.11` - Tests accessibilité (axe-core)
- [ ] `TASK-009.12` - Guide de style

---

### 🔟 BUSINESS MODEL (NO FREEMIUM)

**Epic:** `EPIC-010-Business-Model`

#### Objectifs
- Modèle payant uniquement
- Tiers institutionnels
- API d'accès pour collectivités
- Rapports et études territoriaux

#### Offres

**1. Citoyen Avancé**
- Alertes personnalisées
- Listes de courses illimitées
- Export données (CSV/PDF)
- Analyses de tendances
- **Prix :** 9,90€/mois ou 99€/an

**2. Associations / ONG**
- Tout Citoyen Avancé +
- Dashboard collectif
- Études territoriales
- Support prioritaire
- **Prix :** 49€/mois ou 490€/an

**3. Médias / Analystes**
- Tout Associations +
- API d'accès
- Données brutes (CSV/JSON)
- Rapports personnalisés
- Licence de republication
- **Prix :** 149€/mois ou 1490€/an

**4. Institutions / Collectivités**
- Tout Médias +
- White-label dashboard
- Intégration SI
- Formation équipes
- Support dédié
- **Prix :** Sur devis

**Revenus additionnels**
- Rapports territoriaux à la demande (PDF/CSV)
- Études sectorielles
- Données anonymisées agrégées
- White-label pour collectivités locales

#### Tâches principales

**Payment Infrastructure**
- [ ] `TASK-010.1` - Intégration Stripe
- [ ] `TASK-010.2` - Modèle Subscription
- [ ] `TASK-010.3` - Modèle PaymentMethod
- [ ] `TASK-010.4` - Webhooks Stripe
- [ ] `TASK-010.5` - Gestion des plans (Citoyen/Asso/Média/Instit)
- [ ] `TASK-010.6` - Système de facturation
- [ ] `TASK-010.7` - Portail client (invoices, changement plan)

**Access Control**
- [ ] `TASK-010.8` - Middleware de vérification abonnement
- [ ] `TASK-010.9` - Feature flags par tier
- [ ] `TASK-010.10` - Limitation API (rate limiting par plan)

**Frontend**
- [ ] `TASK-010.11` - Page /pricing
- [ ] `TASK-010.12` - Flow de souscription
- [ ] `TASK-010.13` - Dashboard abonnement utilisateur
- [ ] `TASK-010.14` - Paywalls sur fonctionnalités premium

**Legal**
- [ ] `TASK-010.15` - CGV (Conditions Générales de Vente)
- [ ] `TASK-010.16` - CGU (Conditions Générales d'Utilisation)
- [ ] `TASK-010.17` - Politique de remboursement
- [ ] `TASK-010.18` - RGPD compliance (données de paiement)

---

### 1️⃣1️⃣ SECURITY & QUALITY

**Epic:** `EPIC-011-Security-Quality`

#### Objectifs
- TypeScript strict mode activé partout
- CodeQL activé en CI
- ESLint strict
- 100% test coverage sur logique métier critique
- Aucun warning de sécurité
- Validation input partout

#### Tâches principales

**TypeScript**
- [ ] `TASK-011.1` - Activer strict mode dans tsconfig.json
- [ ] `TASK-011.2` - Typage complet de tous les modules
- [ ] `TASK-011.3` - Éliminer tous les `any`
- [ ] `TASK-011.4` - Créer types réutilisables (src/types/)

**Security**
- [ ] `TASK-011.5` - Configurer CodeQL (GitHub Actions)
- [ ] `TASK-011.6` - Scan dépendances (npm audit, Snyk)
- [ ] `TASK-011.7` - Validation input backend (Joi/Zod)
- [ ] `TASK-011.8` - Sanitization XSS (DOMPurify)
- [ ] `TASK-011.9` - Rate limiting API
- [ ] `TASK-011.10` - CORS configuration stricte
- [ ] `TASK-011.11` - CSP headers
- [ ] `TASK-011.12` - HTTPS only (HSTS)
- [ ] `TASK-011.13` - Secrets management (dotenv, Vault)

**Linting & Formatting**
- [ ] `TASK-011.14` - ESLint strict config
- [ ] `TASK-011.15` - Prettier config
- [ ] `TASK-011.16` - Pre-commit hooks (Husky)
- [ ] `TASK-011.17` - CI enforcement

**Testing**
- [ ] `TASK-011.18` - Vitest configuration
- [ ] `TASK-011.19` - 100% coverage sur validation (SIRET/SIREN/TVA)
- [ ] `TASK-011.20` - 100% coverage sur calculs prix
- [ ] `TASK-011.21` - 100% coverage sur alertes
- [ ] `TASK-011.22` - Tests E2E (Playwright)
- [ ] `TASK-011.23` - Tests de charge (k6)
- [ ] `TASK-011.24` - Coverage reporting (Codecov)

---

### 1️⃣2️⃣ CI/CD PIPELINE & DELIVERY

**Epic:** `EPIC-012-CICD`

#### Objectifs
- Pipeline CI/CD complet
- Déploiement automatique
- Documentation auto-générée
- Changelog automatique

#### Pipeline stages

**1. Lint & Format**
- ESLint
- Prettier check
- TypeScript check

**2. Tests**
- Unit tests
- Integration tests
- E2E tests
- Coverage threshold (80%)

**3. Security**
- CodeQL scan
- npm audit
- Snyk scan
- OWASP ZAP (si applicable)

**4. Build**
- Build frontend
- Build backend
- Vérification taille bundles

**5. Documentation**
- Generate API docs (TypeDoc)
- Generate OpenAPI spec
- Build Storybook
- Check broken links

**6. Deploy**
- Preview (PR)
- Staging (develop)
- Production (main)

#### Tâches principales

- [ ] `TASK-012.1` - GitHub Actions workflows
- [ ] `TASK-012.2` - Lint stage
- [ ] `TASK-012.3` - Test stage
- [ ] `TASK-012.4` - Security stage
- [ ] `TASK-012.5` - Build stage
- [ ] `TASK-012.6` - Docs generation
- [ ] `TASK-012.7` - Deploy preview (Vercel/Netlify)
- [ ] `TASK-012.8` - Deploy staging
- [ ] `TASK-012.9` - Deploy production
- [ ] `TASK-012.10` - Rollback strategy
- [ ] `TASK-012.11` - Changelog automation (conventional commits)
- [ ] `TASK-012.12` - Version bumping (semantic-release)

**Documentation requise**
- [ ] `TASK-012.13` - API Reference (auto-generated)
- [ ] `TASK-012.14` - Data Models documentation
- [ ] `TASK-012.15` - Security Summary
- [ ] `TASK-012.16` - Legal Disclaimers
- [ ] `TASK-012.17` - CHANGELOG.md
- [ ] `TASK-012.18` - CONTRIBUTING.md
- [ ] `TASK-012.19` - Architecture Decision Records (ADR)

---

## 📊 MÉTRIQUES DE SUCCÈS

### Techniques
- ✅ 0 vulnérabilités de sécurité
- ✅ 100% TypeScript strict
- ✅ 80%+ test coverage sur logique métier
- ✅ <3s temps de chargement initial
- ✅ WCAG 2.1 AA compliance
- ✅ SEO score >90 (Lighthouse)

### Business
- 🎯 1000 abonnés payants (année 1)
- 🎯 10 clients institutionnels (année 1)
- 🎯 50k visiteurs uniques/mois
- 🎯 NPS >50 (satisfaction utilisateur)

### Public Interest
- 📢 Couverture média (20+ articles)
- 📊 Rapports utilisés par associations (10+)
- 🏛️ Adoption collectivités (5+)
- 📈 Impact mesurable sur transparence des prix

---

## 🗓️ ROADMAP INDICATIVE

### Phase 1 : Fondations (T1 2025)
- Epic 001 : Company Registry
- Epic 002 : Store-Company Integration
- Epic 011 : Security & Quality (base)
- Epic 012 : CI/CD Pipeline

### Phase 2 : Transparence & Comparaison (T2 2025)
- Epic 003 : Company Profile Pages
- Epic 004 : Transparency System
- Epic 005 : Advanced Price Comparison
- Epic 009 : Design System (base)

### Phase 3 : Valeur Ajoutée (T3 2025)
- Epic 006 : Price Prediction Module
- Epic 007 : Smart Shopping List
- Epic 008 : Alert System
- Epic 009 : Design System (complet)

### Phase 4 : Monétisation (T4 2025)
- Epic 010 : Business Model
- Epic 012 : Documentation complète
- Go-to-Market institutionnel

---

## 🚨 RISQUES & MITIGATION

### Risques techniques
- **R1 :** Qualité données SIRET/SIREN
  - **Mitigation :** Validation stricte + sources multiples
- **R2 :** Performance avec gros volumes
  - **Mitigation :** Indexation DB + caching + pagination
- **R3 :** Complexité algorithmes optimisation
  - **Mitigation :** POC avant implémentation complète

### Risques business
- **R4 :** Adoption payante lente
  - **Mitigation :** Phase pilote avec early adopters
- **R5 :** Concurrence
  - **Mitigation :** Focus qualité/transparence/institutional trust
- **R6 :** Réglementation
  - **Mitigation :** Legal review + disclaimers clairs

### Risques organisationnels
- **R7 :** Scope creep
  - **Mitigation :** Priorisation stricte + revues bi-hebdo
- **R8 :** Dépendance personne clé
  - **Mitigation :** Documentation + knowledge sharing

---

## 📚 RÉFÉRENCES

### Standards & Compliance
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [RGPD](https://www.cnil.fr/fr/reglement-europeen-protection-donnees)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

### Technologies
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Best Practices](https://react.dev/)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)
- [Stripe Documentation](https://stripe.com/docs)

### Data Sources
- [API INSEE Sirene](https://api.insee.fr/catalogue/)
- [Data.gouv.fr](https://www.data.gouv.fr/)

---

## 👥 STAKEHOLDERS

- **Product Owner :** @teetee971
- **Tech Lead :** TBD
- **Security Lead :** TBD
- **UX Designer :** TBD
- **Legal Advisor :** TBD

---

## ✅ CRITÈRES DE COMPLÉTION

Cette Epic sera considérée comme **TERMINÉE** quand :

1. ✅ Tous les workstreams (Epic 001-012) sont marqués DONE
2. ✅ 100% des tests passent en CI
3. ✅ 0 vulnérabilités de sécurité
4. ✅ Documentation complète publiée
5. ✅ Démo fonctionnelle en production
6. ✅ 10+ utilisateurs pilote validés
7. ✅ Legal review complété
8. ✅ Go-to-Market plan activé

---

## 📝 NOTES

Cette transformation est **volontairement hors scope de la PR Module 5** (`#XXX`).

Le Module 5 (commit `43923bd`) constitue une **base technique validée** qui sera étendue dans Epic 006 (Price Prediction).

**Date de dernière mise à jour :** 2025-12-18  
**Version :** 1.0.0  
**Auteur :** GitHub Copilot Agent

---

**FIN DE L'ÉPOPÉE**
