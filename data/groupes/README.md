# Guide d'utilisation — data/groupes

But: Ce document explique la logique éditoriale qui s'applique à tous les fichiers JSON situés dans `data/groupes` et donne des règles de validation et d'utilisation pour le comparateur "A KI PRI SA YÉ".

Principes éditoriaux

- Neutralité et contextualisation : le comparateur présente des systèmes et des tendances, il ne classe pas de "gagnants" ou de "perdants".
- Multi-acteurs obligatoires : chaque vue doit présenter plusieurs groupes (au moins 3 si disponibles) et toujours inclure la catégorie "Indépendants" comme référence.
- Pas d'attaques nominatives : les libellés doivent rester factuels et quantitatifs (ex. "écart_moyen"), et l'interface doit éviter tout ton accusatoire.
- Lisibilité : utiliser des champs stables (voir le schéma JSON) et des jeux de données homogènes (même unité pour `ecart_moyen`).
- Mise à jour et traçabilité : quand un fichier est modifié, indiquer la source des données et la date dans le commit ou la documentation métier.

Format attendu (rappels)

- Chaque fichier contient une liste JSON d'objets. Exemple d'objet :

```
{
  "groupe": "Nom du groupe",
  "indice": "🔴|🟠|🟢",
  "ecart_moyen": "+12%",
  "territoires": ["Guadeloupe","Martinique"]
}
```

- Champ `indice` : pictogramme synthétique d'écart (rouge/orange/vert). L'interface est libre d'afficher une alternative textuelle pour l'accessibilité.
- Champ `ecart_moyen` : chaîne indiquant un pourcentage moyen d'écart, conserver le signe + / - et le symbole `%`.
- Champ `territoires` : tableau de chaînes listant les territoires concernés.

Validation

- Un schéma JSON est fourni (`schema.json`) pour automatiser la validation avant intégration.

Responsabilité juridique

- Le comparateur analyse des systèmes et non des comportements individuels. Respectez la neutralité factuelle et conservez toutes les preuves ou sources en cas de question juridique.

---

Fin du document.
