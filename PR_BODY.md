```markdown
Title: Fix mobile floating action buttons overlap + graceful geolocation error handling and docs

- Problème : sur mobile, les boutons flottants (chat / panier) masquent des éléments interactifs et la géolocalisation peut être bloquée par Permissions-Policy.
- Changements :
  - Ajout d’un composant React `FloatingActions` et du CSS `floating-actions.css`.
  - Ajout d’un utilitaire `requestGeolocation(showMessage)` pour des messages utilisateur clairs.
  - Composant `LocationButton` d’exemple pour le bouton "Activer ma position".
  - `DEPLOYMENT_NOTES.md` : instructions pour corriger l’en‑tête Permissions‑Policy ou l’attribut `allow` sur une iframe.
- Tests : voir DEPLOYMENT_NOTES.md.
- Remarque : icônes placeholders (emoji) — remplacer par les SVG/icônes du projet pour la cohérence visuelle.
```