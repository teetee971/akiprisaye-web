# Résumé — Branche Bugfix `fix/mobile-oauth-callback-and-receipt-ocr`

> Commit pivot : `eb0e891b`
> Branche : `fix/mobile-oauth-callback-and-receipt-ocr`
>
> Pour créer cette branche sur GitHub depuis la racine du dépôt :
> ```bash
> git push origin eb0e891b:refs/heads/fix/mobile-oauth-callback-and-receipt-ocr
> ```

---

## Fichiers modifiés (4 fichiers)

| Fichier | Nature de la modification |
|---------|---------------------------|
| `frontend/public/_headers` | Ajout `Content-Type: application/wasm` + `Cross-Origin-Resource-Policy: cross-origin` pour `/ocr/*` |
| `frontend/src/auth/authIncidents.ts` | Remplacement du message `AUTH_REDIRECT_RESULT_EMPTY` — plus générique, orienté action |
| `frontend/src/services/ocrService.ts` | `isAssetLoadError()` : détection des `TypeError` réseau (`Failed to fetch`, `NetworkError`, `Load failed`) |
| `frontend/src/services/receiptOcrPipeline.ts` | Ajout de `receiptMode: true` dans l'appel à `runOCR()` |

---

## Pourquoi `Cross-Origin-Resource-Policy: cross-origin` a été ajouté

Le Worker Tesseract.js s'exécute dans un contexte `blob:` (origine différente).
La politique globale `same-site` déjà présente dans `_headers` bloquait les requêtes
`fetch()` du Worker vers :
- `/ocr/tesseract-core.wasm`
- `/ocr/fra.traineddata.gz`

Ces assets sont des fichiers **statiques publics** (WASM compilé + données d'entraînement).
Lever la restriction avec `cross-origin` uniquement sur le préfixe `/ocr/*` est justifié
et sans risque de fuite de données.

---

## Impact exact de `receiptMode: true`

Le pipeline `runOCR()` dans `ocrService.ts` distingue deux modes :

| Étape | Mode normal | Mode ticket (`receiptMode: true`) |
|-------|-------------|-----------------------------------|
| Couleur | couleur native | niveaux de gris |
| Contraste | aucun | `contrast(1.25)` |
| Luminosité | aucune | `brightness(1.05)` |
| Netteté | aucune | noyau de convolution Laplacien 3×3 |
| PSM Tesseract | 3 (auto) | 4 (Single Column) |

Le mode ticket améliore significativement la lisibilité des imprimantes thermiques
(papier blanc mat, encre estompée). Surcoût estimé : ~150–250 ms par image.

---

## Justification du nouveau message d'erreur auth

**Avant :**
```
"Retour Google détecté, mais aucun résultat exploitable. [...]"
```
Problèmes :
- Hardcodé sur "Google" (Facebook, Apple affectés de la même façon)
- Ne donne aucune marche à suivre
- Jargon technique ("résultat exploitable") incompréhensible sur mobile

**Après :**
```
"Connexion interrompue. Si vous utilisez Chrome sur Android, activez les cookies
tiers dans les paramètres, puis réessayez."
```
- Cause racine exacte : blocage des cookies tiers lors du redirect OAuth sur Android
- Action concrète pour l'utilisateur
- Provider-agnostique

---

## Risques de la branche bugfix

| Risque | Probabilité | Mitigation |
|--------|-------------|-----------|
| `cross-origin` sur `/ocr/*` assouplit CORP | Faible | Assets uniquement statiques et publics |
| `receiptMode` augmente le temps de traitement | Certain (~200ms) | Acceptable vs. fiabilité OCR |
| Message d'erreur auth peut ne pas aider sur iOS | Moyen | iOS bloque aussi les popups, message reste valide |

---

## Validations manuelles à faire avant de fusionner

- [ ] Scanner un ticket thermal : vérifier l'absence de `"Erreur OCR (langue fra)"`
- [ ] Scanner un ticket avec 6 photos simultanées : pas de crash Worker
- [ ] Vérifier dans DevTools → Network que `tesseract-core.wasm` se charge (`Content-Type: application/wasm`, `200 OK`)
- [ ] Tenter Google Sign-In sur Android → annuler → message d'erreur générique (pas "Retour Google")
- [ ] Tenter Facebook Sign-In → même message d'erreur (pas hardcodé "Google")
