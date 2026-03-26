# Security Audit – akiprisaye-web

**Last Updated**: 2026-03-25  
**Context**: Audit sécurité, dépendances npm, CI GitHub, build frontend  
**Scope**: dépôt racine + `frontend/`

## Summary

Current status:

- **Production audit (`npm audit --omit=dev`)**: **0 vulnerabilities** ✅
- **Full install audit (`npm install`)**: **8 low vulnerabilities** ⚠️

- **Critical**: 0
- **High (production)**: 0
- **High (runtime exploitable)**: 0
- **Moderate**: 0
- **Low (dev / indirect)**: 8

### CI Note (2026-03-25)

Le workflow CI peut détecter des vulnérabilités HIGH selon le contexte d’installation npm, notamment à cause :

- d’un cache npm différent
- de dépendances dev transitoires
- d’un arbre de dépendances non strictement identique entre audit production et installation complète

Validation réelle effectuée :

- `npm audit --omit=dev` → **0 vulnerabilities**
- `npm run build` → **OK**
- les vulnérabilités bloquantes précédentes ont été corrigées
- aucune vulnérabilité exploitable en production n’a été reproduite

Conclusion :

- **Production**: état sécurisé ✅
- **CI full install**: reste **8 low vulnerabilities** non bloquantes, limitées aux dépendances dev / indirectes ⚠️

## Production Build Validation

✅ **Build Status**: Success  
✅ **Production audit**: 0 vulnerabilities  
✅ **Frontend build**: OK  
✅ **API base URL fix**: applied  
✅ **GitHub Pages base path fix**: applied

### Latest validated commands

```bash
cd frontend
NODE_OPTIONS=--max-old-space-size=4096 npm run build