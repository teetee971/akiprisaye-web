# Analyse Photo Produit - Guide Utilisateur

## 📋 Vue d'ensemble

La fonctionnalité **Analyse Photo Produit** permet d'obtenir une fiche complète d'un produit alimentaire à partir d'une simple photo. L'analyse est effectuée localement dans votre navigateur via OCR, sans transmission de données personnelles.

## 🎯 Fonctionnalités

### 1. Capture de la Photo
Deux options disponibles:
- **📷 Prendre une photo** - Utilise la caméra avec guidage intelligent
- **📤 Importer une photo** - Depuis votre galerie

### 2. Analyse Automatique

L'application extrait automatiquement:

#### 🧪 Ingrédients
- Liste complète des ingrédients
- Ordre d'importance (quantité décroissante)
- Additifs identifiés (E-numbers)
- Allergènes détectés

#### 🥗 Nutrition
- Tableau nutritionnel complet (pour 100g/ml)
  - Énergie (kcal)
  - Matières grasses (dont saturés)
  - Glucides (dont sucres)
  - Fibres
  - Protéines
  - Sel
- Scores de qualité:
  - **Nutri-Score** (A à E)
  - **Groupe NOVA** (1 à 4)
  - **Eco-Score** (A à E)

#### 💰 Prix et Tendances
- Prix actuel (si détecté sur l'emballage)
- Historique des prix
- Tendance: 📈 Hausse / → Stable / 📉 Baisse
- Prix moyen calculé

#### 📋 Informations Générales
- Nom du produit
- Marque
- Code EAN (si visible)
- Niveau de transformation
- Origine
- Labels et certifications (Bio, AOC, etc.)

### 3. Fiche Produit Interactive

La fiche s'affiche en plein écran avec 4 onglets:
1. **📋 Informations** - Vue générale, insights, traçabilité
2. **🧪 Ingrédients** - Liste détaillée, additifs, allergènes
3. **🥗 Nutrition** - Tableau nutritionnel, scores
4. **💰 Prix** - Prix actuel, historique, tendances

## 🔍 Indicateurs de Qualité

### Score de Confiance (0-100%)
- **90%+** 🟢 Excellent - Toutes informations détectées
- **70-90%** 🟡 Bon - Majorité des infos présentes
- **50-70%** 🟠 Moyen - Informations partielles
- **<50%** 🔴 Faible - Peu d'informations extraites

### Qualité OCR
- **Excellent** - Texte très clair, toutes catégories détectées
- **Good** - Texte correct, une catégorie manquante
- **Fair** - Texte partiel, plusieurs infos manquantes
- **Poor** - Texte illisible, peu d'infos

## 💡 Conseils pour une Meilleure Analyse

### Photo Idéale
1. **Cadrage:**
   - Photographier de face, perpendiculaire
   - Inclure la liste des ingrédients complète
   - Inclure le tableau nutritionnel
   - Si possible, le code-barres EAN

2. **Éclairage:**
   - Lumière naturelle ou éclairage blanc
   - Éviter les ombres portées
   - Pas de reflets sur l'emballage brillant
   - Contraste suffisant texte/fond

3. **Netteté:**
   - Mise au point nette sur le texte
   - Tenir l'appareil stable
   - Distance optimale: 10-20cm
   - Résolution minimale: 1920x1080px

### Ce qui Améliore la Détection
✅ Texte imprimé (vs manuscrit)  
✅ Police claire et contrastée  
✅ Taille de texte > 8pt  
✅ Pas de plis ou déchirures  
✅ Emballage plat (vs arrondi)

### Ce qui Dégrade la Détection
❌ Photo floue ou mal éclairée  
❌ Reflets sur plastique brillant  
❌ Texte trop petit  
❌ Emballage froissé  
❌ Angle de prise de vue oblique

## 🔒 Confidentialité et Sécurité

### Traitement 100% Local
- Aucune photo uploadée sur serveur
- OCR effectué dans votre navigateur
- Aucune donnée personnelle transmise
- Traitement terminé = photo supprimée

### Conformité RGPD
- Pas de tracking utilisateur
- Pas de cookies tiers
- Stockage local uniquement (si choisi)
- Données supprimables à tout moment

### Avertissement Institutionnel
⚠️ Les informations affichées ont un caractère **strictement informatif et non contractuel**. Ce service est un outil d'information publique, pas une valeur de référence commerciale.

## 🚀 Accès à la Fonctionnalité

### Méthode 1: Direct
Accédez directement à: `/analyse-photo-produit`

### Méthode 2: Flux Unifié
1. Allez sur `/scanner-produit`
2. Choisissez "Analyse Complète"
3. Suivez le parcours guidé

## 📊 Cas d'Usage

### 🛒 Faire ses Courses
- Comparer ingrédients entre produits similaires
- Vérifier allergènes avant achat
- Consulter valeurs nutritionnelles
- Comparer prix historiques

### 🏠 À la Maison
- Archiver produits consommés
- Suivre évolution recettes (reformulations)
- Partager fiches avec famille
- Exporter données (à venir)

### 🔬 Recherche/Études
- Analyser compositions produits
- Étudier tendances nutritionnelles
- Comparer marques/catégories
- Détecter additifs controversés

## ❓ FAQ

**Q: Pourquoi certaines informations ne sont pas détectées?**  
A: La détection dépend de la qualité de la photo et de la lisibilité du texte. Suivez les conseils ci-dessus pour améliorer les résultats.

**Q: Puis-je faire confiance aux valeurs détectées?**  
A: Les valeurs sont extraites automatiquement par OCR. Consultez le score de confiance et la qualité OCR. En cas de doute, vérifiez manuellement sur l'emballage.

**Q: Mes photos sont-elles stockées?**  
A: Non, aucune photo n'est uploadée ni stockée. Le traitement est 100% local dans votre navigateur.

**Q: Puis-je exporter la fiche produit?**  
A: La fonction d'export est en cours de développement et sera disponible prochainement.

**Q: Que faire si l'analyse échoue?**  
A: Reprenez une photo avec:
- Meilleur éclairage
- Plus près du texte
- Appareil stable
- Texte bien lisible

**Q: Les prix sont-ils fiables?**  
A: Les prix affichés proviennent d'observations citoyennes et sont informatifs uniquement. Ils ne constituent pas un engagement commercial.

## 🆘 Support

**Problème technique?**  
Créez une issue GitHub avec:
- Description du problème
- Type d'appareil (iPhone, Android, etc.)
- Screenshot si possible
- Étape où l'erreur survient

**Suggestion d'amélioration?**  
Vos retours sont précieux! Partagez vos idées via:
- Issues GitHub (tag: enhancement)
- Discussions communautaires

## 📈 Prochaines Améliorations

### Phase 2 (À Venir)
- [ ] Export PDF de la fiche
- [ ] Comparaison multi-produits
- [ ] Historique personnel de scans
- [ ] Alertes reformulation produit
- [ ] Détection logos (Bio, AOC, etc.)
- [ ] Support multi-langues
- [ ] Mode batch (plusieurs produits)

---

**Version:** 1.0.0  
**Date:** 2026-01-07  
**Statut:** ✅ Disponible  
**Route:** `/analyse-photo-produit`
