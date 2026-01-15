# Architecture Séparation Assets — Marketing / CDN / Dépôt

## 🎯 Principe de Base

**Ce dépôt Git contient UNIQUEMENT le code applicatif.**  
**Les assets marketing/lourds doivent être sur CDN (Cloudflare R2).**

## 📁 Structure Recommandée

### ✅ Dans le Dépôt Git (ICI)

```
/src                    # Code source React/Vue
/public                 # Assets légers nécessaires au build
  /assets               # Icons, logos essentiels (<100KB)
  /icons                # Favicons, PWA icons
  manifest.webmanifest
  robots.txt
index.html
package.json
vite.config.js
.gitignore
.github/
```

**Règles:**
- ✅ Code source uniquement
- ✅ Assets légers essentiels au fonctionnement
- ✅ Configuration build/déploiement
- ❌ AUCUNE image marketing
- ❌ AUCUN fichier lourd (>100KB par fichier)

### ☁️ Sur CDN (Cloudflare R2 ou équivalent)

```
/marketing              # Tout le contenu marketing
  /hero                 # Images hero de la homepage
  /social               # Images pour réseaux sociaux
  /presse               # Dossier de presse
  /banners              # Bannières publicitaires
  /screenshots          # Captures d'écran app
  /mockups              # Mockups design

/media                  # Contenus multimédia
  /videos               # Vidéos promotionnelles
  /animations           # GIFs, animations

/docs                   # Documentation externe
  /guides               # Guides utilisateur PDF
  /presentations        # Présentations PowerPoint
```

**Avantages:**
- ✅ Pas de pollution Git
- ✅ Cache CDN optimal
- ✅ Build rapide
- ✅ Déploiement léger
- ✅ Bande passante gratuite (Cloudflare)

### 📦 Dépôt Marketing Séparé (OPTIONNEL mais PRO)

Créer: `akiprisaye-marketing-assets` (dépôt séparé)

```
/design-sources         # Fichiers Figma, PSD, AI
/exports                # Exports optimisés pour CDN
/brand-guidelines       # Charte graphique
/templates              # Templates réutilisables
```

**Workflow:**
1. Designers travaillent dans `akiprisaye-marketing-assets`
2. Export automatique vers Cloudflare R2
3. Application référence les URLs CDN
4. Zéro impact sur le dépôt applicatif

## 🔒 Gardes-Fous Mis en Place

### 1. CI Guard (`.github/workflows/repo-guard.yml`)

**Bloque automatiquement:**
- Extensions interdites: `.psd`, `.ai`, `.fig`, `.sketch`, `.zip`, `.mp4`
- Dossiers interdits: `backup/`, `old/`, `archive/`, `export/`
- Fichiers marketing à la racine
- Pointeurs Git LFS

**Déclenchement:** Sur chaque PR et push vers `main`

### 2. Script de Nettoyage (`scripts/clean-repo.sh`)

**Usage:**
```bash
# Analyse sans modification
bash scripts/clean-repo.sh

# Nettoyage automatique
bash scripts/clean-repo.sh --force
```

**Supprime automatiquement:**
- Dossiers obsolètes
- Fichiers avec extensions interdites
- Assets marketing mal placés

### 3. `.gitignore` Renforcé

**Bloque préventivement:**
- Fichiers design sources (`.psd`, `.ai`, `.fig`, `.sketch`)
- Archives (`.7z`, déjà `.zip`, `.rar`)
- Vidéos (`.mp4`, `.mov`, `.avi`, `.mkv`)
- Dossiers temporaires
- Patterns marketing à la racine

## 🌍 Utilisation des Assets CDN

### Dans le Code

**❌ MAUVAIS (référence locale):**
```html
<img src="/hero-homepage.png" alt="Hero" />
```

**✅ BON (référence CDN):**
```html
<img src="https://cdn.akiprisaye.com/marketing/hero-homepage.webp" alt="Hero" />
```

### Configuration CDN Cloudflare R2

1. **Créer un bucket R2:**
   - Nom: `akiprisaye-assets`
   - Public access: Activé

2. **Configurer un custom domain:**
   - `cdn.akiprisaye.com` → R2 bucket

3. **Upload des assets:**
   ```bash
   wrangler r2 object put akiprisaye-assets/marketing/hero.webp --file hero.webp
   ```

4. **Dans l'application:**
   ```javascript
   const CDN_BASE = 'https://cdn.akiprisaye.com';
   const heroImage = `${CDN_BASE}/marketing/hero-homepage.webp`;
   ```

## 📊 Avantages de cette Architecture

### Performance
- ⚡ Clone Git ultra-rapide (< 50MB)
- ⚡ Build Vite optimisé (pas d'assets lourds)
- ⚡ Cache CDN global
- ⚡ Lazy loading natif

### Maintenance
- 🧹 Dépôt propre et lisible
- 🧹 Historique Git léger
- 🧹 CI/CD rapides
- 🧹 Reviews facilitées

### Coûts
- 💰 Cloudflare R2: Gratuit jusqu'à 10GB
- 💰 Bande passante CDN: Gratuite
- 💰 Pas de quota Git LFS
- 💰 Build minutes économisés

### Sécurité
- 🔒 Pas de LFS = pas de vulnérabilité
- 🔒 Séparation claire assets/code
- 🔒 Gardes-fous automatiques
- 🔒 Impossible de polluer accidentellement

## 🚀 Migration des Assets Existants

Si vous avez des assets marketing actuellement dans le dépôt:

1. **Identifier les fichiers:**
   ```bash
   bash scripts/clean-repo.sh
   ```

2. **Sauvegarder localement:**
   ```bash
   mkdir -p /tmp/akiprisaye-marketing
   cp -r marketing-images/ /tmp/akiprisaye-marketing/
   ```

3. **Upload vers R2:**
   ```bash
   wrangler r2 object put akiprisaye-assets/marketing/ \
     --file /tmp/akiprisaye-marketing/ --recursive
   ```

4. **Mettre à jour les références:**
   ```bash
   # Remplacer les URLs locales par CDN
   grep -r "/hero-" src/
   # Éditer pour pointer vers https://cdn.akiprisaye.com/
   ```

5. **Nettoyer le dépôt:**
   ```bash
   bash scripts/clean-repo.sh --force
   git commit -m "chore: migration assets vers CDN"
   ```

## 🔧 Maintenance Continue

### Hebdomadaire
- Vérifier la taille du dépôt
- Lancer `scripts/clean-repo.sh` si besoin

### Mensuel
- Audit des assets CDN
- Optimisation des images
- Nettoyage cache CDN si nécessaire

### Lors d'un nouveau feature
- **Avant:** Vérifier si nouveaux assets
- **Si oui:** Upload vers CDN d'abord
- **Code:** Référencer URL CDN uniquement
- **CI:** Passera automatiquement

## ✅ Checklist Avant Chaque PR

- [ ] Aucun fichier `.psd`, `.ai`, `.fig`, `.sketch`
- [ ] Aucun fichier `.mp4`, `.mov`
- [ ] Aucune archive `.zip`, `.rar`, `.7z`
- [ ] Aucun dossier `backup/`, `old/`, `archive/`
- [ ] Assets marketing sur CDN uniquement
- [ ] CI Guard passe ✓

## 📚 Ressources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Guide Optimisation Images](https://developers.cloudflare.com/images/)

---

**Dernière mise à jour:** 2026-01-03  
**Responsable:** Équipe DevOps A KI PRI SA YÉ
