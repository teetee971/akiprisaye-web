import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { useAuth } from "@/context/AuthContext";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { AlertTriangle, MapPin, Package, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroImage } from "@/components/ui/HeroImage";
import { PAGE_HERO_IMAGES } from "@/config/imageAssets";

export default function SignalerAbus() {
  const { user, isGuest } = useAuth();
  const [formData, setFormData] = useState({
    type: "",
    productName: "",
    store: "",
    territory: "",
    commune: "",
    observedPrice: "",
    expectedPrice: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportTypes = [
    { value: "prix_anormal", label: "Prix anormalement élevé" },
    { value: "prix_trompeur", label: "Prix trompeur ou fausse promotion" },
    { value: "etiquetage_manquant", label: "Étiquetage manquant ou incorrect" },
    { value: "rupture_stock", label: "Rupture de stock fréquente" },
    { value: "pratique_commerciale", label: "Pratique commerciale douteuse" },
    { value: "autre", label: "Autre signalement" },
  ];

  const territories = [
    { value: "guadeloupe", label: "🇬🇵 Guadeloupe" },
    { value: "martinique", label: "🇲🇶 Martinique" },
    { value: "guyane", label: "🇬🇫 Guyane" },
    { value: "reunion", label: "🇷🇪 La Réunion" },
    { value: "mayotte", label: "🇾🇹 Mayotte" },
    { value: "saint-martin", label: "🇲🇫 Saint-Martin" },
    { value: "saint-barthelemy", label: "🇧🇱 Saint-Barthélemy" },
    { value: "saint-pierre-miquelon", label: "🇵🇲 Saint-Pierre-et-Miquelon" },
    { value: "wallis-futuna", label: "🇼🇫 Wallis-et-Futuna" },
    { value: "polynesie", label: "🇵🇫 Polynésie française" },
    { value: "nouvelle-caledonie", label: "🇳🇨 Nouvelle-Calédonie" },
    { value: "hexagone", label: "🇫🇷 France métropolitaine" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate form
    if (!formData.type || !formData.store || !formData.territory || !formData.description) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    // Check if user is authenticated
    if (!user || !auth || !auth.currentUser) {
      setError("Vous devez être connecté pour effectuer un signalement.");
      return;
    }

    if (!db) {
      setError("Service non disponible. Veuillez réessayer plus tard.");
      return;
    }

    setLoading(true);

    try {
      // Validate and parse prices
      const observedPriceNum = formData.observedPrice ? parseFloat(formData.observedPrice) : null;
      const expectedPriceNum = formData.expectedPrice ? parseFloat(formData.expectedPrice) : null;
      
      // Check for invalid numbers
      if (observedPriceNum !== null && (isNaN(observedPriceNum) || observedPriceNum < 0)) {
        setError("Le prix observé doit être un nombre positif valide.");
        setLoading(false);
        return;
      }
      
      if (expectedPriceNum !== null && (isNaN(expectedPriceNum) || expectedPriceNum < 0)) {
        setError("Le prix attendu doit être un nombre positif valide.");
        setLoading(false);
        return;
      }

      // Submit to Firestore
      await addDoc(collection(db, "price_abuse_reports"), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        type: formData.type,
        productName: formData.productName.trim() || null,
        store: formData.store.trim(),
        territory: formData.territory,
        commune: formData.commune.trim() || null,
        observedPrice: observedPriceNum,
        expectedPrice: expectedPriceNum,
        description: formData.description.trim(),
        status: "pending", // pending, investigating, resolved, dismissed
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      // Reset form
      setFormData({
        type: "",
        productName: "",
        store: "",
        territory: "",
        commune: "",
        observedPrice: "",
        expectedPrice: "",
        description: "",
      });
    } catch (err: any) {
      console.error("Error submitting report:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Hero banner */}
        <div className="mb-6 animate-fade-in">
          <HeroImage
            src={PAGE_HERO_IMAGES.contribuer}
            alt="Signaler un abus — protection des consommateurs"
            gradient="from-red-950 to-slate-900"
            height="h-36 sm:h-48"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow">
              🚨 Signaler un abus ou un prix anormal
            </h1>
            <p className="text-slate-200 text-sm drop-shadow">
              Aidez à protéger les consommateurs en signalant les pratiques douteuses
            </p>
          </HeroImage>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-400 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-red-200 mb-2">
                Important
              </h3>
              <ul className="space-y-2 text-red-200 text-sm">
                <li>• Les signalements sont vérifiés avant transmission aux autorités</li>
                <li>• Fournissez le maximum de détails pour faciliter l'investigation</li>
                <li>• Les faux signalements peuvent faire l'objet de sanctions</li>
                <li>• En cas d'urgence, contactez directement la DGCCRF ou les autorités locales</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Auth Check */}
        {isGuest ? (
          <div className="bg-slate-900 rounded-2xl p-8 shadow-lg text-center">
            <p className="text-gray-300 mb-4">
              Vous devez être connecté pour effectuer un signalement.
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Se connecter / Créer un compte
            </Link>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-2xl p-6 shadow-lg">
            {success && (
              <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-xl">✅</span>
                  <div>
                    <p className="text-green-200 font-medium mb-1">Signalement enregistré !</p>
                    <p className="text-green-200 text-sm">
                      Votre signalement sera examiné dans les meilleurs délais. Nous vous
                      tiendrons informé de son traitement.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-xl">❌</span>
                  <p className="text-red-200">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Report Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
                  <FileText className="inline mr-2" size={16} />
                  Type de signalement <span className="text-red-400">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Sélectionnez un type --</option>
                  {reportTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Name */}
              <div>
                <label htmlFor="productName" className="block text-sm font-medium text-gray-300 mb-2">
                  <Package className="inline mr-2" size={16} />
                  Nom du produit (si applicable)
                </label>
                <input
                  type="text"
                  id="productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  placeholder="Ex: Lait demi-écrémé 1L"
                  className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Store */}
              <div>
                <label htmlFor="store" className="block text-sm font-medium text-gray-300 mb-2">
                  Enseigne / Magasin <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="store"
                  name="store"
                  value={formData.store}
                  onChange={handleChange}
                  placeholder="Ex: Carrefour, Leader Price, Super U..."
                  required
                  className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Territory */}
              <div>
                <label htmlFor="territory" className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="inline mr-2" size={16} />
                  Territoire <span className="text-red-400">*</span>
                </label>
                <select
                  id="territory"
                  name="territory"
                  value={formData.territory}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Sélectionnez un territoire --</option>
                  {territories.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Commune */}
              <div>
                <label htmlFor="commune" className="block text-sm font-medium text-gray-300 mb-2">
                  Commune / Ville
                </label>
                <input
                  type="text"
                  id="commune"
                  name="commune"
                  value={formData.commune}
                  onChange={handleChange}
                  placeholder="Ex: Pointe-à-Pitre, Fort-de-France..."
                  className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Observed Price */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="observedPrice" className="block text-sm font-medium text-gray-300 mb-2">
                    Prix observé (€)
                  </label>
                  <input
                    type="number"
                    id="observedPrice"
                    name="observedPrice"
                    value={formData.observedPrice}
                    onChange={handleChange}
                    placeholder="Ex: 5.99"
                    step="0.01"
                    min="0"
                    className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="expectedPrice" className="block text-sm font-medium text-gray-300 mb-2">
                    Prix attendu / habituel (€)
                  </label>
                  <input
                    type="number"
                    id="expectedPrice"
                    name="expectedPrice"
                    value={formData.expectedPrice}
                    onChange={handleChange}
                    placeholder="Ex: 3.50"
                    step="0.01"
                    min="0"
                    className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description détaillée <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez en détail la situation : dates, circonstances, preuves à l'appui..."
                  rows={5}
                  required
                  className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Plus votre description est détaillée, mieux nous pourrons traiter votre signalement
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {loading ? "Envoi en cours..." : "Envoyer le signalement"}
              </Button>
            </form>

            {/* Disclaimer */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-gray-400">
                Les signalements sont traités de manière confidentielle et peuvent être transmis
                aux autorités compétentes (DGCCRF, DAAF) si nécessaire. Vos coordonnées ne seront
                communiquées qu'en cas d'enquête officielle.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
