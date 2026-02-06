# Décision de gouvernance CI & tickets de dette de tests

## Décision (Produit/Gouvernance)
- Le site peut continuer à fonctionner même si la CI est rouge, **mais aucun merge n’est autorisé tant que la santé globale de la CI n’est pas rétablie**.
- Cette décision est de nature produit/gouvernance et indépendante de toute correction technique spécifique.

## Tickets de dette de tests

### 🧪 tests: storeCompanyService flaky
- **Erreur (exacte)** :
  - `AssertionError: expected 28 to be +0 // Object.is equality`
  - `expect(validation.errors.length).toBe(0);`
- **Contexte** :
  - Les données de seed utilisées par `validateStoreCompanyLinks` produisent 28 erreurs de validation en CI.
  - Les tests s’appuient sur les fixtures seed du registre magasins/entreprises.
- **Décision** : **Fix** (aligner les seeds ou les attentes de validation ; vérifier les règles de liaison vs. le dataset seed).

### 🧪 tests: basketPricingService unstable
- **Erreur (exacte)** :
  - `AssertionError: expected undefined to be defined`
  - `expect(result.bestOption.distance).toBeDefined();`
- **Contexte** :
  - `analyzeBasketPricing` avec un `userPosition` ne renseigne pas toujours `distance` dans `bestOption`.
  - Probable lien avec une géolocalisation ou un calcul de distance manquant dans les données/mocks.
- **Décision** : **Fix** (stabiliser le calcul de distance ou ajuster les mocks pour fournir les données nécessaires).

### 🧪 tests: layout assertions outdated
- **Erreur (exacte)** :
  - `TestingLibraryElementError: Unable to find an element with the text: Comparateur.`
  - `expect(screen.getAllByText('Contact').length).toBeGreaterThan(0);`
- **Contexte** :
  - Les libellés de navigation ont évolué (ex. `Comparateurs` vs `Comparateur`) et les liens de footer ont changé.
  - Les tests assertent un texte UI et une structure obsolètes.
- **Décision** : **Fix** (mettre à jour les assertions pour refléter la navigation et le footer actuels).

### 🧪 tests: ToggleAnalyseCiblee / SignalementForm
- **Erreur (exacte)** :
  - `TestingLibraryElementError: Unable to find an element with the text: Mode Analyse Ciblée.`
  - `ReferenceError: UploadPreuve is not defined`
- **Contexte** :
  - `ToggleAnalyseCiblee` affiche désormais un libellé préfixé par un emoji (`🔍 Mode Analyse Ciblée`).
  - `SignalementForm` référence `UploadPreuve` sans import ou mock défini.
- **Décision** : **Fix** (ajuster les matchers de texte ; ajouter ou mocker l’import `UploadPreuve` pour stabiliser les tests).
