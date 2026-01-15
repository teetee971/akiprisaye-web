# 🏛️ GOUVERNANCE, ÉTHIQUE & CONTRÔLE EXTERNE

**A KI PRI SA YÉ - Observatoire Public des Prix**  
**Document Officiel de Gouvernance**  
**Version 1.0 - Janvier 2026**

---

## 📌 Principe Fondamental

> **La plateforme n'est jamais juge et partie.**

Tout ce qui influence la méthodologie, les classements, les alertes et les indicateurs publics doit être auditable, documenté et contestable.

**Règle d'or :**  
A KI PRI SA YÉ ne décide pas seul. Les décisions structurantes sont prises collégialement, tracées publiquement, et peuvent être remises en question.

---

## 1️⃣ COMITÉ DE GOUVERNANCE

### 1.1 Composition Minimale (5-7 personnes)

**Membres obligatoires :**
1. **Représentant citoyen** - Utilisateur actif, porteur de la voix des consommateurs
2. **Profil data/statistique** - Expert méthodologie quantitative, garant de la rigueur scientifique
3. **Juriste/conformité** - Spécialiste RGPD, droit de la consommation, neutralité
4. **Acteur associatif** - Organisation de défense des consommateurs ou d'intérêt général
5. **Observateur institutionnel** - Collectivité ou service de l'État (rôle consultatif, sans pouvoir de veto)

**Membres optionnels (selon évolution) :**
- Chercheur en économie territoriale
- Expert open-data
- Représentant médias/transparence

### 1.2 Interdictions Strictes

❌ **Aucun sponsor commercial direct**  
❌ **Aucun conflit d'intérêt distributeur**  
❌ **Aucun membre ayant intérêt financier dans enseignes surveillées**  
❌ **Aucun pouvoir décisionnaire unilatéral**

### 1.3 Fonctionnement

**Fréquence :** Réunions trimestrielles minimales  
**Convocation :** Transparente, agenda public  
**Décisions :** Prises par consensus ou majorité simple (3/5 minimum)  
**Compte-rendu :** Publié sous 15 jours (données personnelles anonymisées)

**Rôles :**
- Valider modifications méthodologiques majeures
- Approuver évolutions critères classements
- Arbitrer contestations utilisateurs
- Valider partenariats structurants
- Superviser respect charte éthique

---

## 2️⃣ CHARTE ÉTHIQUE PUBLIQUE

### 2.1 Principes Non Négociables

#### **Neutralité Politique**
- Aucune affiliation partisane
- Aucun positionnement idéologique dans la présentation des données
- Observation factuelle sans interprétation orientée
- Refus de toute instrumentalisation électorale

#### **Non-Commercialisation des Données Citoyennes**
- Aucune vente de données personnelles ou agrégées à des tiers
- Aucune monétisation via publicité ciblée
- Aucun partenariat rémunéré avec distributeurs surveillés
- Données collectives accessibles en open-data

#### **Transparence des Méthodes**
- Publication intégrale des algorithmes de calcul
- Documentation des sources de données
- Versioning public de toute modification méthodologique
- Code source ouvert (GitHub public)

#### **Droit de Contestation**
- Tout utilisateur peut contester un classement
- Procédure de signalement accessible (formulaire dédié)
- Réponse motivée sous 30 jours
- Possibilité de recours auprès du Comité de gouvernance

#### **Refus de Pression Commerciale**
- Aucune modification de méthodologie sur demande d'enseigne
- Aucune suppression de données observées sous pression
- Historique des tentatives d'influence conservé (anonymisé)
- Indépendance financière préservée

### 2.2 Page Charte Éthique (URL dédiée)

**Emplacement obligatoire :** `/charte-ethique`  
**Accessibilité :** Lien visible dans footer et page À Propos  
**Contenu :** Version intégrale de cette section, mise à jour publique

---

## 3️⃣ JOURNAL DE DÉCISIONS (Decision Log)

### 3.1 Principe

Chaque décision structurante impactant la méthodologie, les classements ou les seuils d'alerte est enregistrée publiquement dans un journal immuable.

### 3.2 Déclencheurs d'Enregistrement

**Décisions à journaliser obligatoirement :**
- Modification algorithme de calcul prix moyen/médiane
- Changement seuil anomalie territoriale (ex: 2σ → 1.8σ)
- Ajout/suppression critère classement "Anti-Crise"
- Évolution méthodologique collecte données
- Modification règles éligibilité labels
- Changement fréquence mise à jour données
- Partenariat structurant avec institution/distributeur

**Exclusions (non journalisées) :**
- Corrections bugs techniques
- Améliorations UX/UI sans impact méthodologique
- Mises à jour données routinières

### 3.3 Format JSON du Journal

```json
{
  "decision_id": "2026-01-ALGO-04",
  "date": "2026-01-15T10:30:00Z",
  "subject": "Seuil anomalie territoriale inflation",
  "category": "methodologie",
  "change": {
    "before": "Écart-type 2σ (95%)",
    "after": "Écart-type 1.8σ (93%)",
    "reason": "Données DOM peu denses, seuil 2σ masque anomalies réelles"
  },
  "impact_estimated": {
    "territories_affected": ["Guadeloupe", "Martinique"],
    "alerts_increase_percent": 12
  },
  "validated_by": ["data_expert", "juridique", "citoyen_rep"],
  "vote": "5/5 consensus",
  "effective_date": "2026-02-01",
  "reversible": true,
  "documentation_url": "/methodologie/v2.1/seuils-anomalies"
}
```

### 3.4 Stockage et Accès

**Stockage :** Firebase Firestore collection `decision_log` (immuable, append-only)  
**Accès public :** Page `/journal-decisions` (tableau filtrable par date, catégorie, sujet)  
**Export :** CSV/JSON téléchargeable  
**Rétention :** Illimitée (archives historiques conservées)

---

## 4️⃣ MÉTHODOLOGIE VERSIONNÉE

### 4.1 Principe de Versioning Sémantique

**Format :** `vMAJOR.MINOR.PATCH` (ex: v2.3.1)

- **MAJOR** : Changement méthodologique structurant (ex: nouvelle formule inflation)
- **MINOR** : Ajout critère ou amélioration sans rupture (ex: nouveau seuil alerte)
- **PATCH** : Correction bug ou clarification documentation

### 4.2 Règles Strictes

**Interdictions :**
- ❌ Modifier méthodologie sans créer nouvelle version
- ❌ Appliquer changement rétroactivement sans mention explicite
- ❌ Supprimer anciennes versions de documentation

**Obligations :**
- ✅ Changelog public détaillé pour chaque version
- ✅ Migration transparente avec période de coexistence (1 mois minimum)
- ✅ Archive accessible de toutes versions méthodologiques
- ✅ Notification utilisateurs avant changement majeur

### 4.3 Documentation Versionnée

**Emplacement :** `/methodologie/vX.Y/` (ex: `/methodologie/v2.3/`)  
**Contenu obligatoire :**
- Formules de calcul
- Seuils d'alerte
- Critères classements
- Sources de données
- Fréquence mise à jour
- Limites connues
- Changelog depuis version précédente

---

## 5️⃣ PROCÉDURE DE CONTESTATION PUBLIQUE

### 5.1 Formulaire de Contestation

**URL accessible :** `/contester-donnee`  
**Champs obligatoires :**
- Type contestation (classement, prix, méthodologie, autre)
- Produit/Magasin concerné
- Observation contestée
- Preuves apportées (photos, tickets, liens)
- Coordonnées contestataire (email, optionnel pour suivi)

**Anonymat :** Possible pour contestations sensibles (ex: pression employeur)

### 5.2 Traitement des Contestations

**Délai réponse :** 30 jours ouvrés maximum  
**Instruction :**
1. Accusé de réception automatique (email)
2. Vérification recevabilité (72h)
3. Investigation interne (15 jours)
4. Décision motivée (15 jours)
5. Publication anonymisée résultat

**Issues possibles :**
- ✅ Contestation fondée → Correction données + notification
- ⚠️ Contestation partielle → Précision méthodologique + flag qualité
- ❌ Contestation non fondée → Explication détaillée + maintien donnée
- 🔄 Recours → Escalade vers Comité de gouvernance

### 5.3 Statistiques Publiques

**Page `/transparence/contestations` affiche :**
- Nombre contestations reçues (trimestre/année)
- Taux contestations fondées
- Délai moyen traitement
- Catégories principales
- Corrections effectuées

---

## 6️⃣ AUDIT EXTERNE PÉRIODIQUE

### 6.1 Fréquence

**Audit méthodologique complet :** Annuel (Q4 chaque année)  
**Audit RGPD/conformité :** Biennal  
**Audit code/sécurité :** Continu (GitHub dependabot + CodeQL)

### 6.2 Auditeurs Indépendants

**Profils acceptables :**
- Université/laboratoire recherche (économie, data science)
- Cabinet audit open-data reconnu
- ONG transparence/données publiques
- Expert indépendant certifié (aucun lien commercial avec distributeurs)

**Critères sélection :**
- Compétence méthodologie statistique
- Neutralité avérée
- Expérience open-data ou observatoires publics
- Budget raisonnable (2000-5000€ audit complet)

### 6.3 Périmètre Audit

**Vérifié obligatoirement :**
- Conformité méthodologie publiée vs code réel
- Absence manipulation données
- Cohérence sources déclarées vs utilisées
- Respect seuils minimaux publication (N≥3)
- Neutralité classements
- Conformité RGPD collecte données
- Sécurité infrastructure

**Livrable :** Rapport public 30-50 pages  
**Publication :** Intégrale sous 15 jours après remise (sauf données sensibles techniques)

---

## 7️⃣ INDÉPENDANCE FINANCIÈRE

### 7.1 Sources de Financement Autorisées

**✅ Acceptables :**
- Subventions publiques (collectivités, État) sans contrepartie éditoriale
- Dons citoyens (<100€/personne/an pour éviter influence individuelle)
- Financements participatifs transparents (crowdfunding)
- Prestations services non liées (formations open-data, conseil méthodologie)

**❌ Interdites :**
- Publicité commerciale enseignes surveillées
- Partenariats rémunérés avec distributeurs
- Vente données utilisateurs
- Sponsoring privé opaque
- Affiliation/cashback produits comparés

### 7.2 Transparence Financière

**Page `/transparence/finances` publie annuellement :**
- Budget global
- Répartition dépenses (hébergement, développement, audit, etc.)
- Sources financement (montants, origine)
- Absence conflits d'intérêt

**Seuil alerte :** Si >20% budget provient d'une source unique, mention explicite + justification

---

## 8️⃣ DROITS DES UTILISATEURS (RGPD+)

### 8.1 Droits Standard RGPD

- ✅ Droit d'accès à ses données personnelles
- ✅ Droit de rectification
- ✅ Droit à l'effacement ("droit à l'oubli")
- ✅ Droit à la portabilité (export JSON)
- ✅ Droit d'opposition (opt-out notifications)
- ✅ Droit de limitation du traitement

**Exercice :** Formulaire `/mes-donnees/gerer` ou email contact RGPD

### 8.2 Droits Étendus (Au-delà RGPD)

- ✅ Droit d'explication algorithme (page méthodologie dédiée)
- ✅ Droit de contestation classement (cf. section 5)
- ✅ Droit de contribution données (opt-in volontaire)
- ✅ Droit de retrait contribution (suppression observation sans justification)
- ✅ Transparence scores qualité contributions (gamification loyale)

---

## 9️⃣ GESTION DES CONFLITS D'INTÉRÊT

### 9.1 Déclarations Obligatoires

**Membres Comité de gouvernance :**
- Déclaration écrite liens avec distributeurs/enseignes
- Mise à jour annuelle
- Récusation automatique sur décisions impliquant entité liée

**Développeurs/contributeurs core :**
- Mention emploi actuel/précédent secteur distribution (si applicable)
- Interdiction commiter code si conflit direct (ex: salarié enseigne comparée)

### 9.2 Registre Public

**Page `/gouvernance/conflits-interets` liste :**
- Membres comité + liens déclarés (anonymisation selon sensibilité)
- Récusations appliquées (décisions concernées)
- Historique modifications composition comité

---

## 🔟 CLAUSE DE PROTECTION DU PROJET

### 10.1 Clause Anti-Dérive

**En cas de tentative de :**
- Commercialisation opaque
- Manipulation méthodologique sous pression
- Censure données observées
- Suppression gouvernance collégiale

**Alors :**
1. **Alerte publique** émise par 2 membres comité minimum
2. **Gel décisions** contestées pendant enquête (15 jours)
3. **Vote comité** à majorité 2/3 pour validation/rejet
4. **Communication publique** résultat (transparence totale)

### 10.2 Droit de Fork Citoyen

**Si gouvernance compromise irrémédiablement :**
- Code source reste open-source (MIT License)
- Données historiques exportables (open-data)
- Méthodologie réutilisable
- Comité ou citoyens peuvent créer fork indépendant

**Condition :** Mention origine + non-usurpation identité "A KI PRI SA YÉ"

---

## 📊 INDICATEURS DE GOUVERNANCE (KPIs Publics)

**Page `/gouvernance/indicateurs` affiche trimestriellement :**

| Indicateur | Q4 2025 | Q1 2026 | Cible |
|------------|---------|---------|-------|
| Réunions comité tenues | 1/1 | - | 4/an |
| Contestations traitées | 0 | - | 100% <30j |
| Décisions journalisées | 0 | - | 100% |
| Audit externe réalisé | ❌ | - | 1/an |
| Taux disponibilité `/charte-ethique` | - | - | 99.9% |
| Budget indépendance (source unique <20%) | - | - | ✅ |

---

## ✅ CHECKLIST DE CONFORMITÉ GOUVERNANCE

### Phase 1 : Mise en Place (Q1 2026)
- [ ] Constituer comité gouvernance 5 membres
- [ ] Publier page `/charte-ethique`
- [ ] Implémenter journal décisions (Firestore + UI)
- [ ] Créer formulaire contestation `/contester-donnee`
- [ ] Publier registre conflits d'intérêt

### Phase 2 : Opérationnalisation (Q2 2026)
- [ ] Première réunion comité (compte-rendu public)
- [ ] Versionner méthodologie actuelle (v1.0 baseline)
- [ ] Traiter premières contestations (si reçues)
- [ ] Publier budget/finances transparence

### Phase 3 : Consolidation (Q3-Q4 2026)
- [ ] Audit externe méthodologique
- [ ] Publier rapport audit
- [ ] Corriger anomalies identifiées
- [ ] Bilan annuel gouvernance

---

## 📞 CONTACTS GOUVERNANCE

**Email Comité :** gouvernance@akiprisaye.org  
**Email Contestations :** contestation@akiprisaye.org  
**Email RGPD :** dpo@akiprisaye.org  

**Délais réponse :**
- Urgence (tentative manipulation) : 48h
- Contestation : 30 jours
- Demande RGPD : 30 jours (légal)
- Information générale : 15 jours

---

## 🔒 PROTECTION JURIDIQUE DU PROJET

### Statut Recommandé
**Association Loi 1901** ou **Structure d'intérêt général** (à formaliser si croissance)

**Avantages :**
- Personnalité morale indépendante
- Protection membres comité
- Éligibilité subventions publiques
- Crédibilité institutionnelle renforcée

**Statuts doivent inclure :**
- Interdiction distribution bénéfices
- Obligation transparence financière
- Gouvernance collégiale non modifiable par majorité simple
- Clause dissolution (actifs reversés structure similaire)

---

## 📝 HISTORIQUE VERSIONS DOCUMENT

| Version | Date | Changements |
|---------|------|-------------|
| 1.0 | 2026-01-13 | Création document initial gouvernance |

---

**Mise à jour :** 13 janvier 2026  
**Prochaine révision :** Avril 2026 (post-première réunion comité)  
**Statut :** ✅ Actif - En attente implémentation technique

---

> **Citation clé :**  
> *"Un observatoire qui cache sa gouvernance n'observe rien. Il manipule."*
