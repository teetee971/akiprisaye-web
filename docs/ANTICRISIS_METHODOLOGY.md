# Panier Anti-Crise - Méthodologie et Transparence

**Version:** 1.0.0  
**Date:** 2026-01-12

## 🎯 Objectif

Le **Panier Anti-Crise** identifie les produits structurellement les moins chers dans le temps, basé uniquement sur l'historique réel des prix observés, **sans promotions ponctuelles**.

### Question utilisateur

> *« Quels produits sont durablement les moins chers dans le temps, et non ponctuellement ? »*

---

## 📋 Principes Fondamentaux

### ✅ Ce que nous faisons
- Analyse de l'historique réel des prix observés
- Identification des produits stables et durablement moins chers
- Calculs transparents et auditables
- Données publiques uniquement

### ❌ Ce que nous NE faisons PAS
- ❌ Aucune logique de promotion ou réduction
- ❌ Aucun scoring marketing ou pondération opaque
- ❌ Aucun bouton d'achat, lien externe ou CTA
- ❌ Aucune dépendance externe
- ❌ **Aucune comparaison inter-territoires**

---

## 🔬 Méthodologie de Sélection

Un produit est éligible au **Panier Anti-Crise** s'il respecte **TOUS** les critères suivants:

### 1. Nombre d'observations suffisant
- **Minimum:** 5 observations distinctes
- **Pourquoi:** Garantir une base de données statistiquement significative

### 2. Enseigne durablement la moins chère
- **Seuil:** L'enseigne doit être la moins chère ≥ 70% du temps
- **Calcul:** (Nombre de fois moins cher / Nombre total d'observations) × 100
- **Pourquoi:** Exclure les enseignes ponctuellement moins chères

### 3. Variance de prix faible (stabilité)
- **Critère:** Coefficient de variation < 15%
- **Calcul:** (Écart-type / Prix moyen) × 100
- **Pourquoi:** Exclure les produits avec promotions ponctuelles ou prix instables

### 4. Écart significatif avec le 2ᵉ prix
- **Seuil:** Écart ≥ 5% par rapport au 2ᵉ prix moyen
- **Calcul:** ((Prix 2ᵉ - Prix 1er) / Prix 2ᵉ) × 100
- **Pourquoi:** S'assurer d'un avantage prix réel et durable

### 5. Données récentes disponibles
- **Seuil:** Dernière observation < 90 jours
- **Pourquoi:** Éviter les produits en rupture ou discontinués

---

## ⚠️ Avertissement

**Le Panier Anti-Crise regroupe des produits dont les prix observés sont durablement bas dans le temps, hors promotions ponctuelles.**

**Les résultats sont basés sur des données publiques et peuvent évoluer.**

---

**Dernière mise à jour:** 2026-01-12  
**Version méthodologie:** 1.0.0
