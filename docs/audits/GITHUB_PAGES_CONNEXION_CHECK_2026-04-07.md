# Vérification URL GitHub Pages `/connexion` — 2026-04-07

URL demandée:

- `https://teetee971.github.io/akiprisaye-web/connexion`

## Résultat depuis cet environnement

- Vérification HTTP impossible depuis ce runner: `CONNECT tunnel failed, response 403`.
- Le même blocage apparaît aussi sur:
  - `https://teetee971.github.io/akiprisaye-web/`
  - `https://teetee971.github.io/akiprisaye-web/404.html`

## Interprétation

- Le blocage est **réseau/proxy du runner**, pas une preuve de panne de la route `/connexion` côté GitHub Pages.

## Vérification à exécuter hors runner (machine locale/CI autorisée)

```bash
curl -I -L https://teetee971.github.io/akiprisaye-web/connexion
curl -I -L https://teetee971.github.io/akiprisaye-web/
```

Attendu pour une SPA GitHub Pages:
- soit un `200` direct,
- soit un fallback servi via `404.html` avec boot React fonctionnel.
