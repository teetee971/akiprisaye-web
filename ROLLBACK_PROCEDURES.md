# 🔄 Procédures de Rollback

## Vue d'ensemble

Ce document détaille les procédures de rollback automatiques et manuelles pour les déploiements de **A KI PRI SA YÉ**.

## 🤖 Rollback Automatique

### Déclenchement
Le rollback automatique se déclenche dans les cas suivants:
- ❌ La validation post-déploiement échoue
- ❌ Les routes critiques ne répondent pas
- ❌ Le contenu attendu n'est pas présent
- ❌ La page Vite par défaut est détectée

### Processus Automatique

```
Échec Validation → Rollback Job → Identification Dernier Bon → Log Incident → Notification
```

Le script `scripts/rollback-deployment.sh` est exécuté automatiquement:

1. **Identification** - Trouve le dernier déploiement stable
2. **Logging** - Enregistre l'incident dans `/tmp/rollback.log`
3. **Notification** - Alerte l'équipe admin (placeholder)
4. **Instructions** - Fournit les étapes manuelles si nécessaire

### Logs de Rollback

Chaque rollback génère une entrée JSON:
```json
{
  "timestamp": "2026-02-07T18:45:00Z",
  "deployment_id": "abc123",
  "project": "akiprisaye-web",
  "reason": "Post-deployment validation failed"
}
```

## 👤 Rollback Manuel

### Quand Utiliser le Rollback Manuel?
- Le rollback automatique a échoué
- Détection tardive d'un problème en production
- Décision business de revenir à une version antérieure
- Test d'une version spécifique

### Procédure via Cloudflare Dashboard

#### Étape 1: Accéder aux Déploiements
```
1. Ouvrir https://dash.cloudflare.com
2. Sélectionner votre compte
3. Pages → akiprisaye-web
4. Onglet "Deployments"
```

#### Étape 2: Identifier la Version Stable
```
1. Chercher un déploiement avec status "Success"
2. Vérifier la date/heure de déploiement
3. Vérifier le commit SHA
4. Noter l'URL de preview si disponible
```

#### Étape 3: Exécuter le Rollback
```
1. Cliquer sur les "..." du déploiement cible
2. Sélectionner "Rollback to this deployment"
3. Confirmer l'action
4. Attendre la propagation (1-2 minutes)
```

#### Étape 4: Vérifier le Rollback
```bash
# Vérifier que le site est opérationnel
curl -I https://akiprisaye.pages.dev/

# Vérifier la version
curl -s https://akiprisaye.pages.dev/version.json | jq

# Tester les routes critiques
./scripts/post-deploy-validation.sh https://akiprisaye.pages.dev
```

### Procédure via Script

```bash
# Avec ID de déploiement spécifique
export CLOUDFLARE_API_TOKEN="your-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
./scripts/rollback-deployment.sh <deployment-id>

# Sans ID (utilise le dernier déploiement stable)
./scripts/rollback-deployment.sh
```

### Procédure via Git + Redéploiement

Si les options précédentes échouent:

```bash
# 1. Identifier le dernier commit stable
git log --oneline --graph main

# 2. Créer une branche de rollback
git checkout -b rollback/emergency-fix <commit-sha>

# 3. Pousser vers main (si autorisé)
git push origin rollback/emergency-fix:main --force

# OU créer une PR de rollback
git push origin rollback/emergency-fix
# Puis créer une PR vers main
```

⚠️ **Attention:** Le force push sur main doit être une dernière option et nécessite des permissions spéciales.

## 🔍 Vérification Post-Rollback

Après tout rollback, exécuter ces vérifications:

### 1. Status HTTP
```bash
curl -I https://akiprisaye.pages.dev/
# Attendu: HTTP/2 200
```

### 2. Contenu
```bash
curl -s https://akiprisaye.pages.dev/ | grep "A KI PRI SA YÉ"
# Attendu: Ligne trouvée
```

### 3. Routes Critiques
```bash
for route in "" "comparateur" "scanner" "carte" "alertes"; do
  echo "Testing /$route"
  curl -I https://akiprisaye.pages.dev/$route
done
```

### 4. Service Worker
```bash
curl -I https://akiprisaye.pages.dev/service-worker.js
# Attendu: HTTP/2 200
```

### 5. Assets
```bash
# Télécharger index.html et vérifier les assets
curl -s https://akiprisaye.pages.dev/ > /tmp/index.html
grep -o '/assets/[^"]*' /tmp/index.html | while read asset; do
  curl -I "https://akiprisaye.pages.dev$asset"
done
```

## 📊 Analyse Post-Incident

Après un rollback, suivre ces étapes:

### 1. Identifier la Cause
- Consulter les logs GitHub Actions du déploiement échoué
- Vérifier les erreurs dans la console navigateur
- Vérifier les erreurs réseau (onglet Network)
- Examiner les diffs Git du commit problématique

### 2. Documenter l'Incident
Créer un rapport d'incident avec:
```markdown
## Incident Report

**Date:** YYYY-MM-DD HH:MM UTC
**Durée:** XX minutes
**Impact:** [Description]
**Cause:** [Cause racine]
**Résolution:** [Actions prises]
**Prévention:** [Mesures futures]
```

### 3. Corriger le Problème
- Créer une branche de fix
- Appliquer les corrections nécessaires
- Tester localement avec tous les scripts de validation
- Créer une PR avec description détaillée
- Attendre validation pipeline complet

### 4. Redéployer
- Merger la PR de fix
- Surveiller le déploiement automatique
- Vérifier que la validation post-deploy passe
- Confirmer que le site est opérationnel

## 🚨 Situations d'Urgence

### Site Complètement Cassé
```bash
# Rollback immédiat via Cloudflare Dashboard
# OU force push du dernier commit stable
git push origin <last-good-commit-sha>:main --force
```

### Assets Manquants (404)
```bash
# 1. Rollback immédiat
# 2. Vérifier vite.config.ts
# 3. Vérifier que tous les assets sont dans public/
# 4. Rebuild et redéployer
```

### Erreurs JavaScript
```bash
# 1. Rollback immédiat
# 2. Vérifier la console navigateur
# 3. Vérifier les imports dans le code
# 4. Tester en local
# 5. Fix et redéployer
```

### Service Worker Problématique
```bash
# 1. Rollback immédiat
# 2. Vérifier frontend/public/service-worker.js
# 3. Vérifier la version du cache
# 4. Tester en mode incognito
# 5. Fix et redéployer
```

## 📞 Contacts d'Urgence

En cas de rollback critique:
1. **Admin GitHub**: Consulter les logs Actions
2. **Cloudflare Support**: Pour problèmes de déploiement
3. **Équipe DevOps**: Pour assistance technique

## 🔗 Liens Utiles

- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **GitHub Actions**: https://github.com/teetee971/akiprisaye-web/actions
- **Documentation Pipeline**: CI_CD_DOCUMENTATION.md
- **Scripts de Validation**: `/scripts/`

## 📝 Checklist de Rollback

Avant de considérer un rollback comme terminé:

- [ ] Site accessible (HTTP 200)
- [ ] Contenu attendu présent
- [ ] Routes critiques fonctionnelles
- [ ] Assets chargent correctement
- [ ] Service Worker opérationnel
- [ ] Pas d'erreurs console
- [ ] Version.json correspond au déploiement
- [ ] Incident documenté
- [ ] Équipe notifiée
- [ ] Cause identifiée
- [ ] Plan de correction établi

---

**Version:** 1.0  
**Dernière mise à jour:** 2026-02-07  
**Équipe:** DevOps - A KI PRI SA YÉ
