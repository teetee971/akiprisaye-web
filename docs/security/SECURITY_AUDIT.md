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
- **High (runtime exploitable in production)**: 0
- **Moderate**: 0
- **Low (dev / indirect)**: 8

## Current Security Position

The current repository state is considered **production-safe** for the frontend runtime.

### Verified locally on 2026-03-25

From the repository root:

```bash
rm -rf node_modules package-lock.json
npm install
npm audit --omit=dev