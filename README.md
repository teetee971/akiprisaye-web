# A KI PRI SA YÉ — PRO PACK (Front + APIs mock)

## Contenu
- `webapp/` : front statique (API-ready). Lit `/prices` si `API_URL` défini, sinon bascule en mock.
- `worker_api/` : API Cloudflare Workers (`/ping`, `/prices`).
- `functions_api/` : API Firebase Functions (`/api/ping`, `/api/prices`) via `firebase.pro.json` (rewrites).
- `tools/seed.js` : script Node pour peupler Firestore (collection `products`) — nécessite GOOGLE_APPLICATION_CREDENTIALS (clé admin locale, ne pas commiter).

## Déploiement Cloudflare Workers
```bash
cd worker_api
npm i -g wrangler
wrangler login
wrangler deploy
# URL affichée, ex: https://akiprisaye-api.<something>.workers.dev
```
Puis mets l’URL dans `webapp/runtime-env.sample.js`:
```js
window.__AKP__ = { API_URL: "https://...workers.dev" };
```

## Déploiement Firebase Hosting + Functions
```bash
cd functions_api && npm i
cd ..
# Utilise la config pro (functions + rewrites)
firebase deploy --only functions,hosting --config firebase.pro.json
```
Ton front sera servi depuis `webapp/`. Les endpoints :
- `https://<site>/api/ping`
- `https://<site>/api/prices`

## Front (webapp) en local
Ouvre `webapp/index.html` ou sers-le avec un petit serveur (ex: `npx http-server webapp`).

## Firestore (optionnel) — Seed
```bash
cd tools
npm i
export GOOGLE_APPLICATION_CREDENTIALS="/chemin/vers/serviceAccount.json"
node seed.js
```
Collection créée : `products` avec `{id,name,price_dom,price_hex}`.

## Sécurité
- AUCUNE clé privée n’est incluse. Configure tes secrets via variables d’environnement.
- Ne commite jamais `serviceAccount*.json`.
