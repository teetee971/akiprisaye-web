# Contribuer à A KI PRI SA YÉ

Merci de votre contribution.

## Pré-requis

- Node.js `>=20.19.0`
- npm

## Installation

```bash
npm ci
```

## Vérifications avant PR

```bash
npm run lint
npm run typecheck
npm run build
cd frontend && npm run test:ci -- scripts/ci-workflows.test.ts
```

## Références

- Standards de revue : `docs/CODE_REVIEW.md`
- Politique CI : `docs/CI_POLICY.md`
- Documentation principale : `README.md`
