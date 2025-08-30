# A KI PRI SA YÉ — Fonctionnel (OCR + Comparateur + Chat règles)
## 1) Installer
```bash
npm i
```
Crée **.env.local** à la racine avec:
```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=1:...:web:...
```
## 2) Dev
```bash
npm run dev
```
## 3) Build & deploy Firebase
```bash
npm run build
firebase deploy
```
## 4) Rendre les modules utiles
- **/import** → clique pour injecter `public/seed.products.json` dans Firestore (collection `products`)
- **/comparateur** → recherche, ajoute au panier, total
- **/ocr** → upload image, Tesseract.js analyse, sauvegarde dans `tickets`
- **/chat** → questions simples: "riz", "panier 20€" → utilise Firestore pour te répondre
