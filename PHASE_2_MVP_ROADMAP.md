# Phase 2 - MVP Institutionnel - Roadmap Exécutable

**Date:** 18 décembre 2025  
**Objectif:** Transformer les spécifications Phase 1 en produit fonctionnel minimal viable (MVP)  
**Public cible:** Institutions et professionnels UNIQUEMENT (pas grand public)

---

## 🎯 Vision MVP Phase 2

**Produit minimum viable institutionnel permettant:**
- Consultation de prix réels historisés (DOM-ROM)
- Vérification d'entreprises via registre SIREN/SIRET
- Méthodologie cosmétique juridiquement opposable
- Interface admin pour validation données

**NON inclus dans MVP:**
- Marketplace enseignes
- Paiements en ligne
- Application mobile native
- IA prédictive avancée
- API publique grand public

---

## 📊 Découpage en Issues GitHub Prioritaires

### **LOT 1 - FONDATIONS DONNÉES** (Sprint 1-2, 3-4 semaines)

#### Issue #1: Base de données PostgreSQL - Schéma produits
**Priorité:** P0 (Bloquant)  
**Effort:** 40h  
**Dépendances:** Aucune

**Description:**
Créer le schéma PostgreSQL pour la table `products` avec:
- EAN13 (clé primaire)
- Nom, marque, fabricant
- Catégorie, sous-catégorie
- Source (OpenFoodFacts, manuel, API)
- Timestamp création/mise à jour

**Critères d'acceptation:**
- [ ] Schéma SQL validé et déployé
- [ ] Indexes optimisés (EAN13, catégorie)
- [ ] Contraintes d'intégrité en place
- [ ] Documentation schéma complète
- [ ] 10+ produits de test insérés

**Stack:** PostgreSQL 15+, migrations SQL

---

#### Issue #2: Base de données - Historisation des prix
**Priorité:** P0 (Bloquant)  
**Effort:** 32h  
**Dépendances:** Issue #1

**Description:**
Table `price_history` avec:
- ID unique
- EAN13 produit (FK)
- Prix (centimes)
- Magasin (nom, localisation)
- Territoire DOM-ROM
- Source (OPMR, manuel, scraping autorisé)
- Timestamp

**Critères d'acceptation:**
- [ ] Table créée avec partitionnement par date
- [ ] Fonction d'insertion optimisée
- [ ] Requête historique performante (<100ms pour 1 an de données)
- [ ] 1000+ entrées de test sur 3 territoires minimum
- [ ] Politique de rétention définie (5 ans minimum)

**Stack:** PostgreSQL Time-Series, partitionnement

---

#### Issue #3: Registre entreprises - Intégration API SIREN INSEE
**Priorité:** P0 (Bloquant)  
**Effort:** 48h  
**Dépendances:** Aucune

**Description:**
Intégrer l'API SIREN INSEE officielle pour:
- Recherche par SIREN, SIRET
- Récupération statut (ACTIVE/CEASED)
- Nom, adresse, date création
- Mise en cache locale

**Critères d'acceptation:**
- [ ] Authentification API INSEE fonctionnelle
- [ ] Endpoint `/api/entreprises/search?siret=XXX`
- [ ] Cache Redis avec TTL 24h
- [ ] Rate limiting respecté (quota INSEE)
- [ ] 50+ entreprises DOM-ROM indexées
- [ ] Gestion erreurs et fallback

**Stack:** Node.js, API REST INSEE, Redis

---

#### Issue #4: Base de données - Table entreprises locales
**Priorité:** P1 (Important)  
**Effort:** 24h  
**Dépendances:** Issue #3

**Description:**
Table `companies` pour stockage local:
- SIREN, SIRET
- Nom commercial
- Statut activité
- Adresse complète
- Coordonnées GPS
- Territoire DOM-ROM
- Date dernière vérification

**Critères d'acceptation:**
- [ ] Schéma normalisé créé
- [ ] Index géospatial (PostGIS)
- [ ] Synchronisation API INSEE (batch quotidien)
- [ ] Validation automatique des doublons
- [ ] 200+ enseignes DOM-ROM référencées

**Stack:** PostgreSQL, PostGIS, cron jobs

---

### **LOT 2 - MÉTHODOLOGIE COSMÉTIQUE** (Sprint 2-3, 2-3 semaines)

#### Issue #5: Méthodologie cosmétique - Document juridique officiel
**Priorité:** P0 (Bloquant)  
**Effort:** 40h  
**Dépendances:** Aucune

**Description:**
Rédiger et publier méthodologie cosmétique conforme:
- Critères INCI pondérés (allergènes, perturbateurs endocriniens, CMR)
- Grille de notation 0-100
- Sources réglementaires (ANSM, ECHA, Commission Européenne)
- Mentions légales et responsabilité limitée
- Version PDF horodatée et signée

**Critères d'acceptation:**
- [ ] Document markdown + PDF généré
- [ ] Revue juridique externe (avocat spécialisé)
- [ ] Publication sur site institutionnel
- [ ] Versioning (v1.0) avec changelog
- [ ] Déclaration de non-responsabilité médicale claire

**Stack:** Markdown, Pandoc (PDF), revue légale

---

#### Issue #6: Base INCI - Import ingrédients cosmétiques
**Priorité:** P1 (Important)  
**Effort:** 32h  
**Dépendances:** Issue #5

**Description:**
Table `cosmetic_ingredients`:
- Nom INCI
- Catégorie (conservateur, parfum, etc.)
- Score risque (selon méthodologie)
- Réglementations (interdictions UE, restrictions)
- Sources (ECHA, CosIng)

**Critères d'acceptation:**
- [ ] Import 500+ ingrédients INCI courants
- [ ] Scoring automatisé selon méthodologie v1.0
- [ ] API `/api/cosmetics/ingredient/:inci`
- [ ] Documentation sources pour chaque ingrédient
- [ ] Tests de cohérence (pas de score sans source)

**Stack:** PostgreSQL, scripts import Python

---

#### Issue #7: Scanner cosmétique - Backend analyse composition
**Priorité:** P2 (Nice to have)  
**Effort:** 40h  
**Dépendances:** Issue #5, Issue #6

**Description:**
Endpoint pour analyser composition cosmétique:
- Input: liste ingrédients INCI
- Output: score global, détails ingrédients à risque
- Respect méthodologie v1.0

**Critères d'acceptation:**
- [ ] API `/api/cosmetics/analyze` (POST)
- [ ] Parsing INCI depuis texte libre
- [ ] Calcul score selon pondération officielle
- [ ] Réponse JSON structurée
- [ ] Logs audit (traçabilité scoring)

**Stack:** Node.js, NLP basique (tokenization)

---

### **LOT 3 - BACKEND API** (Sprint 3-4, 3-4 semaines)

#### Issue #8: API REST - Architecture et authentification
**Priorité:** P0 (Bloquant)  
**Effort:** 48h  
**Dépendances:** Issue #1, #2

**Description:**
Architecture backend API REST:
- Authentification JWT (institutions uniquement)
- Rate limiting (100 req/min)
- Logging requêtes
- Documentation OpenAPI

**Critères d'acceptation:**
- [ ] Serveur Node.js/Express opérationnel
- [ ] JWT avec expiration 24h
- [ ] Rôles: ADMIN, INSTITUTION, READ_ONLY
- [ ] Swagger UI accessible `/api/docs`
- [ ] Tests E2E authentification

**Stack:** Node.js, Express, JWT, Swagger

---

#### Issue #9: API - Endpoints prix historiques
**Priorité:** P0 (Bloquant)  
**Effort:** 40h  
**Dépendances:** Issue #2, Issue #8

**Description:**
Endpoints consultation prix:
- `GET /api/prices/product/:ean13`
- `GET /api/prices/history/:ean13?territory=GP&from=2025-01-01`
- `GET /api/prices/compare?ean13=XXX,YYY&territory=MQ`

**Critères d'acceptation:**
- [ ] Réponse JSON paginée (max 100 résultats)
- [ ] Filtres: territoire, période, magasin
- [ ] Cache Redis (5 min TTL)
- [ ] Performance <200ms (95e percentile)
- [ ] Documentation exemples curl

**Stack:** Node.js, PostgreSQL, Redis

---

#### Issue #10: API - Endpoints registre entreprises
**Priorité:** P1 (Important)  
**Effort:** 32h  
**Dépendances:** Issue #3, Issue #4, Issue #8

**Description:**
Endpoints entreprises:
- `GET /api/companies/search?siret=XXX`
- `GET /api/companies/territory/:code` (GP, MQ, etc.)
- `POST /api/companies/verify/:siret` (force sync INSEE)

**Critères d'acceptation:**
- [ ] Recherche SIREN/SIRET fonctionnelle
- [ ] Filtrage par territoire
- [ ] Vérification statut temps réel (cache 24h)
- [ ] Géolocalisation retournée (lat/lon)
- [ ] Limitation accès ADMIN/INSTITUTION

**Stack:** Node.js, PostgreSQL/PostGIS

---

### **LOT 4 - INTERFACE ADMIN** (Sprint 4-5, 2-3 semaines)

#### Issue #11: Dashboard admin - Gestion produits
**Priorité:** P1 (Important)  
**Effort:** 40h  
**Dépendances:** Issue #1, Issue #9

**Description:**
Interface admin React pour:
- Lister produits
- Ajouter/modifier produit (EAN13, nom, catégorie)
- Importer CSV produits
- Validation données

**Critères d'acceptation:**
- [ ] Authentification admin obligatoire
- [ ] CRUD produits complet
- [ ] Upload CSV (max 1000 lignes)
- [ ] Validation EAN13 (checksum)
- [ ] Logs modifications (audit trail)

**Stack:** React, Tailwind, React Query

---

#### Issue #12: Dashboard admin - Gestion prix
**Priorité:** P1 (Important)  
**Effort:** 40h  
**Dépendances:** Issue #2, Issue #9

**Description:**
Interface saisie prix:
- Formulaire ajout prix (EAN13, prix, magasin, territoire, source)
- Import CSV prix
- Validation cohérence (pas de prix négatif, source obligatoire)

**Critères d'acceptation:**
- [ ] Formulaire réactif avec validation
- [ ] Import batch CSV (max 5000 lignes)
- [ ] Détection anomalies (prix aberrant)
- [ ] Preview avant insertion
- [ ] Logs source et utilisateur

**Stack:** React, Zod validation, CSV parser

---

#### Issue #13: Dashboard admin - Monitoring système
**Priorité:** P2 (Nice to have)  
**Effort:** 24h  
**Dépendances:** Issue #8

**Description:**
Tableau de bord monitoring:
- Nombre produits, prix, entreprises
- API calls last 24h
- Santé base de données
- Alertes erreurs

**Critères d'acceptation:**
- [ ] Métriques temps réel (refresh 30s)
- [ ] Graphiques historiques (7 jours)
- [ ] Alertes email si erreur critique
- [ ] Export métriques CSV

**Stack:** React, Chart.js, Prometheus (optionnel)

---

### **LOT 5 - CONFORMITÉ & SÉCURITÉ** (Sprint 5-6, 2 semaines)

#### Issue #14: RGPD - Politique de confidentialité et CGU
**Priorité:** P0 (Bloquant - légal)  
**Effort:** 24h  
**Dépendances:** Aucune

**Description:**
Rédiger et publier:
- Politique de confidentialité conforme RGPD
- Conditions Générales d'Utilisation (institutions)
- Mentions légales
- Cookies et traçabilité

**Critères d'acceptation:**
- [ ] Documents rédigés par juriste
- [ ] Bannière cookies conforme
- [ ] Opt-in analytics (pas de tracker avant consentement)
- [ ] Page `/legal` accessible
- [ ] DPO désigné (ou équivalent)

**Stack:** Markdown, revue légale

---

#### Issue #15: Sécurité - Audit et tests pénétration
**Priorité:** P0 (Bloquant - sécurité)  
**Effort:** 32h  
**Dépendances:** Issue #8, #9, #10

**Description:**
Audit sécurité API:
- Tests injection SQL
- Tests XSS/CSRF
- Rate limiting effectif
- Secrets management
- HTTPS obligatoire

**Critères d'acceptation:**
- [ ] Scan OWASP ZAP sans critical
- [ ] npm audit 0 high/critical
- [ ] Secrets dans variables environnement (pas en code)
- [ ] CORS configuré (whitelist domaines)
- [ ] Rapport audit PDF

**Stack:** OWASP ZAP, npm audit, tests manuels

---

#### Issue #16: Infrastructure - Déploiement production
**Priorité:** P0 (Bloquant)  
**Effort:** 40h  
**Dépendances:** Toutes issues précédentes

**Description:**
Déploiement infrastructure production:
- PostgreSQL managé (Cloud SQL / RDS)
- Redis managé
- Backend Node.js (Cloud Run / ECS)
- Frontend React (Cloudflare Pages - déjà OK)
- CI/CD automatisé

**Critères d'acceptation:**
- [ ] Base de données production avec backups quotidiens
- [ ] Auto-scaling backend configuré
- [ ] Monitoring (uptime, erreurs)
- [ ] Rollback 1-click possible
- [ ] Documentation runbook

**Stack:** GCP/AWS, Terraform (IaC), GitHub Actions

---

## 📅 Planning MVP Phase 2

### Timeline Réaliste

| Sprint | Semaines | Focus | Issues |
|--------|----------|-------|--------|
| **Sprint 1** | S1-S2 | Fondations DB | #1, #2, #3 |
| **Sprint 2** | S3-S4 | Registre + Méthodologie | #4, #5, #6 |
| **Sprint 3** | S5-S7 | Backend API | #8, #9, #10 |
| **Sprint 4** | S8-S10 | Interface Admin | #11, #12, #13 |
| **Sprint 5** | S11-S12 | Conformité | #14, #15 |
| **Sprint 6** | S13-S14 | Déploiement | #16 |

**Durée totale:** 14 semaines (3.5 mois)  
**Effort total estimé:** 560 heures  
**Équipe recommandée:** 2 devs fullstack + 1 juriste (conseil)

---

## 🎯 Définition MVP Institutionnel (Minimal Viable Product)

### ✅ Ce que contient le MVP

**Fonctionnalités opérationnelles:**
1. Base de données produits + prix historisés (min 500 produits, 3 territoires DOM-ROM)
2. Registre entreprises SIREN/SIRET (min 200 enseignes)
3. Méthodologie cosmétique publiée et opposable (v1.0)
4. API REST sécurisée (JWT, rate limiting)
5. Dashboard admin pour gestion données
6. Documentation API complète (Swagger)
7. RGPD conforme
8. Infrastructure production stable

**Public cible:**
- Institutions gouvernementales (DGCCRF, INSEE)
- Observatoires prix (OPMR)
- Chercheurs académiques
- Associations consommateurs agréées

**Accès:**
- Sur demande motivée uniquement
- Compte nominatif avec traçabilité
- Pas d'accès public grand public

---

### ❌ Hors scope MVP (Phase 3+)

- Marketplace enseignes payante
- Paiements en ligne / abonnements
- Application mobile native
- Scanner OCR tickets automatique
- IA prédictive avancée
- API publique grand public
- Alertes prix personnalisées utilisateurs
- Gamification / programme fidélité

---

## 🔐 Contraintes Critiques

### Données réelles uniquement

**Sources autorisées:**
- OpenFoodFacts (API publique)
- API SIREN INSEE (officielle)
- OPMR (partenariat institutionnel requis)
- Saisie manuelle admin avec source documentée

**Interdit:**
- Web scraping sites marchands (légalement risqué)
- Données simulées/fictives
- Prix sans source traçable
- Entreprises non vérifiées SIREN

---

### Juridique

**Obligations:**
- Méthodologie cosmétique revue par avocat spécialisé
- Disclaimer médical (ne remplace pas avis médecin)
- RGPD strict (consentement, droit à l'oubli)
- CGU institutions claires
- Responsabilité limitée (données à titre informatif)

---

### Communication

**Avant validation MVP:**
- ❌ Aucune communication publique
- ❌ Aucun tweet/post réseaux sociaux
- ❌ Aucune promesse fonctionnalités futures

**Après validation MVP:**
- ✅ Communication institutionnelle ciblée
- ✅ Présentation institutionnelle (powerpoint)
- ✅ Documentation API publique (lecture seule)

---

## 📊 Estimation Globale

### Coûts estimés

| Poste | Détail | Coût mensuel |
|-------|--------|--------------|
| **Développement** | 2 devs fullstack (560h / 3.5 mois) | Variable selon profils |
| **Juridique** | Revue méthodologie + RGPD | 2 000 - 5 000 € |
| **Infrastructure** | DB + Redis + Backend (prod) | 300 - 500 € / mois |
| **APIs tierces** | INSEE (gratuit), OpenFoodFacts (gratuit) | 0 € |
| **Total 3.5 mois** | Hors salaires dev | 3 000 - 7 000 € |

---

### Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Accès API INSEE limité | Moyen | Élevé | Cache agressif, quota monitoring |
| Données OPMR indisponibles | Élevé | Élevé | Saisie manuelle admin en fallback |
| Revue juridique longue | Moyen | Moyen | Anticiper, budget externe |
| Scope creep (demandes nouvelles fonctionnalités) | Élevé | Élevé | **Refus strict hors MVP** |

---

## 🚀 Prochaines Étapes Immédiates

### Semaine 1 (S1)

**Tâches critiques:**
1. ✅ Valider ce document PHASE_2_MVP_ROADMAP.md
2. ⏭️ Créer 16 issues GitHub à partir de ce document
3. ⏭️ Configurer project board GitHub (Kanban)
4. ⏭️ Provisionner infrastructure dev (PostgreSQL, Redis)
5. ⏭️ Commencer Issue #1 (Schéma produits)

**Décisions requises:**
- [ ] Choix cloud provider (GCP vs AWS vs autre)
- [ ] Budget juridique validé
- [ ] Équipe dev assignée
- [ ] Point contact OPMR/DGCCRF identifié

---

## 📝 Notes Importantes

**Ce MVP n'est PAS un produit grand public.**

C'est une **plateforme institutionnelle** prouvant:
- La faisabilité technique
- La conformité juridique
- La qualité des données
- La capacité à évoluer

**Après succès MVP**, décision sur Phase 3:
- Ouverture grand public progressive
- Monétisation (abonnements, API payante)
- Extension géographique
- Features avancées (IA, mobile)

---

**Version:** 1.0  
**Date:** 18 décembre 2025  
**Auteur:** Copilot Coding Agent  
**Statut:** ✅ Prêt pour validation et exécution
