# User Journey Map - Version 3.0

## 🎯 Parcours utilisateur simplifié

La version 3.0 introduit un parcours utilisateur redessiné autour de **3 actions principales** :

1. **Scanner** un produit ou ticket
2. **Comprendre** les informations (prix, évolution, composition)
3. **Comparer** avec d'autres produits/enseignes/territoires

## 👤 Personas utilisateurs

### 1. Citoyen consommateur (primaire)

**Objectif** : Suivre l'évolution des prix et optimiser son budget

**Parcours** :
1. Accède à la page d'accueil
2. Clique sur "Scanner un produit"
3. Photographie un code-barres
4. Consulte le prix actuel et l'historique
5. Compare avec d'autres enseignes via la carte
6. Configure une alerte si le prix augmente de >10%

**Points de friction** :
- ✅ Supprimé : Navigation complexe avec trop d'options
- ✅ Supprimé : Formulaires multiples avant d'accéder aux données
- ✅ Supprimé : Terminologie technique peu claire

**Amélioration v3.0** :
- Interface en 3 étapes claires
- Accès direct au scan dès la page d'accueil
- Vocabulaire simple et pédagogique

### 2. Journaliste / Média (secondaire)

**Objectif** : Accéder aux données pour enquêtes et reportages

**Parcours** :
1. Accède à l'observatoire public
2. Applique des filtres (territoire, catégorie, période)
3. Analyse les tableaux de prix
4. Exporte les données en CSV/JSON
5. Intègre dans article avec attribution

**Points de friction** :
- ✅ Supprimé : Absence d'export facile des données
- ✅ Supprimé : Méthodologie peu visible

**Amélioration v3.0** :
- Observatoire public dédié avec exports en 1 clic
- Documentation méthodologique accessible
- Attribution et licence clairement indiquées

### 3. Chercheur / Institution (tertiaire)

**Objectif** : Réutiliser les données pour études académiques

**Parcours** :
1. Consulte la documentation d'interopérabilité
2. Lit les schémas JSON
3. Accède aux endpoints API (lecture seule)
4. Intègre dans ses propres outils d'analyse
5. Cite la source selon les normes académiques

**Points de friction** :
- ✅ Supprimé : Absence de schémas formels
- ✅ Supprimé : API non documentée

**Amélioration v3.0** :
- Schéma JSON normalisé (compatible INSEE/Eurostat)
- Documentation complète d'interopérabilité
- Guide de citation académique

### 4. Collectivité territoriale (tertiaire)

**Objectif** : Intégrer les données dans tableaux de bord territoriaux

**Parcours** :
1. Contacte l'équipe pour clé API institutionnelle
2. Accède aux données via endpoints dédiés
3. Intègre dans observatoire territorial
4. Publie des rapports avec attribution

**Points de friction** :
- ✅ Supprimé : Absence de versioning des datasets
- ✅ Supprimé : Quotas trop restrictifs

**Amélioration v3.0** :
- Versioning sémantique des données
- Quotas adaptés aux institutions
- Support technique dédié

## 📱 Mobile First

### Optimisations mobiles v3.0

#### Performance
- **Lazy loading** : Chargement différé des composants non critiques
- **Code splitting** : Réduction de la taille du bundle initial
- **Images optimisées** : WebP avec fallback
- **Service Worker** : Mise en cache des ressources statiques

#### UX tactile
- **Boutons larges** : Minimum 44x44px (Apple HIG)
- **Espacement généreux** : Évite les clics accidentels
- **Gestures naturels** : Swipe, pinch-to-zoom sur les cartes
- **Feedback haptique** : Vibration subtile sur actions importantes

#### Navigation simplifiée
- **Menu hamburger** : Accès rapide aux principales sections
- **Bottom navigation** : Actions principales accessibles au pouce
- **Back button** : Retour intuitif dans le parcours

#### Scan optimisé
- **Caméra native** : Utilisation de l'API WebRTC
- **Détection auto** : Reconnaissance automatique du code-barres
- **Guide visuel** : Cadre pour positionner le produit
- **Flash contrôlé** : Activation facile en cas de faible luminosité

## 🎨 Wireframes clés

### Page d'accueil v3.0

```
┌─────────────────────────────────┐
│ [Logo] A ki pri sa yé    [≡]   │
├─────────────────────────────────┤
│                                 │
│  Comparez les prix simplement   │
│                                 │
│  [📸 Scanner un produit]        │
│  [📊 Consulter l'observatoire]  │
│                                 │
├─────────────────────────────────┤
│  📈 Compteurs publics           │
│  ┌────┬────┬────┬────┐          │
│  │Scan│Prod│Terr│User│          │
│  └────┴────┴────┴────┘          │
├─────────────────────────────────┤
│  🎯 Parcours en 3 étapes        │
│  [1.Scanner] [2.Comprendre]     │
│  [3.Comparer]                   │
└─────────────────────────────────┘
```

### Scan de produit

```
┌─────────────────────────────────┐
│ [←] Scanner un produit     [?]  │
├─────────────────────────────────┤
│                                 │
│     ┌─────────────────┐         │
│     │                 │         │
│     │   [Caméra]      │         │
│     │                 │         │
│     │  ┌───────────┐  │         │
│     │  │           │  │         │
│     │  │  Cadrage  │  │         │
│     │  │           │  │         │
│     │  └───────────┘  │         │
│     │                 │         │
│     └─────────────────┘         │
│                                 │
│  Positionnez le code-barres     │
│  dans le cadre                  │
│                                 │
│  [💡 Flash]  [🖼️ Galerie]       │
└─────────────────────────────────┘
```

### Observatoire public

```
┌─────────────────────────────────┐
│ [←] Observatoire public         │
├─────────────────────────────────┤
│  🏛️ Données publiques officielles│
│                                 │
│  Filtres:                       │
│  [EAN] [Catégorie] [Territoire] │
│                                 │
│  📋 Tableau des prix            │
│  ┌───┬──────┬──────┬─────┐     │
│  │EAN│ Prod │ Prix │ Évol│     │
│  ├───┼──────┼──────┼─────┤     │
│  │356│Lait  │ 1.35 │+2.5%│     │
│  │357│Pain  │ 2.20 │-1.2%│     │
│  └───┴──────┴──────┴─────┘     │
│                                 │
│  [📥 CSV]  [📥 JSON]            │
└─────────────────────────────────┘
```

## 🔄 Flux d'interaction

### Flux principal : Scan → Résultat

```
Page d'accueil
    ↓
[Clic: Scanner]
    ↓
Activation caméra
    ↓
Détection code-barres
    ↓
Recherche produit
    ↓
┌────────────────┐
│ Résultat scan  │
│ ┌────────────┐ │
│ │Nom produit │ │
│ │Prix actuel │ │
│ │Historique  │ │
│ └────────────┘ │
│                │
│ [Comparer]     │
│ [Alertes]      │
│ [Partager]     │
└────────────────┘
```

### Flux secondaire : Consultation observatoire

```
Page d'accueil
    ↓
[Clic: Observatoire]
    ↓
Dashboard observatoire
    ↓
Filtrage données
    ↓
Visualisation tableaux
    ↓
Export CSV/JSON
```

## 📊 Métriques de succès

### KPIs v3.0

| Métrique | Objectif v3.0 | Mesure |
|----------|---------------|--------|
| **Time to scan** | <10 secondes | Temps moyen du clic "Scanner" au résultat |
| **Scan success rate** | >85% | % de scans aboutissant à un résultat |
| **Mobile usage** | >70% | % de sessions depuis mobile |
| **Export frequency** | >100/mois | Nombre d'exports CSV/JSON |
| **Bounce rate** | <40% | % d'utilisateurs quittant sans interaction |
| **Session duration** | >3 minutes | Temps moyen passé sur la plateforme |

### A/B Testing prévus

1. **Position du CTA "Scanner"**
   - Variante A : Bouton centré (actuel)
   - Variante B : FAB (Floating Action Button) en bas à droite

2. **Verbatim des compteurs**
   - Variante A : Chiffres seuls
   - Variante B : Chiffres + interprétation ("Déjà 1000+ scans !")

3. **Onboarding première visite**
   - Variante A : Pas d'onboarding (accès direct)
   - Variante B : Tour guidé en 3 slides

## 🚀 Points d'amélioration continue

### Court terme (Q1 2026)

- [ ] A/B test sur position des CTAs
- [ ] Optimisation des Core Web Vitals (LCP < 2.5s)
- [ ] Ajout de micro-animations (feedback visuel)
- [ ] Mode hors-ligne étendu

### Moyen terme (Q2-Q3 2026)

- [ ] Progressive Web App complète (installable)
- [ ] Notifications push (alertes prix)
- [ ] Partage social (Twitter, WhatsApp)
- [ ] Comparaison multi-produits (panier)

### Long terme (Q4 2026)

- [ ] Assistant vocal ("Scanner ce produit")
- [ ] Réalité augmentée (info prix en surimpression)
- [ ] Personnalisation du dashboard
- [ ] Mode collaboratif (listes partagées)

## 📝 Retours utilisateurs

### Feedbacks intégrés en v3.0

> "Trop compliqué de trouver où scanner" → **Bouton scan prominent en page d'accueil**

> "Je ne sais pas à quoi servent tous ces menus" → **Navigation simplifiée à 3 actions**

> "L'app est lente sur mon téléphone" → **Optimisations performance mobile**

> "J'aimerais exporter les données" → **Observatoire public avec exports CSV/JSON**

> "Pourquoi je dois créer un compte ?" → **Accès direct sans inscription (consultation)**

### Mécanismes de feedback v3.0

- **Bouton feedback** : Présent sur toutes les pages
- **NPS survey** : Envoyé après 3 sessions
- **Analytics comportemental** : Heatmaps, session recordings
- **GitHub Issues** : Pour suggestions et bugs

---

**Version du document** : 3.0  
**Date de publication** : 2 janvier 2026  
**Dernière mise à jour** : 2 janvier 2026
