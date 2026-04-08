# Clean build for repo — checklist opérationnelle

Date: 2026-04-07

## Commandes standardisées

### Vérification complète (recommandée)

```bash
npm run clean-build:repo
```

Cette commande exécute:

1. installation front (`npm ci --include=dev`)
2. lint (`npm run lint`)
3. tests front (`npm run test`)
4. build production front (`npm run build`)
5. smoke preview (`node scripts/smoke-preview.mjs`)
6. audit dépendances runtime (`npm run audit`)

### Vérification complète tolérante réseau (CI/dev dégradé)

```bash
npm run clean-build:repo:network-tolerant
```

Utiliser cette variante quand le registry npm est temporairement indisponible (erreurs 503 DNS/registry sur `npm audit`).

### Vérification rapide avant commit

```bash
npm run clean-build:quick
```

Cette commande exécute:

1. installation front
2. lint
3. smoke test Home ciblé
4. build front

## Points à vérifier pour un repo “clean”

- ✅ `npm run lint` ne retourne aucune erreur.
- ✅ `npm run test` passe (hors tests explicitement skip).
- ✅ `npm run build` génère `frontend/dist` sans erreur.
- ✅ `node scripts/smoke-preview.mjs` confirme le chargement des routes clés.
- ⚠️ `npm run audit` peut retourner des vulnérabilités transitives; suivre et corriger selon sévérité.

## Critères de sortie conseillés

Un “clean-build-for-repo” est validé si:

- lint + tests + build + smoke sont verts,
- aucune vulnérabilité `high` ou `critical` en runtime,
- et les régressions UX bloquantes connues sont fermées.
