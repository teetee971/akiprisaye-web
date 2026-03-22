# Configuration Cloudflare — Guide étape par étape

Ce guide couvre la création du jeton API Cloudflare et la configuration des secrets GitHub nécessaires au déploiement automatique.

---

## 1. Récupérer votre Account ID

> ✅ **Déjà fait** — l'Account ID est intégré dans `price-api/wrangler.toml`. Vous n'avez pas à le configurer en tant que secret GitHub.

Si vous avez besoin de le retrouver : ouvrez [dash.cloudflare.com](https://dash.cloudflare.com) et copiez l'identifiant visible dans l'URL : `dash.cloudflare.com/**<ACCOUNT_ID>**/home/overview`.

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

**Autorisations** — ajoutez ces 3 lignes en cliquant sur "+ En ajouter d'autres" :

| Scope | Ressource | Accès |
|-------|-----------|-------|
| Compte | Workers D1 | Modifier |
| Compte | Scripts Workers | Modifier |
| Compte | Cloudflare Pages | Modifier |

> **Traduction des menus déroulants :**
> - Colonne 1 : **Compte** (Account)
> - Colonne 2 : sélectionnez la ressource dans la liste (D1, Scripts Workers, Cloudflare Pages)
> - Colonne 3 : **Modifier** (Edit)

**Ressources du compte**
- Inclure → **Tous les comptes** (All accounts)

**Résumé du token (TTL)**
- Laissez "Sans date d'expiration" ou définissez une date selon votre politique de sécurité

### 2.3 Finaliser

1. Cliquez sur **"Continuer pour afficher le résumé"**
2. Vérifiez les permissions puis cliquez sur **"Créer le jeton"**
3. **Copiez immédiatement** la valeur du token — elle ne sera plus affichée ensuite

---

## 3. Ajouter le secret dans GitHub

1. Ouvrez votre dépôt GitHub : **Settings → Secrets and variables → Actions**
2. Cliquez sur **"New repository secret"**
3. Ajoutez :

| Nom | Valeur |
|-----|--------|
| `CLOUDFLARE_API_TOKEN` | *le token que vous venez de copier* |

> **Note :** `CLOUDFLARE_ACCOUNT_ID` est **optionnel** — l'Account ID est déjà dans `price-api/wrangler.toml`. Si vous le définissez quand même, la valeur est `78642e56f72fff94c78e1ef87cb589a7`.

---

## 4. Vérifier que le déploiement fonctionne

Après avoir ajouté le secret, relancez le workflow manuellement :

1. GitHub → **Actions → "Create D1 Database"** → **"Run workflow"**
2. GitHub → **Actions → "Deploy price-api (D1 + Worker)"** → **"Run workflow"**
3. GitHub → **Actions → "Deploy to Cloudflare Pages"** → **"Run workflow"**

---

## Récapitulatif des secrets GitHub requis

| Secret | Obligatoire | Description |
|--------|-------------|-------------|
| `CLOUDFLARE_API_TOKEN` | ✅ Oui | Jeton API créé ci-dessus |
| `CLOUDFLARE_ACCOUNT_ID` | ❌ Non | Déjà dans `price-api/wrangler.toml` |
| `VITE_FIREBASE_AUTH_DOMAIN` | ⚠️ Recommandé | Domaine auth Firebase |
| `VITE_FIREBASE_PROJECT_ID` | ⚠️ Recommandé | ID projet Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | ⚠️ Recommandé | Bucket Firebase Storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ⚠️ Recommandé | Sender ID Firebase |
| `VITE_FIREBASE_APP_ID` | ⚠️ Recommandé | App ID Firebase |
| `VITE_FIREBASE_MEASUREMENT_ID` | ⚠️ Recommandé | Measurement ID Firebase |
