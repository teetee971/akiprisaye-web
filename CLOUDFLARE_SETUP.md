# Configuration Cloudflare — Guide étape par étape

Ce guide couvre la création du jeton API Cloudflare et la configuration des secrets GitHub nécessaires au déploiement automatique.

---

## ⚠️ Action requise — Erreur 7003 détectée

**Le workflow "Create D1 Database" échoue avec :**
```
✘ [ERROR] A request to the Cloudflare API (/accounts/***/d1/database) failed.
  Could not route to /client/v4/accounts/***/d1/database,
  perhaps your object identifier is invalid? [code: 7003]
```

**Cause** : le secret `CLOUDFLARE_ACCOUNT_ID` contient une valeur incorrecte (pas un Account ID Cloudflare valide de 32 caractères hexadécimaux).

**Solution** : suivez l'étape 1 ci-dessous pour trouver votre vrai Account ID et mettre à jour le secret.

---

## ✅ Statut des secrets GitHub

| Secret GitHub | Statut |
|---------------|--------|
| `CLOUDFLARE_API_TOKEN` | ✅ Configuré |
| `CLOUDFLARE_ACCOUNT_ID` | ⚠️ **À corriger** — valeur invalide (erreur 7003) |
| `FIREBASE_SERVICE_ACCOUNT` | ✅ Configuré |
| `VITE_FIREBASE_API_KEY` | ✅ Configuré |

---

## 1. Trouver et corriger votre Account ID Cloudflare

### Comment trouver votre Account ID

1. Ouvrez [dash.cloudflare.com](https://dash.cloudflare.com) (connectez-vous si besoin)
2. Regardez l'URL dans votre navigateur :
   ```
   https://dash.cloudflare.com/a1b2c3d4e5f6789012345678901234ab/home/overview
                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                              Votre Account ID — 32 caractères hex
   ```
3. Copiez cette valeur (exemple : `a1b2c3d4e5f6789012345678901234ab`)

> **Format attendu** : exactement 32 caractères hexadécimaux (chiffres 0-9 et lettres a-f)

### Mettre à jour le secret GitHub

1. Ouvrez **Settings → Secrets and variables → Actions** dans votre dépôt GitHub
2. Cliquez sur le crayon ✏️ à côté de `CLOUDFLARE_ACCOUNT_ID`
3. Collez votre Account ID (32 hex chars) dans le champ "Value"
4. Cliquez **Update secret**

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

## 3. Configurer les secrets dans GitHub

**Settings → Secrets and variables → Actions → New repository secret** (ou crayon ✏️ pour modifier)

| Nom du secret | Valeur | Obligatoire |
|---------------|--------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | Account ID Cloudflare (32 hex chars, depuis l'URL dashboard) | ✅ Oui |
| `CLOUDFLARE_API_TOKEN` | Token API créé à l'étape 2 | ✅ Oui |

> **Pourquoi `CLOUDFLARE_ACCOUNT_ID` est requis ?**
> Wrangler CLI utilise cette variable pour identifier votre compte. Elle doit correspondre exactement à votre Account ID Cloudflare (32 caractères hexadécimaux). Le format est validé par le workflow avant tout appel API.

---

## 4. Secrets Firebase requis pour le build

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

## 5. Relancer les workflows (dans l'ordre)

Après avoir corrigé `CLOUDFLARE_ACCOUNT_ID` :

### Étape 1 — Créer la base D1 (une seule fois)
> GitHub → **Actions → "Create D1 Database"** → **"Run workflow"** ✅

### Étape 2 — Déployer le Worker price-api
> GitHub → **Actions → "Deploy price-api (D1 + Worker)"** → **"Run workflow"** ✅

### Étape 3 — Déployer le frontend sur Cloudflare Pages
> GitHub → **Actions → "Deploy to Cloudflare Pages"** → **"Run workflow"** ✅

---

## Récapitulatif complet des secrets GitHub

| Secret | Obligatoire | Description |
|--------|-------------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | ✅ Oui | Account ID Cloudflare (32 hex chars, depuis URL dashboard) |
| `CLOUDFLARE_API_TOKEN` | ✅ Oui | Jeton API Cloudflare (Workers D1 + Scripts + Pages) |
| `FIREBASE_SERVICE_ACCOUNT` | ✅ Oui | JSON compte de service Firebase/GCP |
| `VITE_FIREBASE_API_KEY` | ✅ Oui | Clé API Firebase web |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ Oui | Domaine auth Firebase |
| `VITE_FIREBASE_PROJECT_ID` | ✅ Oui | ID projet Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ Oui | Bucket Firebase Storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ Oui | Sender ID Firebase |
| `VITE_FIREBASE_APP_ID` | ✅ Oui | App ID Firebase |
| `VITE_FIREBASE_MEASUREMENT_ID` | ⚠️ Recommandé | Measurement ID Firebase Analytics |
