 
 
// src/pages/ContribuerPrix.tsx
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Camera, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContribuerPrix() {
  const { user, isGuest } = useAuth();
  const [formData, setFormData] = useState({
    productName: "",
    ean: "",
    price: "",
    store: "",
    territory: "",
    commune: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!formData.productName || !formData.price || !formData.store || !formData.territory) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    // Validate price
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Le prix doit être un nombre positif.");
      return;
    }

    // Check if user is authenticated
    if (!user || !auth || !auth.currentUser) {
      setError("Vous devez être connecté pour contribuer.");
      return;
    }

    if (!db) {
      setError("Service non disponible. Veuillez réessayer plus tard.");
      return;
    }

    setLoading(true);

    try {
      // Submit to Firestore
      await addDoc(collection(db, "price_contributions"), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        productName: formData.productName.trim(),
        ean: formData.ean.trim() || null,
        price: priceNum,
        store: formData.store.trim(),
        territory: formData.territory,
        commune: formData.commune.trim() || null,
        notes: formData.notes.trim() || null,
        status: "pending", // pending, validated, rejected
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      // Reset form
      setFormData({
        productName: "",
        ean: "",
        price: "",
        store: "",
        territory: "",
        commune: "",
        notes: "",
      });
    } catch (err: any) {
      console.error("Error submitting price:", err);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🤝 Contribuer aux données de prix
          </h1>
          <p className="text-xl text-gray-300">
            Aidez la communauté en partageant les prix que vous observez
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-200 mb-2">
            Pourquoi contribuer ?
          </h3>
          <ul className="space-y-2 text-blue-200 text-sm">
            <li>• Améliorer la transparence des prix dans votre territoire</li>
            <li>• Aider d'autres citoyens à mieux comparer</li>
            <li>• Créer une base de données citoyenne fiable</li>
            <li>• Contribuer à la lutte contre la vie chère</li>
          </ul>
        </div>

        {/* Auth Check */}
        {isGuest ? (
          <div className="bg-slate-900 rounded-2xl p-8 shadow-lg text-center">
            <p className="text-gray-300 mb-4">
              Vous devez être connecté pour contribuer aux données de prix.
            </p>
            <a
              href="/login"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Se connecter / Créer un compte
            </a>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-2xl p-6 shadow-lg">
            {success && (
              <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-xl">✅</span>
                  <div>
                    <p className="text-green-200 font-medium mb-1">Merci pour votre contribution !</p>
                    <p className="text-green-200 text-sm">
                      Votre relevé de prix sera vérifié et publié sous peu. Vous pouvez soumettre
                      d'autres prix si vous le souhaitez.
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
              {/* Product Name */}
              <div>
                <label htmlFor="productName" className="block text-sm font-medium text-gray-300 mb-2">
                  <Package className="inline mr-2" size={16} />
                  Nom du produit <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  placeholder="Ex: Lait demi-écrémé 1L"
                  required
                  className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* EAN (optional) */}
              <div>
                <label htmlFor="ean" className="block text-sm font-medium text-gray-300 mb-2">
                  <Camera className="inline mr-2" size={16} />
                  Code-barres (EAN)
                </label>
                <input
                  type="text"
                  id="ean"
                  name="ean"
                  value={formData.ean}
                  onChange={handleChange}
                  placeholder="Ex: 3760123456789"
                  className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Facultatif - Vous pouvez scanner le code-barres ou le saisir manuellement
                </p>
              </div>

              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
                  Prix observé (€) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Ex: 2.95"
                  step="0.01"
                  min="0"
                  required
                  className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Store */}
              <div>
                <label htmlFor="store" className="block text-sm font-medium text-gray-300 mb-2">
                  Enseigne <span className="text-red-400">*</span>
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
                  Commune
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

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
                  Remarques (optionnel)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Ex: Prix en promotion, format familial..."
                  rows={3}
                  className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {loading ? "Envoi en cours..." : "Soumettre le relevé de prix"}
              </Button>
            </form>

            {/* Disclaimer */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-gray-400">
                En soumettant ce formulaire, vous acceptez que vos données soient utilisées pour
                améliorer la transparence des prix. Seules les informations du produit seront
                rendues publiques, votre identité reste confidentielle.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
