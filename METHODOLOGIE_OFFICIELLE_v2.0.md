# Méthodologie Officielle - A KI PRI SA YÉ

**Plateforme citoyenne de transparence des prix**

Version 2.0.0 - Décembre 2025

---

## Principe Fondamental

**A KI PRI SA YÉ est une plateforme citoyenne de transparence des prix.**

Elle repose **exclusivement** sur des données publiques officielles.

---

## Sources Utilisées

### Sources Obligatoires

1. **INSEE** (Institut national de la statistique et des études économiques)
   - Indice des prix à la consommation (IPC)
   - Différentiels territoriaux
   - Revenus médians
   - Dépenses contraintes
   - https://www.insee.fr

2. **OPMR** (Observatoires des Prix, des Marges et des Revenus)
   - Guadeloupe
   - Martinique
   - Guyane
   - La Réunion
   - Mayotte
   - Paniers de consommation
   - Comparaisons DOM / Hexagone
   - Évolution des prix
   - Rapports PDF officiels

3. **DGCCRF** (Direction générale de la concurrence, de la consommation et de la répression des fraudes)
   - Études sectorielles
   - Rapports "vie chère"
   - Contrôles prix / marges (données agrégées)
   - https://www.economie.gouv.fr/dgccrf

4. **Revenus de Référence**
   - **SMIC net** - Ministère du Travail
   - **RSA** - Caisse d'Allocations Familiales (CAF)
   - **ASPA** - Minimum vieillesse
   - https://www.service-public.fr
   - https://www.caf.fr

---

## Règles Absolues

### Ce que nous faisons

✅ **Utilisons uniquement des données officielles publiées**

✅ **Affichons les valeurs telles que publiées**

✅ **Indiquons systématiquement la source, la date et le lien**

✅ **Signalons les données manquantes clairement**

### Ce que nous ne faisons JAMAIS

❌ **Aucune donnée simulée**

❌ **Aucune extrapolation**

❌ **Aucune estimation interne**

❌ **Aucun calcul si donnée manquante**

❌ **Aucune pondération inventée**

❌ **Aucune réinterprétation**

---

## Traitement des Données

### Extraction

Les données sont extraites directement des publications officielles (PDF, CSV, API).

**Processus :**
1. Téléchargement du document source
2. Extraction des valeurs exactes (sans transformation)
3. Conservation des métadonnées (date, source, page, contexte)
4. Structuration en JSON avec traçabilité complète

### Affichage

Toute valeur affichée est accompagnée :
- De sa **source officielle**
- De sa **date de publication**
- D'un **lien vers le document source**
- Du **contexte** (page, tableau, note éventuelle)

### Données Manquantes

Si une donnée n'est pas disponible pour un territoire ou une période :

**Affichage :**
```
⚠️ Donnée non disponible
Source officielle requise
```

**Nous n'affichons PAS :**
- De valeur estimée
- De moyenne approximative
- De calcul par défaut

---

## IEVR - Indice d'Écart de Vie Réelle

### Nature de l'Indicateur

L'IEVR est un **indicateur d'observation**, pas un modèle prédictif.

### Sources de Calcul

L'IEVR est basé **UNIQUEMENT** sur :
- **IPC INSEE** par territoire
- **Paniers de consommation OPMR**
- **Rapports officiels DGCCRF**

### Méthodologie

**SI** toutes les composantes officielles sont disponibles :
- → Calcul de l'indice selon la méthodologie versionnée
- → Affichage avec source de chaque composante

**SI** une composante est manquante :
- → **PAS de score global**
- → Affichage partiel des composantes disponibles + sources
- → Message clair sur les données manquantes

**Priorité : Crédibilité > Score complet**

---

## Neutralité

### Principes

A KI PRI SA YÉ :

✅ **Ne désigne aucun responsable**

✅ **Ne compare pas d'enseignes nominativement**

✅ **Ne porte aucun jugement**

✅ **Présente des faits chiffrés**

✅ **Cite ses sources**

### Langage

- Factuel
- Neutre
- Vérifiable
- Non accusatoire

---

## Transparence

### Code Source

Le code source de la plateforme est public et auditable.

### Méthodologie

La méthodologie de calcul de chaque indicateur est :
- Documentée
- Versionnée
- Publique
- Reproductible

### Données

Chaque donnée peut être tracée jusqu'à sa source officielle.

---

## Auditabilité

### Traçabilité

Chaque valeur affichée peut être vérifiée :
1. Identifier la source citée
2. Accéder au document source (lien fourni)
3. Vérifier la valeur exacte
4. Comparer avec l'affichage

### Reproductibilité

Les calculs effectués sont :
- Documentés dans le code
- Basés sur des formules publiques
- Vérifiables manuellement

---

## Mise à Jour des Données

### Fréquence

Les données sont mises à jour :
- Dès publication d'une nouvelle source officielle
- Sans modification rétroactive (append-only)
- Avec historisation des versions

### Notification

Toute mise à jour majeure est :
- Datée
- Documentée
- Annoncée aux utilisateurs

---

## Limitations Assumées

### Périmètre

Si une donnée officielle n'existe pas :
- Nous ne l'inventons pas
- Nous signalons son absence
- Nous suggérons les sources potentielles

### Délais

Les données officielles ont des délais de publication :
- Nous les respectons
- Nous n'anticipons pas
- Nous indiquons la dernière mise à jour

### Exhaustivité

Nous privilégions :
- La qualité sur la quantité
- La fiabilité sur l'exhaustivité
- La crédibilité sur la rapidité

---

## Engagement

**A KI PRI SA YÉ s'engage à :**

1. N'utiliser **que** des sources officielles
2. Ne **jamais** inventer de données
3. Signaler **clairement** les données manquantes
4. Citer **systématiquement** les sources
5. Être **totalement transparent** sur la méthodologie
6. Rester **absolument neutre**

---

## Contact

Pour toute question sur la méthodologie ou les sources de données :

**Email :** contact@akiprisaye.fr  
**Documentation :** https://akiprisaye.fr/methodologie

---

**Document officiel**  
**Version :** 2.0.0  
**Date :** Décembre 2025  
**Licence :** Creative Commons BY-SA 4.0

**Ce document est public, partageable et peut être cité comme référence.**
