# Configuration Cloudflare — Guide étape par étape

Ce guide couvre la création du jeton API Cloudflare et la configuration des secrets GitHub nécessaires au déploiement automatique.

---

## ✅ Statut actuel (mis à jour)

| Secret GitHub | Statut |
|---------------|--------|
| `CLOUDFLARE_API_TOKEN` | ✅ Configuré |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ Configuré |
| `FIREBASE_SERVICE_ACCOUNT` | ✅ Configuré |
| `VITE_FIREBASE_API_KEY` | ✅ Configuré |

**→ Tous les secrets requis sont en place. Passez directement aux [Prochaines étapes](#5-prochaines-étapes).**

---

## 1. Récupérer votre Account ID

Ouvrez [dash.cloudflare.com](https://dash.cloudflare.com) et copiez l'identifiant visible dans l'URL :
`dash.cloudflare.com/**<ACCOUNT_ID>**/home/overview`

Il s'agit d'une chaîne hexadécimale de 32 caractères (ex: `78642e56f72fff94c78e1ef87cb589a7`).

---

## 2. Créer le jeton API Cloudflare (`CLOUDFLARE_API_TOKEN`)

### 2.1 Accéder à la page de création

1. Ouvrez [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Cliquez sur **"Créer un jeton"** (Create Token)
3. Faites défiler vers le bas et cliquez sur **"Créer un jeton personnalisé"** (Custom token → Get started)

### 2.2 Remplir le formulaire

**Nom du jeton**
```
akiprisaye-web-ci
```

**Autorisations** — configurez ces 3 lignes (cliquez sur "+ En ajouter d'autres" pour chaque ligne supplémentaire) :

| Colonne 1 | Colonne 2 | Colonne 3 |
|-----------|-----------|-----------|
| **Compte** | **Workers D1** | **Modifier** |
| **Compte** | **Scripts Workers** | **Modifier** |
| **Compte** | **Cloudflare Pages** | **Modifier** |

> **Traduction des menus déroulants :**
> - Colonne 1 : **Compte** (= "Account" en anglais)
> - Colonne 2 : choisissez la ressource dans la liste déroulante
> - Colonne 3 : **Modifier** (= "Edit" en anglais)

**Ressources du compte** (section en bas)
- Inclure → **Tous les comptes** (déjà sélectionné par défaut — ne rien changer)

**TTL / Date d'expiration**
- Laissez "Sans date d'expiration" ou choisissez une date selon votre politique

### 2.3 Finaliser

1. Cliquez sur **"Continuer pour afficher le résumé"**
2. Vérifiez les 3 permissions → cliquez sur **"Créer le jeton"**
3. **Copiez immédiatement** la valeur affichée — elle ne sera **plus jamais visible**

---

## 3. Ajouter les secrets dans GitHub

**Settings → Secrets and variables → Actions → New repository secret**

| Nom du secret | Valeur | Obligatoire |
|---------------|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Le token copié à l'étape 2.3 | ✅ Oui |
| `CLOUDFLARE_ACCOUNT_ID` | Votre Account ID (32 hex chars) | ✅ Oui — requis par le workflow Pages |

> **Pourquoi `CLOUDFLARE_ACCOUNT_ID` est requis ?**
> Le workflow `deploy-cloudflare-pages.yml` vérifie ce secret et annule le déploiement s'il est absent ou invalide. Il doit correspondre exactement à votre Account ID Cloudflare (32 caractères hexadécimaux).

---

## 4. Secrets Firebase requis pour le build

Le build frontend injecte ces variables d'environnement. Si elles ne sont pas définies, les valeurs de `frontend/src/lib/firebase.ts` sont utilisées comme fallback.

| Secret | Obligatoire | Où trouver la valeur |
|--------|-------------|----------------------|
| `VITE_FIREBASE_API_KEY` | ✅ Oui | Firebase Console → Paramètres du projet → Vos apps |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ Oui | Ex: `mon-projet.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ✅ Oui | Ex: `mon-projet-12345` |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ Oui | Ex: `mon-projet.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ Oui | Identifiant numérique |
| `VITE_FIREBASE_APP_ID` | ✅ Oui | Ex: `1:123:web:abc` |
| `VITE_FIREBASE_MEASUREMENT_ID` | ⚠️ Recommandé | Ex: `G-XXXXXXXXXX` (Analytics) |
| `FIREBASE_SERVICE_ACCOUNT` | ✅ Oui | JSON du compte de service GCP |

---

## 5. Prochaines étapes

Maintenant que les secrets sont configurés, lancez les workflows dans cet ordre :

### Étape 1 — Créer la base D1 (une seule fois)
> GitHub → **Actions → "Create D1 Database"** → **"Run workflow"** → **"Run workflow"** ✅

### Étape 2 — Déployer le Worker price-api
> GitHub → **Actions → "Deploy price-api (D1 + Worker)"** → **"Run workflow"** ✅

### Étape 3 — Déployer le frontend sur Cloudflare Pages
> GitHub → **Actions → "Deploy to Cloudflare Pages"** → **"Run workflow"** ✅

### Étape 4 — Vérifier le déploiement
Après le déploiement, testez :
```bash
# Frontend
curl -s https://akiprisaye-web.pages.dev | head -5

# API price-api Worker
curl -s https://price-api.<votre-sous-domaine>.workers.dev/health
```

---

## Récapitulatif complet des secrets GitHub

| Secret | Obligatoire | Description |
|--------|-------------|-------------|
| `CLOUDFLARE_API_TOKEN` | ✅ Oui | Jeton API Cloudflare (Workers D1 + Scripts + Pages) |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ Oui | Account ID Cloudflare (32 hex chars) |
| `FIREBASE_SERVICE_ACCOUNT` | ✅ Oui | JSON compte de service Firebase/GCP |
| `VITE_FIREBASE_API_KEY` | ✅ Oui | Clé API Firebase web |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ Oui | Domaine auth Firebase |
| `VITE_FIREBASE_PROJECT_ID` | ✅ Oui | ID projet Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ Oui | Bucket Firebase Storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ Oui | Sender ID Firebase |
| `VITE_FIREBASE_APP_ID` | ✅ Oui | App ID Firebase |
| `VITE_FIREBASE_MEASUREMENT_ID` | ⚠️ Recommandé | Measurement ID Firebase Analytics |
