## Description

Amélioration de l'expérience utilisateur du scanner de code-barres avec :
- États explicites du scanner (idle, scanning, processing, success, not_found, error, permission_denied)
- Panneau de paramètres pour configurer le timeout et le comportement en cas de produit non trouvé
- Gestion améliorée des fallbacks et des timeouts
- Préparation pour l'intégration d'une librairie de détection plus performante

## Checklist

- [ ] Ajouter `src/types/scan.ts`
- [ ] Mettre à jour `src/components/BarcodeScanner.jsx`
- [ ] Mettre à jour `src/pages/Scanner.jsx`
- [ ] Mettre à jour `src/pages/ScanOCR.jsx`
- [ ] Ajouter/mettre à jour tests
- [ ] Build & lint passés
- [ ] Ajout de la documentation / captures d'écran
- [ ] Demande de revue et lien vers #570

## Références

- PR/Issue d'origine: #570
- Commit de contexte: `dc808867fc5f58f304b0e7d84e19efff9284ea0c`

## Tests

Vérifier que :
1. Le scanner affiche les états appropriés (idle, scanning, not_found, etc.)
2. Le panneau de paramètres permet de configurer le timeout
3. Le comportement en cas de timeout peut être configuré
4. Les tests passent (`npm test`)
5. Le build réussit (`npm run build`)
6. Le linting est propre (`npm run lint`)

## Notes de développement

- Les fichiers .jsx sont conservés (pas de migration vers .tsx)
- Les TODOs sont inclus pour l'intégration future d'une librairie de détection plus performante
- Les data-testid sont ajoutés aux boutons principaux pour faciliter les tests
