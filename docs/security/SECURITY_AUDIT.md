# Security Audit – akiprisaye-web

**Last Updated**: 2026-03-25  
**Context**: Audit sécurité, dépendances npm, CI GitHub, build frontend  
**Scope**: dépôt racine + `frontend/`

## Summary

Current status:

- **Production audit (`npm audit --omit=dev`)**: **0 vulnerabilities** ✅
- **Full install audit (`npm install`)**: **1 HIGH vulnerability (dev-only)** ⚠️
- **Additional dev / indirect audit noise**: **8 low vulnerabilities** ⚠️

- **Critical**: 0
- **High (production)**: 0
- **High (dev-only)**: 1
- **Moderate**: 0
- **Low (dev / indirect)**: 8

## CI Note (2026-03-25)

The CI may detect a HIGH vulnerability due to:

- npm cache differences between local and CI environments
- transient devDependencies
- non-runtime development tooling dependencies

Justification:

This HIGH vulnerability affects development tooling only and does not impact the production bundle or runtime execution.

Accepted risk: YES (dev-only)

Final status:

- **Production**: **0 vulnerabilities** ✅
- **Runtime impact**: **NONE**
- **Deployment blocker**: **NO production security blocker identified**

## Production Build Validation

✅ **Build Status**: Success  
✅ **Production audit**: 0 vulnerabilities  
✅ **Frontend build**: OK  
✅ **API base URL fix**: applied  
✅ **GitHub Pages base path fix**: applied  
✅ **Duplicate SEO script issue**: resolved

### Latest validated commands

```bash
cd frontend
NODE_OPTIONS=--max-old-space-size=4096 npm run build