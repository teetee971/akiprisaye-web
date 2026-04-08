# État des modules — 2026-04-07

Question: **« Tous les modules sont-ils branchés et fonctionnels ? »**

## Résultat global (après correctifs)

- **Oui** : tous les checks de santé configurés passent.
- Le gisement est **prêt côté checks locaux** (`verify:modules`).

## Checks exécutés

1. `npm --prefix backend run -s typecheck` ✅
2. `npm --prefix price-api run -s typecheck` ✅
3. `npm --prefix functions run -s build` ✅
4. `npm --prefix frontend run -s typecheck` ✅
5. `npm --prefix frontend run -s test:ci` ✅
6. `npm run verify:modules` ✅

## Correctifs appliqués

- `frontend/src/pages/Home.tsx`
  - suppression du conflit de nom `useApp` (import unique depuis `AppContext`)
  - destructuration correcte de `useApp()` (`products`, `loading`, `error`, `reloadProducts`)
  - formulaire de recherche reconnecté à `handleSearch`
  - ancre test “voir toute la page d’accueil” rendue accessible pour les tests

- `frontend/src/pages/EspaceCreateur.tsx`
  - guard `typeof window !== 'undefined'` ajouté autour des accès navigateur
  - protection de `window.location.reload()`
  - guard ajouté avant scan predator pour éviter les erreurs en environnement test

## Conclusion

La commande ci-dessous retourne maintenant bien `All module checks passed`.

```bash
npm run verify:modules
```
