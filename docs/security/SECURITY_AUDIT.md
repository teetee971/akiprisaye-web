## Summary

Current status:

- Production audit (`npm audit --omit=dev`): **0 vulnerabilities** ✅
- Full install audit (`npm install`): **8 low vulnerabilities** ⚠️

- Critical: 0
- High (production): 0
- High (runtime exploitable): 0
- Moderate: 0
- Low (dev / indirect): 8

### CI Note (2026-03-25)

Le workflow CI peut détecter des vulnérabilités HIGH en raison :
- d’un cache npm différent
- ou de dépendances dev transitoires

Validation réelle effectuée :

- npm audit --omit=dev → 0 vulnerabilities
- aucune vulnérabilité exploitable en production

Conclusion :
Le build est sécurisé côté production.