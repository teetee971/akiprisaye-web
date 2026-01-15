# ✅ Checklist de conformité – Pull Request (API & Observatoire)

Merci de **valider chaque point** avant soumission.
Toute non-conformité peut entraîner le rejet automatique de la PR par la CI.

---

## 🏛️ 1. Conformité institutionnelle (OBLIGATOIRE)

- [ ] API strictement **en lecture seule**
- [ ] Données d'intérêt général uniquement
- [ ] Aucune promesse trompeuse (temps réel, exhaustivité, valeur contractuelle)
- [ ] Périmètre géographique clairement défini
- [ ] Mention d'avertissement public (outil d'information)

---

## 📐 2. Versioning & gouvernance API

- [ ] Version explicite dans l'URL (`/api/v1/...`)
- [ ] `openapi.yaml` mis à jour :
  - [ ] `info.version`
  - [ ] description de la version
- [ ] Aucun breaking change sans nouvelle version majeure
- [ ] Page **API Gouvernance** accessible publiquement
- [ ] Politique de dépréciation documentée

---

## ⚖️ 3. Fair use & rate limiting

- [ ] Rate limit actif (Cloudflare Workers)
- [ ] HTTP `429` correctement géré
- [ ] Headers présents :
  - [ ] `X-RateLimit-Limit`
  - [ ] `X-RateLimit-Remaining`
  - [ ] `X-RateLimit-Reset`
- [ ] Page **Fair Use API** publique
- [ ] Aucun tracking utilisateur (RGPD OK)

---

## 📊 4. Données & crédibilité

- [ ] Sources de données explicitement indiquées
- [ ] Date de dernière mise à jour visible
- [ ] Méthodologie accessible publiquement
- [ ] Données manquantes gérées explicitement
- [ ] Aucun chiffre "placeholder"

---

## 📈 5. Fonctionnalités observatoire

- [ ] Comparaison de territoires fonctionnelle
- [ ] Courbes d'évolution des prix affichées
- [ ] Historique cohérent (pas de trous silencieux)
- [ ] Détection d'anomalies documentée
- [ ] Alertes citoyennes non intrusives

---

## 🔐 6. Sécurité & robustesse

- [ ] Aucune clé secrète exposée
- [ ] Aucun endpoint d'écriture publique
- [ ] CORS maîtrisé
- [ ] Gestion d'erreurs JSON standardisée
- [ ] Protection minimale contre abus

---

## 🔌 7. Open-data & API publique

- [ ] Export JSON fonctionnel
- [ ] Export CSV fonctionnel
- [ ] Licence open-data visible
- [ ] Mention obligatoire de la source
- [ ] API publique lecture seule confirmée

---

## 📘 8. Documentation & UX

- [ ] Swagger UI accessible publiquement
- [ ] OpenAPI valide
- [ ] Page **Comment utiliser l'API**
- [ ] Exemples simples fournis
- [ ] Navigation claire depuis le site

---

## ⚙️ 9. CI / Build / Déploiement

- [ ] `npm ci` OK
- [ ] `npm run build` OK
- [ ] Déploiement Cloudflare Pages OK
- [ ] Aucun warning critique ignoré
- [ ] Pas de boucle de redirection Cloudflare

---

## 🧪 10. Vérification finale manuelle

- [ ] Tous les boutons API sont branchés
- [ ] Aucun module "fantôme"
- [ ] Mobile + desktop testés
- [ ] Observatoire compréhensible sans explication orale
- [ ] Prêt pour usage public / presse / collectivités

---

## 🏁 Statut PR

- [ ] CI verte
- [ ] Checklist complète
- [ ] PR prête pour merge

---

> ⚠️ Rappel :  
> Ce projet est un **outil d'intérêt général**.  
> La stabilité, la clarté et la confiance priment sur la vitesse.
