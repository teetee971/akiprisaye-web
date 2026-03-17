# Guide de démarrage — Propriétaire / Créateur

> Ce guide s'adresse exclusivement au propriétaire du projet `a-ki-pri-sa-ye`.
> Il décrit les 4 étapes pour avoir accès à la **totalité du logiciel** depuis n'importe quel appareil.

---

## Résumé (4 étapes)

| # | Étape | Durée | Prérequis |
|---|-------|-------|-----------|
| 1 | Créer un compte Firebase | 1 min | Application en ligne |
| 2 | Activer le rôle Créateur | 5 min | Clé Admin Firebase |
| 3 | Activer la connexion Google | 2 min | Firebase Console |
| 4 | Accéder à l'Espace Créateur | 30 s | Étapes 1 + 2 |

---

## Étape 1 — Créer votre compte Firebase

**Si vous n'avez pas encore de compte dans l'application :**

1. Ouvrez l'application : [https://teetee971.github.io/akiprisaye-web/inscription](https://teetee971.github.io/akiprisaye-web/inscription)
2. Renseignez votre email et un mot de passe (minimum 6 caractères)
3. Cliquez **"Créer un compte"**
4. Vérifiez votre email et cliquez le lien de vérification reçu

> ✅ Après inscription, vous avez le rôle **"citoyen"** (accès basique). L'étape 2 vous donne l'accès complet.

---

## Étape 2 — Activer le rôle Créateur

Le rôle `creator` donne accès à :
- Toutes les fonctionnalités sans limite
- L'interface d'administration (`/admin`, `/admin/users`, etc.)
- L'Espace Créateur (`/espace-createur`)
- L'API complète

### 🟢 Option A — GitHub Actions (sans PC, depuis téléphone)

> **Recommandé** — aucune installation locale nécessaire.

**Pré-requis :** télécharger la clé Admin Firebase une seule fois.

1. Téléchargez la clé Admin :
   - Ouvrez : [https://console.firebase.google.com/project/a-ki-pri-sa-ye/settings/serviceaccounts/adminsdk](https://console.firebase.google.com/project/a-ki-pri-sa-ye/settings/serviceaccounts/adminsdk)
   - Compte : `firebase-adminsdk-fbsvc@a-ki-pri-sa-ye.iam.gserviceaccount.com`
   - Cliquez **"Générer une nouvelle clé privée"** → confirmez → le fichier JSON se télécharge

2. Ajoutez le secret GitHub :
   - [https://github.com/teetee971/akiprisaye-web/settings/secrets/actions/new](https://github.com/teetee971/akiprisaye-web/settings/secrets/actions/new)
   - **Nom :** `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Valeur :** collez le contenu JSON intégral du fichier téléchargé

3. Déclenchez le workflow :
   - [https://github.com/teetee971/akiprisaye-web/actions/workflows/set-creator-role.yml](https://github.com/teetee971/akiprisaye-web/actions/workflows/set-creator-role.yml)
   - Cliquez **"Run workflow"** → entrez votre email → **"Run workflow"**
   - Attendez l'icône ✅ verte (≈ 30 secondes)

4. Reconnectez-vous à l'application → rôle Créateur actif ✨

---

### 🔵 Option B — Terminal PC (dépôt cloné)

```bash
# 1. Placez serviceAccountKey.json à la racine du dépôt
# 2. Lancez depuis la racine du dépôt :
npm install
node scripts/set-creator-role.mjs votre@email.com
```

> ⚠️ Ne commitez jamais `serviceAccountKey.json` — il est dans `.gitignore`.

---

### 🟣 Option C — Termux (Android, sans PC)

```bash
# Dans Termux :
termux-setup-storage           # si pas encore fait
cd ~/downloads                 # serviceAccountKey.json doit être ici
curl -fsSL https://raw.githubusercontent.com/teetee971/akiprisaye-web/main/scripts/set-creator-role.mjs -o set-creator-role.mjs
npm install firebase-admin && node set-creator-role.mjs votre@email.com
```

---

## Étape 3 — Activer la connexion Google (optionnel)

> La connexion par **email/mot de passe** fonctionne sans cette étape.
> Cette étape est uniquement nécessaire pour le bouton **"Continuer avec Google"**.

**Dans Firebase Console :**

1. Ouvrez : [https://console.firebase.google.com/project/a-ki-pri-sa-ye/authentication/settings](https://console.firebase.google.com/project/a-ki-pri-sa-ye/authentication/settings)
2. Onglet **"Authorized domains"**
3. Cliquez **"Add domain"**
4. Entrez : `teetee971.github.io`
5. Confirmez

> Une fois ce domaine ajouté, le bouton Google sur `/connexion` sera pleinement fonctionnel.

**Vérifier que le fournisseur Google est activé :**
- Firebase Console → [Authentication → Sign-in method](https://console.firebase.google.com/project/a-ki-pri-sa-ye/authentication/providers)
- "Google" doit être **activé** (vert)

---

## Étape 4 — Accéder à l'Espace Créateur

Une fois le rôle Créateur activé et votre session renouvelée :

- **Espace Créateur :** [https://teetee971.github.io/akiprisaye-web/espace-createur](https://teetee971.github.io/akiprisaye-web/espace-createur)
- **Admin Dashboard :** [https://teetee971.github.io/akiprisaye-web/admin](https://teetee971.github.io/akiprisaye-web/admin)
- **Gestion utilisateurs :** [https://teetee971.github.io/akiprisaye-web/admin/users](https://teetee971.github.io/akiprisaye-web/admin/users)

Votre avatar affiche **✨ doré** (rôle Créateur).

---

## Aide rapide depuis l'application

La page [/activation-createur](https://teetee971.github.io/akiprisaye-web/activation-createur) reproduit ce guide directement dans l'interface, avec votre email pré-rempli dans les commandes. Elle est accessible à tout utilisateur authentifié.

Un lien **"✨ Vous êtes le propriétaire ? Activez votre accès Créateur →"** est visible sur la page `/connexion` après avoir renseigné votre email.

---

## Résolution de problèmes

| Symptôme | Cause probable | Solution |
|----------|---------------|----------|
| `API_KEY_INVALID` sur `/connexion` | Mauvais secret `VITE_FIREBASE_API_KEY` | Vérifier le secret dans GitHub Actions |
| `auth/unauthorized-domain` | Domaine GitHub Pages non autorisé | Ajouter `teetee971.github.io` dans Firebase Auth |
| `auth/operation-not-allowed` | Fournisseur non activé | Firebase Console → Authentication → Sign-in method |
| Rôle reste "citoyen" après le script | Cache session | Se déconnecter et se reconnecter |
| `/espace-createur` redirige vers `/` | Rôle non encore "creator" | Exécuter `set-creator-role.mjs` puis se reconnecter |

---

## Références

- Script d'activation : [`scripts/set-creator-role.mjs`](../scripts/set-creator-role.mjs)
- Workflow GitHub Actions : [`.github/workflows/set-creator-role.yml`](../.github/workflows/set-creator-role.yml)
- Politique de sécurité : [`SECURITY.md`](../SECURITY.md)
- Postmortem Firebase key : [`docs/FIREBASE_INCIDENT_POSTMORTEM.md`](FIREBASE_INCIDENT_POSTMORTEM.md)
