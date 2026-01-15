# 🚀 QUICK START GUIDE - Google Play Publication

**Version**: 1.0.0  
**Application**: A KI PRI SA YÉ  
**Status**: ✅ PRÊT POUR TEST INTERNE

---

## 📋 DOCUMENTS PRÊTS À L'EMPLOI

Tous les documents sont **prêts à copier-coller** directement dans Google Play Console :

### 1. Notes de version (Release Notes)
📄 **Fichier**: `RELEASE_NOTES_FR.md`  
📍 **Section Play Console**: Release → Release notes  
✅ **Prêt**: Copier le texte sous "🅰️ NOTES DE VERSION"

### 2. Titre de l'application
📄 **Fichier**: `GOOGLE_PLAY_STORE_LISTING.md`  
📍 **Section Play Console**: Store listing → App name  
✅ **Prêt**: `A KI PRI SA YÉ – Observatoire` (30 caractères)

### 3. Description courte
📄 **Fichier**: `GOOGLE_PLAY_STORE_LISTING.md`  
📍 **Section Play Console**: Store listing → Short description  
✅ **Prêt**: `Observatoire citoyen des prix et services dans les territoires ultramarins.` (76 caractères)

### 4. Description longue
📄 **Fichier**: `GOOGLE_PLAY_STORE_LISTING.md`  
📍 **Section Play Console**: Store listing → Full description  
✅ **Prêt**: Copier le bloc de texte complet (2,847 caractères)

### 5. Data Safety
📄 **Fichier**: `GOOGLE_PLAY_STORE_LISTING.md` (section 🅲)  
📍 **Section Play Console**: App content → Data safety  
✅ **Guidelines complètes**: Cocher exactement comme indiqué

### 6. Réponse aux reviewers
📄 **Fichier**: `GOOGLE_PLAY_REVIEWER_RESPONSE.md`  
📍 **Utilisation**: Si Play demande des clarifications  
✅ **Prêt**: Copier la réponse sous "🅳"

---

## 🎯 DÉMARRAGE EN 5 ÉTAPES (30 MINUTES)

### Étape 1: Générer l'AAB (10 min)

```bash
# Option A: Via GitHub Actions (recommandé)
1. Aller sur GitHub.com → Actions
2. Sélectionner "Build Android AAB for Google Play"
3. Cliquer "Run workflow" → "Run workflow"
4. Attendre 5-10 minutes
5. Télécharger l'artifact "app-release-aab"

# Option B: En local (si GitHub Actions ne fonctionne pas)
cd android
./gradlew bundleRelease
# Le fichier sera dans: android/app/build/outputs/bundle/release/app-release.aab
```

### Étape 2: Créer l'application dans Play Console (5 min)

```
1. Aller sur play.google.com/console
2. Cliquer "Create app"
3. Remplir:
   - App name: A KI PRI SA YÉ
   - Default language: French (France)
   - App or game: App
   - Free or paid: Free
4. Accepter les déclarations
5. Cliquer "Create app"
```

### Étape 3: Uploader l'AAB (5 min)

```
1. Dans Play Console: Release → Testing → Internal testing
2. Cliquer "Create new release"
3. Cliquer "Upload" et sélectionner le fichier .aab
4. Copier les notes de version depuis RELEASE_NOTES_FR.md
5. Cliquer "Next" puis "Save"
```

### Étape 4: Ajouter des testeurs (5 min)

```
1. Dans "Internal testing" → "Testers" tab
2. Cliquer "Create email list"
3. Nommer la liste (ex: "Internal Testers")
4. Ajouter des emails séparés par des virgules
5. Sauvegarder
```

### Étape 5: Publier (5 min)

```
1. Retourner à la release créée
2. Cliquer "Review release"
3. Vérifier que tout est correct
4. Cliquer "Start rollout to Internal testing"
5. Confirmer
```

**🎉 C'est fait !** L'app sera disponible pour les testeurs sous 1-4 heures.

---

## 📱 LIEN DE TEST

Une fois la release traitée par Google Play:

1. Play Console affichera un lien de test
2. Format: `https://play.google.com/apps/internaltest/...`
3. Envoyer ce lien aux testeurs
4. Les testeurs cliquent sur le lien → "Become a tester" → "Download from Play Store"

---

## ⚠️ ACTIONS OPTIONNELLES (MAIS RECOMMANDÉES)

### Pour Test Fermé (Closed Testing)

Avant de passer en Closed Testing, compléter:

1. **Data Safety** (15 min)
   - Play Console → App content → Data safety
   - Suivre les guidelines dans `GOOGLE_PLAY_STORE_LISTING.md` section 🅲
   - Répondre aux questions exactement comme indiqué

2. **Screenshots basiques** (30 min)
   - Prendre 2-3 captures d'écran sur un appareil Android
   - Format: PNG ou JPEG
   - Ratio: 16:9 ou 9:16
   - Uploader dans Play Console → Store listing → Screenshots

3. **Privacy Policy URL** (5 min)
   - Déployer `mentions.html` à une URL publique
   - Ajouter l'URL dans Play Console → App content → Privacy policy

### Pour Production

Avant de passer en Production, compléter (en plus du ci-dessus):

4. **Content Rating** (10 min)
   - Play Console → App content → App content rating
   - Compléter le questionnaire IARC
   - Réponses attendues: Tout public / PEGI 3

5. **Screenshots professionnels** (1-2 heures)
   - Minimum 2, recommandé 4-8
   - Haute qualité, représentatifs de l'app
   - Uploader dans Store listing → Screenshots

6. **Feature Graphic** (30 min)
   - Créer une image 1024x500 pixels
   - Design professionnel avec le logo/nom de l'app
   - Uploader dans Store listing → Feature graphic

7. **App Icon haute résolution** (15 min)
   - Format: 512x512 PNG
   - 32-bit avec transparence
   - Uploader dans Store listing → App icon

---

## 🆘 TROUBLESHOOTING

### Problème: Le workflow GitHub Actions échoue

**Solution**:
```bash
# Construire localement
cd android
./gradlew clean
./gradlew bundleRelease
```

### Problème: "Package name already exists"

**Solution**:
- Le package `com.akiprisaye.app` est peut-être déjà enregistré
- Vérifier si une app existe déjà dans votre compte Play Console
- Si nécessaire, utiliser un autre package name

### Problème: "Upload rejected - signing issue"

**Solution**:
- Pour la première upload, Google Play accepte n'importe quelle signature
- Google Play App Signing sera activé automatiquement
- Suivre les instructions dans Play Console

### Problème: "Privacy policy required"

**Solution**:
- Déployer `mentions.html` à une URL publique
- Ajouter l'URL dans Play Console → App content → Privacy policy
- L'URL doit être accessible sans authentification

---

## 📞 RESSOURCES

### Documentation officielle
- [Google Play Console](https://play.google.com/console)
- [Android App Bundle](https://developer.android.com/guide/app-bundle)
- [Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469)

### Documents du projet
- `GO_NO_GO_FINAL_DECISION.md`: Décision détaillée et FAQ
- `GOOGLE_PLAY_COMPLIANCE_AUDIT.md`: Audit technique complet
- `PRE_RELEASE_AUDIT.md`: Checklist de pré-release
- `GOOGLE_PLAY_PUBLICATION_SUMMARY.md`: Résumé de l'implémentation

---

## ✅ CHECKLIST RAPIDE

Avant de commencer:
- [ ] Compte Google Play Developer créé (25€ one-time fee)
- [ ] Node.js installé (pour le build web)
- [ ] Accès au repository GitHub

Pour Test Interne (maintenant):
- [ ] AAB généré via workflow ou localement
- [ ] AAB uploadé dans Play Console
- [ ] Notes de version copiées
- [ ] Testeurs ajoutés (emails)
- [ ] Release publiée sur Internal Testing

Pour Test Fermé (optionnel, dans 1-2 semaines):
- [ ] Data Safety complété
- [ ] 2-3 screenshots uploadés
- [ ] Privacy policy URL ajoutée

Pour Production (dans 1 mois):
- [ ] Content Rating complété
- [ ] Screenshots professionnels uploadés
- [ ] Feature graphic uploadé
- [ ] App icon haute résolution uploadé
- [ ] Tous les champs du store listing remplis

---

## 🎯 STATUT ACTUEL

**Version**: 1.0.0 (versionCode: 1)  
**Prêt pour**: ✅ Test Interne  
**Score**: 90/100  
**Blockers**: Aucun  
**Action recommandée**: ✅ **LANCER LE WORKFLOW MAINTENANT**

---

## 🚀 PROCHAINE ACTION

**→ Aller sur GitHub Actions et lancer le workflow "Build Android AAB for Google Play"**

Ou via ligne de commande:
```bash
gh workflow run "Build Android AAB for Google Play"
```

---

**Bonne chance ! 🎉**

_Document créé le 2026-01-10_  
_Prêt pour publication immédiate_
