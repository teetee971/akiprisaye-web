# Check-list de déploiement A KI PRI SA YÉ

## 1. Code & Fonctionnalités
- [ ] Les composants `ProductDetails.jsx` et `ScannerPage.jsx` sont présents et testés.
- [ ] Le scanner réel fonctionne sur mobile et desktop.
- [ ] Les appels à OpenFoodFacts sont OK : nom, marque, Nutri-Score, photo, origine, labels, ingrédients s’affichent.
- [ ] L’historique des prix (Firestore) s’affiche en graphique (react-chartjs-2).
- [ ] Les tickets associés (Firestore) s’affichent correctement.
- [ ] Le cache local fonctionne (localStorage).
- [ ] Les animations (fade-in) sont visibles sur la fiche produit.

## 2. Design & Accessibilité
- [ ] Dark mode / mode sombre cohérent sur toutes les pages.
- [ ] Les badges, cartes, boutons et graphiques sont bien stylisés (Tailwind + shadcn/ui).
- [ ] Responsive mobile-first (affichage correct sur smartphone, tablette, desktop).
- [ ] Les `aria-label` sont présents sur tous les éléments interactifs.

## 3. Dépendances & Build
- [ ] Toutes les dépendances sont installées (`html5-qrcode`, `react-chartjs-2`, `chart.js`, `shadcn-ui`, `tailwindcss`, `firebase`).
- [ ] Le build local fonctionne sans erreur (`npm run build` ou équivalent).
- [ ] Le fichier `firebase.js` est bien configuré (accès Firestore sécurisé).

## 4. Déploiement
- [ ] Le dépôt GitHub est à jour sur la branche principale (`main`).
- [ ] Le service de déploiement (Pages.dev, Vercel, Netlify…) est configuré pour déployer sur chaque push.
- [ ] La dernière version du code est déployée (vérifier logs, date du build).
- [ ] L’URL de production est accessible : https://akiprisaye.pages.dev/

## 5. Tests & Validation
- [ ] Tester un scan de code-barres réel sur mobile.
- [ ] Vérifier l’affichage d’un produit connu (ex : Nutella).
- [ ] Vérifier l’affichage de l’historique des prix et tickets pour ce produit.
- [ ] Vérifier la gestion des erreurs (produit non trouvé, prix/ticket absent, problème API).
- [ ] Vérifier le comportement sur différents navigateurs (Chrome, Safari, Firefox).

## 6. Sécurité & RGPD
- [ ] Les données Firestore sont protégées (règles de sécurité).
- [ ] Les données personnelles (tickets, prix) ne sont pas exposées publiquement.
- [ ] Les mentions RGPD sont présentes (si besoin).

## 7. Monitoring & Support
- [ ] Un moyen de monitoring est en place (logs, erreurs déploiement).
- [ ] Un canal support est prêt en cas de bug (mail, Discord, GitHub issues).