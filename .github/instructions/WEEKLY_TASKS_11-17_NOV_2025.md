# ✅ Check-list technique et fonctionnelle – Semaine du 11 → 17 novembre 2025

## 🗓️ Lundi – 11 novembre
🎯 **Objectif : corriger le build et stabiliser le scanner**
- [ ] Corriger l’erreur JS `Jus d'orange` → remplacer `'` par `"` dans `scanner.js` (ligne 222)
- [ ] Mettre `type="module"` pour `cookie-consent.js`
- [ ] Importer ZXing localement (`import { BrowserMultiFormatReader } from '@zxing/browser'`)
- [ ] Ajouter dans `vite.config.js`: `optimizeDeps: { include: ['@zxing/browser'] }`
- [ ] Tester ouverture caméra sur mobile

## 🗓️ Mardi – 12 novembre
🎯 **Objectif : connecter Firestore et configurer l’environnement**
- [ ] Créer fichier `firebaseConfig.js` avec clés API Firebase
- [ ] Initialiser Firestore (`initializeApp`, `getFirestore`)
- [ ] Connecter Comparateur à Firestore (`produits`)
- [ ] Ajouter produit test "Coca-Cola 1.5L" dans Firestore
- [ ] Créer fichier `.env.example` pour les variables

## 🗓️ Mercredi – 13 novembre
🎯 **Objectif : activer Authentification Firebase**
- [ ] Installer `firebase/auth`
- [ ] Créer pages `/login` et `/signup`
- [ ] Activer méthodes Google et Email dans Firebase Console
- [ ] Tester connexion et déconnexion sur mobile et desktop

## 🗓️ Jeudi – 14 novembre
🎯 **Objectif : mise à jour responsive et corrections visuelles**
- [ ] Corriger débordements du Hero (`flex-wrap`, `max-w-screen`)
- [ ] Centrer logo et boutons CTA (`justify-center`, `text-center`)
- [ ] Vérifier mode sombre sur toutes les pages
- [ ] Tester affichage Samsung S24+

## 🗓️ Vendredi – 15 novembre
🎯 **Objectif : modules secondaires & navigation stable**
- [ ] Ajouter fichier `_redirects` → `/* /index.html 200`
- [ ] Créer pages placeholders `TiPanie.jsx` et `ChefTiCrise.jsx`
- [ ] Ajouter liens correspondants dans la navigation
- [ ] Tester build et déploiement Cloudflare Pages

## 🗓️ Samedi – 16 novembre
🎯 **Objectif : tests complets & vérification mobile**
- [ ] Tester Comparateur connecté à Firestore (produits réels)
- [ ] Scanner un ticket test (OCR & code-barres)
- [ ] Tester login / logout Firebase Auth
- [ ] Ajouter `manifest.json` pour PWA
- [ ] Créer `service-worker.js` pour cache offline

## 🗓️ Dimanche – 17 novembre
🎯 **Objectif : validation finale & push GitHub**
- [ ] Commit global `fix: scanner + firestore`
- [ ] Déploiement Cloudflare Pages (build ✅)
- [ ] Vérifier console d’erreurs DevTools / Cloudflare Logs
- [ ] Mettre à jour `ROADMAP_AKIPRISAYE_v1.1.md`
- [ ] Confirmer auprès de Copilot : “Projet stable – prochaine étape IA Conseiller”

---

## 🧮 **Bilan de la semaine**
- 🔵 Avancement prévu dimanche soir : **85 %**
- 🟢 Comparateur & Firestore : fonctionnels
- 🟢 Scanner corrigé et test mobile OK
- 🟡 Auth Firebase : partiellement actif
- 🟢 Navigation & UI : stabilisées
- 🕐 Prochaine phase : intégration IA Conseiller et Ti-Panié Solidaire (à partir du 18 novembre)

---

**Fichier généré automatiquement – prêt pour GitHub Copilot / suivi CI/CD.**
