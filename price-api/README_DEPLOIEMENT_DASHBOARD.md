# Déploiement depuis Cloudflare Dashboard

1. Dans **Workers & Pages > votre Worker**, collez le contenu de `src/index.ts` (et les imports compilés si vous déployez en JS bundlé), puis vérifiez que les variables PayPal et le binding D1 **PRICE_DB** sont configurés.
2. Dans **D1 > votre base > Console**, exécutez les migrations SQL (incluant `migrations/0008_create_subscriptions.sql`).
3. Déployez la nouvelle version, puis testez `GET /health` et `POST /v1/webhooks/paypal` pour valider `ok`, `paypal_env` et la journalisation/synchro D1.
