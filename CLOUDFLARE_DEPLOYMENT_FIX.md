# 🔧 Correction du Problème de Déploiement Cloudflare Pages

## ❌ Problème Identifié

**Date**: 17 décembre 2025  
**Dernière version déployée**: 20 novembre 2025 (commit `0489170`)  
**Statut**: Tous les déploiements depuis le 17 décembre échouent avec erreur 401

### Erreur Constatée

```
Cloudflare API returned non-200: 401
API returned: {"success":false,"errors":[{"code":10000,"message":"Authentication error"}]}
Error: Failed to get Pages project, API returned non-200
```

### Cause Racine

Le secret `CLOUDFLARE_API_TOKEN` configuré dans GitHub Actions est **invalide, expiré ou révoqué**.

Le workflow GitHub Actions lui-même est **correctement configuré** :
- ✅ Build réussit (`npm ci && npm run build`)
- ✅ Dossier `dist/` généré correctement
- ✅ Configuration du workflow valide
- ❌ Échec uniquement à l'étape de déploiement via l'API Cloudflare

---

## ✅ Solution - Mettre à Jour le Token Cloudflare

### Étape 1 : Générer un Nouveau Token API Cloudflare

1. Connectez-vous à votre compte [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Allez dans **My Profile** → **API Tokens**
3. Cliquez sur **Create Token**
4. Sélectionnez le template **Edit Cloudflare Workers** ou créez un token personnalisé
5. **Permissions requises** :
   - Account → Cloudflare Pages → **Edit**
6. Copiez le token généré (vous ne pourrez plus le voir après!)

### Étape 2 : Mettre à Jour le Secret GitHub

1. Allez sur votre dépôt GitHub: https://github.com/teetee971/akiprisaye-web
2. Allez dans **Settings** → **Secrets and variables** → **Actions**
3. Trouvez le secret `CLOUDFLARE_API_TOKEN`
4. Cliquez sur **Update** et collez le nouveau token
5. Sauvegardez

### Étape 3 : Vérifier l'Account ID

Vérifiez également que le secret `CLOUDFLARE_ACCOUNT_ID` est correct :

1. Dans Cloudflare Dashboard, allez sur **Pages** ou **Workers & Pages**
2. Dans la barre latérale, trouvez votre **Account ID** (en bas à droite de la page)
3. Vérifiez que c'est le même que dans GitHub Secrets

### Étape 4 : Déclencher un Nouveau Déploiement

Après avoir mis à jour les secrets, déclenchez un nouveau déploiement :

**Option A - Push un commit:**
```bash
git commit --allow-empty -m "test: trigger Cloudflare deployment"
git push origin main
```

**Option B - Réexécuter le workflow:**
1. Allez sur https://github.com/teetee971/akiprisaye-web/actions
2. Sélectionnez un workflow échoué récent
3. Cliquez sur **Re-run all jobs**

---

## 📊 Configuration Actuelle du Workflow

Le fichier `.github/workflows/deploy.yml` est correctement configuré :

```yaml
- name: Deploy to Cloudflare Pages
  uses: cloudflare/pages-action@v1
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}      # ← À mettre à jour
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}    # ← À vérifier
    projectName: akiprisaye-web
    directory: dist
    gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

**Secrets Requis:**
- `CLOUDFLARE_API_TOKEN` - Token API Cloudflare (À RÉGÉNÉRER)
- `CLOUDFLARE_ACCOUNT_ID` - ID de compte Cloudflare (À VÉRIFIER)
- `GITHUB_TOKEN` - Automatique (pas besoin de configurer)

---

## 🚀 Fonctionnement Attendu Après Correction

1. **Build automatique** : À chaque push sur `main`, GitHub Actions build l'application
2. **Déploiement Cloudflare** : Le dossier `dist/` est déployé sur Cloudflare Pages
3. **URL de production** : https://akiprisaye-web.pages.dev
4. **Vérification** : Le workflow doit se terminer avec succès (✅ vert)

---

## 📝 Logs de Diagnostic

Pour vérifier le déploiement :

1. Allez sur https://github.com/teetee971/akiprisaye-web/actions
2. Sélectionnez le dernier workflow "Deploy to Cloudflare Pages"
3. Vérifiez que toutes les étapes sont vertes :
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Build application
   - ✅ Deploy to Cloudflare Pages ← **Doit être vert après correction**

---

## ⚠️ Important

**NE PAS** :
- ❌ Committer le token API dans le code
- ❌ Partager le token publiquement
- ❌ Utiliser un token avec des permissions trop larges

**FAIRE** :
- ✅ Utiliser GitHub Secrets pour stocker le token
- ✅ Régénérer le token périodiquement
- ✅ Limiter les permissions au strict nécessaire (Pages Edit uniquement)

---

## 🔗 Ressources Utiles

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare API Tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [cloudflare/pages-action](https://github.com/cloudflare/pages-action)

---

**Date de création** : 17 décembre 2025  
**Auteur** : Copilot Coding Agent  
**Statut** : 🔴 ACTION REQUISE - L'utilisateur doit mettre à jour le token manuellement
