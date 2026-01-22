## ✅ Checklist de conformité – A KI PRI SA YÉ

Merci de valider **chaque point** avant soumission.  
Toute non-conformité entraînera le rejet automatique de la PR par la CI stricte (Codex Guard).

---

### 1️⃣ Qualité & CI technique
- [ ] Lint exécuté sans erreur (`npm run lint`)
- [ ] Aucun espace ou erreur dans le glob ESLint (`**/*.{ts,tsx,js,jsx}`)
- [ ] TypeScript strict activé (`noImplicitAny`, `noUnused*`)
- [ ] Build Cloudflare Pages compatible Node >=20.19 (`package.json → engines` vérifié)
- [ ] Tests unitaires exécutés localement ou en CI

---

### 2️⃣ Cohérence du modèle de données
- [ ] Un seul modèle `PriceObservation` unifié (`storeLabel`, `currency`, `confidenceScore`, `observationsCount`)
- [ ] Un seul modèle `TerritoryCode` utilisé (format ISO-like : `gp`, `mq`, `gf`, `re`, etc.)
- [ ] Tous les adaptateurs (`priceSearch`, `SignalementForm`, `territoryComparisonService`) synchronisés
- [ ] Aucune divergence entre les schémas de données (`priceSearch.service.ts`, `scanHubClassifier.ts`)

---

### 3️⃣ Sécurité & conformité RGPD
- [ ] Aucun texte OCR ou image brute stocké en clair dans `localStorage`
- [ ] Les logs console ne contiennent pas de texte OCR
- [ ] Les données sensibles sont chiffrées ou temporisées (TTL ou IndexedDB avec expiration)
- [ ] Les API externes (OpenFoodFacts, OpenPrices) affichent un message d’avertissement ou consentement
- [ ] Aucune donnée utilisateur n’est transmise sans consentement explicite

---

### 4️⃣ Performance & accessibilité
- [ ] Pas de chargement complet de `/data/prices.json` sans pagination
- [ ] Caching ou indexation activée pour `priceObservationService`
- [ ] Accessibilité conforme WCAG 2.1 (labels, ARIA, contrastes)
- [ ] Poids total build ≤ 1.2 MB (scripts ≤ 350 KB, images ≤ 500 KB)

---

### 5️⃣ Conformité générale & documentation
- [ ] README mis à jour avec les modèles normalisés
- [ ] Changelog ou release note ajoutée (`vX.Y.Z`)
- [ ] Aucune dépendance non autorisée ajoutée
- [ ] Audit de sécurité npm (`npm audit`) exécuté sans vulnérabilité critique

---

**Dernière validation manuelle**
- [ ] CI Codex Guard ✅
- [ ] Cloudflare Pages preview ✅
- [ ] Vérification visuelle post-déploiement ✅
