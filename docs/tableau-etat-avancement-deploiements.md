# Tableau de l'état d'avancement des déploiements

> Dernière mise à jour : **2026-04-02**

## Vue d'ensemble

| Domaine | Indicateur | Statut | Détail / Source | Prochaine action |
|---|---|---|---|---|
| Branche de référence | `main` défini comme branche de déploiement | ✅ | Le runbook indique un déploiement automatique à chaque merge sur `main`. | Maintenir la règle de merge protégée. |
| Cible publique principale | GitHub Pages | ✅ | URL publique documentée : `https://teetee971.github.io/akiprisaye-web/`. | Vérifier l'URL après chaque release majeure. |
| Cible secondaire | Cloudflare Pages | ✅ | Pipeline Cloudflare documenté dans la CI/CD du projet. | Continuer les validations conditionnelles preview/prod. |
| Validation post-déploiement | Script de validation live | ✅ | `scripts/validate-deployment.mjs` et wrapper shell disponibles. | Exécuter à chaque incident/rollback. |
| Contrôle état GitHub/Pages | Rapport d'état déploiement | ✅ | `scripts/deployment-state-report.mjs` disponible pour audit `main` vs Pages. | Lancer avant release sensible. |
| Rollback | Procédure automatisée | ✅ | Runbook + script `scripts/rollback-deployment.sh`. | Tester la procédure en exercice contrôlé trimestriel. |
| Checklist opérationnelle | Checklists de readiness | ✅ | `docs/deployment-readiness-checklist.md` et `docs/deployment.md`. | Conserver ces checklists à jour par version. |
| Troubleshooting | Guide d'incident | ✅ | `docs/DEPLOYMENT_TROUBLESHOOTING.md` centralise les cas de panne. | Ajouter les nouveaux incidents après postmortem. |

## Tableau de suivi par exécution (à renseigner en continu)

| Date (UTC) | Environnement | Commit / Tag | Pipeline | Validation live | Décision |
|---|---|---|---|---|---|
| 2026-04-02 | Production (GitHub Pages) | _à renseigner_ | _à renseigner_ | _à renseigner_ | _à renseigner_ |
| 2026-04-02 | Production (Cloudflare Pages) | _à renseigner_ | _à renseigner_ | _à renseigner_ | _à renseigner_ |

## Règle de lecture rapide

- ✅ **Vert**: prêt / validé / opérationnel.
- 🟡 **Orange**: partiellement validé, action requise.
- 🔴 **Rouge**: bloquant production.
- ⚪ **N/A**: non applicable au périmètre.

## Commandes utiles

```bash
node scripts/deployment-state-report.mjs
node scripts/production-readiness-check.mjs
node scripts/validate-deployment.mjs https://teetee971.github.io/akiprisaye-web/
```
