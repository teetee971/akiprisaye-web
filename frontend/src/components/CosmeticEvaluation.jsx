/**
 * Composant d'évaluation cosmétique
 * Basé sur les sources officielles : CosIng (EU), ANSES, ECHA, Règlement CE 1223/2009
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  evaluateProduct,
  getCategories,
  getRegulatoryReferences,
  getOfficialDatabases,
  fetchOpenBeautyFacts,
  analyzeHazardCategories,
  HAZARD_CATEGORY_META,
} from '../services/cosmeticEvaluationService';
import { Shield, BookOpen, AlertTriangle, Info, ExternalLink, Search, Loader2, Barcode } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function getRiskLevelColor(level) {
  switch (level) {
    case 'LOW': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-300';
    case 'MODERATE': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300';
    case 'HIGH': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300';
    case 'RESTRICTED': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300';
    case 'PROHIBITED': return 'text-red-800 bg-red-100 dark:bg-red-900/40 dark:text-red-200';
    default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-300';
  }
}

function getRiskLevelLabel(level) {
  switch (level) {
    case 'LOW': return '✅ Sûr';
    case 'MODERATE': return '⚠️ Modéré';
    case 'HIGH': return '🔶 Attention';
    case 'RESTRICTED': return '🚫 Restreint';
    case 'PROHIBITED': return '⛔ Interdit/Très restreint';
    default: return 'Inconnu';
  }
}

function getScoreColor(score) {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreLabel(score) {
  if (score >= 80) return 'Composition favorable';
  if (score >= 60) return 'Composition correcte';
  if (score >= 40) return 'Vigilance recommandée';
  return 'Composition préoccupante';
}

/* ------------------------------------------------------------------ */
/* Composant principal                                                  */
/* ------------------------------------------------------------------ */

export default function CosmeticEvaluation({ initialEan }) {
  const [barcode, setBarcode] = useState(initialEan ?? '');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productBrand, setProductBrand] = useState('');

  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Crème visage');
  const [inciList, setInciList] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [formError, setFormError] = useState('');
  const [showSources, setShowSources] = useState(false);
  const [showRegulations, setShowRegulations] = useState(false);
  const [activeHazardFilter, setActiveHazardFilter] = useState(null);

  const categories = getCategories();
  const regulations = getRegulatoryReferences();
  const databases = getOfficialDatabases();

  /* Auto-load when initialEan is provided (from ?ean= query param) */
  useEffect(() => {
    if (initialEan && initialEan.trim()) {
      handleLoadBarcode(initialEan.trim());
    }
  }, [initialEan]);

  /* ---------------------------------------------------------------- */
  /* Chargement Open Beauty Facts                                       */
  /* ---------------------------------------------------------------- */
  const handleLoadBarcode = async (code) => {
    const target = (code ?? barcode).trim();
    if (!target) return;
    setBarcodeLoading(true);
    setBarcodeError('');
    try {
      const product = await fetchOpenBeautyFacts(target);
      if (!product) {
        setBarcodeError('Produit non trouvé dans la base ouverte (code-barres incorrect ou produit absent).');
        return;
      }
      if (product.productName) setProductName(product.productName);
      if (product.inciList) setInciList(product.inciList);
      if (product.imageUrl) setProductImage(product.imageUrl);
      if (product.brand) setProductBrand(product.brand);
    } catch {
      setBarcodeError('Erreur lors du chargement. Vérifiez votre connexion.');
    } finally {
      setBarcodeLoading(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Évaluation                                                        */
  /* ---------------------------------------------------------------- */
  const handleEvaluate = (e) => {
    e.preventDefault();
    if (!productName.trim() || !inciList.trim()) {
      toast.error('Veuillez renseigner le nom du produit et la liste INCI.');
      return;
    }
    setFormError('');
    setActiveHazardFilter(null);
    const result = evaluateProduct(productName, category, inciList);
    setEvaluation(result);
    setTimeout(() => document.getElementById('cosmetic-results')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  /* ---------------------------------------------------------------- */
  /* Calcul des catégories de danger                                    */
  /* ---------------------------------------------------------------- */
  const hazardSummary = evaluation
    ? analyzeHazardCategories(evaluation.product.ingredients)
    : [];

  /* Filtre ingrédients by hazard category */
  const displayedIngredients = evaluation
    ? (activeHazardFilter
        ? evaluation.product.ingredients.filter(
            (ing) => Array.isArray(ing.hazardCategories) && ing.hazardCategories.includes(activeHazardFilter),
          )
        : evaluation.product.ingredients)
    : [];

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Analyse Cosmétique
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Déchiffrez la composition de vos produits beauté grâce à notre base de données réglementaire
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <BookOpen className="w-4 h-4" />
            <span>Sources : CosIng · ANSES · ECHA · Règlement CE 1223/2009</span>
          </div>
        </div>

        {/* ── Section code-barres ── */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Barcode className="w-5 h-5 text-blue-500" />
            Charger par code-barres (optionnel)
          </h2>
          <div className="flex gap-2">
            <input
              id="barcode-cosmetic-input"
              type="text"
              aria-label="Code-barres produit cosmétique"
              value={barcode}
              onChange={(e) => { setBarcode(e.target.value); setBarcodeError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLoadBarcode()}
              placeholder="Ex : 3600523003396"
              inputMode="numeric"
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono"
            />
            <button
              type="button"
              onClick={() => handleLoadBarcode()}
              disabled={barcodeLoading || !barcode.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {barcodeLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Search className="w-4 h-4" />}
              Charger
            </button>
          </div>
          {barcodeError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{barcodeError}</p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            Scannez ou saisissez un code EAN/UPC pour pré-remplir automatiquement nom et liste INCI depuis la base ouverte des produits cosmétiques.
          </p>

          {/* Aperçu produit chargé */}
          {(productImage || productBrand) && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              {productImage && (
                <img src={productImage} alt="produit" className="w-14 h-14 object-contain rounded bg-white" />
              )}
              <div>
                {productBrand && <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{productBrand}</p>}
                <p className="text-xs text-green-600 dark:text-green-400">✓ Informations chargées — vérifiez et complétez si nécessaire</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Formulaire principal ── */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleEvaluate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cosmetic-nom" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nom du produit
                </label>
                <input
                  id="cosmetic-nom"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex : Crème hydratante visage"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="cosmetic-categorie" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Catégorie
                </label>
                <select
                  id="cosmetic-categorie"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="cosmetic-inci" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Liste INCI — ingrédients séparés par des virgules
              </label>
              <textarea
                id="cosmetic-inci"
                value={inciList}
                onChange={(e) => setInciList(e.target.value)}
                placeholder="Ex : AQUA, GLYCERIN, CETEARYL ALCOHOL, NIACINAMIDE, PARFUM, METHYLPARABEN"
                rows={5}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm"
                required
              />
              <p className="mt-1 text-xs text-slate-400">
                Copiez la liste INCI telle qu'elle figure sur l'emballage du produit.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Analyser la composition
            </button>
            {formError && (
              <p role="alert" className="text-red-600 dark:text-red-400 text-sm mt-2 text-center">
                {formError}
              </p>
            )}
          </form>
        </div>

        {/* ── Résultats ── */}
        {evaluation && (
          <div id="cosmetic-results" className="space-y-6">

            {/* Score global */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Score de composition</h2>
              <div className="flex flex-wrap items-center gap-6">
                <div className="text-center">
                  <div className={`text-6xl font-extrabold ${getScoreColor(evaluation.score)}`}>
                    {evaluation.score}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">/ 100</div>
                </div>
                <div>
                  <p className={`text-xl font-semibold ${getScoreColor(evaluation.score)}`}>
                    {getScoreLabel(evaluation.score)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    <span className="text-green-600">✅ {evaluation.scoreBreakdown.safeIngredients} sûrs</span>
                    <span className="text-yellow-600">⚠️ {evaluation.scoreBreakdown.moderateIngredients} modérés</span>
                    <span className="text-orange-600">🔶 {evaluation.scoreBreakdown.riskIngredients} à surveiller</span>
                    <span className="text-red-600">🚫 {evaluation.scoreBreakdown.restrictedIngredients + evaluation.scoreBreakdown.prohibitedIngredients} restreints/interdits</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Ingrédients préoccupants par catégorie ── */}
            {hazardSummary.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Ingrédients préoccupants détectés
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Classés selon le Règlement CE 1223/2009, les évaluations ANSES et ECHA.
                  Cliquez sur une catégorie pour filtrer la liste des ingrédients.
                </p>

                {/* Badges catégories */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveHazardFilter(null)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      activeHazardFilter === null
                        ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white'
                        : 'border-slate-300 text-slate-600 hover:border-slate-500 dark:border-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Tous ({evaluation.product.ingredients.length})
                  </button>
                  {hazardSummary.map(({ category: cat, ingredients }) => {
                    const meta = HAZARD_CATEGORY_META[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveHazardFilter(activeHazardFilter === cat ? null : cat)}
                        title={meta.description}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          activeHazardFilter === cat
                            ? 'ring-2 ring-offset-1 ' + meta.color
                            : meta.color + ' opacity-90 hover:opacity-100'
                        }`}
                      >
                        {meta.emoji} {meta.label} ({ingredients.length})
                      </button>
                    );
                  })}
                </div>

                {/* Résumé rapide par catégorie */}
                <div className="space-y-2">
                  {hazardSummary.map(({ category: cat, ingredients }) => {
                    const meta = HAZARD_CATEGORY_META[cat];
                    return (
                      <div key={cat} className={`p-3 rounded-lg text-sm ${meta.color}`}>
                        <span className="font-semibold">{meta.emoji} {meta.label} : </span>
                        <span>{ingredients.join(' · ')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Avertissements ── */}
            {evaluation.warnings.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Avertissements</h2>
                <div className="space-y-3">
                  {evaluation.warnings.map((warning) => (
                    <div
                      key={warning.message}
                      className={`p-4 rounded-lg border-l-4 ${
                        warning.level === 'error'
                          ? 'bg-red-50 border-red-500 dark:bg-red-900/20'
                          : warning.level === 'warning'
                          ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20'
                          : 'bg-blue-50 border-blue-500 dark:bg-blue-900/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {warning.level === 'error' || warning.level === 'warning'
                          ? <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${warning.level === 'error' ? 'text-red-600' : 'text-yellow-600'}`} />
                          : <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{warning.message}</p>
                          {warning.ingredients?.length > 0 && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              Ingrédients : {warning.ingredients.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Détail des ingrédients ── */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Détail des ingrédients
                  {activeHazardFilter
                    ? ` — ${HAZARD_CATEGORY_META[activeHazardFilter].emoji} ${HAZARD_CATEGORY_META[activeHazardFilter].label} (${displayedIngredients.length})`
                    : ` (${displayedIngredients.length})`}
                </h2>
                {activeHazardFilter && (
                  <button
                    type="button"
                    onClick={() => setActiveHazardFilter(null)}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    ✕ Effacer le filtre
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {displayedIngredients.length === 0 && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Aucun ingrédient dans cette catégorie pour ce produit.
                  </p>
                )}
                {displayedIngredients.map((ingredient) => (
                  <div
                    key={ingredient.inciName}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Nom + risk level */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{ingredient.inciName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRiskLevelColor(ingredient.riskLevel)}`}>
                        {getRiskLevelLabel(ingredient.riskLevel)}
                      </span>
                      {/* Hazard category badges inline */}
                      {ingredient.hazardCategories?.map((cat) => {
                        const meta = HAZARD_CATEGORY_META[cat];
                        return meta ? (
                          <span key={cat} title={meta.description} className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                            {meta.emoji} {meta.label}
                          </span>
                        ) : null;
                      })}
                    </div>

                    {ingredient.commonName && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{ingredient.commonName}</p>
                    )}

                    {ingredient.function?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {ingredient.function.map((func, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs">
                            {func}
                          </span>
                        ))}
                      </div>
                    )}

                    {(ingredient.casNumber || ingredient.einecs) && (
                      <p className="text-xs text-slate-400 mb-2 font-mono">
                        {ingredient.casNumber && `CAS : ${ingredient.casNumber}`}
                        {ingredient.casNumber && ingredient.einecs && ' · '}
                        {ingredient.einecs && `EINECS : ${ingredient.einecs}`}
                      </p>
                    )}

                    {ingredient.restrictions && (
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border-l-2 border-yellow-400 rounded text-sm text-slate-700 dark:text-slate-300">
                        <strong>Restrictions : </strong>{ingredient.restrictions}
                      </div>
                    )}

                    {ingredient.regulatoryReferences?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ingredient.regulatoryReferences.map((ref, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs">
                            {ref}
                          </span>
                        ))}
                      </div>
                    )}

                    {ingredient.sources?.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {ingredient.sources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {source.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Sources ── */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <button
                type="button"
                onClick={() => setShowSources(!showSources)}
                className="flex items-center justify-between w-full text-left"
              >
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sources officielles utilisées</h2>
                <span className="text-slate-400">{showSources ? '▲' : '▼'}</span>
              </button>
              {showSources && (
                <div className="mt-4 space-y-3">
                  {Object.values(databases).map((db) => (
                    <div key={db.name} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <a href={db.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
                        <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600">{db.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{db.description}</p>
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Références réglementaires ── */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <button
                type="button"
                onClick={() => setShowRegulations(!showRegulations)}
                className="flex items-center justify-between w-full text-left"
              >
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Références réglementaires</h2>
                <span className="text-slate-400">{showRegulations ? '▲' : '▼'}</span>
              </button>
              {showRegulations && (
                <div className="mt-4 space-y-3">
                  {Object.values(regulations).map((reg) => (
                    <div key={reg.name} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <a href={reg.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
                        <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600">{reg.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{reg.description}</p>
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Disclaimer ── */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">Avertissement important</h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{evaluation.disclaimer}</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
