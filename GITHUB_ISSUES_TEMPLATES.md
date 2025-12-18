# GitHub Issues Templates - MVP Institutionnel Phase 1

Ce document contient les 16 issues GitHub prêtes à copier-coller pour le projet A KI PRI SA YÉ.

**Milestone:** MVP Institutionnel - Phase 1  
**Total effort:** 560 heures  
**Durée:** 14 semaines (3.5 mois)

---

## LOT 1 - FONDATIONS DONNÉES (144h)

### Issue #1 - Modèle Produits & EAN13

**Labels:** `P0-BLOQUANT` `data` `backend`

**Description:**

Créer le schéma PostgreSQL pour la table `products` avec modèle normalisé incluant:
- EAN13 (clé primaire unique)
- Nom produit, marque, fabricant
- Catégories (hiérarchie standardisée)
- Lien OpenFoodFacts (si existant)
- Timestamps création/modification

Le modèle doit garantir l'unicité des produits et permettre la traçabilité.

**Critères d'acceptation:**
- [ ] Table `products` créée avec contraintes d'unicité sur EAN13
- [ ] Catégories organisées en hiérarchie (rayon → sous-catégorie → produit)
- [ ] Index optimisés pour recherches par nom, marque, catégorie
- [ ] Documentation du schéma avec exemples
- [ ] Migration SQL testée sur environnement dev
- [ ] Tests unitaires pour validations EAN13

**Estimation:**
⏱️ 40 heures

**Dépendances:**
- Aucune (issue fondatrice)
- Bloque: #2, #4, #9, #11

**Milestone:**
MVP Institutionnel - Phase 1

---

### Issue #2 - Historisation des Prix

**Labels:** `P0-BLOQUANT` `data` `backend`

**Description:**

Créer le système d'historisation des prix avec table `price_history`:
- Horodatage précis (timezone UTC)
- Référence produit (EAN13)
- Prix constaté
- Source de données (OPMR, enseigne, manuel)
- Magasin/enseigne
- Territoire (DOM-ROM)

Architecture append-only (aucune suppression, seulement ajout).

**Critères d'acceptation:**
- [ ] Table `price_history` avec index temporels
- [ ] Contrainte append-only (pas de UPDATE/DELETE)
- [ ] Fonction SQL pour récupérer dernier prix connu
- [ ] Fonction SQL pour historique complet d'un produit
- [ ] Agrégations pré-calculées (prix min/max/moyen par période)
- [ ] Tests de performance (1M+ enregistrements)

**Estimation:**
⏱️ 32 heures

**Dépendances:**
- Dépend de: #1 (table products)
- Bloque: #9, #12

**Milestone:**
MVP Institutionnel - Phase 1

---

### Issue #3 - Registre Entreprises SIREN/SIRET

**Labels:** `P0-BLOQUANT` `data` `legal` `backend`

**Description:**

Intégrer l'API SIREN INSEE pour créer le registre officiel des entreprises:
- Requêtes vers API Sirene v3 (data.gouv.fr)
- Table `companies` avec SIREN/SIRET, raison sociale
- Statut juridique (ACTIVE / CEASED)
- Adresse siège social
- Géolocalisation (lat/lon)
- Date de création

Cache local avec refresh périodique.

**Critères d'acceptation:**
- [ ] Intégration API Sirene v3 fonctionnelle
- [ ] Table `companies` avec données normalisées INSEE
- [ ] Script de synchronisation quotidienne
- [ ] Gestion des erreurs API (rate limiting, timeouts)
- [ ] Validation SIREN/SIRET (algorithme Luhn)
- [ ] Logs d'audit pour traçabilité RGPD

**Estimation:**
⏱️ 48 heures

**Dépendances:**
- Aucune (données externes)
- Bloque: #4, #10

**Milestone:**
MVP Institutionnel - Phase 1

---

### Issue #4 - Relations Produits ↔ Enseignes

**Labels:** `P1-IMPORTANT` `data` `backend`

**Description:**

Créer les tables de liaison pour relier:
- Produits disponibles dans quelles enseignes
- Enseignes présentes dans quels territoires
- Table `product_availability` (produit, enseigne, territoire, disponible)

Permet la comparaison multi-enseignes et multi-territoires.

**Critères d'acceptation:**
- [ ] Table `product_availability` créée
- [ ] Table `store_locations` (enseignes par territoire)
- [ ] Fonctions SQL pour requêtes croisées
- [ ] Index optimisés pour filtrage géographique
- [ ] Documentation des relations
- [ ] Tests de cohérence référentielle

**Estimation:**
⏱️ 24 heures

**Dépendances:**
- Dépend de: #1 (products), #3 (companies)
- Bloque: #9, #11

**Milestone:**
MVP Institutionnel - Phase 1

---

## LOT 2 - MÉTHODOLOGIE COSMÉTIQUE (112h)

### Issue #5 - Critères INCI Pondérés

**Labels:** `P0-BLOQUANT` `legal` `data`

**Description:**

Rédiger le document officiel de méthodologie cosmétique définissant:
- Liste des critères INCI évalués
- Pondération scientifique de chaque critère
- Sources réglementaires (ANSM, Commission Européenne)
- Grille de risque (faible, modéré, élevé)
- Justification scientifique

Document juridiquement opposable, validé par conseil juridique.

**Critères d'acceptation:**
- [ ] Document PDF/Markdown avec méthodologie complète
- [ ] Tableau de pondération avec justifications
- [ ] Références réglementaires citées (ANSM, CE)
- [ ] Revue par avocat spécialisé
- [ ] Publication sur site institutionnel
- [ ] Version horodatée et archivée

**Estimation:**
⏱️ 40 heures (incluant revue juridique)

**Dépendances:**
- Aucune (travail de rédaction)
- Bloque: #6, #7

**Milestone:**
MVP Institutionnel - Phase 1

---

### Issue #6 - Grille Notation Opposable

**Labels:** `P0-BLOQUANT` `legal` `backend`

**Description:**

Implémenter la grille de notation cosmétique basée sur #5:
- Algorithme de calcul du score
- Explications détaillées pour chaque note
- Aucun jugement marketing (seulement faits)
- Traçabilité des calculs

**Critères d'acceptation:**
- [ ] Fonction SQL/backend pour calcul score
- [ ] Tests unitaires avec cas d'usage réels
- [ ] Documentation de l'algorithme
- [ ] API retournant note + détails justificatifs
- [ ] Logs d'audit des calculs
- [ ] Validation juridique du rendu

**Estimation:**
⏱️ 32 heures

**Dépendances:**
- Dépend de: #5 (méthodologie)
- Bloque: #7, #8

**Milestone:**
MVP Institutionnel - Phase 1

---

### Issue #7 - Sources Réglementaires Officielles

**Labels:** `P2-OPTIONNEL` `legal` `data`

**Description:**

Créer une base documentaire des sources réglementaires:
- ANSM (Agence Nationale Sécurité Médicament)
- Commission Européenne
- INCI Database officielle
- Publications scientifiques

Base de référence pour méthodologie.

**Critères d'acceptation:**
- [ ] Table `regulatory_sources` avec liens officiels
- [ ] Système de veille réglementaire
- [ ] Archivage des versions de documents
- [ ] Interface admin pour mise à jour
- [ ] Notifications changements réglementaires

**Estimation:**
⏱️ 40 heures

**Dépendances:**
- Dépend de: #5, #6
- Bloque: Aucune

**Milestone:**
MVP Institutionnel - Phase 1

---

## LOT 3 - BACKEND API (120h)

### Issue #8 - Architecture Backend + JWT Auth

**Labels:** `P0-BLOQUANT` `backend` `security`

**Description:**

Créer l'architecture backend Node.js/Express avec:
- Authentification JWT (tokens accès + refresh)
- Rate limiting par IP/utilisateur
- Logging centralisé (Winston/Pino)
- Validation des requêtes (Joi/Zod)
- Gestion erreurs normalisée
- CORS sécurisé

**Critères d'acceptation:**
- [ ] API REST fonctionnelle avec Express
- [ ] Authentification JWT implémentée
- [ ] Middleware rate limiting (100 req/min)
- [ ] Logs structurés avec Winston
- [ ] Documentation Swagger/OpenAPI
- [ ] Tests d'intégration (Jest/Supertest)

**Estimation:**
⏱️ 48 heures

**Dépendances:**
- Dépend de: #1, #2, #3 (schéma DB)
- Bloque: #9, #10

**Milestone:**
MVP Institutionnel - Phase 1

---

### Issue #9 - Endpoints Prix Historiques

**Labels:** `P1-IMPORTANT` `backend` `data`

**Description:**

Créer les endpoints API pour:
- `GET /api/prices/history/:ean13` - Historique complet produit
- `GET /api/prices/current/:ean13` - Prix actuel par territoire
- `GET /api/prices/compare` - Comparaison multi-enseignes
- `POST /api/prices` - Ajout nouveau prix (admin)

Avec pagination, filtres, exports CSV.

**Critères d'acceptation:**
- [ ] 4 endpoints REST documentés
- [ ] Pagination (limit/offset)
- [ ] Filtres (territoire, enseigne, période)
- [ ] Export CSV/JSON
- [ ] Cache Redis pour requêtes fréquentes
- [ ] Tests unitaires + intégration

**Estimation:**
⏱️ 40 heures

**Dépendances:**
- Dépend de: #2 (price_history), #8 (backend)
- Bloque: #12

**Milestone:**
MVP Institutionnel - Phase 1

---

### Issue #10 - Endpoints Registre Entreprises

**Labels:** `P1-IMPORTANT` `backend` `legal`

**Description:**

Créer les endpoints pour registre entreprises:
- `GET /api/companies/:siren` - Détails entreprise
- `GET /api/companies/search` - Recherche par nom/SIRET
- `GET /api/companies/territory/:code` - Entreprises par territoire
- `POST /api/companies/sync` - Sync manuelle avec INSEE (admin)

**Critères d'acceptation:**
- [ ] 4 endpoints REST documentés
- [ ] Recherche full-text sur raison sociale
- [ ] Filtrage par statut (ACTIVE/CEASED)
- [ ] Cache avec TTL 24h
- [ ] Logs conformes RGPD
- [ ] Tests avec données INSEE réelles

**Estimation:**
⏱️ 32 heures

**Dépendances:**
- Dépend de: #3 (companies), #8 (backend)
- Bloque: Aucune

**Milestone:**
MVP Institutionnel - Phase 1

---

## LOT 4 - INTERFACE ADMIN (104h)

### Issue #11 - Dashboard Gestion Produits

**Labels:** `P1-IMPORTANT` `admin` `frontend`

**Description:**

Créer l'interface admin React pour gestion produits:
- Liste produits avec recherche/filtres
- Formulaire ajout/édition produit
- Import CSV massif
- Validation EAN13
- Prévisualisation données OpenFoodFacts

**Critères d'acceptation:**
- [ ] Interface React avec TanStack Table
- [ ] Formulaire avec validation Zod
- [ ] Import CSV (jusqu'à 10 000 produits)
- [ ] Recherche temps réel
- [ ] Export CSV des produits
- [ ] Tests Cypress E2E

**Estimation:**
⏱️ 40 heures

**Dépendances:**
- Dépend de: #1 (products), #8 (backend)
- Bloque: Aucune

**Milestone:**
MVP Institutionnel - Phase 1

---

### Issue #12 - Dashboard Gestion Prix

**Labels:** `P1-IMPORTANT` `admin` `frontend`

**Description:**

Créer l'interface admin pour gestion prix:
- Historique prix par produit (graphiques)
- Saisie manuelle nouveau prix
- Import CSV prix (territoire, enseigne, date)
- Détection anomalies (variations >50%)
- Validation avant enregistrement

**Critères d'acceptation:**
- [ ] Interface React avec graphiques (Chart.js/Recharts)
- [ ] Formulaire saisie prix avec validation
- [ ] Import CSV avec preview
- [ ] Alertes anomalies visuelles
- [ ] Logs d'audit modifications
- [ ] Tests Cypress

**Estimation:**
⏱️ 40 heures

**Dépendances:**
- Dépend de: #2 (price_history), #9 (API), #8 (backend)
- Bloque: Aucune

**Milestone:**
MVP Institutionnel - Phase 1

---

### Issue #13 - Monitoring Système

**Labels:** `P2-OPTIONNEL` `admin` `backend` `security`

**Description:**

Créer dashboard monitoring temps réel:
- Métriques API (requêtes/sec, latence)
- Santé base données (connexions, slow queries)
- Erreurs serveur (logs temps réel)
- Alertes (Slack/email)

**Critères d'acceptation:**
- [ ] Dashboard avec graphiques temps réel
- [ ] Intégration Prometheus + Grafana (ou équivalent)
- [ ] Alertes configurables
- [ ] Logs centralisés consultables
- [ ] Métriques business (nb produits, prix/jour)

**Estimation:**
⏱️ 24 heures

**Dépendances:**
- Dépend de: #8 (backend)
- Bloque: Aucune

**Milestone:**
MVP Institutionnel - Phase 1

---

## LOT 5 - CONFORMITÉ & SÉCURITÉ (80h)

### Issue #14 - RGPD + CGU

**Labels:** `P0-BLOQUANT` `legal` `security`

**Description:**

Rédiger et implémenter:
- Politique de confidentialité (RGPD)
- Conditions Générales d'Utilisation
- Mentions légales
- Bannière cookies conforme
- Formulaire exercice droits RGPD

**Critères d'acceptation:**
- [ ] Documents juridiques validés par avocat
- [ ] Bannière cookies conforme CNIL
- [ ] Formulaire RGPD (accès, rectification, suppression)
- [ ] Logs RGPD (consentements, demandes)
- [ ] Pages légales sur site
- [ ] DPO contactable

**Estimation:**
⏱️ 24 heures (incluant revue juridique)

**Dépendances:**
- Dépend de: #8 (backend pour formulaires)
- Bloque: #16 (déploiement)

**Milestone:**
MVP Institutionnel - Phase 1

---

### Issue #15 - Audit Sécurité

**Labels:** `P0-BLOQUANT` `security` `backend`

**Description:**

Effectuer audit de sécurité complet:
- Scan vulnérabilités (npm audit, Snyk)
- Tests pénétration (OWASP Top 10)
- Revue configuration serveur
- SSL/TLS configuration
- Headers sécurité (CSP, HSTS)
- Protection CSRF

**Critères d'acceptation:**
- [ ] Rapport audit avec 0 vulnérabilité critique
- [ ] Corrections appliquées
- [ ] Headers sécurité configurés
- [ ] Rate limiting testé
- [ ] Injection SQL impossible (requêtes préparées)
- [ ] Validation certificat SSL A+ (SSLLabs)

**Estimation:**
⏱️ 32 heures

**Dépendances:**
- Dépend de: #8, #9, #10 (backend complet)
- Bloque: #16 (déploiement)

**Milestone:**
MVP Institutionnel - Phase 1

---

### Issue #16 - Déploiement Production

**Labels:** `P0-BLOQUANT` `backend` `security`

**Description:**

Déployer l'application en production:
- Configuration environnement production
- Base de données PostgreSQL managée
- Cloudflare Workers/Pages optimisés
- Backups automatiques quotidiens
- Monitoring uptime
- Plan de rollback

**Critères d'acceptation:**
- [ ] Application accessible en production
- [ ] Certificat SSL actif
- [ ] Backups DB quotidiens testés
- [ ] Monitoring uptime configuré (UptimeRobot)
- [ ] Documentation procédure déploiement
- [ ] Runbook incidents

**Estimation:**
⏱️ 40 heures

**Dépendances:**
- Dépend de: #14 (RGPD), #15 (sécurité), tous les autres
- Bloque: Aucune (issue finale)

**Milestone:**
MVP Institutionnel - Phase 1

---

## RÉCAPITULATIF

### Priorités

**P0-BLOQUANT (10 issues):**
#1, #2, #3, #5, #6, #8, #14, #15, #16

**P1-IMPORTANT (4 issues):**
#4, #9, #10, #11, #12

**P2-OPTIONNEL (2 issues):**
#7, #13

### Estimation Totale

**560 heures** réparties sur **14 semaines** (3.5 mois)

### Équipe Recommandée

- 2 développeurs fullstack
- 1 consultant juridique (revue documents)
- 1 auditeur sécurité (externe)

### Budget (hors salaires dev)

**3 000 - 7 000 €** incluant:
- Conseil juridique: 2 000 - 5 000 €
- Infrastructure production: 300 - 500 €/mois
- Audit sécurité: 500 - 1 500 €

---

## INSTRUCTIONS DE CRÉATION

### 1. Créer le Milestone

Dans GitHub → Issues → Milestones → New Milestone:
- **Titre:** MVP Institutionnel - Phase 1
- **Description:** Première phase du MVP avec données réelles et conformité juridique
- **Date limite:** +14 semaines

### 2. Créer les Labels

Dans GitHub → Issues → Labels:
- `P0-BLOQUANT` (rouge)
- `P1-IMPORTANT` (orange)
- `P2-OPTIONNEL` (jaune)
- `data` (bleu)
- `legal` (violet)
- `backend` (vert)
- `admin` (cyan)
- `security` (rouge foncé)
- `frontend` (rose)

### 3. Créer les Issues

Pour chaque issue ci-dessus:
1. Copier le contenu (Titre + Description + Critères + Estimation + Dépendances)
2. GitHub → New Issue
3. Coller le contenu
4. Ajouter les labels manuels
5. Assigner au Milestone "MVP Institutionnel - Phase 1"

### 4. Configurer Project Board

GitHub → Projects → New Project → Board:
- Colonnes: Backlog, Sprint, In Progress, Review, Done
- Lier les 16 issues au board

---

**LE PLAN EST MAINTENANT EXÉCUTABLE. TOUS LES TEMPLATES SONT PRÊTS À COPIER-COLLER.**
